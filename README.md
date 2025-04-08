# FAQ Helpdesk System

A comprehensive FAQ helpdesk system with semantic search capabilities.

## Features
- Semantic search using Siamese Network
- Voice input with Whisper transcription
- Real-time chat interface
- Helpdesk dashboard
- User authentication
- Analytics and reporting

## Tech Stack
- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: Flask, Python
- Database: MongoDB
- NLP: OpenAI Whisper, Siamese Network

## Setup Instructions

### Frontend Setup (Local Development)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create .env.local file (use .env.example as a template)
3. Run development server:
   ```bash
   npm run dev
   ```

### Backend Setup (Local Development)
1. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # or `venv\Scripts\activate` on Windows
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run Flask server:
   ```bash
   python app.py
   ```

## Deployment Guide

### Frontend Deployment (Vercel)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Connect Repository to Vercel**
   - Create a Vercel account or log in at [vercel.com](https://vercel.com)
   - Click "New Project" and import your GitHub repository
   - Select the repository containing your project

3. **Configure Project Settings**
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: .next
   - Install Command: npm install

4. **Set Environment Variables**
   - Go to Settings → Environment Variables
   - Add the following variables:
     - `MONGODB_URI` (Your MongoDB connection string)
     - `JWT_SECRET` (Your JWT secret)
     - `FLASK_API_URL` (Your Flask backend URL from Render - add after backend deployment)
     - `TRANSCRIBE_API_URL` (Your transcription endpoint URL from Render - add after backend deployment)

5. **Deploy**
   - Click "Deploy" to start the deployment process
   - Vercel will build and deploy your project
   - Once complete, you'll receive a domain (e.g., your-app.vercel.app)

### Backend Deployment (Render)

1. **Prepare Backend Files**
   Ensure your backend directory includes these files:
   - `app.py` (Flask application)
   - `requirements.txt` (Python dependencies)
   - `faq_model_utils.py` (Model utilities)
   - Model files: `vocab.pkl`, `siamese_faq_model.pt`, `faq_data.json`

2. **Push Backend to GitHub**
   - Create a new repository for the backend (or use a subfolder in your existing repo)
   - Commit and push all required files

3. **Create a New Web Service on Render**
   - Sign up or log in at [render.com](https://render.com)
   - Click "New +" and select "Web Service"
   - Connect your GitHub repository
   - Select the repository containing your backend

4. **Configure Web Service**
   - Name: faq-backend (or your preferred name)
   - Environment: Python
   - Region: Choose the region closest to your users
   - Branch: main (or your default branch)
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app`
   - Instance Type: Select appropriate plan (Free tier available)

5. **Set Environment Variables**
   - Add any required environment variables for your backend

6. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy your Flask application
   - Once complete, you'll receive a domain (e.g., faq-backend.onrender.com)

7. **Update Frontend Configuration**
   - Copy the Render domain for your backend
   - Update the environment variables in your Vercel project:
     - `FLASK_API_URL`: https://your-backend.onrender.com/api/faq
     - `TRANSCRIBE_API_URL`: https://your-backend.onrender.com/api/transcribe

## Important Notes

- The free tier on Render has cold starts, which may cause initial latency
- Make sure all model files are included in your backend repository
- MongoDB should be accessible from both Vercel and Render
- Keep your JWT_SECRET secure and consistent between environments
- For production, consider using a paid tier for better performance

## Testing Deployment

After deploying, test the following:
1. User authentication 
2. FAQ query functionality
3. Voice transcription
4. Helpdesk ticket management
5. Analytics dashboard 