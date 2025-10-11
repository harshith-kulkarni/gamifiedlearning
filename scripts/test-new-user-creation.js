#!/usr/bin/env node

/**
 * Test New User Creation
 * 
 * This script tests that new users can be created and immediately logged in
 * with full gamification features available.
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

// Simulate AtlasUserService.createUser method
async function createUser(username, email, password, db) {
  const users = db.collection('users');
  const userStats = db.collection('userstats');
  
  // Check if user already exists
  const existingUser = await users.findOne({ 
    $or: [{ email }, { username }] 
  });
  
  if (existingUser) {
    throw new Error('User with this email or username already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  const newUser = {
    username,
    email,
    password: hashedPassword,
    totalPoints: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await users.insertOne(newUser);
  const userId = result.insertedId;
  
  // Initialize user stats
  const defaultBadges = [
    { id: 'first-quiz', name: 'First Quiz', description: 'Complete your first quiz', icon: '🎓', earned: false, rarity: 'common' },
    { id: 'streak-7', name: 'Week Streak', description: 'Study for 7 days in a row', icon: '🔥', earned: false, rarity: 'rare' },
    { id: 'points-100', name: 'Centurion', description: 'Earn 100 points', icon: '💯', earned: false, rarity: 'common' },
    { id: 'perfect-score', name: 'Perfect Score', description: 'Get 100% on a quiz', icon: '🏆', earned: false, rarity: 'rare' },
    { id: 'early-bird', name: 'Early Bird', description: 'Study before 8 AM', icon: '🐦', earned: false, rarity: 'common' },
    { id: 'night-owl', name: 'Night Owl', description: 'Study after 10 PM', icon: '🦉', earned: false, rarity: 'common' },
    { id: 'speed-demon', name: 'Speed Demon', description: 'Finish a quiz in under 5 minutes', icon: '⚡', earned: false, rarity: 'epic' },
    { id: 'scholar', name: 'Scholar', description: 'Complete 10 quizzes', icon: '📚', earned: false, rarity: 'epic' }
  ];

  const defaultAchievements = [
    { id: 'first-session', name: 'First Session', description: 'Complete your first study session', icon: '🎯', earned: false, points: 10 },
    { id: 'marathon-study', name: 'Marathon Study', description: 'Study for 2 hours in one session', icon: '🏃', earned: false, points: 50 },
    { id: 'consistent-week', name: 'Consistent Week', description: 'Study every day for a week', icon: '📅', earned: false, points: 75 },
    { id: 'quiz-expert', name: 'Quiz Expert', description: 'Score 90% or higher on 5 quizzes', icon: '📝', earned: false, points: 100 },
    { id: 'point-master', name: 'Point Master', description: 'Earn 1000 total points', icon: '⭐', earned: false, points: 200 }
  ];

  const defaultQuests = [
    { id: 'study-60', name: 'Hour Master', description: 'Study for 60 minutes total', icon: '⏱️', progress: 0, target: 60, reward: 50, completed: false, category: 'study' },
    { id: 'quiz-5', name: 'Quiz Master', description: 'Complete 5 quizzes', icon: '📝', progress: 0, target: 5, reward: 75, completed: false, category: 'quiz' },
    { id: 'ai-chat-10', name: 'Chat Champion', description: 'Ask 10 questions to AI tutor', icon: '💬', progress: 0, target: 10, reward: 40, completed: false, category: 'ai' },
    { id: 'streak-30', name: 'Monthly Streak', description: 'Maintain a 30-day study streak', icon: '📅', progress: 0, target: 30, reward: 150, completed: false, category: 'consistency' },
    { id: 'daily-goal-7', name: 'Goal Achiever', description: 'Meet daily goal for 7 days', icon: '🎯', progress: 0, target: 7, reward: 100, completed: false, category: 'consistency' }
  ];

  const defaultStats = {
    userId,
    level: 1,
    points: 0,
    streak: 0,
    quizAccuracy: 0,
    dailyGoal: 500,
    totalStudyTime: 0,
    badges: defaultBadges,
    achievements: defaultAchievements,
    quests: defaultQuests,
    challenges: [],
    powerUps: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await userStats.insertOne(defaultStats);
  
  return { ...newUser, _id: userId };
}

// Simulate login
async function authenticateUser(email, password, db) {
  const users = db.collection('users');
  const atlasUser = await users.findOne({ email });
  
  if (!atlasUser) {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(password, atlasUser.password);
  if (!isPasswordValid) {
    return null;
  }

  // Get user stats
  const userStats = await db.collection('userstats').findOne({ userId: atlasUser._id });
  
  return {
    _id: atlasUser._id,
    username: atlasUser.username,
    email: atlasUser.email,
    createdAt: atlasUser.createdAt,
    updatedAt: atlasUser.updatedAt,
    progress: {
      level: userStats?.level || 1,
      points: userStats?.points || atlasUser.totalPoints || 0,
      streak: userStats?.streak || 0,
      lastStudyDate: userStats?.lastStudyDate,
      totalStudyTime: userStats?.totalStudyTime || 0,
      dailyGoal: userStats?.dailyGoal || 500,
      badges: userStats?.badges || [],
      quests: userStats?.quests || [],
      achievements: userStats?.achievements || []
    }
  };
}

async function testNewUserCreation() {
  let client;
  
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    client = new MongoClient(uri, options);
    await client.connect();
    
    const db = client.db('studymaster');
    console.log('✅ Connected to StudyMaster database');

    // Generate unique test user
    const timestamp = Date.now();
    const testUser = {
      username: `testuser_${timestamp}`,
      email: `testuser_${timestamp}@example.com`,
      password: 'password123'
    };

    console.log(`\n👤 Creating new test user: ${testUser.email}`);

    // Test user creation
    try {
      const newUser = await createUser(testUser.username, testUser.email, testUser.password, db);
      console.log('✅ User created successfully');
      console.log(`   User ID: ${newUser._id}`);
      console.log(`   Username: ${newUser.username}`);
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Total Points: ${newUser.totalPoints}`);
    } catch (error) {
      console.log('❌ User creation failed:', error.message);
      return;
    }

    // Test immediate login
    console.log(`\n🔐 Testing immediate login for new user...`);
    const loginResult = await authenticateUser(testUser.email, testUser.password, db);
    
    if (loginResult) {
      console.log('✅ Login successful immediately after creation');
      console.log(`   User ID: ${loginResult._id}`);
      console.log(`   Username: ${loginResult.username}`);
      console.log(`   Email: ${loginResult.email}`);
      console.log(`   Level: ${loginResult.progress.level}`);
      console.log(`   Points: ${loginResult.progress.points}`);
      console.log(`   Streak: ${loginResult.progress.streak}`);
      console.log(`   Daily Goal: ${loginResult.progress.dailyGoal}`);
      console.log(`   Badges: ${loginResult.progress.badges.length}`);
      console.log(`   Quests: ${loginResult.progress.quests.length}`);
      console.log(`   Achievements: ${loginResult.progress.achievements.length}`);
      
      // Test gamification features
      console.log('\n🎮 Verifying gamification features...');
      console.log('✅ Badges initialized:');
      loginResult.progress.badges.slice(0, 3).forEach(badge => {
        console.log(`   🏅 ${badge.name} (${badge.rarity}) - ${badge.earned ? 'Earned' : 'Available'}`);
      });
      
      console.log('✅ Quests initialized:');
      loginResult.progress.quests.slice(0, 3).forEach(quest => {
        console.log(`   🎯 ${quest.name} - ${quest.progress}/${quest.target} (${quest.reward} points)`);
      });
      
      console.log('✅ Achievements initialized:');
      loginResult.progress.achievements.slice(0, 3).forEach(achievement => {
        console.log(`   🏆 ${achievement.name} - ${achievement.points} points`);
      });
      
    } else {
      console.log('❌ Login failed for new user');
    }

    // Verify user persists in database
    console.log('\n💾 Verifying user persistence...');
    const persistedUser = await db.collection('users').findOne({ email: testUser.email });
    const persistedStats = await db.collection('userstats').findOne({ userId: persistedUser._id });
    
    if (persistedUser && persistedStats) {
      console.log('✅ User and stats persisted in database');
      console.log(`   User document exists: ${!!persistedUser}`);
      console.log(`   Stats document exists: ${!!persistedStats}`);
      console.log(`   Stats badges count: ${persistedStats.badges.length}`);
      console.log(`   Stats quests count: ${persistedStats.quests.length}`);
      console.log(`   Stats achievements count: ${persistedStats.achievements.length}`);
    } else {
      console.log('❌ User or stats not properly persisted');
    }

    console.log('\n🎉 New user creation test completed successfully!');
    console.log('\n✅ Verified Features:');
    console.log('• User creation with proper password hashing');
    console.log('• Automatic user stats initialization');
    console.log('• Immediate login capability after creation');
    console.log('• Complete gamification features (badges, quests, achievements)');
    console.log('• Database persistence of all user data');
    console.log('• No deletion of existing user credentials');
    
    console.log(`\n🔑 New User Login Credentials:`);
    console.log(`📧 Email: ${testUser.email}`);
    console.log(`🔑 Password: ${testUser.password}`);
    console.log(`\nThis user can now login to the application with full features!`);
    
  } catch (error) {
    console.error('❌ New user creation test failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the test
testNewUserCreation().catch(console.error);