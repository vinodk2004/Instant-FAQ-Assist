import { useState, useRef, useEffect } from 'react';
// ... existing imports ...

interface ChatInterfaceProps {
  onSendMessage: (message: string) => void;
}

export default function ChatInterface({ onSendMessage }: ChatInterfaceProps) {
  const [userInput, setUserInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);

  // Initialize media recorder
  useEffect(() => {
    if (typeof window !== 'undefined') {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const recorder = new MediaRecorder(stream);
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              audioChunks.current.push(e.data);
            }
          };
          setMediaRecorder(recorder);
        })
        .catch(err => {
          console.error('Error accessing microphone:', err);
        });
    }
  }, []);

  const startRecording = () => {
    if (mediaRecorder) {
      audioChunks.current = [];
      mediaRecorder.start();
      setIsRecording(true);
      setTranscriptionError(null);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      setIsTranscribing(true);

      // Create audio blob
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
      
      // Create form data
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      try {
        // Get the API URL from environment variables or use the default
        const apiUrl = process.env.FLASK_API_URL?.split('/api/faq')[0] || 'http://localhost:5000';
        
        // Send to Flask API for transcription
        const response = await fetch(`${apiUrl}/api/transcribe`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Transcription failed');
        }

        const data = await response.json();
        
        // Update the input field with transcribed text
        if (data.text) {
          setUserInput(data.text);
        }
      } catch (error) {
        console.error('Error transcribing audio:', error);
        setTranscriptionError('Failed to transcribe audio. Please try again or type your message.');
      } finally {
        setIsTranscribing(false);
      }
    }
  };

  const handleSubmit = () => {
    if (userInput.trim()) {
      onSendMessage(userInput);
      setUserInput('');
      setTranscriptionError(null);
    }
  };

  return (
    <div className="chat-interface">
      {/* ... existing chat interface code ... */}
      
      <div className="input-container">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your question..."
          className="chat-input"
        />
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`voice-button ${isRecording ? 'recording' : ''}`}
          disabled={isTranscribing}
        >
          {isTranscribing ? (
            <span>Transcribing...</span>
          ) : isRecording ? (
            <span>Stop Recording</span>
          ) : (
            <span>Start Recording</span>
          )}
        </button>
        <button
          onClick={handleSubmit}
          className="send-button"
          disabled={!userInput.trim()}
        >
          Send
        </button>
      </div>
      
      {transcriptionError && (
        <div className="transcription-error">{transcriptionError}</div>
      )}
      
      <style jsx>{`
        .input-container {
          display: flex;
          gap: 10px;
          padding: 10px;
          background: #f5f5f5;
          border-radius: 8px;
        }
        
        .chat-input {
          flex: 1;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .voice-button {
          padding: 8px 16px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .voice-button.recording {
          background: #f44336;
        }
        
        .voice-button:disabled {
          background: #cccccc;
          cursor: not-allowed;
        }
        
        .send-button {
          padding: 8px 16px;
          background: #2196F3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .send-button:disabled {
          background: #cccccc;
          cursor: not-allowed;
        }
        
        .transcription-error {
          color: #f44336;
          margin-top: 8px;
          font-size: 14px;
          text-align: center;
        }
      `}</style>
    </div>
  );
} 