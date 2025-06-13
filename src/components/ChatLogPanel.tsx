"use client";

import { useState, useEffect, useRef } from "react";

interface Message {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatLogPanelProps {
  messages: Message[];
}

export default function ChatLogPanel({ messages }: ChatLogPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Auto-scroll to bottom when messages change and modal is open
  useEffect(() => {
    if (isExpanded && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  return (
    <div className="h-full relative">
      {/* Chat Log Button/Mini Display */}
      <div className="h-full w-full p-2 relative">
        <div
          className="h-full relative overflow-hidden rounded-lg"
          style={{
            boxShadow: '0px 0px 37px -10px #C080FF inset',
            outline: '1px #C080FF solid',
            outlineOffset: '-1px'
          }}
        >
          {/* Background overlay for opacity */}
          <div
            className="absolute inset-0 rounded-lg"
            style={{
              backgroundImage: 'url(https://i.imgur.com/fu1Gj1m.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: 0.3,
              zIndex: 0
            }}
          >
            <img
              src="https://i.imgur.com/fu1Gj1m.png"
              alt=""
              className="absolute inset-0 w-full h-full object-cover rounded-lg opacity-30"
              style={{ zIndex: -1 }}
              onError={(e) => {
                console.log('Background image failed to load:', e);
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 h-full p-3 flex flex-col">
            <div
              className="flex items-center justify-between cursor-pointer hover:bg-gray-700/30 transition-colors rounded p-1"
              onClick={toggleExpanded}
            >
              <div
                className="text-xs font-medium"
                style={{
                  color: '#FF5983',
                  fontFamily: 'Wallpoet, monospace',
                  textShadow: '0px 0px 18px rgba(255, 89, 131, 1.00)'
                }}
              >
                Chat Log ({messages.length})
              </div>
              <div
                className="text-xs"
                style={{
                  color: '#F1E2FF',
                  fontFamily: 'Wallpoet, monospace'
                }}
              >
                {isExpanded ? '▼' : '▶'}
              </div>
            </div>

            {/* Mini preview of recent messages */}
            {!isExpanded && messages.length > 0 && (
              <div className="flex-1 overflow-hidden">
                <div
                  className="text-xs truncate"
                  style={{
                    color: '#F1E2FF',
                    fontFamily: 'Wallpoet, monospace',
                    textShadow: '0px 0px 8px rgba(255, 255, 255, 0.8)',
                    opacity: 0.6
                  }}
                >
                  Last: {messages[messages.length - 1]?.content.substring(0, 40)}...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Chat Log - Fixed positioned upward expansion */}
      {isExpanded && (
        <div
          className={`fixed bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border-2 border-neon-blue/40 rounded-xl shadow-2xl flex flex-col transition-all duration-300 ease-out transform ${
            isExpanded ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'
          }`}
          style={{
            bottom: '100px',
            left: '20px',
            width: '320px',
            height: '450px',
            zIndex: 10000,
            boxShadow: '0 -12px 40px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(64, 224, 208, 0.4), 0 0 20px rgba(64, 224, 208, 0.2)',
            transformOrigin: 'bottom'
          }}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neon-blue/30 bg-gradient-to-r from-gray-900/80 to-gray-800/80 rounded-t-xl">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-neon-blue rounded-full animate-pulse"></div>
                <h3 className="text-neon-blue font-semibold font-cal-sans text-sm">Chat History</h3>
                <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-full">{messages.length}</span>
              </div>
              <button
                onClick={toggleExpanded}
                className="text-gray-400 hover:text-neon-blue transition-colors text-lg w-7 h-7 flex items-center justify-center hover:bg-neon-blue/10 rounded-lg border border-transparent hover:border-neon-blue/30"
              >
                ×
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 ? (
                <div className="text-gray-500 text-center font-red-hat text-sm py-8">
                  No chat history yet. Start a conversation with AI!
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-2 rounded-lg font-red-hat text-xs ${
                        message.type === 'user'
                          ? 'bg-neon-blue bg-opacity-20 text-neon-blue border border-neon-blue/30'
                          : 'bg-gray-700 text-gray-300 border border-gray-600'
                      }`}
                    >
                      <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                      <div className="text-xs text-gray-500 mt-1 text-right">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
        </div>
      )}
    </div>
  );
}
