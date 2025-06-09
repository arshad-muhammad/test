
'use server';

/**
 * @fileOverview An SEO metadata generation AI agent using Groq API directly.
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
        'The generated meta description for the article (150-160 characters).'
      ),
});
export type GenerateSeoMetadataOutput = z.infer<
  typeof GenerateSeoMetadataOutputSchema
>;

const promptTemplate = `You are an SEO expert. Generate an SEO title and meta description for the following article.

Topic: {{{userTopic}}}

Article content: {{{articleContent}}}

The SEO title should be 50-60 characters.
The meta description should be 150-160 characters.

IMPORTANT: Your entire response MUST be a valid JSON object that conforms to the GenerateSeoMetadataOutputSchema (i.e., {"seoTitle": "your title", "metaDescription": "your description"}). Do not include any other text, prefixes, explanations, or conversational remarks outside of this JSON object.`;

const systemMessageContent = "You are an AI assistant specialized in SEO and content optimization. Provide concise and accurate metadata.";

async function callGroqAPI(input: GenerateSeoMetadataInput): Promise<GenerateSeoMetadataOutput> {
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
    const validationResult = GenerateSeoMetadataOutputSchema.safeParse(parsedOutput);
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

export async function generateSeoMetadata(
  input: GenerateSeoMetadataInput
): Promise<GenerateSeoMetadataOutput> {
  return generateSeoMetadataFlow(input);
}

const generateSeoMetadataFlow = ai.defineFlow(
  {
    name: 'generateSeoMetadataFlow',
    inputSchema: GenerateSeoMetadataInputSchema,
    outputSchema: GenerateSeoMetadataOutputSchema,
  },
  async (input) => {
    return callGroqAPI(input);
  }
);
