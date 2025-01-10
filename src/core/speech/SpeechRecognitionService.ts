import type { 
  SpeechRecognition as CustomSpeechRecognition,
  SpeechRecognitionEvent as CustomSpeechRecognitionEvent,
  SpeechRecognitionConstructor
} from '@/types/speech.types';

import { SpeechConfig } from '@/config/speech.config';
import { DeviceDetectionService } from '@/core/device/DeviceDetectionService';

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// Definieer state als union type
type RecognitionState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'ERROR';

export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private config: SpeechConfig = {};
  private deviceDetection: DeviceDetectionService;
  private accumulatedText: string = '';
  private isListening: boolean = false;
  private noMatchCount: number = 0;
  private readonly MAX_NO_MATCH_RETRIES = 2;
  private shouldResetText: boolean = true;
  private manualStop: boolean = false;

  constructor(deviceDetection?: DeviceDetectionService) {
    this.deviceDetection = deviceDetection || new DeviceDetectionService();
    
    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionConstructor) {
      console.debug('[Speech] No SpeechRecognition constructor available');
      throw new Error('Speech Recognition niet beschikbaar');
    }

    this.recognition = new SpeechRecognitionConstructor();
    if (this.recognition) {
      const config = this.deviceDetection.getSpeechRecognitionConfig();
      this.recognition.continuous = config.continuous;
      this.recognition.interimResults = config.interimResults;
      this.recognition.lang = 'nl-NL';
      
      console.debug('[Speech] Initialized with config:', {
        deviceType: this.deviceDetection.getDeviceType(),
        browserType: this.deviceDetection.getBrowserType(),
        continuous: config.continuous,
        interimResults: config.interimResults
      });

      this.recognition.onstart = () => {
        console.debug('[Speech] Recognition started');
        this.isListening = true;
        this.manualStop = false;
      };

      this.recognition.onend = () => {
        console.debug('[Speech] Recognition ended');

        // Alleen stoppen bij handmatige stop of te veel no-matches
        if (this.manualStop || this.noMatchCount >= this.MAX_NO_MATCH_RETRIES) {
          console.debug('[Speech] Stopping due to manual stop or too many no-matches');
          this.isListening = false;
          if (this.noMatchCount >= this.MAX_NO_MATCH_RETRIES) {
            this.config.onError?.('Geen spraak gedetecteerd');
          }
          this.shouldResetText = true;
        } else if (this.deviceDetection.getDeviceType() === 'mobile' && 
            this.deviceDetection.getBrowserType() === 'chrome') {
          // Altijd herstarten als we niet handmatig gestopt zijn
          console.debug('[Speech] Auto-restarting for mobile Chrome');
          this.shouldResetText = false;
          this.noMatchCount = 0; // Reset no-match teller bij herstart
          setTimeout(() => {
            if (!this.manualStop) {
              this.recognition?.start();
            }
          }, 100);
        }
      };
      
      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[event.results.length - 1];
        console.debug('[Speech] Result received:', {
          isFinal: result.isFinal,
          transcript: result[0].transcript,
          confidence: result[0].confidence
        });
        
        // Reset no-match teller bij een geldig resultaat
        this.noMatchCount = 0;
        
        if (this.deviceDetection.getDeviceType() === 'mobile' && 
            this.deviceDetection.getBrowserType() === 'chrome') {
          // Specifieke logica voor mobiele Chrome
          if (result.isFinal) {
            let transcript = result[0].transcript.trim();
            
            // Zorg dat de eerste letter een hoofdletter is
            if (transcript.length > 0) {
              transcript = transcript.charAt(0).toUpperCase() + transcript.slice(1).toLowerCase();
            }
            
            if (this.accumulatedText && !this.shouldResetText) {
              // Check of de vorige zin eindigt met leesteken
              const hasEndPunctuation = /[.!?]$/.test(this.accumulatedText);
              if (!hasEndPunctuation) {
                this.accumulatedText += '. ';
              } else {
                this.accumulatedText += ' ';
              }
              this.accumulatedText += transcript;
            } else {
              this.accumulatedText = transcript;
            }
            
            console.debug('[Speech] Accumulated text (mobile):', this.accumulatedText.trim());
            this.config.onResult?.(this.accumulatedText.trim());
          }
        } else {
          // Standaard logica voor andere apparaten
          if (result.isFinal) {
            const transcript = result[0].transcript;
            console.debug('[Speech] Final transcript (desktop):', transcript);
            this.config.onResult?.(transcript);
          }
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('[Speech] Recognition Error:', {
          error: event.error,
          message: event.message,
          timeStamp: event.timeStamp
        });
        this.config.onError?.(event.error);
        this.shouldResetText = true;
        this.manualStop = true; // Stop bij errors
        this.stopListening();
      };

      this.recognition.onnomatch = () => {
        console.debug('[Speech] No match found');
        // Alleen verhogen als we geen actieve spraak hebben
        if (!this.isListening) {
          this.noMatchCount++;
        }
      };

      // Verwijder speechend/soundend handlers om automatische stop te voorkomen
      this.recognition.onaudiostart = () => {
        console.debug('[Speech] Audio started');
      };

      this.recognition.onaudioend = () => {
        console.debug('[Speech] Audio ended');
        // Direct herstarten bij audio end als we niet handmatig gestopt zijn
        if (!this.manualStop && this.isListening) {
          setTimeout(() => {
            this.recognition?.start();
          }, 100);
        }
      };

      this.recognition.onsoundstart = () => {
        console.debug('[Speech] Sound started');
      };

      this.recognition.onsoundend = () => {
        console.debug('[Speech] Sound ended');
      };

      this.recognition.onspeechstart = () => {
        console.debug('[Speech] Speech started');
      };

      this.recognition.onspeechend = () => {
        console.debug('[Speech] Speech ended');
        // Negeer speech end events tenzij we handmatig gestopt zijn
      };
    }
  }

  public startListening(onResult: (text: string) => void, onError?: (error: string) => void): void {
    console.debug('[Speech] Starting recognition');
    this.isListening = true;
    this.noMatchCount = 0;
    if (this.shouldResetText) {
      console.debug('[Speech] Resetting accumulated text');
      this.accumulatedText = '';
    }
    this.shouldResetText = true;
    this.manualStop = false;
    this.config.onResult = onResult;
    this.config.onError = onError;
    this.recognition?.start();
  }

  public stopListening(): void {
    console.debug('[Speech] Stopping recognition');
    this.manualStop = true;
    this.isListening = false;
    this.shouldResetText = true;
    this.recognition?.stop();
  }

  public isSupported(): boolean {
    try {
      const supported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
      console.debug('[Speech] Support check:', supported);
      return supported;
    } catch (error) {
      console.error('[Speech] Support check error:', error);
      return false;
    }
  }
} 