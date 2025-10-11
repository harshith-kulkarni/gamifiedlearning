/**
 * Database Setup Script for StudyMaster AI
 * Run this to ensure proper database schema and validation
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function setupDatabase() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env.local');
    console.log('Please check your .env.local file and ensure MONGODB_URI is set');
    return;
  }

  console.log('🔗 Setting up MongoDB Atlas database...');
  console.log('URI:', process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
  
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas successfully!');
    
    const db = client.db('studymaster');
    
    // Create collections if they don't exist
    const collections = ['users', 'userstats', 'tasks', 'quiz', 'flashcards'];
    
    for (const collectionName of collections) {
      try {
        await db.createCollection(collectionName);
        console.log(`✅ Created collection: ${collectionName}`);
      } catch (error) {
        if (error.code === 48) {
          console.log(`ℹ️  Collection ${collectionName} already exists`);
        } else {
          console.error(`❌ Error creating ${collectionName}:`, error.message);
        }
      }
    }
    
    // Set up userstats validation (relaxed for development)
    try {
      await db.command({
        collMod: 'userstats',
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
                    points: { bsonType: 'int', minimum: 0 }
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
        },
        validationLevel: 'off', // Disable validation for development to prevent errors
        validationAction: 'warn' // Only warn, don't block operations
      });
      console.log('✅ Updated userstats validation rules');
    } catch (error) {
      console.log('ℹ️  Validation setup:', error.message);
    }
    
    // Create indexes for better performance
    try {
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
      console.log('✅ Created unique index on users.email');
    } catch (error) {
      console.log('ℹ️  Email index:', error.message);
    }

    try {
      await db.collection('userstats').createIndex({ userId: 1 }, { unique: true });
      console.log('✅ Created unique index on userstats.userId');
    } catch (error) {
      console.log('ℹ️  UserStats index:', error.message);
    }

    try {
      await db.collection('tasks').createIndex({ userId: 1 });
      console.log('✅ Created index on tasks.userId');
    } catch (error) {
      console.log('ℹ️  Tasks index:', error.message);
    }
    
    // Create unique index on sessionId to prevent duplicates
    try {
      await db.collection('tasks').createIndex({ sessionId: 1 }, { unique: true });
      console.log('✅ Created unique index on tasks.sessionId');
    } catch (error) {
      console.log('ℹ️  Tasks sessionId index:', error.message);
    }

    // Set up flashcards collection validation and indexes
    try {
      await db.command({
        collMod: 'flashcards',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['userId', 'taskId', 'pdfTitle', 'question', 'answer', 'status', 'createdAt', 'reviewCount'],
            properties: {
              userId: { bsonType: 'objectId' },
              taskId: { bsonType: 'string', minLength: 1 },
              pdfTitle: { bsonType: 'string', minLength: 1, maxLength: 200 },
              question: { bsonType: 'string', minLength: 1, maxLength: 100 },
              answer: { bsonType: 'string', minLength: 1, maxLength: 200 },
              pageNumber: { bsonType: 'int', minimum: 1 },
              sourceText: { bsonType: 'string', maxLength: 300 },
              status: { bsonType: 'string', enum: ['saved', 'known', 'review'] },
              createdAt: { bsonType: 'date' },
              lastReviewed: { bsonType: 'date' },
              reviewCount: { bsonType: 'int', minimum: 0 }
            }
          }
        },
        validationLevel: 'off', // Disable validation for development
        validationAction: 'warn' // Only warn, don't block operations
      });
      console.log('✅ Updated flashcards validation rules');
    } catch (error) {
      console.log('ℹ️  Flashcards validation setup:', error.message);
    }

    // Create indexes for flashcards collection
    try {
      await db.collection('flashcards').createIndex({ userId: 1 });
      console.log('✅ Created index on flashcards.userId');
    } catch (error) {
      console.log('ℹ️  Flashcards userId index:', error.message);
    }

    try {
      await db.collection('flashcards').createIndex({ userId: 1, taskId: 1 });
      console.log('✅ Created compound index on flashcards.userId + taskId');
    } catch (error) {
      console.log('ℹ️  Flashcards compound index:', error.message);
    }

    try {
      await db.collection('flashcards').createIndex({ userId: 1, status: 1 });
      console.log('✅ Created compound index on flashcards.userId + status');
    } catch (error) {
      console.log('ℹ️  Flashcards status index:', error.message);
    }

    try {
      await db.collection('flashcards').createIndex({ userId: 1, lastReviewed: 1 });
      console.log('✅ Created compound index on flashcards.userId + lastReviewed');
    } catch (error) {
      console.log('ℹ️  Flashcards lastReviewed index:', error.message);
    }

    try {
      await db.collection('flashcards').createIndex({ 
        question: 'text', 
        answer: 'text', 
        sourceText: 'text' 
      });
      console.log('✅ Created text search index on flashcards content');
    } catch (error) {
      console.log('ℹ️  Flashcards text search index:', error.message);
    }


    
    console.log('🎉 Database setup completed successfully!');
    console.log('ℹ️  Note: Validation is set to "off" for development to prevent errors for new developers');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n🔐 Authentication Error Solutions:');
      console.log('- Check your username and password in MONGODB_URI');
      console.log('- Verify the database user exists in MongoDB Atlas');
      console.log('- Ensure the user has proper permissions (readWrite)');
    } else if (error.message.includes('network')) {
      console.log('\n🌐 Network Error Solutions:');
      console.log('- Check your internet connection');
      console.log('- Verify your IP is whitelisted in MongoDB Atlas Network Access');
      console.log('- Try adding 0.0.0.0/0 to allow all IPs (development only)');
    }
  } finally {
    await client.close();
  }
}

setupDatabase();