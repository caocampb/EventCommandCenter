'use client';

import { useRouter, useParams } from 'next/navigation';
import { ReactNode, useCallback } from 'react';

interface ClickableTableRowProps {
  href: string;
  children: ReactNode;
  className?: string;
}

/**
 * A table row that navigates to the provided href when clicked
 * Uses a locale-aware approach for navigation
 */
export function ClickableTableRow({ href, children, className = '' }: ClickableTableRowProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  
  // Create a properly formatted path with locale
  const getLocalizedPath = useCallback((path: string) => {
    if (!locale) return path;
    if (path.startsWith(`/${locale}/`)) return path;
    return `/${locale}${path.startsWith('/') ? path : `/${path}`}`;
  }, [locale]);
  
  // Handle the navigation
  const handleClick = useCallback(() => {
    const targetPath = getLocalizedPath(href);
    router.push(targetPath);
  }, [router, href, getLocalizedPath]);
  
  return (
    <tr
      onClick={handleClick}
      className={`hover:bg-theme-hover-row transition-colors duration-150 text-[14px] cursor-pointer ${className}`}
    >
      {children}
    </tr>
  );
} 