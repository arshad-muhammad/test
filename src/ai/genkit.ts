
import {genkit} from 'genkit';
import { config } from 'dotenv';

config(); // Ensure environment variables are loaded

export const ai = genkit({
  plugins: [
    // Removed Groq plugin as it's not a public package and API will be called directly.
  ],
  // Removed model: 'llama3-70b-8192' as direct API calls will specify the model.
  // If other Genkit operations require a default model, configure appropriate plugins (e.g., googleAI).
});
