import { OpenAI } from 'openai';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const TEMP_DIR = join(process.cwd(), 'tmp');

// Zorg dat de temp directory bestaat
async function ensureTempDir() {
  try {
    await mkdir(TEMP_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create temp directory:', error);
    throw new Error('Server configuration error');
  }
}

export async function POST(request: Request) {
  let tempFilePath = '';

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

    await ensureTempDir();

    // Create a temporary file with unique name
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    tempFilePath = join(TEMP_DIR, `recording-${Date.now()}-${Math.random().toString(36).slice(2)}.webm`);
    await writeFile(tempFilePath, buffer);

    const response = await openai.audio.transcriptions.create({
      file: await import('fs').then(fs => fs.createReadStream(tempFilePath)),
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
  } finally {
    // Clean up temp file
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch (error) {
        console.error('Failed to clean up temp file:', error);
      }
    }
  }
} 