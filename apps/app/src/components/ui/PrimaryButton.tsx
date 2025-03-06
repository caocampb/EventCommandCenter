'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface PrimaryButtonProps {
  href: string;
  children: ReactNode;
  className?: string;
}

/**
 * A Linear-style primary action button with proper hover handling
 * Uses theme variables for color management via Tailwind classes
 */
export function PrimaryButton({ href, children, className = '' }: PrimaryButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md 
                 transition-colors duration-150 border shadow-sm 
                 bg-theme-primary text-white border-transparent
                 hover:bg-theme-primary-hover hover:border-theme-primary-hover 
                 active:bg-theme-primary-active ${className}`}
    >
      {children}
    </Link>
  );
} 