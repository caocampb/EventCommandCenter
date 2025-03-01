'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Navigation item component
function NavItem({ 
  href, 
  icon, 
  label, 
  active = false 
}: { 
  href: string; 
  icon: ReactNode; 
  label: string; 
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`
        flex items-center px-3 py-2 text-sm rounded-md mb-0.5 transition-colors duration-120
        ${active 
          ? 'bg-[#1E1E1E] text-white font-medium' 
          : 'text-gray-400 hover:text-white hover:bg-[#1E1E1E]/50'}
      `}
    >
      <span className="mr-3 opacity-80">{icon}</span>
      {label}
    </Link>
  );
}

export default function SidebarNav() {
  // Get current path to determine active nav item
  const pathname = usePathname();
  
  // Check if the pathname contains the section name
  const isEventsActive = pathname?.includes('/events') ?? false;
  const isVendorsActive = pathname?.includes('/vendors') ?? false;
  const isBudgetActive = pathname?.includes('/budget') ?? false;
  
  return (
    <nav className="px-3 mb-8">
      <NavItem 
        href="/en/events" 
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        } 
        label="Events" 
        active={isEventsActive}
      />
      
      <NavItem 
        href="/en/vendors" 
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="9" cy="7" r="4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 3.13a4 4 0 010 7.75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        } 
        label="Vendors"
        active={isVendorsActive}
      />
      
      <NavItem 
        href="/en/budget" 
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        } 
        label="Budget"
        active={isBudgetActive}
      />
      
      {/* Future navigation items - commented out for MVP */}
      {/* These will be implemented in future sprints */}
      {/* 
      <NavItem 
        href="/budget" 
        icon={...} 
        label="Budget"
      />
      */}
    </nav>
  );
} 