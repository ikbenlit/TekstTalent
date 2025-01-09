import { OpenAI } from 'openai';
import { TransformRequest } from '@/core/types';
import { getPromptForFormat } from '@/core/prompts/transformPrompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const { text, format } = await request.json() as TransformRequest;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: getPromptForFormat(format, text)
        },
        {
          role: "user",
          content: text
        }
      ]
    });

    return Response.json({ 
      transformedText: completion.choices[0].message.content 
    });

  } catch (error) {
    console.error('Transform error:', error);
    return Response.json(
      { error: 'Failed to transform text' },
      { status: 500 }
    );
  }
} 