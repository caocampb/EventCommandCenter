import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
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
    hour: "numeric",
    minute: "2-digit",
  });
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const getStatusStyles = () => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'in-progress':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'completed':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: // draft
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide border ${getStatusStyles()}`}>
      {status}
    </span>
  );
}

// Section header component
function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-[13px] font-medium uppercase tracking-wider text-gray-400 mb-3">
      {title}
    </h3>
  );
}

// Info item component
function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-[13px] text-gray-400 mb-1">{label}</div>
      <div className="text-[14px]">{value}</div>
    </div>
  );
}

// Coming soon badge for MVP features in development
function ComingSoonBadge() {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
      Coming Soon
    </span>
  );
}

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies });
  
  // Fetch event data
  const { data: eventData, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", params.id)
    .single();
    
  if (error || !eventData) {
    return notFound();
  }
  
  // Transform data to match our TypeScript types
  const event: Event = {
    id: eventData.id,
    name: eventData.name,
    startDate: eventData.start_date,
    endDate: eventData.end_date,
    location: eventData.location,
    status: eventData.status,
    attendeeCount: eventData.attendee_count,
    description: eventData.description,
    type: eventData.type,
    parentEventId: eventData.parent_event_id,
    createdAt: eventData.created_at,
    updatedAt: eventData.updated_at,
  };

  return (
    <div className="px-6 py-6">
      {/* Header with back button */}
      <div className="mb-8">
        <Link 
          href="/events" 
          className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1.5">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to events
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-semibold tracking-tight mb-2">{event.name}</h1>
            <div className="flex items-center gap-3">
              <StatusBadge status={event.status} />
              <span className="text-[13px] text-gray-400">
                Created {new Date(event.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button className="px-3 py-1.5 bg-[#1E1E1E] hover:bg-[#2A2A2A] text-sm font-medium rounded border border-[#333333] transition-colors">
              Delete
            </button>
            <Link 
              href={`/events/${event.id}/edit`}
              className="px-3 py-1.5 bg-[#5E6AD2] hover:bg-[#6872E5] text-white text-sm font-medium rounded border border-transparent hover:border-[#8D95F2] transition-colors"
            >
              Edit Event
            </Link>
          </div>
        </div>
      </div>
      
      {/* Main content - simplified for MVP */}
      <div className="space-y-8">
        {/* Essential information panel */}
        <div className="bg-[#141414] border border-[#262626] rounded-md p-5">
          <SectionHeader title="Event Details" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <InfoItem 
              label="Start Date" 
              value={
                <div className="flex items-center">
                  <span className="font-mono text-[15px]">{formatDate(event.startDate.toString())}</span>
                </div>
              } 
            />
            
            <InfoItem 
              label="End Date" 
              value={
                <div className="flex items-center">
                  <span className="font-mono text-[15px]">{formatDate(event.endDate.toString())}</span>
                </div>
              } 
            />
          </div>
          
          <InfoItem 
            label="Location" 
            value={event.location} 
          />
          
          <InfoItem 
            label="Expected Attendees" 
            value={
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                <span>{event.attendeeCount}</span>
              </div>
            } 
          />
          
          {event.description && (
            <InfoItem 
              label="Description" 
              value={
                <div className="prose prose-sm prose-invert max-w-none">
                  <p className="whitespace-pre-line text-[14px] leading-relaxed text-gray-300">
                    {event.description}
                  </p>
                </div>
              } 
            />
          )}
        </div>
        
        {/* Future features - marked clearly */}
        <div className="bg-[#141414] border border-[#262626] rounded-md p-5">
          <div className="flex justify-between items-center mb-3">
            <SectionHeader title="Timeline" />
            <ComingSoonBadge />
          </div>
          
          <p className="text-gray-400 text-sm">
            In the future, you'll be able to create detailed timeline blocks for your event here.
          </p>
          
          <div className="mt-4 border-t border-[#262626] pt-4">
            <div className="flex justify-between items-center mb-3">
              <SectionHeader title="Vendors" />
              <ComingSoonBadge />
            </div>
            
            <p className="text-gray-400 text-sm">
              Vendor management will be available in an upcoming update.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 