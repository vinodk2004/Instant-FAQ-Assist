import React, { useState, useEffect } from 'react';
import {
  PaperClipIcon,
  ArrowUpTrayIcon,
  DocumentTextIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';

interface MacroResponse {
  id: string;
  title: string;
  content: string;
}

interface ResponsePanelProps {
  ticketId: string;
  userEmail: string;
  question: string;
  onSubmitAnswer: (answer: string, attachments: File[]) => Promise<void>;
  onCancel: () => void;
}

// Predefined macros/saved responses
const PREDEFINED_MACROS: MacroResponse[] = [
  {
    id: '1',
    title: 'Requesting More Information',
    content: 'Thank you for contacting us. To better assist you with your query, could you please provide more details about the issue you\'re experiencing? Specifically, we would need to know:\n\n1. When did this issue first occur?\n2. What steps have you already taken to resolve it?\n3. Are you seeing any error messages?\n\nThis additional information will help us provide you with a more accurate solution.'
  },
  {
    id: '2',
    title: 'Technical Support Handoff',
    content: 'Thank you for bringing this to our attention. Based on the technical nature of your question, I\'ve escalated this to our specialized technical support team. They will analyze your issue in detail and get back to you within 24 hours with a solution. Your ticket reference remains the same, so you can track the progress of your query.'
  },
  {
    id: '3',
    title: 'Solution Confirmation',
    content: 'I\'m pleased to inform you that we\'ve resolved your issue. The solution we\'ve implemented should address the problem you reported. Please take a moment to verify that everything is working correctly on your end. If you encounter any further issues or have questions, don\'t hesitate to let us know by replying to this message.'
  },
  {
    id: '4',
    title: 'Account Settings Guide',
    content: 'To update your account settings, please follow these steps:\n\n1. Log in to your account\n2. Click on the profile icon in the top right corner\n3. Select "Account Settings" from the dropdown menu\n4. Navigate to the section you wish to modify\n5. Make your changes and click "Save"\n\nIf you encounter any difficulties during this process, please let us know and we\'ll be happy to provide further assistance.'
  }
];

export default function ResponsePanel({ 
  ticketId, 
  userEmail, 
  question, 
  onSubmitAnswer, 
  onCancel 
}: ResponsePanelProps) {
  const [answer, setAnswer] = useState('');
  const [selectedMacro, setSelectedMacro] = useState<string>('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMacros, setShowMacros] = useState(false);
  const [customMacros, setCustomMacros] = useState<MacroResponse[]>([]);
  
  // Combine predefined and custom macros
  const allMacros = [...PREDEFINED_MACROS, ...customMacros];

  // Load custom macros from localStorage
  useEffect(() => {
    const storedMacros = localStorage.getItem('helpdesk_macros');
    if (storedMacros) {
      try {
        setCustomMacros(JSON.parse(storedMacros));
      } catch (e) {
        console.error('Failed to parse stored macros', e);
      }
    }
  }, []);

  const handleMacroSelect = (macroId: string) => {
    const macro = allMacros.find(m => m.id === macroId);
    if (macro) {
      setAnswer(macro.content);
      setSelectedMacro(macroId);
    }
    setShowMacros(false);
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

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmitAnswer(answer, attachments);
      // Clear form after successful submission
      setAnswer('');
      setAttachments([]);
      setSelectedMacro('');
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveMacro = () => {
    if (!answer.trim()) return;
    
    const macroTitle = prompt('Enter a title for this response template:');
    if (macroTitle) {
      const newMacro: MacroResponse = {
        id: Date.now().toString(),
        title: macroTitle,
        content: answer
      };
      
      const updatedMacros = [...customMacros, newMacro];
      setCustomMacros(updatedMacros);
      
      // Save to localStorage
      localStorage.setItem('helpdesk_macros', JSON.stringify(updatedMacros));
      
      alert('Response template saved successfully!');
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-4">Respond to Ticket</h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-400">From</p>
          <p className="text-white font-medium">{userEmail}</p>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-400">Question</p>
          <p className="text-white bg-gray-700/50 rounded-lg p-3">{question}</p>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-300">
            Your Response
          </label>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setShowMacros(!showMacros)}
              className="text-xs px-2 py-1 bg-purple-500/10 text-purple-400 rounded flex items-center gap-1 hover:bg-purple-500/20 transition-colors"
            >
              <DocumentTextIcon className="w-3 h-3" />
              Templates
            </button>
            <button
              type="button"
              onClick={saveMacro}
              disabled={!answer.trim()}
              className="text-xs px-2 py-1 bg-green-500/10 text-green-400 rounded flex items-center gap-1 hover:bg-green-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckBadgeIcon className="w-3 h-3" />
              Save Template
            </button>
          </div>
        </div>
        
        {showMacros && (
          <div className="bg-gray-700 rounded-lg mb-3 p-2 max-h-52 overflow-y-auto">
            {allMacros.map(macro => (
              <button
                key={macro.id}
                onClick={() => handleMacroSelect(macro.id)}
                className={`w-full text-left p-2 rounded mb-1 text-sm ${
                  selectedMacro === macro.id
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'hover:bg-gray-600 text-white'
                }`}
              >
                {macro.title}
              </button>
            ))}
            {allMacros.length === 0 && (
              <p className="text-gray-400 text-sm p-2">No saved templates available.</p>
            )}
          </div>
        )}
        
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[150px]"
          placeholder="Type your response here..."
        />
      </div>
      
      {/* Attachments Section */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Attachments
        </label>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((file, index) => (
            <div key={index} className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-2 text-sm">
              <PaperClipIcon className="w-4 h-4 text-gray-400" />
              <span className="text-white truncate max-w-[180px]">{file.name}</span>
              <button
                onClick={() => removeAttachment(index)}
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                &times;
              </button>
            </div>
          ))}
          
          <label className="cursor-pointer flex items-center gap-2 bg-gray-700 hover:bg-gray-600 rounded-lg px-3 py-2 text-sm text-white transition-colors">
            <ArrowUpTrayIcon className="w-4 h-4" />
            <span>Add File</span>
            <input
              type="file"
              className="hidden"
              onChange={handleFileChange}
              multiple
            />
          </label>
        </div>
      </div>
      
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!answer.trim() || isSubmitting}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? 'Sending...' : 'Send Response'}
        </button>
      </div>
    </div>
  );
} 