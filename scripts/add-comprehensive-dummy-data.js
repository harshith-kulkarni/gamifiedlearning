#!/usr/bin/env node

/**
 * Add Comprehensive Dummy Data
 * 
 * This script adds rich dummy data to all test users to showcase
 * all dashboard components and analytics functionality.
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

async function addComprehensiveDummyData() {
  let client;
  
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    client = new MongoClient(uri, options);
    await client.connect();
    
    const db = client.db('studymaster');
    console.log('✅ Connected to StudyMaster database');

    // Get all users
    const users = await db.collection('users').find({}).toArray();
    console.log(`👥 Found ${users.length} users to enhance with dummy data`);

    for (const user of users) {
      console.log(`\n📊 Adding comprehensive data for ${user.email}...`);
      
      // Add study sessions (tasks)
      await addStudySessions(db, user);
      
      // Add quiz data
      await addQuizData(db, user);
      
      // Update user stats with rich gamification data
      await updateUserStats(db, user);
      
      console.log(`✅ Enhanced data for ${user.email}`);
    }

    console.log('\n🎉 Comprehensive dummy data added successfully!');
    console.log('\n📈 Dashboard components now have rich data to display:');
    console.log('• Study Timer - Enhanced with session tracking');
    console.log('• Analytics - Multiple sessions with varied performance');
    console.log('• Gamification - Badges, quests, achievements with progress');
    console.log('• Recent Sessions - Detailed session history');
    console.log('• Progress Visualization - Trends and patterns');
    
  } catch (error) {
    console.error('❌ Failed to add dummy data:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

async function addStudySessions(db, user) {
  const tasks = db.collection('tasks');
  
  // Generate 15 study sessions over the past 30 days
  const sessions = [];
  const now = new Date();
  
  for (let i = 0; i < 15; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const sessionDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    
    const topics = [
      'Machine Learning Fundamentals',
      'React Advanced Patterns',
      'Database Design Principles',
      'Algorithm Analysis',
      'System Architecture',
      'Data Structures Deep Dive',
      'Web Security Best Practices',
      'Cloud Computing Concepts',
      'API Design Patterns',
      'Performance Optimization',
      'Testing Strategies',
      'DevOps Fundamentals',
      'Microservices Architecture',
      'Frontend Frameworks',
      'Backend Development'
    ];
    
    const studyTime = 15 + Math.floor(Math.random() * 90); // 15-105 minutes
    const pointsEarned = Math.floor(studyTime * (0.8 + Math.random() * 0.4)); // Variable points
    
    const session = {
      userId: user._id,
      sessionId: `session_${Date.now()}_${i}`,
      title: topics[i % topics.length],
      pdfUrl: `/uploads/${topics[i % topics.length].toLowerCase().replace(/\s+/g, '-')}.pdf`,
      pdfContent: `Study material for ${topics[i % topics.length]}. This session covers key concepts and practical applications.`,
      pdfData: { pages: 5 + Math.floor(Math.random() * 15), size: `${2 + Math.random() * 8}MB` },
      status: 'completed',
      studyTime,
      pointsEarned,
      createdAt: sessionDate,
      updatedAt: sessionDate,
      completedAt: new Date(sessionDate.getTime() + (studyTime * 60 * 1000))
    };
    
    sessions.push(session);
  }
  
  // Remove existing sessions for this user and add new ones
  await tasks.deleteMany({ userId: user._id });
  await tasks.insertMany(sessions);
  
  console.log(`  📚 Added ${sessions.length} study sessions`);
}

async function addQuizData(db, user) {
  const quizzes = db.collection('quiz');
  
  // Get user's tasks to create corresponding quizzes
  const userTasks = await db.collection('tasks').find({ userId: user._id }).toArray();
  
  const quizData = [];
  
  for (let i = 0; i < Math.min(userTasks.length, 12); i++) {
    const task = userTasks[i];
    const questionCount = 3 + Math.floor(Math.random() * 7); // 3-10 questions
    
    // Generate questions
    const questions = [];
    for (let q = 0; q < questionCount; q++) {
      questions.push({
        question: `Question ${q + 1} about ${task.title}?`,
        options: [
          `Option A for ${task.title}`,
          `Option B for ${task.title}`,
          `Option C for ${task.title}`,
          `Option D for ${task.title}`
        ],
        correctAnswer: Math.floor(Math.random() * 4),
        explanation: `This is the explanation for question ${q + 1} about ${task.title}.`,
        difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
        category: task.title.split(' ')[0]
      });
    }
    
    // Generate answers with realistic performance
    const answers = [];
    let correctAnswers = 0;
    
    for (let q = 0; q < questionCount; q++) {
      const isCorrect = Math.random() > 0.25; // 75% accuracy
      if (isCorrect) correctAnswers++;
      
      answers.push({
        questionIndex: q,
        selectedAnswer: isCorrect ? questions[q].correctAnswer : (questions[q].correctAnswer + 1) % 4,
        isCorrect,
        timeSpent: 30 + Math.floor(Math.random() * 60) // 30-90 seconds per question
      });
    }
    
    const score = (correctAnswers / questionCount) * 100;
    const timeSpent = answers.reduce((total, answer) => total + answer.timeSpent, 0);
    const pointsEarned = Math.floor(score * 0.8 + Math.random() * 40); // Score-based points
    
    const quiz = {
      sessionId: task.sessionId,
      userId: user._id,
      questions,
      answers,
      score,
      totalQuestions: questionCount,
      correctAnswers,
      timeSpent,
      pointsEarned,
      completed: true,
      createdAt: task.createdAt,
      completedAt: task.completedAt
    };
    
    quizData.push(quiz);
  }
  
  // Remove existing quizzes for this user and add new ones
  await quizzes.deleteMany({ userId: user._id });
  if (quizData.length > 0) {
    await quizzes.insertMany(quizData);
  }
  
  console.log(`  ❓ Added ${quizData.length} quizzes with realistic performance data`);
}

async function updateUserStats(db, user) {
  const userStats = db.collection('userstats');
  const users = db.collection('users');
  
  // Calculate totals from sessions and quizzes
  const userTasks = await db.collection('tasks').find({ userId: user._id }).toArray();
  const userQuizzes = await db.collection('quiz').find({ userId: user._id }).toArray();
  
  const totalStudyTime = userTasks.reduce((sum, task) => sum + task.studyTime, 0);
  const totalPoints = userTasks.reduce((sum, task) => sum + task.pointsEarned, 0);
  const averageScore = userQuizzes.length > 0 
    ? userQuizzes.reduce((sum, quiz) => sum + quiz.score, 0) / userQuizzes.length 
    : 0;
  
  // Calculate level (100 points per level + quest bonuses)
  const level = Math.floor(totalPoints / 100) + 1;
  
  // Calculate streak (simulate realistic streak)
  const streak = Math.min(Math.floor(userTasks.length / 2), 15);
  
  // Enhanced badges with some earned
  const badges = [
    { id: 'first-quiz', name: 'First Quiz', description: 'Complete your first quiz', icon: '🎓', earned: userQuizzes.length > 0, earnedAt: userQuizzes.length > 0 ? userQuizzes[0].createdAt : undefined, rarity: 'common' },
    { id: 'streak-7', name: 'Week Streak', description: 'Study for 7 days in a row', icon: '🔥', earned: streak >= 7, earnedAt: streak >= 7 ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : undefined, rarity: 'rare' },
    { id: 'points-100', name: 'Centurion', description: 'Earn 100 points', icon: '💯', earned: totalPoints >= 100, earnedAt: totalPoints >= 100 ? userTasks[2]?.createdAt : undefined, rarity: 'common' },
    { id: 'perfect-score', name: 'Perfect Score', description: 'Get 100% on a quiz', icon: '🏆', earned: userQuizzes.some(q => q.score === 100), earnedAt: userQuizzes.find(q => q.score === 100)?.createdAt, rarity: 'rare' },
    { id: 'early-bird', name: 'Early Bird', description: 'Study before 8 AM', icon: '🐦', earned: Math.random() > 0.5, earnedAt: Math.random() > 0.5 ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) : undefined, rarity: 'common' },
    { id: 'night-owl', name: 'Night Owl', description: 'Study after 10 PM', icon: '🦉', earned: Math.random() > 0.7, earnedAt: Math.random() > 0.7 ? new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) : undefined, rarity: 'common' },
    { id: 'speed-demon', name: 'Speed Demon', description: 'Finish a quiz in under 5 minutes', icon: '⚡', earned: userQuizzes.some(q => q.timeSpent < 300), earnedAt: userQuizzes.find(q => q.timeSpent < 300)?.createdAt, rarity: 'epic' },
    { id: 'scholar', name: 'Scholar', description: 'Complete 10 quizzes', icon: '📚', earned: userQuizzes.length >= 10, earnedAt: userQuizzes.length >= 10 ? userQuizzes[9]?.createdAt : undefined, rarity: 'epic' }
  ];
  
  // Enhanced achievements with progress
  const achievements = [
    { id: 'first-session', name: 'First Session', description: 'Complete your first study session', icon: '🎯', earned: userTasks.length > 0, earnedAt: userTasks.length > 0 ? userTasks[0].createdAt : undefined, points: 10 },
    { id: 'marathon-study', name: 'Marathon Study', description: 'Study for 2 hours in one session', icon: '🏃', earned: userTasks.some(t => t.studyTime >= 120), earnedAt: userTasks.find(t => t.studyTime >= 120)?.createdAt, points: 50 },
    { id: 'consistent-week', name: 'Consistent Week', description: 'Study every day for a week', icon: '📅', earned: streak >= 7, earnedAt: streak >= 7 ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : undefined, points: 75 },
    { id: 'quiz-expert', name: 'Quiz Expert', description: 'Score 90% or higher on 5 quizzes', icon: '📝', earned: userQuizzes.filter(q => q.score >= 90).length >= 5, earnedAt: userQuizzes.filter(q => q.score >= 90).length >= 5 ? userQuizzes.filter(q => q.score >= 90)[4]?.createdAt : undefined, points: 100 },
    { id: 'point-master', name: 'Point Master', description: 'Earn 1000 total points', icon: '⭐', earned: totalPoints >= 1000, earnedAt: totalPoints >= 1000 ? userTasks[userTasks.length - 1]?.createdAt : undefined, points: 200 }
  ];
  
  // Enhanced quests with realistic progress
  const quests = [
    { 
      id: 'study-60', 
      name: 'Hour Master', 
      description: 'Study for 60 minutes total', 
      icon: '⏱️', 
      progress: Math.min(totalStudyTime, 60), 
      target: 60, 
      reward: 50, 
      completed: totalStudyTime >= 60,
      completedAt: totalStudyTime >= 60 ? userTasks[2]?.createdAt : undefined,
      category: 'study' 
    },
    { 
      id: 'quiz-5', 
      name: 'Quiz Master', 
      description: 'Complete 5 quizzes', 
      icon: '📝', 
      progress: Math.min(userQuizzes.length, 5), 
      target: 5, 
      reward: 75, 
      completed: userQuizzes.length >= 5,
      completedAt: userQuizzes.length >= 5 ? userQuizzes[4]?.createdAt : undefined,
      category: 'quiz' 
    },
    { 
      id: 'ai-chat-10', 
      name: 'Chat Champion', 
      description: 'Ask 10 questions to AI tutor', 
      icon: '💬', 
      progress: Math.floor(Math.random() * 8), 
      target: 10, 
      reward: 40, 
      completed: false, 
      category: 'ai' 
    },
    { 
      id: 'streak-30', 
      name: 'Monthly Streak', 
      description: 'Maintain a 30-day study streak', 
      icon: '📅', 
      progress: streak, 
      target: 30, 
      reward: 150, 
      completed: streak >= 30,
      completedAt: streak >= 30 ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : undefined,
      category: 'consistency' 
    },
    { 
      id: 'daily-goal-7', 
      name: 'Goal Achiever', 
      description: 'Meet daily goal for 7 days', 
      icon: '🎯', 
      progress: Math.floor(streak / 2), 
      target: 7, 
      reward: 100, 
      completed: streak >= 14,
      completedAt: streak >= 14 ? new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) : undefined,
      category: 'consistency' 
    }
  ];
  
  // Add some active power-ups for demonstration
  const powerUps = [];
  
  const updatedStats = {
    userId: user._id,
    level,
    points: totalPoints,
    streak,
    quizAccuracy: averageScore,
    dailyGoal: 500,
    totalStudyTime,
    lastStudyDate: userTasks.length > 0 ? userTasks[userTasks.length - 1].createdAt : new Date(),
    badges,
    achievements,
    quests,
    challenges: [],
    powerUps,
    createdAt: user.createdAt,
    updatedAt: new Date()
  };
  
  // Update user stats
  await userStats.updateOne(
    { userId: user._id },
    { $set: updatedStats },
    { upsert: true }
  );
  
  // Update user total points
  await users.updateOne(
    { _id: user._id },
    { 
      $set: { 
        totalPoints,
        updatedAt: new Date()
      }
    }
  );
  
  console.log(`  📊 Updated user stats: Level ${level}, ${totalPoints} points, ${streak} day streak`);
  console.log(`  🏅 Badges earned: ${badges.filter(b => b.earned).length}/${badges.length}`);
  console.log(`  🏆 Achievements unlocked: ${achievements.filter(a => a.earned).length}/${achievements.length}`);
  console.log(`  🎯 Quests completed: ${quests.filter(q => q.completed).length}/${quests.length}`);
}

// Run the script
addComprehensiveDummyData().catch(console.error);