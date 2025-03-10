'use client';

import { useRouter, useParams } from 'next/navigation';
import { ReactNode, useCallback } from 'react';
import { safeNavigate } from '@/utils/route-helpers';

interface ClickableTableRowProps {
  href: string;
  children: ReactNode;
  className?: string;
}

/**
 * A table row that navigates to the provided href when clicked
 * Uses the safeNavigate utility for consistent routing
 */
export function ClickableTableRow({ href, children, className = '' }: ClickableTableRowProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  
  // Use the safeNavigate helper function for clean routing
  const handleClick = useCallback(() => {
    safeNavigate(router, href, locale);
  }, [router, href, locale]);
  
  return (
    <tr
      onClick={handleClick}
      className={`hover:bg-theme-hover-row transition-colors duration-150 text-[14px] cursor-pointer ${className}`}
    >
      {children}
    </tr>
  );
} 