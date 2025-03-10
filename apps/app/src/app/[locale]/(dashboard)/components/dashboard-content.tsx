'use client';

import { SignOut } from "@/components/sign-out";

interface DashboardContentProps {
  userEmail?: string;
  welcomeMessage: string;
}

export function DashboardContent({ userEmail, welcomeMessage }: DashboardContentProps) {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-4">
        <p>{welcomeMessage}</p>
        <SignOut />
      </div>
    </div>
  );
} 