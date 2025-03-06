import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import AuthButton from '@/components/auth/auth-button';
import SidebarNav from '@/components/navigation/sidebar-nav';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import '@/styles/radix-fix.css'; // Fix for Radix UI dropdown z-index issues

type DashboardLayoutProps = {
  children: ReactNode;
};

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
      
      <div 
        className="flex h-screen bg-theme-bg-page" 
        style={{ 
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* Sidebar - simplified for MVP */}
        <div 
          className="w-56 border-r py-4 flex flex-col shadow-sm bg-theme-bg-card border-theme-border-subtle"
        >
          {/* Logo area */}
          <div className="px-3 mb-6">
            <div className="text-lg font-semibold tracking-tight text-theme-text-primary pl-3">
              Event<span className="text-theme-primary">CC</span>
            </div>
          </div>
          
          {/* Main navigation - now uses client component for active state */}
          <SidebarNav />
          
          {/* Spacer */}
          <div className="flex-grow"></div>
          
          {/* Theme and Sign-out buttons */}
          <div 
            className="px-3 mt-auto pt-3 border-t border-theme-border-subtle"
          >
            <div className="flex items-center justify-between mb-3">
              <ThemeToggle />
              <AuthButton />
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div 
          className="flex-1 overflow-auto bg-theme-bg-page"
        >
          <main className="min-h-screen">{children}</main>
        </div>
      </div>
    </>
  );
}
