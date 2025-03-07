"use client";

import { createClient } from "@v1/supabase/client";
import { Button } from "@v1/ui/button";
import { useState } from "react";

export function GoogleSignin() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignin = async () => {
    try {
      setIsLoading(true);
      
      console.log("Starting Google OAuth sign-in...");
      
      // Use the project's custom Supabase client
      const supabase = createClient();
      
      // Use the most direct approach with minimal options
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          // Force a fresh login each time to avoid stale state issues
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
          },
          skipBrowserRedirect: false, // Ensure browser handles the redirect
        },
      });
      
      if (error) {
        console.error("OAuth sign-in error:", error.message);
        throw error;
      }
      
      // This code may not execute as the browser will redirect
      console.log("OAuth redirect initiated");
    } catch (error) {
      console.error("Failed to initiate Google sign-in:", error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleSignin}
      disabled={isLoading}
      className="w-full"
    >
      {isLoading ? "Signing in..." : "Continue with Google"}
    </Button>
  );
}
