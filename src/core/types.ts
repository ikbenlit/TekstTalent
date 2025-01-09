// Speech Recognition types
export interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  start: () => void;
  stop: () => void;
}

export interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

// Transform types
export type TransformFormat = 'business-letter' | 'social-post' | 'email';

export interface TransformRequest {
  text: string;
  format: TransformFormat;
}

export interface TransformResponse {
  transformedText: string;
} 