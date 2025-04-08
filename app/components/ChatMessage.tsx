import React, { useState } from 'react';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read';
  confidence?: 'high' | 'medium' | 'low';
  audioUrl?: string;
}

interface ChatMessageProps {
  message: Message;
  onFeedback?: (messageId: number, isPositive: boolean) => void;
  onForwardToHelpdesk?: (messageId: number) => void;
  onPlayAudio?: (audioUrl: string) => void;
}

export default function ChatMessage({ 
  message, 
  onFeedback, 
  onForwardToHelpdesk,
  onPlayAudio 
}: ChatMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(date);
  };

  const handlePlayAudio = () => {
    if (message.audioUrl && onPlayAudio) {
      setIsPlaying(true);
      onPlayAudio(message.audioUrl);
      // Reset playing state after audio ends
      setTimeout(() => setIsPlaying(false), 1000);
    }
  };

  return (
    <div
      className={`flex items-end space-x-2 ${
        message.isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'
      }`}
    >
      <div className="avatar">
        {message.isUser ? (
          <span className="text-sm">👤</span>
        ) : (
          <span className="text-sm">🤖</span>
        )}
      </div>
      
      <div className="flex flex-col">
        <div
          className={`message-bubble ${
            message.isUser ? 'message-bubble-user' : 'message-bubble-bot'
          }`}
        >
          {!message.isUser && message.confidence && (
            <div className={`confidence-indicator confidence-${message.confidence}`} />
          )}
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        </div>
        
        <div className={`flex items-center ${message.isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="message-time">{formatTime(message.timestamp)}</span>
          {message.isUser && message.status && (
            <span className={`message-status message-status-${message.status}`}>
              {message.status === 'sent' && '✓'}
              {message.status === 'delivered' && '✓✓'}
              {message.status === 'read' && '✓✓'}
            </span>
          )}
        </div>

        {!message.isUser && (
          <div className="message-actions">
            {message.audioUrl && (
              <button 
                className="action-button"
                onClick={handlePlayAudio}
                disabled={isPlaying}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{isPlaying ? 'Playing...' : 'Play'}</span>
              </button>
            )}
            <button className="action-button">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Ask Again</span>
            </button>
            {message.confidence === 'low' && onForwardToHelpdesk && (
              <button 
                className="action-button"
                onClick={() => onForwardToHelpdesk(message.id)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
                <span>Forward to Support</span>
              </button>
            )}
          </div>
        )}

        {!message.isUser && onFeedback && (
          <div className="feedback-buttons">
            <button 
              className="feedback-button"
              onClick={() => onFeedback(message.id, true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </button>
            <button 
              className="feedback-button"
              onClick={() => onFeedback(message.id, false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5 0v2a2 2 0 01-2 2h-2.5" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 