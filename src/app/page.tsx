'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { TransformFormat } from '@/types/api.types';
import { Layout } from '@/frontend/components/Layout/Layout';
import { TextSection } from '@/frontend/components/TextSection/TextSection';
import { ImageSection } from '@/frontend/components/ImageSection/ImageSection';

const SpeechInput = dynamic(
  () => import('@/frontend/components/SpeechInput/SpeechInput').then(mod => mod.SpeechInput),
  { ssr: false }
);

export default function Home() {
  const [text, setText] = useState('');
  const [transformedText, setTransformedText] = useState('');
  const [format, setFormat] = useState<TransformFormat>('business-letter');
  const [isTransforming, setIsTransforming] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

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

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Image generation failed');
      }

      if (!data.imageUrl) {
        throw new Error('No image URL received');
      }

      setImageUrl(data.imageUrl);
    } catch (error: any) {
      console.error('Image generation error:', error);
      setImageUrl(null);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-4 mb-4">
          <SpeechInput 
            onTextChange={setText} 
            onTranscribeStart={() => setIsTranscribing(true)}
            onTranscribeEnd={() => setIsTranscribing(false)}
            onRecordingStart={() => setIsRecording(true)}
            onRecordingEnd={() => setIsRecording(false)}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
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
            isTranscribing={isTranscribing}
            isRecording={isRecording}
          />
          <ImageSection 
            imageUrl={imageUrl} 
            isGeneratingImage={isGeneratingImage}
            onGenerateImage={handleGenerateImage}
            text={text}
            isTransforming={isTransforming}
          />
        </div>
      </div>
    </Layout>
  );
}
