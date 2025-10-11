#!/usr/bin/env node

/**
 * Migration Script to New Schema
 * 
 * This script migrates existing data to the new schema and creates sample data
 * according to the application requirements.
 */

const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
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

async function migrateToNewSchema() {
  let client;
  
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    client = new MongoClient(uri, options);
    await client.connect();
    
    const db = client.db('studymaster');
    console.log('✅ Connected to StudyMaster database');

    // Create sample users according to new schema
    await createSampleUsers(db);
    
    // Create sample user stats
    await createSampleUserStats(db);
    
    // Create sample tasks
    await createSampleTasks(db);
    
    // Create sample quizzes
    await createSampleQuizzes(db);
    
    console.log('🎉 Migration to new schema completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

async function createSampleUsers(db) {
  console.log('👥 Creating sample users (preserving existing)...');
  
  const users = db.collection('users');
  
  // DO NOT DELETE existing users - only add new ones if they don't exist
  const sampleUsers = [
    {
      _id: new ObjectId("68e6a97ba86cd0975a7a96c9"),
      username: "harshith_kulkarni",
      email: "test@example.com",
      password: await bcrypt.hash("password123", 12),
      totalPoints: 1250,
      createdAt: new Date("2025-10-08T18:12:11.545Z"),
      updatedAt: new Date()
    },
    {
      _id: new ObjectId(),
      username: "john_doe",
      email: "john.doe@example.com", 
      password: await bcrypt.hash("password123", 12),
      totalPoints: 850,
      createdAt: new Date("2025-01-10T10:00:00Z"),
      updatedAt: new Date()
    },
    {
      _id: new ObjectId(),
      username: "jane_smith",
      email: "jane.smith@example.com",
      password: await bcrypt.hash("password123", 12),
      totalPoints: 650,
      createdAt: new Date("2025-01-08T14:30:00Z"),
      updatedAt: new Date()
    }
  ];

  // Only insert users that don't already exist
  const insertedUsers = [];
  for (const user of sampleUsers) {
    const existingUser = await users.findOne({ 
      $or: [{ email: user.email }, { username: user.username }] 
    });
    
    if (!existingUser) {
      const result = await users.insertOne(user);
      insertedUsers.push({ ...user, _id: result.insertedId });
      console.log(`✅ Created new user: ${user.email}`);
    } else {
      insertedUsers.push(existingUser);
      console.log(`ℹ️  User already exists: ${user.email}`);
    }
  }
  
  console.log(`✅ Processed ${insertedUsers.length} users (${insertedUsers.length - sampleUsers.length + insertedUsers.filter(u => sampleUsers.find(s => s.email === u.email)).length} existing, ${sampleUsers.length - (insertedUsers.length - sampleUsers.length + insertedUsers.filter(u => sampleUsers.find(s => s.email === u.email)).length)} new)`);
  
  return insertedUsers;
}

async function createSampleUserStats(db) {
  console.log('📊 Creating sample user stats (preserving existing)...');
  
  const userStats = db.collection('userstats');
  const users = await db.collection('users').find({}).toArray();
  
  // DO NOT DELETE existing user stats
  
  const sampleStats = users.map((user, index) => ({
    userId: user._id,
    level: [5, 4, 3][index] || 1,
    points: user.totalPoints,
    streak: [7, 3, 1][index] || 0,
    quizAccuracy: [85.5, 78.2, 92.1][index] || 0,
    dailyGoal: 500,
    totalStudyTime: [180, 120, 90][index] || 0, // in minutes
    lastStudyDate: new Date(),
    badges: getDefaultBadges(index),
    achievements: getDefaultAchievements(index),
    quests: getDefaultQuests(index),
    challenges: [],
    powerUps: [],
    createdAt: user.createdAt,
    updatedAt: new Date()
  }));

  // Only create stats for users who don't have them
  const insertedStats = [];
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const existingStats = await userStats.findOne({ userId: user._id });
    
    if (!existingStats) {
      const stats = {
        userId: user._id,
        level: [5, 4, 3][i] || 1,
        points: user.totalPoints,
        streak: [7, 3, 1][i] || 0,
        quizAccuracy: [85.5, 78.2, 92.1][i] || 0,
        dailyGoal: 500,
        totalStudyTime: [180, 120, 90][i] || 0, // in minutes
        lastStudyDate: new Date(),
        badges: getDefaultBadges(i),
        achievements: getDefaultAchievements(i),
        quests: getDefaultQuests(i),
        challenges: [],
        powerUps: [],
        createdAt: user.createdAt,
        updatedAt: new Date()
      };
      
      const result = await userStats.insertOne(stats);
      insertedStats.push(stats);
      console.log(`✅ Created stats for user: ${user.email}`);
    } else {
      insertedStats.push(existingStats);
      console.log(`ℹ️  Stats already exist for user: ${user.email}`);
    }
  }
  
  console.log(`✅ Processed ${insertedStats.length} user stats`);
  
  return insertedStats;
}

async function createSampleTasks(db) {
  console.log('📚 Creating sample tasks...');
  
  const tasks = db.collection('tasks');
  const users = await db.collection('users').find({}).toArray();
  
  await tasks.deleteMany({});
  
  const sampleTasks = [
    {
      userId: users[0]._id,
      sessionId: "session_1705000001",
      title: "RAG Plus Project Architecture",
      pdfUrl: "/uploads/1757580777858-simplearchitecture.pdf",
      pdfContent: `
user query 
RAG PLUS PROJECT
Convert into 
embeddings
get the 
application 
knowledge 
for that query 
and 
knowledge
construct a prompt with knowledge + application
use advanced prompt design techniques for 
better result
send it to llm for reasoning 
and answering 
-the type of model u 
select also plays major 
role in effectiveness of 
answer
generate the 
output
semantic 
search in dual 
corpus
retrieve 
application 
aligned 
examples 
from 
application 
corpus
KNOWLEDGE CORPUS
APPLICATION CORPUS
APPLY AND TRIAL WITH DIFFERENT 
CHUNKING AND RETRIEVING METHODS FOR 
VECTOR DATABASES`,
      pdfData: { pages: 1, size: "2.1MB" },
      status: "completed",
      studyTime: 45, // 45 minutes
      pointsEarned: 150,
      createdAt: new Date("2025-01-11T08:52:58Z"),
      updatedAt: new Date(),
      completedAt: new Date("2025-01-11T09:37:58Z")
    },
    {
      userId: users[1]._id,
      sessionId: "session_1705000002",
      title: "Machine Learning Fundamentals",
      pdfUrl: "/uploads/ml-fundamentals.pdf",
      pdfContent: "Introduction to supervised and unsupervised learning algorithms, neural networks, and deep learning concepts...",
      pdfData: { pages: 15, size: "5.8MB" },
      status: "completed",
      studyTime: 60, // 60 minutes
      pointsEarned: 120,
      createdAt: new Date("2025-01-10T14:00:00Z"),
      updatedAt: new Date(),
      completedAt: new Date("2025-01-10T15:00:00Z")
    },
    {
      userId: users[0]._id,
      sessionId: "session_1705000003",
      title: "Advanced React Patterns",
      pdfUrl: "/uploads/react-patterns.pdf",
      pdfContent: "Higher-order components, render props, hooks patterns, and performance optimization techniques...",
      pdfData: { pages: 8, size: "3.2MB" },
      status: "in-progress",
      studyTime: 25,
      pointsEarned: 0,
      createdAt: new Date("2025-01-11T16:00:00Z"),
      updatedAt: new Date()
    }
  ];

  const result = await tasks.insertMany(sampleTasks);
  console.log(`✅ Created ${result.insertedCount} tasks`);
  
  return sampleTasks;
}

async function createSampleQuizzes(db) {
  console.log('❓ Creating sample quizzes...');
  
  const quizzes = db.collection('quiz');
  const users = await db.collection('users').find({}).toArray();
  
  await quizzes.deleteMany({});
  
  const sampleQuizzes = [
    {
      sessionId: "session_1705000001",
      userId: users[0]._id,
      questions: [
        {
          question: "What does RAG stand for in AI systems?",
          options: [
            "Retrieval Augmented Generation",
            "Random Access Generator",
            "Rapid Application Gateway",
            "Recursive Algorithm Graph"
          ],
          correctAnswer: 0,
          explanation: "RAG stands for Retrieval Augmented Generation, which combines information retrieval with text generation.",
          difficulty: "easy",
          category: "AI Architecture"
        },
        {
          question: "Which component converts queries into embeddings?",
          options: [
            "Knowledge Corpus",
            "Application Corpus", 
            "Embedding Model",
            "LLM Reasoner"
          ],
          correctAnswer: 2,
          explanation: "The embedding model converts text queries into vector representations for semantic search.",
          difficulty: "medium",
          category: "Vector Processing"
        },
        {
          question: "What is the primary purpose of chunking in vector databases?",
          options: [
            "To reduce storage costs",
            "To improve retrieval accuracy",
            "To speed up processing",
            "All of the above"
          ],
          correctAnswer: 3,
          explanation: "Chunking serves multiple purposes: reducing storage, improving accuracy, and speeding up processing.",
          difficulty: "hard",
          category: "Database Optimization"
        }
      ],
      answers: [
        { questionIndex: 0, selectedAnswer: 0, isCorrect: true, timeSpent: 30 },
        { questionIndex: 1, selectedAnswer: 2, isCorrect: true, timeSpent: 45 },
        { questionIndex: 2, selectedAnswer: 2, isCorrect: false, timeSpent: 60 }
      ],
      score: 66.7,
      totalQuestions: 3,
      correctAnswers: 2,
      timeSpent: 135,
      pointsEarned: 60,
      completed: true,
      createdAt: new Date("2025-01-11T09:00:00Z"),
      completedAt: new Date("2025-01-11T09:02:15Z")
    },
    {
      sessionId: "session_1705000002",
      userId: users[1]._id,
      questions: [
        {
          question: "What is supervised learning?",
          options: [
            "Learning without labeled data",
            "Learning with labeled input-output pairs",
            "Learning through trial and error",
            "Learning from unlabeled data"
          ],
          correctAnswer: 1,
          explanation: "Supervised learning uses labeled data to train models to make predictions.",
          difficulty: "easy",
          category: "Machine Learning"
        },
        {
          question: "Which algorithm is commonly used for classification?",
          options: [
            "K-means clustering",
            "Random Forest",
            "PCA",
            "DBSCAN"
          ],
          correctAnswer: 1,
          explanation: "Random Forest is a popular ensemble method for classification tasks.",
          difficulty: "medium",
          category: "Algorithms"
        }
      ],
      answers: [
        { questionIndex: 0, selectedAnswer: 1, isCorrect: true, timeSpent: 25 },
        { questionIndex: 1, selectedAnswer: 1, isCorrect: true, timeSpent: 35 }
      ],
      score: 100,
      totalQuestions: 2,
      correctAnswers: 2,
      timeSpent: 60,
      pointsEarned: 100,
      completed: true,
      createdAt: new Date("2025-01-10T14:45:00Z"),
      completedAt: new Date("2025-01-10T14:46:00Z")
    }
  ];

  const result = await quizzes.insertMany(sampleQuizzes);
  console.log(`✅ Created ${result.insertedCount} quizzes`);
  
  return sampleQuizzes;
}

function getDefaultBadges(userIndex) {
  const allBadges = [
    { id: 'first-quiz', name: 'First Quiz', description: 'Complete your first quiz', icon: '🎓', earned: false, rarity: 'common' },
    { id: 'streak-7', name: 'Week Streak', description: 'Study for 7 days in a row', icon: '🔥', earned: false, rarity: 'rare' },
    { id: 'points-100', name: 'Centurion', description: 'Earn 100 points', icon: '💯', earned: false, rarity: 'common' },
    { id: 'perfect-score', name: 'Perfect Score', description: 'Get 100% on a quiz', icon: '🏆', earned: false, rarity: 'rare' },
    { id: 'early-bird', name: 'Early Bird', description: 'Study before 8 AM', icon: '🐦', earned: false, rarity: 'common' },
    { id: 'night-owl', name: 'Night Owl', description: 'Study after 10 PM', icon: '🦉', earned: false, rarity: 'common' },
    { id: 'speed-demon', name: 'Speed Demon', description: 'Finish a quiz in under 5 minutes', icon: '⚡', earned: false, rarity: 'epic' },
    { id: 'scholar', name: 'Scholar', description: 'Complete 10 quizzes', icon: '📚', earned: false, rarity: 'epic' }
  ];

  // Award some badges based on user index
  if (userIndex === 0) {
    allBadges[0].earned = true; // First Quiz
    allBadges[0].earnedAt = new Date("2025-01-11T09:02:15Z");
    allBadges[1].earned = true; // Week Streak
    allBadges[1].earnedAt = new Date("2025-01-11T00:00:00Z");
    allBadges[2].earned = true; // Centurion
    allBadges[2].earnedAt = new Date("2025-01-10T15:00:00Z");
  } else if (userIndex === 1) {
    allBadges[0].earned = true; // First Quiz
    allBadges[0].earnedAt = new Date("2025-01-10T14:46:00Z");
    allBadges[3].earned = true; // Perfect Score
    allBadges[3].earnedAt = new Date("2025-01-10T14:46:00Z");
  }

  return allBadges;
}

function getDefaultAchievements(userIndex) {
  const allAchievements = [
    { id: 'first-session', name: 'First Session', description: 'Complete your first study session', icon: '🎯', earned: false, points: 10 },
    { id: 'marathon-study', name: 'Marathon Study', description: 'Study for 2 hours in one session', icon: '🏃', earned: false, points: 50 },
    { id: 'consistent-week', name: 'Consistent Week', description: 'Study every day for a week', icon: '📅', earned: false, points: 75 },
    { id: 'quiz-expert', name: 'Quiz Expert', description: 'Score 90% or higher on 5 quizzes', icon: '📝', earned: false, points: 100 },
    { id: 'point-master', name: 'Point Master', description: 'Earn 1000 total points', icon: '⭐', earned: false, points: 200 }
  ];

  // Award some achievements based on user index
  if (userIndex === 0) {
    allAchievements[0].earned = true; // First Session
    allAchievements[0].earnedAt = new Date("2025-01-11T09:37:58Z");
    allAchievements[2].earned = true; // Consistent Week
    allAchievements[2].earnedAt = new Date("2025-01-11T00:00:00Z");
    allAchievements[4].earned = true; // Point Master
    allAchievements[4].earnedAt = new Date("2025-01-10T15:00:00Z");
  } else if (userIndex === 1) {
    allAchievements[0].earned = true; // First Session
    allAchievements[0].earnedAt = new Date("2025-01-10T15:00:00Z");
  }

  return allAchievements;
}

function getDefaultQuests(userIndex) {
  const allQuests = [
    { id: 'study-60', name: 'Hour Master', description: 'Study for 60 minutes total', icon: '⏱️', progress: 0, target: 60, reward: 50, completed: false, category: 'study' },
    { id: 'quiz-5', name: 'Quiz Master', description: 'Complete 5 quizzes', icon: '📝', progress: 0, target: 5, reward: 75, completed: false, category: 'quiz' },
    { id: 'ai-chat-10', name: 'Chat Champion', description: 'Ask 10 questions to AI tutor', icon: '💬', progress: 0, target: 10, reward: 40, completed: false, category: 'ai' },
    { id: 'streak-30', name: 'Monthly Streak', description: 'Maintain a 30-day study streak', icon: '📅', progress: 0, target: 30, reward: 150, completed: false, category: 'consistency' },
    { id: 'daily-goal-7', name: 'Goal Achiever', description: 'Meet daily goal for 7 days', icon: '🎯', progress: 0, target: 7, reward: 100, completed: false, category: 'consistency' }
  ];

  // Set progress based on user index
  if (userIndex === 0) {
    allQuests[0].progress = 105; // Hour Master - completed
    allQuests[0].completed = true;
    allQuests[0].completedAt = new Date("2025-01-11T09:37:58Z");
    allQuests[1].progress = 2; // Quiz Master - in progress
    allQuests[2].progress = 5; // Chat Champion - in progress
    allQuests[3].progress = 7; // Monthly Streak - in progress
  } else if (userIndex === 1) {
    allQuests[0].progress = 60; // Hour Master - completed
    allQuests[0].completed = true;
    allQuests[0].completedAt = new Date("2025-01-10T15:00:00Z");
    allQuests[1].progress = 1; // Quiz Master - in progress
    allQuests[2].progress = 2; // Chat Champion - in progress
  }

  return allQuests;
}

// Run the migration
migrateToNewSchema().catch(console.error);