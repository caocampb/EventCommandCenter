'use client';

import { createClient } from "@v1/supabase/client";
import { Button } from "@v1/ui/button";
import { Icons } from "@v1/ui/icons";

interface DashboardContentProps {
  userEmail?: string;
  welcomeMessage: string;
}

export function DashboardContent({ userEmail, welcomeMessage }: DashboardContentProps) {
  const supabase = createClient();

  const handleSignOut = () => {
    supabase.auth.signOut();
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-4">
        <p>{welcomeMessage}</p>
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="font-mono gap-2 flex items-center"
        >
          <Icons.SignOut className="size-4" />
          <span>Sign out</span>
        </Button>
      </div>
    </div>
  );
} 