'use client';

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import Link from "next/link";
import { Event } from "@/types/events";
import React from 'react';

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
        return 'bg-gray-600/15 text-gray-300 border-gray-500/30';
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

interface EventDetailProps {
  event: Event;
}

export default function EventDetailClient({ event }: EventDetailProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = useCallback(async () => {
    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      router.push("/events");
      router.refresh();
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }, [event.id, router]);

  return (
    <div className="px-6 py-6">
      {/* Header with back button */}
      <div className="mb-8">
        <Link 
          href="/en/events" 
          className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4 transition-colors duration-120"
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
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3 py-1.5 bg-[#1E1E1E] hover:bg-[#2A2A2A] text-sm font-medium rounded border border-[#333333] transition-colors duration-120 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
            <Link 
              href={`/en/events/${event.id}/edit`}
              className="px-3 py-1.5 bg-[#5E6AD2] hover:bg-[#6872E5] text-white text-sm font-medium rounded border border-transparent hover:border-[#8D95F2] transition-colors duration-120"
            >
              Edit Event
            </Link>
            <Link 
              href={`/en/events/${event.id}/timeline`}
              className="px-3 py-1.5 bg-[#1E1E1E] hover:bg-[#2A2A2A] text-sm font-medium rounded border border-[#333333] transition-colors duration-120 flex items-center"
            >
              <svg className="mr-1.5" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" />
                <line x1="9" y1="2" x2="9" y2="6" stroke="currentColor" strokeWidth="2" />
                <line x1="15" y1="2" x2="15" y2="6" stroke="currentColor" strokeWidth="2" />
              </svg>
              Timeline
            </Link>
          </div>
        </div>
      </div>
      
      {/* Main content - simplified for MVP */}
      <div className="space-y-8">
        {/* Essential information panel */}
        <div className="bg-[#141414] border border-[#1F1F1F] rounded-md p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
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
        <div className="bg-[#141414] border border-[#1F1F1F] rounded-md p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <div className="flex justify-between items-center mb-3">
            <SectionHeader title="Timeline" />
            <ComingSoonBadge />
          </div>
          
          <p className="text-gray-400 text-sm">
            In the future, you'll be able to create detailed timeline blocks for your event here.
          </p>
          
          <div className="mt-4 border-t border-[#1F1F1F] pt-4">
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