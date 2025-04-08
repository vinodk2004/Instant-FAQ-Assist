# FAQ Model API

This is a Flask-based API that serves a custom FAQ model for answering user queries.

## Directory Structure

```
model/
├── app.py                 # Main Flask application
├── faq_model_utils.py     # FAQ model utilities
├── siamese_faq_model.pt   # Model weights
├── vocab.pkl             # Vocabulary file
├── faq_embeddings.npy    # Pre-computed embeddings
├── faq_data.json         # FAQ data
└── requirements.txt      # Python dependencies
```

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Place the following files in the model directory:
- `siamese_faq_model.pt`
- `vocab.pkl`
- `faq_embeddings.npy`
- `faq_data.json`

## Running the API

1. Start the Flask server:
```bash
python app.py
```

The API will be available at `http://localhost:5000/api/faq`

## API Endpoint

### POST /api/faq

Request body:
```json
{
    "message": "Your question here"
}
```

Response:
```json
{
    "answer": "The answer to your question",
    "confidence_score": 0.95
}
```

## Error Handling

The API returns appropriate error messages and confidence scores in case of:
- Missing query
- Model loading errors
- Processing errors 