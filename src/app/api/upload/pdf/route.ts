import { NextRequest, NextResponse } from 'next/server';

// Configure for large file uploads
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for large files

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit.`,
          maxSize: MAX_FILE_SIZE,
          actualSize: file.size
        },
        { status: 413 }
      );
    }

    // Convert file to buffer for processing
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert to base64 data URI
    const base64 = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      success: true,
      dataUri,
      fileName: file.name,
      fileSize: file.size,
      processingTime: Date.now()
    });

  } catch (error) {
    console.error('PDF upload error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('PayloadTooLargeError')) {
        return NextResponse.json(
          { error: 'File too large for processing' },
          { status: 413 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to process PDF file' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    maxFileSize: MAX_FILE_SIZE,
    supportedTypes: ['application/pdf'],
    maxDuration: 300
  });
}