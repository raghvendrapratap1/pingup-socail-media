import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, RefreshCw, AlertCircle, CheckCircle, Loader2, Image as ImageIcon, X } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const AIAssistant = () => {
  // Load messages from localStorage on component mount
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem('ai-chat-messages');
    if (savedMessages) {
      try {
        return JSON.parse(savedMessages);
      } catch (error) {
        console.error('Error parsing saved messages:', error);
      }
    }
    return [
      {
        id: 1,
        role: 'assistant',
        content: 'Hi! 👋 I\'m your AI. How can I help?',
        timestamp: new Date().toISOString()
      }
    ];
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [inputError, setInputError] = useState('');
  const [characterCount, setCharacterCount] = useState(0);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [attachedImage, setAttachedImage] = useState(null); // data URL
  const [attachedName, setAttachedName] = useState('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    localStorage.setItem('ai-chat-messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    setCharacterCount(inputMessage.length);
    if (inputMessage.length > 1000) {
      setInputError('Too long (max 1000 chars).');
    } else if (inputMessage.trim().length === 0) {
      setInputError('');
    } else if (inputMessage.length < 3) {
      setInputError('Enter at least 3 chars.');
    } else {
      setInputError('');
    }
  }, [inputMessage]);

  const validateInput = (message) => {
    const trimmed = message.trim();
    
    if (trimmed.length === 0) {
      return { isValid: false, error: 'Type a message.' };
    }
    
    if (trimmed.length < 3) {
      return { isValid: false, error: 'Enter at least 3 chars.' };
    }
    
    if (trimmed.length > 1000) {
      return { isValid: false, error: 'Too long (max 1000 chars).' };
    }
    
    // Check for spam patterns
    const spamPatterns = [
      /(.)\1{10,}/, // Repeated characters
      /(.)\1{5,}/g, // Multiple repeated characters
      /[A-Z]{20,}/, // Too many caps
      /[!@#$%^&*()_+={}[\]|\\:";'<>?,./]{10,}/ // Too many special characters
    ];
    
    for (const pattern of spamPatterns) {
      if (pattern.test(trimmed)) {
        return { isValid: false, error: 'Too much repetition/special characters.' };
      }
    }
    
    return { isValid: true, error: '' };
  };

  const enhancePrompt = (prompt) => {
    const trimmed = prompt.trim();
    
    let enhancedPrompt = trimmed;
    
    // If asking for writing help
    if (trimmed.toLowerCase().includes('essay') || trimmed.toLowerCase().includes('write') || trimmed.toLowerCase().includes('article')) {
      enhancedPrompt = `Writing help: ${trimmed}. Keep it clear and structured.`;
    }
    
    // If asking for coding help
    else if (trimmed.toLowerCase().includes('code') || trimmed.toLowerCase().includes('programming') || trimmed.toLowerCase().includes('function')) {
      enhancedPrompt = `Coding help: ${trimmed}. Provide working code with brief notes.`;
    }
    
    // If asking for explanations
    else if (trimmed.toLowerCase().includes('explain') || trimmed.toLowerCase().includes('what is') || trimmed.toLowerCase().includes('how does')) {
      enhancedPrompt = `Explain simply: ${trimmed}. Use a short example.`;
    }
    
    // If asking for creative content
    else if (trimmed.toLowerCase().includes('story') || trimmed.toLowerCase().includes('creative') || trimmed.toLowerCase().includes('idea')) {
      enhancedPrompt = `Creative task: ${trimmed}. Make it engaging.`;
    }
    
    // If asking for problem-solving
    else if (trimmed.toLowerCase().includes('problem') || trimmed.toLowerCase().includes('issue') || trimmed.toLowerCase().includes('help')) {
      enhancedPrompt = `Help solve: ${trimmed}. Give clear steps.`;
    }
    
    // General enhancement for better readability
    else {
      enhancedPrompt = `Answer clearly: ${trimmed}. Keep it concise.`;
    }
    
    return enhancedPrompt;
  };

  const onPickImage = () => {
    if (isLoading) return;
    fileInputRef.current?.click();
  };

  const compressImage = (file, maxWidth = 1024, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Only PNG, JPG, WEBP allowed');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Max 10MB image');
      return;
    }
    
    try {
      // Compress image to reduce size
      const compressedDataUrl = await compressImage(file);
      setAttachedImage(compressedDataUrl);
      setAttachedName(file.name);
    } catch (error) {
      console.error('Image compression error:', error);
      toast.error('Failed to process image');
    }
    
    // reset input so same file can be selected again
    e.target.value = '';
  };

  const removeAttachment = () => {
    setAttachedImage(null);
    setAttachedName('');
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const validation = validateInput(inputMessage);
    if (!validation.isValid) {
      toast.error(validation.error);
      setInputError(validation.error);
      return;
    }

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setInputError('');
    setIsLoading(true);

    try {
      
      // Enhance the prompt for better AI responses
      const enhancedPrompt = enhancePrompt(inputMessage);
      
      const conversationMessages = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.role === 'user' && msg.id === userMessage.id ? enhancedPrompt : msg.content
      }));
      
      const response = await api.post('/api/gemini/chat', {
        messages: conversationMessages,
        images: attachedImage ? [attachedImage] : [],
        maxTokens: 1000,
        temperature: 0.7
      });

      if (response.data.success) {
        const aiMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: response.data.data.response,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
        setIsConnected(true);
        removeAttachment();
      } else {
        throw new Error(response.data.message || 'Failed');
      }
    } catch (error) {
      console.error('AI API Error:', error);
      
      let errorMessage = 'Connection issue. Try again.';
      
      if (error.response?.status === 429) {
        errorMessage = 'Too many requests. Wait a bit.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Try again.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid request.';
      }
      
      toast.error(errorMessage);
      
      const aiErrorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Sorry—technical issue. ${errorMessage}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiErrorMessage]);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = async () => {
    const result = await Swal.fire({
      title: 'Clear Chat?',
      text: "This will delete all your chat history. You won't be able to undo this action!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, clear it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      const newMessages = [
        {
          id: Date.now(),
          role: 'assistant',
          content: 'Hi! 👋 I\'m your AI. How can I help?',
          timestamp: new Date().toISOString()
        }
      ];
      setMessages(newMessages);
      setInputMessage('');
      setInputError('');
      removeAttachment();
      // Clear from localStorage
      localStorage.setItem('ai-chat-messages', JSON.stringify(newMessages));
      toast.success('Chat cleared!');
    }
  };

  const getMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
              <p className="text-gray-600 flex items-center gap-2">
                <span>Smart help, fast</span>
                {isConnected ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
              </p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-2xl px-4 py-3 shadow-sm ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <div className="flex-1">
                  <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                  <div className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-indigo-100' : 'text-gray-500'
                  }`}>
                    <span>{getMessageTime(message.timestamp)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                  <span className="text-gray-600">Thinking…</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-6 shadow-lg">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <div className="relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask anything…"
                  className={`w-full p-4 border rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                    inputError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  rows="3"
                  disabled={isLoading}
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                  {characterCount}/1000
                </div>
              </div>
              {inputError && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {inputError}
                </p>
              )}
              <div className="mt-2 text-xs text-gray-500">
                💡 <strong>Tip:</strong> Be specific for better answers.
              </div>
              {attachedImage && (
                <div className="mt-3 flex items-center gap-3">
                  <img src={attachedImage} alt="attachment" className="w-12 h-12 rounded-md object-cover border" />
                  <span className="text-sm text-gray-600 truncate max-w-[200px]">{attachedName}</span>
                  <button onClick={removeAttachment} className="text-xs text-gray-500 hover:text-gray-700 inline-flex items-center gap-1">
                    <X className="w-3 h-3" /> Remove
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading || !!inputError}
              className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send
            </button>
            <button
              type="button"
              onClick={onPickImage}
              disabled={isLoading}
              className="p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              title="Attach image"
            >
              <ImageIcon className="w-5 h-5 text-gray-600" />
            </button>
            <input ref={fileInputRef} onChange={onFileChange} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;