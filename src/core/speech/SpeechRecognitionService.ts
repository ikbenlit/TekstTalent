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
      throw new Error('Speech Recognition niet beschikbaar');
    }

    this.recognition = new SpeechRecognitionConstructor();
    if (this.recognition) {
      const config = this.deviceDetection.getSpeechRecognitionConfig();
      this.recognition.continuous = config.continuous;
      this.recognition.interimResults = config.interimResults;
      this.recognition.lang = 'nl-NL';
      
      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[event.results.length - 1];
        
        if (this.deviceDetection.getDeviceType() === 'mobile' && 
            this.deviceDetection.getBrowserType() === 'chrome') {
          // Specifieke logica voor mobiele Chrome
          if (result.isFinal) {
            const transcript = result[0].transcript;
            this.accumulatedText += ' ' + transcript;
            this.config.onResult?.(this.accumulatedText.trim());
          }
        } else {
          // Standaard logica voor andere apparaten
          if (result.isFinal) {
            const transcript = result[0].transcript;
            this.config.onResult?.(transcript);
          }
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech Recognition Error:', event.error);
        this.config.onError?.(event.error);
        this.stopListening();
      };

      this.recognition.onend = () => {
        // Als we op een mobiel Chrome apparaat zitten, herstart dan automatisch
        if (this.deviceDetection.getDeviceType() === 'mobile' && 
            this.deviceDetection.getBrowserType() === 'chrome') {
          this.recognition?.start();
        }
      };
    }
  }

  public startListening(onResult: (text: string) => void, onError?: (error: string) => void): void {
    this.accumulatedText = ''; // Reset accumulated text
    this.config.onResult = onResult;
    this.config.onError = onError;
    this.recognition?.start();
  }

  public stopListening(): void {
    this.recognition?.stop();
  }
} 