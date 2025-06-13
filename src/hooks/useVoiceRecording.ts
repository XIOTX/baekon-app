import { useState, useCallback, useRef, useEffect } from 'react';

interface VoiceRecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  error: string | null;
  audioLevel: number;
}

interface UseVoiceRecordingOptions {
  onTranscript?: (transcript: string) => void;
  onError?: (error: string) => void;
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
}

export function useVoiceRecording(options: UseVoiceRecordingOptions = {}) {
  const {
    onTranscript,
    onError,
    continuous = false,
    interimResults = true,
    language = 'en-US'
  } = options;

  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    isProcessing: false,
    transcript: '',
    error: null,
    audioLevel: 0
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const animationFrameRef = useRef<number>();

  // Browser support state - initialize as false to prevent hydration mismatch
  const [isSupported, setIsSupported] = useState(false);

  // Check for browser support after hydration
  useEffect(() => {
    const checkSupport = typeof window !== 'undefined' && (
      'webkitSpeechRecognition' in window ||
      'SpeechRecognition' in window
    ) && 'MediaDevices' in window && 'getUserMedia' in navigator.mediaDevices;

    setIsSupported(checkSupport);
  }, []);

  // Audio level monitoring
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalized = Math.min(average / 128, 1);

    setState(prev => ({ ...prev, audioLevel: normalized }));

    if (state.isRecording) {
      animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
    }
  }, [state.isRecording]);

  // Initialize Web Speech API
  const initializeSpeechRecognition = useCallback(() => {
    if (!isSupported) return null;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setState(prev => ({ ...prev, isRecording: true, error: null }));
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const fullTranscript = finalTranscript || interimTranscript;
      setState(prev => ({ ...prev, transcript: fullTranscript }));

      if (finalTranscript && onTranscript) {
        onTranscript(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      let errorMessage = 'Speech recognition failed';

      switch (event.error) {
        case 'network':
          errorMessage = 'Network error. Please check your internet connection and try again.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings.';
          break;
        case 'service-not-allowed':
          errorMessage = 'Speech recognition service not available. Please try again later.';
          break;
        case 'bad-grammar':
          errorMessage = 'Speech recognition configuration error. Please try again.';
          break;
        case 'language-not-supported':
          errorMessage = 'Language not supported. Please try switching to English.';
          break;
        case 'no-speech':
          errorMessage = 'No speech detected. Please speak clearly and try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone error. Please check your microphone and try again.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}. Please try again.`;
      }

      setState(prev => ({ ...prev, error: errorMessage, isRecording: false }));
      if (onError) onError(errorMessage);
    };

    recognition.onend = () => {
      setState(prev => ({ ...prev, isRecording: false, isProcessing: false }));
    };

    return recognition;
  }, [continuous, interimResults, language, onTranscript, onError, isSupported]);

  // Start recording with Web Speech API
  const startRecording = useCallback(async () => {
    if (!isSupported) {
      const error = 'Speech recognition not supported in this browser';
      setState(prev => ({ ...prev, error }));
      if (onError) onError(error);
      return;
    }

    try {
      // Clear any previous errors
      setState(prev => ({ ...prev, error: null }));

      // Request microphone permission first
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          }
        });
        streamRef.current = stream;
      } catch (micError) {
        console.error('Microphone access error:', micError);

        // More specific error handling based on actual error
        if (micError instanceof Error) {
          if (micError.name === 'NotAllowedError') {
            throw new Error('Microphone access denied. Please allow microphone access and try again.');
          } else if (micError.name === 'NotFoundError') {
            throw new Error('No microphone found. Please connect a microphone and try again.');
          } else if (micError.name === 'NotReadableError') {
            throw new Error('Microphone is already in use by another application.');
          } else if (micError.name === 'NetworkError' || micError.message.includes('network')) {
            throw new Error('Network error detected. Please check your internet connection and try again.');
          } else {
            throw new Error(`Microphone error: ${micError.message}. Please try again.`);
          }
        } else {
          throw new Error('Failed to access microphone. Please check your permissions and try again.');
        }
      }

      // Set up audio context for level monitoring
      try {
        audioContextRef.current = new AudioContext();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        source.connect(analyserRef.current);

        // Start audio level monitoring
        monitorAudioLevel();
      } catch (audioError) {
        console.warn('Audio monitoring setup failed:', audioError);
        // Continue without audio monitoring
      }

      // Initialize and start speech recognition
      recognitionRef.current = initializeSpeechRecognition();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setState(prev => ({
            ...prev,
            isRecording: true,
            error: null,
            transcript: ''
          }));
        } catch (speechError) {
          console.error('Speech recognition start error:', speechError);

          if (speechError instanceof Error) {
            if (speechError.message.includes('network') || speechError.name === 'NetworkError') {
              throw new Error('Network error starting speech recognition. Please check your internet connection and try again.');
            } else if (speechError.message.includes('not-allowed')) {
              throw new Error('Speech recognition access denied. Please check your browser permissions.');
            } else {
              throw new Error(`Speech recognition error: ${speechError.message}. Please try again.`);
            }
          } else {
            throw new Error('Speech recognition failed to start. Please try again.');
          }
        }
      } else {
        throw new Error('Speech recognition not available. Please use a supported browser like Chrome.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      setState(prev => ({ ...prev, error: errorMessage, isRecording: false }));
      if (onError) onError(errorMessage);

      // Clean up on error
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [isSupported, initializeSpeechRecognition, monitorAudioLevel, onError]);

  // Stop recording
  const stopRecording = useCallback(() => {
    setState(prev => ({ ...prev, isProcessing: true }));

    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    // Stop audio monitoring
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Clean up audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isRecording: false,
      isProcessing: false,
      audioLevel: 0
    }));
  }, []);

  // Toggle recording
  const toggleRecording = useCallback(() => {
    if (state.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [state.isRecording, startRecording, stopRecording]);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setState(prev => ({ ...prev, transcript: '', error: null }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.isRecording) {
        stopRecording();
      }
    };
  }, [state.isRecording, stopRecording]);

  return {
    ...state,
    isSupported,
    startRecording,
    stopRecording,
    toggleRecording,
    clearTranscript
  };
}
