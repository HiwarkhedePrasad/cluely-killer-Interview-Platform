import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  checkOllamaHealth, 
  listModels, 
  createChatSession,
  reviewCode as reviewCodeApi 
} from '../services/ollama';

/**
 * React hook for Ollama chat functionality
 * Manages chat state, streaming responses, and conversation history
 */
export function useOllama(defaultModel = 'llama3') {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [error, setError] = useState(null);
  
  // Chat session reference
  const sessionRef = useRef(null);

  // Check Ollama connection on mount
  useEffect(() => {
    async function checkConnection() {
      setIsChecking(true);
      try {
        const healthy = await checkOllamaHealth();
        setIsConnected(healthy);
        
        if (healthy) {
          const models = await listModels();
          setAvailableModels(models);
          
          // Select first available model if default not found
          if (models.length > 0) {
            const hasDefault = models.some(m => m.name === defaultModel || m.name.startsWith(defaultModel));
            if (!hasDefault) {
              setSelectedModel(models[0].name);
            }
          }
        }
      } catch (err) {
        setIsConnected(false);
        setError('Failed to connect to Ollama');
      } finally {
        setIsChecking(false);
      }
    }
    
    checkConnection();
  }, [defaultModel]);

  // Initialize/reset chat session when model changes
  useEffect(() => {
    if (isConnected && selectedModel) {
      sessionRef.current = createChatSession(selectedModel);
      setMessages([]);
      setStreamingMessage('');
      setError(null);
    }
  }, [isConnected, selectedModel]);

  /**
   * Send a message to the AI
   */
  const sendMessage = useCallback(async (content, options = {}) => {
    if (!sessionRef.current || !content.trim()) return;
    
    const { stream = true } = options;
    
    // Add user message to UI immediately
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingMessage('');
    setError(null);
    
    try {
      let response;
      
      if (stream) {
        response = await sessionRef.current.sendMessage(content, {
          stream: true,
          onToken: (token, fullText) => {
            setStreamingMessage(fullText);
          },
        });
      } else {
        response = await sessionRef.current.sendMessage(content, { stream: false });
      }
      
      // Add assistant message
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setStreamingMessage('');
      
      return response;
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err.message || 'Failed to get response from AI');
      
      // Remove the failed user message
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Set context for the interview (current question, code, etc.)
   */
  const setContext = useCallback((context) => {
    if (sessionRef.current) {
      sessionRef.current.setContext(context);
    }
  }, []);

  /**
   * Clear chat history and start fresh
   */
  const clearChat = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.clearHistory();
    }
    setMessages([]);
    setStreamingMessage('');
    setError(null);
  }, []);

  /**
   * Review code submission
   */
  const reviewCode = useCallback(async ({ code, language, question, testResults }) => {
    if (!selectedModel) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const review = await reviewCodeApi({
        model: selectedModel,
        code,
        language,
        question,
        testResults,
      });
      
      return review;
    } catch (err) {
      console.error('Failed to review code:', err);
      setError(err.message || 'Failed to get code review');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [selectedModel]);

  /**
   * Retry connection to Ollama
   */
  const retryConnection = useCallback(async () => {
    setIsChecking(true);
    setError(null);
    
    try {
      const healthy = await checkOllamaHealth();
      setIsConnected(healthy);
      
      if (healthy) {
        const models = await listModels();
        setAvailableModels(models);
      } else {
        setError('Ollama server is not running');
      }
    } catch (err) {
      setIsConnected(false);
      setError('Failed to connect to Ollama');
    } finally {
      setIsChecking(false);
    }
  }, []);

  /**
   * Export conversation for review/saving
   */
  const exportConversation = useCallback(() => {
    return messages.map(m => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp?.toISOString(),
    }));
  }, [messages]);

  /**
   * Start interview with introduction
   */
  const startInterview = useCallback(async (candidateName = 'candidate') => {
    const intro = `Hello! I'm your AI interviewer today. Welcome to this technical interview, ${candidateName}. 

I'll be asking you some coding questions and we'll work through problems together. Feel free to think out loud and ask clarifying questions.

Before we begin with the coding challenges, could you briefly introduce yourself and tell me about your programming background?`;
    
    const introMessage = {
      id: Date.now(),
      role: 'assistant',
      content: intro,
      timestamp: new Date(),
    };
    
    setMessages([introMessage]);
    
    // Add to session history
    if (sessionRef.current) {
      sessionRef.current.getMessages().push({ role: 'assistant', content: intro });
    }
    
    return intro;
  }, []);

  return {
    // Connection state
    isConnected,
    isChecking,
    availableModels,
    selectedModel,
    setSelectedModel,
    retryConnection,
    
    // Chat state
    messages,
    isLoading,
    streamingMessage,
    error,
    
    // Actions
    sendMessage,
    setContext,
    clearChat,
    reviewCode,
    exportConversation,
    startInterview,
  };
}

export default useOllama;
