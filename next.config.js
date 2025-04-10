   /** @type {import('next').NextConfig} */
   const nextConfig = {
    reactStrictMode: true,
    // Add these configurations
    images: {
      domains: ['instant-faq-assist.onrender.com'],
    },
    env: {
      MONGODB_URI: process.env.MONGODB_URI,
      JWT_SECRET: process.env.JWT_SECRET,
      NEXT_PUBLIC_FLASK_API_URL: process.env.NEXT_PUBLIC_FLASK_API_URL,
    },
  }

  module.exports = nextConfig