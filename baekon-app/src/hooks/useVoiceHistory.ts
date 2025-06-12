import { useState, useEffect, useCallback } from 'react';

interface VoiceHistoryEntry {
  id: string;
  command: string;
  timestamp: Date;
  recognized: boolean;
  category?: string;
  frequency: number;
  isFavorite: boolean;
}

interface UseVoiceHistoryOptions {
  maxHistory?: number;
  userId?: string;
}

export function useVoiceHistory({
  maxHistory = 50,
  userId
}: UseVoiceHistoryOptions = {}) {

  const [history, setHistory] = useState<VoiceHistoryEntry[]>([]);
  const [favorites, setFavorites] = useState<VoiceHistoryEntry[]>([]);

  const storageKey = userId ? `voice-history-${userId}` : 'voice-history';
  const favoritesKey = userId ? `voice-favorites-${userId}` : 'voice-favorites';

  // Load history from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedHistory = localStorage.getItem(storageKey);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory).map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));
        setHistory(parsed);
      }

      const savedFavorites = localStorage.getItem(favoritesKey);
      if (savedFavorites) {
        const parsed = JSON.parse(savedFavorites).map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));
        setFavorites(parsed);
      }
    } catch (error) {
      console.warn('Failed to load voice history:', error);
    }
  }, [storageKey, favoritesKey]);

  // Save to localStorage whenever history changes
  useEffect(() => {
    if (typeof window === 'undefined' || history.length === 0) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(history));
    } catch (error) {
      console.warn('Failed to save voice history:', error);
    }
  }, [history, storageKey]);

  // Save favorites to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(favoritesKey, JSON.stringify(favorites));
    } catch (error) {
      console.warn('Failed to save voice favorites:', error);
    }
  }, [favorites, favoritesKey]);

  // Add command to history
  const addToHistory = useCallback((
    command: string,
    recognized: boolean,
    category?: string
  ) => {
    const newEntry: VoiceHistoryEntry = {
      id: `voice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      command: command.trim(),
      timestamp: new Date(),
      recognized,
      category,
      frequency: 1,
      isFavorite: false
    };

    setHistory(prev => {
      // Check if this exact command already exists
      const existingIndex = prev.findIndex(entry =>
        entry.command.toLowerCase() === command.toLowerCase().trim()
      );

      let updated;
      if (existingIndex >= 0) {
        // Update existing entry
        updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          timestamp: new Date(),
          frequency: updated[existingIndex].frequency + 1,
          recognized: recognized || updated[existingIndex].recognized
        };
      } else {
        // Add new entry
        updated = [newEntry, ...prev];
      }

      // Keep only the most recent entries
      return updated.slice(0, maxHistory);
    });

    return newEntry.id;
  }, [maxHistory]);

  // Toggle favorite status
  const toggleFavorite = useCallback((entryId: string) => {
    setHistory(prev => prev.map(entry => {
      if (entry.id === entryId) {
        const updated = { ...entry, isFavorite: !entry.isFavorite };

        // Update favorites list
        setFavorites(prevFav => {
          if (updated.isFavorite) {
            return [...prevFav, updated].slice(0, 20); // Max 20 favorites
          } else {
            return prevFav.filter(fav => fav.id !== entryId);
          }
        });

        return updated;
      }
      return entry;
    }));
  }, []);

  // Remove entry from history
  const removeFromHistory = useCallback((entryId: string) => {
    setHistory(prev => prev.filter(entry => entry.id !== entryId));
    setFavorites(prev => prev.filter(entry => entry.id !== entryId));
  }, []);

  // Clear all history
  const clearHistory = useCallback(() => {
    setHistory([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  // Get most frequent commands
  const getFrequentCommands = useCallback((limit = 10) => {
    return [...history]
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);
  }, [history]);

  // Get recent commands
  const getRecentCommands = useCallback((limit = 10) => {
    return [...history]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }, [history]);

  // Search history
  const searchHistory = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();
    return history.filter(entry =>
      entry.command.toLowerCase().includes(lowerQuery) ||
      entry.category?.toLowerCase().includes(lowerQuery)
    );
  }, [history]);

  // Get command suggestions based on partial input
  const getSuggestions = useCallback((partial: string, limit = 5) => {
    if (!partial.trim()) return [];

    const lowerPartial = partial.toLowerCase();
    return history
      .filter(entry =>
        entry.command.toLowerCase().startsWith(lowerPartial) &&
        entry.recognized
      )
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit)
      .map(entry => entry.command);
  }, [history]);

  // Get statistics
  const getStats = useCallback(() => {
    const total = history.length;
    const recognized = history.filter(entry => entry.recognized).length;
    const recognitionRate = total > 0 ? (recognized / total) * 100 : 0;

    const categoryStats = history.reduce((acc, entry) => {
      if (entry.category) {
        acc[entry.category] = (acc[entry.category] || 0) + 1;
      }
      return acc;
    }, {} as { [key: string]: number });

    const mostUsed = getFrequentCommands(1)[0];

    return {
      total,
      recognized,
      recognitionRate: Math.round(recognitionRate),
      categoryStats,
      mostUsedCommand: mostUsed?.command,
      favoritesCount: favorites.length
    };
  }, [history, favorites, getFrequentCommands]);

  return {
    history,
    favorites,
    addToHistory,
    toggleFavorite,
    removeFromHistory,
    clearHistory,
    getFrequentCommands,
    getRecentCommands,
    searchHistory,
    getSuggestions,
    getStats
  };
}
