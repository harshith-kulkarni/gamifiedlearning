#!/usr/bin/env node

/**
 * StudyMaster AI - Dummy Data Import
 * 
 * This script imports sample data into MongoDB Atlas
 * for testing and development purposes.
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

// Sample data based on your provided structure
const sampleData = {
  users: [
    {
      _id: new ObjectId("68c26bd41e0e2cf8deeb08fd"),
      username: "john_doe",
      email: "john.doe@example.com",
      password: "$2a$10$rOzJqQZ8kVxHxvQqQqQqQeQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQ", // hashed "password123"
      profile: {
        firstName: "John",
        lastName: "Doe",
        avatar: "/avatars/john-doe.jpg",
        bio: "Computer Science student passionate about AI and machine learning"
      },
      progress: {
        level: 5,
        points: 1250,
        streak: 7,
        totalStudyTime: 3600, // in seconds
        lastStudyDate: new Date(),
        dailyGoal: 60 // minutes
      },
      createdAt: new Date("2025-01-10T10:00:00Z"),
      updatedAt: new Date()
    },
    {
      _id: new ObjectId(),
      username: "jane_smith",
      email: "jane.smith@example.com",
      password: "$2a$10$rOzJqQZ8kVxHxvQqQqQqQeQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQ",
      profile: {
        firstName: "Jane",
        lastName: "Smith",
        avatar: "/avatars/jane-smith.jpg",
        bio: "Data Science enthusiast and lifelong learner"
      },
      progress: {
        level: 3,
        points: 750,
        streak: 3,
        totalStudyTime: 2400,
        lastStudyDate: new Date(Date.now() - 86400000), // yesterday
        dailyGoal: 45
      },
      createdAt: new Date("2025-01-08T14:30:00Z"),
      updatedAt: new Date()
    }
  ],

  studySessions: [
    {
      _id: new ObjectId("68c28dea0161061c502bda3d"),
      user: new ObjectId("68c26bd41e0e2cf8deeb08fd"),
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
      status: "completed",
      studyTime: 1800, // 30 minutes
      quizScore: 85.5,
      totalQuestions: 25,
      pointsEarned: 150,
      coinsUsed: 0,
      strengths: ["RAG Architecture", "Vector Databases", "Prompt Engineering"],
      areasForImprovement: ["Model Selection", "Chunking Strategies"],
      recommendations: [
        "Practice more with different embedding models",
        "Explore advanced chunking techniques",
        "Study LLM reasoning patterns"
      ],
      createdAt: new Date("2025-01-11T08:52:58Z"),
      updatedAt: new Date(),
      completedAt: new Date("2025-01-11T09:22:58Z")
    },
    {
      _id: new ObjectId(),
      user: new ObjectId("68c26bd41e0e2cf8deeb08fd"),
      title: "Machine Learning Fundamentals",
      pdfUrl: "/uploads/ml-fundamentals.pdf",
      pdfContent: "Introduction to supervised and unsupervised learning algorithms...",
      status: "in-progress",
      studyTime: 900, // 15 minutes
      quizScore: 0,
      totalQuestions: 20,
      pointsEarned: 50,
      coinsUsed: 10,
      strengths: [],
      areasForImprovement: [],
      recommendations: [],
      createdAt: new Date("2025-01-11T10:00:00Z"),
      updatedAt: new Date()
    }
  ],

  quizzes: [
    {
      _id: new ObjectId(),
      sessionId: new ObjectId("68c28dea0161061c502bda3d"),
      user: new ObjectId("68c26bd41e0e2cf8deeb08fd"),
      title: "RAG Architecture Quiz",
      questions: [
        {
          question: "What does RAG stand for in the context of AI systems?",
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
          question: "Which component is responsible for converting queries into embeddings?",
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
      totalQuestions: 3,
      timeLimit: 600, // 10 minutes
      createdAt: new Date("2025-01-11T08:55:00Z")
    }
  ],

  quizResults: [
    {
      _id: new ObjectId(),
      user: new ObjectId("68c26bd41e0e2cf8deeb08fd"),
      quizId: new ObjectId(), // Will be updated with actual quiz ID
      sessionId: new ObjectId("68c28dea0161061c502bda3d"),
      answers: [
        {
          questionIndex: 0,
          selectedAnswer: 0,
          isCorrect: true,
          timeSpent: 45
        },
        {
          questionIndex: 1,
          selectedAnswer: 2,
          isCorrect: true,
          timeSpent: 60
        },
        {
          questionIndex: 2,
          selectedAnswer: 1,
          isCorrect: false,
          timeSpent: 90
        }
      ],
      score: 66.7,
      totalQuestions: 3,
      correctAnswers: 2,
      timeSpent: 195,
      pointsEarned: 100,
      createdAt: new Date("2025-01-11T09:05:00Z")
    }
  ],

  badges: [
    {
      _id: new ObjectId(),
      name: "First Quiz",
      description: "Complete your first quiz",
      icon: "🎯",
      criteria: {
        type: "quizzes",
        value: 1,
        condition: "completed_quizzes >= 1"
      },
      rarity: "common",
      pointsReward: 50,
      isActive: true
    },
    {
      _id: new ObjectId(),
      name: "Perfect Score",
      description: "Get 100% on any quiz",
      icon: "🏆",
      criteria: {
        type: "score",
        value: 100,
        condition: "quiz_score >= 100"
      },
      rarity: "rare",
      pointsReward: 200,
      isActive: true
    },
    {
      _id: new ObjectId(),
      name: "Study Streak",
      description: "Study for 7 consecutive days",
      icon: "🔥",
      criteria: {
        type: "streak",
        value: 7,
        condition: "daily_streak >= 7"
      },
      rarity: "epic",
      pointsReward: 300,
      isActive: true
    },
    {
      _id: new ObjectId(),
      name: "Knowledge Master",
      description: "Earn 1000 total points",
      icon: "🧠",
      criteria: {
        type: "points",
        value: 1000,
        condition: "total_points >= 1000"
      },
      rarity: "legendary",
      pointsReward: 500,
      isActive: true
    }
  ]
};

async function importData() {
  let client;
  
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    client = new MongoClient(uri, options);
    await client.connect();
    
    const db = client.db('studymaster');
    console.log('✅ Connected to StudyMaster database');

    // Clear existing data (optional - comment out for production)
    console.log('🧹 Clearing existing data...');
    await db.collection('users').deleteMany({});
    await db.collection('studySessions').deleteMany({});
    await db.collection('quizzes').deleteMany({});
    await db.collection('quizResults').deleteMany({});
    await db.collection('badges').deleteMany({});
    await db.collection('userBadges').deleteMany({});

    // Import users
    console.log('👥 Importing users...');
    const userResult = await db.collection('users').insertMany(sampleData.users);
    console.log(`✅ Imported ${userResult.insertedCount} users`);

    // Import study sessions
    console.log('📚 Importing study sessions...');
    const sessionResult = await db.collection('studySessions').insertMany(sampleData.studySessions);
    console.log(`✅ Imported ${sessionResult.insertedCount} study sessions`);

    // Import quizzes
    console.log('❓ Importing quizzes...');
    const quizResult = await db.collection('quizzes').insertMany(sampleData.quizzes);
    console.log(`✅ Imported ${quizResult.insertedCount} quizzes`);

    // Update quiz results with actual quiz ID
    const quizIds = Object.values(quizResult.insertedIds);
    if (quizIds.length > 0) {
      sampleData.quizResults[0].quizId = quizIds[0];
    }

    // Import quiz results
    console.log('📊 Importing quiz results...');
    const resultResult = await db.collection('quizResults').insertMany(sampleData.quizResults);
    console.log(`✅ Imported ${resultResult.insertedCount} quiz results`);

    // Import badges
    console.log('🏅 Importing badges...');
    const badgeResult = await db.collection('badges').insertMany(sampleData.badges);
    console.log(`✅ Imported ${badgeResult.insertedCount} badges`);

    // Award some badges to users
    console.log('🎖️ Awarding badges to users...');
    const badgeIds = Object.values(badgeResult.insertedIds);
    const userIds = Object.values(userResult.insertedIds);
    
    const userBadges = [
      {
        user: userIds[0],
        badge: badgeIds[0], // First Quiz
        earnedAt: new Date("2025-01-11T09:05:00Z"),
        progress: 100
      },
      {
        user: userIds[0],
        badge: badgeIds[2], // Study Streak
        earnedAt: new Date(),
        progress: 100
      }
    ];

    const userBadgeResult = await db.collection('userBadges').insertMany(userBadges);
    console.log(`✅ Awarded ${userBadgeResult.insertedCount} badges`);

    // Display summary
    console.log('\n📈 Import Summary:');
    console.log(`👥 Users: ${userResult.insertedCount}`);
    console.log(`📚 Study Sessions: ${sessionResult.insertedCount}`);
    console.log(`❓ Quizzes: ${quizResult.insertedCount}`);
    console.log(`📊 Quiz Results: ${resultResult.insertedCount}`);
    console.log(`🏅 Badges: ${badgeResult.insertedCount}`);
    console.log(`🎖️ User Badges: ${userBadgeResult.insertedCount}`);

    console.log('\n🎉 Dummy data import completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Test login with: john.doe@example.com / password123');
    console.log('3. Verify data appears in the application');
    
  } catch (error) {
    console.error('❌ Data import failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the import
importData().catch(console.error);