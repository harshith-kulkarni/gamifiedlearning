#!/usr/bin/env node

/**
 * Test Login with New Service
 * 
 * This script tests the login functionality with the updated AtlasUserService
 * to ensure it works with the new database schema.
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

// Simulate AtlasUserService.authenticateUser method
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

  // Get user stats from userstats collection
  const userStats = await db.collection('userstats').findOne({ userId: atlasUser._id });
  
  // Convert to legacy format for compatibility
  return {
    _id: atlasUser._id,
    username: atlasUser.username,
    email: atlasUser.email,
    password: atlasUser.password,
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
      achievements: userStats?.achievements || [],
      studySessions: []
    }
  };
}

async function testLoginWithNewService() {
  let client;
  
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    client = new MongoClient(uri, options);
    await client.connect();
    
    const db = client.db('studymaster');
    console.log('✅ Connected to StudyMaster database');

    // Test credentials
    const testCredentials = [
      {
        email: 'test@example.com',
        password: 'password123'
      },
      {
        email: 'john.doe@example.com',
        password: 'password123'
      },
      {
        email: 'jane.smith@example.com',
        password: 'password123'
      },
      {
        email: 'jane.smith@example.com',
        password: 'wrongpassword'
      }
    ];

    console.log('\n🔐 Testing login with new service...');

    for (const creds of testCredentials) {
      console.log(`\nTesting: ${creds.email} / ${creds.password}`);
      
      const user = await authenticateUser(creds.email, creds.password, db);
      
      if (user) {
        console.log(`✅ Login successful`);
        console.log(`   User ID: ${user._id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Level: ${user.progress.level}`);
        console.log(`   Points: ${user.progress.points}`);
        console.log(`   Total Points: ${user.progress.points}`);
        console.log(`   Streak: ${user.progress.streak}`);
        console.log(`   Badges: ${user.progress.badges.length}`);
        console.log(`   Quests: ${user.progress.quests.length}`);
        console.log(`   Achievements: ${user.progress.achievements.length}`);
      } else {
        console.log(`❌ Login failed`);
      }
    }

    // Display all users and their stats
    console.log('\n👥 All users with stats:');
    const allUsers = await db.collection('users').find({}).toArray();
    
    for (const user of allUsers) {
      const stats = await db.collection('userstats').findOne({ userId: user._id });
      console.log(`📧 ${user.email} (${user.username})`);
      console.log(`   Total Points: ${user.totalPoints}`);
      console.log(`   Stats Level: ${stats?.level || 'No stats'}`);
      console.log(`   Stats Points: ${stats?.points || 'No stats'}`);
      console.log(`   Created: ${user.createdAt?.toISOString().split('T')[0]}`);
    }

    console.log('\n🎉 Login test with new service completed!');
    console.log('\n✅ Working Login Credentials:');
    console.log('📧 Email: test@example.com');
    console.log('🔑 Password: password123');
    console.log('');
    console.log('📧 Email: john.doe@example.com');
    console.log('🔑 Password: password123');
    console.log('');
    console.log('📧 Email: jane.smith@example.com');
    console.log('🔑 Password: password123');
    
  } catch (error) {
    console.error('❌ Login test failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the test
testLoginWithNewService().catch(console.error);