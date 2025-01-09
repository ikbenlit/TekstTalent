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
    try {
      setSpeechService(new SpeechRecognitionService());
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const handleStartListening = useCallback(() => {
    if (!speechService) return;
    console.log('Starting recording...');
    setIsListening(true);
    speechService.startListening((text) => {
      onTextChange(text);
    });
  }, [speechService, onTextChange]);

  const handleStopListening = useCallback(() => {
    if (!speechService) return;
    setIsListening(false);
    speechService.stopListening();
  }, [speechService]);

  if (error) {
    return (
      <div className="rounded-lg p-4 border border-[#FF4500] bg-red-50">
        <div className="flex items-center gap-2 text-[#FF4500]">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  console.log('isListening:', isListening);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {isListening && (
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-32 h-6">
            <VolumeIndicator isListening={isListening} />
          </div>
        )}
        <button
          onClick={isListening ? handleStopListening : handleStartListening}
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