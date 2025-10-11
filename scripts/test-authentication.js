#!/usr/bin/env node

/**
 * Authentication Test Script
 * 
 * This script tests the authentication functionality directly
 * without starting the full Next.js server.
 */

const { MongoClient } = require('mongodb');
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

// Simulate the UserService.authenticateUser method
async function authenticateUser(email, password, db) {
  const users = db.collection('users');
  const user = await users.findOne({ email });
  
  if (!user) {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return null;
  }

  return user;
}

async function testAuthentication() {
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
        email: 'john.doe@example.com',
        password: 'password123'
      },
      {
        email: 'jane.smith@example.com',
        password: 'password123'
      },
      {
        email: 'john.doe@example.com',
        password: 'wrongpassword'
      },
      {
        email: 'nonexistent@example.com',
        password: 'password123'
      }
    ];

    console.log('\n🔐 Testing authentication...');

    for (const creds of testCredentials) {
      console.log(`\nTesting: ${creds.email} / ${creds.password}`);
      
      const user = await authenticateUser(creds.email, creds.password, db);
      
      if (user) {
        console.log(`✅ Authentication successful`);
        console.log(`   User ID: ${user._id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Level: ${user.progress?.level || 1}`);
        console.log(`   Points: ${user.progress?.points || 0}`);
      } else {
        console.log(`❌ Authentication failed`);
      }
    }

    // Display all users in database for reference
    console.log('\n👥 All users in database:');
    const allUsers = await db.collection('users').find({}, { 
      projection: { 
        username: 1, 
        email: 1, 
        'progress.level': 1, 
        'progress.points': 1,
        createdAt: 1
      } 
    }).toArray();

    for (const user of allUsers) {
      console.log(`📧 ${user.email} (${user.username})`);
      console.log(`   Level: ${user.progress?.level || 1}, Points: ${user.progress?.points || 0}`);
      console.log(`   Created: ${user.createdAt?.toISOString().split('T')[0]}`);
    }

    console.log('\n🎉 Authentication test completed!');
    console.log('\n✅ Working Login Credentials:');
    console.log('📧 Email: john.doe@example.com');
    console.log('🔑 Password: password123');
    console.log('');
    console.log('📧 Email: jane.smith@example.com');
    console.log('🔑 Password: password123');
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the test
testAuthentication().catch(console.error);