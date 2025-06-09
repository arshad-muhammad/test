
'use server';

/**
 * @fileOverview Generates a detailed article based on a user-provided topic using Groq API directly.
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
  format: z.enum(['Plain Text', 'Markdown', 'PDF']).default('Markdown').describe('The output format for the article (influences link formatting).'),
});
export type GenerateArticleInput = z.infer<typeof GenerateArticleInputSchema>;

const GenerateArticleOutputSchema = z.object({
  articleContent: z.string().describe('The generated article content, including in-text links. This version does NOT include a final "References" section.'),
});
export type GenerateArticleOutput = z.infer<typeof GenerateArticleOutputSchema>;

const articlePromptTemplate = `You are an expert research writer. Your task is to generate a comprehensive and highly detailed article of AT LEAST 4000 words, strictly focused on the topic: "{{user_topic}}".

The introduction should be substantial, providing a thorough overview of the topic before proceeding to the main body.

Follow these instructions carefully:
1.  **Content Focus**: The entire article must be dedicated to the specified "{{user_topic}}". Do not deviate to other topics.
2.  **Structure**: Organize the article logically into sections and subsections using H2 and H3 headings as appropriate for the "{{format}}" output. Each section must provide thorough, well-explained content on its specific sub-topic.
3.  **In-text Links**: After every major section of the article, you MUST include 1-2 real, relevant links from reputable sources (e.g., Wikipedia, Forbes, Scientific American, Harvard.edu, etc.). These links should be directly related to the content of that section and formatted as clickable links appropriate for the "{{format}}".
4.  **Tone**: Maintain a "{{tone}}" tone throughout the article.
5.  **Output Format**: The article content should be suitable for "{{format}}".
6.  **NO FINAL REFERENCES SECTION**: Your output for 'articleContent' should ONLY be the body of the article with its in-text links. Do NOT add a "References" section at the end of this part. Another process will handle the final consolidated references.

The generated 'articleContent' must contain the article body and its in-text links as described.

IMPORTANT: Your entire response MUST be a valid JSON object that conforms to the GenerateArticleOutputSchema (i.e., {"articleContent": "your generated article text..."}). Do not include any other text, prefixes, explanations, or conversational remarks outside of this JSON object.`;

const systemMessageContent = "You are an AI assistant that strictly follows user instructions. The user will provide a detailed prompt instructing you to generate specific content AND to format your entire response as a single, valid JSON object. Your sole task is to generate this JSON object exactly as described in the user's prompt, conforming to any specified schemas. Do not add any explanatory text, apologies, or conversational remarks before or after the JSON object. Your entire output must be only the JSON object itself.";

async function callGroqAPI(input: GenerateArticleInput): Promise<GenerateArticleOutput> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set in environment variables.");
  }

  let userMessageContent = articlePromptTemplate;
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
    const parsedOutput = JSON.parse(rawOutput);
    const validationResult = GenerateArticleOutputSchema.safeParse(parsedOutput);
    if (!validationResult.success) {
      console.error("Groq output validation error details:", validationResult.error.errors);
      throw new Error(`Groq API output validation failed: ${validationResult.error.message}. Raw: ${rawOutput}`);
    }
    return validationResult.data;
  } catch (e) {
    console.error("Failed to parse Groq API JSON output. Raw output:", rawOutput);
    throw new Error(`Failed to parse or validate Groq API JSON output: ${(e as Error).message}. Raw output: ${rawOutput}`);
  }
}

export async function generateArticle(input: GenerateArticleInput): Promise<GenerateArticleOutput> {
  return generateArticleFlow(input);
}

const generateArticleFlow = ai.defineFlow(
  {
    name: 'generateArticleFlow',
    inputSchema: GenerateArticleInputSchema,
    outputSchema: GenerateArticleOutputSchema,
  },
  async (input) => {
    return callGroqAPI(input);
  }
);
