'use server';

/**
 * @fileOverview Analyzes quiz performance and provides feedback.
 *
 * - analyzeQuizPerformance - A function that analyzes quiz performance.
 * - AnalyzeQuizPerformanceInput - The input type for the analyzeQuizPerformance function.
 * - AnalyzeQuizPerformanceOutput - The return type for the analyzeQuizPerformance function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const QuestionAndAnswerSchema = z.object({
  question: z.string().describe('The quiz question.'),
  options: z.array(z.string()).describe('The possible answers to the question.'),
  answer: z.string().describe('The correct answer to the question.'),
});

const UserAnswerSchema = z.object({
    questionIndex: z.number(),
    answer: z.string(),
});

const AnalyzeQuizPerformanceInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
  questions: z.array(QuestionAndAnswerSchema).describe("The full list of quiz questions and their correct answers."),
  userAnswers: z.array(UserAnswerSchema).describe("The user's submitted answers.")
});
export type AnalyzeQuizPerformanceInput = z.infer<typeof AnalyzeQuizPerformanceInputSchema>;

const AnalyzeQuizPerformancePromptInputSchema = z.object({
    pdfDataUri: z.string(),
    questions: z.string(),
    userAnswers: z.string(),
});

const AnalyzeQuizPerformanceOutputSchema = z.object({
  strengths: z.array(z.string()).describe("A list of topics or concepts the user seems to understand well based on their correct answers. Provide 3 points."),
  weaknesses: z.array(z.string()).describe("A list of topics or areas for improvement based on incorrect answers. Provide 3 points."),
});
export type AnalyzeQuizPerformanceOutput = z.infer<typeof AnalyzeQuizPerformanceOutputSchema>;

// Simple in-memory cache for AI responses
const performanceCache = new Map<string, {data: AnalyzeQuizPerformanceOutput, timestamp: number}>();

export async function analyzeQuizPerformance(input: AnalyzeQuizPerformanceInput): Promise<AnalyzeQuizPerformanceOutput> {
  // Create a cache key based on the input
  const cacheKey = `${input.pdfDataUri}-${JSON.stringify(input.questions)}-${JSON.stringify(input.userAnswers)}`;
  
  // Check cache first
  if (performanceCache.has(cacheKey)) {
    const cached = performanceCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes TTL
      return cached.data;
    } else {
      // Expired, remove from cache
      performanceCache.delete(cacheKey);
    }
  }

  // Generate new analysis
  const result = await analyzeQuizPerformanceFlow(input);
  
  // Cache the result
  performanceCache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });
  
  return result;
}

const prompt = ai.definePrompt({
  name: 'analyzeQuizPerformancePrompt',
  input: { schema: AnalyzeQuizPerformancePromptInputSchema },
  output: { schema: AnalyzeQuizPerformanceOutputSchema },
  prompt: `You are an expert AI tutor. Your task is to analyze a student's quiz performance based on a provided document.

You will be given the original document, the list of quiz questions (with correct answers), and the student's answers.

Identify the topics and concepts from the document where the student answered correctly. These are their strengths.
Identify the topics and concepts where the student answered incorrectly. These are their areas for improvement.

Provide a concise analysis with 3 bullet points for strengths and 3 for areas for improvement. Phrase the feedback constructively.

Document Content: {{media url=pdfDataUri}}

Quiz Questions:
{{{questions}}}

Student's Answers:
{{{userAnswers}}}
`,
});

const analyzeQuizPerformanceFlow = ai.defineFlow(
  {
    name: 'analyzeQuizPerformanceFlow',
    inputSchema: AnalyzeQuizPerformanceInputSchema,
    outputSchema: AnalyzeQuizPerformanceOutputSchema,
  },
  async (input: AnalyzeQuizPerformanceInput) => {
    const { output } = await prompt({
        pdfDataUri: input.pdfDataUri,
        questions: JSON.stringify(input.questions, null, 2),
        userAnswers: JSON.stringify(input.userAnswers, null, 2),
    });
    if (!output) {
      throw new Error('Failed to analyze quiz performance');
    }
    return output;
  }
);