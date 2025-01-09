import type { SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionOptions } from '../types';

export class SpeechRecognitionService {
  private recognition: SpeechRecognition;
  private isListening: boolean = false;
  private onResultCallback?: (text: string) => void;

  constructor(options: SpeechRecognitionOptions = {}) {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      throw new Error('Speech Recognition API is not supported in your browser');
    }

    this.recognition = new SpeechRecognitionAPI() as unknown as SpeechRecognition;
    
    // Configure recognition
    (this.recognition as unknown as { continuous: boolean }).continuous = true;
    (this.recognition as unknown as { interimResults: boolean }).interimResults = true;
    (this.recognition as unknown as { lang: string }).lang = options.language ?? 'nl-NL';

    // Setup event handlers
    this.setupEventHandlers();
  }

  public startListening(onResult: (text: string) => void): void {
    if (this.isListening) {
      console.warn('Speech recognition is already active');
      return;
    }

    this.isListening = true;
    this.onResultCallback = onResult;
    try {
      (this.recognition as unknown as { start: () => void }).start();
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  public stopListening(): void {
    if (!this.isListening) return;
    try {
      (this.recognition as unknown as { stop: () => void }).stop();
      this.cleanup();
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  private setupEventHandlers(): void {
    // Result handler
    (this.recognition as unknown as { onresult: (event: SpeechRecognitionEvent) => void }).onresult = (event: SpeechRecognitionEvent) => {
      if (!this.onResultCallback) return;

      const transcript = Array.from(event.results as unknown as ArrayLike<{ [index: number]: { transcript: string }; isFinal: boolean }>)
        .map(result => result[0].transcript)
        .join(' ');

      this.onResultCallback(transcript);
    };
    // End handler
    (this.recognition as unknown as { onend: () => void }).onend = () => {
      if (this.isListening) {
        // Als we nog luisteren, start opnieuw
        try {
          (this.recognition as unknown as { start: () => void }).start();
        } catch (error) {
          this.handleError(error as Error);
        }
      } else {
        // Anders cleanup
        this.cleanup();
      }
    };
    // Error handler
    (this.recognition as unknown as { onerror: (event: Event) => void }).onerror = (event: Event) => {
      const error = event as unknown as { error: string; message: string };
      this.handleError(new Error(error.message || 'Speech recognition error'));
    };
  }

  private handleError(error: Error): void {
    console.error('Speech Recognition Error:', error);
    this.cleanup();
    throw error;
  }

  private cleanup(): void {
    this.isListening = false;
    this.onResultCallback = undefined;
  }

  public isActive(): boolean {
    return this.isListening;
  }
} 