'use client';

import { createClient } from "@v1/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AuthButton() {
  const router = useRouter();
  const supabase = createClient();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    }
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };
  
  if (isAuthenticated) {
    return (
      <button
        onClick={handleSignOut}
        className="flex items-center rounded-md px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Sign out
      </button>
    );
  }
  
  return null; // Don't show anything if not authenticated (middleware handles redirect)
} 