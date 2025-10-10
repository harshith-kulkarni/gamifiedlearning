'use server';

/**
 * @fileOverview An AI chatbot that can answer questions about the uploaded PDF.
 *
 * - aiChatbotAssistance - A function that handles the AI chatbot assistance process.
 * - aiChatbotAssistanceStream - A function that streams AI chatbot assistance process.
 * - AiChatbotAssistanceInput - The input type for the aiChatbotAssistance function.
 * - AiChatbotAssistanceOutput - The return type for the aiChatbotAssistance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiChatbotAssistanceInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  question: z.string().describe('The student question about the PDF content.'),
});
export type AiChatbotAssistanceInput = z.infer<typeof AiChatbotAssistanceInputSchema>;

const AiChatbotAssistanceOutputSchema = z.object({
  answer: z.string().describe('The AI chatbot answer to the student question.'),
});
export type AiChatbotAssistanceOutput = z.infer<typeof AiChatbotAssistanceOutputSchema>;

// Simple in-memory cache for AI responses
const chatCache = new Map<string, {data: AiChatbotAssistanceOutput, timestamp: number}>();

export async function aiChatbotAssistance(input: AiChatbotAssistanceInput): Promise<AiChatbotAssistanceOutput> {
  // Create a cache key based on the input
  const cacheKey = `${input.pdfDataUri}-${input.question}`;
  
  // Check cache first
  if (chatCache.has(cacheKey)) {
    const cached = chatCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes TTL
      console.log('Returning cached chat response');
      return cached.data;
    } else {
      // Expired, remove from cache
      chatCache.delete(cacheKey);
    }
  }

  // Generate new response
  console.log('Generating new chat response');
  const result = await aiChatbotAssistanceFlow(input);
  
  // Cache the result
  chatCache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });
  
  return result;
}

// Streaming version of the AI chatbot assistance
export async function aiChatbotAssistanceStream(input: AiChatbotAssistanceInput) {
  // Create a cache key based on the input
  const cacheKey = `${input.pdfDataUri}-${input.question}`;
  
  // Check cache first
  if (chatCache.has(cacheKey)) {
    const cached = chatCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes TTL
      console.log('Returning cached chat response via stream');
      // Return the cached response in chunks for streaming effect
      const cachedAnswer = cached.data.answer;
      const chunks = [];
      for (let i = 0; i < cachedAnswer.length; i += 5) {
        chunks.push(cachedAnswer.slice(i, i + 5));
      }
      return chunks;
    } else {
      // Expired, remove from cache
      chatCache.delete(cacheKey);
    }
  }

  console.log('Generating new chat response via stream');
  const result = await aiChatbotAssistanceFlow(input);
  
  // Cache the result
  chatCache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });
  
  // Return the response in chunks for streaming effect
  const answer = result.answer;
  const chunks = [];
  for (let i = 0; i < answer.length; i += 5) {
    chunks.push(answer.slice(i, i + 5));
  }
  return chunks;
}

const prompt = ai.definePrompt({
  name: 'aiChatbotAssistancePrompt',
  input: {schema: AiChatbotAssistanceInputSchema},
  output: {schema: AiChatbotAssistanceOutputSchema},
  prompt: `You are a helpful AI chatbot assisting students with their studies.
You have access to the text content of a PDF document and will answer student questions based on this content.

PDF Content: {{media url=pdfDataUri}}

Student Question: {{{question}}}

Answer:`,
});

const aiChatbotAssistanceFlow = ai.defineFlow(
  {
    name: 'aiChatbotAssistanceFlow',
    inputSchema: AiChatbotAssistanceInputSchema,
    outputSchema: AiChatbotAssistanceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);