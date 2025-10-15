import { NextRequest, NextResponse } from 'next/server';
import { AtlasUserService } from '@/lib/services/atlas-user-service';
import { authenticateRequest } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userData = await AtlasUserService.getUserById(user.userId);

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      progress: userData.progress,
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
    const user = await authenticateRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const progressUpdate = await request.json();

    await AtlasUserService.updateUserProgress(user.userId, progressUpdate);

    return NextResponse.json({
      success: true,
    });
  } catch (error: unknown) {
    console.error('❌ Update progress error:', error);
    
    // Return specific error messages for debugging
    if (error instanceof Error) {
      if (error.message.includes('No token') || error.message.includes('Invalid token')) {
        return NextResponse.json(
          { error: 'Authentication failed', details: error.message },
          { status: 401 }
        );
      }
      if (error.message.includes('Database validation')) {
        console.error('📋 Validation error details:', error.message);
        return NextResponse.json(
          { error: 'Data validation failed', details: error.message },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}