'use server';

import { generateQuizQuestions } from '@/ai/flows/generate-quiz-questions-from-pdf';
import { analyzeQuizPerformance } from '@/ai/flows/analyze-quiz-performance';
import { aiChatbotAssistance } from '@/ai/flows/ai-chatbot-assistance';

/**
 * Pre-generate quiz questions for a PDF document
 * This can be called during study session creation to prepare the quiz in advance
 */
export async function pregenerateQuizQuestions(pdfDataUri: string) {
  try {
    console.log('Pregenerating quiz questions for PDF');
    const result = await generateQuizQuestions({ pdfDataUri });
    return { success: true, questions: result.questions };
  } catch (error) {
    console.error('Failed to pregenerate quiz questions:', error);
    return { success: false, error: 'Failed to generate quiz questions' };
  }
}

/**
 * Pre-analyze quiz performance
 * This can be called after quiz completion to prepare feedback
 */
export async function preanalyzeQuizPerformance(
  pdfDataUri: string,
  questions: any[],
  userAnswers: any[]
) {
  try {
    console.log('Pre-analyzing quiz performance');
    const result = await analyzeQuizPerformance({ 
      pdfDataUri, 
      questions, 
      userAnswers 
    });
    return { success: true, analysis: result };
  } catch (error) {
    console.error('Failed to pre-analyze quiz performance:', error);
    return { success: false, error: 'Failed to analyze performance' };
  }
}

/**
 * Pre-generate AI chat response
 * This can be called to prepare common questions in advance
 */
export async function pregenerateAIResponse(pdfDataUri: string, question: string) {
  try {
    console.log('Pregenerating AI response for question:', question);
    const result = await aiChatbotAssistance({ pdfDataUri, question });
    return { success: true, answer: result.answer };
  } catch (error) {
    console.error('Failed to pre-generate AI response:', error);
    return { success: false, error: 'Failed to generate AI response' };
  }
}