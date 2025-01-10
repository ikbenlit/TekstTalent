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

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/80 text-white p-4 max-h-48 overflow-auto z-50">
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 text-xs bg-red-500 px-2 py-1 rounded"
      >
        Close
      </button>
      <div className="space-y-1">
        {logs.map((log, i) => (
          <div key={i} className="text-xs font-mono whitespace-pre-wrap">{log}</div>
        ))}
      </div>
    </div>
  );
}; 