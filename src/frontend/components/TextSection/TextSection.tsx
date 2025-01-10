import React, { useState, useEffect } from 'react';
import { TransformFormat } from '@/types/api.types';
import { TransformControls } from '../TransformControls/TransformControls';
import { CopyButton } from '../CopyButton/CopyButton';
import { Image, Type } from 'lucide-react';

interface TextSectionProps {
  text: string;
  onTextChange: (text: string) => void;
  transformedText: string;
  onTransformedTextChange: (text: string) => void;
  onTransform: () => void;
  isTransforming: boolean;
  format: TransformFormat;
  onFormatChange: (format: TransformFormat) => void;
  onGenerateImage: () => void;
  isGeneratingImage: boolean;
}

export const TextSection: React.FC<TextSectionProps> = ({
  text,
  onTextChange,
  transformedText,
  onTransformedTextChange,
  onTransform,
  isTransforming,
  format,
  onFormatChange,
  onGenerateImage,
  isGeneratingImage,
}) => {
  const [lastTransformedText, setLastTransformedText] = useState('');

  useEffect(() => {
    if (transformedText) {
      setLastTransformedText(transformedText);
    }
  }, [transformedText]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          className="w-full h-32 md:h-40 p-4 pb-12 border border-gray-200 rounded-lg 
            focus:border-[#FF4500] focus:ring-1 focus:ring-[#FF4500] resize-none"
          placeholder="Je gesproken tekst verschijnt hier..."
        />
        <div className="absolute bottom-3 right-3">
          <CopyButton text={text} />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={format}
            onChange={(e) => onFormatChange(e.target.value as TransformFormat)}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg 
              focus:border-[#FF4500] focus:ring-1 focus:ring-[#FF4500]"
          >
            <option value="business-letter">Zakelijke brief</option>
            <option value="social-post">Social media bericht</option>
            <option value="email">E-mail</option>
          </select>
          
          <button 
            onClick={onTransform}
            disabled={!text || isTransforming}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 
              bg-[#FF4500] text-white rounded-lg hover:bg-[#FF5722] 
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTransforming ? (
              <>
                <Type className="w-4 h-4 animate-spin" />
                Bezig...
              </>
            ) : (
              <>
                <Type className="w-4 h-4" />
                Transformeer
              </>
            )}
          </button>
        </div>
        
        <button
          onClick={onGenerateImage}
          disabled={!text || isGeneratingImage}
          className="w-full flex items-center justify-center gap-2 px-6 py-2
            bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg 
            hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Image className="w-4 h-4" />
          <span>Genereer Afbeelding</span>
        </button>
      </div>

      <div className="relative">
        <textarea
          value={transformedText || lastTransformedText}
          onChange={(e) => onTransformedTextChange(e.target.value)}
          className={`w-full h-48 md:h-56 p-4 pb-12 border border-gray-200 rounded-lg 
            focus:border-[#FF4500] focus:ring-1 focus:ring-[#FF4500] resize-none
            ${isTransforming ? 'animate-pulse bg-gray-50' : ''}`}
          placeholder="Getransformeerde tekst verschijnt hier..."
          disabled={isTransforming}
        />
        <div className="absolute bottom-3 right-3">
          <CopyButton text={transformedText || lastTransformedText} />
        </div>
        {isTransforming && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="flex items-center gap-2 bg-white/80 rounded-full px-4 py-2 shadow-sm">
              <div className="w-2 h-2 bg-[#FF4500] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-[#FF4500] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-[#FF4500] rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 