
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
  prompt: `You are a highly advanced plagiarism detection system. Your primary function is to meticulously analyze text for any signs of plagiarism and to quantify the extent of such plagiarism. Your judgment must be strict to uphold academic and professional integrity.

Plagiarism is defined as the use of another's work, ideas, or words as one's own without proper attribution. This includes, but is not limited to:
1.  **Direct Verbatim Copying:** Identical phrases, sentences, or longer passages taken from any source (websites, books, articles, AI outputs, etc.) without quotation marks and citation.
2.  **Close Paraphrasing:** Sentences or paragraphs that have been slightly reworded (e.g., synonyms used, sentence order changed, minor grammatical modifications) but retain the original structure, core ideas, and unique phrasing of a source. This is unequivocally plagiarism if not properly attributed and significantly recontextualized. Superficial changes are not sufficient.
3.  **Mosaic Plagiarism (Patchwriting):** Weaving together phrases, sentences, and ideas from various sources (or from a single source) without proper attribution, often with minor alterations. The resulting text, while appearing novel, is still substantially derived from uncredited sources.
4.  **Crucial Focus: Unattributed AI-Generated Content:** This is a primary target for detection. Text originating from AI language models (e.g., GPT, Gemini, Claude) and submitted as original human work without substantial, transformative human input and clear disclosure **MUST be treated as plagiarized.**
    *   **Hallmarks of AI Text:** Actively look for common characteristics such as generic or overly polished language, repetitive structures, lack of novel insights or personal voice, and content easily producible by a standard AI prompt.
    *   **Strict Standard:** If text exhibits these signs and lacks clear evidence of significant human authorship and transformation, **it IS plagiarized. Highlight it.** Superficial rephrasing or minor additions are NOT sufficient to make AI text original. Do not give the benefit of the doubt to untransformed AI output.

Your task:
Given the following input text:
\`{{{text}}}\`

You must perform the following actions with utmost diligence:
1.  **Analyze for Plagiarism:** Scrutinize the text for segments that match any of the definitions of plagiarism above, **paying extremely close attention to identifying Unattributed AI-Generated Content as per definition 4.** Consider both semantic similarity and exact textual matches. Be particularly vigilant for subtle paraphrasing and AI-generated content that has not been meaningfully transformed. **If AI-generated content is detected and it does not meet the criteria for substantial human transformation, it must be highlighted.**
2.  **Highlight Plagiarized Sections:** For *every* segment identified as plagiarized, you MUST wrap it in *exactly* this HTML \`<span>\` tag: \`<span style="background-color: rgba(255, 100, 100, 0.3);">\`. Do NOT use any other styling, additional HTML tags, or modify the non-plagiarized text in any way. The \`highlightedText\` output must be the complete original text with these \`<span>\` tags inserted *only* around unequivocally plagiarized portions. If no plagiarism is detected, the \`highlightedText\` should be identical to the input text.
3.  **Calculate Plagiarism Percentage:** Determine the overall percentage of the text that is plagiarized. This should be a numerical value between 0 and 100, inclusive. Base this calculation strictly on the proportion of the text content (e.g., character count within the highlighted spans) relative to the total character count of the input text. Be precise.

Output Format:
Provide your response strictly according to the DetectPlagiarismOutputSchema.
- \`plagiarismPercentage\`: A number representing the calculated percentage.
- \`highlightedText\`: The full input text with plagiarized sections wrapped in the specified \`<span>\` tags, or the original text if no plagiarism is found.

Example of highlighting:
If the input is "This is original. This is copied. This is also original."
And "This is copied." is plagiarized, the \`highlightedText\` should be:
"This is original. <span style=\\"background-color: rgba(255, 100, 100, 0.3);\\">This is copied.</span> This is also original."

Focus on extreme accuracy and thoroughness in your detection. Be highly critical and err on the side of identifying potential unoriginality when text appears to be insufficiently transformed or improperly attributed. Your primary goal is to maintain the highest standards of academic and professional integrity by flagging all instances of plagiarism, especially untransformed AI-generated content.
`,
});

const detectPlagiarismFlow = ai.defineFlow(
  {
    name: 'detectPlagiarismFlow',
    inputSchema: DetectPlagiarismInputSchema,
    outputSchema: DetectPlagiarismOutputSchema,
  },
  async input => {
    const {output} = await detectPlagiarismPrompt(input);
    // Ensure the output is not null and adheres to the schema, especially for highlightedText
    if (!output) {
        // This case should ideally be handled by Genkit or the LLM, but as a fallback:
        console.error('AI output was null for plagiarism detection.');
        return {
            plagiarismPercentage: 0,
            highlightedText: input.text, // Return original text if AI fails to output
        };
    }
     // Basic validation for the expected output structure
    if (typeof output.plagiarismPercentage !== 'number' || typeof output.highlightedText !== 'string') {
        console.error('Invalid output structure from AI:', output);
        // Fallback to returning original text and 0% plagiarism to prevent app crash
        return {
            plagiarismPercentage: 0,
            highlightedText: input.text,
        };
    }
    return output;
  }
);

