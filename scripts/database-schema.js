#!/usr/bin/env node

/**
 * StudyMaster AI - Database Schema Setup
 * 
 * This script creates the database collections and indexes
 * for the StudyMaster AI application on MongoDB Atlas.
 */

const { MongoClient } = require('mongodb');
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

async function setupDatabase() {
  let client;
  
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    client = new MongoClient(uri, options);
    await client.connect();
    
    const db = client.db('studymaster');
    console.log('✅ Connected to StudyMaster database');

    // Create collections with validation schemas
    await createCollections(db);
    
    // Create indexes for performance
    await createIndexes(db);
    
    console.log('🎉 Database schema setup complete!');
    
  } catch (error) {
    console.error('❌ Schema setup failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

async function createCollections(db) {
  console.log('📋 Creating collections with validation schemas...');

  // Users Collection
  try {
    await db.createCollection('users', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['username', 'email', 'password', 'createdAt'],
          properties: {
            username: { bsonType: 'string', minLength: 3, maxLength: 50 },
            email: { bsonType: 'string', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' },
            password: { bsonType: 'string', minLength: 6 },
            profile: {
              bsonType: 'object',
              properties: {
                firstName: { bsonType: 'string' },
                lastName: { bsonType: 'string' },
                avatar: { bsonType: 'string' },
                bio: { bsonType: 'string' }
              }
            },
            progress: {
              bsonType: 'object',
              properties: {
                level: { bsonType: 'int', minimum: 1 },
                points: { bsonType: 'int', minimum: 0 },
                streak: { bsonType: 'int', minimum: 0 },
                totalStudyTime: { bsonType: 'int', minimum: 0 },
                lastStudyDate: { bsonType: 'date' },
                dailyGoal: { bsonType: 'int', minimum: 0 }
              }
            },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' }
          }
        }
      }
    });
    console.log('✅ Users collection created');
  } catch (error) {
    if (error.code !== 48) { // Collection already exists
      throw error;
    }
    console.log('ℹ️  Users collection already exists');
  }

  // Study Sessions Collection
  try {
    await db.createCollection('studySessions', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['user', 'title', 'status', 'createdAt'],
          properties: {
            user: { bsonType: 'objectId' },
            title: { bsonType: 'string', minLength: 1 },
            pdfUrl: { bsonType: 'string' },
            pdfContent: { bsonType: 'string' },
            status: { 
              bsonType: 'string', 
              enum: ['pending', 'in-progress', 'completed', 'paused'] 
            },
            studyTime: { bsonType: 'int', minimum: 0 },
            quizScore: { bsonType: 'number', minimum: 0, maximum: 100 },
            totalQuestions: { bsonType: 'int', minimum: 0 },
            pointsEarned: { bsonType: 'int', minimum: 0 },
            coinsUsed: { bsonType: 'int', minimum: 0 },
            strengths: { bsonType: 'array', items: { bsonType: 'string' } },
            areasForImprovement: { bsonType: 'array', items: { bsonType: 'string' } },
            recommendations: { bsonType: 'array', items: { bsonType: 'string' } },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' },
            completedAt: { bsonType: 'date' }
          }
        }
      }
    });
    console.log('✅ Study Sessions collection created');
  } catch (error) {
    if (error.code !== 48) {
      throw error;
    }
    console.log('ℹ️  Study Sessions collection already exists');
  }

  // Quizzes Collection
  try {
    await db.createCollection('quizzes', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['sessionId', 'questions', 'createdAt'],
          properties: {
            sessionId: { bsonType: 'objectId' },
            user: { bsonType: 'objectId' },
            title: { bsonType: 'string' },
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
            totalQuestions: { bsonType: 'int', minimum: 1 },
            timeLimit: { bsonType: 'int', minimum: 0 },
            createdAt: { bsonType: 'date' }
          }
        }
      }
    });
    console.log('✅ Quizzes collection created');
  } catch (error) {
    if (error.code !== 48) {
      throw error;
    }
    console.log('ℹ️  Quizzes collection already exists');
  }

  // Quiz Results Collection
  try {
    await db.createCollection('quizResults', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['user', 'quizId', 'sessionId', 'answers', 'score', 'createdAt'],
          properties: {
            user: { bsonType: 'objectId' },
            quizId: { bsonType: 'objectId' },
            sessionId: { bsonType: 'objectId' },
            answers: {
              bsonType: 'array',
              items: {
                bsonType: 'object',
                required: ['questionIndex', 'selectedAnswer', 'isCorrect'],
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
            createdAt: { bsonType: 'date' }
          }
        }
      }
    });
    console.log('✅ Quiz Results collection created');
  } catch (error) {
    if (error.code !== 48) {
      throw error;
    }
    console.log('ℹ️  Quiz Results collection already exists');
  }

  // Badges Collection
  try {
    await db.createCollection('badges', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name', 'description', 'icon', 'criteria'],
          properties: {
            name: { bsonType: 'string', minLength: 1 },
            description: { bsonType: 'string' },
            icon: { bsonType: 'string' },
            criteria: {
              bsonType: 'object',
              properties: {
                type: { 
                  bsonType: 'string', 
                  enum: ['points', 'streak', 'quizzes', 'sessions', 'score', 'time'] 
                },
                value: { bsonType: 'number', minimum: 0 },
                condition: { bsonType: 'string' }
              }
            },
            rarity: { 
              bsonType: 'string', 
              enum: ['common', 'rare', 'epic', 'legendary'] 
            },
            pointsReward: { bsonType: 'int', minimum: 0 },
            isActive: { bsonType: 'bool' }
          }
        }
      }
    });
    console.log('✅ Badges collection created');
  } catch (error) {
    if (error.code !== 48) {
      throw error;
    }
    console.log('ℹ️  Badges collection already exists');
  }

  // User Badges Collection (Junction table)
  try {
    await db.createCollection('userBadges', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['user', 'badge', 'earnedAt'],
          properties: {
            user: { bsonType: 'objectId' },
            badge: { bsonType: 'objectId' },
            earnedAt: { bsonType: 'date' },
            progress: { bsonType: 'number', minimum: 0, maximum: 100 }
          }
        }
      }
    });
    console.log('✅ User Badges collection created');
  } catch (error) {
    if (error.code !== 48) {
      throw error;
    }
    console.log('ℹ️  User Badges collection already exists');
  }
}

async function createIndexes(db) {
  console.log('🔍 Creating database indexes...');

  // Users indexes
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('users').createIndex({ username: 1 }, { unique: true });
  await db.collection('users').createIndex({ 'progress.points': -1 });
  await db.collection('users').createIndex({ createdAt: -1 });

  // Study Sessions indexes
  await db.collection('studySessions').createIndex({ user: 1, createdAt: -1 });
  await db.collection('studySessions').createIndex({ status: 1 });
  await db.collection('studySessions').createIndex({ user: 1, status: 1 });
  await db.collection('studySessions').createIndex({ createdAt: -1 });

  // Quizzes indexes
  await db.collection('quizzes').createIndex({ sessionId: 1 });
  await db.collection('quizzes').createIndex({ user: 1, createdAt: -1 });

  // Quiz Results indexes
  await db.collection('quizResults').createIndex({ user: 1, createdAt: -1 });
  await db.collection('quizResults').createIndex({ quizId: 1 });
  await db.collection('quizResults').createIndex({ sessionId: 1 });
  await db.collection('quizResults').createIndex({ user: 1, score: -1 });

  // Badges indexes
  await db.collection('badges').createIndex({ name: 1 }, { unique: true });
  await db.collection('badges').createIndex({ isActive: 1 });

  // User Badges indexes
  await db.collection('userBadges').createIndex({ user: 1, badge: 1 }, { unique: true });
  await db.collection('userBadges').createIndex({ user: 1, earnedAt: -1 });

  console.log('✅ All indexes created successfully');
}

// Run the setup
setupDatabase().catch(console.error);