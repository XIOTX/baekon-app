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
  onAudioLevelChange?: (level: number) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
}

export default function VoiceCommandInterface({
  onCommand,
  disabled = false,
  className = "",
  userId,
  onAudioLevelChange,
  onRecordingStateChange
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

  // Update parent component with audio level changes
  useEffect(() => {
    if (onAudioLevelChange) {
      onAudioLevelChange(audioLevel);
    }
  }, [audioLevel, onAudioLevelChange]);

  // Update parent component with recording state changes
  useEffect(() => {
    if (onRecordingStateChange) {
      onRecordingStateChange(isRecording);
    }
  }, [isRecording, onRecordingStateChange]);

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
        className="relative flex items-center justify-center transition-all duration-200 cursor-pointer"
        style={{
          width: '70px',
          height: '43px',
          background: isRecording ? 'linear-gradient(0deg, rgba(0, 0, 0, 0.20) 0%, rgba(0, 0, 0, 0.20) 100%), rgba(192, 128, 255, 0.57)' : 'transparent',
          boxShadow: '0px 0px 37px -10px #C080FF inset',
          borderRadius: '27px',
          outline: '1px #C080FF solid',
          outlineOffset: '-1px',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          if (!isRecording && !disabled && !isProcessing) {
            e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isRecording && !disabled && !isProcessing) {
            e.currentTarget.style.background = 'transparent';
          }
        }}
      >
        {/* Button Text */}
        <div
          className="font-cal-sans font-normal text-center"
          style={{
            opacity: 0.8,
            color: '#FF5983',
            fontSize: '16px',
            fontFamily: 'Cal Sans',
            fontWeight: '400',
            textShadow: '0px 0px 18px rgba(255, 89, 131, 1.00)'
          }}
        >
          {isRecording ? 'REC...' : isProcessing ? 'PROC...' : 'VOICE'}
        </div>

        {/* Recording Animation Ring */}
        {isRecording && (
          <div className="absolute inset-0 rounded-lg border-2 border-red-500 animate-ping opacity-75" style={{ borderRadius: '27px' }}></div>
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
