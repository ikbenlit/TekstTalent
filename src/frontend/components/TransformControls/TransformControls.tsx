'use client';

import React, { useState } from 'react';
import { SpeechInput } from '@/frontend/components/SpeechInput/SpeechInput';
import { TextSection } from '@/frontend/components/TextSection/TextSection';
import { TransformFormat } from '@/types/api.types';

export const TransformControls = () => {
  const [text, setText] = useState('');
  const [transformedText, setTransformedText] = useState('');
  const [format, setFormat] = useState<TransformFormat>('business-letter');
  const [isTransforming, setIsTransforming] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const handleTransform = async () => {
    if (!text || isTransforming) return;
    setIsTransforming(true);
    
    try {
      const response = await fetch('/api/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, format }),
      });

      if (!response.ok) throw new Error('Transform failed');

      const data = await response.json();
      setTransformedText(data.transformedText);
    } catch (error) {
      console.error('Transform error:', error);
    } finally {
      setIsTransforming(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!text || isGeneratingImage) return;
    setIsGeneratingImage(true);
    
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error('Image generation failed');

      // Handle image generation response if needed
    } catch (error) {
      console.error('Image generation error:', error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="space-y-4">
      <SpeechInput onTextChange={setText} />
      {text && (
        <TextSection 
          text={text}
          onTextChange={setText}
          transformedText={transformedText}
          onTransformedTextChange={setTransformedText}
          onTransform={handleTransform}
          isTransforming={isTransforming}
          format={format}
          onFormatChange={setFormat}
          onGenerateImage={handleGenerateImage}
          isGeneratingImage={isGeneratingImage}
        />
      )}
    </div>
  );
}; 