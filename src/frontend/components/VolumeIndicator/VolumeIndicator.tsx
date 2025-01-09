'use client';

import React, { useEffect, useRef, useState } from 'react';

interface VolumeIndicatorProps {
  isListening: boolean;
}

export const VolumeIndicator: React.FC<VolumeIndicatorProps> = ({ isListening }) => {
  const [volume, setVolume] = useState(0);

  useEffect(() => {
    if (!isListening) {
      setVolume(0);
      return;
    }

    let audioContext: AudioContext;
    let analyser: AnalyserNode;
    let dataArray: Uint8Array;
    let animationId: number;

    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 32;
        dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateVolume = () => {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setVolume(average);
          animationId = requestAnimationFrame(updateVolume);
        };

        updateVolume();
      } catch (error) {
        console.error('Error accessing microphone:', error);
      }
    };

    initAudio();

    return () => {
      if (audioContext) {
        audioContext.close();
      }
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isListening]);

  return (
    <div className="w-full h-full bg-gray-200 rounded-full overflow-hidden">
      <div 
        className="h-full bg-gradient-to-r from-[#FF4500] to-[#FF8C00] transition-all duration-100"
        style={{ width: `${Math.min((volume / 256) * 100, 100)}%` }}
      />
    </div>
  );
}; 