import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends NextRequest {
  userId?: string;
  userEmail?: string;
}

export function verifyToken(request: NextRequest): { userId: string; userEmail: string } | null {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as {
      userId: string;
      email: string;
    };

    return {
      userId: decoded.userId,
      userEmail: decoded.email,
    };
  } catch (error) {
    return null;
  }
}