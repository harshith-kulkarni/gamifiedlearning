const { MongoClient, ObjectId, Int32 } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function addTestData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Find any existing user to use for testing
    let testUser = await db.collection('users').findOne({});
    
    if (!testUser) {
      console.log('No users found. Please create a user first by signing up in the app.');
      return;
    }
    
    console.log('Using test user:', testUser.email);
    const userId = testUser._id;
    
    // Clear existing test data
    await db.collection('tasks').deleteMany({ userId });
    await db.collection('userstats').deleteMany({ userId });
    await db.collection('quiz').deleteMany({ userId });
    
    console.log('Cleared existing test data');
    
    // Generate study sessions over the last 30 days
    const sessions = [];
    const quizzes = [];
    const now = new Date();
    
    for (let i = 0; i < 25; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const sessionDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      
      // Random study duration between 15-90 minutes
      const duration = Math.floor(Math.random() * 75) + 15;
      const points = duration * 2; // 2 points per minute
      const score = Math.floor(Math.random() * 40) + 60; // Score between 60-100
      
      const sessionId = `session_${sessionDate.getTime()}_${i}`;
      
      // Create task (study session)
      const task = {
        _id: new ObjectId(),
        userId,
        sessionId,
        title: `Study Session ${i + 1}`,
        status: 'completed',
        studyTime: new Int32(duration),
        pointsEarned: new Int32(points),
        createdAt: sessionDate,
        updatedAt: sessionDate,
        completedAt: sessionDate
      };
      
      // Create corresponding quiz with required questions array
      const quiz = {
        _id: new ObjectId(),
        userId,
        sessionId,
        questions: [
          {
            question: "Sample question 1?",
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: 0,
            explanation: "This is a sample explanation",
            difficulty: "medium",
            category: "general"
          },
          {
            question: "Sample question 2?",
            options: ["Option A", "Option B", "Option C"],
            correctAnswer: 1,
            explanation: "This is another sample explanation",
            difficulty: "easy",
            category: "general"
          }
        ],
        answers: [
          {
            questionIndex: 0,
            selectedAnswer: 0,
            isCorrect: true,
            timeSpent: 30
          },
          {
            questionIndex: 1,
            selectedAnswer: 1,
            isCorrect: true,
            timeSpent: 25
          }
        ],
        score,
        totalQuestions: 10,
        correctAnswers: Math.floor((score / 100) * 10),
        timeSpent: Math.floor(Math.random() * 300) + 120, // 2-7 minutes
        pointsEarned: Math.floor(score / 10), // Points based on score
        completed: true,
        createdAt: sessionDate,
        completedAt: sessionDate
      };
      
      sessions.push(task);
      quizzes.push(quiz);
    }
    
    // Insert sessions and quizzes one by one to debug validation errors
    console.log('Inserting sessions...');
    for (let i = 0; i < sessions.length; i++) {
      try {
        await db.collection('tasks').insertOne(sessions[i]);
        if (i === 0) console.log('First session inserted successfully');
      } catch (error) {
        console.error(`Error inserting session ${i}:`, error.message);
        console.error('Session data:', JSON.stringify(sessions[i], null, 2));
        break;
      }
    }
    
    console.log('Inserting quizzes...');
    for (let i = 0; i < quizzes.length; i++) {
      try {
        await db.collection('quiz').insertOne(quizzes[i]);
        if (i === 0) console.log('First quiz inserted successfully');
      } catch (error) {
        console.error(`Error inserting quiz ${i}:`, error.message);
        console.error('Quiz data:', JSON.stringify(quizzes[i], null, 2));
        break;
      }
    }
    
    console.log(`Created ${sessions.length} study sessions and quizzes`);
    
    // Calculate totals for user stats
    const totalPoints = sessions.reduce((sum, session) => sum + session.pointsEarned, 0);
    const totalStudyTime = sessions.reduce((sum, session) => sum + session.studyTime, 0);
    const level = Math.floor(totalPoints / 100) + 1;
    const averageScore = quizzes.reduce((sum, quiz) => sum + quiz.score, 0) / quizzes.length;
    
    // Create user stats with proper validation
    const userStats = {
      _id: new ObjectId(),
      userId,
      points: totalPoints,
      level,
      totalStudyTime,
      streak: Math.floor(Math.random() * 15) + 1, // Random streak 1-15
      lastStudyDate: new Date(),
      quizAccuracy: averageScore,
      dailyGoal: 30, // Add required dailyGoal
      badges: [
        {
          id: 'first-quiz',
          name: 'First Quiz',
          description: 'Complete your first quiz',
          icon: '🎓',
          earned: true,
          earnedAt: sessions[0].createdAt,
          rarity: 'common'
        },
        {
          id: 'points-100',
          name: 'Centurion',
          description: 'Earn 100 points',
          icon: '💯',
          earned: totalPoints >= 100,
          rarity: 'common'
        },
        {
          id: 'streak-7',
          name: 'Week Streak',
          description: 'Study for 7 days in a row',
          icon: '🔥',
          earned: true,
          earnedAt: sessions[7]?.createdAt,
          rarity: 'rare'
        },
        {
          id: 'scholar',
          name: 'Scholar',
          description: 'Complete 10 quizzes',
          icon: '📚',
          earned: sessions.length >= 10,
          rarity: 'epic'
        }
      ],
      achievements: [
        {
          id: 'first-session',
          name: 'First Session',
          description: 'Complete your first study session',
          icon: '🎯',
          earned: true,
          earnedAt: sessions[0].createdAt,
          points: 10
        },
        {
          id: 'consistent-week',
          name: 'Consistent Week',
          description: 'Study every day for a week',
          icon: '📅',
          earned: true,
          earnedAt: sessions[6]?.createdAt,
          points: 75
        },
        {
          id: 'marathon-study',
          name: 'Marathon Study',
          description: 'Study for 2 hours in one session',
          icon: '🏃',
          earned: sessions.some(s => s.studyTime >= 120),
          points: 50
        }
      ],
      quests: [
        {
          id: 'study-60',
          name: 'Hour Master',
          description: 'Study for 60 minutes total',
          icon: '⏱️',
          progress: Math.min(totalStudyTime, 60),
          target: 60,
          reward: 50,
          completed: totalStudyTime >= 60,
          category: 'study'
        },
        {
          id: 'quiz-5',
          name: 'Quiz Master',
          description: 'Complete 5 quizzes',
          icon: '📝',
          progress: Math.min(sessions.length, 5),
          target: 5,
          reward: 75,
          completed: sessions.length >= 5,
          category: 'quiz'
        }
      ],
      createdAt: sessions[0].createdAt,
      updatedAt: new Date()
    };
    
    await db.collection('userstats').insertOne(userStats);
    
    // Update user total points
    await db.collection('users').updateOne(
      { _id: userId },
      { 
        $set: { 
          totalPoints,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('✅ Test data created successfully!');
    console.log(`📊 Stats: ${totalPoints} points, Level ${level}, ${totalStudyTime} minutes studied`);
    console.log(`🏆 Badges: ${userStats.badges.filter(b => b.earned).length}/${userStats.badges.length} earned`);
    console.log(`🎯 Achievements: ${userStats.achievements.filter(a => a.earned).length}/${userStats.achievements.length} earned`);
    console.log(`📝 Quests: ${userStats.quests.filter(q => q.completed).length}/${userStats.quests.length} completed`);
    
  } catch (error) {
    console.error('Error adding test data:', error);
  } finally {
    await client.close();
  }
}

addTestData();