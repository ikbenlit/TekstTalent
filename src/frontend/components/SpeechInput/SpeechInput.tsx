'use client';

import React, { useState, useEffect } from 'react';
import { Mic, Play, Pause, Square } from 'lucide-react';
import { SpeechRecognitionService } from '@/core/speech/SpeechRecognitionService';
import { VolumeIndicator } from '@/frontend/components/VolumeIndicator/VolumeIndicator';

interface SpeechInputProps {
  onTextChange: (text: string) => void;
  onTranscribeStart?: () => void;
  onTranscribeEnd?: () => void;
  onRecordingStart?: () => void;
  onRecordingEnd?: () => void;
}

export const SpeechInput = ({ 
  onTextChange,
  onTranscribeStart,
  onTranscribeEnd,
  onRecordingStart,
  onRecordingEnd
}: SpeechInputProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const speechServiceRef = React.useRef<SpeechRecognitionService | null>(null);

  useEffect(() => {
    speechServiceRef.current = new SpeechRecognitionService();
    
    if (!speechServiceRef.current.isSupported()) {
      setError('Speech herkenning wordt niet ondersteund in deze browser');
    }

    return () => {
      if (speechServiceRef.current) {
        speechServiceRef.current.stopListening();
        onRecordingEnd?.();
      }
    };
  }, [onRecordingEnd]);

  const handleStart = () => {
    if (!speechServiceRef.current || error) {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    setIsPaused(false);
    onRecordingStart?.();
    
    speechServiceRef.current.startListening(
      async (text) => {
        setIsListening(false);
        setIsPaused(false);
        onRecordingEnd?.();
        onTextChange(text);
        setIsTranscribing(false);
        onTranscribeEnd?.();
      },
      (error) => {
        setError(error);
        setIsListening(false);
        setIsPaused(false);
        setIsTranscribing(false);
        onRecordingEnd?.();
        onTranscribeEnd?.();
      }
    );
  };

  const handleStop = async () => {
    if (speechServiceRef.current) {
      try {
        setIsListening(false);
        setIsPaused(false);
        onRecordingEnd?.();
        
        setIsTranscribing(true);
        onTranscribeStart?.();

        await speechServiceRef.current.stopListening();
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Fout bij het stoppen van de opname');
        setIsTranscribing(false);
        onTranscribeEnd?.();
      }
    }
  };

  const handlePauseResume = () => {
    if (!speechServiceRef.current) return;

    if (isPaused) {
      speechServiceRef.current.resumeListening();
      setIsPaused(false);
      setIsListening(true);
      onRecordingStart?.();
    } else {
      speechServiceRef.current.pauseListening();
      setIsPaused(true);
      setIsListening(false);
      onRecordingEnd?.();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col items-center">
        {/* Control Bar */}
        <div className="flex items-center gap-3 p-2 bg-white rounded-full shadow-md">
          {!isListening && !isPaused && !isTranscribing && (
            <button
              onClick={handleStart}
              disabled={!!error}
              className="p-2 bg-[#FF4500] hover:bg-[#FF5722] text-white rounded-full transition-colors disabled:opacity-50 flex items-center gap-2"
              title="Start opname"
            >
              <Mic className="w-5 h-5" />
              <span className="text-sm font-medium">Start</span>
            </button>
          )}

          {(isListening || isPaused) && !isTranscribing && (
            <>
              <button
                onClick={handlePauseResume}
                className={`p-2 ${
                  isPaused 
                    ? 'bg-yellow-500 hover:bg-yellow-600' 
                    : 'bg-red-500 hover:bg-red-600'
                } text-white rounded-full transition-colors flex items-center gap-2`}
                title={isPaused ? 'Hervat opname' : 'Pauzeer opname'}
              >
                {isPaused ? (
                  <>
                    <Play className="w-5 h-5" />
                    <span className="text-sm font-medium">Hervat</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-5 h-5" />
                    <span className="text-sm font-medium">Pauze</span>
                  </>
                )}
              </button>

              <button
                onClick={handleStop}
                className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-colors flex items-center gap-2"
                title="Stop opname"
              >
                <Square className="w-5 h-5" />
                <span className="text-sm font-medium">Stop</span>
              </button>
            </>
          )}

          {isTranscribing && (
            <div className="p-2 bg-gray-400 text-white rounded-full flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center">
                <div className="w-4 h-4 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
              <span className="text-sm font-medium">Verwerken...</span>
            </div>
          )}
        </div>

        {/* Status Text */}
        <div className="mt-2 text-sm text-gray-600">
          {isPaused
            ? 'Opname gepauzeerd'
            : isListening 
              ? 'Opname bezig...'
              : !isTranscribing && 'Klik op start om te beginnen met opnemen'}
        </div>

        {/* Volume Indicator */}
        {isListening && (
          <div className="w-20 h-1.5 mt-2">
            <VolumeIndicator isListening={isListening} />
          </div>
        )}
      </div>

      {error && (
        <div className="text-red-500 text-sm text-center mt-2">
          {error}
        </div>
      )}
    </div>
  );
}; 