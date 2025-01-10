'use client';

import React, { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { SpeechRecognitionService } from '@/core/speech/SpeechRecognitionService';
import { VolumeIndicator } from '@/frontend/components/VolumeIndicator/VolumeIndicator';

interface SpeechInputProps {
  onTextChange: (text: string) => void;
}

export const SpeechInput = ({ onTextChange }: SpeechInputProps) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const speechServiceRef = React.useRef<SpeechRecognitionService | null>(null);

  useEffect(() => {
    // Initialize speech service only once on mount
    speechServiceRef.current = new SpeechRecognitionService();
    
    if (!speechServiceRef.current.isSupported()) {
      setError('Speech herkenning wordt niet ondersteund in deze browser');
    }

    return () => {
      if (speechServiceRef.current) {
        speechServiceRef.current.stopListening();
      }
    };
  }, []);

  const handleStart = () => {
    if (!speechServiceRef.current || error) {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    speechServiceRef.current.startListening(
      (text) => {
        onTextChange(text);
      },
      (error) => {
        setError(error);
        setIsListening(false);
      }
    );
  };

  const handleStop = () => {
    if (speechServiceRef.current) {
      speechServiceRef.current.stopListening();
    }
    setIsListening(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col items-center">
        <button
          onClick={isListening ? handleStop : handleStart}
          disabled={!!error}
          className="flex flex-col items-center"
        >
          <div className={`p-6 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-[#FF4500] hover:bg-[#FF5722]'} disabled:opacity-50 transition-colors`}>
            {isListening ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </div>
        </button>

        {/* Volume Indicator */}
        <div className="w-20 h-1.5 mt-3 mb-2">
          <VolumeIndicator isListening={isListening} />
        </div>

        <span className="text-gray-700 font-medium text-sm">
          {isListening ? 'Luisteren...' : 'Start Opname'}
        </span>
      </div>

      {error && (
        <div className="text-red-500 text-sm text-center mt-2">
          {error}
        </div>
      )}
    </div>
  );
}; 