#!/usr/bin/env node

/**
 * Fix User Passwords Script
 * 
 * This script properly hashes the passwords for the dummy users
 * so they can be used for login testing.
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

async function fixUserPasswords() {
  let client;
  
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    client = new MongoClient(uri, options);
    await client.connect();
    
    const db = client.db('studymaster');
    console.log('✅ Connected to StudyMaster database');

    // Define users with their plain text passwords
    const usersToUpdate = [
      {
        email: 'john.doe@example.com',
        password: 'password123'
      },
      {
        email: 'jane.smith@example.com', 
        password: 'password123'
      }
    ];

    console.log('🔐 Hashing passwords and updating users...');

    for (const userData of usersToUpdate) {
      // Hash the password
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      // Update the user in database
      const result = await db.collection('users').updateOne(
        { email: userData.email },
        { 
          $set: { 
            password: hashedPassword,
            updatedAt: new Date()
          }
        }
      );

      if (result.matchedCount > 0) {
        console.log(`✅ Updated password for ${userData.email}`);
      } else {
        console.log(`⚠️  User not found: ${userData.email}`);
      }
    }

    // Verify the users exist and can be authenticated
    console.log('\n🔍 Verifying user authentication...');
    
    for (const userData of usersToUpdate) {
      const user = await db.collection('users').findOne({ email: userData.email });
      
      if (user) {
        const isPasswordValid = await bcrypt.compare(userData.password, user.password);
        if (isPasswordValid) {
          console.log(`✅ Authentication test passed for ${userData.email}`);
        } else {
          console.log(`❌ Authentication test failed for ${userData.email}`);
        }
      } else {
        console.log(`❌ User not found: ${userData.email}`);
      }
    }

    console.log('\n🎉 Password fix completed successfully!');
    console.log('\nTest Login Credentials:');
    console.log('📧 Email: john.doe@example.com');
    console.log('🔑 Password: password123');
    console.log('');
    console.log('📧 Email: jane.smith@example.com');
    console.log('🔑 Password: password123');
    console.log('\nYou can now login with these credentials!');
    
  } catch (error) {
    console.error('❌ Password fix failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the fix
fixUserPasswords().catch(console.error);