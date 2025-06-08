import { config } from 'dotenv';
config();

import '@/ai/flows/insert-relevant-links.ts';
import '@/ai/flows/summarize-content.ts';
import '@/ai/flows/generate-seo-metadata.ts';
import '@/ai/flows/generate-article.ts';