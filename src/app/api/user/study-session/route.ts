import { NextRequest, NextResponse } from 'next/server';
import { AtlasUserService } from '@/lib/services/atlas-user-service';
import { StudySession } from '@/lib/models/user';
// @ts-ignore
import jwt from 'jsonwebtoken';

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  // @ts-ignore
  const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as {
    userId: string;
    email: string;
  };

  return decoded.userId;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    const sessionData = await request.json();

    const studySession: StudySession = {
      id: sessionData.id || `session_${Date.now()}`,
      taskName: sessionData.taskName,
      duration: sessionData.duration,
      score: sessionData.score,
      points: sessionData.points,
      completedAt: new Date(),
      quizAnswers: sessionData.quizAnswers || [],
    };

    await AtlasUserService.addStudySession(userId, studySession);

    // Check for achievements and badges
    const user = await AtlasUserService.getUserById(userId);
    if (user && user.progress) {
      // Check for first session achievement
      if (user.progress.studySessions && user.progress.studySessions.length === 1) {
        await AtlasUserService.updateAchievement(userId, 'first-session', true);
      }

      // Check for marathon study achievement (2 hours in one session)
      if (studySession.duration >= 120) {
        await AtlasUserService.updateAchievement(userId, 'marathon-study', true);
      }

      // Check for perfect score badge
      if (sessionData.score === 100) {
        await AtlasUserService.updateBadge(userId, 'perfect-score', true);
      }

      // Check for first quiz badge
      if (user.progress.studySessions && user.progress.studySessions.length === 1) {
        await AtlasUserService.updateBadge(userId, 'first-quiz', true);
      }

      // Update quest progress
      await AtlasUserService.updateQuest(userId, 'study-60', studySession.duration);
      await AtlasUserService.updateQuest(userId, 'quiz-5', 1);

      // Check for points badge
      if (user.progress.points >= 100) {
        await AtlasUserService.updateBadge(userId, 'points-100', true);
      }

      // Check for scholar badge (10 quizzes)
      if (user.progress.studySessions && user.progress.studySessions.length >= 10) {
        await AtlasUserService.updateBadge(userId, 'scholar', true);
      }

      // Check for streak badges
      if (user.progress.streak >= 7) {
        await AtlasUserService.updateBadge(userId, 'streak-7', true);
      }
    }

    return NextResponse.json({
      success: true,
      session: studySession,
    });
  } catch (error: any) {
    console.error('Add study session error:', error);
    
    // Provide more specific error messages
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    } else if (error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { error: 'Authentication token has expired' },
        { status: 401 }
      );
    } else if (error.message === 'No token provided') {
      return NextResponse.json(
        { error: 'No authentication token provided' },
        { status: 401 }
      );
    } else {
      return NextResponse.json(
        { error: error.message || 'Failed to save study session' },
        { status: 500 }
      );
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    const sessions = await AtlasUserService.getStudySessionsWithTimeData(userId);

    return NextResponse.json({
      sessions,
    });
  } catch (error: any) {
    console.error('Get study sessions error:', error);
    
    // Provide more specific error messages
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    } else if (error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { error: 'Authentication token has expired' },
        { status: 401 }
      );
    } else if (error.message === 'No token provided') {
      return NextResponse.json(
        { error: 'No authentication token provided' },
        { status: 401 }
      );
    } else {
      return NextResponse.json(
        { error: error.message || 'Failed to retrieve study sessions' },
        { status: 500 }
      );
    }
  }
}