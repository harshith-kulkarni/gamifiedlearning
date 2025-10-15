import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { Flashcard } from '@/lib/models/flashcard';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flashcards, taskId, pdfTitle } = body;

    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // For now, we'll use a simple token validation
    // In production, you'd verify the JWT token properly
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Validate input
    if (!flashcards || !Array.isArray(flashcards) || flashcards.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No flashcards provided' },
        { status: 400 }
      );
    }

    if (!taskId || !pdfTitle) {
      return NextResponse.json(
        { success: false, error: 'Task ID and PDF title are required' },
        { status: 400 }
      );
    }

    // Connect to database
    const db = await getDatabase();
    
    // Prepare flashcards for saving
    const flashcardsToSave = flashcards.map((card: Flashcard) => ({
      _id: new ObjectId(),
      id: card.id,
      question: card.front,
      answer: card.back,
      pageNumber: card.pageNumber,
      sourceText: card.sourceText,
      status: 'saved',
      taskId,
      pdfTitle,
      userId: token, // Using token as userId for now
      createdAt: new Date(),
      lastReviewed: new Date(),
      reviewCount: 1,
    }));

    // Insert flashcards into database
    const result = await db.collection('saved_flashcards').insertMany(flashcardsToSave);

    return NextResponse.json({
      success: true,
      data: {
        savedCount: result.insertedCount,
        flashcardIds: Object.values(result.insertedIds),
      },
    });

  } catch (error) {
    console.error('Save flashcards error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save flashcards' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Connect to database
    const db = await getDatabase();
    
    // Fetch user's saved flashcards
    const flashcards = await db
      .collection('saved_flashcards')
      .find({ userId: token })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: {
        flashcards,
      },
    });

  } catch (error) {
    console.error('Get flashcards error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch flashcards' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { flashcardId, status } = body;

    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Validate input
    if (!flashcardId || !status) {
      return NextResponse.json(
        { success: false, error: 'Flashcard ID and status are required' },
        { status: 400 }
      );
    }

    // Connect to database
    const db = await getDatabase();
    
    // Update flashcard status
    const result = await db.collection('saved_flashcards').updateOne(
      { 
        _id: new ObjectId(flashcardId),
        userId: token 
      },
      { 
        $set: { 
          status,
          lastReviewed: new Date(),
        },
        $inc: {
          reviewCount: 1
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Flashcard not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        updated: result.modifiedCount > 0,
      },
    });

  } catch (error) {
    console.error('Update flashcard error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update flashcard' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { flashcardIds } = body;

    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Validate input
    if (!flashcardIds || !Array.isArray(flashcardIds) || flashcardIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Flashcard IDs are required' },
        { status: 400 }
      );
    }

    // Connect to database
    const db = await getDatabase();
    
    // Delete flashcards
    const objectIds = flashcardIds.map(id => new ObjectId(id));
    const result = await db.collection('saved_flashcards').deleteMany({
      _id: { $in: objectIds },
      userId: token
    });

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: result.deletedCount,
      },
    });

  } catch (error) {
    console.error('Delete flashcards error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete flashcards' },
      { status: 500 }
    );
  }
}