'use client';

import React, { useState, useEffect, useRef } from 'react';
import ChatInput from './components/ChatInput';
import { useTheme } from 'next-themes';
import { useLocalStorage } from 'react-use';
import { SunIcon, MoonIcon, UserIcon, ArrowRightOnRectangleIcon, ArrowLeftOnRectangleIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NotificationBell from './components/NotificationBell';
import HelpDeskResponsePanel from './components/HelpDeskResponsePanel';

interface Message {
  id: string;
  content: string;
  type: 'text' | 'image' | 'file';
  sender: 'user' | 'bot';
  timestamp: Date;
  confidence?: number;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
}

interface User {
  name: string;
  email: string;
}

interface Notification {
  id: string;
  question: string;
  answer: string;
  answeredAt: string;
  seen: boolean;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [hasUserMessage, setHasUserMessage] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showNotifications, setShowNotifications] = useState(true);
  const [helpDeskPanelOpen, setHelpDeskPanelOpen] = useState(false);
  const [helpDeskResponses, setHelpDeskResponses] = useState<Notification[]>([]);
  const [activeHelpDeskResponse, setActiveHelpDeskResponse] = useState<Notification | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Predefined FAQ queries
  const faqSuggestions = [
    "How to track my orders?",
    "Is my card details secure?",
    "What is your return policy?",
    "What payment methods do you accept?",
  ];

  useEffect(() => {
    setMounted(true);
    // Initialize welcome message if there are no messages
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        content: "👋 Welcome to the Instant FAQ Assist! I'm here to help you with any questions about our products and services. Feel free to ask anything or try one of the suggested questions below.",
        type: 'text',
        sender: 'bot',
        timestamp: new Date(),
        confidence: 1,
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      content: message,
      type: 'text',
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setHasUserMessage(true);
    setIsTyping(true);

    try {
      const response = await fetch('/api/faq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from FAQ API');
      }

      const data = await response.json();
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.answer,
        type: 'text',
        sender: 'bot',
        timestamp: new Date(),
        confidence: data.confidence,
      };

      const updatedMessages = [...messages, newMessage, botResponse];
      setMessages(updatedMessages);
      setIsTyping(false);
      setInputMessage('');

      // Save or update chat session
      if (currentSessionId) {
        const response = await fetch('/api/chat/sessions', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: currentSessionId,
            title: chatSessions.find(s => s.id === currentSessionId)?.title || 'New Chat',
            messages: updatedMessages,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update chat session');
        }
      } else {
        const firstUserMessage = updatedMessages.find(msg => msg.sender === 'user');
        const response = await fetch('/api/chat/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: firstUserMessage?.content.slice(0, 50) + '...' || 'New Chat',
            messages: updatedMessages,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create chat session');
        }

        const data = await response.json();
        setCurrentSessionId(data.session.id);
        // Update chat sessions without creating duplicates
        setChatSessions(prev => {
          // Check if a session with the same title already exists
          const existingSession = prev.find(s => s.title === data.session.title);
          if (existingSession) {
            // Update existing session
            return prev.map(s => 
              s.id === existingSession.id ? data.session : s
            );
          }
          // Add new session
          return [data.session, ...prev];
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm having trouble processing your request at the moment. Please try again later or rephrase your question.",
        type: 'text',
        sender: 'bot',
        timestamp: new Date(),
        confidence: 0,
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceInput = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    if (!isRecording) {
      try {
        // Check if browser supports speech recognition
        if (!window.SpeechRecognition && !(window as any).webkitSpeechRecognition) {
          alert('Speech recognition is not supported in your browser. Please try Chrome or Edge.');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];

        // Initialize speech recognition
        const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        let finalTranscript = '';

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }
          if (interimTranscript) {
            console.log('Interim transcript:', interimTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          stopRecording();
        };

        recognition.onend = () => {
          if (finalTranscript.trim()) {
            handleSendMessage(finalTranscript.trim());
          }
          stopRecording();
        };

        const stopRecording = () => {
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
          if (recorder && recorder.state !== 'inactive') {
            recorder.stop();
          }
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          setIsRecording(false);
          setMediaRecorder(null);
        };

        // Start both recording and recognition
        recorder.start();
        recognition.start();
        setMediaRecorder(recorder);
        setIsRecording(true);

        // Stop recording after 30 seconds or when manually stopped
        setTimeout(() => {
          if (isRecording) {
            stopRecording();
          }
        }, 30000);

      } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Error accessing microphone. Please ensure you have granted microphone permissions.');
      }
    } else {
      // Stop recording when clicking again
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaRecorder) {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        setMediaRecorder(null);
      }
      setIsRecording(false);
    }
  };

  const handlePlayAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play().catch(error => {
      console.error('Error playing audio:', error);
    });
  };

  const handleSuggestionSelect = (suggestion: string) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    handleSendMessage(suggestion);
  };

  const startNewChat = async () => {
    setMessages([]);
    setCurrentSessionId(null);
    setIsHistoryOpen(false);
    setHasUserMessage(false);
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      content: "👋 Welcome to the Instant FAQ Assist! I'm here to help you with any questions about our products and services. Feel free to ask anything or try one of the suggested questions below.",
      type: 'text',
      sender: 'bot',
      timestamp: new Date(),
      confidence: 1,
    };
    setMessages([welcomeMessage]);
  };

  const loadChatSession = async (sessionId: string) => {
    try {
      // Fetch the most up-to-date session from the server
      const response = await fetch(`/api/chat/sessions/${sessionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load chat session');
      }
      
      const sessionData = await response.json();
      const session = {
        ...sessionData.session,
        id: sessionData.session._id || sessionData.session.id
      };
      
      // Ensure all message timestamps are properly converted to Date objects
      const messagesWithDates = session.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      
      setMessages(messagesWithDates);
      setCurrentSessionId(sessionId);
      setIsHistoryOpen(false);
      setHasUserMessage(true);
      
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (error) {
      // Fallback to local data if server fetch fails
      console.error('Error loading chat session from server, trying local data:', error);
      
      const session = chatSessions.find(s => s.id === sessionId);
      if (session) {
        const messagesWithDates = session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        
        setMessages(messagesWithDates);
        setCurrentSessionId(sessionId);
        setIsHistoryOpen(false);
        setHasUserMessage(true);
        
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      } else {
        console.error('Session not found in local data');
      alert('Failed to load chat session. Please try again.');
      }
    }
  };

  const deleteChatSession = async (sessionId: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    try {
      // If triggered by an event, prevent propagation to avoid closing history
      if (e) {
        e.stopPropagation();
      }
      
      const response = await fetch(`/api/chat/sessions?sessionId=${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete chat session');
      }

      setChatSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        startNewChat();
      }
    } catch (error) {
      console.error('Error deleting chat session:', error);
      alert('Failed to delete chat session. Please try again.');
    }
  };

  // Add cleanup effect for speech recognition
  useEffect(() => {
    return () => {
      if (mediaRecorder) {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mediaRecorder]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputMessage);
      setInputMessage('');
    }
  };

  const handleSendClick = () => {
    if (inputMessage.trim()) {
      handleSendMessage(inputMessage);
      setInputMessage('');
    }
  };

  // Add function to handle title editing
  const handleEditTitle = (sessionId: string, currentTitle: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    // If triggered by an event, prevent propagation to avoid closing history
    if (e) {
      e.stopPropagation();
    }
    
    setEditingSessionId(sessionId);
    setEditingTitle(currentTitle);
  };

  const handleSaveTitle = (sessionId: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    // If triggered by an event, prevent propagation to avoid closing history
    if (e) {
      e.stopPropagation();
    }
    
    if (editingTitle.trim()) {
      const updatedSessions = chatSessions?.map(s => 
        s.id === sessionId 
          ? { ...s, title: editingTitle.trim() }
          : s
      );
      setChatSessions(updatedSessions);
    }
    setEditingSessionId(null);
    setEditingTitle('');
  };

  const handleLogout = async () => {
    try {
      // Clear user token
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      // Clear helpdesk token too just in case
      await fetch('/api/helpdesk/logout', {
        method: 'POST',
      });
      
      if (response.ok) {
        // Force refresh to ensure cookie is cleared, but go to base page
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Check for direct login and initialize data
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        // Check if user is authenticated
        const response = await fetch('/api/auth/user');
        if (!response.ok) {
          // Handle the case when not logged in
          setIsLoading(false);
          return;
        }
        
        const data = await response.json();
        setUser(data.user);
        
        // Check if this is a direct login
        const isDirectLogin = document.cookie.includes('direct_login=true');
        if (isDirectLogin) {
          // If this is a direct login, clear the cookie to prevent it affecting future page loads
          document.cookie = 'direct_login=; max-age=0; path=/;';
        }
        
        await loadChatSessions();
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/user');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme, mounted]);

  // Add this effect to load chat sessions when user is authenticated
  useEffect(() => {
    if (user) {
      loadChatSessions();
    }
  }, [user]);

  const loadChatSessions = async () => {
    try {
      setIsLoadingSessions(true);
      // Add a timestamp parameter to avoid caching issues
      const response = await fetch(`/api/chat/sessions?t=${Date.now()}`);
      
      if (!response.ok) {
        throw new Error('Failed to load chat sessions');
      }

      const data = await response.json();
      setChatSessions(data.sessions.map((session: any) => ({
        ...session,
        id: session._id,
        lastUpdated: new Date(session.lastUpdated),
      })));
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      alert('Failed to load chat sessions. Please refresh the page.');
    } finally {
      setIsLoadingSessions(false);
    }
  };

  // Replace the handleNotificationClick function with this one
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark notification as read
      await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticketId: notification.id }),
      });
      
      // Set active response and open panel
      setActiveHelpDeskResponse(notification);
      
      // Fetch all helpdesk responses if not loaded yet
      if (helpDeskResponses.length === 0) {
        const response = await fetch('/api/user/notifications');
        if (response.ok) {
          const data = await response.json();
          setHelpDeskResponses(data.tickets);
        }
      }
      
      setHelpDeskPanelOpen(true);
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  // Add a function to close the helpdesk panel
  const closeHelpDeskPanel = () => {
    setHelpDeskPanelOpen(false);
  };
  
  // Add this useEffect to fetch helpdesk responses
  useEffect(() => {
    if (user) {
      const fetchHelpDeskResponses = async () => {
        try {
          const response = await fetch('/api/user/notifications');
          if (response.ok) {
            const data = await response.json();
            setHelpDeskResponses(data.tickets);
          }
        } catch (error) {
          console.error('Error fetching helpdesk responses:', error);
        }
      };
      
      fetchHelpDeskResponses();
      // Refresh every 2 minutes
      const interval = setInterval(fetchHelpDeskResponses, 120000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Change the chat history toggle functionality
  const toggleChatHistory = () => {
    setIsHistoryOpen(!isHistoryOpen);
  };

  // Add a useEffect for click-outside detection
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    
    // Add event listener if menu is open
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // Function to check if this is a direct login
  const isDirectLogin = typeof document !== 'undefined' ? 
    document.cookie.includes('direct_login=true') : false;

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-t-purple-500 border-gray-600/30 rounded-full animate-spin mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!mounted) return null;

  return (
    <main className="min-h-screen flex" style={{ background: `rgb(var(--background-start-rgb))` }}>
      {/* Show login prompt modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Login Required</h2>
            <p className="text-gray-300 mb-6">Please login or sign up to start chatting with our AI assistant.</p>
            <div className="flex flex-col gap-4">
              <Link
                href="/auth/login"
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[#8a2be2] hover:bg-[#9370db] text-white transition-all duration-200 shadow-lg shadow-[#8a2be2]/20 hover:shadow-[#8a2be2]/40"
              >
                <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                <span>Login</span>
              </Link>
              <Link
                href="/auth/signup"
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[#8a2be2]/10 hover:bg-[#8a2be2]/20 text-white transition-all duration-200 border border-[#8a2be2]/20 hover:border-[#8a2be2]/30"
              >
                <UserIcon className="w-5 h-5" />
                <span>Sign Up</span>
              </Link>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Show landing page for non-authenticated users */}
      {!user ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <h1 className="text-4xl font-bold mb-6">
            Welcome to <span className="text-[#9370db]">Instant</span> FAQ Assist
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl">
            Get instant answers to your questions about our products and services. Our AI assistant is here to help you 24/7.
          </p>
          <div className="flex flex-col gap-4 w-full max-w-md">
            <Link
              href="/auth/login"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#8a2be2] hover:bg-[#9370db] text-white transition-all duration-200 shadow-lg shadow-[#8a2be2]/20 hover:shadow-[#8a2be2]/40"
            >
              <ArrowLeftOnRectangleIcon className="w-5 h-5" />
              <span>Login</span>
            </Link>
            <Link
              href="/auth/signup"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#8a2be2]/10 hover:bg-[#8a2be2]/20 text-white transition-all duration-200 border border-[#8a2be2]/20 hover:border-[#8a2be2]/30"
            >
              <UserIcon className="w-5 h-5" />
              <span>Sign Up</span>
            </Link>
          </div>
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
              {faqSuggestions.map((query, index) => (
                <button
                  key={index}
                  onClick={() => setShowLoginPrompt(true)}
                  className="p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-700 transition-all duration-200 text-left"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Chat History Toggle Button - Always show */}
            <button
            onClick={toggleChatHistory}
              className="chat-history-toggle"
            aria-label="Toggle chat history"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
              fill="none"
                stroke="currentColor"
              strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <line x1="9" y1="10" x2="16" y2="10" />
              <line x1="9" y1="14" x2="14" y2="14" />
              </svg>
            </button>

          {/* Chat History Overlay */}
          <div 
            className={`chat-history-overlay ${isHistoryOpen ? 'active' : ''}`} 
            onClick={() => setIsHistoryOpen(false)}
          />

          {/* Chat History Sidebar */}
          <div className={`chat-history-sidebar ${isHistoryOpen ? 'open' : ''}`}>
            <div className="chat-history-header">
              <h2 className="chat-history-title">Chat History</h2>
                <button
                onClick={() => setIsHistoryOpen(false)}
                className="text-gray-400 hover:text-white focus:outline-none"
                >
                <XMarkIcon className="h-6 w-6" />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
                <button
                onClick={startNewChat}
                className="w-full mb-4 p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg text-white flex items-center justify-center gap-2 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    d="M12 4v16m8-8H4"
                    />
                  </svg>
                <span>New Chat</span>
                </button>
              
            <div className="chat-history-list">
              {isLoadingSessions ? (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
                </div>
              ) : chatSessions.length === 0 ? (
                <div className="text-center text-gray-500 p-4">
                  No chat history yet
                </div>
              ) : (
                chatSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`chat-history-item group ${session.id === currentSessionId ? 'active' : ''}`}
                    onClick={() => loadChatSession(session.id)}
                  >
                    <div className="chat-history-item-header">
                      {editingSessionId === session.id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            className="flex-1 bg-transparent border-b border-gray-600 focus:border-blue-500 outline-none px-1"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                  handleSaveTitle(session.id, e);
                              }
                            }}
                              onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            onClick={(e) => {
                                handleSaveTitle(session.id, e);
                            }}
                            className="p-1 rounded hover:bg-green-500/20 text-green-400"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSessionId(null);
                              setEditingTitle('');
                            }}
                            className="p-1 rounded hover:bg-red-500/20 text-red-400"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="chat-history-item-title">{session.title}</span>
                          <button
                            onClick={(e) => {
                                handleEditTitle(session.id, session.title, e);
                            }}
                            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-700/50 transition-all duration-200"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                        </>
                      )}
                      <span className="chat-history-item-time">
                        {new Date(session.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="chat-history-item-preview">
                      {(() => {
                        const firstUserMessage = session.messages.find(msg => msg.sender === 'user');
                        const firstBotResponse = session.messages.find(msg => msg.sender === 'bot' && msg.id !== session.messages[0].id);
                        if (firstUserMessage && firstBotResponse) {
                          return `${firstUserMessage.content.slice(0, 50)}${firstUserMessage.content.length > 50 ? '...' : ''} → ${firstBotResponse.content.slice(0, 50)}${firstBotResponse.content.length > 50 ? '...' : ''}`;
                        }
                        return 'No messages';
                      })()}
                    </p>
                    <div className="chat-history-item-actions">
                      <button
                        onClick={(e) => {
                            deleteChatSession(session.id, e);
                        }}
                        className="chat-history-item-delete"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className={`flex-1 flex flex-col`}>
            <div className={`header`}>
              <div className="header-content">
                <div className="header-left">
                <button
                  onClick={startNewChat}
                  className="text-xl font-bold text-[#f1f7fe] flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                    <span className="text-[#9370db]">Instant</span> FAQ Assist
                  <span className="text-2xl"></span>
                </button>
                </div>

                {/* User Authentication Section - moved fully to the right */}
                <div className="header-right">
                  {isLoading ? (
                    <div className="w-8 h-8 rounded-full bg-gray-700/50 animate-pulse" />
                  ) : user ? (
                    <>
                      {showNotifications && (
                        <NotificationBell onNotificationClick={handleNotificationClick} />
                      )}
                      <div 
                        ref={userMenuRef}
                        className="relative"
                      >
                      <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                          className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-200"
                          aria-label="User menu"
                      >
                          {user.name.split(' ').map(n => n.charAt(0).toUpperCase()).join('')}
                      </button>
                      
                      {showUserMenu && (
                          <div className="absolute right-0 mt-2 w-64 rounded-lg bg-gray-800/95 backdrop-blur-xl border border-gray-700/50 shadow-xl overflow-hidden z-50">
                            <div className="p-4 border-b border-gray-700/50 flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-lg font-medium">
                                {user.name.split(' ').map(n => n.charAt(0).toUpperCase()).join('')}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                              </div>
                            </div>
                            <div className="py-1">
                          <button
                            onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors"
                          >
                            <ArrowRightOnRectangleIcon className="w-5 h-5" />
                                <span className="font-medium">Sign out</span>
                          </button>
                            </div>
                        </div>
                      )}
                    </div>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/auth/login"
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#8a2be2]/10 hover:bg-[#8a2be2]/20 text-white transition-all duration-200 border border-[#8a2be2]/20 hover:border-[#8a2be2]/30"
                      >
                        <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                        <span>Login</span>
                      </Link>
                      <Link
                        href="/auth/signup"
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#8a2be2] hover:bg-[#9370db] text-white transition-all duration-200 shadow-lg shadow-[#8a2be2]/20 hover:shadow-[#8a2be2]/40"
                      >
                        <UserIcon className="w-5 h-5" />
                        <span>Sign Up</span>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className={`chat-container`}>
              <div 
                className={`chat-messages-container ${!hasUserMessage ? 'flex flex-col justify-center min-h-[calc(100vh-12rem)]' : ''}`} 
                ref={chatContainerRef}
              >
                <div className={`${!hasUserMessage ? 'flex flex-col items-center justify-center w-full' : ''}`}>
                  {messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`message-wrapper ${
                        message.sender === 'user' ? 'message-wrapper-user' : 'message-wrapper-bot'
                      } ${!hasUserMessage ? 'w-full max-w-2xl mx-auto' : ''} ${index > 0 ? 'mt-6' : ''}`}
                    >
                      <div className="message-icon-wrapper">
                        {message.sender === 'user' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className={`message-bubble ${
                        message.sender === 'user' ? 'message-bubble-user' : 'message-bubble-bot'
                      }`}>
                        <div className="message-content">{message.content}</div>
                        <div className="message-time">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="typing-indicator mt-6">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  )}
                  {messages.length === 1 && (
                    <div className="faq-suggestions mt-8">
                      <div className="faq-suggestions-title text-center">Frequently Asked Questions:</div>
                      <div className="faq-suggestions-grid">
                        {faqSuggestions.map((query, index) => (
                          <button
                            key={index}
                            onClick={() => handleSendMessage(query)}
                            className="faq-suggestion-item"
                          >
                            {query}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={`input-area`}>
              <div className="input-container">
                <div className="input-wrapper">
                  <textarea
                    className="input-field"
                    placeholder="Type your message..."
                    value={inputMessage}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    rows={1}
                  />
                  <div className="input-actions">
                    <button
                      onClick={handleVoiceInput}
                      className={`voice-button ${isRecording ? 'recording' : ''}`}
                    >
                      {isRecording ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="button-icon"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="button-icon"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                          />
                        </svg>
                      )}
                    </button>
                    <button 
                      className="send-button"
                      onClick={handleSendClick}
                      disabled={!inputMessage.trim()}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="button-icon"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* HelpDesk Response Panel Overlay */}
      <div 
        className={`helpdesk-panel-overlay ${helpDeskPanelOpen ? 'active' : ''}`} 
        onClick={closeHelpDeskPanel}
      />
      
      {/* HelpDesk Response Panel */}
      <HelpDeskResponsePanel 
        isOpen={helpDeskPanelOpen}
        onClose={closeHelpDeskPanel}
        activeResponse={activeHelpDeskResponse}
        allResponses={helpDeskResponses}
        onSelectResponse={setActiveHelpDeskResponse}
      />
    </main>
  );
}