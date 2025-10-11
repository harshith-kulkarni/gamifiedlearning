/**
 * Test Database Connection Script
 * Run this to verify your MongoDB Atlas connection and environment setup
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('🧪 Testing StudyMaster AI Database Connection...\n');

  // Check environment variables
  console.log('📋 Environment Variables Check:');
  const requiredVars = ['MONGODB_URI', 'NEXTAUTH_SECRET', 'GEMINI_API_KEY'];
  let allVarsPresent = true;

  for (const varName of requiredVars) {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Present`);
    } else {
      console.log(`❌ ${varName}: Missing`);
      allVarsPresent = false;
    }
  }

  if (!allVarsPresent) {
    console.log('\n❌ Some required environment variables are missing.');
    console.log('Please check your .env.local file and ensure all variables are set.');
    return;
  }

  // Test NEXTAUTH_SECRET
  if (process.env.NEXTAUTH_SECRET === 'your-nextauth-secret-here') {
    console.log('⚠️  NEXTAUTH_SECRET is using default value - please change it for security');
  }

  console.log('\n🔗 Testing MongoDB Atlas connection...');
  console.log('URI:', process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
  
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas successfully!');
    
    const db = client.db('studymaster');
    
    // Test database operations
    console.log('\n📊 Database Status:');
    const collections = await db.listCollections().toArray();
    console.log('📁 Available collections:', collections.map(c => c.name));
    
    // Test each collection
    for (const collection of ['users', 'userstats', 'tasks', 'quiz']) {
      try {
        const count = await db.collection(collection).countDocuments();
        console.log(`📄 ${collection}: ${count} documents`);
      } catch (error) {
        console.log(`❌ ${collection}: Error - ${error.message}`);
      }
    }

    // Test a simple write operation
    console.log('\n🧪 Testing Write Operations:');
    try {
      const testCollection = db.collection('connection_test');
      const testDoc = { 
        test: true, 
        timestamp: new Date(),
        message: 'Connection test successful'
      };
      
      const result = await testCollection.insertOne(testDoc);
      console.log('✅ Write test: Success');
      
      // Clean up test document
      await testCollection.deleteOne({ _id: result.insertedId });
      console.log('✅ Cleanup: Success');
      
    } catch (error) {
      console.log('❌ Write test failed:', error.message);
    }
    
    console.log('\n🎉 All database tests passed!');
    console.log('\n📝 Next Steps:');
    console.log('1. Run: npm run setup-db (to initialize collections and indexes)');
    console.log('2. Start your application: npm run dev');
    console.log('3. Test user registration and login');
    
  } catch (error) {
    console.error('\n❌ Database connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n🔐 Authentication Error Solutions:');
      console.log('- Check your username and password in MONGODB_URI');
      console.log('- Verify the database user exists in MongoDB Atlas');
      console.log('- Ensure the user has proper permissions (readWrite on studymaster database)');
      console.log('- Try recreating the database user in Atlas');
    } else if (error.message.includes('network') || error.message.includes('timeout')) {
      console.log('\n🌐 Network Error Solutions:');
      console.log('- Check your internet connection');
      console.log('- Verify your IP is whitelisted in MongoDB Atlas Network Access');
      console.log('- Try adding 0.0.0.0/0 to allow all IPs (development only)');
      console.log('- Check if your firewall is blocking the connection');
    } else if (error.message.incl