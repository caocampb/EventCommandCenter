'use client';

import { useState, useRef, useEffect } from 'react';

interface VendorDiscoverySearchProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
}

export function VendorDiscoverySearch({ onSearch, isSearching }: VendorDiscoverySearchProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Example queries that can be clicked
  const exampleQueries = [
    "outdoor venues for 50 people",
    "photographers in Austin",
    "catering with vegetarian options"
  ];
  
  // Auto-focus the input on component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  const handleExampleClick = (exampleQuery: string) => {
    setQuery(exampleQuery);
    onSearch(exampleQuery);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-theme-text-tertiary">
            <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe what you're looking for in plain language..."
            className="w-full px-10 py-3 bg-theme-bg-input border border-theme-border-subtle rounded-lg text-theme-text-primary placeholder-theme-text-tertiary focus:outline-none focus:ring-1 focus:ring-theme-primary focus:border-theme-primary transition-all duration-120"
            disabled={isSearching}
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-theme-text-tertiary hover:text-theme-text-primary"
            >
              <svg width="14" height="14" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </button>
          )}
        </div>
        
        <div className="flex gap-2 mt-6">
          {exampleQueries.map(exampleQuery => (
            <button 
              key={exampleQuery}
              type="button"
              onClick={() => handleExampleClick(exampleQuery)}
              className="px-3 py-1 text-xs bg-theme-bg-hover hover:bg-theme-bg-card rounded-full transition-colors text-theme-text-secondary"
            >
              {exampleQuery}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
} 