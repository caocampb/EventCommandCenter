import { getI18n } from "@/locales/server";
import Link from "next/link";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Event as EventType } from "@/types/events";
import { ClickableTableRow } from "@/components/ui/clickable-table-row";
import { StatusPill } from "@/components/ui/StatusPill";
import { colors } from "@/styles/colors";
import { EventRow, Event } from "../events/components/EventRow";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

// Type for the event data returned from Supabase
type EventDbRow = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  location: string;
  status: string;
  attendee_count: number;
  description?: string;
  type?: string;
  parent_event_id?: string;
  created_at: string;
  updated_at: string;
};

// Format date to display in a clean way
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function EventsPage() {
  const t = await getI18n();
  const locale = "en"; // This would come from your i18n setup
  const supabase = createServerComponentClient({ cookies });
  
  // Fetch events
  const { data: eventsData, error } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });
    
  // Transform data to match our Event component interface
  const events = eventsData?.map((event: EventDbRow) => ({
    id: event.id,
    name: event.name,
    description: event.description,
    date: formatDate(event.start_date),
    location: event.location,
    status: event.status as 'draft' | 'confirmed' | 'cancelled' | 'pending',
    attendeeCount: event.attendee_count || 0,
  })) as Event[] || [];

  return (
    <div className="px-6 py-6" style={{ backgroundColor: colors.background.page }}>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: colors.text.primary }}>Events</h1>
        <PrimaryButton href={`/${locale}/events/new`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1.5">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Create Event
        </PrimaryButton>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-56 border rounded-lg" 
             style={{ borderColor: colors.border.subtle, backgroundColor: colors.background.card }}>
          <p className="mb-2 font-medium" style={{ color: colors.text.secondary }}>No events found</p>
          <p className="text-sm" style={{ color: colors.text.tertiary }}>
            Create your first event to get started with your planning
          </p>
        </div>
      ) : (
        // Linear-style table view with our updated components
        <div className="border rounded-md overflow-hidden shadow-sm" 
             style={{ borderColor: colors.border.subtle, backgroundColor: colors.background.card }}>
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: colors.border.subtle }}>
                <th className="text-left px-4 py-3 text-[13px] font-medium uppercase tracking-wider"
                    style={{ color: colors.text.tertiary }}>Event</th>
                <th className="text-left px-4 py-3 text-[13px] font-medium uppercase tracking-wider"
                    style={{ color: colors.text.tertiary }}>Date</th>
                <th className="text-left px-4 py-3 text-[13px] font-medium uppercase tracking-wider"
                    style={{ color: colors.text.tertiary }}>Location</th>
                <th className="text-left px-4 py-3 text-[13px] font-medium uppercase tracking-wider"
                    style={{ color: colors.text.tertiary }}>Status</th>
                <th className="w-5"></th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <EventRow key={event.id} event={event} locale={locale} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 