import { openai } from '@ai-sdk/openai';
import { streamObject } from 'ai';
import { outputSchema } from './outputSchema';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const context = await req.json();

  const result = streamObject({
    model: openai('gpt-4-turbo'),
    schema: outputSchema,
    prompt:
      `Genrate a response for a messages app in this context:` + context,
  });

  return result.toTextStreamResponse();
}