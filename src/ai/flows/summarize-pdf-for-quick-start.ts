'use server';

/**
 * @fileOverview A flow to summarize a PDF for quick understanding.
 *
 * - summarizePdf - A function that takes a PDF data URI and returns a summary of the PDF content.
 * - SummarizePdfInput - The input type for the summarizePdf function.
 * - SummarizePdfOutput - The return type for the summarizePdf function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const SummarizePdfInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      'A PDF document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // prettier-ignore
    ),
});
export type SummarizePdfInput = z.infer<typeof SummarizePdfInputSchema>;

const SummarizePdfOutputSchema = z.object({
  summary: z.string().describe('A short summary of the PDF content.'),
  progress: z.string().describe('Current progress of the summarization process.')
});
export type SummarizePdfOutput = z.infer<typeof SummarizePdfOutputSchema>;

export async function summarizePdf(input: SummarizePdfInput): Promise<SummarizePdfOutput> {
  return summarizePdfFlow(input);
}

const summarizePdfPrompt = ai.definePrompt({
  name: 'summarizePdfPrompt',
  input: {schema: SummarizePdfInputSchema},
  output: {schema: SummarizePdfOutputSchema},
  prompt: `You are an expert summarizer of PDF documents.  Please read the following PDF document and create a short summary of the document.

PDF Document: {{media url=pdfDataUri}}`,
});

const summarizePdfFlow = ai.defineFlow(
  {
    name: 'summarizePdfFlow',
    inputSchema: SummarizePdfInputSchema,
    outputSchema: SummarizePdfOutputSchema,
  },
  async (input: SummarizePdfInput) => {
    const {output} = await summarizePdfPrompt(input);
    return {
      ...output,
      progress: 'Generated a one-sentence summary of the PDF.'
    } as SummarizePdfOutput; // Force casting here since `output` may be undefined, which conflicts with the schema.
  }
);
