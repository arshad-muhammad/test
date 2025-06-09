
'use server';

/**
 * @fileOverview An AI agent that inserts relevant real-world links after each section of an article, using Groq API directly.
 *
 * - insertRelevantLinks - A function that handles the process of inserting relevant links into an article.
 * - InsertRelevantLinksInput - The input type for the insertRelevantLinks function.
 * - InsertRelevantLinksOutput - The return type for the insertRelevantLinks function.
 */

import {ai}from '@/ai/genkit';
import {z} from 'genkit';

const InsertRelevantLinksInputSchema = z.object({
  articleSection: z.string().describe('A section of the article to add relevant links to.'),
});
export type InsertRelevantLinksInput = z.infer<typeof InsertRelevantLinksInputSchema>;

const InsertRelevantLinksOutputSchema = z.object({
  sectionWithLinks: z.string().describe('The article section with relevant real-world links inserted after it.'),
});
export type InsertRelevantLinksOutput = z.infer<typeof InsertRelevantLinksOutputSchema>;

const promptTemplate = `You are an expert research assistant. Given the following section of an article, insert 1-2 relevant real-world links after the section. These links should be from reputable sources such as Wikipedia, Forbes, Scientific American, or Harvard.edu.

Article Section: {{{articleSection}}}

IMPORTANT: Your entire response MUST be a valid JSON object that conforms to the InsertRelevantLinksOutputSchema (i.e., {"sectionWithLinks": "The section text with links appended..."}). Do not include any other text, prefixes, explanations, or conversational remarks outside of this JSON object.`;

const systemMessageContent = "You are an AI assistant specialized in identifying and inserting relevant contextual links into text content.";

async function callGroqAPI(input: InsertRelevantLinksInput): Promise<InsertRelevantLinksOutput> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set in environment variables.");
  }

  let userMessageContent = promptTemplate;
  for (const key in input) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      const value = (input as any)[key];
      userMessageContent = userMessageContent.replace(new RegExp(`{{{${key}}}}`, 'g'), String(value));
      userMessageContent = userMessageContent.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
  }
  
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama3-70b-8192", 
      messages: [
        { role: "system", content: systemMessageContent },
        { role: "user", content: userMessageContent }
      ],
      temperature: 0.7,
      stream: false,
      response_format: { type: "json_object" } 
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq API request failed with status ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const rawOutput = data.choices[0]?.message?.content;

  if (typeof rawOutput !== 'string') {
    throw new Error("Groq API response did not contain expected string content.");
  }

  try {
    // The rawOutput from Groq (when response_format is json_object) should already be a string representation of a JSON object.
    // So, we parse it directly.
    const parsedOutput = JSON.parse(rawOutput);
    const validationResult = InsertRelevantLinksOutputSchema.safeParse(parsedOutput);
    if (!validationResult.success) {
      console.error("Groq output validation error details:", validationResult.error.errors);
      throw new Error(`Groq API output validation failed: ${validationResult.error.message}. Raw: ${rawOutput}`);
    }
    return validationResult.data;
  } catch (e) {
    // If JSON.parse fails, it means the model didn't adhere to the JSON output format despite response_format.
    // Log the raw output for debugging.
    console.error("Failed to parse Groq API JSON output. Raw output:", rawOutput);
    throw new Error(`Failed to parse or validate Groq API JSON output: ${(e as Error).message}. Raw output: ${rawOutput}`);
  }
}

export async function insertRelevantLinks(input: InsertRelevantLinksInput): Promise<InsertRelevantLinksOutput> {
  return insertRelevantLinksFlow(input);
}

const insertRelevantLinksFlow = ai.defineFlow(
  {
    name: 'insertRelevantLinksFlow',
    inputSchema: InsertRelevantLinksInputSchema,
    outputSchema: InsertRelevantLinksOutputSchema,
  },
  async (input) => {
    return callGroqAPI(input);
  }
);
