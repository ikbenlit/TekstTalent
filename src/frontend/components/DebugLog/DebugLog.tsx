'use client';

import { useState, useEffect } from 'react';

export const DebugLog = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const oldConsoleLog = console.log;
    const oldConsoleError = console.error;
    const oldConsoleDebug = console.debug;

    console.log = (...args) => {
      setLogs(prev => [...prev, `LOG: ${JSON.stringify(args)}`]);
      oldConsoleLog.apply(console, args);
    };
    console.error = (...args) => {
      setLogs(prev => [...prev, `ERROR: ${JSON.stringify(args)}`]);
      oldConsoleError.apply(console, args);
    };
    console.debug = (...args) => {
      setLogs(prev => [...prev, `DEBUG: ${JSON.stringify(args)}`]);
      oldConsoleDebug.apply(console, args);
    };

    return () => {
      console.log = oldConsoleLog;
      console.error = oldConsoleError;
      console.debug = oldConsoleDebug;
    };
  }, []);

  const copyLogs = async () => {
    try {
      const logText = logs.join('\n');
      await navigator.clipboard.writeText(logText);
      console.log('Logs copied to clipboard');
    } catch (error) {
      console.error('Failed to copy logs:', error);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/80 text-white p-4 max-h-48 overflow-auto z-50">
      <div className="absolute top-2 right-2 flex gap-2">
        <button 
          onClick={copyLogs}
          className="text-xs bg-blue-500 px-2 py-1 rounded hover:bg-blue-600"
        >
          Copy Logs
        </button>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-xs bg-red-500 px-2 py-1 rounded hover:bg-red-600"
        >
          Close
        </button>
      </div>
      <div className="space-y-1 mt-6">
        {logs.map((log, i) => (
          <div key={i} className="text-xs font-mono whitespace-pre-wrap">{log}</div>
        ))}
      </div>
    </div>
  );
}; 