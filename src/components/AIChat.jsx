import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, User, Loader2, WifiOff, RefreshCw, 
  Trash2, Download, Mic, MicOff, Volume2, VolumeX,
  ChevronDown, Settings, AlertCircle
} from 'lucide-react';
import { useOllama } from '../hooks/useOllama';

/**
 * AI Chat Component
 * Provides chat interface for AI interviewer interaction
 */
export function AIChat({ 
  onCodeContext,
  currentQuestion,
  currentCode,
  currentLanguage,
  onStartInterview,
  className = '' 
}) {
  const {
    isConnected,
    isChecking,
    availableModels,
    selectedModel,
    setSelectedModel,
    retryConnection,
    messages,
    isLoading,
    streamingMessage,
    error,
    sendMessage,
    setContext,
    clearChat,
    startInterview,
  } = useOllama('llama3');

  const [inputValue, setInputValue] = useState('');
  const [showModelSelect, setShowModelSelect] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  // Update context when question/code changes
  useEffect(() => {
    if (currentQuestion || currentCode) {
      const context = `
Question: ${currentQuestion || 'Not selected'}
Language: ${currentLanguage || 'javascript'}
${currentCode ? `\nCandidate's Code:\n\`\`\`${currentLanguage || 'javascript'}\n${currentCode}\n\`\`\`` : ''}
      `.trim();
      setContext(context);
    }
  }, [currentQuestion, currentCode, currentLanguage, setContext]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue;
    setInputValue('');
    
    try {
      await sendMessage(message);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleStartInterview = async () => {
    await startInterview();
    onStartInterview?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Render connection status
  if (isChecking) {
    return (
      <div className={`ai-chat ${className}`}>
        <div className="ai-chat__status">
          <Loader2 className="ai-chat__spinner" size={24} />
          <span>Connecting to Ollama...</span>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className={`ai-chat ${className}`}>
        <div className="ai-chat__status ai-chat__status--error">
          <WifiOff size={32} />
          <h3>Ollama Not Connected</h3>
          <p>Make sure Ollama is running locally</p>
          <code>ollama serve</code>
          <button onClick={retryConnection} className="ai-chat__retry-btn">
            <RefreshCw size={16} />
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`ai-chat ${className}`}>
      {/* Header */}
      <div className="ai-chat__header">
        <div className="ai-chat__header-left">
          <Bot size={20} className="ai-chat__bot-icon" />
          <span className="ai-chat__title">AI Interviewer</span>
          <span className="ai-chat__status-dot" />
        </div>
        
        <div className="ai-chat__header-right">
          {/* Model selector */}
          <div className="ai-chat__model-select">
            <button 
              className="ai-chat__model-btn"
              onClick={() => setShowModelSelect(!showModelSelect)}
            >
              {selectedModel}
              <ChevronDown size={14} />
            </button>
            
            {showModelSelect && (
              <div className="ai-chat__model-dropdown">
                {availableModels.map((model) => (
                  <button
                    key={model.name}
                    className={`ai-chat__model-option ${model.name === selectedModel ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedModel(model.name);
                      setShowModelSelect(false);
                    }}
                  >
                    {model.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            className="ai-chat__icon-btn" 
            onClick={clearChat}
            title="Clear chat"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="ai-chat__messages">
        {messages.length === 0 && !streamingMessage && (
          <div className="ai-chat__empty">
            <Bot size={48} className="ai-chat__empty-icon" />
            <h3>Ready to Interview</h3>
            <p>Start the interview to begin the AI-powered technical assessment</p>
            <button onClick={handleStartInterview} className="ai-chat__start-btn">
              Start Interview
            </button>
          </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`ai-chat__message ai-chat__message--${msg.role}`}
          >
            <div className="ai-chat__message-avatar">
              {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
            </div>
            <div className="ai-chat__message-content">
              <div className="ai-chat__message-text">
                {formatMessage(msg.content)}
              </div>
              <div className="ai-chat__message-time">
                {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {streamingMessage && (
          <div className="ai-chat__message ai-chat__message--assistant ai-chat__message--streaming">
            <div className="ai-chat__message-avatar">
              <Bot size={18} />
            </div>
            <div className="ai-chat__message-content">
              <div className="ai-chat__message-text">
                {formatMessage(streamingMessage)}
                <span className="ai-chat__cursor" />
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && !streamingMessage && (
          <div className="ai-chat__message ai-chat__message--assistant">
            <div className="ai-chat__message-avatar">
              <Bot size={18} />
            </div>
            <div className="ai-chat__message-content">
              <div className="ai-chat__typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="ai-chat__error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form className="ai-chat__input-form" onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          className="ai-chat__input"
          placeholder="Type your response..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isLoading || messages.length === 0}
        />
        <button 
          type="submit" 
          className="ai-chat__send-btn"
          disabled={!inputValue.trim() || isLoading || messages.length === 0}
        >
          {isLoading ? <Loader2 size={18} className="ai-chat__spinner" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
}

/**
 * Format message content with basic markdown support
 */
function formatMessage(content) {
  if (!content) return null;

  // Split by code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('```')) {
      // Extract language and code
      const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
      if (match) {
        const [, lang, code] = match;
        return (
          <pre key={index} className="ai-chat__code-block">
            {lang && <div className="ai-chat__code-lang">{lang}</div>}
            <code>{code.trim()}</code>
          </pre>
        );
      }
    }
    
    // Handle inline code
    const withInlineCode = part.split(/(`[^`]+`)/g).map((segment, i) => {
      if (segment.startsWith('`') && segment.endsWith('`')) {
        return <code key={i} className="ai-chat__inline-code">{segment.slice(1, -1)}</code>;
      }
      // Handle bold
      return segment.split(/(\*\*[^*]+\*\*)/g).map((s, j) => {
        if (s.startsWith('**') && s.endsWith('**')) {
          return <strong key={`${i}-${j}`}>{s.slice(2, -2)}</strong>;
        }
        return s;
      });
    });

    return <span key={index}>{withInlineCode}</span>;
  });
}

export default AIChat;
