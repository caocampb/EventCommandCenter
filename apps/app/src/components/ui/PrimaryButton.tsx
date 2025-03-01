'use client';

import Link from 'next/link';
import { colors } from '@/styles/colors';
import { ReactNode } from 'react';

interface PrimaryButtonProps {
  href: string;
  children: ReactNode;
  className?: string;
}

/**
 * A Linear-style primary action button with proper hover handling
 * Uses CSS variables for color management
 */
export function PrimaryButton({ href, children, className = '' }: PrimaryButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md 
                 transition-colors duration-150 border shadow-sm 
                 bg-primary-button text-white border-transparent
                 hover:bg-primary-button-hover hover:border-primary-button-hover 
                 active:bg-primary-button-active ${className}`}
    >
      {children}
    </Link>
  );
} 