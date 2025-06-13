"use client";

import { useState, useEffect, useRef } from "react";

interface Message {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp: Date;
}

interface AIResponsePanelProps {
  messages: Message[];
  loading: boolean;
  isExpanded?: boolean;
  setIsExpanded?: (expanded: boolean) => void;
}

export default function AIResponsePanel({ messages, loading, isExpanded = false, setIsExpanded }: AIResponsePanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get the latest AI response
  const latestAIResponse = messages
    .filter(msg => msg.type === 'assistant')
    .slice(-1)[0];

  const toggleExpanded = () => {
    if (setIsExpanded) {
      setIsExpanded(!isExpanded);
    }
  };

  // Auto-scroll to bottom when messages change and expanded
  useEffect(() => {
    if (isExpanded && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  return (
    <div className="h-full w-full p-2 relative" style={{ width: '300px', maxWidth: '300px' }}>
      <div
        className="h-full relative overflow-hidden rounded-lg cursor-pointer hover:bg-purple-500/5 transition-colors"
        style={{
          boxShadow: '0px 0px 37px -10px #C080FF inset',
          outline: '1px #C080FF solid',
          outlineOffset: '-1px'
        }}
        onClick={toggleExpanded}
      >
        {/* Background overlay */}
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
            className="text-xs font-medium mb-2 pb-1 relative"
            style={{
              color: '#FF5983',
              fontFamily: 'Cal Sans, sans-serif',
              textShadow: '0px 0px 18px rgba(255, 89, 131, 1.00)'
            }}
          >
            {/* Fading line under BÆKON */}
            <div
              className="absolute bottom-0 left-0 h-px"
              style={{
                width: '100%',
                background: 'linear-gradient(to right, #FF5983 16.67%, transparent 100%)'
              }}
            />
            BÆKON
            {/* Expand indicator */}
            <div
              className="absolute bottom-1 right-2 text-xs opacity-60"
              style={{
                color: '#F1E2FF',
                fontFamily: 'Cal Sans, sans-serif'
              }}
            >
              {isExpanded ? '↙' : '↗'}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin h-3 w-3 border border-neon-blue border-t-transparent rounded-full"></div>
                <span
                  className="text-xs"
                  style={{
                    color: '#F1E2FF',
                    fontFamily: 'Syne Mono, monospace',
                    textShadow: '0px 0px 8px rgba(255, 255, 255, 0.8)'
                  }}
                >
                  AI is thinking...
                </span>
              </div>
            ) : latestAIResponse ? (
              <div
                className="text-sm leading-relaxed"
                style={{
                  color: '#F1E2FF',
                  fontFamily: 'Syne Mono, monospace',
                  textShadow: '0px 0px 8px rgba(255, 255, 255, 0.8)'
                }}
              >
                {latestAIResponse.content}
              </div>
            ) : (
              <div
                className="text-xs italic"
                style={{
                  color: '#F1E2FF',
                  fontFamily: 'Syne Mono, monospace',
                  textShadow: '0px 0px 8px rgba(255, 255, 255, 0.8)',
                  opacity: 0.6
                }}
              >
                Click anywhere to expand chat • Ask AI a question
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
