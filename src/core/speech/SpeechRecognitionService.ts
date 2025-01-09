import type { 
  SpeechRecognition, 
  SpeechRecognitionEvent, 
  SpeechRecognitionConstructor,
  SpeechRecognitionErrorEvent
} from '../types';

export class SpeechRecognitionService {
  private readonly MAX_RESTART_ATTEMPTS = 3;
  private recognition: SpeechRecognition | null = null;
  private isInitialized = false;
  private isListening = false;
  private restartAttempts = 0;
  private isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  constructor() {
    try {
      const SpeechRecognitionImpl = (
        window.SpeechRecognition ||
        window.webkitSpeechRecognition ||
        null
      ) as SpeechRecognitionConstructor | null;

      if (!SpeechRecognitionImpl) {
        throw new Error('Speech Recognition niet ondersteund in deze browser');
      }

      this.recognition = new SpeechRecognitionImpl();
      this.recognition.continuous = !this.isMobile;
      this.recognition.interimResults = !this.isMobile;
      this.recognition.lang = 'nl-NL';
      this.isInitialized = true;
    } catch (error) {
      console.error('Speech Recognition initialisatie mislukt:', error);
    }
  }

  public start(onResult: (text: string) => void, onError?: (error: string) => void): void {
    if (!this.isInitialized || !this.recognition) {
      onError?.('Speech Recognition niet ondersteund in deze browser');
      return;
    }

    try {
      this.restartAttempts = 0;
      this.isListening = true;
      this.resetHandlers();

      this.recognition.onresult = (event: SpeechRecognitionEvent): void => {
        if (event.results.length > 0) {
          const result = event.results[event.results.length - 1];
          if (result.isFinal || this.isMobile) {
            const transcript = result[0].transcript;
            onResult(transcript);
            this.restartAttempts = 0;
            
            if (this.isMobile) {
              this.restart();
            }
          }
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent): void => {
        if (this.isListening) {
          if (event.error !== 'no-speech') {
            console.warn('Speech Recognition error:', event.error);
            onError?.(event.error);
            if (this.restartAttempts >= this.MAX_RESTART_ATTEMPTS) {
              this.stop();
            } else if (this.isMobile) {
              this.restart();
            }
          }
        }
      };

      this.recognition.onend = (): void => {
        if (this.isListening) {
          if (this.isMobile) {
            this.restart();
          } else if (this.restartAttempts < this.MAX_RESTART_ATTEMPTS) {
            this.restartAttempts++;
            setTimeout(() => {
              if (this.isListening) {
                this.recognition?.start();
              }
            }, 300);
          } else {
            this.stop();
            onError?.('Maximum aantal herstart pogingen bereikt');
          }
        }
      };

      this.recognition.start();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
      onError?.(errorMessage);
    }
  }

  private restart(): void {
    if (this.isListening && this.recognition) {
      setTimeout(() => {
        try {
          this.recognition?.start();
        } catch (error) {
          console.error('Herstart mislukt:', error);
        }
      }, 100);
    }
  }

  public stop(): void {
    this.isListening = false;
    this.restartAttempts = 0;
    if (this.recognition) {
      this.resetHandlers();
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('Stop mislukt:', error);
      }
    }
  }

  private resetHandlers(): void {
    if (this.recognition) {
      this.recognition.onend = (): void => {};
      this.recognition.onresult = (): void => {};
      this.recognition.onerror = (): void => {};
    }
  }

  public isSupported(): boolean {
    return this.isInitialized;
  }
} 