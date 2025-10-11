import { ObjectId } from 'mongodb';
import { z } from 'zod';

/**
 * Flashcard interface for generated flashcards (in-memory/temporary)
 */
export interface Flashcard {
  id: string;
  front: string; // Question/Prompt (max 100 chars)
  back: string;  // Answer/Explanation (max 200 chars)
  pageNumber?: number;
  sourceText?: string; // Context snippet (max 300 chars)
  confidence?: number; // AI confidence score (0-1)
  createdAt: Date | string; // Can be Date object or ISO string
}

/**
 * Card action types for user interactions
 */
export type CardAction = 'saved' | 'known' | 'review';

/**
 * Saved flashcard interface for database storage
 */
export interface SavedFlashcard {
  _id?: ObjectId;
  userId: ObjectId;
  taskId: string;
  pdfTitle: string;
  question: string; // Front of the card
  answer: string;   // Back of the card
  pageNumber?: number;
  sourceText?: string;
  status: CardAction;
  createdAt: Date;
  lastReviewed?: Date;
  reviewCount: number;
}

/**
 * Flashcard generation request interface
 */
export interface FlashcardGenerationRequest {
  pdfDataUri: string;
  pdfTitle?: string;
  taskId: string;
  maxCards?: number;
}

/**
 * Flashcard generation response interface
 */
export interface FlashcardGenerationResponse {
  success: boolean;
  flashcards?: Flashcard[];
  processingTime?: number;
  error?: string;
}

/**
 * Flashcard save request interface
 */
export interface FlashcardSaveRequest {
  flashcards: Array<{
    id: string;
    question: string;
    answer: string;
    pageNumber?: number;
    sourceText?: string;
    status: CardAction;
  }>;
  taskId: string;
  pdfTitle: string;
}

/**
 * Flashcard save response interface
 */
export interface FlashcardSaveResponse {
  success: boolean;
  savedCount?: number;
  error?: string;
}

/**
 * Saved flashcards retrieval response interface
 */
export interface SavedFlashcardsResponse {
  success: boolean;
  flashcards?: SavedFlashcard[];
  totalCount?: number;
  error?: string;
}

/**
 * Flashcard filter options for retrieval
 */
export interface FlashcardFilters {
  taskId?: string;
  status?: CardAction;
  search?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

/**
 * Zod schema for CardAction validation
 */
export const CardActionSchema = z.enum(['saved', 'known', 'review'], {
  errorMap: () => ({ message: 'Status must be one of: saved, known, review' })
});

/**
 * Zod schema for Flashcard validation (in-memory/temporary)
 */
export const FlashcardSchema = z.object({
  id: z.string().min(1, 'Flashcard ID is required'),
  front: z.string()
    .min(1, 'Question/prompt is required')
    .max(100, 'Question/prompt must be 100 characters or less')
    .transform(str => str.trim()),
  back: z.string()
    .min(1, 'Answer/explanation is required')
    .max(200, 'Answer/explanation must be 200 characters or less')
    .transform(str => str.trim()),
  pageNumber: z.number().int().positive().optional(),
  sourceText: z.string()
    .max(300, 'Source text must be 300 characters or less')
    .transform(str => str.trim())
    .optional(),
  confidence: z.number().min(0).max(1).optional(),
  createdAt: z.date().default(() => new Date()),
});

/**
 * Zod schema for SavedFlashcard validation (database storage)
 */
export const SavedFlashcardSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  userId: z.instanceof(ObjectId, { message: 'Valid user ID is required' }),
  taskId: z.string().min(1, 'Task ID is required'),
  pdfTitle: z.string()
    .min(1, 'PDF title is required')
    .max(200, 'PDF title must be 200 characters or less')
    .transform(str => str.trim()),
  question: z.string()
    .min(1, 'Question is required')
    .max(100, 'Question must be 100 characters or less')
    .transform(str => str.trim()),
  answer: z.string()
    .min(1, 'Answer is required')
    .max(200, 'Answer must be 200 characters or less')
    .transform(str => str.trim()),
  pageNumber: z.number().int().positive().optional(),
  sourceText: z.string()
    .max(300, 'Source text must be 300 characters or less')
    .transform(str => str.trim())
    .optional(),
  status: CardActionSchema,
  createdAt: z.date().default(() => new Date()),
  lastReviewed: z.date().optional(),
  reviewCount: z.number().int().min(0).default(0),
});

/**
 * Zod schema for FlashcardGenerationRequest validation
 */
export const FlashcardGenerationRequestSchema = z.object({
  pdfDataUri: z.string()
    .min(1, 'PDF data is required')
    .refine(
      (data) => data.startsWith('data:application/pdf;base64,'),
      'Invalid PDF format. Expected base64 encoded PDF with proper MIME type.'
    ),
  pdfTitle: z.string()
    .max(200, 'PDF title must be 200 characters or less')
    .transform(str => str.trim())
    .optional(),
  taskId: z.string().min(1, 'Task ID is required'),
  maxCards: z.number()
    .int()
    .min(5, 'Minimum 5 flashcards required')
    .max(15, 'Maximum 15 flashcards allowed')
    .default(10),
});

/**
 * Zod schema for FlashcardSaveRequest validation
 */
export const FlashcardSaveRequestSchema = z.object({
  flashcards: z.array(
    z.object({
      id: z.string().min(1, 'Flashcard ID is required'),
      question: z.string()
        .min(1, 'Question is required')
        .max(100, 'Question must be 100 characters or less')
        .transform(str => str.trim()),
      answer: z.string()
        .min(1, 'Answer is required')
        .max(200, 'Answer must be 200 characters or less')
        .transform(str => str.trim()),
      pageNumber: z.number().int().positive().optional(),
      sourceText: z.string()
        .max(300, 'Source text must be 300 characters or less')
        .transform(str => str.trim())
        .optional(),
      status: CardActionSchema,
    })
  ).min(1, 'At least one flashcard is required'),
  taskId: z.string().min(1, 'Task ID is required'),
  pdfTitle: z.string()
    .min(1, 'PDF title is required')
    .max(200, 'PDF title must be 200 characters or less')
    .transform(str => str.trim()),
});

/**
 * Zod schema for FlashcardFilters validation
 */
export const FlashcardFiltersSchema = z.object({
  taskId: z.string().optional(),
  status: CardActionSchema.optional(),
  search: z.string()
    .max(100, 'Search query must be 100 characters or less')
    .transform(str => str.trim())
    .optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// ============================================================================
// DATA SANITIZATION UTILITIES
// ============================================================================

/**
 * Sanitize flashcard data for database storage
 */
export function sanitizeFlashcardData(data: any): Partial<SavedFlashcard> {
  try {
    return SavedFlashcardSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid flashcard data: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Sanitize flashcard generation request
 */
export function sanitizeFlashcardGenerationRequest(data: any): FlashcardGenerationRequest {
  try {
    return FlashcardGenerationRequestSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid generation request: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Sanitize flashcard save request
 */
export function sanitizeFlashcardSaveRequest(data: any): FlashcardSaveRequest {
  try {
    return FlashcardSaveRequestSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid save request: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Sanitize flashcard filters
 */
export function sanitizeFlashcardFilters(data: any): FlashcardFilters {
  try {
    return FlashcardFiltersSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid filters: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}