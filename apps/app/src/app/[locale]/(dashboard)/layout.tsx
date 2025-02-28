import { ReactNode } from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import AuthButton from '@/components/auth/auth-button';

type DashboardLayoutProps = {
  children: ReactNode;
};

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
        flex items-center px-3 py-2 text-sm rounded-md mb-0.5 transition-colors
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

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // Get server-side authentication state - working WITH the starter kit pattern
  const supabase = createServerComponentClient({ cookies });
  const { data } = await supabase.auth.getSession();
  
  return (
    <>
      {/* Add Inter font - centralized loading once here */}
      <link 
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" 
        rel="stylesheet" 
      />
      
      <div className="flex h-screen bg-black" style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* Sidebar - simplified for MVP */}
        <div className="w-56 border-r border-[#262626] py-4 flex flex-col">
          {/* Logo area */}
          <div className="px-3 mb-6">
            <div className="text-lg font-semibold tracking-tight text-white pl-3">
              Event<span className="text-[#5E6AD2]">CC</span>
            </div>
          </div>
          
          {/* Main navigation - MVP focused */}
          <nav className="px-3 mb-8">
            <NavItem 
              href="/events" 
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              } 
              label="Events" 
              active={true}
            />
            
            {/* Future navigation items - commented out for MVP */}
            {/* These will be implemented in future sprints */}
            {/* 
            <NavItem 
              href="/vendors" 
              icon={...} 
              label="Vendors"
            />
            <NavItem 
              href="/budget" 
              icon={...} 
              label="Budget"
            />
            */}
          </nav>
          
          {/* Spacer */}
          <div className="flex-grow"></div>
          
          {/* Sign-out button */}
          <div className="px-3 mt-auto border-t border-[#262626] pt-3">
            <AuthButton />
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <main className="min-h-screen">{children}</main>
        </div>
      </div>
    </>
  );
}
