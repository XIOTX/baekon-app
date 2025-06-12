"use client";

import { useState } from "react";

interface Message {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp: Date;
}

interface AIResponsePanelProps {
  messages: Message[];
  loading: boolean;
}

export default function AIResponsePanel({ messages, loading }: AIResponsePanelProps) {
  // Get the latest AI response
  const latestAIResponse = messages
    .filter(msg => msg.type === 'assistant')
    .slice(-1)[0];

  return (
    <div className="h-full p-3 flex flex-col">
      <div className="text-neon-blue text-xs font-medium font-red-hat mb-2 border-b border-gray-600 pb-1">
        AI Response
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center space-x-2 text-gray-400">
            <div className="animate-spin h-3 w-3 border border-neon-blue border-t-transparent rounded-full"></div>
            <span className="text-xs font-red-hat">AI is thinking...</span>
          </div>
        ) : latestAIResponse ? (
          <div className="text-gray-300 text-sm font-red-hat leading-relaxed">
            {latestAIResponse.content}
          </div>
        ) : (
          <div className="text-gray-500 text-xs font-red-hat italic">
            Ask AI a question to see the response here
          </div>
        )}
      </div>
    </div>
  );
}
