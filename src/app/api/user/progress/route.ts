import { NextRequest, NextResponse } from 'next/server';
import { AtlasUserService } from '@/lib/services/atlas-user-service';
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

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    const user = await AtlasUserService.getUserById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      progress: user.progress,
    });
  } catch (error) {
    console.error('Get progress error:', error);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    const progressUpdate = await request.json();

    await AtlasUserService.updateUserProgress(userId, progressUpdate);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Update progress error:', error);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}