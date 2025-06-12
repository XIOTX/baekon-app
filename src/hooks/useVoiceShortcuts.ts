import { useEffect, useCallback } from 'react';

interface VoiceShortcutsOptions {
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onToggleRecording?: () => void;
  onShowHelp?: () => void;
  enabled?: boolean;
}

export function useVoiceShortcuts({
  onStartRecording,
  onStopRecording,
  onToggleRecording,
  onShowHelp,
  enabled = true
}: VoiceShortcutsOptions) {

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when user is typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return;
    }

    // Ctrl/Cmd + Shift + V - Toggle voice recording
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'V') {
      event.preventDefault();
      onToggleRecording?.();
      return;
    }

    // Hold Space - Push to talk (start recording)
    if (event.code === 'Space' && !event.repeat) {
      event.preventDefault();
      onStartRecording?.();
      return;
    }

    // Ctrl/Cmd + / - Show voice command help
    if ((event.ctrlKey || event.metaKey) && event.key === '/') {
      event.preventDefault();
      onShowHelp?.();
      return;
    }

    // ESC - Stop recording
    if (event.key === 'Escape') {
      onStopRecording?.();
      return;
    }

    // Ctrl/Cmd + M - Toggle microphone (alternative)
    if ((event.ctrlKey || event.metaKey) && event.key === 'm') {
      event.preventDefault();
      onToggleRecording?.();
      return;
    }
  }, [enabled, onStartRecording, onStopRecording, onToggleRecording, onShowHelp]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Release Space - Stop push to talk
    if (event.code === 'Space') {
      event.preventDefault();
      onStopRecording?.();
      return;
    }
  }, [enabled, onStopRecording]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled, handleKeyDown, handleKeyUp]);

  // Return shortcut info for display
  const shortcuts = [
    { key: 'Ctrl+Shift+V', description: 'Toggle voice recording' },
    { key: 'Space (hold)', description: 'Push to talk' },
    { key: 'Ctrl+M', description: 'Toggle microphone' },
    { key: 'Ctrl+/', description: 'Show voice help' },
    { key: 'Escape', description: 'Stop recording' }
  ];

  return { shortcuts };
}
