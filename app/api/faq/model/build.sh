
#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting build process..."


echo "📦 Installing dependencies..."
pip install --upgrade pip

# Install Python dependencies from requirements.txt
pip install -r requirements.txt


echo "📁 Downloading NLTK resources..."
python3 -m nltk.downloader punkt

echo "✅ Build completed successfully!"
