import React, { useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { useVoice } from '../hooks/useVoice';

/**
 * Voice Controls Component
 * Provides push-to-talk and TTS controls for the interview
 */
export function VoiceControls({ 
  onTranscript, 
  onSpeakResponse,
  className = '' 
}) {
  const {
    isListening,
    transcript,
    interimTranscript,
    sttSupported,
    sttError,
    toggleListening,
    clearTranscript,
    isSpeaking,
    ttsSupported,
    ttsEnabled,
    toggleTTS,
    stopSpeaking,
    speakResponse,
  } = useVoice();

  // Expose speakResponse to parent
  useEffect(() => {
    if (onSpeakResponse) {
      onSpeakResponse(speakResponse);
    }
  }, [speakResponse, onSpeakResponse]);

  // Send transcript when speech ends
  useEffect(() => {
    if (!isListening && transcript) {
      onTranscript?.(transcript);
      clearTranscript();
    }
  }, [isListening, transcript, onTranscript, clearTranscript]);

  if (!sttSupported && !ttsSupported) {
    return null; // No voice features available
  }

  return (
    <div className={`voice-controls ${className}`}>
      {/* Speech-to-Text Button */}
      {sttSupported && (
        <button
          className={`voice-btn ${isListening ? 'voice-btn--active' : ''}`}
          onClick={toggleListening}
          title={isListening ? 'Stop listening' : 'Start voice input'}
        >
          {isListening ? (
            <>
              <div className="voice-btn__pulse" />
              <MicOff size={20} />
            </>
          ) : (
            <Mic size={20} />
          )}
        </button>
      )}

      {/* Listening indicator */}
      {isListening && (
        <div className="voice-transcript">
          <div className="voice-transcript__text">
            {transcript}
            <span className="voice-transcript__interim">{interimTranscript}</span>
          </div>
        </div>
      )}

      {/* Text-to-Speech Toggle */}
      {ttsSupported && (
        <button
          className={`voice-btn ${!ttsEnabled ? 'voice-btn--muted' : ''} ${isSpeaking ? 'voice-btn--speaking' : ''}`}
          onClick={isSpeaking ? stopSpeaking : toggleTTS}
          title={isSpeaking ? 'Stop speaking' : ttsEnabled ? 'Disable voice' : 'Enable voice'}
        >
          {isSpeaking ? (
            <Loader2 size={20} className="voice-btn__spinner" />
          ) : ttsEnabled ? (
            <Volume2 size={20} />
          ) : (
            <VolumeX size={20} />
          )}
        </button>
      )}

      {/* Error indicator */}
      {sttError && (
        <span className="voice-error">{sttError}</span>
      )}
    </div>
  );
}

export default VoiceControls;
