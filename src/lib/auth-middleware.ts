import { NextRequest, NextResponse } from 'next/server';

import { AuthService } from '@/lib/services/auth-service';

export async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const payload = AuthService.verifyToken(token);
  
  if (!payload) {
    return null;
  }

  return payload;
}

export function withAuth(handler: (request: NextRequest, user: any) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const user = await authenticateRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return handler(request, user);
  };
}