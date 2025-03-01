'use client';

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import Link from "next/link";
import { Event } from "@/types/events";
import React from 'react';
import { StatusPill } from "@/components/ui/StatusPill";
import { colors } from "@/styles/colors";

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

// Mapping helper to convert app status to our StatusPill types
function mapStatusToType(status: string): 'confirmed' | 'draft' | 'cancelled' | 'pending' {
  switch (status) {
    case 'confirmed':
      return 'confirmed';
    case 'draft':
      return 'draft';
    case 'in-progress':
      return 'pending';
    case 'completed':
      return 'confirmed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'draft';
  }
}

// Section header component
function SectionHeader({ title }: { title: string }) {
  return (
    <h2 
      className="font-medium text-[15px] mb-3 pb-2" 
      style={{ 
        color: colors.text.primary,
        borderBottom: `1px solid ${colors.border.subtle}`
      }}
    >
      {title}
    </h2>
  );
}

// Info item component
function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-[13px] mb-1" style={{ color: colors.text.tertiary }}>{label}</div>
      <div className="text-[14px]" style={{ color: colors.text.primary }}>{value}</div>
    </div>
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
    <div className="px-6 py-6" style={{ backgroundColor: colors.background.page }}>
      {/* Header with back button */}
      <div className="mb-8">
        <Link 
          href="/en/events" 
          className="inline-flex items-center text-sm hover:text-white mb-4 transition-colors duration-120"
          style={{ color: colors.text.tertiary }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1.5">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to events
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-semibold tracking-tight mb-2" style={{ color: colors.text.primary }}>{event.name}</h1>
            <div className="flex items-center gap-3">
              <StatusPill status={mapStatusToType(event.status)} />
              <span className="text-[13px]" style={{ color: colors.text.tertiary }}>
                Created {new Date(event.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3 py-1.5 text-sm font-medium rounded border transition-colors duration-120 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: colors.background.card, 
                borderColor: colors.border.subtle, 
                color: colors.text.secondary
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = colors.background.hover;
                e.currentTarget.style.color = '#ED6B6B'; // Soft red color for delete hover
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = colors.background.card;
                e.currentTarget.style.color = colors.text.secondary;
              }}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
            <Link 
              href={`/en/events/${event.id}/edit`}
              className="px-3 py-1.5 text-white text-sm font-medium rounded border transition-colors duration-120"
              style={{ 
                backgroundColor: colors.primary.default, 
                borderColor: 'transparent',
                borderWidth: '1px',
                color: 'white'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary.hover;
                e.currentTarget.style.borderColor = '#8D95F2'; // Lighter border on hover
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary.default;
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              Edit Event
            </Link>
            <div className="flex gap-3">
              <Link 
                href={`/en/events/${event.id}/timeline`}
                className="px-3 py-1.5 text-sm font-medium rounded border transition-colors duration-120 flex items-center"
                style={{ 
                  backgroundColor: colors.background.card, 
                  borderColor: colors.border.subtle, 
                  color: colors.text.secondary 
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = colors.background.hover;
                  e.currentTarget.style.color = colors.text.primary;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = colors.background.card;
                  e.currentTarget.style.color = colors.text.secondary;
                }}
              >
                <svg className="mr-1.5" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                  <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" />
                  <line x1="9" y1="2" x2="9" y2="6" stroke="currentColor" strokeWidth="2" />
                  <line x1="15" y1="2" x2="15" y2="6" stroke="currentColor" strokeWidth="2" />
                </svg>
                Timeline
              </Link>
              <Link 
                href={`/en/events/${event.id}/vendors`}
                className="px-3 py-1.5 text-sm font-medium rounded border transition-colors duration-120 flex items-center"
                style={{ 
                  backgroundColor: colors.background.card, 
                  borderColor: colors.border.subtle,
                  color: colors.text.secondary
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = colors.background.hover;
                  e.currentTarget.style.color = colors.text.primary;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = colors.background.card;
                  e.currentTarget.style.color = colors.text.secondary;
                }}
              >
                <svg className="mr-1.5" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21V19C17 16.7909 15.2091 15 13 15H5C2.79086 15 1 16.7909 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M23 21V19C22.9986 17.1771 21.765 15.5857 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 3.13C17.7699 3.58317 19.0078 5.17799 19.0078 7.005C19.0078 8.83201 17.7699 10.4268 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Vendors
              </Link>
              <Link 
                href={`/en/events/${event.id}/budget`}
                className="px-3 py-1.5 text-sm font-medium rounded border transition-colors duration-120 flex items-center"
                style={{ 
                  backgroundColor: colors.background.card, 
                  borderColor: colors.border.subtle,
                  color: colors.text.secondary
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = colors.background.hover;
                  e.currentTarget.style.color = colors.text.primary;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = colors.background.card;
                  e.currentTarget.style.color = colors.text.secondary;
                }}
              >
                <svg className="mr-1.5" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1V23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 5H9.5C7.01472 5 5 7.01472 5 9.5C5 11.9853 7.01472 14 9.5 14H14.5C16.9853 14 19 16.0147 19 18.5C19 20.9853 16.9853 23 14.5 23H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Budget
              </Link>
              <Link 
                href={`/en/events/${event.id}/participants`}
                className="px-3 py-1.5 text-sm font-medium rounded border transition-colors duration-120 flex items-center"
                style={{ 
                  backgroundColor: colors.background.card, 
                  borderColor: colors.border.subtle,
                  color: colors.text.secondary
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = colors.background.hover;
                  e.currentTarget.style.color = colors.text.primary;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = colors.background.card;
                  e.currentTarget.style.color = colors.text.secondary;
                }}
              >
                <svg className="mr-1.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                Participants
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content - simplified for MVP */}
      <div className="space-y-8">
        {/* Essential information panel */}
        <div className="rounded-md p-5 shadow-sm" style={{ 
          backgroundColor: colors.background.card,
          borderColor: colors.border.subtle,
          borderWidth: '1px'
        }}>
          <SectionHeader title="Event Details" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <InfoItem 
              label="Start Date" 
              value={
                <div className="flex items-center">
                  <span className="font-mono text-[15px]" style={{ color: colors.text.primary }}>{formatDate(event.startDate.toString())}</span>
                </div>
              } 
            />
            
            <InfoItem 
              label="End Date" 
              value={
                <div className="flex items-center">
                  <span className="font-mono text-[15px]" style={{ color: colors.text.primary }}>{formatDate(event.endDate.toString())}</span>
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
                <span style={{ color: colors.text.primary }}>{event.attendeeCount}</span>
              </div>
            } 
          />
          
          {event.description && (
            <InfoItem 
              label="Description" 
              value={
                <div className="prose prose-sm prose-invert max-w-none">
                  <p className="whitespace-pre-line text-[14px] leading-relaxed text-gray-300" style={{ color: colors.text.primary }}>
                    {event.description}
                  </p>
                </div>
              } 
            />
          )}
        </div>
      </div>
    </div>
  );
} 