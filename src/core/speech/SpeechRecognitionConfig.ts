export interface SpeechRecognitionConfig {
  continuous: boolean;
  interimResults: boolean;
  language: string;
  restartDelay: number;
}

export const getDefaultConfig = (isMobile: boolean): SpeechRecognitionConfig => ({
  continuous: !isMobile,
  interimResults: !isMobile,
  language: 'nl-NL',
  restartDelay: 500
}); 