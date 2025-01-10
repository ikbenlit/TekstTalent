import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('file') as Blob;
    
    if (!audioFile) {
      return Response.json(
        { error: 'Geen audio bestand ontvangen' },
        { status: 400 }
      );
    }

    // Check file size (max 25MB)
    if (audioFile.size > 25 * 1024 * 1024) {
      return Response.json(
        { error: 'Audio bestand is te groot (maximum 25MB)' },
        { status: 400 }
      );
    }

    // Check MIME type
    if (!audioFile.type.startsWith('audio/')) {
      return Response.json(
        { error: 'Ongeldig bestandsformaat. Alleen audio bestanden zijn toegestaan.' },
        { status: 400 }
      );
    }

    // Convert Blob to File object that OpenAI can handle
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const file = new File([buffer], 'audio.webm', { type: audioFile.type });

    const response = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'nl',
      response_format: 'json'
    });

    if (!response.text) {
      throw new Error('Geen tekst ontvangen van OpenAI');
    }

    return Response.json({ text: response.text });
  } catch (error: any) {
    console.error('Transcription error:', error);

    // Bepaal de juiste error message en status code
    let status = 500;
    let message = 'Server fout bij transcriptie';

    if (error.status === 429) {
      status = 429;
      message = 'Te veel aanvragen, probeer het later opnieuw';
    } else if (error.status === 413) {
      status = 413;
      message = 'Audio bestand is te groot';
    } else if (error.message.includes('configuration')) {
      status = 500;
      message = 'Server configuratie fout';
    }

    return Response.json(
      { error: message },
      { status }
    );
  }
} 