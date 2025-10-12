/**
 * Database Utilities for StudyMaster AI
 * 
 * This module provides utility functions for database operations,
 * data validation, and auto-increment functionality.
 */

import { Db, Collection, ObjectId, Document } from 'mongodb';
import clientPromise from './mongodb';

export interface User {
  _id?: ObjectId;
  username: string;
  email: string;
  password: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
  };
  progress?: {
    level: number;
    points: number;
    streak: number;
    totalStudyTime: number;
    lastStudyDate: Date;
    dailyGoal: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface StudySession {
  _id?: ObjectId;
  user: ObjectId;
  title: string;
  pdfUrl?: string;
  pdfContent?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'paused';
  studyTime: number;
  quizScore: number;
  totalQuestions: number;
  pointsEarned: number;
  coinsUsed: number;
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
  createdAt: Date;
  updatedAt?: Date;
  completedAt?: Date;
}

export interface Quiz {
  _id?: ObjectId;
  sessionId: ObjectId;
  user: ObjectId;
  title: string;
  questions: QuizQuestion[];
  totalQuestions: number;
  timeLimit: number;
  createdAt: Date;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

export interface QuizResult {
  _id?: ObjectId;
  user: ObjectId;
  quizId: ObjectId;
  sessionId: ObjectId;
  answers: QuizAnswer[];
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  pointsEarned: number;
  createdAt: Date;
}

export interface QuizAnswer {
  questionIndex: number;
  selectedAnswer: number;
  isCorrect: boolean;
  timeSpent: number;
}

export interface Badge {
  _id?: ObjectId;
  name: string;
  description: string;
  icon: string;
  criteria: {
    type: 'points' | 'streak' | 'quizzes' | 'sessions' | 'score' | 'time';
    value: number;
    condition: string;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  pointsReward: number;
  isActive: boolean;
}

export interface UserBadge {
  _id?: ObjectId;
  user: ObjectId;
  badge: ObjectId;
  earnedAt: Date;
  progress: number;
}

/**
 * Get database instance
 */
export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db('studymaster');
}

/**
 * Get a specific collection with type safety
 */
export async function getCollection<T extends Document>(collectionName: string): Promise<Collection<T>> {
  const db = await getDb();
  return db.collection<T>(collectionName);
}

/**
 * Update user progress and handle level calculations
 */
export async function updateUserProgress(
  userId: ObjectId, 
  pointsToAdd: number, 
  studyTimeToAdd: number = 0
): Promise<void> {
  const users = await getCollection<User>('users');
  
  const user = await users.findOne({ _id: userId });
  if (!user) {
    throw new Error('User not found');
  }

  const currentPoints = user.progress?.points || 0;

  const currentStudyTime = user.progress?.totalStudyTime || 0;
  const currentStreak = user.progress?.streak || 0;
  
  const newPoints = currentPoints + pointsToAdd;
  const newStudyTime = currentStudyTime + studyTimeToAdd;
  
  // Calculate new level (every 100 points = 1 level)
  const newLevel = Math.floor(newPoints / 100) + 1;
  
  // Update streak logic
  const today = new Date();
  const lastStudyDate = user.progress?.lastStudyDate;
  let newStreak = currentStreak;
  
  if (lastStudyDate) {
    const daysDiff = Math.floor((today.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff === 1) {
      newStreak += 1; // Continue streak
    } else if (daysDiff > 1) {
      newStreak = 1; // Reset streak
    }
    // If daysDiff === 0, keep current streak (same day)
  } else {
    newStreak = 1; // First study session
  }

  await users.updateOne(
    { _id: userId },
    {
      $set: {
        'progress.points': newPoints,
        'progress.level': newLevel,
        'progress.totalStudyTime': newStudyTime,
        'progress.streak': newStreak,
        'progress.lastStudyDate': today,
        updatedAt: today
      }
    }
  );

  // Check for badge eligibility
  await checkAndAwardBadges(userId, {
    points: newPoints,
    level: newLevel,
    streak: newStreak,
    totalStudyTime: newStudyTime
  });
}

/**
 * Create a new study session
 */
export async function createStudySession(sessionData: Omit<StudySession, '_id' | 'createdAt' | 'updatedAt'>): Promise<ObjectId> {
  const sessions = await getCollection<StudySession>('studySessions');
  
  const newSession: StudySession = {
    ...sessionData,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await sessions.insertOne(newSession);
  return result.insertedId;
}

/**
 * Update study session status and metrics
 */
export async function updateStudySession(
  sessionId: ObjectId, 
  updates: Partial<StudySession>
): Promise<void> {
  const sessions = await getCollection<StudySession>('studySessions');
  
  const updateData = {
    ...updates,
    updatedAt: new Date()
  };

  if (updates.status === 'completed' && !updates.completedAt) {
    updateData.completedAt = new Date();
  }

  await sessions.updateOne(
    { _id: sessionId },
    { $set: updateData }
  );

  // If session is completed, update user progress
  if (updates.status === 'completed' && updates.pointsEarned) {
    const session = await sessions.findOne({ _id: sessionId });
    if (session) {
      await updateUserProgress(session.user, updates.pointsEarned, updates.studyTime || 0);
    }
  }
}

/**
 * Create a quiz for a study session
 */
export async function createQuiz(quizData: Omit<Quiz, '_id' | 'createdAt'>): Promise<ObjectId> {
  const quizzes = await getCollection<Quiz>('quizzes');
  
  const newQuiz: Quiz = {
    ...quizData,
    createdAt: new Date()
  };

  const result = await quizzes.insertOne(newQuiz);
  return result.insertedId;
}

/**
 * Submit quiz results and calculate score
 */
export async function submitQuizResult(resultData: Omit<QuizResult, '_id' | 'createdAt' | 'score' | 'correctAnswers' | 'pointsEarned'>): Promise<ObjectId> {
  const quizResults = await getCollection<QuizResult>('quizResults');
  
  // Calculate score and correct answers
  const correctAnswers = resultData.answers.filter(answer => answer.isCorrect).length;
  const score = (correctAnswers / resultData.totalQuestions) * 100;
  
  // Calculate points based on score
  let pointsEarned = 0;
  if (score >= 90) pointsEarned = 100;
  else if (score >= 80) pointsEarned = 80;
  else if (score >= 70) pointsEarned = 60;
  else if (score >= 60) pointsEarned = 40;
  else pointsEarned = 20;

  const newResult: QuizResult = {
    ...resultData,
    score,
    correctAnswers,
    pointsEarned,
    createdAt: new Date()
  };

  const result = await quizResults.insertOne(newResult);

  // Update user progress
  await updateUserProgress(resultData.user, pointsEarned);

  // Update session with quiz score
  await updateStudySession(resultData.sessionId, {
    quizScore: score,
    pointsEarned: pointsEarned
  });

  return result.insertedId;
}

/**
 * Check and award badges based on user progress
 */
export async function checkAndAwardBadges(
  userId: ObjectId, 
  progress: { points: number; level: number; streak: number; totalStudyTime: number }
): Promise<void> {
  const badges = await getCollection<Badge>('badges');
  const userBadges = await getCollection<UserBadge>('userBadges');
  
  // Get all active badges
  const allBadges = await badges.find({ isActive: true }).toArray();
  
  // Get user's current badges
  const currentBadges = await userBadges.find({ user: userId }).toArray();
  const currentBadgeIds = currentBadges.map(ub => ub.badge.toString());

  for (const badge of allBadges) {
    // Skip if user already has this badge
    if (currentBadgeIds.includes(badge._id!.toString())) {
      continue;
    }

    let eligible = false;

    // Check badge criteria
    switch (badge.criteria.type) {
      case 'points':
        eligible = progress.points >= badge.criteria.value;
        break;
      case 'streak':
        eligible = progress.streak >= badge.criteria.value;
        break;
      case 'time':
        eligible = progress.totalStudyTime >= badge.criteria.value;
        break;
      // Add more criteria types as needed
    }

    if (eligible) {
      // Award the badge
      await userBadges.insertOne({
        user: userId,
        badge: badge._id!,
        earnedAt: new Date(),
        progress: 100
      });

      // Award bonus points
      if (badge.pointsReward > 0) {
        const users = await getCollection<User>('users');
        await users.updateOne(
          { _id: userId },
          { 
            $inc: { 'progress.points': badge.pointsReward },
            $set: { updatedAt: new Date() }
          }
        );
      }

      // Badge awarded successfully
    }
  }
}

/**
 * Get user statistics
 */
export async function getUserStats(userId: ObjectId): Promise<any> {
  const sessions = await getCollection<StudySession>('studySessions');
  const quizResults = await getCollection<QuizResult>('quizResults');
  const userBadges = await getCollection<UserBadge>('userBadges');

  const [
    totalSessions,
    completedSessions,
    totalQuizzes,
    avgScore,
    totalBadges
  ] = await Promise.all([
    sessions.countDocuments({ user: userId }),
    sessions.countDocuments({ user: userId, status: 'completed' }),
    quizResults.countDocuments({ user: userId }),
    quizResults.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, avgScore: { $avg: '$score' } } }
    ]).toArray(),
    userBadges.countDocuments({ user: userId })
  ]);

  return {
    totalSessions,
    completedSessions,
    totalQuizzes,
    averageScore: avgScore[0]?.avgScore || 0,
    totalBadges
  };
}

/**
 * Get recent activity for a user
 */
export async function getRecentActivity(userId: ObjectId, limit: number = 10): Promise<any[]> {
  const sessions = await getCollection<StudySession>('studySessions');
  const quizResults = await getCollection<QuizResult>('quizResults');

  const recentSessions = await sessions
    .find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  const recentQuizzes = await quizResults
    .find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  // Combine and sort by date
  const activities = [
    ...recentSessions.map(s => ({ type: 'session', data: s, date: s.createdAt })),
    ...recentQuizzes.map(q => ({ type: 'quiz', data: q, date: q.createdAt }))
  ];

  return activities
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);
}