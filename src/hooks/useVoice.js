import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * React hook for voice interaction (Speech-to-Text and Text-to-Speech)
 * Uses Web Speech API for browser-native voice capabilities
 */
export function useVoice() {
  // Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [sttSupported, setSttSupported] = useState(false);
  const [sttError, setSttError] = useState(null);

  // Text-to-Speech state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  // Refs
  const recognitionRef = useRef(null);
  const utteranceRef = useRef(null);

  // Check browser support on mount
  useEffect(() => {
    // Check STT support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSttSupported(!!SpeechRecognition);

    // Check TTS support
    setTtsSupported('speechSynthesis' in window);

    // Load available voices
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        // Select a default English voice
        const englishVoice = availableVoices.find(v => 
          v.lang.startsWith('en') && v.localService
        ) || availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
        
        if (englishVoice) {
          setSelectedVoice(englishVoice);
        }
      };

      loadVoices();
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  /**
   * Initialize speech recognition
   */
  const initRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setSttError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setSttError(event.error);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        setTranscript(prev => prev + final);
      }
      setInterimTranscript(interim);
    };

    return recognition;
  }, []);

  /**
   * Start listening for speech
   */
  const startListening = useCallback(() => {
    if (!sttSupported) {
      setSttError('Speech recognition not supported');
      return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
    }

    if (recognitionRef.current) {
      setTranscript('');
      setInterimTranscript('');
      recognitionRef.current.start();
    }
  }, [sttSupported, initRecognition]);

  /**
   * Stop listening
   */
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setInterimTranscript('');
  }, []);

  /**
   * Toggle listening state
   */
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  /**
   * Clear transcript
   */
  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  /**
   * Speak text using TTS
   */
  const speak = useCallback((text, options = {}) => {
    if (!ttsSupported || !ttsEnabled) return Promise.resolve();

    return new Promise((resolve, reject) => {
      // Cancel any ongoing speech
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      // Apply options
      utterance.voice = options.voice || selectedVoice;
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };

      utterance.onerror = (event) => {
        setIsSpeaking(false);
        reject(event.error);
      };

      speechSynthesis.speak(utterance);
    });
  }, [ttsSupported, ttsEnabled, selectedVoice]);

  /**
   * Stop speaking
   */
  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  /**
   * Toggle TTS enabled state
   */
  const toggleTTS = useCallback(() => {
    setTtsEnabled(prev => {
      if (prev) {
        // If disabling, stop any current speech
        stopSpeaking();
      }
      return !prev;
    });
  }, [stopSpeaking]);

  /**
   * Speak AI response when it arrives
   */
  const speakResponse = useCallback(async (text) => {
    if (!ttsEnabled) return;
    
    // Clean up markdown for speech
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'code block') // Replace code blocks
      .replace(/`([^`]+)`/g, '$1') // Remove inline code backticks
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markers
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic markers
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\n+/g, '. '); // Replace newlines with pauses

    await speak(cleanText);
  }, [ttsEnabled, speak]);

  return {
    // STT
    isListening,
    transcript,
    interimTranscript,
    sttSupported,
    sttError,
    startListening,
    stopListening,
    toggleListening,
    clearTranscript,

    // TTS
    isSpeaking,
    ttsSupported,
    ttsEnabled,
    voices,
    selectedVoice,
    setSelectedVoice,
    speak,
    stopSpeaking,
    toggleTTS,
    speakResponse,
  };
}

export default useVoice;
