'use client';

import React, { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { SpeechRecognitionService } from '@/core/speech/SpeechRecognitionService';

interface SpeechInputProps {
  onTextChange: (text: string) => void;
}

export const SpeechInput = ({ onTextChange }: SpeechInputProps) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speechService] = useState(() => new SpeechRecognitionService());

  useEffect(() => {
    if (!speechService.isSupported()) {
      setError('Speech herkenning wordt niet ondersteund in deze browser');
    }
  }, [speechService]);

  const handleStart = () => {
    if (error) {
      setIsListening(false);
    } else {
      setIsListening(true);
      speechService.startListening(
        (text) => {
          onTextChange(text);
          setIsListening(false);
        },
        (error) => {
          setError(error);
          setIsListening(false);
        }
      );
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleStart}
        disabled={isListening || !!error}
        className="flex flex-col items-center gap-2"
      >
        <div className={`p-6 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-[#FF4500] hover:bg-[#FF5722]'} disabled:opacity-50 transition-colors`}>
          {isListening ? (
            <MicOff className="w-8 h-8 text-white" />
          ) : (
            <Mic className="w-8 h-8 text-white" />
          )}
        </div>
        <span className="text-gray-700 font-medium">
          {isListening ? 'Luisteren...' : 'Start Opname'}
        </span>
      </button>
      {error && (
        <div className="text-red-500 text-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
}; 