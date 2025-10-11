'use server';
/**
 * @fileOverview Generates quiz questions from a PDF document.
 *
 * - generateQuizQuestions - A function that generates quiz questions from a PDF.
 * - GenerateQuizQuestionsInput - The input type for the generateQuizQuestions function.
 * - GenerateQuizQuestionsOutput - The return type for the generateQuizQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuizQuestionsInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateQuizQuestionsInput = z.infer<typeof GenerateQuizQuestionsInputSchema>;

const GenerateQuizQuestionsOutputSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().describe('The quiz question.'),
      options: z.array(z.string()).describe('The possible answers to the question.'),
      answer: z.string().describe('The correct answer to the question.'),
    })
  ).describe('The generated quiz questions.'),
});
export type GenerateQuizQuestionsOutput = z.infer<typeof GenerateQuizQuestionsOutputSchema>;

// Simple in-memory cache for AI responses
interface CachedQuizResult {
  data: GenerateQuizQuestionsOutput;
  timestamp: number;
}
const quizCache = new Map<string, CachedQuizResult>();

export async function generateQuizQuestions(input: GenerateQuizQuestionsInput): Promise<GenerateQuizQuestionsOutput> {
  // Check cache first
  if (quizCache.has(input.pdfDataUri)) {
    const cached = quizCache.get(input.pdfDataUri);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes TTL
      console.log('Returning cached quiz questions');
      return cached.data;
    } else {
      // Expired, remove from cache
      quizCache.delete(input.pdfDataUri);
    }
  }

  // Generate new questions
  console.log('Generating new quiz questions');
  const result = await generateQuizQuestionsFlow(input);
  
  // Cache the result
  quizCache.set(input.pdfDataUri, {
    data: result,
    timestamp: Date.now()
  });
  
  return result;
}

const prompt = ai.definePrompt({
  name: 'generateQuizQuestionsPrompt',
  input: {schema: GenerateQuizQuestionsInputSchema},
  output: {schema: GenerateQuizQuestionsOutputSchema},
  prompt: `You are a quiz generator that can generate multiple choice questions with 4 options based on a document.

  The output should be a JSON array of exactly 25 questions. Each question should have a question field, options field, and answer field.

  The options field should be an array of 4 strings.

  The answer field should be one of the options.

  Generate exactly 25 questions.

  Document: {{media url=pdfDataUri}}`,
});

const generateQuizQuestionsFlow = ai.defineFlow(
  {
    name: 'generateQuizQuestionsFlow',
    inputSchema: GenerateQuizQuestionsInputSchema,
    outputSchema: GenerateQuizQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);