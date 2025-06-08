// This file is machine-generated - edit at your own risk!

'use server';

/**
 * @fileOverview An SEO metadata generation AI agent.
 *
 * - generateSeoMetadata - A function that handles the SEO metadata generation process.
 * - GenerateSeoMetadataInput - The input type for the generateSeoMetadata function.
 * - GenerateSeoMetadataOutput - The return type for the generateSeoMetadata function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSeoMetadataInputSchema = z.object({
  articleContent: z.string().describe('The full content of the article.'),
  userTopic: z.string().describe('The topic of the article provided by the user.'),
});
export type GenerateSeoMetadataInput = z.infer<
  typeof GenerateSeoMetadataInputSchema
>;

const GenerateSeoMetadataOutputSchema = z.object({
  seoTitle: z
    .string()
    .describe('The generated SEO title for the article (50-60 characters).'),
  metaDescription:
    z
      .string()
      .describe(
        'The generated meta description for the article (150-160 characters).' /* This is the max length for a meta description */
      ),
});
export type GenerateSeoMetadataOutput = z.infer<
  typeof GenerateSeoMetadataOutputSchema
>;

export async function generateSeoMetadata(
  input: GenerateSeoMetadataInput
): Promise<GenerateSeoMetadataOutput> {
  return generateSeoMetadataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSeoMetadataPrompt',
  input: {schema: GenerateSeoMetadataInputSchema},
  output: {schema: GenerateSeoMetadataOutputSchema},
  prompt: `You are an SEO expert. Generate an SEO title and meta description for the following article.

  Topic: {{{userTopic}}}

  Article content: {{{articleContent}}}

  The SEO title should be 50-60 characters.
  The meta description should be 150-160 characters.
  `,
});

const generateSeoMetadataFlow = ai.defineFlow(
  {
    name: 'generateSeoMetadataFlow',
    inputSchema: GenerateSeoMetadataInputSchema,
    outputSchema: GenerateSeoMetadataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
