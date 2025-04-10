from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import torch
import numpy as np
import pickle
import json
import logging
import whisper
from faq_model_utils import (
    clean_text, encode_text, cosine_sim, pad_sequence,
    SiameseNetwork, Vocab, check_small_talk
)
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import re
import tempfile
import ffmpeg

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

app = Flask(__name__)
CORS(app)

# Initialize the FAQ model
model = None
vocab = None
embeddings = None
faq_data = None
max_len = None
device = None
whisper_model = None

def load_model():
    global model, vocab, embeddings, faq_data, max_len, device, whisper_model
    
    try:
        logger.info("Starting model loading...")
        
        # Set device
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Using device: {device}")
        
        # Load vocabulary
        vocab_path = os.path.join(os.path.dirname(__file__), 'vocab.pkl')
        logger.debug(f"Loading vocabulary from {vocab_path}")
        with open(vocab_path, 'rb') as f:
            vocab = pickle.load(f)
        
        # Load FAQ data
        faq_path = os.path.join(os.path.dirname(__file__), 'faq_data.json')
        logger.debug(f"Loading FAQ data from {faq_path}")
        with open(faq_path, 'r', encoding='utf-8') as f:
            faq_data = json.load(f)
        
        # Calculate max length
        max_len = max(len(item['question'].split()) for item in faq_data) + 2
        logger.debug(f"Max sequence length: {max_len}")
        
        # Load model weights
        model_path = os.path.join(os.path.dirname(__file__), 'siamese_faq_model.pt')
        logger.debug(f"Loading model from {model_path}")
        model = SiameseNetwork(len(vocab), 50, 64).to(device)
        model.load_state_dict(torch.load(model_path, map_location=device))
        model.eval()
        
        # Load embeddings
        embeddings_path = os.path.join(os.path.dirname(__file__), 'faq_embeddings.npy')
        logger.debug(f"Loading embeddings from {embeddings_path}")
        embeddings = np.load(embeddings_path)
        
        # Load Whisper model
        logger.info("Loading Whisper model...")
        whisper_model = whisper.load_model("base")
        logger.info("Whisper model loaded successfully")
        
        logger.info("Model loading completed successfully")
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        raise

def get_faq_response(query):
    try:
        logger.debug(f"Processing query: {query}")
        
        # Check for small talk first
        small_talk_response = check_small_talk(query)
        if small_talk_response:
            logger.debug("Small talk detected")
            return small_talk_response, 1.0
        
        # Process the query using the FAQ model
        cleaned = clean_text(query)
        logger.debug(f"Cleaned query: {cleaned}")
        
        # Ensure the encoded sequence is on the correct device
        encoded = pad_sequence(vocab.encode(cleaned), max_len)
        seq_tensor = torch.tensor([encoded], dtype=torch.long).to(device)
        
        # Get query embedding
        with torch.no_grad():
            query_emb = model.forward_once(seq_tensor).cpu().numpy()[0]
        
        # Calculate similarities
        sims = [cosine_sim(query_emb, emb) for emb in embeddings]
        best_idx = int(np.argmax(sims))
        best_score = float(sims[best_idx])  # Convert numpy float32 to Python float
        
        logger.debug(f"Best match index: {best_idx}, Confidence score: {best_score}")
        
        if best_score < 0.80:
            logger.debug("Low confidence, forwarding to helpdesk")
            return "I'm not confident I have the right answer for this question. I've forwarded your query to our help desk team, and they'll get back to you shortly.", best_score
        else:
            logger.debug(f"Found answer: {faq_data[best_idx]['answer']}")
            return faq_data[best_idx]['answer'], best_score
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        raise

@app.route('/api/faq', methods=['POST'])
def handle_faq_request():
    try:
        load_model()
    except Exception as e:
        logger.error(f"Failed to initialize the FAQ model: {e}")
        
    try:
        logger.info("Received FAQ request")
        data = request.get_json()
        logger.debug(f"Request data: {data}")
        
        query = data.get('message', '')
        logger.debug(f"Query: {query}")
        
        if not query:
            logger.warning("Empty query received")
            return jsonify({
                'error': 'No query provided',
                'answer': 'Please provide a question to get an answer.',
                'confidence_score': 0.0
            })
        
        answer, confidence_score = get_faq_response(query)
        logger.debug(f"Response: {answer}, Confidence: {confidence_score}")
        
        return jsonify({
            'answer': answer,
            'confidence_score': confidence_score
        })
        
    except Exception as e:
        logger.error(f"Error handling request: {str(e)}")
        return jsonify({
            'error': str(e),
            'answer': 'Sorry, I encountered an error while processing your question.',
            'confidence_score': 0.0
        })

@app.route('/api/transcribe', methods=['POST'])
def transcribe():
    try:
        logger.info("Received transcription request")
        
        if 'audio' not in request.files:
            logger.warning("No audio file provided")
            return jsonify({'error': 'No audio file provided'}), 400

        audio_file = request.files['audio']
        if not audio_file.filename.endswith('.wav'):
            logger.warning("File format not supported")
            return jsonify({'error': 'Only WAV files are supported'}), 400

        # Save the audio file temporarily
        temp_path = "temp_audio.wav"
        audio_file.save(temp_path)
        logger.debug(f"Saved temporary audio file to {temp_path}")

        try:
            # Transcribe the audio using Whisper
            logger.info("Transcribing audio...")
            result = whisper_model.transcribe(temp_path)
            transcription = result["text"]
            logger.info(f"Transcription complete: {transcription}")

            # Clean up the temporary file
            os.remove(temp_path)
            logger.debug("Removed temporary audio file")

            return jsonify({
                'text': transcription
            })

        except Exception as e:
            # Clean up the temporary file in case of error
            if os.path.exists(temp_path):
                os.remove(temp_path)
            logger.error(f"Error during transcription: {str(e)}")
            raise e

    except Exception as e:
        logger.error(f"Error handling transcription request: {str(e)}")
        return jsonify({'error': 'Failed to transcribe audio'}), 500

@app.route('/', methods=['GET'])
def home():
    return jsonify({'message': 'FAQ backend is up and running! ✅'}), 200

if __name__ == '__main__':
    # Load the model when the application starts
    load_model()
    logger.info("Starting Flask server...")
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port) 