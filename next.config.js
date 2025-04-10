/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Add image domains for optimization
  images: {
    domains: ['instant-faq-assist.onrender.com'],
  },
  // Add environment variables
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    NEXT_PUBLIC_FLASK_API_URL: process.env.NEXT_PUBLIC_FLASK_API_URL,
  },
  // Disable static generation for API routes
  experimental: {
    serverComponentsExternalPackages: ['bcrypt'],
  },
}

module.exports = nextConfig