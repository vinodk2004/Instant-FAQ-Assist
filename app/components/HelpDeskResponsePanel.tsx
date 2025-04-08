import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Notification {
  id: string;
  question: string;
  answer: string;
  answeredAt: string;
  seen: boolean;
}

interface HelpDeskResponsePanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeResponse: Notification | null;
  allResponses: Notification[];
  onSelectResponse: (notification: Notification) => void;
}

export default function HelpDeskResponsePanel({
  isOpen,
  onClose,
  activeResponse,
  allResponses,
  onSelectResponse
}: HelpDeskResponsePanelProps) {
  return (
    <div className={`fixed right-0 top-0 h-full w-80 bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out z-40 border-l border-gray-700 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">HelpDesk Responses</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white focus:outline-none"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeResponse ? (
            <div className="p-4">
              <div className="mb-6">
                <h3 className="text-sm text-gray-400 mb-1">Your Question</h3>
                <div className="bg-gray-700 rounded-lg p-3 text-white">
                  {activeResponse.question}
                </div>
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {new Date(activeResponse.answeredAt).toLocaleDateString()}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm text-gray-400 mb-1">HelpDesk Response</h3>
                <div className="bg-purple-900/30 border border-purple-500/20 rounded-lg p-3 text-white">
                  {activeResponse.answer}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-500">
              Select a response to view
            </div>
          )}
        </div>
        
        {/* List of other responses */}
        <div className="border-t border-gray-700 max-h-60 overflow-y-auto">
          <h3 className="p-3 text-sm font-medium text-gray-400">Other Responses</h3>
          <div className="divide-y divide-gray-700">
            {allResponses.map(response => (
              <div 
                key={response.id}
                className={`p-3 hover:bg-gray-700 cursor-pointer ${activeResponse?.id === response.id ? 'bg-gray-700' : ''}`}
                onClick={() => onSelectResponse(response)}
              >
                <div className="text-sm text-white truncate font-medium">
                  {response.question.length > 50 
                    ? response.question.substring(0, 50) + '...' 
                    : response.question}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(response.answeredAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 