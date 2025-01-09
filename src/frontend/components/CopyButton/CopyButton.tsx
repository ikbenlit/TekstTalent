'use client';

import React, { useState } from 'react';
import { ClipboardCopy, ClipboardCheck } from 'lucide-react';

interface CopyButtonProps {
  text: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
      title="Kopieer naar klembord"
    >
      {copied ? (
        <ClipboardCheck className="w-5 h-5" />
      ) : (
        <ClipboardCopy className="w-5 h-5" />
      )}
    </button>
  );
}; 