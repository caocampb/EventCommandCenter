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
 * Uses type assertion to work around Next.js type inconsistencies
 */
export function ClickableTableRow({ href, children, className = '' }: ClickableTableRowProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  
  // Handle the click with a properly localized path
  const handleClick = useCallback(() => {
    // Get the properly formatted path
    let targetPath = href;
    if (locale && !href.startsWith(`/${locale}/`)) {
      targetPath = `/${locale}${href.startsWith('/') ? href : `/${href}`}`;
    }
    
    // Use type assertion to bypass the strict type checking
    // This is necessary due to inconsistencies in Next.js type definitions
    router.push(targetPath as any);
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