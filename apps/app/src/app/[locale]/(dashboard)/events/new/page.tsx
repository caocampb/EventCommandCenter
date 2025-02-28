import { getI18n } from "@/locales/server";
import { CreateEventForm } from "@/components/events/create-event-form";
import Link from "next/link";

export const metadata = {
  title: "Create Event",
};

export default async function CreateEventPage() {
  const t = await getI18n();

  return (
    <div className="w-full max-w-6xl px-6 py-6">
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
        
        <h1 className="text-xl font-semibold tracking-tight mb-2">Create New Event</h1>
        <p className="text-gray-400 text-[15px]">
          Create a new event to start planning your timeline, vendors, and budget.
        </p>
      </div>
    
      <div className="border-t border-[#1F1F1F] pt-8">
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1">
            <CreateEventForm />
          </div>
          
          {/* Quick tips - helpful for users without cluttering the UI */}
          <div className="w-full lg:w-72 space-y-5">
            <div className="bg-[#141414] border border-[#1F1F1F] rounded-md p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              <h3 className="text-[13px] font-medium uppercase tracking-wider text-gray-400 mb-3">
                Quick Tips
              </h3>
              <ul className="space-y-3 text-[13px] text-gray-400">
                <li className="flex gap-2.5 items-start">
                  <span className="text-[#5E6AD2] text-xs mt-0.5">●</span>
                  <span>Include setup and breakdown time in your dates</span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="text-[#5E6AD2] text-xs mt-0.5">●</span>
                  <span>Be specific with your location for easier coordination</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 