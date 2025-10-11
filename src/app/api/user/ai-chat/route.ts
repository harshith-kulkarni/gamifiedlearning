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

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    
    // Track AI question for Chat Champion quest
    await GamificationService.trackAIQuestion(userId);

    return NextResponse.json({ 
      success: true,
      message: 'AI question tracked for Chat Champion quest'
    });
  } catch (error) {
    console.error('Track AI chat error:', error);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}