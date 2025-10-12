'use server';
/**
 * @fileOverview Generates flashcards from a PDF document.
 *
 * - generateFlashcards - A function that generates flashcards from a PDF.
 * - GenerateFlashcardsInput - The input type for the generateFlashcards function.
 * - GenerateFlashcardsOutput - The return type for the generateFlashcards function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateFlashcardsInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  maxCards: z
    .number()
    .min(5)
    .max(15)
    .default(10)
    .describe('Maximum number of flashcards to generate (5-15)'),
});
export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsInputSchema>;

const GenerateFlashcardsOutputSchema = z.object({
  flashcards: z.array(
    z.object({
      id: z.string().describe('Unique identifier for the flashcard.'),
      front: z.string().max(100).describe('The question or prompt (max 100 characters).'),
      back: z.string().max(200).describe('The answer or explanation (max 200 characters).'),
      pageNumber: z.number().optional().describe('Page number where the content was found.'),
      sourceText: z.string().max(300).optional().describe('Context snippet from the source (max 300 characters).'),
      confidence: z.number().min(0).max(1).describe('AI confidence score for this flashcard (0-1).'),
      createdAt: z.string().describe('Creation timestamp for the flashcard as ISO string.'),
    })
  ).describe('The generated flashcards.'),
  processingTime: z.number().describe('Time taken to process the request in milliseconds.'),
});
export type GenerateFlashcardsOutput = z.infer<typeof GenerateFlashcardsOutputSchema>;

// Simple in-memory cache for AI responses
const flashcardCache = new Map<string, { data: GenerateFlashcardsOutput; timestamp: number }>();

export async function generateFlashcards(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput> {
  // Create cache key from input
  const cacheKey = `${input.pdfDataUri.substring(0, 100)}_${input.maxCards}`;
  
  // Check cache first
  if (flashcardCache.has(cacheKey)) {
    const cached = flashcardCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes TTL
      return cached.data;
    } else {
      // Expired, remove from cache
      flashcardCache.delete(cacheKey);
    }
  }

  // Generate new flashcards
  const result = await generateFlashcardsFlow(input);
  
  // Cache the result
  flashcardCache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });
  
  return result;
}

const flashcardPrompt = ai.definePrompt({
  name: 'generateFlashcardsPrompt',
  input: {schema: GenerateFlashcardsInputSchema},
  output: {schema: GenerateFlashcardsOutputSchema},
  prompt: `You are an expert flashcard generator that creates study cards from PDF documents.

Generate exactly {{maxCards}} flashcards from the document. Each flashcard must follow these STRICT requirements:

CRITICAL CHARACTER LIMITS (will be enforced):
- Question (front): MAXIMUM 100 characters - be concise and direct
- Answer (back): MAXIMUM 200 characters - provide essential information only
- Source text: MAXIMUM 300 characters if provided

CONTENT GUIDELINES:
- Focus on key concepts, definitions, and important facts
- Use clear, direct language without filler words
- Each question should test one specific concept
- Answers should be factual and precise
- Avoid complex sentences - use simple, clear statements
- Break down complex concepts into digestible parts
- Confidence score should reflect content quality (0.0 to 1.0)

EXAMPLES:
Good Question (85 chars): "What architectural feature helps ResNet prevent vanishing gradients?"
Good Answer (156 chars): "Skip connections (residual connections) that allow gradients to flow directly through layers, bypassing non-linear transformations."

Document: {{media url=pdfDataUri}}`,
});

const generateFlashcardsFlow = ai.defineFlow(
  {
    name: 'generateFlashcardsFlow',
    inputSchema: GenerateFlashcardsInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async (input: GenerateFlashcardsInput) => {
    const startTime = Date.now();
    
    try {
      const {output} = await flashcardPrompt(input);
      
      if (!output || !output.flashcards) {
        throw new Error('No flashcards generated from AI');
      }
      
      // Basic validation and enhancement with content truncation
      const enhancedFlashcards = output.flashcards.map((card: any, index: number) => {
        // Truncate content to meet schema requirements
        const truncateFront = (text: string) => {
          if (!text) return '';
          if (text.length <= 100) return text;
          // Find the last complete word within the limit
          const truncated = text.substring(0, 97);
          const lastSpace = truncated.lastIndexOf(' ');
          const breakPoint = lastSpace > 80 ? lastSpace : 97;
          return text.substring(0, breakPoint).trim() + '...';
        };
        
        const truncateBack = (text: string) => {
          if (!text) return '';
          if (text.length <= 200) return text;
          // Find the last complete sentence or phrase within the limit
          const truncated = text.substring(0, 197);
          const lastPeriod = truncated.lastIndexOf('.');
          const lastComma = truncated.lastIndexOf(',');
          const lastSpace = truncated.lastIndexOf(' ');
          
          // Use the best break point
          const breakPoint = lastPeriod > 150 ? lastPeriod + 1 : 
                           lastComma > 150 ? lastComma + 1 : 
                           lastSpace > 150 ? lastSpace : 197;
          
          return text.substring(0, breakPoint).trim() + '...';
        };
        
        const truncateSource = (text?: string) => {
          if (!text || text.length <= 300) return text;
          return text.substring(0, 297) + '...';
        };

        return {
          id: card.id || `flashcard_${Date.now()}_${index}`,
          front: truncateFront(card.front || `Question ${index + 1}`),
          back: truncateBack(card.back || `Answer ${index + 1}`),
          pageNumber: card.pageNumber,
          sourceText: truncateSource(card.sourceText),
          confidence: Math.min(Math.max(card.confidence || 0.7, 0), 1), // Ensure 0-1 range
          createdAt: new Date().toISOString(),
        };
      });

      return {
        flashcards: enhancedFlashcards,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      throw error;
    }
  }
);