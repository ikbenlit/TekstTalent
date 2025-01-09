// Speech Recognition types
export type SpeechRecognition = typeof window.SpeechRecognition | typeof window.webkitSpeechRecognition;

export interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
  };
  resultIndex: number;
}

export interface SpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
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