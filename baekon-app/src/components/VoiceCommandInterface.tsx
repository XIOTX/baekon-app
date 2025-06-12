"use client";

import { useState, useEffect } from 'react';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useVoiceShortcuts } from '@/hooks/useVoiceShortcuts';
import { useVoiceHistory } from '@/hooks/useVoiceHistory';
import { getVoiceCommandHelp, processVoiceCommand } from '@/lib/voiceCommands';

interface VoiceCommandInterfaceProps {
  onCommand: (command: string) => void;
  disabled?: boolean;
  className?: string;
  userId?: string;
}

export default function VoiceCommandInterface({
  onCommand,
  disabled = false,
  className = "",
  userId
}: VoiceCommandInterfaceProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>('');
  const [showHelp, setShowHelp] = useState(false);
  const [confidence, setConfidence] = useState<number>(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Voice history for tracking commands
  const voiceHistory = useVoiceHistory({ userId, maxHistory: 100 });

  const {
    isRecording,
    isProcessing,
    transcript,
    error,
    audioLevel,
    isSupported,
    toggleRecording,
    startRecording,
    stopRecording,
    clearTranscript
  } = useVoiceRecording({
    onTranscript: (finalTranscript) => {
      if (finalTranscript.trim()) {
        // Process command for recognition and confidence
        const processing = processVoiceCommand(finalTranscript);

        setLastCommand(finalTranscript);
        setConfidence(processing.confidence || 0);
        setSuggestions(processing.corrections || []);

        // Add to history
        voiceHistory.addToHistory(
          finalTranscript,
          processing.recognized,
          processing.command?.category
        );

        onCommand(finalTranscript);
        setShowTranscript(true);

        // Hide transcript after 3 seconds
        setTimeout(() => {
          setShowTranscript(false);
          clearTranscript();
          setSuggestions([]);
        }, 3000);
      }
    },
    onError: (error) => {
      console.error('Voice recording error:', error);
    },
    continuous: false,
    interimResults: true,
    language: 'en-US'
  });

  // Keyboard shortcuts
  useVoiceShortcuts({
    onToggleRecording: toggleRecording,
    onStartRecording: startRecording,
    onStopRecording: stopRecording,
    onShowHelp: () => setShowHelp(!showHelp),
    enabled: !disabled
  });

  // Visual feedback for audio level
  const getAudioLevelColor = () => {
    if (audioLevel < 0.1) return 'bg-gray-500';
    if (audioLevel < 0.3) return 'bg-yellow-500';
    if (audioLevel < 0.7) return 'bg-green-500';
    return 'bg-red-500';
  };

  // Voice command examples from the command processor
  const voiceExamples = getVoiceCommandHelp();

  if (!isSupported) {
    return (
      <div className={`text-center p-3 ${className}`}>
        <div className="text-gray-500 text-xs">
          Voice commands not supported in this browser
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Voice Command Button */}
      <button
        onClick={toggleRecording}
        disabled={disabled || isProcessing}
        className={`relative px-4 py-2 rounded-lg border transition-all duration-200 flex items-center gap-2 ${
          isRecording
            ? 'border-red-500 text-red-400 bg-red-500/20 shadow-lg shadow-red-500/20'
            : isProcessing
            ? 'border-yellow-500 text-yellow-400 bg-yellow-500/20'
            : 'border-neon-purple text-neon-purple bg-neon-purple/20 hover:bg-neon-purple/30'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {/* Microphone Icon */}
        <div className="relative">
          {isRecording ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          ) : isProcessing ? (
            <svg className="w-4 h-4 animate-spin" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          )}

          {/* Audio Level Indicator */}
          {isRecording && (
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse"
                 style={{ backgroundColor: `rgb(${Math.floor(audioLevel * 255)}, ${Math.floor((1 - audioLevel) * 255)}, 0)` }}>
            </div>
          )}
        </div>

        {/* Button Text */}
        <span className="text-xs font-semibold">
          {isRecording ? 'LISTENING...' : isProcessing ? 'PROCESSING...' : 'VOICE'}
        </span>

        {/* Recording Animation Ring */}
        {isRecording && (
          <div className="absolute inset-0 rounded-lg border-2 border-red-500 animate-ping opacity-75"></div>
        )}
      </button>

      {/* Live Transcript Display */}
      {isRecording && transcript && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-900/95 backdrop-blur-md border border-neon-purple/40 rounded-lg p-3 shadow-xl">
          <div className="text-xs text-neon-purple font-semibold mb-1">Listening...</div>
          <div className="text-sm text-gray-300 font-red-hat">
            "{transcript}"
          </div>

          {/* Audio Level Visualizer */}
          <div className="mt-2 flex items-center gap-1">
            <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-100 rounded-full ${getAudioLevelColor()}`}
                style={{ width: `${audioLevel * 100}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500">
              {Math.round(audioLevel * 100)}%
            </div>
          </div>
        </div>
      )}

      {/* Command Confirmation */}
      {showTranscript && lastCommand && !isRecording && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-green-900/95 backdrop-blur-md border border-green-500/40 rounded-lg p-3 shadow-xl">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs text-green-400 font-semibold">✓ Command Received</div>
            {confidence > 0 && (
              <div className="text-xs text-gray-400">
                {Math.round(confidence * 100)}% confidence
              </div>
            )}
          </div>
          <div className="text-sm text-gray-300 font-red-hat mb-1">
            "{lastCommand}"
          </div>
          {suggestions.length > 0 && confidence < 0.8 && (
            <div className="text-xs text-yellow-400 mt-2">
              <div className="font-semibold mb-1">💡 Did you mean:</div>
              {suggestions.slice(0, 2).map((suggestion, index) => (
                <div key={index} className="text-gray-400">• {suggestion}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-red-900/95 backdrop-blur-md border border-red-500/40 rounded-lg p-3 shadow-xl">
          <div className="text-xs text-red-400 font-semibold mb-1">⚠ Error</div>
          <div className="text-sm text-gray-300 font-red-hat">
            {error}
          </div>
        </div>
      )}

      {/* Voice Command Help (shows on hover when not recording) */}
      {!isRecording && !isProcessing && !showTranscript && (
        <div className="absolute bottom-full left-0 right-0 mb-2 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-gray-900/95 backdrop-blur-md border border-gray-600/40 rounded-lg p-3 shadow-xl">
            <div className="text-xs text-gray-400 font-semibold mb-2">Try voice commands:</div>
            <div className="space-y-1">
              {voiceExamples.slice(0, 4).map((example, index) => (
                <div key={index} className="text-xs text-gray-500 font-red-hat">
                  {example}
                </div>
              ))}
              <div className="text-xs text-gray-600 italic">Say "Help" for all commands</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
