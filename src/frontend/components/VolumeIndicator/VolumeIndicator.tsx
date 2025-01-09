'use client';

import React, { useEffect, useRef } from 'react';

interface VolumeIndicatorProps {
  isListening: boolean;
}

export const VolumeIndicator: React.FC<VolumeIndicatorProps> = ({ isListening }) => {
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    console.log('VolumeIndicator mounted, isListening:', isListening);
    let mounted = true;

    const setupAudio = async () => {
      try {
        console.log('Setting up audio...');
        // Cleanup previous instances
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        // Get microphone stream
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        
        if (!mounted) return;
        streamRef.current = stream;
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);

        analyserRef.current.fftSize = 32;
        analyserRef.current.smoothingTimeConstant = 0.8;
        sourceRef.current.connect(analyserRef.current);

        const updateVolume = () => {
          if (!analyserRef.current || !mounted) return;

          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);

          // Calculate average volume
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          const normalizedVolume = Math.min(average / 128, 1);

          // Update bars
          barRefs.current.forEach((bar, i) => {
            if (bar) {
              const threshold = (i + 1) * 0.2; // 5 levels
              bar.style.opacity = normalizedVolume > threshold ? '1' : '0.2';
            }
          });

          animationFrameRef.current = requestAnimationFrame(updateVolume);
        };

        updateVolume();

        console.log('Audio setup complete');
      } catch (error) {
        console.error('Error in audio setup:', error);
      }
    };

    if (isListening) {
      setupAudio();
    }

    return () => {
      console.log('Cleaning up audio...');
      mounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isListening]);

  return (
    <div className="flex gap-[1px] items-end w-full h-6">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          ref={(el: HTMLDivElement | null) => { barRefs.current[i] = el }}
          className={`flex-1 transition-all duration-75
            ${Math.floor(i / 4) === 0 ? 'h-2' : 
              Math.floor(i / 4) === 1 ? 'h-3' : 
              Math.floor(i / 4) === 2 ? 'h-4' : 
              Math.floor(i / 4) === 3 ? 'h-5' : 'h-6'
            }`}
          style={{ 
            opacity: 0.2,
            backgroundColor: '#FF4500',
            minWidth: '2px'
          }}
        />
      ))}
    </div>
  );
}; 