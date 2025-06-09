
'use server';

/**
 * @fileOverview A content summarization AI agent using Groq API directly.
 *
 * - summarizeContent - A function that handles the content summarization process.
 * - SummarizeContentInput - The input type for the summarizeContent function.
 * - SummarizeContentOutput - The return type for the summarizeContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeContentInputSchema = z.object({
  content: z.string().describe('The content to be summarized.'),
});
export type SummarizeContentInput = z.infer<typeof SummarizeContentInputSchema>;

// The LLM will only be asked to produce the 'summary'. 'progress' is added manually.
const SummarizeContentLLMOutputSchema = z.object({
  summary: z.string().describe('A 500-word summary of the content.'),
});

const SummarizeContentOutputSchema = z.object({
  summary: z.string().describe('A 500-word summary of the content.'),
  progress: z.string().describe('Generation progress indicator.')
});
export type SummarizeContentOutput = z.infer<typeof SummarizeContentOutputSchema>;

const promptTemplate = `You are an expert summarizer. Summarize the following content in 500 words or less:

{{{content}}}

IMPORTANT: Your entire response MUST be a valid JSON object that conforms to the schema {"summary": "your 500-word summary"}. Do not include any other text, prefixes, explanations, or conversational remarks outside of this JSON object.`;

const systemMessageContent = "You are an AI assistant specialized in text summarization. Provide concise and accurate summaries.";

async function callGroqAPI(input: SummarizeContentInput): Promise<SummarizeContentOutput> {
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
      stream: false
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
    // Validate against the schema for LLM's direct output
    const validationResult = SummarizeContentLLMOutputSchema.safeParse(parsedOutput);
    if (!validationResult.success) {
      console.error("Groq output validation error details:", validationResult.error.errors);
      throw new Error(`Groq API output validation failed: ${validationResult.error.message}. Raw: ${rawOutput}`);
    }
    // Add the progress field before returning the final output schema
    return {
      summary: validationResult.data.summary,
      progress: 'Content summarization complete.'
    };
  } catch (e) {
    throw new Error(`Failed to parse or validate Groq API JSON output: ${(e as Error).message}. Raw output: ${rawOutput}`);
  }
}

export async function summarizeContent(input: SummarizeContentInput): Promise<SummarizeContentOutput> {
  return summarizeContentFlow(input);
}

const summarizeContentFlow = ai.defineFlow(
  {
    name: 'summarizeContentFlow',
    inputSchema: SummarizeContentInputSchema,
    outputSchema: SummarizeContentOutputSchema, // This flow returns the full output schema including progress
  },
  async (input) => {
    return callGroqAPI(input);
  }
);
