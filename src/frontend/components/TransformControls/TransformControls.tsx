'use client';

import React from 'react';
import { TransformFormat } from '@/core/types';

interface TransformControlsProps {
  format: TransformFormat;
  onFormatChange: (format: TransformFormat) => void;
  onTransform: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const TransformControls: React.FC<TransformControlsProps> = ({
  format,
  onFormatChange,
  onTransform,
  disabled,
  className,
  children
}) => {
  return (
    <div className={`flex gap-2 ${className}`}>
      <select 
        value={format}
        onChange={(e) => onFormatChange(e.target.value as TransformFormat)}
        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg 
          focus:border-[#FF4500] focus:ring-1 focus:ring-[#FF4500]"
        disabled={disabled}
      >
        <option value="business-letter">Zakelijke brief</option>
        <option value="social-post">Social media bericht</option>
        <option value="email">E-mail</option>
      </select>
      
      <button 
        onClick={onTransform}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2 bg-[#FF4500] text-white rounded-lg 
          hover:bg-[#FF5722] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {children}
      </button>
    </div>
  );
}; 