import React, { useState, useRef } from 'react';
import { XMarkIcon, PaperClipIcon, CheckCircleIcon, XCircleIcon, ChatBubbleLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Ticket, TicketStatus, getStatusBadgeClass } from '../types/Ticket';

interface TicketPopupProps {
  ticket: Ticket | null;
  onClose: () => void;
  onReject: () => void;
  onDelete: () => void;
  onSubmitAnswer: (content: string, files: File[]) => void;
}

// Predefined response templates
const responseTemplates = [
  {
    title: "Thank You",
    content: "Thank you for reaching out to us. We appreciate your query and we're happy to help."
  },
  {
    title: "More Information Needed",
    content: "Thank you for your question. To better assist you, could you please provide more information about your issue?"
  },
  {
    title: "Problem Resolved",
    content: "I'm glad to inform you that your issue has been resolved. Please let us know if you need any further assistance."
  },
  {
    title: "Apology",
    content: "We apologize for the inconvenience caused. We understand your frustration and we're working to resolve this issue as quickly as possible."
  },
  {
    title: "Follow-up",
    content: "I'm following up on your recent support request. Have you had a chance to try the solution we suggested?"
  }
];

export default function TicketPopup({ ticket, onClose, onReject, onDelete, onSubmitAnswer }: TicketPopupProps) {
  const [answerContent, setAnswerContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!ticket) return null;

  const handleAttachFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answerContent.trim()) {
      onSubmitAnswer(answerContent, attachments);
    }
  };

  const applyTemplate = (content: string) => {
    setAnswerContent(prev => {
      if (prev.trim() === '') {
        return content;
      } else {
        return prev + '\n\n' + content;
      }
    });
    setShowTemplates(false);
  };

  const toggleTemplates = () => {
    setShowTemplates(!showTemplates);
  };

  const handleDeleteClick = () => {
    if (showDeleteConfirm) {
      onDelete();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white truncate max-w-xs">
            {ticket.question}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700/50"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* User Question */}
          <div className="mb-6 bg-gray-700/30 p-4 rounded-xl border border-gray-600/50">
            <div className="flex items-start gap-3">
              <div className="bg-purple-500/20 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{ticket.userEmail}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(ticket.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-gray-300">{ticket.question}</p>
              </div>
            </div>
          </div>

          {/* Previous Responses */}
          {ticket.responses && ticket.responses.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-400 mb-3">Previous Responses</h4>
              <div className="space-y-4">
                {ticket.responses.map((response, index) => (
                  <div key={index} className="bg-gray-700/30 p-4 rounded-xl border border-gray-600/50">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500/20 p-2 rounded-full">
                        <ChatBubbleLeftIcon className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">Support Team</span>
                          <span className="text-xs text-gray-400">
                            {new Date(response.respondedAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-2 text-gray-300 whitespace-pre-wrap">{response.content}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Response Form */}
          {ticket.status !== 'answered' && (
            <>
              <h4 className="text-sm font-medium text-gray-400 mb-3">Your Response</h4>
              <form onSubmit={handleSubmit}>
                {/* Predefined Templates Button and Panel */}
                <div className="mb-4 relative">
                  <button
                    type="button"
                    onClick={toggleTemplates}
                    className="text-sm px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    {showTemplates ? 'Hide Templates' : 'Show Response Templates'}
                  </button>
                  
                  {showTemplates && (
                    <div className="absolute z-10 mt-2 w-full bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-3 animate-scale-in">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="text-sm font-medium text-white">Quick Response Templates</h5>
                        <button 
                          type="button" 
                          onClick={() => setShowTemplates(false)}
                          className="text-gray-400 hover:text-white"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
                        {responseTemplates.map((template, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => applyTemplate(template.content)}
                            className="text-left p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg border border-gray-600/50 transition-colors text-sm"
                          >
                            <p className="font-medium text-white mb-1">{template.title}</p>
                            <p className="text-gray-400 line-clamp-2">{template.content}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <textarea
                  value={answerContent}
                  onChange={(e) => setAnswerContent(e.target.value)}
                  placeholder="Type your response here..."
                  className="w-full bg-gray-700/50 text-white rounded-lg p-4 border border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent resize-y min-h-[160px]"
                  required
                />

                {/* Attachments */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-gray-400 flex items-center gap-2">
                      <PaperClipIcon className="w-4 h-4" />
                      <span>Attachments ({attachments.length})</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAttachFile}
                      className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Add File
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      multiple
                    />
                  </div>

                  {attachments.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-700/30 p-2 rounded-lg border border-gray-600/50">
                          <div className="flex items-center gap-2 text-sm text-gray-300 truncate">
                            <PaperClipIcon className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{file.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-between">
          <div className="flex gap-2">
            <button
              onClick={onReject}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors flex items-center gap-2"
              title="Mark as rejected"
            >
              <XCircleIcon className="w-5 h-5" />
              <span>Reject</span>
            </button>
            
            <button
              onClick={handleDeleteClick}
              className={`px-4 py-2 ${showDeleteConfirm ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300'} rounded-lg transition-colors flex items-center gap-2`}
              title="Permanently delete ticket from the system"
            >
              <TrashIcon className="w-5 h-5" />
              <span>{showDeleteConfirm ? 'Confirm Delete' : 'Delete'}</span>
            </button>
          </div>
          
          {ticket.status !== 'answered' && (
            <button
              onClick={handleSubmit}
              disabled={!answerContent.trim()}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircleIcon className="w-5 h-5" />
              <span>Submit Answer</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Add animation to globals.css
// @keyframes scale-in {
//   0% { transform: scale(0.95); opacity: 0; }
//   100% { transform: scale(1); opacity: 1; }
// }
// .animate-scale-in {
//   animation: scale-in 0.2s ease-out forwards;
// } 