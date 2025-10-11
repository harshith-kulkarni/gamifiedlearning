/**
 * Utility functions for flashcard processing and validation
 */

import { Flashcard, CardAction, SavedFlashcard } from '@/lib/models/flashcard';

/**
 * Validates flashcard content for length and quality
 */
export function validateFlashcard(flashcard: Partial<Flashcard>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!flashcard.front || flashcard.front.trim().length === 0) {
    errors.push('Question (front) is required');
  } else if (flashcard.front.length > 100) {
    errors.push('Question (front) must be 100 characters or less');
  }

  if (!flashcard.back || flashcard.back.trim().length === 0) {
    errors.push('Answer (back) is required');
  } else if (flashcard.back.length > 200) {
    errors.push('Answer (back) must be 200 characters or less');
  }

  if (flashcard.sourceText && flashcard.sourceText.length > 300) {
    errors.push('Source text must be 300 characters or less');
  }

  if (flashcard.confidence !== undefined && (flashcard.confidence < 0 || flashcard.confidence > 1)) {
    errors.push('Confidence score must be between 0 and 1');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitizes flashcard content by trimming whitespace and ensuring proper formatting
 */
export function sanitizeFlashcard(flashcard: Partial<Flashcard>): Partial<Flashcard> {
  return {
    ...flashcard,
    front: flashcard.front?.trim().substring(0, 100),
    back: flashcard.back?.trim().substring(0, 200),
    sourceText: flashcard.sourceText?.trim().substring(0, 300),
    confidence: flashcard.confidence !== undefined ? Math.max(0, Math.min(1, flashcard.confidence)) : undefined,
  };
}

/**
 * Generates a unique flashcard ID
 */
export function generateFlashcardId(): string {
  return `flashcard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Filters flashcards based on confidence threshold
 */
export function filterByConfidence(flashcards: Flashcard[], minConfidence: number = 0.5): Flashcard[] {
  return flashcards.filter(card => (card.confidence || 0.7) >= minConfidence);
}

/**
 * Sorts flashcards by confidence score (highest first)
 */
export function sortByConfidence(flashcards: Flashcard[]): Flashcard[] {
  return [...flashcards].sort((a, b) => (b.confidence || 0.7) - (a.confidence || 0.7));
}

/**
 * Converts a generated flashcard to a saved flashcard format
 */
export function convertToSavedFlashcard(
  flashcard: Flashcard,
  userId: string,
  taskId: string,
  pdfTitle: string,
  status: CardAction = 'saved'
): Omit<SavedFlashcard, '_id'> {
  return {
    userId: userId as any, // Will be converted to ObjectId in the service
    taskId,
    pdfTitle,
    question: flashcard.front,
    answer: flashcard.back,
    pageNumber: flashcard.pageNumber,
    sourceText: flashcard.sourceText,
    status,
    createdAt: new Date(),
    reviewCount: 0,
  };
}

/**
 * Groups flashcards by their status
 */
export function groupFlashcardsByStatus(flashcards: SavedFlashcard[]): Record<CardAction, SavedFlashcard[]> {
  return flashcards.reduce((groups, card) => {
    if (!groups[card.status]) {
      groups[card.status] = [];
    }
    groups[card.status].push(card);
    return groups;
  }, {} as Record<CardAction, SavedFlashcard[]>);
}

/**
 * Calculates flashcard statistics
 */
export function calculateFlashcardStats(flashcards: SavedFlashcard[]) {
  const total = flashcards.length;
  const saved = flashcards.filter(card => card.status === 'saved').length;
  const known = flashcards.filter(card => card.status === 'known').length;
  const review = flashcards.filter(card => card.status === 'review').length;
  const totalReviews = flashcards.reduce((sum, card) => sum + card.reviewCount, 0);

  return {
    total,
    saved,
    known,
    review,
    totalReviews,
    averageReviews: total > 0 ? Math.round((totalReviews / total) * 10) / 10 : 0,
  };
}

/**
 * Searches flashcards by content
 */
export function searchFlashcards(flashcards: SavedFlashcard[], query: string): SavedFlashcard[] {
  if (!query.trim()) return flashcards;

  const searchTerm = query.toLowerCase().trim();
  return flashcards.filter(card => 
    card.question.toLowerCase().includes(searchTerm) ||
    card.answer.toLowerCase().includes(searchTerm) ||
    (card.sourceText && card.sourceText.toLowerCase().includes(searchTerm))
  );
}

/**
 * Validates PDF content for flashcard generation
 */
export function validatePDFForFlashcards(pdfDataUri: string): { isValid: boolean; error?: string } {
  if (!pdfDataUri) {
    return { isValid: false, error: 'PDF data is required' };
  }

  if (!pdfDataUri.startsWith('data:application/pdf;base64,')) {
    return { isValid: false, error: 'Invalid PDF format. Expected base64 encoded PDF.' };
  }

  // Check if the base64 content exists and has reasonable length
  const base64Content = pdfDataUri.split(',')[1];
  if (!base64Content || base64Content.length < 100) {
    return { isValid: false, error: 'PDF content appears to be too small or empty' };
  }

  return { isValid: true };
}

/**
 * Estimates reading time for flashcard content
 */
export function estimateFlashcardReadingTime(flashcards: Flashcard[]): number {
  // Estimate ~3 seconds per flashcard for reading and comprehension
  return flashcards.length * 3;
}