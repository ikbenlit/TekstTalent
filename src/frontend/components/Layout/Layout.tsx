import React from 'react';
import { ClipboardCopy } from 'lucide-react';
import { DebugLogger } from '@/core/utils/DebugLogger';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [copySuccess, setCopySuccess] = React.useState(false);

  const handleCopyLogs = async () => {
    try {
      await navigator.clipboard.writeText(DebugLogger.getLogs());
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      // Silent fail
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-[#FF4500] to-[#FF6B4A] text-transparent bg-clip-text">
            TekstTalent
          </h1>
        </header>
        <main>{children}</main>
      </div>
      
      {/* Fixed Debug Log Button */}
      <button
        onClick={handleCopyLogs}
        className="fixed bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white text-gray-500 hover:text-gray-700 rounded-full shadow-md hover:shadow-lg transition-all"
      >
        <ClipboardCopy className="w-3.5 h-3.5" />
        <span>{copySuccess ? 'Gekopieerd!' : 'Debug log'}</span>
      </button>
    </div>
  );
}; 