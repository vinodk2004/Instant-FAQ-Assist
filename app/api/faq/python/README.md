# FAISS-based FAQ Retrieval API

This is a Flask-based API that performs semantic search on FAQs.

## Quick Start for Common Issues

If you're having trouble with package installation:

1. **Try the automatic installer script:**
   ```
   python install_packages.py
   ```

2. **If that fails, use the simpler fallback model:**
   ```
   pip install -r requirements_minimal.txt
   python fallback_model.py
   ```

## Installation Options

### Option 1: Simple Installation

1. Create a Python virtual environment (recommended):
   ```
   python -m venv venv
   venv\Scripts\activate  # Windows
   source venv/bin/activate  # Linux/Mac
   ```

2. Install the basic packages:
   ```
   pip install -r requirements_minimal.txt
   ```

3. Install the advanced packages:
   ```
   pip install sentence-transformers==2.2.2
   pip install scikit-learn==1.0.2
   pip install faiss-cpu==1.7.3  # Try different versions if this fails
   ```

4. Start the API:
   ```
   python faq_model.py
   ```

### Option 2: Conda Installation (Recommended)

1. Create and activate a conda environment:
   ```
   conda create -n faq-env python=3.9
   conda activate faq-env
   ```

2. Install packages:
   ```
   conda install -c conda-forge faiss-cpu scikit-learn nltk
   pip install flask==2.3.3 sentence-transformers==2.2.2 fuzzywuzzy==0.18.0 python-Levenshtein==0.21.1
   ```

3. Start the API:
   ```
   python faq_model.py
   ```

### Option 3: Fallback Model

If you can't install FAISS or sentence-transformers:

1. Install minimal requirements:
   ```
   pip install -r requirements_minimal.txt
   ```

2. Run the simplified fallback model:
   ```
   python fallback_model.py
   ```

## API Endpoints

### POST /api/faq

Query the FAQ retrieval system.

**Request:**
```json
{
  "message": "How can I track my order?"
}
```

**Response:**
```json
{
  "question": "How can I track my order?",
  "answer": "You can track your order by logging into your account...",
  "confidence_score": 0.92,
  "forward_to_helpdesk": false
}
```

## Integration with Next.js

This Flask API is integrated with the Next.js frontend via the API route at `app/api/faq/route.ts`. 