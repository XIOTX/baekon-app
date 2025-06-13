"use client";

import { useState, useRef, useEffect } from "react";
import { getPersonalizedContext, analyzeConversationForMemory } from "@/utils/userPreferences";
import ActivityHistoryPanel from "./ActivityHistoryPanel";
import VoiceCommandInterface from "./VoiceCommandInterface";
import AudioVisualizer from "./AudioVisualizer";
import { processVoiceCommand, enhanceVoiceCommand } from "@/lib/voiceCommands";

interface Message {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp: Date;
}

interface BottomPanelProps {
  messages: Message[];
  sendMessage: (message: string, context?: any) => Promise<string | null>;
  loading: boolean;
  userId: string;
  // AI context and event management
  aiContext?: any;
  hourEvents?: { [key: string]: string[] };
  setHourEvents?: (events: { [key: string]: string[] } | ((prev: { [key: string]: string[] }) => { [key: string]: string[] })) => void;
  dayEvents?: { [key: string]: string[] };
  setDayEvents?: (events: { [key: string]: string[] } | ((prev: { [key: string]: string[] }) => { [key: string]: string[] })) => void;
  currentWeekDates?: Date[];
  // For activity history
  activeSection?: string;
  schedView?: string;
}

export default function BottomPanel({
  messages,
  sendMessage,
  loading,
  userId,
  aiContext,
  hourEvents,
  setHourEvents,
  dayEvents,
  setDayEvents,
  currentWeekDates,
  activeSection,
  schedView
}: BottomPanelProps) {
  const [chatInput, setChatInput] = useState("");
  const [showChatLog, setShowChatLog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedButton, setSelectedButton] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [showActivityHistory, setShowActivityHistory] = useState(false);

  // Input history for undo/redo
  const [inputHistory, setInputHistory] = useState<string[]>([""]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle input changes and update history
  const handleInputChange = (value: string) => {
    setChatInput(value);

    // Add to history if it's different from current
    if (value !== inputHistory[historyIndex]) {
      const newHistory = inputHistory.slice(0, historyIndex + 1);
      newHistory.push(value);
      // Keep history to reasonable size (last 50 inputs)
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      setInputHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  // Undo function - always clickable but only acts if there's history
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setChatInput(inputHistory[newIndex]);
    }
    // If no history, button still provides click feedback but does nothing
  };

  // Redo function - always clickable but only acts if there's forward history
  const handleRedo = () => {
    if (historyIndex < inputHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setChatInput(inputHistory[newIndex]);
    }
    // If no forward history, button still provides click feedback but does nothing
  };

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
        } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, inputHistory]);

  const controlButtons = [
    {
      id: 'history',
      label: 'HISTORY',
      action: () => {
        setSelectedButton(selectedButton === 'history' ? null : 'history');
        setShowActivityHistory(!showActivityHistory);
      }
    },
    {
      id: 'settings',
      label: 'SETTINGS',
      action: () => {
        setSelectedButton(selectedButton === 'settings' ? null : 'settings');
      }
    },
    {
      id: 'theme',
      label: 'THEME',
      action: () => {
        setSelectedButton(selectedButton === 'theme' ? null : 'theme');
      }
    },
    {
      id: 'files',
      label: 'FILES',
      action: () => {
        // Files button shouldn't stay selected - it just triggers file picker
        fileInputRef.current?.click();
      }
    },
    {
      id: 'profile',
      label: 'PROFILE',
      action: () => {
        setSelectedButton(selectedButton === 'profile' ? null : 'profile');
      }
    },
    {
      id: 'mode',
      label: 'MODE',
      action: () => {
        setSelectedButton(selectedButton === 'mode' ? null : 'mode');
      }
    }
  ];

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() && !loading) {
      const message = chatInput.trim();
      setChatInput("");

      // Analyze message for conversation memory
      analyzeConversationForMemory(message, userId);

      // Get personalized context with conversation memory
      const personalizedContext = getPersonalizedContext(userId);

      // Enhanced context with conversation memory
      const enhancedContext = {
        ...aiContext,
        ...personalizedContext,
        recentMessages: messages.slice(-5),
        currentTime: new Date().toISOString(),
        messageCount: messages.length,
        capabilities: {
          canCreateEvents: true,
          canAnalyzePatterns: true,
          canProvideInsights: true,
          hasScheduleAccess: true
        }
      };

      // Send message to AI with rich context and messages history
      await sendMessage(message, enhancedContext);
    }
  };

  // Handle voice commands
  const handleVoiceCommand = async (command: string) => {
    console.log('Voice command received:', command);

    if (command.trim() && !loading) {
      // Process voice command for recognition and enhancement
      const voiceProcessing = processVoiceCommand(command);
      const enhancedCommand = enhanceVoiceCommand(command);

      console.log('Voice processing result:', voiceProcessing);

      // Set the chat input to show the enhanced command
      setChatInput(enhancedCommand);

      // Process the voice command directly
      setTimeout(async () => {
        // Reset input after showing the command
        setChatInput("");

        // Analyze message for conversation memory
        analyzeConversationForMemory(enhancedCommand, userId);

        // Get personalized context with conversation memory
        const personalizedContext = getPersonalizedContext(userId);

        // Enhanced context with conversation memory and voice command info
        const enhancedContext = {
          ...aiContext,
          ...personalizedContext,
          recentMessages: messages.slice(-5),
          currentTime: new Date().toISOString(),
          messageCount: messages.length,
          isVoiceCommand: true,
          voiceCommandRecognized: voiceProcessing.recognized,
          voiceCommandCategory: voiceProcessing.command?.category,
          voiceCommandAction: voiceProcessing.command?.action,
          capabilities: {
            canCreateEvents: true,
            canAnalyzePatterns: true,
            canProvideInsights: true,
            hasScheduleAccess: true
          }
        };

        // Send message to AI with rich context and messages history
        await sendMessage(enhancedCommand, enhancedContext);

        // Provide voice command feedback if not recognized
        if (!voiceProcessing.recognized && voiceProcessing.suggestion) {
          console.log('Voice command suggestion:', voiceProcessing.suggestion);
        }
      }, 800);
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
        await sendMessage(`I uploaded a file: ${file.name}`, aiContext);
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

  return (
    <div className="h-full w-full p-4 flex flex-col">
      {/* Chat Log (when visible) */}
      {showChatLog && (
        <div className="flex-1 mb-4 bg-gray-900/50 rounded-lg p-3 max-h-32 overflow-y-auto">
          <div className="space-y-2">
            {messages.map((msg) => (
              <div key={msg.id} className="text-sm">
                <div className="text-blue-400 font-medium">
                  You: {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-gray-400 italic">BÆKON is thinking...</div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2">
        {/* Control Buttons */}
        <div className="flex space-x-1">
          {controlButtons.map((button) => {
            // Only show selected state for buttons that open panels/have states to show
            const isSelected = (selectedButton === button.id || (button.id === 'history' && showActivityHistory)) &&
                              ['history', 'settings', 'theme', 'profile', 'mode'].includes(button.id);
            // Reduce button widths to fit better
            const width = button.id === 'history' ? '75px' :
                         button.id === 'settings' ? '82px' :
                         button.id === 'profile' ? '73px' :
                         button.id === 'theme' ? '70px' :
                         button.id === 'files' ? '60px' :
                         button.id === 'mode' ? '65px' : '75px';

            return (
              <button
                key={button.id}
                onClick={button.action}
                disabled={uploading && button.id === 'files'}
                className="relative flex items-center justify-center transition-all duration-200 cursor-pointer"
                style={{
                  width,
                  height: '43px',
                  background: isSelected ? 'linear-gradient(0deg, rgba(0, 0, 0, 0.20) 0%, rgba(0, 0, 0, 0.20) 100%), rgba(192, 128, 255, 0.57)' : 'transparent',
                  boxShadow: '0px 0px 37px -10px #C080FF inset',
                  borderRadius: '27px',
                  outline: '1px #C080FF solid',
                  outlineOffset: '-1px',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div
                  className="font-cal-sans font-normal text-center"
                  style={{
                    opacity: 0.8,
                    color: '#FF5983',
                    fontSize: '16px', // Reduced font size
                    fontFamily: 'Cal Sans',
                    fontWeight: '400',
                    textShadow: '0px 0px 18px rgba(255, 89, 131, 1.00)'
                  }}
                >
                  {uploading && button.id === 'files' ? 'UP...' : button.label}
                </div>
              </button>
            );
          })}

          {/* Undo Button */}
          <button
            onClick={handleUndo}
            className="relative flex items-center justify-center transition-all duration-200 cursor-pointer"
            style={{
              width: '36px', // Reduced width
              height: '43px',
              background: 'transparent',
              boxShadow: '0px 0px 37px -10px #C080FF inset',
              borderRadius: '27px',
              outline: '1px #C080FF solid',
              outlineOffset: '-1px',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            title="Undo Input"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" style={{ color: '#FF5983', filter: 'drop-shadow(0px 0px 18px rgba(255, 89, 131, 1.00))' }}>
              <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" fill="currentColor"/>
            </svg>
          </button>

          {/* Redo Button */}
          <button
            onClick={handleRedo}
            className="relative flex items-center justify-center transition-all duration-200 cursor-pointer"
            style={{
              width: '36px', // Reduced width
              height: '43px',
              background: 'transparent',
              boxShadow: '0px 0px 37px -10px #C080FF inset',
              borderRadius: '27px',
              outline: '1px #C080FF solid',
              outlineOffset: '-1px',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            title="Redo Input"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" style={{ color: '#FF5983', filter: 'drop-shadow(0px 0px 18px rgba(255, 89, 131, 1.00))' }}>
              <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z" fill="currentColor"/>
            </svg>
          </button>
        </div>

        {/* Audio Visualizer */}
        <AudioVisualizer
          audioLevel={audioLevel}
          isRecording={isVoiceRecording}
        />

        {/* Chat Input */}
        <form onSubmit={handleChatSubmit} className="flex-1 flex items-center space-x-2">
          <div
            className="relative flex items-center flex-1"
            style={{
              height: '43px',
              boxShadow: '0px 0px 37px -10px #C080FF inset',
              borderRadius: '27px',
              outline: '1px #C080FF solid',
              outlineOffset: '-1px',
              overflow: 'hidden'
            }}
          >
            {/* Plus Button */}
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
              <div
                className="flex items-center justify-center text-center font-syne-mono font-normal"
                style={{
                  width: '13px',
                  height: '58px',
                  opacity: 0.8,
                  color: '#FF5983',
                  fontSize: '48px',
                  textShadow: '0px 0px 18px rgba(255, 89, 131, 1.00)'
                }}
              >
                +
              </div>
            </div>

            {/* Vertical Divider */}
            <div
              className="absolute left-10"
              style={{
                width: '1px',
                height: '43px',
                boxShadow: '0px 0px 37px #C080FF inset',
                outline: '1px #C080FF solid',
                outlineOffset: '-0.50px',
                transform: 'rotate(-90deg)',
                transformOrigin: 'top left'
              }}
            />

            {/* Input Field */}
            <input
              type="text"
              value={chatInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="type here"
              disabled={loading}
              className="w-full h-full bg-transparent border-0 outline-none text-white font-syne-mono font-normal text-xl pl-14 pr-4 placeholder:text-pink-400/50 placeholder:italic placeholder:font-syne-mono"
              style={{
                fontSize: '24px',
                color: '#FFFFFF',
                fontFamily: 'Syne Mono',
                fontWeight: '400'
              }}
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={loading}
            className="relative flex items-center justify-center transition-all duration-200 cursor-pointer"
            style={{
              width: '65px',
              height: '43px',
              background: 'transparent',
              boxShadow: '0px 0px 37px -10px #C080FF inset',
              borderRadius: '27px',
              outline: '1px #C080FF solid',
              outlineOffset: '-1px',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
            title="Send Message"
          >
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
              {loading ? 'WAIT...' : 'SEND'}
            </div>
          </button>

          <VoiceCommandInterface
            onCommand={handleVoiceCommand}
            disabled={loading}
            userId={userId}
            onAudioLevelChange={setAudioLevel}
            onRecordingStateChange={setIsVoiceRecording}
          />
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

      {/* Activity History Overlay */}
      {showActivityHistory && (
        <div
          className={`fixed bg-gray-800/98 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-2xl flex flex-col transition-all duration-300 ease-out transform ${
            showActivityHistory ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'
          }`}
          style={{
            bottom: '160px',
            left: '50%',
            transform: showActivityHistory ? 'translateX(-50%) scaleY(1)' : 'translateX(-50%) scaleY(0)',
            width: '600px',
            height: '450px',
            zIndex: 10000,
            boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(34, 197, 94, 0.3)',
            transformOrigin: 'bottom'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-600 bg-gray-800/90 rounded-t-lg">
            <h3 className="text-neon-green font-semibold font-cal-sans text-sm">Activity History</h3>
            <button
              onClick={() => setShowActivityHistory(false)}
              className="text-gray-400 hover:text-white transition-colors text-lg w-6 h-6 flex items-center justify-center hover:bg-gray-700 rounded"
            >
              &times;
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <ActivityHistoryPanel
              messages={messages}
              currentSection={activeSection}
              currentView={schedView}
            />
          </div>
        </div>
      )}
    </div>
  );
}
