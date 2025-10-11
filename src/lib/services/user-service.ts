import { getDatabase } from '@/lib/mongodb';
import { User, UserProgress, StudySession, defaultUserProgress } from '@/lib/models/user';
import { User as AtlasUser } from '@/lib/database-utils';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

export class UserService {
  private static async getUsersCollection() {
    const db = await getDatabase();
    return db.collection<User>('users');
  }

  static async createUser(username: string, email: string, password: string): Promise<User> {
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

    const newUser: User = {
      username,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: { ...defaultUserProgress }
    };

    const result = await users.insertOne(newUser);
    return { ...newUser, _id: result.insertedId };
  }

  static async authenticateUser(email: string, password: string): Promise<User | null> {
    const users = await this.getUsersCollection();
    const user = await users.findOne({ email });
    
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  static async getUserById(userId: string): Promise<User | null> {
    const users = await this.getUsersCollection();
    return await users.findOne({ _id: new ObjectId(userId) });
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.getUsersCollection();
    return await users.findOne({ email });
  }

  static async updateUserProgress(userId: string, progress: Partial<UserProgress>): Promise<void> {
    const users = await this.getUsersCollection();
    await users.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          progress: progress,
          updatedAt: new Date()
        }
      }
    );
  }

  static async addStudySession(userId: string, session: StudySession): Promise<void> {
    const users = await this.getUsersCollection();
    const user = await this.getUserById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Add session to user's study sessions
    const updatedSessions = [...user.progress.studySessions, session];
    
    // Update total study time
    const updatedTotalStudyTime = user.progress.totalStudyTime + session.duration;
    
    // Update points
    const updatedPoints = user.progress.points + session.points;
    
    // Calculate new level
    const updatedLevel = Math.floor(updatedPoints / 100) + 1;
    
    // Check and update streak
    const today = new Date();
    const lastStudyDate = user.progress.lastStudyDate;
    let updatedStreak = user.progress.streak;
    
    if (lastStudyDate) {
      const daysDiff = Math.floor((today.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        updatedStreak += 1;
      } else if (daysDiff > 1) {
        updatedStreak = 1; // Reset streak but count today
      }
      // If daysDiff === 0, it's the same day, don't change streak
    } else {
      updatedStreak = 1; // First study session
    }

    await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          'progress.studySessions': updatedSessions,
          'progress.totalStudyTime': updatedTotalStudyTime,
          'progress.points': updatedPoints,
          'progress.level': updatedLevel,
          'progress.streak': updatedStreak,
          'progress.lastStudyDate': today,
          updatedAt: new Date()
        }
      }
    );
  }

  static async updateBadge(userId: string, badgeId: string, earned: boolean): Promise<void> {
    const users = await this.getUsersCollection();
    const user = await this.getUserById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    const updatedBadges = user.progress.badges.map(badge => 
      badge.id === badgeId 
        ? { ...badge, earned, earnedAt: earned ? new Date() : undefined }
        : badge
    );

    await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          'progress.badges': updatedBadges,
          updatedAt: new Date()
        }
      }
    );
  }

  static async updateQuest(userId: string, questId: string, progress: number): Promise<void> {
    const users = await this.getUsersCollection();
    const user = await this.getUserById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    const updatedQuests = user.progress.quests.map(quest => {
      if (quest.id === questId && !quest.completed) {
        const newProgress = Math.min(quest.progress + progress, quest.target);
        const completed = newProgress >= quest.target;
        return {
          ...quest,
          progress: newProgress,
          completed,
          completedAt: completed ? new Date() : undefined
        };
      }
      return quest;
    });

    await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          'progress.quests': updatedQuests,
          updatedAt: new Date()
        }
      }
    );
  }

  static async updateAchievement(userId: string, achievementId: string, earned: boolean): Promise<void> {
    const users = await this.getUsersCollection();
    const user = await this.getUserById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    const updatedAchievements = user.progress.achievements.map(achievement => 
      achievement.id === achievementId 
        ? { ...achievement, earned, earnedAt: earned ? new Date() : undefined }
        : achievement
    );

    await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          'progress.achievements': updatedAchievements,
          updatedAt: new Date()
        }
      }
    );
  }

  static async getStudySessionsWithTimeData(userId: string): Promise<Array<{
    date: string;
    duration: number;
    score: number;
    points: number;
  }>> {
    const user = await this.getUserById(userId);
    if (!user) {
      return [];
    }

    return user.progress.studySessions.map(session => ({
      date: session.completedAt.toISOString().split('T')[0],
      duration: session.duration,
      score: session.score,
      points: session.points
    }));
  }
}