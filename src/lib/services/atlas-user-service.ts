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
  totalPoints: number;
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
    const db = await getDatabase();
    
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
      totalPoints: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await users.insertOne(newAtlasUser);
    const userId = result.insertedId;
    
    // Initialize user stats for the new user
    await this.initializeUserStats(userId);
    
    // Convert to legacy format for compatibility
    return await this.convertAtlasToLegacy({ ...newAtlasUser, _id: userId });
  }

  /**
   * Initialize user stats for a new user
   */
  private static async initializeUserStats(userId: ObjectId): Promise<void> {
    const db = await getDatabase();
    const userStats = db.collection('userstats');
    
    const defaultStats = {
      userId,
      level: 1,
      points: 0,
      streak: 0,
      quizAccuracy: 0,
      dailyGoal: 500, // 500 points per day
      totalStudyTime: 0,
      badges: defaultUserProgress.badges,
      achievements: defaultUserProgress.achievements,
      quests: defaultUserProgress.quests,
      challenges: [],
      powerUps: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await userStats.insertOne(defaultStats);
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
    return await this.convertAtlasToLegacy(atlasUser);
  }

  static async getUserById(userId: string): Promise<LegacyUser | null> {
    const users = await this.getUsersCollection();
    const atlasUser = await users.findOne({ _id: new ObjectId(userId) });
    
    if (!atlasUser) {
      return null;
    }

    return await this.convertAtlasToLegacy(atlasUser);
  }

  static async getUserByEmail(email: string): Promise<LegacyUser | null> {
    const users = await this.getUsersCollection();
    const atlasUser = await users.findOne({ email });
    
    if (!atlasUser) {
      return null;
    }

    return await this.convertAtlasToLegacy(atlasUser);
  }

  /**
   * Convert Atlas user format to legacy format for compatibility
   */
  private static async convertAtlasToLegacy(atlasUser: AtlasUser): Promise<LegacyUser> {
    // Get user stats from userstats collection
    const db = await getDatabase();
    const userStats = await db.collection('userstats').findOne({ userId: atlasUser._id });
    
    return {
      _id: atlasUser._id,
      username: atlasUser.username,
      email: atlasUser.email,
      password: atlasUser.password,
      createdAt: atlasUser.createdAt,
      updatedAt: atlasUser.updatedAt,
      progress: {
        level: userStats?.level || 1,
        points: userStats?.points || atlasUser.totalPoints || 0,
        streak: userStats?.streak || 0,
        lastStudyDate: userStats?.lastStudyDate,
        totalStudyTime: userStats?.totalStudyTime || 0,
        dailyGoal: userStats?.dailyGoal || 500,
        badges: userStats?.badges || defaultUserProgress.badges,
        quests: userStats?.quests || defaultUserProgress.quests,
        achievements: userStats?.achievements || defaultUserProgress.achievements,
        studySessions: [] // Will be loaded separately from tasks collection
      }
    };
  }

  /**
   * Update user progress (New schema format)
   */
  static async updateUserProgress(userId: string, updates: Partial<UserProgress>): Promise<void> {
    const db = await getDatabase();
    const users = db.collection('users');
    const userStats = db.collection('userstats');
    
    // Update totalPoints in users collection if points changed
    if (updates.points !== undefined) {
      await users.updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            totalPoints: updates.points,
            updatedAt: new Date()
          }
        }
      );
    }

    // Update detailed stats in userstats collection
    const statsUpdates: any = {
      updatedAt: new Date()
    };

    if (updates.level !== undefined) statsUpdates.level = updates.level;
    if (updates.points !== undefined) statsUpdates.points = updates.points;
    if (updates.streak !== undefined) statsUpdates.streak = updates.streak;
    if (updates.totalStudyTime !== undefined) statsUpdates.totalStudyTime = updates.totalStudyTime;
    if (updates.lastStudyDate !== undefined) statsUpdates.lastStudyDate = updates.lastStudyDate;
    if (updates.dailyGoal !== undefined) statsUpdates.dailyGoal = updates.dailyGoal;

    await userStats.updateOne(
      { userId: new ObjectId(userId) },
      { $set: statsUpdates },
      { upsert: true }
    );
  }

  /**
   * Add study session (creates in tasks collection)
   */
  static async addStudySession(userId: string, session: StudySession): Promise<void> {
    const db = await getDatabase();
    const tasks = db.collection('tasks');
    const users = db.collection('users');
    const userStats = db.collection('userstats');
    
    // Create session in tasks collection
    const sessionId = `session_${Date.now()}`;
    const newTask = {
      userId: new ObjectId(userId),
      sessionId,
      title: session.taskName,
      status: 'completed',
      studyTime: session.duration, // in minutes
      pointsEarned: session.points,
      createdAt: session.completedAt,
      updatedAt: new Date(),
      completedAt: session.completedAt
    };

    await tasks.insertOne(newTask);

    // Get current user stats
    const stats = await userStats.findOne({ userId: new ObjectId(userId) });
    const currentPoints = stats?.points || 0;
    const currentLevel = stats?.level || 1;
    const currentStudyTime = stats?.totalStudyTime || 0;
    const currentStreak = stats?.streak || 0;
    
    const newPoints = currentPoints + session.points;
    const newStudyTime = currentStudyTime + session.duration;
    const newLevel = Math.floor(newPoints / 100) + 1;
    
    // Update streak logic
    const today = new Date();
    const lastStudyDate = stats?.lastStudyDate;
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

    // Update user stats
    await userStats.updateOne(
      { userId: new ObjectId(userId) },
      {
        $set: {
          points: newPoints,
          level: newLevel,
          totalStudyTime: newStudyTime,
          streak: newStreak,
          lastStudyDate: today,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    // Update user total points
    await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          totalPoints: newPoints,
          updatedAt: new Date()
        }
      }
    );
  }

  /**
   * Get study sessions with time data (from tasks collection)
   */
  static async getStudySessionsWithTimeData(userId: string): Promise<Array<{
    date: string;
    duration: number;
    score: number;
    points: number;
  }>> {
    const db = await getDatabase();
    const tasks = db.collection('tasks');
    const quizzes = db.collection('quiz');
    
    const userTasks = await tasks
      .find({ userId: new ObjectId(userId), status: 'completed' })
      .sort({ createdAt: -1 })
      .toArray();

    const sessions = [];
    for (const task of userTasks) {
      // Get quiz score for this session
      const quiz = await quizzes.findOne({ sessionId: task.sessionId });
      
      sessions.push({
        date: task.createdAt.toISOString().split('T')[0],
        duration: task.studyTime || 0,
        score: quiz?.score || 0,
        points: task.pointsEarned || 0
      });
    }

    return sessions;
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