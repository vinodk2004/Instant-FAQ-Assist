FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Download NLTK data during build to avoid download at runtime
RUN python -c "import nltk; nltk.download('wordnet')"

# Run the app with Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "wsgi:app"]

EXPOSE 5000 