import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const googleApiKey = process.env.GOOGLE_GENAI_API_KEY;

if (!googleApiKey) {
  console.warn(
    'GOOGLE_GENAI_API_KEY environment variable not set. ' +
    'AI features requiring this key (like Smart Invoice Reader) will not work. ' +
    'Please create an API key from Google AI Studio (https://aistudio.google.com/app/apikey) ' +
    'and add it to your .env.local file.'
  );
}

export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      // Only provide the key if it exists
      apiKey: googleApiKey || undefined,
    })
  ],
  // Optional: Set a default model, but specific flows might override this
  model: 'googleai/gemini-1.5-flash', // Changed default model to 1.5 flash as 2.0 seems deprecated/unstable
});
