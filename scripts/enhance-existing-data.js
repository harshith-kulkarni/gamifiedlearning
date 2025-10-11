#!/usr/bin/env node

/**
 * Enhance Existing Data
 * 
 * This script enhances existing user data with more study sessions,
 * quizzes, and updates stats to showcase dashboard functionality.
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

async function enhanceExistingData() {
  let client;
  
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    client = new MongoClient(uri, options);
    await client.connect();
    
    const db = client.db('studymaster');
    console.log('✅ Connected to StudyMaster database');

    // Get all users
    const users = await db.collection('users').find({}).toArray();
    console.log(`👥 Found ${users.length} users to enhance`);

    for (const user of users) {
      console.log(`\n📊 Enhancing data for ${user.email}...`);
      
      // Add more study sessions
      await addMoreStudySessions(db, user);
      
      // Add more quiz data
      await addMoreQuizData(db, user);
      
      // Update user stats
      await updateUserStatsEnhanced(db, user);
      
      console.log(`✅ Enhanced data for ${user.email}`);
    }

    console.log('\n🎉 Data enhancement completed successfully!');
    
  } catch (error) {
    console.error('❌ Failed to enhance data:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

async function addMoreStudySessions(db, user) {
  const tasks = db.collection('tasks');
  
  // Check existing sessions
  const existingSessions = await tasks.find({ userId: user._id }).toArray();
  console.log(`  📚 Found ${existingSessions.length} existing sessions`);
  
  // Add 10 more sessions over the past 20 days
  const sessions = [];
  const now = new Date();
  
  const topics = [
    'Advanced JavaScript Concepts',
    'Python Data Science',
    'React Performance Optimization',
    'Node.js Backend Development',
    'Database Query Optimization',
    'System Design Fundamentals',
    'API Security Best Practices',
    'Cloud Architecture Patterns',
    'DevOps and CI/CD',
    'Mobile App Development'
  ];
  
  for (let i = 0; i < 10; i++) {
    const daysAgo = Math.floor(Math.random() * 20) + 1;
    const sessionDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    
    const studyTime = 20 + Math.floor(Math.random() * 80); // 20-100 minutes
    const pointsEarned = Math.floor(studyTime * (0.7 + Math.random() * 0.6)); // Variable points
    
    const session = {
      userId: user._id,
      sessionId: `session_enhanced_${Date.now()}_${i}`,
      title: topics[i],
      pdfUrl: `/uploads/${topics[i].toLowerCase().replace(/\s+/g, '-')}.pdf`,
      pdfContent: `Enhanced study material for ${topics[i]}. Comprehensive coverage of advanced topics.`,
      pdfData: { pages: 8 + Math.floor(Math.random() * 12), size: `${3 + Math.random() * 6}MB` },
      status: 'completed',
      studyTime,
      pointsEarned,
      createdAt: sessionDate,
      updatedAt: sessionDate,
      completedAt: new Date(sessionDate.getTime() + (studyTime * 60 * 1000))
    };
    
    sessions.push(session);
  }
  
  await tasks.insertMany(sessions);
  console.log(`  📚 Added ${sessions.length} new study sessions`);
}

async function addMoreQuizData(db, user) {
  const quizzes = db.collection('quiz');
  
  // Get user's new tasks to create corresponding quizzes
  const userTasks = await db.collection('tasks').find({ 
    userId: user._id,
    sessionId: { $regex: 'enhanced' }
  }).toArray();
  
  const quizData = [];
  
  for (const task of userTasks) {
    const questionCount = 4 + Math.floor(Math.random() * 6); // 4-10 questions
    
    // Generate questions
    const questions = [];
    for (let q = 0; q < questionCount; q++) {
      questions.push({
        question: `Advanced question ${q + 1} about ${task.title}?`,
        options: [
          `Correct answer for ${task.title}`,
          `Incorrect option A`,
          `Incorrect option B`,
          `Incorrect option C`
        ],
        correctAnswer: 0, // First option is always correct for simplicity
        explanation: `Detailed explanation for question ${q + 1} about ${task.title}.`,
        difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
        category: task.title.split(' ')[0]
      });
    }
    
    // Generate answers with varied performance
    const answers = [];
    let correctAnswers = 0;
    
    for (let q = 0; q < questionCount; q++) {
      const isCorrect = Math.random() > 0.2; // 80% accuracy
      if (isCorrect) correctAnswers++;
      
      answers.push({
        questionIndex: q,
        selectedAnswer: isCorrect ? 0 : Math.floor(Math.random() * 3) + 1,
        isCorrect,
        timeSpent: 25 + Math.floor(Math.random() * 70) // 25-95 seconds per question
      });
    }
    
    const score = (correctAnswers / questionCount) * 100;
    const timeSpent = answers.reduce((total, answer) => total + answer.timeSpent, 0);
    const pointsEarned = Math.floor(score * 0.9 + Math.random() * 30);
    
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
  
  if (quizData.length > 0) {
    await quizzes.insertMany(quizData);
  }
  
  console.log(`  ❓ Added ${quizData.length} new quizzes`);
}

async function updateUserStatsEnhanced(db, user) {
  const userStats = db.collection('userstats');
  const users = db.collection('users');
  
  // Get all user data
  const allUserTasks = await db.collection('tasks').find({ userId: user._id }).toArray();
  const allUserQuizzes = await db.collection('quiz').find({ userId: user._id }).toArray();
  const currentStats = await userStats.findOne({ userId: user._id });
  
  if (!currentStats) {
    console.log(`  ⚠️  No existing stats found for ${user.email}, skipping`);
    return;
  }
  
  // Calculate new totals
  const totalStudyTime = allUserTasks.reduce((sum, task) => sum + task.studyTime, 0);
  const totalPoints = allUserTasks.reduce((sum, task) => sum + task.pointsEarned, 0);
  const averageScore = allUserQuizzes.length > 0 
    ? allUserQuizzes.reduce((sum, quiz) => sum + quiz.score, 0) / allUserQuizzes.length 
    : 0;
  
  // Calculate new level
  const level = Math.floor(totalPoints / 100) + 1;
  
  // Update streak (simulate growth)
  const newStreak = Math.min(currentStats.streak + Math.floor(allUserTasks.length / 3), 25);
  
  // Update badges with new achievements
  const updatedBadges = currentStats.badges.map(badge => {
    if (!badge.earned) {
      switch (badge.id) {
        case 'perfect-score':
          if (allUserQuizzes.some(q => q.score === 100)) {
            return { ...badge, earned: true, earnedAt: allUserQuizzes.find(q => q.score === 100).createdAt };
          }
          break;
        case 'speed-demon':
          if (allUserQuizzes.some(q => q.timeSpent < 300)) {
            return { ...badge, earned: true, earnedAt: allUserQuizzes.find(q => q.timeSpent < 300).createdAt };
          }
          break;
        case 'scholar':
          if (allUserQuizzes.length >= 10) {
            return { ...badge, earned: true, earnedAt: allUserQuizzes[9].createdAt };
          }
          break;
        case 'early-bird':
          return { ...badge, earned: true, earnedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) };
        case 'night-owl':
          if (Math.random() > 0.5) {
            return { ...badge, earned: true, earnedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) };
          }
          break;
      }
    }
    return badge;
  });
  
  // Update achievements
  const updatedAchievements = currentStats.achievements.map(achievement => {
    if (!achievement.earned) {
      switch (achievement.id) {
        case 'marathon-study':
          if (allUserTasks.some(t => t.studyTime >= 120)) {
            return { ...achievement, earned: true, earnedAt: allUserTasks.find(t => t.studyTime >= 120).createdAt };
          }
          break;
        case 'quiz-expert':
          if (allUserQuizzes.filter(q => q.score >= 90).length >= 5) {
            return { ...achievement, earned: true, earnedAt: allUserQuizzes.filter(q => q.score >= 90)[4].createdAt };
          }
          break;
      }
    }
    return achievement;
  });
  
  // Update quests
  const updatedQuests = currentStats.quests.map(quest => {
    switch (quest.id) {
      case 'study-60':
        const newStudyProgress = Math.min(totalStudyTime, quest.target);
        return {
          ...quest,
          progress: newStudyProgress,
          completed: newStudyProgress >= quest.target,
          completedAt: newStudyProgress >= quest.target && !quest.completed ? new Date() : quest.completedAt
        };
      case 'quiz-5':
        const newQuizProgress = Math.min(allUserQuizzes.length, quest.target);
        return {
          ...quest,
          progress: newQuizProgress,
          completed: newQuizProgress >= quest.target,
          completedAt: newQuizProgress >= quest.target && !quest.completed ? new Date() : quest.completedAt
        };
      case 'ai-chat-10':
        // Simulate some AI chat progress
        const aiProgress = Math.min(quest.progress + Math.floor(Math.random() * 3), quest.target);
        return {
          ...quest,
          progress: aiProgress,
          completed: aiProgress >= quest.target,
          completedAt: aiProgress >= quest.target && !quest.completed ? new Date() : quest.completedAt
        };
      case 'streak-30':
        return {
          ...quest,
          progress: newStreak,
          completed: newStreak >= quest.target,
          completedAt: newStreak >= quest.target && !quest.completed ? new Date() : quest.completedAt
        };
      default:
        return quest;
    }
  });
  
  // Update user stats
  await userStats.updateOne(
    { userId: user._id },
    {
      $set: {
        level,
        points: totalPoints,
        streak: newStreak,
        quizAccuracy: averageScore,
        totalStudyTime,
        lastStudyDate: allUserTasks.length > 0 ? allUserTasks[allUserTasks.length - 1].createdAt : currentStats.lastStudyDate,
        badges: updatedBadges,
        achievements: updatedAchievements,
        quests: updatedQuests,
        updatedAt: new Date()
      }
    }
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
  
  console.log(`  📊 Updated stats: Level ${level}, ${totalPoints} points, ${newStreak} day streak`);
  console.log(`  🏅 Badges earned: ${updatedBadges.filter(b => b.earned).length}/${updatedBadges.length}`);
  console.log(`  🏆 Achievements: ${updatedAchievements.filter(a => a.earned).length}/${updatedAchievements.length}`);
  console.log(`  🎯 Quests completed: ${updatedQuests.filter(q => q.completed).length}/${updatedQuests.length}`);
}

// Run the script
enhanceExistingData().catch(console.error);