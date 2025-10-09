'use server';

/**
 * @fileOverview An AI chatbot that can answer questions about the uploaded PDF.
 *
 * - aiChatbotAssistance - A function that handles the AI chatbot assistance process.
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

export async function aiChatbotAssistance(input: AiChatbotAssistanceInput): Promise<AiChatbotAssistanceOutput> {
  return aiChatbotAssistanceFlow(input);
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
