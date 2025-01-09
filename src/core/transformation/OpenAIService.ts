import OpenAI from 'openai';

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async transformText(text: string, format: 'business-letter' | 'social-post'): Promise<string> {
    try {
      const prompt = this.createPrompt(text, format);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Je bent een expert in het schrijven van professionele teksten."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || text;
    } catch (error) {
      console.error('Error transforming text:', error);
      throw new Error('Failed to transform text');
    }
  }

  private createPrompt(text: string, format: 'business-letter' | 'social-post'): string {
    switch (format) {
      case 'business-letter':
        return `
          Transformeer de volgende tekst naar een formele zakelijke brief:
          
          ${text}
          
          Gebruik de juiste briefconventies en formele taal.
        `;
      case 'social-post':
        return `
          Transformeer de volgende tekst naar een engaging social media post:
          
          ${text}
          
          Maak het pakkend en geschikt voor social media, maar behoud de kernboodschap.
        `;
      default:
        return text;
    }
  }
} 