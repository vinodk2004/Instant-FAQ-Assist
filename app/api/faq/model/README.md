# Instant FAQ Assistant Backend

This is the backend service for the Instant FAQ Assist project. It uses a Flask API with a Siamese neural network for FAQ matching and OpenAI's Whisper model for audio transcription.

## Local Development

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Install FFmpeg (required for Whisper audio processing):
   - Windows: Download from [here](https://ffmpeg.org/download.html)
   - Mac: `brew install ffmpeg`
   - Linux: `sudo apt-get install ffmpeg`

3. Run the server:
   ```
   python app.py
   ```

The server will run on http://localhost:5000 by default.

## API Endpoints

- `GET /`: Health check endpoint
- `POST /api/faq`: FAQ query endpoint (expects JSON with a "message" field)
- `POST /api/transcribe`: Audio transcription endpoint (expects form data with an "audio" file)

## Deploying to Render

### Automatic Deployment with GitHub

1. Push your code to a GitHub repository
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Create a new Web Service
4. Connect your GitHub repository
5. Select the directory with the Flask application (path: `app/api/faq/model`)
6. Render will automatically use `render.yaml` for configuration

### Manual Configuration on Render

If not using the YAML file, configure as follows:

- **Environment**: Python
- **Build Command**: `chmod +x build.sh && ./build.sh`
- **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT`
- **Python Version**: 3.10

## Important Notes

- Make sure that the `faq_data.json`, `vocab.pkl`, `siamese_faq_model.pt`, and `faq_embeddings.npy` files are included in the deployment.
- The Whisper model will be downloaded automatically during the first run, which may take some time.
- The free tier of Render has limited resources, so the Whisper transcription might be slow.

## Environment Variables

- `PORT`: Set by Render automatically
- Customize other environment variables through the Render dashboard if needed

## Troubleshooting

If you encounter issues with the deployment:

1. Check the Render logs for error messages
2. Ensure FFmpeg is installed correctly (build script should handle this)
3. Verify that the NLTK data is downloaded properly
4. If memory issues occur, consider upgrading from the free tier 