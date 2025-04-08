'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get the from parameter or check if coming from helpdesk
  const from = searchParams.get('from') || '/';
  const isHelpdeskLogout = searchParams.get('helpdesk_logout') === 'true';

  // Function to clear all auth cookies
  const clearAllCookies = async () => {
    try {
      // Clear user token
      await fetch('/api/auth/logout', { method: 'POST' });
      
      // Clear helpdesk token
      await fetch('/api/helpdesk/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error clearing cookies:', error);
    }
  };

  // Check if user is already logged in or clear cookies if logged out
  useEffect(() => {
    const initializeAuth = async () => {
      // If we detect a helpdesk logout or explicit logout, clear all cookies first
      if (isHelpdeskLogout || isLoggedOut) {
        await clearAllCookies();
        setIsLoggedOut(false);
          return;
        }

      try {
        // Check for regular user auth only
        const userResponse = await fetch('/api/auth/user');
        if (userResponse.ok) {
          router.push('/');
          return;
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };
    
    initializeAuth();
  }, [router, isHelpdeskLogout, isLoggedOut]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Always clear both types of cookies before login to avoid conflicts
      await clearAllCookies();

      // Check if credentials match help desk credentials
      if (email === 'helpdesk@example.com' && password === 'helpdesk123') {
        const response = await fetch('/api/helpdesk/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          throw new Error('Invalid help desk credentials');
        }

        // Set redirecting state before navigation
        setIsRedirecting(true);
        // Force a hard refresh to ensure the new cookie is set
        window.location.href = '/helpdesk/dashboard';
        return;
      }

      // Regular user login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      // Set redirecting state before navigation
      setIsRedirecting(true);
      
      // Use window.location.replace to avoid adding the landing page to browser history
      // This will make the app replace the current page in history
      window.location.replace('/');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      setIsRedirecting(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black p-4">
      {isRedirecting && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-t-purple-500 border-gray-600/30 rounded-full animate-spin mb-4"></div>
            <p className="text-white text-lg">Logging you in...</p>
          </div>
        </div>
      )}
      
      <div className="max-w-md w-full space-y-8 bg-gray-800/50 p-8 rounded-2xl backdrop-blur-xl border border-gray-700/50">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
          <h2 className="text-3xl font-bold text-white text-center">User Login</h2>
          <p className="mt-2 text-center text-gray-400">
            Sign in to your account to continue
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
            <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
              Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              className="appearance-none relative block w-full px-4 py-3 border border-gray-700 placeholder-gray-500 text-white bg-gray-900/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Email address"
              />
            </div>
          
            <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              className="appearance-none relative block w-full px-4 py-3 border border-gray-700 placeholder-gray-500 text-white bg-gray-900/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Password"
              />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          
          <div className="flex items-center justify-center mt-6">
            <div className="text-sm">
              <Link
                href="/auth/signup"
                className="font-medium text-purple-400 hover:text-purple-300"
              >
                Don&apos;t have an account? Sign up
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 