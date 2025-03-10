import { redirect } from 'next/navigation';

export default function IndexPage({ params }: { params: { locale: string } }) {
  // Redirect to the events page with proper locale
  console.log('Root page redirecting to events with locale:', params.locale);
  redirect(`/${params.locale}/events`);
} 