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
      };

      this.recognition.onend = () => {
        console.debug('[Speech] Recognition ended');
        this.isListening = false;

        // Alleen herstarten als we nog steeds willen luisteren en niet te vaak no-matches hebben gehad
        if (this.deviceDetection.getDeviceType() === 'mobile' && 
            this.deviceDetection.getBrowserType() === 'chrome' &&
            this.isListening &&
            this.noMatchCount < this.MAX_NO_MATCH_RETRIES) {
          console.debug('[Speech] Auto-restarting for mobile Chrome');
          setTimeout(() => {
            this.recognition?.start();
          }, 100); // Kleine vertraging om de browser tijd te geven
        } else if (this.noMatchCount >= this.MAX_NO_MATCH_RETRIES) {
          console.debug('[Speech] Stopping due to too many no-matches');
          this.config.onError?.('Geen spraak gedetecteerd');
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
            const transcript = result[0].transcript;
            this.accumulatedText += ' ' + transcript;
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
        this.stopListening();
      };

      this.recognition.onnomatch = () => {
        console.debug('[Speech] No match found');
        this.noMatchCount++;
      };

      this.recognition.onaudiostart = () => {
        console.debug('[Speech] Audio started');
      };

      this.recognition.onaudioend = () => {
        console.debug('[Speech] Audio ended');
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
      };
    }
  }

  public startListening(onResult: (text: string) => void, onError?: (error: string) => void): void {
    console.debug('[Speech] Starting recognition');
    this.isListening = true;
    this.noMatchCount = 0;
    this.accumulatedText = ''; // Reset accumulated text
    this.config.onResult = onResult;
    this.config.onError = onError;
    this.recognition?.start();
  }

  public stopListening(): void {
    console.debug('[Speech] Stopping recognition');
    this.isListening = false;
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