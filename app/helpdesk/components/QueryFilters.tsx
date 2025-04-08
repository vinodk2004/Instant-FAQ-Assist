import React, { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface QueryFiltersProps {
  onSearch: (keywords: string) => void;
}

export default function QueryFilters({ onSearch }: QueryFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };
  
  const handleClear = () => {
    setSearchQuery('');
    onSearch('');
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets by keyword or email..."
            className="w-full bg-gray-700/40 border border-gray-600/50 text-white rounded-xl px-5 py-3 pl-12 pr-16 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 placeholder:text-gray-400"
          />
          <div className="absolute left-3 text-gray-400">
            <MagnifyingGlassIcon className="w-6 h-6" />
          </div>
          
          {searchQuery && (
            <button 
              type="button" 
              onClick={handleClear}
              className="absolute right-16 text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
          
          <button
            type="submit"
            className="absolute right-3 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
          >
            Search
          </button>
        </div>
        
        {searchQuery && (
          <div className="text-xs text-gray-400 mt-1 ml-2">
            Searching for: <span className="text-purple-400 font-medium">{searchQuery}</span>
          </div>
        )}
      </form>
    </div>
  );
} 