'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only show the toggle after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-150 hover:bg-theme-bg-hover"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        // Sun icon for dark mode (click to switch to light)
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          className="text-theme-text-secondary"
        >
          <circle cx="12" cy="12" r="5" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 1v2" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 21v2" strokeWidth="2" strokeLinecap="round" />
          <path d="M4.22 4.22l1.42 1.42" strokeWidth="2" strokeLinecap="round" />
          <path d="M18.36 18.36l1.42 1.42" strokeWidth="2" strokeLinecap="round" />
          <path d="M1 12h2" strokeWidth="2" strokeLinecap="round" />
          <path d="M21 12h2" strokeWidth="2" strokeLinecap="round" />
          <path d="M4.22 19.78l1.42-1.42" strokeWidth="2" strokeLinecap="round" />
          <path d="M18.36 5.64l1.42-1.42" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : (
        // Moon icon for light mode (click to switch to dark)
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          className="text-theme-text-secondary"
        >
          <path
            d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
} 