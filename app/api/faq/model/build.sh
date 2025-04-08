#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Install FFmpeg using apt-get
apt-get update -y
apt-get install -y ffmpeg

# Download NLTK data
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"

echo "Build script completed successfully!" 