'use server';

/**
 * @fileOverview A plagiarism detection AI agent.
 *
 * - detectPlagiarism - A function that handles the plagiarism detection process.
 * - DetectPlagiarismInput - The input type for the detectPlagiarism function.
 * - DetectPlagiarismOutput - The return type for the detectPlagiarism function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectPlagiarismInputSchema = z.object({
  text: z.string().describe('The text to analyze for plagiarism.'),
});
export type DetectPlagiarismInput = z.infer<typeof DetectPlagiarismInputSchema>;

const DetectPlagiarismOutputSchema = z.object({
  plagiarismPercentage: z
    .number()
    .describe('The percentage of the text that is plagiarized.'),
  highlightedText: z
    .string()
    .describe('The text with plagiarized sections highlighted in red.'),
});
export type DetectPlagiarismOutput = z.infer<typeof DetectPlagiarismOutputSchema>;

export async function detectPlagiarism(input: DetectPlagiarismInput): Promise<DetectPlagiarismOutput> {
  return detectPlagiarismFlow(input);
}

const detectPlagiarismPrompt = ai.definePrompt({
  name: 'detectPlagiarismPrompt',
  input: {schema: DetectPlagiarismInputSchema},
  output: {schema: DetectPlagiarismOutputSchema},
  prompt: `You are a plagiarism detection expert. You will analyze the given text and determine the percentage of plagiarism. You will highlight the plagiarized sections in red using HTML <span style="color:red"> tags. Return the plagiarism percentage and the highlighted text.

Text: {{{text}}}`,
});

const detectPlagiarismFlow = ai.defineFlow(
  {
    name: 'detectPlagiarismFlow',
    inputSchema: DetectPlagiarismInputSchema,
    outputSchema: DetectPlagiarismOutputSchema,
  },
  async input => {
    const {output} = await detectPlagiarismPrompt(input);
    return output!;
  }
);
