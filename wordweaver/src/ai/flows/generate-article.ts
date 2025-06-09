
'use server';

/**
 * @fileOverview Generates the initial sections (Abstract, Introduction, Materials & Methods) of a detailed IMRaD research article based on a user-provided topic using Groq API directly.
 *
 * - generateArticle - A function that generates an article.
 * - GenerateArticleInput - The input type for the generateArticle function.
 * - GenerateArticleOutput - The return type for the generateArticle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateArticleInputSchema = z.object({
  user_topic: z.string().describe('The topic for the research article.'),
  tone: z.enum(['Academic', 'Blog', 'Creative']).default('Academic').describe('The tone of the article.'),
  format: z.enum(['Plain Text', 'Markdown', 'PDF']).default('Markdown').describe('The output format for the article (influences link formatting).'),
});
export type GenerateArticleInput = z.infer<typeof GenerateArticleInputSchema>;

const GenerateArticleOutputSchema = z.object({
  articleContent: z.string().describe('The generated initial part of the research article (Abstract, Introduction, Materials & Methods) including in-text citations and a preliminary Vancouver-style reference list for content generated so far. This version does NOT include the final consolidated "References" section for the whole paper.'),
});
export type GenerateArticleOutput = z.infer<typeof GenerateArticleOutputSchema>;

const articlePromptTemplate = `You are an expert research scientist and academic writer. Your task is to generate the initial ~4000 words of a comprehensive and highly detailed IMRaD (Introduction, Materials and Methods, Results, Discussion) research article strictly focused on the topic: "{{user_topic}}".

This initial part MUST contain:
1.  A detailed Abstract (approx. 250-300 words) summarizing the study's background, objectives, methods, key (hypothetical) findings, and conclusions.
2.  A comprehensive Introduction section (approx. 1000-1500 words) providing background, literature review, problem statement, study rationale, and clear objectives/hypotheses.
3.  A very detailed Materials and Methods section (approx. 2000-2500 words) describing the (hypothetical) experimental design, study population/sample, data collection procedures, variables measured, ethical considerations, and statistical analysis plan. This section needs to be thorough enough for replication.

The study should be presented as a real lab-based or clinical experimental study conducted between 2023-2025. For example, if the topic is "AI in Dental Caries", it might evaluate the "Development and Validation of an AI-Based Diagnostic Tool for Early Detection of Dental Caries Using Intraoral Radiographs". Adapt this hypothetical study nature to the "{{user_topic}}".

Structure:
- Use H2 for main sections (e.g., ## Abstract, ## Introduction, ## Materials and Methods).
- Use H3 for subsections within Materials and Methods as appropriate (e.g., ### Study Design, ### Participants, ### Data Collection, ### Statistical Analysis).

Referencing and Citations:
- You MUST include at least 5-7 real, relevant references from 2000-2025 for this initial part, formatted in Vancouver style. Include PMID or DOI for each where available.
- In-text citations MUST be in square brackets, e.g., [1], [2,3]. Number references chronologically based on their first appearance.
- At the end of the generated content for this part, include a preliminary "References" list (e.g., ## Preliminary References) containing ONLY the references cited in THIS initial segment, formatted in Vancouver style and numbered.

Quality and Tone:
- Maintain strict scientific accuracy, originality, and a formal "{{tone}}" (which should be Academic for this task).
- Avoid plagiarism and generic AI-generated summaries.
- This must be an original research article. Reflect updated research insights and ensure technical rigor directly relevant to the study's title and aims based on "{{user_topic}}".

Output Format:
- The article content should be formatted for "{{format}}".
- Ensure your entire response is a valid JSON object conforming to GenerateArticleOutputSchema.

The generated 'articleContent' must contain these specified sections and adhere to all instructions. Do NOT add Results, Discussion, or Conclusion sections in this part.

IMPORTANT: Your entire response MUST be a valid JSON object that conforms to the GenerateArticleOutputSchema (i.e., {"articleContent": "your generated Abstract, Introduction, Materials & Methods, and preliminary references..."}). Do not include any other text, prefixes, explanations, or conversational remarks outside of this JSON object.`;

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
    // Force Academic tone for IMRaD structure
    const academicInput = { ...input, tone: 'Academic' as const };
    return callGroqAPI(academicInput);
  }
);
