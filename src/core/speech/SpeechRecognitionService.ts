import type { SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionConstructor } from '../types';

export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isInitialized = false;

  constructor() {
    try {
      // Check voor verschillende browser implementaties
      const SpeechRecognitionImpl = (
        window.SpeechRecognition ||
        window.webkitSpeechRecognition ||
        null
      ) as SpeechRecognitionConstructor | null;

      if (!SpeechRecognitionImpl) {
        throw new Error('Speech Recognition niet ondersteund in deze browser');
      }

      this.recognition = new SpeechRecognitionImpl();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'nl-NL';
      this.isInitialized = true;
    } catch (error) {
      console.error('Speech Recognition initialisatie mislukt:', error);
    }
  }

  public start(onResult: (text: string) => void, onError?: (error: any) => void): void {
    if (!this.isInitialized || !this.recognition) {
      onError?.('Speech Recognition niet beschikbaar');
      return;
    }

    try {
      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = Array.from(event.results)
          .map(result => result[0].transcript)
          .join(' ');
        onResult(result);
      };

      this.recognition.onerror = (event) => {
        console.warn('Speech Recognition error:', event.error);
        onError?.(event.error);
      };

      this.recognition.start();
    } catch (error) {
      console.error('Speech Recognition start mislukt:', error);
      onError?.(error);
    }
  }

  public stop(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('Speech Recognition stop mislukt:', error);
      }
    }
  }

  public isSupported(): boolean {
    return this.isInitialized;
  }
} 