"use client";

import { createClient } from "@v1/supabase/client";
import { Button } from "@v1/ui/button";
import { useState } from "react";

export function EmailSignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      setIsLoading(true);
      const supabase = createClient();
      
      if (mode === "signin") {
        console.log("Signing in with email/password...");
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        console.log("Sign in successful", data);
        setMessage("Sign in successful!");
      } else {
        console.log("Signing up with email/password...");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          },
        });
        
        if (error) throw error;
        console.log("Sign up initiated", data);
        setMessage("Check your email to confirm your account!");
      }
    } catch (error: any) {
      console.error("Authentication error:", error.message);
      setError(error.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
    setError(null);
    setMessage(null);
  };

  return (
    <div className="w-full space-y-4">
      <form onSubmit={handleAuth} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium">Email</label>
          <input
            id="email"
            type="email"
            className="w-full px-3 py-2 border rounded-md"
            placeholder="your.email@example.com"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium">Password</label>
          <input
            id="password"
            type="password"
            className="w-full px-3 py-2 border rounded-md"
            placeholder="••••••••"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        
        {error && <div className="text-sm text-red-500">{error}</div>}
        {message && <div className="text-sm text-green-500">{message}</div>}
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading 
            ? "Processing..." 
            : mode === "signin" 
              ? "Sign in with Email" 
              : "Sign up with Email"
          }
        </Button>
      </form>
      
      <div className="text-center">
        <Button 
          variant="link" 
          onClick={toggleMode}
          disabled={isLoading}
        >
          {mode === "signin" 
            ? "Don't have an account? Sign up" 
            : "Already have an account? Sign in"
          }
        </Button>
      </div>
    </div>
  );
} 