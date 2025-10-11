import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { generateFlashcards } from '@/ai/flows/generate-flashcards-from-pdf';
import { 
  FlashcardGenerationRequestSchema,
  sanitizeFlashcardGenerationRequest,
  type FlashcardGenerationRequest
} from '@/lib/models/flashcard';

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
    console.log('🔄 Starting flashcard generation request...');
    
    // Authenticate user
    const userId = await getUserFromToken(request);
    console.log('✅ User authenticated:', userId);
    
    // Parse and validate request body
    const body = await request.json();
    console.log('📄 Request body received, validating...');
    
    const validatedData = sanitizeFlashcardGenerationRequest(body);
    console.log('✅ Request validated, maxCards:', validatedData.maxCards);

    // Generate flashcards using the AI flow
    console.log('🤖 Calling AI generation flow...');
    const result = await generateFlashcards({
      pdfDataUri: validatedData.pdfDataUri,
      maxCards: validatedData.maxCards || 10,
    });
    
    console.log('✅ AI generation completed, flashcards count:', result.flashcards.length);

    // Convert createdAt strings back to Date objects for the API response
    const flashcardsWithDates = result.flashcards.map(card => ({
      ...card,
      createdAt: new Date(card.createdAt)
    }));

    // Return successful response
    return NextResponse.json({
      success: true,
      data: {
        flashcards: flashcardsWithDates,
        processingTime: result.processingTime,
        taskId: validatedData.taskId,
        userId,
      },
      message: `Successfully generated ${result.flashcards.length} flashcards`,
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Generate flashcards API error:', error);

    // Handle authentication errors
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid authentication token',
          code: 'INVALID_TOKEN'
        },
        { status: 401 }
      );
    }

    if (error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication token has expired',
          code: 'TOKEN_EXPIRED'
        },
        { status: 401 }
      );
    }

    if (error.message === 'No token provided') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required',
          code: 'NO_TOKEN'
        },
        { status: 401 }
      );
    }

    // Handle validation errors
    if (error.message?.includes('Invalid generation request:')) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    // Handle AI generation errors
    if (error.message?.includes('timeout')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Flashcard generation is taking too long. Please try with a smaller PDF or try again later.',
          code: 'GENERATION_TIMEOUT'
        },
        { status: 408 }
      );
    }

    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'AI service is temporarily unavailable. Please try again in a few minutes.',
          code: 'SERVICE_UNAVAILABLE'
        },
        { status: 503 }
      );
    }

    if (error.message?.includes('No flashcards') || error.message?.includes('No valid flashcards')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unable to generate flashcards from this document. Please ensure the PDF contains readable text.',
          code: 'NO_CONTENT'
        },
        { status: 422 }
      );
    }

    // Generic error handling
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to generate flashcards. Please try again.',
        code: 'GENERATION_ERROR'
      },
      { status: 500 }
    );
  }
}