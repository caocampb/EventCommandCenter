import { getI18n } from "@/locales/server";
import Link from "next/link";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Event } from "@/types/events";

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

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const getStatusStyles = () => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-500/10 text-emerald-500';
      case 'in-progress':
        return 'bg-blue-500/10 text-blue-500';
      case 'completed':
        return 'bg-purple-500/10 text-purple-500';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500';
      default: // draft
        return 'bg-gray-500/10 text-gray-400';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tracking-wide ${getStatusStyles()}`}>
      {status}
    </span>
  );
}

export default async function EventsPage() {
  const t = await getI18n();
  const supabase = createServerComponentClient({ cookies });
  
  // Fetch events
  const { data: eventsData, error } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });
    
  // Transform data to match our TypeScript types
  const events = eventsData?.map((event: EventDbRow) => ({
    id: event.id,
    name: event.name,
    startDate: event.start_date,
    endDate: event.end_date,
    location: event.location,
    status: event.status,
    attendeeCount: event.attendee_count,
    description: event.description,
    type: event.type,
    parentEventId: event.parent_event_id,
    createdAt: event.created_at,
    updatedAt: event.updated_at,
  })) as Event[] || [];

  return (
    <div className="px-6 py-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Events</h1>
        <Link
          href="/events/new"
          className="inline-flex items-center px-4 py-2 bg-[#5E6AD2] hover:bg-[#6872E5] text-white text-sm font-medium rounded-md transition duration-150 border border-transparent hover:border-[#8D95F2] shadow-sm hover:shadow"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1.5">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Create Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-56 border border-[#262626] rounded-lg bg-[#141414]">
          <p className="text-gray-400 mb-2 font-medium">No events found</p>
          <p className="text-gray-500 text-sm">
            Create your first event to get started with your planning
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((event) => (
            <Link href={`/events/${event.id}`} key={event.id}>
              <div className="group border border-[#262626] rounded-md bg-[#141414] hover:bg-[#1A1A1A] transition-all duration-150 overflow-hidden">
                <div className="px-5 py-5">
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-[15px] font-medium text-gray-100 group-hover:text-white transition-colors duration-150">{event.name}</h2>
                    <StatusBadge status={event.status} />
                  </div>
                  
                  <p className="text-[13px] text-gray-400 mb-4 font-medium tracking-tight">
                    {formatDate(event.startDate.toString())}
                    {event.endDate && 
                      event.startDate !== event.endDate && 
                      ` - ${formatDate(event.endDate.toString())}`}
                  </p>
                  
                  <div className="flex flex-col gap-1.5">
                    <div className="text-[13px] text-gray-300">
                      {event.location}
                    </div>
                    
                    {event.description && (
                      <p className="text-[13px] text-gray-400 mt-1 line-clamp-1">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Linear-style subtle highlight indicator on hover */}
                <div className="h-0.5 w-full bg-[#5E6AD2] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-150 origin-left"></div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 