import { redirect } from 'next/navigation';

/**
 * Dashboard index page - redirects to events by default
 * Using a server component for redirection ensures we avoid client reference manifest issues
 */
export default function DashboardPage({ params }: { params: { locale: string } }) {
  // Simple server-side redirect to events page
  redirect(`/${params.locale}/events`);
  
  // This will never be reached due to the redirect
  return null;
}
