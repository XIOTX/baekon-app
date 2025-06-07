import { useState, useEffect, useCallback } from 'react';

interface ChatMessage {
  id: string;
  message: string;
  response?: string;
  messageType: 'USER' | 'ASSISTANT' | 'SYSTEM';
  createdAt: Date;
}

interface ChatContext {
  events?: any[];
  notes?: any[];
  currentDate?: string;
  [key: string]: any;
}

export function useChat(userId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChatHistory = useCallback(async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/chat?userId=${userId}&limit=50`);
      if (!response.ok) throw new Error('Failed to fetch chat history');
      
      const data = await response.json();
      setMessages(data.map((msg: ChatMessage) => ({
        ...msg,
        createdAt: new Date(msg.createdAt),
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chat history');
    }
  }, [userId]);

  const sendMessage = useCallback(async (message: string, context?: ChatContext): Promise<string | null> => {
    if (!userId) return null;
    
    setLoading(true);
    setError(null);

    // Add user message to UI immediately
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      message,
      messageType: 'USER',
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, userId, context }),
      });

      if (!response.ok) throw new Error('Failed to send message');
      
      const data = await response.json();
      
      // Update with actual response
      const assistantMessage: ChatMessage = {
        id: data.chatLogId,
        message,
        response: data.response,
        messageType: 'ASSISTANT',
        createdAt: new Date(),
      };

      setMessages(prev => [...prev.slice(0, -1), assistantMessage]);
      return data.response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      // Remove the temporary message on error
      setMessages(prev => prev.slice(0, -1));
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchChatHistory();
    }
  }, [userId, fetchChatHistory]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    fetchChatHistory,
  };
}