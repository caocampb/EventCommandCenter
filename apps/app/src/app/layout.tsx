import { redirect } from "next/navigation";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  redirect("/en");
  
  // This won't be reached due to the redirect
  return null;
} 