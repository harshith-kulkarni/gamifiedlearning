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
    const url = new URL(request.url);
    const type = url.searchParams.get('type');

    if (type === 'recent') {
      // Get recent achievements (last 5)
      const recentAchievements = await GamificationService.getRecentAchievements(userId);
      return NextResponse.json({ achievements: recentAchievements });
    } else {
      // Get all achievements
      const stats = await GamificationService.getUserStats(userId);
      return NextResponse.json({ 
        achievements: stats?.achievements || [] 
      });
    }
  } catch (error) {
    console.error('Get achievements error:', error);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}