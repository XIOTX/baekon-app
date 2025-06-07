"use client";

import { useState, useRef } from "react";

interface ChatMessage {
  id: string;
  message: string;
  response?: string;
  messageType: 'USER' | 'ASSISTANT' | 'SYSTEM';
  createdAt: Date;
}

interface BottomPanelProps {
  messages: ChatMessage[];
  sendMessage: (message: string, context?: any) => Promise<string | null>;
  loading: boolean;
  userId: string;
}

export default function BottomPanel({ messages, sendMessage, loading, userId }: BottomPanelProps) {
  const [chatInput, setChatInput] = useState("");
  const [showChatLog, setShowChatLog] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const controlButtons = [
    { id: 'profile', label: 'PROFILE', color: 'neon-purple' },
    { id: 'history', label: 'HISTORY', color: 'neon-blue', action: () => setShowChatLog(!showChatLog) },
    { id: 'settings', label: 'SETTINGS', color: 'neon-green' },
    { id: 'theme', label: 'THEME', color: 'neon-pink' },
    { id: 'mode', label: 'MODE', color: 'neon-aqua' },
    { id: 'files', label: 'FILES', color: 'neon-purple', action: () => fileInputRef.current?.click() },
  ];

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() && !loading) {
      const message = chatInput.trim();
      setChatInput("");
      
      // Send message to AI
      await sendMessage(message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('File uploaded:', result);
        // Could send a message about the uploaded file
        await sendMessage(`I uploaded a file: ${file.name}`);
      } else {
        console.error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement actual voice recording
  };

  return (
    <div className="h-full w-full p-4 flex flex-col">
      {/* Chat Log (when visible) */}
      {showChatLog && (
        <div className="flex-1 mb-4 bg-gray-900/50 rounded-lg p-3 max-h-32 overflow-y-auto">
          <div className="space-y-2">
            {messages.map((msg) => (
              <div key={msg.id} className="text-sm">
                <div className="text-blue-400 font-medium">
                  You: {msg.message}
                </div>
                {msg.response && (
                  <div className="text-gray-300 mt-1 ml-4">
                    BÆKON: {msg.response}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="text-gray-400 italic">BÆKON is thinking...</div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center space-x-4">
        {/* Control Buttons */}
        <div className="flex space-x-2">
          {controlButtons.map((button) => (
            <button
              key={button.id}
              onClick={button.action}
              className={`px-3 py-2 text-xs font-red-hat font-semibold rounded border transition-all duration-200 
                border-gray-600 text-gray-400 hover:border-${button.color} hover:text-${button.color}
                ${uploading && button.id === 'files' ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              disabled={uploading && button.id === 'files'}
            >
              {uploading && button.id === 'files' ? 'UPLOADING...' : button.label}
            </button>
          ))}
        </div>

        {/* Chat Input */}
        <form onSubmit={handleChatSubmit} className="flex-1 flex items-center space-x-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type your command or question..."
            disabled={loading}
            className="flex-1 bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-neon-aqua focus:shadow-neon-aqua transition-all duration-200"
          />
          
          <button
            type="submit"
            disabled={loading || !chatInput.trim()}
            className="px-4 py-2 bg-neon-aqua/20 border border-neon-aqua text-neon-aqua rounded-lg hover:bg-neon-aqua/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'SENDING...' : 'SEND'}
          </button>

          <button
            type="button"
            onClick={toggleRecording}
            className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
              isRecording 
                ? 'border-red-500 text-red-500 bg-red-500/20' 
                : 'border-gray-600 text-gray-400 hover:border-neon-purple hover:text-neon-purple'
            }`}
          >
            {isRecording ? 'STOP' : 'REC'}
          </button>
        </form>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept="*/*"
        />
      </div>
    </div>
  );
}