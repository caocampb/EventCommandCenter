'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export function ClickableTableRow({ 
  href, 
  children 
}: { 
  href: string; 
  children: React.ReactNode;
}) {
  const router = useRouter();
  
  return (
    <tr
      onClick={() => router.push(href)}
      className="hover:bg-[#181818] transition-colors duration-120 text-[14px] cursor-pointer"
    >
      {children}
    </tr>
  );
} 