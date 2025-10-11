/**
 * Gamification Service
 * 
 * This service handles all gamification logic according to the application requirements:
 * - User stats management (badges, achievements, quests, challenges)
 * - Power-ups with time-based activation
 * - Progress tracking and level calculation
 * - Daily goals and streak management
 */

import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Interfaces matching the new schema
export interface UserStats {
  _id?: ObjectId;
  userId: ObjectId;
  level: number;
  points: number;
  streak: number;
  quizAccuracy: number;
  dailyGoal: number; // 500 points per day
  totalStudyTime: number;
  lastStudyDate?: Date;
  badges: Badge[];
  achievements: Achievement[];
  quests: Quest[];
  challenges: Challenge[];
  powerUps: PowerUp[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: Date;
  points: number;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  target: number;
  reward: number;
  completed: boolean;
  completedAt?: Date;
  category: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  progress: number;
  target: number;
  active: boolean;
  startedAt?: Date;
  completedAt?: Date;
}

export interface PowerUp {
  id: string;
  name: string;
  type: 'points' | 'time' | 'streak';
  multiplier: number;
  duration: number; // in minutes (60 minutes = 1 hour)
  active: boolean;
  activatedAt?: Date;
  expiresAt?: Date;
}

export interface Task {
  _id?: ObjectId;
  userId: ObjectId;
  sessionId: string;
  title: string;
  pdfUrl?: string;
  pdfContent?: string;
  pdfData?: any;
  status: 'pending' | 'in-progress' | 'completed' | 'paused';
  studyTime: number;
  pointsEarned: number;
  createdAt: Date;
  updatedAt?: Date;
  completedAt?: Date;
}

export interface QuizData {
  _id?: ObjectId;
  sessionId: string;
  userId: ObjectId;
  questions: QuizQuestion[];
  answers?: QuizAnswer[];
  score?: number;
  totalQuestions: number;
  correctAnswers?: number;
  timeSpent?: number;
  pointsEarned?: number;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

export interface QuizAnswer {
  questionIndex: number;
  selectedAnswer: number;
  isCorrect: boolean;
  timeSpent: number;
}

export class GamificationService {
  
  /**
   * Initialize user stats for a new user
   */
  static async initializeUserStats(userId: ObjectId): Promise<void> {
    const db = await getDatabase();
    const userStats = db.collection<UserStats>('userstats');
    
    const defaultStats: UserStats = {
      userId,
      level: 1,
      points: 0,
      streak: 0,
      quizAccuracy: 0,
      dailyGoal: 500, // 500 points per day
      totalStudyTime: 0,
      badges: this.getDefaultBadges(),
      achievements: this.getDefaultAchievements(),
      quests: this.getDefaultQuests(),
      challenges: [],
      powerUps: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await userStats.insertOne(defaultStats);
  }

  /**
   * Get user stats
   */
  static async getUserStats(userId: ObjectId): Promise<UserStats | null> {
    const db = await getDatabase();
    const userStats = db.collection<UserStats>('userstats');
    return await userStats.findOne({ userId });
  }

  /**
   * Update user progress and handle all gamification logic
   */
  static async updateUserProgress(
    userId: ObjectId, 
    pointsToAdd: number, 
    studyTimeToAdd: number = 0,
    quizScore?: number
  ): Promise<void> {
    const db = await getDatabase();
    const userStats = db.collection<UserStats>('userstats');
    
    const stats = await userStats.findOne({ userId });
    if (!stats) {
      await this.initializeUserStats(userId);
      return this.updateUserProgress(userId, pointsToAdd, studyTimeToAdd, quizScore);
    }

    // Check for active power-ups
    const activePowerUps = stats.powerUps.filter(p => p.active && p.expiresAt && p.expiresAt > new Date());
    let pointsMultiplier = 1;
    
    // Apply points power-up
    const pointsPowerUp = activePowerUps.find(p => p.type === 'points');
    if (pointsPowerUp) {
      pointsMultiplier = pointsPowerUp.multiplier;
    }

    const finalPoints = Math.floor(pointsToAdd * pointsMultiplier);
    const newPoints = stats.points + finalPoints;
    const newStudyTime = stats.totalStudyTime + studyTimeToAdd;
    
    // Calculate level based on points and completed tasks/quests
    const newLevel = this.calculateLevel(newPoints, stats.quests);
    
    // Update streak logic
    const today = new Date();
    const lastStudyDate = stats.lastStudyDate;
    let newStreak = stats.streak;
    
    if (lastStudyDate) {
      const daysDiff = Math.floor((today.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        newStreak += 1; // Continue streak
      } else if (daysDiff > 1) {
        newStreak = 1; // Reset streak
      }
    } else {
      newStreak = 1; // First study session
    }

    // Update quiz accuracy
    let newQuizAccuracy = stats.quizAccuracy;
    if (quizScore !== undefined) {
      // Calculate running average
      const totalQuizzes = await this.getTotalQuizzes(userId);
      newQuizAccuracy = ((stats.quizAccuracy * (totalQuizzes - 1)) + quizScore) / totalQuizzes;
    }

    // Check daily goal progress
    const dailyGoalMet = this.checkDailyGoal(stats, finalPoints);

    // Update user stats
    const updatedStats = {
      ...stats,
      points: newPoints,
      level: newLevel,
      streak: newStreak,
      quizAccuracy: newQuizAccuracy,
      totalStudyTime: newStudyTime,
      lastStudyDate: today,
      updatedAt: new Date()
    };

    // Check and update badges
    updatedStats.badges = await this.checkAndUpdateBadges(updatedStats);
    
    // Check and update achievements
    updatedStats.achievements = await this.checkAndUpdateAchievements(updatedStats);
    
    // Update quest progress
    updatedStats.quests = await this.updateQuestProgress(updatedStats, {
      studyTime: studyTimeToAdd,
      points: finalPoints,
      quizCompleted: quizScore !== undefined,
      dailyGoalMet
    });

    // Deactivate expired power-ups
    updatedStats.powerUps = this.deactivateExpiredPowerUps(stats.powerUps);

    await userStats.updateOne(
      { userId },
      { $set: updatedStats }
    );

    // Update user's total points
    await this.updateUserTotalPoints(userId, newPoints);
  }

  /**
   * Calculate level based on points and completed quests/tasks
   */
  private static calculateLevel(points: number, quests: Quest[]): number {
    const completedQuests = quests.filter(q => q.completed).length;
    
    // Base level from points (every 100 points = 1 level)
    const pointsLevel = Math.floor(points / 100);
    
    // Bonus levels from completed quests (every 2 quests = 1 bonus level)
    const questBonus = Math.floor(completedQuests / 2);
    
    return Math.max(1, pointsLevel + questBonus);
  }

  /**
   * Check daily goal (500 points per day)
   */
  private static checkDailyGoal(stats: UserStats, pointsAdded: number): boolean {
    const today = new Date();
    const lastStudyDate = stats.lastStudyDate;
    
    if (!lastStudyDate || lastStudyDate.toDateString() !== today.toDateString()) {
      // New day, check if we reached the goal with today's points
      return pointsAdded >= stats.dailyGoal;
    } else {
      // Same day, check total points for today
      // This would require tracking daily points separately
      // For now, assume goal is met if we add significant points
      return pointsAdded >= 100; // Simplified check
    }
  }

  /**
   * Update quest progress based on user actions
   */
  private static async updateQuestProgress(
    stats: UserStats, 
    actions: {
      studyTime?: number;
      points?: number;
      quizCompleted?: boolean;
      aiQuestionsAsked?: number;
      dailyGoalMet?: boolean;
    }
  ): Promise<Quest[]> {
    const updatedQuests = [...stats.quests];

    for (let i = 0; i < updatedQuests.length; i++) {
      const quest = updatedQuests[i];
      
      if (quest.completed) continue;

      let progressToAdd = 0;

      switch (quest.id) {
        case 'study-60':
          // Hour Master: Study for 60 minutes total
          if (actions.studyTime) {
            progressToAdd = actions.studyTime;
          }
          break;
        
        case 'quiz-5':
          // Quiz Master: Complete 5 quizzes
          if (actions.quizCompleted) {
            progressToAdd = 1;
          }
          break;
        
        case 'ai-chat-10':
          // Chat Champion: Ask 10 questions to AI tutor
          if (actions.aiQuestionsAsked) {
            progressToAdd = actions.aiQuestionsAsked;
          }
          break;
        
        case 'streak-30':
          // Monthly Streak: Maintain a 30-day study streak
          progressToAdd = stats.streak > quest.progress ? 1 : 0;
          break;
        
        case 'daily-goal-7':
          // Daily Goal Master: Meet daily goal for 7 days
          if (actions.dailyGoalMet) {
            progressToAdd = 1;
          }
          break;
      }

      if (progressToAdd > 0) {
        quest.progress = Math.min(quest.progress + progressToAdd, quest.target);
        
        if (quest.progress >= quest.target && !quest.completed) {
          quest.completed = true;
          quest.completedAt = new Date();
          
          // Award quest reward points
          stats.points += quest.reward;
        }
      }
    }

    return updatedQuests;
  }

  /**
   * Track AI questions asked for Chat Champion quest
   */
  static async trackAIQuestion(userId: ObjectId): Promise<void> {
    const stats = await this.getUserStats(userId);
    if (!stats) return;

    await this.updateUserProgress(userId, 0, 0); // This will trigger quest update
    
    // Specifically update the AI chat quest
    const db = await getDatabase();
    const userStats = db.collection<UserStats>('userstats');
    
    await userStats.updateOne(
      { 
        userId,
        'quests.id': 'ai-chat-10',
        'quests.completed': false
      },
      { 
        $inc: { 'quests.$.progress': 1 },
        $set: { updatedAt: new Date() }
      }
    );

    // Check if quest is completed
    const updatedStats = await userStats.findOne({ userId });
    if (updatedStats) {
      const aiQuest = updatedStats.quests.find(q => q.id === 'ai-chat-10');
      if (aiQuest && aiQuest.progress >= aiQuest.target && !aiQuest.completed) {
        await userStats.updateOne(
          { 
            userId,
            'quests.id': 'ai-chat-10'
          },
          { 
            $set: { 
              'quests.$.completed': true,
              'quests.$.completedAt': new Date(),
              updatedAt: new Date()
            },
            $inc: { points: aiQuest.reward }
          }
        );
      }
    }
  }

  /**
   * Get recent achievements (last 5)
   */
  static async getRecentAchievements(userId: ObjectId): Promise<Achievement[]> {
    const stats = await this.getUserStats(userId);
    if (!stats) return [];

    return stats.achievements
      .filter(a => a.earned && a.earnedAt)
      .sort((a, b) => (b.earnedAt!.getTime() - a.earnedAt!.getTime()))
      .slice(0, 5);
  }

  /**
   * Get active quests
   */
  static async getActiveQuests(userId: ObjectId): Promise<Quest[]> {
    const stats = await this.getUserStats(userId);
    if (!stats) return [];

    return stats.quests.filter(q => !q.completed);
  }

  /**
   * Activate power-up (1 hour duration)
   */
  static async activatePowerUp(userId: ObjectId, powerUpType: 'points' | 'time' | 'streak', cost: number): Promise<boolean> {
    const db = await getDatabase();
    const userStats = db.collection<UserStats>('userstats');
    
    const stats = await userStats.findOne({ userId });
    if (!stats || stats.points < cost) {
      return false; // Not enough points
    }

    // Check if power-up is already active
    const existingPowerUp = stats.powerUps.find(p => p.type === powerUpType && p.active);
    if (existingPowerUp && existingPowerUp.expiresAt && existingPowerUp.expiresAt > new Date()) {
      return false; // Power-up already active
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + (60 * 60 * 1000)); // 1 hour

    const powerUp: PowerUp = {
      id: `${powerUpType}_${Date.now()}`,
      name: this.getPowerUpName(powerUpType),
      type: powerUpType,
      multiplier: this.getPowerUpMultiplier(powerUpType),
      duration: 60, // 60 minutes
      active: true,
      activatedAt: now,
      expiresAt
    };

    await userStats.updateOne(
      { userId },
      {
        $push: { powerUps: powerUp },
        $inc: { points: -cost },
        $set: { updatedAt: new Date() }
      }
    );

    return true;
  }

  /**
   * Get study time trend data
   */
  static async getStudyTimeTrend(userId: ObjectId, days: number = 30): Promise<Array<{date: string, studyTime: number}>> {
    const db = await getDatabase();
    const tasks = db.collection<Task>('tasks');
    
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

    const sessions = await tasks.find({
      userId,
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'completed'
    }).sort({ createdAt: 1 }).toArray();

    // Group by date
    const trendData: { [key: string]: number } = {};
    
    sessions.forEach(session => {
      const date = session.createdAt.toISOString().split('T')[0];
      trendData[date] = (trendData[date] || 0) + session.studyTime;
    });

    // Fill missing dates with 0
    const result = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
      const dateStr = date.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        studyTime: trendData[dateStr] || 0
      });
    }

    return result;
  }

  /**
   * Get recent study sessions
   */
  static async getRecentStudySessions(userId: ObjectId, limit: number = 10): Promise<Array<{
    day: string;
    timeCreated: string;
    pointsScored: number;
    scorePercentage: number;
    timeSpent: number;
  }>> {
    const db = await getDatabase();
    const tasks = db.collection<Task>('tasks');
    const quizzes = db.collection<QuizData>('quiz');
    
    const sessions = await tasks.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    const result = [];
    
    for (const session of sessions) {
      const quiz = await quizzes.findOne({ sessionId: session.sessionId });
      
      result.push({
        day: session.createdAt.toLocaleDateString(),
        timeCreated: session.createdAt.toLocaleTimeString(),
        pointsScored: session.pointsEarned,
        scorePercentage: quiz?.score || 0,
        timeSpent: session.studyTime
      });
    }

    return result;
  }

  // Helper methods
  private static getDefaultBadges(): Badge[] {
    return [
      { id: 'first-quiz', name: 'First Quiz', description: 'Complete your first quiz', icon: '🎓', earned: false, rarity: 'common' },
      { id: 'streak-7', name: 'Week Streak', description: 'Study for 7 days in a row', icon: '🔥', earned: false, rarity: 'rare' },
      { id: 'points-100', name: 'Centurion', description: 'Earn 100 points', icon: '💯', earned: false, rarity: 'common' },
      { id: 'perfect-score', name: 'Perfect Score', description: 'Get 100% on a quiz', icon: '🏆', earned: false, rarity: 'rare' },
      { id: 'early-bird', name: 'Early Bird', description: 'Study before 8 AM', icon: '🐦', earned: false, rarity: 'common' },
      { id: 'night-owl', name: 'Night Owl', description: 'Study after 10 PM', icon: '🦉', earned: false, rarity: 'common' },
      { id: 'speed-demon', name: 'Speed Demon', description: 'Finish a quiz in under 5 minutes', icon: '⚡', earned: false, rarity: 'epic' },
      { id: 'scholar', name: 'Scholar', description: 'Complete 10 quizzes', icon: '📚', earned: false, rarity: 'epic' },
    ];
  }

  private static getDefaultAchievements(): Achievement[] {
    return [
      { id: 'first-session', name: 'First Session', description: 'Complete your first study session', icon: '🎯', earned: false, points: 10 },
      { id: 'marathon-study', name: 'Marathon Study', description: 'Study for 2 hours in one session', icon: '🏃', earned: false, points: 50 },
      { id: 'consistent-week', name: 'Consistent Week', description: 'Study every day for a week', icon: '📅', earned: false, points: 75 },
      { id: 'quiz-expert', name: 'Quiz Expert', description: 'Score 90% or higher on 5 quizzes', icon: '📝', earned: false, points: 100 },
      { id: 'point-master', name: 'Point Master', description: 'Earn 1000 total points', icon: '⭐', earned: false, points: 200 },
    ];
  }

  private static getDefaultQuests(): Quest[] {
    return [
      { id: 'study-60', name: 'Hour Master', description: 'Study for 60 minutes total', icon: '⏱️', progress: 0, target: 60, reward: 50, completed: false, category: 'study' },
      { id: 'quiz-5', name: 'Quiz Master', description: 'Complete 5 quizzes', icon: '📝', progress: 0, target: 5, reward: 75, completed: false, category: 'quiz' },
      { id: 'ai-chat-10', name: 'Chat Champion', description: 'Ask 10 questions to AI tutor', icon: '💬', progress: 0, target: 10, reward: 40, completed: false, category: 'ai' },
      { id: 'streak-30', name: 'Monthly Streak', description: 'Maintain a 30-day study streak', icon: '📅', progress: 0, target: 30, reward: 150, completed: false, category: 'consistency' },
      { id: 'daily-goal-7', name: 'Goal Achiever', description: 'Meet daily goal for 7 days', icon: '🎯', progress: 0, target: 7, reward: 100, completed: false, category: 'consistency' },
    ];
  }

  private static async checkAndUpdateBadges(stats: UserStats): Promise<Badge[]> {
    const badges = [...stats.badges];
    
    for (let badge of badges) {
      if (badge.earned) continue;

      let shouldEarn = false;

      switch (badge.id) {
        case 'first-quiz':
          shouldEarn = await this.getTotalQuizzes(stats.userId) >= 1;
          break;
        case 'streak-7':
          shouldEarn = stats.streak >= 7;
          break;
        case 'points-100':
          shouldEarn = stats.points >= 100;
          break;
        case 'perfect-score':
          shouldEarn = await this.hasPerfectScore(stats.userId);
          break;
        case 'scholar':
          shouldEarn = await this.getTotalQuizzes(stats.userId) >= 10;
          break;
      }

      if (shouldEarn) {
        badge.earned = true;
        badge.earnedAt = new Date();
      }
    }

    return badges;
  }

  private static async checkAndUpdateAchievements(stats: UserStats): Promise<Achievement[]> {
    const achievements = [...stats.achievements];
    
    for (let achievement of achievements) {
      if (achievement.earned) continue;

      let shouldEarn = false;

      switch (achievement.id) {
        case 'first-session':
          shouldEarn = await this.getTotalSessions(stats.userId) >= 1;
          break;
        case 'marathon-study':
          shouldEarn = await this.hasMarathonSession(stats.userId);
          break;
        case 'consistent-week':
          shouldEarn = stats.streak >= 7;
          break;
        case 'quiz-expert':
          shouldEarn = await this.hasQuizExpertise(stats.userId);
          break;
        case 'point-master':
          shouldEarn = stats.points >= 1000;
          break;
      }

      if (shouldEarn) {
        achievement.earned = true;
        achievement.earnedAt = new Date();
      }
    }

    return achievements;
  }

  // Helper methods for badge/achievement checks
  private static async getTotalQuizzes(userId: ObjectId): Promise<number> {
    const db = await getDatabase();
    return await db.collection('quiz').countDocuments({ userId, completed: true });
  }

  private static async getTotalSessions(userId: ObjectId): Promise<number> {
    const db = await getDatabase();
    return await db.collection('tasks').countDocuments({ userId, status: 'completed' });
  }

  private static async hasPerfectScore(userId: ObjectId): Promise<boolean> {
    const db = await getDatabase();
    const perfectScore = await db.collection('quiz').findOne({ userId, score: 100 });
    return !!perfectScore;
  }

  private static async hasMarathonSession(userId: ObjectId): Promise<boolean> {
    const db = await getDatabase();
    const marathonSession = await db.collection('tasks').findOne({ 
      userId, 
      studyTime: { $gte: 120 } // 2 hours = 120 minutes
    });
    return !!marathonSession;
  }

  private static async hasQuizExpertise(userId: ObjectId): Promise<boolean> {
    const db = await getDatabase();
    const expertQuizzes = await db.collection('quiz').countDocuments({ 
      userId, 
      score: { $gte: 90 } 
    });
    return expertQuizzes >= 5;
  }

  private static async updateUserTotalPoints(userId: ObjectId, totalPoints: number): Promise<void> {
    const db = await getDatabase();
    await db.collection('users').updateOne(
      { _id: userId },
      { 
        $set: { 
          totalPoints,
          updatedAt: new Date()
        }
      }
    );
  }

  private static deactivateExpiredPowerUps(powerUps: PowerUp[]): PowerUp[] {
    const now = new Date();
    return powerUps.map(powerUp => {
      if (powerUp.active && powerUp.expiresAt && powerUp.expiresAt <= now) {
        return { ...powerUp, active: false };
      }
      return powerUp;
    });
  }

  private static getPowerUpName(type: string): string {
    switch (type) {
      case 'points': return 'Points Booster';
      case 'time': return 'Time Extender';
      case 'streak': return 'Streak Protector';
      default: return 'Unknown Power-up';
    }
  }

  private static getPowerUpMultiplier(type: string): number {
    switch (type) {
      case 'points': return 2; // 2x points
      case 'time': return 1.5; // 1.5x time efficiency
      case 'streak': return 1; // Protects streak
      default: return 1;
    }
  }
}