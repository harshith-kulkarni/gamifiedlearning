import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user-service';
import { StudySession } from '@/lib/models/user';
import jwt from 'jsonwebtoken';

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
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

    await UserService.addStudySession(userId, studySession);

    // Check for achievements and badges
    const user = await UserService.getUserById(userId);
    if (user) {
      // Check for first session achievement
      if (user.progress.studySessions.length === 1) {
        await UserService.updateAchievement(userId, 'first-session', true);
      }

      // Check for marathon study achievement (2 hours in one session)
      if (studySession.duration >= 120) {
        await UserService.updateAchievement(userId, 'marathon-study', true);
      }

      // Check for perfect score badge
      if (sessionData.score === 100) {
        await UserService.updateBadge(userId, 'perfect-score', true);
      }

      // Check for first quiz badge
      if (user.progress.studySessions.length === 1) {
        await UserService.updateBadge(userId, 'first-quiz', true);
      }

      // Update quest progress
      await UserService.updateQuest(userId, 'study-60', studySession.duration);
      await UserService.updateQuest(userId, 'quiz-5', 1);

      // Check for points badge
      if (user.progress.points >= 100) {
        await UserService.updateBadge(userId, 'points-100', true);
      }

      // Check for scholar badge (10 quizzes)
      if (user.progress.studySessions.length >= 10) {
        await UserService.updateBadge(userId, 'scholar', true);
      }

      // Check for streak badges
      if (user.progress.streak >= 7) {
        await UserService.updateBadge(userId, 'streak-7', true);
      }
    }

    return NextResponse.json({
      success: true,
      session: studySession,
    });
  } catch (error) {
    console.error('Add study session error:', error);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    const sessions = await UserService.getStudySessionsWithTimeData(userId);

    return NextResponse.json({
      sessions,
    });
  } catch (error) {
    console.error('Get study sessions error:', error);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}