export interface TransformationOptions {
  format: 'business-letter' | 'social-post' | 'email';
  language: string;
}

export class TextTransformer {
  private readonly PROMPTS = {
    'business-letter': 'Herschrijf dit als een formele zakelijke brief',
    'social-post': 'Transformeer dit naar een pakkende social media post',
    'email': 'Maak hier een professionele e-mail van'
  };

  public async transform(text: string, options: TransformationOptions): Promise<string> {
    try {
      const response = await fetch('/api/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          format: options.format,
          language: options.language
        }),
      });

      if (!response.ok) throw new Error('Transform request failed');

      const { transformedText } = await response.json();
      return transformedText;
    } catch (error) {
      console.error('Transform error:', error);
      throw error;
    }
  }
} 