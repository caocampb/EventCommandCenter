export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

export default function NotFound() {
  // Redirect to the events page or a suitable fallback
  redirect("/en/events");
  
  // This return is never reached but needed for React
  return null;
} 