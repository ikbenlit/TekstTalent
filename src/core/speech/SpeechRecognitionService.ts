import type { 
  SpeechRecognition as CustomSpeechRecognition,
  SpeechRecognitionEvent as CustomSpeechRecognitionEvent,
  SpeechRecognitionConstructor
} from '@/types/speech.types';

import { SpeechConfig } from '@/config/speech.config';
import { DeviceDetectionService } from '@/core/device/DeviceDetectionService';
import { DebugLogger } from '@/core/utils/DebugLogger';

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
  private readonly RESTART_DELAY = 250; // Increased from 100ms to give more breathing room
  private consecutiveRestarts = 0;
  private readonly MAX_CONSECUTIVE_RESTARTS = 5;

  constructor(deviceDetection?: DeviceDetectionService) {
    this.deviceDetection = deviceDetection || new DeviceDetectionService();
    
    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionConstructor) {
      DebugLogger.log('[Speech] No recognition available');
      throw new Error('Speech Recognition niet beschikbaar');
    }

    this.recognition = new SpeechRecognitionConstructor();
    if (this.recognition) {
      const config = this.deviceDetection.getSpeechRecognitionConfig();
      this.recognition.continuous = config.continuous;
      this.recognition.interimResults = config.interimResults;
      this.recognition.lang = 'nl-NL';
      this.recognition.maxAlternatives = 1;
      
      DebugLogger.log('[Speech] Init:', {
        device: this.deviceDetection.getDeviceType(),
        browser: this.deviceDetection.getBrowserType()
      });

      this.recognition.onstart = () => {
        this.isListening = true;
        this.manualStop = false;
      };

      this.recognition.onend = () => {
        // Alleen stoppen bij handmatige stop of te veel no-matches
        if (this.manualStop || this.noMatchCount >= this.MAX_NO_MATCH_RETRIES) {
          this.isListening = false;
          if (this.noMatchCount >= this.MAX_NO_MATCH_RETRIES) {
            this.config.onError?.('Geen spraak gedetecteerd');
          }
          this.shouldResetText = true;
          this.consecutiveRestarts = 0;
        } else if (this.deviceDetection.getDeviceType() === 'mobile' && 
            this.deviceDetection.getBrowserType() === 'chrome') {
          // Controleer aantal opeenvolgende herstarts
          if (this.consecutiveRestarts >= this.MAX_CONSECUTIVE_RESTARTS) {
            DebugLogger.log('[Speech] Max restarts reached');
            this.manualStop = true;
            this.isListening = false;
            this.config.onError?.('Te veel herstart pogingen');
            return;
          }

          this.shouldResetText = false;
          this.noMatchCount = 0;
          this.consecutiveRestarts++;
          
          // Add delay and check state before restart
          setTimeout(() => {
            if (!this.manualStop && this.isListening) {
              try {
                // Check if recognition is already running
                if (this.recognition) {
                  try {
                    this.recognition.stop();
                  } catch (stopError) {
                    // Ignore stop errors
                  }
                  
                  // Add small delay before restart
                  setTimeout(() => {
                    try {
                      this.recognition?.start();
                    } catch (startError: any) {
                      DebugLogger.error('[Speech] Delayed restart error:', startError?.message || startError);
                      // Only trigger error if it's not already stopped
                      if (this.isListening) {
                        this.config.onError?.('Fout bij herstarten van spraakherkenning');
                        this.manualStop = true;
                        this.isListening = false;
                      }
                    }
                  }, 100);
                }
              } catch (error: any) {
                DebugLogger.error('[Speech] Restart error:', error?.message || error);
                if (this.isListening) {
                  this.config.onError?.('Fout bij herstarten van spraakherkenning');
                  this.manualStop = true;
                  this.isListening = false;
                }
              }
            }
          }, this.RESTART_DELAY);
        }
      };
      
      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[event.results.length - 1];
        
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
        DebugLogger.error('[Speech] Error:', event.error);
        this.config.onError?.(event.error);
        this.shouldResetText = true;
        this.manualStop = true;
        this.stopListening();
      };

      this.recognition.onnomatch = () => {
        if (!this.isListening) {
          this.noMatchCount++;
        }
      };

      this.recognition.onaudiostart = () => {};
      this.recognition.onaudioend = () => {
        if (!this.manualStop && this.isListening && 
            this.deviceDetection.getDeviceType() === 'mobile' && 
            this.deviceDetection.getBrowserType() === 'chrome') {
          setTimeout(() => {
            if (!this.manualStop && this.isListening) {
              try {
                this.recognition?.start();
              } catch (error) {
                DebugLogger.error('[Speech] Audio restart error:', error);
              }
            }
          }, this.RESTART_DELAY);
        }
      };

      this.recognition.onsoundstart = () => {};
      this.recognition.onsoundend = () => {};
      this.recognition.onspeechstart = () => {};
      this.recognition.onspeechend = () => {};
    }
  }

  public startListening(onResult: (text: string) => void, onError?: (error: string) => void): void {
    this.isListening = true;
    this.noMatchCount = 0;
    this.consecutiveRestarts = 0;
    if (this.shouldResetText) {
      this.accumulatedText = '';
    }
    this.shouldResetText = true;
    this.manualStop = false;
    this.config.onResult = onResult;
    this.config.onError = onError;
    
    try {
      this.recognition?.start();
    } catch (error) {
      DebugLogger.error('[Speech] Start error:', error);
      this.config.onError?.('Fout bij starten van spraakherkenning');
      this.isListening = false;
    }
  }

  public stopListening(): void {
    this.manualStop = true;
    this.isListening = false;
    this.shouldResetText = true;
    this.recognition?.stop();
  }

  public isSupported(): boolean {
    try {
      const supported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
      DebugLogger.log('[Speech] Support check:', supported);
      return supported;
    } catch (error) {
      DebugLogger.error('[Speech] Support check error:', error);
      return false;
    }
  }
} 