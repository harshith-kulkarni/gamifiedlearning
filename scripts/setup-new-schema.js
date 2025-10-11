#!/usr/bin/env node

/**
 * Setup New Database Schema
 * 
 * This script creates the new database schema according to the application requirements:
 * 1. USERS - Basic user info with totalPoints
 * 2. USERSTATS - All gamification data (badges, achievements, quests, etc.)
 * 3. TASKS - PDF data and session info
 * 4. QUIZ - Quiz questions and results per session
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
};

async function setupNewSchema() {
  let client;
  
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    client = new MongoClient(uri, options);
    await client.connect();
    
    const db = client.db('studymaster');
    console.log('✅ Connected to StudyMaster database');

    // Create new collections with proper schemas
    await createNewCollections(db);
    
    // Create indexes for performance
    await createNewIndexes(db);
    
    console.log('🎉 New database schema setup complete!');
    
  } catch (error) {
    console.error('❌ Schema setup failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

async function createNewCollections(db) {
  console.log('📋 Creating new collections with validation schemas...');

  // 1. USERS Collection - Basic user info
  try {
    await db.createCollection('users', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['username', 'email', 'password', 'totalPoints', 'createdAt'],
          properties: {
            username: { bsonType: 'string', minLength: 3, maxLength: 50 },
            email: { bsonType: 'string', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' },
            password: { bsonType: 'string', minLength: 6 },
            totalPoints: { bsonType: 'int', minimum: 0 },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' }
          }
        }
      }
    });
    console.log('✅ Users collection created');
  } catch (error) {
    if (error.code !== 48) {
      throw error;
    }
    console.log('ℹ️  Users collection already exists');
  }

  // 2. USERSTATS Collection - All gamification data
  try {
    await db.createCollection('userstats', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['userId', 'level', 'points', 'streak', 'createdAt'],
          properties: {
            userId: { bsonType: 'objectId' },
            level: { bsonType: 'int', minimum: 1 },
            points: { bsonType: 'int', minimum: 0 },
            streak: { bsonType: 'int', minimum: 0 },
            quizAccuracy: { bsonType: 'number', minimum: 0, maximum: 100 },
            dailyGoal: { bsonType: 'int', minimum: 0 },
            totalStudyTime: { bsonType: 'int', minimum: 0 },
            lastStudyDate: { bsonType: 'date' },
            badges: {
              bsonType: 'array',
              items: {
                bsonType: 'object',
                required: ['id', 'name', 'earned'],
                properties: {
                  id: { bsonType: 'string' },
                  name: { bsonType: 'string' },
                  description: { bsonType: 'string' },
                  icon: { bsonType: 'string' },
                  earned: { bsonType: 'bool' },
                  earnedAt: { bsonType: 'date' },
                  rarity: { bsonType: 'string', enum: ['common', 'rare', 'epic', 'legendary'] }
                }
              }
            },
            achievements: {
              bsonType: 'array',
              items: {
                bsonType: 'object',
                required: ['id', 'name', 'earned'],
                properties: {
                  id: { bsonType: 'string' },
                  name: { bsonType: 'string' },
                  description: { bsonType: 'string' },
                  icon: { bsonType: 'string' },
                  earned: { bsonType: 'bool' },
                  earnedAt: { bsonType: 'date' },
                  points: { bsonType: 'int' }
                }
              }
            },
            quests: {
              bsonType: 'array',
              items: {
                bsonType: 'object',
                required: ['id', 'name', 'progress', 'target', 'completed'],
                properties: {
                  id: { bsonType: 'string' },
                  name: { bsonType: 'string' },
                  description: { bsonType: 'string' },
                  icon: { bsonType: 'string' },
                  progress: { bsonType: 'int', minimum: 0 },
                  target: { bsonType: 'int', minimum: 1 },
                  reward: { bsonType: 'int', minimum: 0 },
                  completed: { bsonType: 'bool' },
                  completedAt: { bsonType: 'date' },
                  category: { bsonType: 'string' }
                }
              }
            },
            challenges: {
              bsonType: 'array',
              items: {
                bsonType: 'object',
                properties: {
                  id: { bsonType: 'string' },
                  name: { bsonType: 'string' },
                  description: { bsonType: 'string' },
                  progress: { bsonType: 'int', minimum: 0 },
                  target: { bsonType: 'int', minimum: 1 },
                  active: { bsonType: 'bool' },
                  startedAt: { bsonType: 'date' },
                  completedAt: { bsonType: 'date' }
                }
              }
            },
            powerUps: {
              bsonType: 'array',
              items: {
                bsonType: 'object',
                properties: {
                  id: { bsonType: 'string' },
                  name: { bsonType: 'string' },
                  type: { bsonType: 'string', enum: ['points', 'time', 'streak'] },
                  multiplier: { bsonType: 'number', minimum: 1 },
                  duration: { bsonType: 'int', minimum: 0 },
                  active: { bsonType: 'bool' },
                  activatedAt: { bsonType: 'date' },
                  expiresAt: { bsonType: 'date' }
                }
              }
            },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' }
          }
        }
      }
    });
    console.log('✅ UserStats collection created');
  } catch (error) {
    if (error.code !== 48) {
      throw error;
    }
    console.log('ℹ️  UserStats collection already exists');
  }

  // 3. TASKS Collection - PDF and session data
  try {
    await db.createCollection('tasks', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['userId', 'sessionId', 'title', 'status', 'createdAt'],
          properties: {
            userId: { bsonType: 'objectId' },
            sessionId: { bsonType: 'string' },
            title: { bsonType: 'string', minLength: 1 },
            pdfUrl: { bsonType: 'string' },
            pdfContent: { bsonType: 'string' },
            pdfData: { bsonType: 'object' },
            status: { 
              bsonType: 'string', 
              enum: ['pending', 'in-progress', 'completed', 'paused'] 
            },
            studyTime: { bsonType: 'int', minimum: 0 },
            pointsEarned: { bsonType: 'int', minimum: 0 },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' },
            completedAt: { bsonType: 'date' }
          }
        }
      }
    });
    console.log('✅ Tasks collection created');
  } catch (error) {
    if (error.code !== 48) {
      throw error;
    }
    console.log('ℹ️  Tasks collection already exists');
  }

  // 4. QUIZ Collection - Quiz questions and results per session
  try {
    await db.createCollection('quiz', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['sessionId', 'userId', 'questions', 'createdAt'],
          properties: {
            sessionId: { bsonType: 'string' },
            userId: { bsonType: 'objectId' },
            questions: {
              bsonType: 'array',
              items: {
                bsonType: 'object',
                required: ['question', 'options', 'correctAnswer'],
                properties: {
                  question: { bsonType: 'string' },
                  options: { 
                    bsonType: 'array', 
                    items: { bsonType: 'string' },
                    minItems: 2,
                    maxItems: 6
                  },
                  correctAnswer: { bsonType: 'int', minimum: 0 },
                  explanation: { bsonType: 'string' },
                  difficulty: { 
                    bsonType: 'string', 
                    enum: ['easy', 'medium', 'hard'] 
                  },
                  category: { bsonType: 'string' }
                }
              }
            },
            answers: {
              bsonType: 'array',
              items: {
                bsonType: 'object',
                properties: {
                  questionIndex: { bsonType: 'int', minimum: 0 },
                  selectedAnswer: { bsonType: 'int', minimum: 0 },
                  isCorrect: { bsonType: 'bool' },
                  timeSpent: { bsonType: 'int', minimum: 0 }
                }
              }
            },
            score: { bsonType: 'number', minimum: 0, maximum: 100 },
            totalQuestions: { bsonType: 'int', minimum: 1 },
            correctAnswers: { bsonType: 'int', minimum: 0 },
            timeSpent: { bsonType: 'int', minimum: 0 },
            pointsEarned: { bsonType: 'int', minimum: 0 },
            completed: { bsonType: 'bool' },
            createdAt: { bsonType: 'date' },
            completedAt: { bsonType: 'date' }
          }
        }
      }
    });
    console.log('✅ Quiz collection created');
  } catch (error) {
    if (error.code !== 48) {
      throw error;
    }
    console.log('ℹ️  Quiz collection already exists');
  }
}

async function createNewIndexes(db) {
  console.log('🔍 Creating database indexes...');

  // Users indexes
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('users').createIndex({ username: 1 }, { unique: true });
  await db.collection('users').createIndex({ totalPoints: -1 });
  await db.collection('users').createIndex({ createdAt: -1 });

  // UserStats indexes
  await db.collection('userstats').createIndex({ userId: 1 }, { unique: true });
  await db.collection('userstats').createIndex({ points: -1 });
  await db.collection('userstats').createIndex({ level: -1 });
  await db.collection('userstats').createIndex({ streak: -1 });
  await db.collection('userstats').createIndex({ lastStudyDate: -1 });

  // Tasks indexes
  await db.collection('tasks').createIndex({ userId: 1, createdAt: -1 });
  await db.collection('tasks').createIndex({ sessionId: 1 }, { unique: true });
  await db.collection('tasks').createIndex({ status: 1 });
  await db.collection('tasks').createIndex({ userId: 1, status: 1 });

  // Quiz indexes
  await db.collection('quiz').createIndex({ sessionId: 1 });
  await db.collection('quiz').createIndex({ userId: 1, createdAt: -1 });
  await db.collection('quiz').createIndex({ userId: 1, completed: 1 });
  await db.collection('quiz').createIndex({ score: -1 });

  console.log('✅ All indexes created successfully');
}

// Run the setup
setupNewSchema().catch(console.error);