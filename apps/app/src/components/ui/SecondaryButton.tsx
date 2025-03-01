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
                 bg-[#1E1E1E] text-gray-300 border-[#333333]
                 hover:bg-[#2A2A2A] hover:text-white
                 active:bg-[#252525] ${className}`}
    >
      {children}
    </Link>
  );
} 