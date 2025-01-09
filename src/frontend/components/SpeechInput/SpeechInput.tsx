'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { SpeechRecognitionService } from '@/core/speech/SpeechRecognitionService';
import { Mic, MicOff } from 'lucide-react';
import { VolumeIndicator } from '../VolumeIndicator/VolumeIndicator';

interface SpeechInputProps {
  onTextChange: (text: string) => void;
}

export const SpeechInput: React.FC<SpeechInputProps> = ({ onTextChange }) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speechService, setSpeechService] = useState<SpeechRecognitionService | null>(null);

  useEffect(() => {
    const service = new SpeechRecognitionService();
    setSpeechService(service);
    
    if (!service.isSupported()) {
      setError('Speech herkenning wordt niet ondersteund in deze browser');
    }
  }, []);

  const toggleListening = () => {
    if (!speechService) return;

    if (isListening) {
      speechService.stop();
      setIsListening(false);
    } else {
      speechService.start(
        (text) => onTextChange(text),
        (error) => {
          setError(error);
          setIsListening(false);
        }
      );
      setIsListening(true);
      setError(null);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {error && (
        <p className="text-red-500 text-sm mb-2">{error}</p>
      )}
      <div className="relative">
        <button
          onClick={toggleListening}
          className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-200
            ${isListening 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-gradient-to-br from-[#FF4500] to-[#FF8C00] hover:scale-105'
            }`}
        >
          {isListening ? (
            <MicOff className="w-6 h-6 md:w-8 md:h-8 text-white" />
          ) : (
            <Mic className="w-6 h-6 md:w-8 md:h-8 text-white" />
          )}
        </button>
      </div>
      <p className="text-gray-500 text-sm mt-2">
        {isListening ? 'Opname... Klik om te stoppen' : 'Klik om opname te starten'}
      </p>
    </div>
  );
}; 