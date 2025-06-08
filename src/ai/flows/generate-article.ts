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
  articleContent: z.string().describe('The generated article content.'),
});
export type GenerateArticleOutput = z.infer<typeof GenerateArticleOutputSchema>;

export async function generateArticle(input: GenerateArticleInput): Promise<GenerateArticleOutput> {
  return generateArticleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateArticlePrompt',
  input: {schema: GenerateArticleInputSchema},
  output: {schema: GenerateArticleOutputSchema},
  prompt: `You are a research writer. Write a highly detailed article of 6000+ words on the topic: "{{user_topic}}". Organize it into sections with H2/H3 headings. After every section, include 1–2 real relevant links (e.g., from Wikipedia, Forbes, Scientific American, Harvard.edu, etc.). Keep the tone {{tone}}. The output format should be {{format}}.`,
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
