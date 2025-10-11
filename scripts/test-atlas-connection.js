#!/usr/bin/env node

/**
 * MongoDB Atlas Connection Test Script
 * 
 * This script tests the connection to MongoDB Atlas and verifies
 * that the database is accessible and ready for the application.
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ MONGODB_URI not found in environment variables');
  console.log('Please ensure you have a .env.local file with your Atlas connection string');
  process.exit(1);
}

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
};

async function testConnection() {
  let client;
  
  try {
    console.log('🔄 Testing MongoDB Atlas connection...');
    console.log(`📍 Connecting to: ${uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
    
    // Create client and connect
    client = new MongoClient(uri, options);
    await client.connect();
    
    // Test connection with ping
    await client.db('admin').command({ ping: 1 });
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // Test database access
    const db = client.db('studymaster');
    const collections = await db.listCollections().toArray();
    console.log(`📊 Database 'studymaster' is accessible`);
    console.log(`📁 Collections found: ${collections.length}`);
    
    if (collections.length > 0) {
      console.log('   Collections:', collections.map(c => c.name).join(', '));
    }
    
    // Test write operation
    const testCollection = db.collection('connection_test');
    const testDoc = { 
      timestamp: new Date(), 
      test: 'Atlas connection verification',
      version: '1.0.0'
    };
    
    const result = await testCollection.insertOne(testDoc);
    console.log('✅ Write operation successful');
    
    // Clean up test document
    await testCollection.deleteOne({ _id: result.insertedId });
    console.log('🧹 Test document cleaned up');
    
    console.log('\n🎉 MongoDB Atlas is ready for StudyMaster AI!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Navigate to: http://localhost:3000');
    console.log('3. Create a user account to test data persistence');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n🔧 Troubleshooting authentication:');
      console.log('1. Check username and password in connection string');
      console.log('2. Verify database user exists in Atlas');
      console.log('3. Ensure user has readWrite permissions');
    } else if (error.message.includes('timeout')) {
      console.log('\n🔧 Troubleshooting timeout:');
      console.log('1. Check network access settings in Atlas');
      console.log('2. Ensure 0.0.0.0/0 is whitelisted');
      console.log('3. Check firewall settings');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('\n🔧 Troubleshooting DNS:');
      console.log('1. Check cluster URL in connection string');
      console.log('2. Verify cluster is running in Atlas');
      console.log('3. Check internet connectivity');
    }
    
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the test
testConnection().catch(console.error);