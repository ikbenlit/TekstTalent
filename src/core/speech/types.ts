export type SpeechRecognition = typeof window.SpeechRecognition | typeof window.webkitSpeechRecognition;
export type SpeechRecognitionEvent = {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
  };
  resultIndex: number;
};

export interface SpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export interface VolumeData {
  average: number;
  normalized: number;
} 