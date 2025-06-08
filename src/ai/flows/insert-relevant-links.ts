'use server';

/**
 * @fileOverview An AI agent that inserts relevant real-world links after each section of an article.
 *
 * - insertRelevantLinks - A function that handles the process of inserting relevant links into an article.
 * - InsertRelevantLinksInput - The input type for the insertRelevantLinks function.
 * - InsertRelevantLinksOutput - The return type for the insertRelevantLinks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InsertRelevantLinksInputSchema = z.object({
  articleSection: z.string().describe('A section of the article to add relevant links to.'),
});
export type InsertRelevantLinksInput = z.infer<typeof InsertRelevantLinksInputSchema>;

const InsertRelevantLinksOutputSchema = z.object({
  sectionWithLinks: z.string().describe('The article section with relevant real-world links inserted after it.'),
});
export type InsertRelevantLinksOutput = z.infer<typeof InsertRelevantLinksOutputSchema>;

export async function insertRelevantLinks(input: InsertRelevantLinksInput): Promise<InsertRelevantLinksOutput> {
  return insertRelevantLinksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'insertRelevantLinksPrompt',
  input: {schema: InsertRelevantLinksInputSchema},
  output: {schema: InsertRelevantLinksOutputSchema},
  prompt: `You are an expert research assistant. Given the following section of an article, insert 1-2 relevant real-world links after the section. These links should be from reputable sources such as Wikipedia, Forbes, Scientific American, or Harvard.edu.

Article Section: {{{articleSection}}}`,
});

const insertRelevantLinksFlow = ai.defineFlow(
  {
    name: 'insertRelevantLinksFlow',
    inputSchema: InsertRelevantLinksInputSchema,
    outputSchema: InsertRelevantLinksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
