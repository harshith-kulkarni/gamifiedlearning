import { NextRequest, NextResponse } from 'next/server';
import { GamificationService } from '@/lib/services/gamification-service';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

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

  return new ObjectId(decoded.userId);
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    const stats = await GamificationService.getUserStats(userId);

    if (!stats) {
      // Initialize stats for new user
      await GamificationService.initializeUserStats(userId);
      const newStats = await GamificationService.getUserStats(userId);
      return NextResponse.json({ stats: newStats });
    }

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Get user stats error:', error);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    const { pointsToAdd, studyTimeToAdd, quizScore } = await request.json();

    await GamificationService.updateUserProgress(
      userId, 
      pointsToAdd || 0, 
      studyTimeToAdd || 0, 
      quizScore
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update user stats error:', error);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}