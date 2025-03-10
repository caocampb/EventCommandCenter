import { redirect } from 'next/navigation';

export default function IndexPage({ params }: { params: { locale: string } }) {
  // Simple redirect to events page with locale
  redirect(`/${params.locale}/events`);
} 