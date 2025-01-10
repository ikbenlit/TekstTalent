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
    this.initializeRecognition();
  }

  private initializeRecognition(): void {
    try {
      const SpeechRecognitionImpl = (
        window.SpeechRecognition ||
        window.webkitSpeechRecognition
      ) as unknown as SpeechRecognitionConstructor;

      if (!SpeechRecognitionImpl) {
        throw new Error('Speech Recognition niet ondersteund');
      }

      this.recognition = new SpeechRecognitionImpl();
      this.setupRecognition();
    } catch (error) {
      console.error('Speech Recognition initialisatie mislukt:', error);
    }
  }

  private setupRecognition(): void {
    if (!this.recognition) return;

    // Log config bij setup
    console.debug('Setting up recognition with config:', {
      isMobile: this.deviceDetectionService.isMobile(),
      continuous: this.config.continuous,
      interimResults: this.config.interimResults,
      lang: this.config.lang
    });

    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.lang = this.config.lang;

    this.recognition.onstart = () => {
      console.debug('Recognition started, continuous:', this.recognition?.continuous);
      this.setState('LISTENING');
      this.config.onSpeechStart?.();
    };

    this.recognition.onend = () => {
      console.debug('Recognition ended, state:', this.state);
      const wasListening = this.state === 'LISTENING';
      this.setState('IDLE');
      
      // Op desktop, als we niet handmatig gestopt zijn, direct herstarten
      if (!this.deviceDetectionService.isMobile() && wasListening) {
        console.debug('Auto-restarting recognition on desktop');
        setTimeout(() => {
          this.startListening();
        }, 100);
      }
      
      this.config.onSpeechEnd?.();
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Log resultaten voor debugging
      console.debug('Speech result:', {
        isMobile: this.deviceDetectionService.isMobile(),
        resultsLength: event.results.length,
        resultIndex: event.resultIndex,
        timestamp: new Date().toISOString()
      });

      this.lastSpeechTimestamp = Date.now();

      if (event.results.length > 0) {
        const result = event.results[event.results.length - 1];
        if (result.isFinal) {
          const firstAlternative = result[0] as SpeechRecognitionAlternative;
          const transcript = firstAlternative.transcript;
          console.debug('Got final transcript:', {
            transcript,
            confidence: firstAlternative.confidence,
            isMobile: this.deviceDetectionService.isMobile()
          });
          this.appendText(transcript);
        }
      }
    };

    // Log errors met meer context
    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.debug('Speech error:', {
        error: event.error,
        message: event.message,
        isMobile: this.deviceDetectionService.isMobile()
      });
      this.handleError(event);
    };
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
    if (!this.recognition) return;

    try {
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
} 