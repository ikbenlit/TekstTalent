import type { 
  SpeechRecognition,
  SpeechRecognitionEvent,
  SpeechRecognitionConstructor,
  SpeechRecognitionErrorEvent,
  SpeechRecognitionResult,
  SpeechRecognitionError,
  SpeechRecognitionAlternative
} from '@/types/speech.types';

import { SpeechConfig, createSpeechConfig } from '@/config/speech.config';
import { DeviceDetectionService } from '@/core/device/DeviceDetectionService';

declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}

// Definieer state als union type
type RecognitionState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'ERROR';

export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private config: SpeechConfig;
  private state: RecognitionState = 'IDLE';
  private currentText = '';
  private retryCount: number = 0;
  private timeoutId?: number;
  private silenceTimer?: number;
  private lastSpeechTimestamp: number = 0;
  private deviceDetectionService: DeviceDetectionService;

  constructor(deviceDetection?: DeviceDetectionService) {
    this.deviceDetectionService = deviceDetection || new DeviceDetectionService();
    this.config = createSpeechConfig(this.deviceDetectionService);
    
    // Log config bij initialisatie
    console.log('Speech Service Config:', {
      isMobile: this.deviceDetectionService.isMobile(),
      browser: this.deviceDetectionService.getBrowserInfo(),
      capabilities: this.deviceDetectionService.getSpeechRecognitionCapabilities(),
      config: this.config
    });
    
    this.initializeRecognition();
  }

  private initializeRecognition(): void {
    try {
      console.log('Speech Recognition Init:', {
        hasWebkit: !!window.webkitSpeechRecognition,
        hasSpeechRecognition: !!window.SpeechRecognition,
        userAgent: navigator.userAgent
      });

      const SpeechRecognitionImpl = (
        window.SpeechRecognition ||
        window.webkitSpeechRecognition
      ) as unknown as SpeechRecognitionConstructor;

      if (!SpeechRecognitionImpl) {
        throw new Error('Speech Recognition niet ondersteund');
      }

      this.recognition = new SpeechRecognitionImpl();
      console.log('Recognition created successfully');
      this.setupRecognition();
    } catch (error) {
      console.error('Speech Recognition init error:', error);
    }
  }

  private setupRecognition(): void {
    if (!this.recognition) return;

    this.checkPermissions().then(async () => {
      console.log('Setting up recognition after permission check');
      
      // Mobiel-specifieke setup
      if (this.deviceDetectionService.isMobile()) {
        this.recognition!.continuous = false;
        this.recognition!.interimResults = true;
        // maxAlternatives is not supported in the standard SpeechRecognition type
      } else {
        this.recognition!.continuous = this.config.continuous;
        this.recognition!.interimResults = true;
      }
      
      this.recognition!.lang = 'nl-NL';

      // Start handler met extra mobiele checks
      this.recognition!.onstart = () => {
        console.log('Recognition started:', {
          state: this.state,
          continuous: this.recognition?.continuous,
          interimResults: this.recognition?.interimResults,
          isMobile: this.deviceDetectionService.isMobile()
        });
        this.setState('LISTENING');
        this.config.onSpeechStart?.();
      };

      // End handler met retry voor mobiel
      this.recognition!.onend = () => {
        console.log('Recognition ended:', {
          state: this.state,
          timestamp: new Date().toISOString(),
          isMobile: this.deviceDetectionService.isMobile(),
          retryCount: this.retryCount
        });
        
        const wasListening = this.state === 'LISTENING';
        this.setState('IDLE');

        // Auto-restart logica
        if (wasListening) {
          if (this.deviceDetectionService.isMobile()) {
            // Op mobiel: probeer opnieuw met delay
            if (this.retryCount < this.config.maxRetries) {
              console.log('Retrying on mobile...');
              setTimeout(() => this.startListening(), 500);
            }
          } else {
            // Op desktop: direct herstarten
            console.log('Auto-restarting on desktop');
            setTimeout(() => this.startListening(), 100);
          }
        }
        
        this.config.onSpeechEnd?.();
      };

      // Result handler
      this.recognition!.onresult = (event: SpeechRecognitionEvent) => {
        console.log('Got result:', {
          resultsLength: event.results.length,
          isFinal: event.results[event.results.length - 1]?.isFinal
        });

        if (event.results.length > 0) {
          const result = event.results[event.results.length - 1];
          if (result.isFinal) {
            const firstAlternative = result[0] as SpeechRecognitionAlternative;
            this.appendText(firstAlternative.transcript);
          }
        }
      };

      // Error handler
      this.recognition!.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech Error Details:', {
          error: event.error,
          message: event.message,
          state: this.state,
          timestamp: new Date().toISOString(),
          recognition: {
            continuous: this.recognition?.continuous,
            interimResults: this.recognition?.interimResults,
            lang: this.recognition?.lang
          }
        });
        this.handleError(event);
      };
    });
  }

  public start(onResult: (text: string) => void, onError?: (error: string) => void): void {
    // Reset currentText alleen bij handmatige start, niet bij auto-restart
    if (this.state === 'IDLE') {
      this.currentText = '';
    }
    
    // Backwards compatibility: map oude callbacks naar nieuwe config
    this.config.onResult = (text: string, isFinal: boolean) => {
      if (isFinal) onResult(text);
    };
    this.config.onError = onError;

    this.startListening();
  }

  public startListening(): void {
    if (!this.recognition) {
      console.error('Recognition not initialized');
      return;
    }

    try {
      console.log('Starting recognition:', {
        state: this.state,
        isMobile: this.deviceDetectionService.isMobile(),
        continuous: this.recognition.continuous,
        interimResults: this.recognition.interimResults
      });
      // Check huidige state
      if (this.state === 'LISTENING') {
        console.debug('Recognition already listening, ignoring start request');
        return;
      }

      const delay = this.deviceDetectionService.isMobile() ? 300 : 0;
      setTimeout(() => {
        if (this.recognition && this.state !== 'LISTENING') {
          try {
            this.recognition.start();
            this.retryCount = 0;
          } catch (error) {
            console.error('Error in delayed start:', error);
            // Als start mislukt, reset state
            this.setState('IDLE');
          }
        }
      }, delay);
    } catch (error) {
      this.setState('ERROR');
      const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
      this.config.onError?.(errorMessage);
    }
  }

  public stopListening(): void {
    if (!this.recognition) return;

    try {
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
      }
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }

      this.recognition.stop();
      this.setState('IDLE');
    } catch (error) {
      console.error('Error stopping recognition:', error);
    }
  }

  public isSupported(): boolean {
    return this.recognition !== null;
  }

  private handleError(event: SpeechRecognitionErrorEvent): void {
    const error: SpeechRecognitionError = {
      error: event.error,
      message: event.message || 'Unknown error',
      timestamp: Date.now()
    };

    switch (error.error) {
      case 'not-allowed':
        this.handlePermissionError();
        break;
      case 'network':
        this.handleNetworkError();
        break;
      case 'no-speech':
        this.handleNoSpeechError();
        break;
      case 'aborted':
        // Genegeerd omdat dit vaak gebeurt bij normaal stoppen
        break;
      default:
        console.error('Unhandled speech error:', error);
    }

    this.config.onError?.(error.message);
  }

  private handlePermissionError(): void {
    this.setState('ERROR');
    console.error('Microphone permission denied');
  }

  private handleNetworkError(): void {
    if (this.deviceDetectionService.isMobile()) {
      this.retryWithDelay(1000);
    } else {
      this.retryWithDelay(500);
    }
  }

  private handleNoSpeechError(): void {
    if (this.deviceDetectionService.isMobile()) {
      this.retryWithDelay(300);
    }
  }

  private retryWithDelay(delay: number): void {
    if (this.retryCount < this.config.maxRetries) {
      this.retryCount++;
      setTimeout(() => {
        this.startListening();
      }, delay);
    }
  }

  private startSilenceDetection(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
    }

    if (!this.config.silenceTimeout) {
      return;
    }

    this.silenceTimer = window.setTimeout(() => {
      // We know lastSpeechTimestamp is set when silence detection starts
      if (this.lastSpeechTimestamp && Date.now() - this.lastSpeechTimestamp >= this.config.silenceTimeout!) {
        this.handleSilence();
      }
    }, this.config.silenceTimeout!);
  }

  private handleSilence(): void {
    if (this.deviceDetectionService.isMobile()) {
      if (this.config.silenceActions?.stopOnSilence) {
        this.stopListening();
      }

      if (this.config.silenceActions?.restartOnSilence) {
        setTimeout(() => {
          this.startListening();
        }, this.config.restartDelay);
      }
    }
  }

  private setState(newState: RecognitionState): void {
    const oldState = this.state;
    this.state = newState;
    
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[Speech] State change:', {
        from: oldState,
        to: newState,
        timestamp: new Date().toISOString()
      });
    }
  }

  private appendText(text: string): void {
    if (text.trim()) {
      console.debug('Appending text:', text, 'Current:', this.currentText);
      this.currentText = this.currentText ? `${this.currentText} ${text}` : text;
      this.config.onResult?.(this.currentText, true);
    }
  }

  async checkPermissions() {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      console.log('Microphone Permission:', {
        state: result.state,
        platform: navigator.platform,
        userAgent: navigator.userAgent
      });
    } catch (error) {
      console.error('Permission check failed:', error);
    }
  }
} 