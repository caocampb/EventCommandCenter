'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useCallback } from 'react';

interface ClickableTableRowProps {
  href: string;
  children: ReactNode;
  className?: string;
}

/**
 * A table row that navigates to the provided href when clicked
 * Uses the router for navigation
 */
export function ClickableTableRow({ href, children, className = '' }: ClickableTableRowProps) {
  const router = useRouter();
  
  // Use a callback to handle navigation
  const handleClick = useCallback(() => {
    // Navigate to the href
    router.push(href);
  }, [router, href]);
  
  return (
    <tr
      onClick={handleClick}
      className={`hover:bg-theme-hover-row transition-colors duration-150 text-[14px] cursor-pointer ${className}`}
    >
      {children}
    </tr>
  );
} 