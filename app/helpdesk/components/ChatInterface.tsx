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
    }
  };

  const stopRecording = async () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      setIsTranscribing(true);

      // Create audio blob
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
      
      try {
        // Send to Flask API for transcription
        const transcription = await handleTranscribe(audioBlob);
        
        // Update the input field with transcribed text
        if (transcription) {
          setUserInput(transcription);
        }
      } catch (error) {
        console.error('Error transcribing audio:', error);
      } finally {
        setIsTranscribing(false);
      }
    }
  };

  const handleTranscribe = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.wav');

      const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/transcribe`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      return data.transcription;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  };

  const handleSubmit = () => {
    if (userInput.trim()) {
      onSendMessage(userInput);
      setUserInput('');
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
      `}</style>
    </div>
  );
} 