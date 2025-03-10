export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

export default function NotFound() {
  // Redirect to the home page or a custom 404 page in your preferred locale
  redirect("/en");
  
  // This return is never reached but needed for React
  return null;
} 