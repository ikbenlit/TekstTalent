import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: text,
      n: 1,
      size: "1024x1024",
    });

    return Response.json({ 
      imageUrl: response.data[0].url 
    });
  } catch (error) {
    console.error('Image generation error:', error);
    return Response.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
} 