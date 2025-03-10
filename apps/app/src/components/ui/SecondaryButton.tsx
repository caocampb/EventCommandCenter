'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface SecondaryButtonProps {
  href: string;
  children: ReactNode;
  className?: string;
}

/**
 * A linear-style secondary action button with proper hover handling
 * Uses theme variables for color management via Tailwind classes
 */
export function SecondaryButton({ href, children, className = '' }: SecondaryButtonProps) {
  return (
    <Link
      href={{ pathname: href }}
      className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md 
                 transition-colors duration-150 border shadow-sm 
                 bg-theme-bg-card text-theme-text-secondary border-theme-border-subtle
                 hover:bg-theme-bg-hover hover:text-theme-text-primary
                 active:bg-theme-bg-active ${className}`}
    >
      {children}
    </Link>
  );
} 