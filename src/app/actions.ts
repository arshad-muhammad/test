// @ts-nocheck
'use server';

import { detectPlagiarism, type DetectPlagiarismInput, type DetectPlagiarismOutput } from '@/ai/flows/detect-plagiarism';

export async function analyzeTextForPlagiarism(input: DetectPlagiarismInput): Promise<DetectPlagiarismOutput> {
  // The AI flow might throw an error or return an unexpected structure if the prompt is not perfectly handled by the LLM.
  // It's good practice to validate the output or have robust error handling.
  try {
    const result = await detectPlagiarism(input);
    // Basic validation for the expected output structure
    if (typeof result.plagiarismPercentage !== 'number' || typeof result.highlightedText !== 'string') {
        console.error('Invalid output structure from AI:', result);
        throw new Error('Received an invalid response from the AI model.');
    }
    return result;
  } catch (error) {
    console.error('Error in plagiarism detection flow:', error);
    // Re-throw a more generic error to avoid exposing internal details to the client.
    if (error instanceof Error) {
        // If it's a known error, you might customize the message.
        // For now, a generic message is fine.
         throw new Error('An error occurred during plagiarism analysis. Please try again later.');
    }
    throw new Error('An unknown error occurred during plagiarism analysis.');
  }
}
