/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    FLASK_API_URL: process.env.FLASK_API_URL || 'http://localhost:5000/api/faq',
    TRANSCRIBE_API_URL: process.env.TRANSCRIBE_API_URL || 'http://localhost:5000/api/transcribe',
  },
}

module.exports = nextConfig 