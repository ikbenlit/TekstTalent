export interface SpeechConfig {
  onResult?: (text: string) => void;
  onError?: (error: string) => void;
}

export const createSpeechConfig = (): SpeechConfig => ({}); 