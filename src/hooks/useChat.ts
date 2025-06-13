import { useState, useEffect, useCallback } from 'react';

interface Message {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatContext {
  events?: any[];
  notes?: any[];
  currentDate?: string;
  [key: string]: any;
}

export function useChat(userId: string | null) {
  const [messages, setMessages] = useState<Message[]>(() => {
    // Load from localStorage on initialization
    if (typeof window !== 'undefined' && userId) {
      const saved = localStorage.getItem(`baekon-chat-${userId}`);
      if (saved) {
        try {
          const parsedMessages = JSON.parse(saved);
          return parsedMessages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
        } catch (e) {
          console.warn('Failed to parse saved chat messages:', e);
        }
      }
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && userId && messages.length > 0) {
      localStorage.setItem(`baekon-chat-${userId}`, JSON.stringify(messages));
    }
  }, [messages, userId]);

  const fetchChatHistory = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/chat?userId=${userId}&limit=50`);
      if (!response.ok) {
        console.warn('Failed to fetch chat history from server, using localStorage');
        return;
      }

      const data = await response.json();
      const serverMessages = data.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        type: msg.type,
        timestamp: new Date(msg.timestamp),
      }));

      // Merge with localStorage messages (server takes precedence)
      if (serverMessages.length > 0) {
        setMessages(serverMessages);
      }
    } catch (err) {
      console.warn('Failed to fetch chat history from server:', err);
      // Keep using localStorage messages
    }
  }, [userId]);

  const sendMessage = useCallback(async (message: string, context?: ChatContext): Promise<{response: string | null, eventData?: any}> => {
    if (!userId) return { response: null };

    setLoading(true);
    setError(null);

    // Add user message to UI immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: message,
      type: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          userId,
          context,
          messages: messages // Pass current messages for context
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Add assistant response
      const assistantMessage: Message = {
        id: data.chatLogId || `assistant-${Date.now()}`,
        content: data.response,
        type: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      return { response: data.response, eventData: data.eventData };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);

      // Add error message as assistant response so user sees what happened
      const errorResponse: Message = {
        id: `error-${Date.now()}`,
        content: `Sorry, I encountered an error: ${errorMessage}. Your message has been saved locally.`,
        type: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
      return { response: null };
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
