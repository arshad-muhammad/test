
// src/ai/flows/generate-article.ts
'use server';

/**
 * @fileOverview Generates a detailed article based on a user-provided topic.
 *
 * - generateArticle - A function that generates an article.
 * - GenerateArticleInput - The input type for the generateArticle function.
 * - GenerateArticleOutput - The return type for the generateArticle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateArticleInputSchema = z.object({
  user_topic: z.string().describe('The topic for the article.'),
  tone: z.enum(['Academic', 'Blog', 'Creative']).default('Blog').describe('The tone of the article.'),
  format: z.enum(['Plain Text', 'Markdown', 'PDF']).default('Markdown').describe('The output format for the article.'),
});
export type GenerateArticleInput = z.infer<typeof GenerateArticleInputSchema>;

const GenerateArticleOutputSchema = z.object({
  articleContent: z.string().describe('The generated article content, including a References section at the end.'),
});
export type GenerateArticleOutput = z.infer<typeof GenerateArticleOutputSchema>;

export async function generateArticle(input: GenerateArticleInput): Promise<GenerateArticleOutput> {
  return generateArticleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateArticlePrompt',
  input: {schema: GenerateArticleInputSchema},
  output: {schema: GenerateArticleOutputSchema},
  prompt: `You are an expert research writer. Your task is to generate a comprehensive and highly detailed article of AT LEAST 6000 words, strictly focused on the topic: "{{user_topic}}".

Follow these instructions carefully:
1.  **Content Focus**: The entire article must be dedicated to the specified "{{user_topic}}". Do not deviate to other topics.
2.  **Structure**: Organize the article logically into sections and subsections using H2 and H3 headings as appropriate for the "{{format}}" output.
3.  **In-text Links**: After every major section of the article, you MUST include 1-2 real, relevant links from reputable sources (e.g., Wikipedia, Forbes, Scientific American, Harvard.edu, etc.). These links should be directly related to the content of that section and formatted as clickable links appropriate for the "{{format}}".
4.  **Tone**: Maintain a "{{tone}}" tone throughout the article.
5.  **References Section**: At the VERY END of the entire article content, after all sections and their respective in-text links, you MUST add a final section. This section should start with a heading like "## References" (if format is Markdown; use an equivalent plain text heading if format is "Plain Text" e.g., "References:"). Under this "References" heading, create a list of ALL the unique URLs that you embedded as in-text links throughout the article. Each URL in this list should be on a new line, and also formatted as a clickable link if the "{{format}}" supports it (e.g., in Markdown, use <http://example.com> or [http://example.com](http://example.com)).
6.  **Output Format**: The final output, including all sections, in-text links, and the final "References" section, should be in "{{format}}".

The generated 'articleContent' must contain the full article including this final "References" section.`,
});

const generateArticleFlow = ai.defineFlow(
  {
    name: 'generateArticleFlow',
    inputSchema: GenerateArticleInputSchema,
    outputSchema: GenerateArticleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

