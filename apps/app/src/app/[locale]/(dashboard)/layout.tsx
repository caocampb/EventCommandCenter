import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import AuthButton from '@/components/auth/auth-button';
import SidebarNav from '@/components/navigation/sidebar-nav';

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
      
      <div className="flex h-screen bg-[#0F0F0F]" style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* Sidebar - simplified for MVP */}
        <div className="w-56 border-r border-[#1F1F1F] py-4 flex flex-col bg-[#141414] shadow-sm">
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
          <div className="px-3 mt-auto border-t border-[#1F1F1F] pt-3">
            <AuthButton />
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 overflow-auto bg-gradient-to-b from-[#0F0F0F] to-[#111111]">
          <main className="min-h-screen">{children}</main>
        </div>
      </div>
    </>
  );
}
