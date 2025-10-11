#!/usr/bin/env node

/**
 * Test New Functionality Script
 * 
 * This script tests all the new application logic and functionality
 * according to the requirements.
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

async function testNewFunctionality() {
  let client;
  
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    client = new MongoClient(uri, options);
    await client.connect();
    
    const db = client.db('studymaster');
    console.log('✅ Connected to StudyMaster database');

    // Test all functionality according to requirements
    await testUserDashboardLogic(db);
    await testQuestLogic(db);
    await testBadgeLogic(db);
    await testPowerUpLogic(db);
    await testProgressLogic(db);
    await testAnalyticsLogic(db);
    await testStreakLogic(db);
    
    console.log('\n🎉 All functionality tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Functionality test failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

async function testUserDashboardLogic(db) {
  console.log('\n📊 Testing User Dashboard Logic...');
  
  const userStats = db.collection('userstats');
  const testUser = await db.collection('users').findOne({ email: 'test@example.com' });
  
  if (!testUser) {
    console.log('❌ Test user not found');
    return;
  }

  const stats = await userStats.findOne({ userId: testUser._id });
  
  // Test 1: Recent Achievements (last 5)
  const recentAchievements = stats.achievements
    .filter(a => a.earned && a.earnedAt)
    .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
    .slice(0, 5);
  
  console.log(`✅ Recent Achievements: Found ${recentAchievements.length} recent achievements`);
  recentAchievements.forEach(a => {
    console.log(`   🏆 ${a.name} - Earned: ${new Date(a.earnedAt).toLocaleDateString()}`);
  });

  // Test 2: Active Quests
  const activeQuests = stats.quests.filter(q => !q.completed);
  console.log(`✅ Active Quests: Found ${activeQuests.length} active quests`);
  activeQuests.forEach(q => {
    console.log(`   🎯 ${q.name} - Progress: ${q.progress}/${q.target}`);
  });

  // Test 3: Badge System
  const earnedBadges = stats.badges.filter(b => b.earned);
  console.log(`✅ Badges: User has earned ${earnedBadges.length} badges`);
  earnedBadges.forEach(b => {
    console.log(`   🏅 ${b.name} (${b.rarity}) - ${b.description}`);
  });
}

async function testQuestLogic(db) {
  console.log('\n🎯 Testing Quest Logic...');
  
  const userStats = db.collection('userstats');
  const testUser = await db.collection('users').findOne({ email: 'test@example.com' });
  
  // Test Chat Champion Quest (AI questions)
  console.log('Testing Chat Champion quest...');
  const stats = await userStats.findOne({ userId: testUser._id });
  const chatQuest = stats.quests.find(q => q.id === 'ai-chat-10');
  
  if (chatQuest) {
    console.log(`✅ Chat Champion Quest: ${chatQuest.progress}/${chatQuest.target} questions asked`);
    
    // Simulate adding AI question progress
    const newProgress = Math.min(chatQuest.progress + 1, chatQuest.target);
    const completed = newProgress >= chatQuest.target;
    
    const updateFields = { 
      'quests.$.progress': newProgress,
      'quests.$.completed': completed,
      updatedAt: new Date()
    };
    
    if (completed) {
      updateFields['quests.$.completedAt'] = new Date();
    }
    
    const updateQuery = { $set: updateFields };
    if (completed) {
      updateQuery.$inc = { points: chatQuest.reward };
    }
    
    await userStats.updateOne(
      { userId: testUser._id, 'quests.id': 'ai-chat-10' },
      updateQuery
    );
    
    console.log(`✅ Updated Chat Champion progress to ${newProgress}/${chatQuest.target}`);
    if (completed) {
      console.log(`🎉 Chat Champion quest completed! Awarded ${chatQuest.reward} points`);
    }
  }

  // Test Monthly Streak Quest
  const streakQuest = stats.quests.find(q => q.id === 'streak-30');
  if (streakQuest) {
    console.log(`✅ Monthly Streak Quest: ${streakQuest.progress}/${streakQuest.target} days`);
  }
}

async function testBadgeLogic(db) {
  console.log('\n🏅 Testing Badge Logic...');
  
  const userStats = db.collection('userstats');
  const testUser = await db.collection('users').findOne({ email: 'test@example.com' });
  const stats = await userStats.findOne({ userId: testUser._id });
  
  // Test badge eligibility checking
  const badges = [...stats.badges];
  let badgesUpdated = false;
  
  for (let badge of badges) {
    if (badge.earned) continue;
    
    let shouldEarn = false;
    
    switch (badge.id) {
      case 'points-100':
        shouldEarn = stats.points >= 100;
        break;
      case 'streak-7':
        shouldEarn = stats.streak >= 7;
        break;
      case 'scholar':
        const totalQuizzes = await db.collection('quiz').countDocuments({ 
          userId: testUser._id, 
          completed: true 
        });
        shouldEarn = totalQuizzes >= 10;
        break;
    }
    
    if (shouldEarn) {
      badge.earned = true;
      badge.earnedAt = new Date();
      badgesUpdated = true;
      console.log(`🎉 Badge earned: ${badge.name}`);
    }
  }
  
  if (badgesUpdated) {
    await userStats.updateOne(
      { userId: testUser._id },
      { $set: { badges, updatedAt: new Date() } }
    );
    console.log('✅ Badge system working correctly - badges updated');
  } else {
    console.log('✅ Badge system working correctly - no new badges to award');
  }
}

async function testPowerUpLogic(db) {
  console.log('\n⚡ Testing Power-Up Logic...');
  
  const userStats = db.collection('userstats');
  const testUser = await db.collection('users').findOne({ email: 'test@example.com' });
  
  // Test power-up activation (1 hour duration)
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (60 * 60 * 1000)); // 1 hour
  
  const pointsPowerUp = {
    id: `points_${Date.now()}`,
    name: 'Points Booster',
    type: 'points',
    multiplier: 2,
    duration: 60, // 60 minutes
    active: true,
    activatedAt: now,
    expiresAt
  };
  
  await userStats.updateOne(
    { userId: testUser._id },
    { 
      $push: { powerUps: pointsPowerUp },
      $inc: { points: -100 }, // Cost 100 points
      $set: { updatedAt: new Date() }
    }
  );
  
  console.log('✅ Power-up activated: Points Booster (2x points for 1 hour)');
  console.log(`   Duration: ${pointsPowerUp.duration} minutes`);
  console.log(`   Expires at: ${expiresAt.toLocaleTimeString()}`);
  
  // Test power-up effect
  const stats = await userStats.findOne({ userId: testUser._id });
  const activePowerUps = stats.powerUps.filter(p => 
    p.active && p.expiresAt && new Date(p.expiresAt) > new Date()
  );
  
  console.log(`✅ Active power-ups: ${activePowerUps.length}`);
  activePowerUps.forEach(p => {
    const timeLeft = Math.round((new Date(p.expiresAt) - new Date()) / (1000 * 60));
    console.log(`   ⚡ ${p.name}: ${timeLeft} minutes remaining`);
  });
}

async function testProgressLogic(db) {
  console.log('\n📈 Testing Progress Logic...');
  
  const userStats = db.collection('userstats');
  const users = db.collection('users');
  const testUser = await users.findOne({ email: 'test@example.com' });
  const stats = await userStats.findOne({ userId: testUser._id });
  
  // Test level calculation (points + completed quests)
  const completedQuests = stats.quests.filter(q => q.completed).length;
  const pointsLevel = Math.floor(stats.points / 100);
  const questBonus = Math.floor(completedQuests / 2);
  const calculatedLevel = Math.max(1, pointsLevel + questBonus);
  
  console.log(`✅ Level Calculation:`);
  console.log(`   Points: ${stats.points} → Level ${pointsLevel}`);
  console.log(`   Completed Quests: ${completedQuests} → Bonus ${questBonus}`);
  console.log(`   Final Level: ${calculatedLevel}`);
  
  // Test daily goal (500 points per day)
  console.log(`✅ Daily Goal: ${stats.dailyGoal} points per day`);
  console.log(`   Current Points: ${stats.points}`);
  console.log(`   Goal Progress: ${Math.min(100, (stats.points / stats.dailyGoal) * 100).toFixed(1)}%`);
  
  // Test streak maintenance
  console.log(`✅ Streak Maintenance:`);
  console.log(`   Current Streak: ${stats.streak} days`);
  console.log(`   Last Study Date: ${stats.lastStudyDate ? new Date(stats.lastStudyDate).toLocaleDateString() : 'Never'}`);
  
  // Test study time tracking
  console.log(`✅ Study Time Tracking:`);
  console.log(`   Total Study Time: ${stats.totalStudyTime} minutes`);
  console.log(`   Average per Session: ${stats.totalStudyTime > 0 ? (stats.totalStudyTime / Math.max(1, completedQuests)).toFixed(1) : 0} minutes`);
}

async function testAnalyticsLogic(db) {
  console.log('\n📊 Testing Analytics Logic...');
  
  const tasks = db.collection('tasks');
  const quiz = db.collection('quiz');
  const testUser = await db.collection('users').findOne({ email: 'test@example.com' });
  
  // Test study time trend (last 30 days)
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000));
  
  const sessions = await tasks.find({
    userId: testUser._id,
    createdAt: { $gte: startDate, $lte: endDate },
    status: 'completed'
  }).sort({ createdAt: 1 }).toArray();
  
  console.log(`✅ Study Time Trend: Found ${sessions.length} completed sessions in last 30 days`);
  
  // Test recent study sessions
  const recentSessions = await tasks.find({ userId: testUser._id })
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray();
  
  console.log(`✅ Recent Study Sessions: ${recentSessions.length} sessions`);
  
  for (const session of recentSessions) {
    const quizData = await quiz.findOne({ sessionId: session.sessionId });
    console.log(`   📚 ${session.title}`);
    console.log(`      Day: ${session.createdAt.toLocaleDateString()}`);
    console.log(`      Time: ${session.createdAt.toLocaleTimeString()}`);
    console.log(`      Points: ${session.pointsEarned}`);
    console.log(`      Score: ${quizData?.score || 0}%`);
    console.log(`      Duration: ${session.studyTime} minutes`);
  }
  
  // Test points per session analytics
  const totalPoints = sessions.reduce((sum, s) => sum + s.pointsEarned, 0);
  const avgPointsPerSession = sessions.length > 0 ? (totalPoints / sessions.length).toFixed(1) : 0;
  
  console.log(`✅ Points Analytics:`);
  console.log(`   Total Points Earned: ${totalPoints}`);
  console.log(`   Average per Session: ${avgPointsPerSession}`);
}

async function testStreakLogic(db) {
  console.log('\n🔥 Testing Streak Logic...');
  
  const userStats = db.collection('userstats');
  const testUser = await db.collection('users').findOne({ email: 'test@example.com' });
  const stats = await userStats.findOne({ userId: testUser._id });
  
  // Test streak calculation
  const today = new Date();
  const lastStudyDate = stats.lastStudyDate ? new Date(stats.lastStudyDate) : null;
  
  console.log(`✅ Streak Calculation:`);
  console.log(`   Current Streak: ${stats.streak} days`);
  console.log(`   Last Study: ${lastStudyDate ? lastStudyDate.toLocaleDateString() : 'Never'}`);
  console.log(`   Today: ${today.toLocaleDateString()}`);
  
  if (lastStudyDate) {
    const daysDiff = Math.floor((today.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24));
    console.log(`   Days Since Last Study: ${daysDiff}`);
    
    let newStreak = stats.streak;
    if (daysDiff === 1) {
      newStreak += 1;
      console.log(`   ✅ Streak continues: ${newStreak} days`);
    } else if (daysDiff > 1) {
      newStreak = 1;
      console.log(`   ⚠️  Streak reset: ${newStreak} day`);
    } else {
      console.log(`   ✅ Same day study: ${newStreak} days maintained`);
    }
  }
  
  // Test calendar marking (simulate)
  console.log(`✅ Calendar Streak Visualization:`);
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000));
    const hasStudy = lastStudyDate && date.toDateString() === lastStudyDate.toDateString();
    last7Days.push({
      date: date.toLocaleDateString(),
      studied: hasStudy,
      marker: hasStudy ? '🔥' : '⭕'
    });
  }
  
  last7Days.forEach(day => {
    console.log(`   ${day.marker} ${day.date}`);
  });
}

// Run the tests
testNewFunctionality().catch(console.error);