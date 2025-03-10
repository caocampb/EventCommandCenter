import { redirect } from 'next/navigation';

export default function IndexPage({ params }: { params: { locale: string } }) {
  // Redirect to the events page with proper locale
  redirect(`/${params.locale}/events`);
} 