import React, { useState } from 'react';
import { CopyButton } from '../CopyButton/CopyButton';

interface ImageSectionProps {
  imageUrl: string | null;
  isGeneratingImage?: boolean;
  onGenerateImage?: () => void;
  text?: string;
  isTransforming?: boolean;
}

export const ImageSection: React.FC<ImageSectionProps> = ({ 
  imageUrl, 
  isGeneratingImage
}) => {
  const [imageError, setImageError] = useState<string | null>(null);

  const handleImageError = () => {
    console.error('Failed to load image:', imageUrl);
    setImageError('Failed to load image');
  };

  return (
    <div className="lg:sticky lg:top-8">
      <div className="relative">
        <div className="w-full p-4 pb-12 border border-gray-200 rounded-lg bg-white">
          {imageUrl ? (
            <>
              <img 
                src={imageUrl} 
                alt="Gegenereerde afbeelding op basis van de tekst"
                className="w-full h-auto rounded-md" 
                onError={handleImageError}
                style={{ display: imageError ? 'none' : 'block' }}
              />
              {imageError && (
                <div className="aspect-video bg-gray-50 rounded-md flex items-center justify-center text-red-500 p-4 text-center">
                  {imageError}
                </div>
              )}
            </>
          ) : (
            <div className="aspect-video bg-gray-50 rounded-md flex items-center justify-center text-gray-400">
              Gegenereerde afbeelding verschijnt hier...
            </div>
          )}
        </div>
        <div className="absolute bottom-3 right-3">
          <CopyButton text={imageUrl || ''} />
        </div>
        {isGeneratingImage && (
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