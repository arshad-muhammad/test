
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
    .describe('The text with plagiarized sections highlighted.'),
});
export type DetectPlagiarismOutput = z.infer<typeof DetectPlagiarismOutputSchema>;

export async function detectPlagiarism(input: DetectPlagiarismInput): Promise<DetectPlagiarismOutput> {
  return detectPlagiarismFlow(input);
}

const detectPlagiarismPrompt = ai.definePrompt({
  name: 'detectPlagiarismPrompt',
  input: {schema: DetectPlagiarismInputSchema},
  output: {schema: DetectPlagiarismOutputSchema},
  prompt: `You are a highly advanced plagiarism detection system. Your primary function is to meticulously analyze text for any signs of plagiarism and to quantify the extent of such plagiarism.

Plagiarism is defined as the use of another's work, ideas, or words as one's own without proper attribution. This includes:
1.  Direct verbatim copying from any source (websites, books, articles, AI outputs, etc.).
2.  Significant paraphrasing that closely mirrors the structure and language of a source without adequate citation.
3.  Use of AI-generated text that is presented as original work without disclosure, especially if it lacks novel contribution or rephrasing.

Your task:
Given the following input text:
\`{{{text}}}\`

You must perform the following actions:
1.  **Analyze for Plagiarism:** Scrutinize the text for segments that match the definition of plagiarism above. Consider both semantic similarity and exact matches.
2.  **Highlight Plagiarized Sections:** For every segment identified as plagiarized, you MUST wrap it in an HTML \`<span>\` tag styled with a light red background. Specifically, use \`<span style="background-color: rgba(255, 0, 0, 0.2);">\` before the plagiarized text and \`</span>\` after it. Ensure that the rest of the text remains unchanged and that only plagiarized parts are highlighted. The \`highlightedText\` output should be the complete original text with these \`<span>\` tags inserted.
3.  **Calculate Plagiarism Percentage:** Determine the overall percentage of the text that is plagiarized. This should be a numerical value between 0 and 100, inclusive. Base this calculation on the proportion of the text content (e.g., word count or character count) that is highlighted as plagiarized.

Output Format:
Provide your response strictly according to the DetectPlagiarismOutputSchema.
- \`plagiarismPercentage\`: A number representing the calculated percentage.
- \`highlightedText\`: The full input text with plagiarized sections wrapped in the specified \`<span>\` tags.

Example of highlighting:
If the input is "This is original. This is copied. This is also original."
And "This is copied." is plagiarized, the \`highlightedText\` should be:
"This is original. <span style=\\"background-color: rgba(255, 0, 0, 0.2);\\">This is copied.</span> This is also original."

Focus on accuracy and thoroughness in your detection.`,
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
