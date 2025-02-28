import { redirect } from 'next/navigation';

export default function IndexPage() {
  // Redirect to the events page
  redirect('/events');
} 