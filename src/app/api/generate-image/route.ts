import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return Response.json(
        { error: 'Invalid text provided' },
        { status: 400 }
      );
    }

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: text,
      n: 1,
      size: "1024x1024",
    });

    if (!response.data?.[0]?.url) {
      return Response.json(
        { error: 'No image URL received from OpenAI' },
        { status: 500 }
      );
    }

    const imageUrl = response.data[0].url;
    return Response.json({ imageUrl });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || 'Failed to generate image' },
      { status: error?.status || 500 }
    );
  }
} 