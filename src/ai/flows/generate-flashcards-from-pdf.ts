'use server';
/**
 * @fileOverview Generates flashcards from a PDF document.
 *
 * - generateFlashcards - A function that generates flashcards from a PDF.
 * - GenerateFlashcardsInput - The input type for the generateFlashcards function.
 * - GenerateFlashcardsOutput - The return type for the generateFlashcards function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  console.log('🔄 Starting flashcard generation, maxCards:', input.maxCards);
  
  // Create cache key from input
  const cacheKey = `${input.pdfDataUri.substring(0, 100)}_${input.maxCards}`;
  
  // Check cache first
  if (flashcardCache.has(cacheKey)) {
    const cached = flashcardCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes TTL
      console.log('📦 Returning cached flashcards');
      return cached.data;
    } else {
      // Expired, remove from cache
      flashcardCache.delete(cacheKey);
    }
  }

  // Generate new flashcards
  console.log('🤖 Generating new flashcards with AI...');
  const result = await generateFlashcardsFlow(input);
  console.log('✅ AI generation completed, flashcards:', result.flashcards.length);
  
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

Generate exactly {{maxCards}} flashcards from the document. Each flashcard must follow these strict requirements:

CRITICAL: Character limits must be strictly followed:
- Question (front): Maximum 100 characters - keep questions short and focused
- Answer (back): Maximum 200 characters - provide concise but complete answers
- Source text: Maximum 300 characters if provided

Guidelines:
- Focus on key concepts, definitions, and important facts
- Use clear, direct language
- Avoid unnecessary words or filler
- Each question should test one specific concept
- Answers should be factual and precise
- Confidence score should reflect how well the content supports the flashcard (0.0 to 1.0)

Document: {{media url=pdfDataUri}}`,
});

const generateFlashcardsFlow = ai.defineFlow(
  {
    name: 'generateFlashcardsFlow',
    inputSchema: GenerateFlashcardsInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async input => {
    const startTime = Date.now();
    console.log('🚀 Starting AI flow execution...');
    
    try {
      const {output} = await flashcardPrompt(input);
      console.log('🎯 AI prompt completed, processing output...');
      
      if (!output || !output.flashcards) {
        console.error('❌ No output or flashcards from AI');
        throw new Error('No flashcards generated from AI');
      }
      
      console.log('📊 Raw flashcards from AI:', output.flashcards.length);
      
      // Basic validation and enhancement with content truncation
      const enhancedFlashcards = output.flashcards.map((card, index) => {
        // Truncate content to meet schema requirements
        const truncateFront = (text: string) => {
          if (text.length <= 100) return text;
          return text.substring(0, 97) + '...';
        };
        
        const truncateBack = (text: string) => {
          if (text.length <= 200) return text;
          return text.substring(0, 197) + '...';
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

      console.log('✨ Enhanced flashcards ready:', enhancedFlashcards.length);

      return {
        flashcards: enhancedFlashcards,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('❌ Error in AI flow:', error);
      throw error;
    }
  }
);