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

    console.log('Generating image for text:', text.substring(0, 100) + '...');
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: text,
      n: 1,
      size: "1024x1024",
    });

    if (!response.data?.[0]?.url) {
      console.error('No image URL in OpenAI response:', response);
      return Response.json(
        { error: 'No image URL received from OpenAI' },
        { status: 500 }
      );
    }

    const imageUrl = response.data[0].url;
    console.log('Image generated successfully:', imageUrl);

    return Response.json({ imageUrl });
  } catch (error: any) {
    console.error('Image generation error:', error?.message || error);
    return Response.json(
      { error: error?.message || 'Failed to generate image' },
      { status: error?.status || 500 }
    );
  }
} 