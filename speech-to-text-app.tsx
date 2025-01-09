import React, { useState } from 'react';
import { Mic, MicOff, Type, Send } from 'lucide-react';

export default function SpeechToTextApp() {
  const [isRecording, setIsRecording] = useState(false);
  const [text, setText] = useState('');
  const [volume, setVolume] = useState(0);
  
  // Simuleer volume verandering voor demo
  React.useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setVolume(Math.random() * 100);
      }, 100);
      return () => clearInterval(interval);
    }
    setVolume(0);
  }, [isRecording]);

  return (
    <div className="flex flex-col max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-yellow-500 text-transparent bg-clip-text">
          Speech to Text Converter
        </h1>
      </div>

      {/* Main Controls */}
      <div className="flex flex-col items-center gap-6">
        {/* Record Button */}
        <button
          onClick={() => setIsRecording(!isRecording)}
          className={`p-8 rounded-full transition-all duration-300 ${
            isRecording 
              ? 'bg-red-600 animate-pulse' 
              : 'bg-gradient-to-r from-red-600 to-yellow-500'
          }`}
        >
          {isRecording ? (
            <MicOff className="w-8 h-8 text-white" />
          ) : (
            <Mic className="w-8 h-8 text-white" />
          )}
        </button>

        {/* Recording Status */}
        <div className="text-sm text-gray-600">
          {isRecording ? 'Recording... Say "stop opname" to stop' : 'Click to start recording'}
        </div>

        {/* Volume Bar */}
        {isRecording && (
          <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-600 to-yellow-500 transition-all duration-100"
              style={{ width: `${volume}%` }}
            />
          </div>
        )}
      </div>

      {/* Text Output */}
      <div className="w-full">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-48 p-4 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500"
          placeholder="Your speech will appear here..."
        />
      </div>

      {/* Transform Controls */}
      <div className="flex gap-4">
        <select className="flex-1 p-2 border-2 border-gray-200 rounded-lg focus:border-red-500">
          <option value="zakelijk">Zakelijke brief</option>
          <option value="social">Social media post</option>
          <option value="email">E-mail</option>
        </select>
        
        <button className="px-6 py-2 bg-gradient-to-r from-purple-800 to-purple-600 text-white rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Type className="w-4 h-4" />
          Transform
        </button>
      </div>
    </div>
  );
}
