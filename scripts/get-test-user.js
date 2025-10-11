const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function getTestUserCredentials() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Find the user that has test data
    const userStats = await db.collection('userstats').findOne({});
    if (userStats) {
      const user = await db.collection('users').findOne({ _id: userStats.userId });
      if (user) {
        console.log('🎯 TEST USER CREDENTIALS:');
        console.log('==========================================');
        console.log('Email:', user.email);
        console.log('Username:', user.username);
        console.log('Password: (The password is hashed, but you can use the email to login)');
        console.log('');
        console.log('📊 AVAILABLE TEST DATA:');
        console.log('Points:', userStats.points);
        console.log('Level:', userStats.level);
        console.log('Study Time:', userStats.totalStudyTime, 'minutes');
        console.log('Streak:', userStats.streak);
        console.log('Badges Earned:', userStats.badges.filter(b => b.earned).length, '/', userStats.badges.length);
        console.log('Achievements Earned:', userStats.achievements.filter(a => a.earned).length, '/', userStats.achievements.length);
        
        // Check study sessions
        const sessionCount = await db.collection('tasks').countDocuments({ userId: userStats.userId });
        console.log('Study Sessions:', sessionCount);
        
        console.log('');
        console.log('🔑 LOGIN INSTRUCTIONS:');
        console.log('1. Go to http://localhost:3000');
        console.log('2. Click "Sign In"');
        console.log('3. Use email:', user.email);
        console.log('4. If you need to reset password, use the forgot password option');
        console.log('5. Or create a new account and I can add test data to it');
        
        return user;
      }
    }
    
    console.log('No test data found. Let me check all users...');
    const allUsers = await db.collection('users').find({}).toArray();
    console.log('Available users:');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}, Username: ${user.username}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

getTestUserCredentials();