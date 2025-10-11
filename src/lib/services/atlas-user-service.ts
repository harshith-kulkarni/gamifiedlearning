/**
 * Atlas User Service
 * 
 * This service works with the new MongoDB Atlas schema
 * and provides compatibility with the existing application.
 */

import { getDatabase } from '@/lib/mongodb';
import { User as LegacyUser, UserProgress, StudySession, defaultUserProgress } from '@/lib/models/user';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

// Atlas User interface (matches our new schema)
interface AtlasUser {
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
    lastStudyDate?: Date;
    dailyGoal: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class AtlasUserService {
  private static async getUsersCollection() {
    const db = await getDatabase();
    return db.collection<AtlasUser>('users');
  }

  static async createUser(username: string, email: string, password: string): Promise<LegacyUser> {
    const users = await this.getUsersCollection();
    
    // Check if user already exists
    const existingUser = await users.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const newAtlasUser: AtlasUser = {
      username,
      email,
      password: hashedPassword,
      progress: {
        level: 1,
        points: 0,
        streak: 0,
        totalStudyTime: 0,
        dailyGoal: 30
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await users.insertOne(newAtlasUser);
    
    // Convert to legacy format for compatibility
    return this.convertAtlasToLegacy({ ...newAtlasUser, _id: result.insertedId });
  }

  static async authenticateUser(email: string, password: string): Promise<LegacyUser | null> {
    const users = await this.getUsersCollection();
    const atlasUser = await users.findOne({ email });
    
    if (!atlasUser) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, atlasUser.password);
    if (!isPasswordValid) {
      return null;
    }

    // Convert to legacy format for compatibility
    return this.convertAtlasToLegacy(atlasUser);
  }

  static async getUserById(userId: string): Promise<LegacyUser | null> {
    const users = await this.getUsersCollection();
    const atlasUser = await users.findOne({ _id: new ObjectId(userId) });
    
    if (!atlasUser) {
      return null;
    }

    return this.convertAtlasToLegacy(atlasUser);
  }

  static async getUserByEmail(email: string): Promise<LegacyUser | null> {
    const users = await this.getUsersCollection();
    const atlasUser = await users.findOne({ email });
    
    if (!atlasUser) {
      return null;
    }

    return this.convertAtlasToLegacy(atlasUser);
  }

  /**
   * Convert Atlas user format to legacy format for compatibility
   */
  private static convertAtlasToLegacy(atlasUser: AtlasUser): LegacyUser {
    return {
      _id: atlasUser._id,
      username: atlasUser.username,
      email: atlasUser.email,
      password: atlasUser.password,
      createdAt: atlasUser.createdAt,
      updatedAt: atlasUser.updatedAt,
      progress: {
        level: atlasUser.progress?.level || 1,
        points: atlasUser.progress?.points || 0,
        streak: atlasUser.progress?.streak || 0,
        lastStudyDate: atlasUser.progress?.lastStudyDate,
        totalStudyTime: atlasUser.progress?.totalStudyTime || 0,
        dailyGoal: atlasUser.progress?.dailyGoal || 30,
        badges: defaultUserProgress.badges, // Use default badges for now
        quests: defaultUserProgress.quests, // Use default quests for now
        achievements: defaultUserProgress.achievements, // Use default achievements for now
        studySessions: [] // Will be loaded separately from studySessions collection
      }
    };
  }

  /**
   * Update user progress (Atlas format)
   */
  static async updateUserProgress(userId: string, updates: Partial<UserProgress>): Promise<void> {
    const users = await this.getUsersCollection();
    
    const atlasUpdates: any = {
      updatedAt: new Date()
    };

    // Map legacy progress fields to Atlas format
    if (updates.level !== undefined) atlasUpdates['progress.level'] = updates.level;
    if (updates.points !== undefined) atlasUpdates['progress.points'] = updates.points;
    if (updates.streak !== undefined) atlasUpdates['progress.streak'] = updates.streak;
    if (updates.totalStudyTime !== undefined) atlasUpdates['progress.totalStudyTime'] = updates.totalStudyTime;
    if (updates.lastStudyDate !== undefined) atlasUpdates['progress.lastStudyDate'] = updates.lastStudyDate;
    if (updates.dailyGoal !== undefined) atlasUpdates['progress.dailyGoal'] = updates.dailyGoal;

    await users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: atlasUpdates }
    );
  }

  /**
   * Add study session (creates in separate collection)
   */
  static async addStudySession(userId: string, session: StudySession): Promise<void> {
    const db = await getDatabase();
    const sessions = db.collection('studySessions');
    const users = await this.getUsersCollection();
    
    // Create session in separate collection
    const atlasSession = {
      user: new ObjectId(userId),
      title: session.taskName,
      status: 'completed',
      studyTime: session.duration * 60, // convert minutes to seconds
      quizScore: session.score,
      totalQuestions: session.quizAnswers?.length || 0,
      pointsEarned: session.points,
      coinsUsed: 0,
      strengths: [],
      areasForImprovement: [],
      recommendations: [],
      createdAt: session.completedAt,
      updatedAt: new Date(),
      completedAt: session.completedAt
    };

    await sessions.insertOne(atlasSession);

    // Update user progress
    const user = await users.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      throw new Error('User not found');
    }

    const currentPoints = user.progress?.points || 0;
    const currentLevel = user.progress?.level || 1;
    const currentStudyTime = user.progress?.totalStudyTime || 0;
    const currentStreak = user.progress?.streak || 0;
    
    const newPoints = currentPoints + session.points;
    const newStudyTime = currentStudyTime + session.duration;
    const newLevel = Math.floor(newPoints / 100) + 1;
    
    // Update streak logic
    const today = new Date();
    const lastStudyDate = user.progress?.lastStudyDate;
    let newStreak = currentStreak;
    
    if (lastStudyDate) {
      const daysDiff = Math.floor((today.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        newStreak += 1;
      } else if (daysDiff > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          'progress.points': newPoints,
          'progress.level': newLevel,
          'progress.totalStudyTime': newStudyTime,
          'progress.streak': newStreak,
          'progress.lastStudyDate': today,
          updatedAt: new Date()
        }
      }
    );
  }

  /**
   * Get study sessions with time data (from separate collection)
   */
  static async getStudySessionsWithTimeData(userId: string): Promise<Array<{
    date: string;
    duration: number;
    score: number;
    points: number;
  }>> {
    const db = await getDatabase();
    const sessions = db.collection('studySessions');
    
    const userSessions = await sessions
      .find({ user: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();

    return userSessions.map(session => ({
      date: session.createdAt.toISOString().split('T')[0],
      duration: Math.floor(session.studyTime / 60), // convert seconds to minutes
      score: session.quizScore || 0,
      points: session.pointsEarned || 0
    }));
  }

  // Placeholder methods for badge/quest/achievement management
  // These would integrate with the separate collections in a full implementation
  static async updateBadge(userId: string, badgeId: string, earned: boolean): Promise<void> {
    // TODO: Implement with userBadges collection
    console.log(`Badge update: ${badgeId} for user ${userId} - ${earned}`);
  }

  static async updateQuest(userId: string, questId: string, progress: number): Promise<void> {
    // TODO: Implement with quests collection
    console.log(`Quest update: ${questId} for user ${userId} - progress: ${progress}`);
  }

  static async updateAchievement(userId: string, achievementId: string, earned: boolean): Promise<void> {
    // TODO: Implement with achievements collection
    console.log(`Achievement update: ${achievementId} for user ${userId} - ${earned}`);
  }
}