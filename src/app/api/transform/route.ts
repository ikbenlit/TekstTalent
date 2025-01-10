import { OpenAI } from 'openai';
import { TransformRequest, TransformFormat } from '@/types/api.types';
import { getPromptForFormat } from '@/core/prompts/transformPrompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Type guard functie
const isValidFormat = (format: string): format is TransformFormat => {
  return ['business-letter', 'social-post', 'email', 'bullet-points', 'summary', 'meeting-notes'].includes(format);
};

export async function POST(request: Request) {
  try {
    const { text, format } = await request.json() as TransformRequest;

    // Valideer het format
    if (!isValidFormat(format)) {
      return Response.json(
        { error: 'Invalid format specified' },
        { status: 400 }
      );
    }

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