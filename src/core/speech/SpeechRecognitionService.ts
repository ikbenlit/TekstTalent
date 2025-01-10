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
      };

      this.recognition.onend = () => {
        console.debug('[Speech] Recognition ended');
        // Als we op een mobiel Chrome apparaat zitten, herstart dan automatisch
        if (this.deviceDetection.getDeviceType() === 'mobile' && 
            this.deviceDetection.getBrowserType() === 'chrome') {
          console.debug('[Speech] Auto-restarting for mobile Chrome');
          this.recognition?.start();
        }
      };
      
      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[event.results.length - 1];
        console.debug('[Speech] Result received:', {
          isFinal: result.isFinal,
          transcript: result[0].transcript,
          confidence: result[0].confidence
        });
        
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
    this.accumulatedText = ''; // Reset accumulated text
    this.config.onResult = onResult;
    this.config.onError = onError;
    this.recognition?.start();
  }

  public stopListening(): void {
    console.debug('[Speech] Stopping recognition');
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