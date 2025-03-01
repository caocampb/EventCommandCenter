import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import AuthButton from '@/components/auth/auth-button';
import SidebarNav from '@/components/navigation/sidebar-nav';
import { colors } from '@/styles/colors';

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
        className="flex h-screen" 
        style={{ 
          fontFamily: "'Inter', sans-serif",
          backgroundColor: colors.background.page  // Using the warmer black from colors system
        }}
      >
        {/* Sidebar - simplified for MVP */}
        <div 
          className="w-56 border-r py-4 flex flex-col shadow-sm"
          style={{
            borderColor: colors.border.subtle,
            backgroundColor: colors.background.card // Using card background for sidebar
          }}
        >
          {/* Logo area */}
          <div className="px-3 mb-6">
            <div className="text-lg font-semibold tracking-tight text-white pl-3">
              Event<span className="text-[#5E6AD2]">CC</span>
            </div>
          </div>
          
          {/* Main navigation - now uses client component for active state */}
          <SidebarNav />
          
          {/* Spacer */}
          <div className="flex-grow"></div>
          
          {/* Sign-out button */}
          <div 
            className="px-3 mt-auto pt-3"
            style={{ borderTopColor: colors.border.subtle, borderTopWidth: '1px' }}
          >
            <AuthButton />
          </div>
        </div>
        
        {/* Main content */}
        <div 
          className="flex-1 overflow-auto"
          style={{ backgroundColor: colors.background.page }} // Using the warmer black from colors system
        >
          <main className="min-h-screen">{children}</main>
        </div>
      </div>
    </>
  );
}
