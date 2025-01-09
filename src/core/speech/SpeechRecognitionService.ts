import { SpeechRecognitionState } from './SpeechRecognitionState';
import { SpeechRecognitionConfig, getDefaultConfig } from './SpeechRecognitionConfig';
import type { 
  SpeechRecognition, 
  SpeechRecognitionEvent, 
  SpeechRecognitionConstructor,
  SpeechRecognitionErrorEvent
} from '../types';

export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private currentText = '';
  private language: string = 'nl-NL';

  constructor() {
    const isMobile = typeof window !== 'undefined' && 
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    this.initializeRecognition();
  }

  private initializeRecognition(): void {
    try {
      const SpeechRecognitionImpl = (
        window.SpeechRecognition ||
        window.webkitSpeechRecognition ||
        null
      ) as SpeechRecognitionConstructor | null;

      if (!SpeechRecognitionImpl) {
        throw new Error('Speech Recognition niet ondersteund');
      }

      this.recognition = new SpeechRecognitionImpl();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = this.language;
    } catch (error) {
      console.error('Speech Recognition initialisatie mislukt:', error);
    }
  }

  public start(onResult: (text: string) => void, onError?: (error: string) => void): void {
    if (!this.recognition) {
      onError?.('Speech Recognition niet beschikbaar');
      return;
    }

    try {
      this.isListening = true;

      this.recognition.onresult = (event: SpeechRecognitionEvent): void => {
        if (event.results.length > 0) {
          const result = event.results[event.results.length - 1];
          if (result.isFinal) {
            const transcript = result[0].transcript;
            this.appendText(transcript);
            onResult(this.currentText);
          }
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent): void => {
        if (event.error !== 'no-speech') {
          onError?.(event.error);
        }
      };

      this.recognition.start();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
      onError?.(errorMessage);
    }
  }

  public stop(): void {
    if (!this.recognition) return;

    this.isListening = false;
    
    this.recognition.onresult = (): void => {};
    this.recognition.onerror = (): void => {};
    this.recognition.onend = (): void => {};

    try {
      this.recognition.stop();
    } catch (error) {
      // Negeer stop errors
    }
  }

  public isSupported(): boolean {
    return this.recognition !== null;
  }

  private appendText(text: string): void {
    this.currentText = this.currentText ? `${this.currentText} ${text}` : text;
  }
} 