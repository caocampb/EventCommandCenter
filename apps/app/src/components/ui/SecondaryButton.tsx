'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface SecondaryButtonProps {
  href: string;
  children: ReactNode;
  className?: string;
}

/**
 * A Linear-style secondary action button
 */
export function SecondaryButton({ href, children, className = '' }: SecondaryButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md 
                 transition-colors duration-150 border shadow-sm 
                 bg-theme-bg-card text-theme-text-secondary border-theme-border-subtle
                 hover:bg-theme-hover-button hover:text-theme-text-primary hover:border-theme-border-strong
                 active:bg-theme-active-item ${className}`}
    >
      {children}
    </Link>
  );
} 