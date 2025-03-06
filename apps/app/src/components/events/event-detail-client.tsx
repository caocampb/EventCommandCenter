'use client';

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import Link from "next/link";
import { Event, EventStatus } from "@/types/events";
import React from 'react';
import { StatusPill } from "@/components/ui/StatusPill";

// Vendor related types
interface Vendor {
  id: string;
  name: string | null;
  [key: string]: any;
}

// Update interfaces to match the actual data structure from the API
interface VendorAssignment {
  id: string;
  event_id: string;
  vendor_id: string; // Simplified to match how we're transforming data
  vendors: {
    id?: string;
    name: string | null;
    [key: string]: any;
  } | null;
}

// Timeline related types
interface TimelineBlock {
  id: string;
  event_id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
}

// Budget related types
interface BudgetItem {
  id: string;
  event_id: string;
  planned_amount: number;
  actual_amount: number;
}

// Participant related types
interface EventParticipant {
  id: string;
  event_id: string;
  participant_id: string;
}

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

// Format simple date (no time)
function formatSimpleDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Calculate days between two dates
function getDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
      className="font-medium text-[15px] mb-3 pb-2 text-theme-text-primary border-b border-theme-border-subtle" 
    >
      {title}
    </h2>
  );
}

// Info item component
function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-[13px] mb-1 text-theme-text-tertiary">{label}</div>
      <div className="text-[14px] text-theme-text-primary">{value}</div>
    </div>
  );
}

// Compact Card component for related items
function CompactCard({ title, value, children }: { title: string, value: string | number, children: React.ReactNode }) {
  return (
    <div className="p-3 rounded-md bg-theme-bg-card">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-xs uppercase tracking-wider text-theme-text-tertiary">{title}</h4>
        <span className="text-xs font-medium text-theme-primary">{value}</span>
      </div>
      <div className="flex gap-1">
        {children}
      </div>
    </div>
  );
}

interface EventDetailProps {
  event: Event;
}

// A simple type guard to narrow the type
function isString(value: any): value is string {
  return typeof value === 'string';
}

/**
 * Generate a color based on vendor ID
 * Note: Added ts-expect-error to silence TypeScript warnings about string | undefined
 */
function getVendorColor(vendorId: unknown): string {
  // Palette of colors
  const colors = [
    '#5E6AD2', // blue
    '#26B5CE', // teal
    '#38A169', // green
    '#E2B039', // yellow
    '#DD6B20', // orange
    '#E53E3E', // red
    '#805AD5'  // purple
  ];
  
  // Default color when null/undefined
  if (!vendorId) {
    // @ts-expect-error TypeScript can't infer string but we know colors[0] is always a string
    return colors[0];
  }
  
  // Convert to string and calculate hash
  const str = String(vendorId);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash += str.charCodeAt(i);
  }
  
  // @ts-expect-error TypeScript can't infer string but we know colors[index] is always a string
  return colors[hash % colors.length];
}

export default function EventDetailClient({ event }: EventDetailProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [timelineBlocks, setTimelineBlocks] = useState<TimelineBlock[]>([]);
  const [timelineProgress, setTimelineProgress] = useState(0);
  const [vendors, setVendors] = useState<VendorAssignment[]>([]);
  const [budgetInfo, setBudgetInfo] = useState({ total: 0, allocated: 0 });
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Fetch related data
  useEffect(() => {
    const fetchTimelineData = async () => {
      try {
        const { data, error } = await supabase
          .from("timeline_blocks")
          .select("*")
          .eq("event_id", event.id);
          
        if (error) throw error;
        
        setTimelineBlocks(data || []);
        
        // Calculate progress
        const completedBlocks = data?.filter(block => block.status === 'completed') || [];
        const progress = data?.length ? Math.round((completedBlocks.length / data.length) * 100) : 0;
        setTimelineProgress(progress);
      } catch (error) {
        console.error("Error fetching timeline data:", error);
      }
    };
    
    const fetchVendors = async () => {
      try {
        // Use the same API endpoint that other parts of the app use
        const response = await fetch(`/api/events/${event.id}/vendors`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch vendors: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Transform the data to match the expected structure with proper types
        const transformedVendors = (result.data || []).map((item: any) => ({
          id: item.id || `temp-${Math.random().toString(36).substring(2, 9)}`,
          event_id: item.eventId || event.id,
          // Ensure vendor_id is always a string by using empty string as fallback
          vendor_id: typeof item.vendorId === 'string' ? item.vendorId : "",
          vendors: item.vendor ? {
            id: item.vendor.id || "",
            name: typeof item.vendor.name === 'string' ? item.vendor.name : "Unnamed Vendor",
            ...item.vendor
          } : null
        }));
        
        setVendors(transformedVendors);
      } catch (error) {
        console.error("Error fetching vendors:", error);
        setVendors([]);
      }
    };
    
    const fetchBudgetInfo = async () => {
      try {
        // Use the same API endpoint that the budget page uses
        const response = await fetch(`/api/events/${event.id}/budget`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch budget data: ${response.status}`);
        }
        
        const { data, totals } = await response.json();
        
        // The API returns properly formatted data with consistent naming
        setBudgetInfo({ 
          total: totals?.plannedTotal || 0, 
          allocated: totals?.actualTotal || 0 
        });
      } catch (error) {
        console.error("Error fetching budget data:", error);
        setBudgetInfo({ total: 0, allocated: 0 });
      }
    };
    
    const fetchParticipants = async () => {
      try {
        const { data, error } = await supabase
          .from("event_participants")
          .select("*")
          .eq("event_id", event.id);
          
        if (error) throw error;
        setParticipants(data || []);
      } catch (error) {
        console.error("Error fetching participants:", error);
      }
    };
    
    fetchTimelineData();
    fetchVendors();
    fetchBudgetInfo();
    fetchParticipants();
  }, [event.id, supabase]);

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

  const handleStatusChange = async (newStatus: EventStatus) => {
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update event status");
      }

      // Update local state
      router.refresh();
    } catch (error) {
      console.error("Error updating event status:", error);
      alert("Failed to update event status. Please try again.");
    } finally {
      setIsUpdatingStatus(false);
      setIsStatusOpen(false);
    }
  };

  // Helper to safely get vendor initial
  function getVendorInitial(vendor: VendorAssignment): string {
    // Safely access the vendor name with fallback
    const vendorName = vendor?.vendors?.name || '';
    if (!vendorName) return 'V';
    
    // For multi-word names, take first letter of first and second words
    const words = vendorName.trim().split(/\s+/);
    
    // Get first two initials if available
    const firstInitial = words[0]?.[0] || '';
    const secondInitial = words.length > 1 ? words[1]?.[0] || '' : '';
    
    if (firstInitial && secondInitial) {
      return (firstInitial + secondInitial).toUpperCase();
    }
    
    // For single word names, take first letter
    return firstInitial.toUpperCase() || 'V';
  }

  function getVendorDisplayName(vendor: VendorAssignment, index: number): string {
    return vendor?.vendors?.name || `Vendor ${index + 1}`;
  }

  return (
    <div className="px-6 py-6 bg-theme-bg-page">
      {/* Header with back button */}
      <div className="mb-8">
        <Link 
          href="/en/events" 
          className="inline-flex items-center text-sm hover:text-white mb-4 transition-colors duration-120 text-theme-text-tertiary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1.5">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to events
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-semibold tracking-tight mb-2 text-theme-text-primary">{event.name}</h1>
            <div className="flex items-center gap-3">
              {/* Status selector dropdown - Linear-style */}
              <div className="relative">
                <button 
                  onClick={() => setIsStatusOpen(!isStatusOpen)}
                  disabled={isUpdatingStatus}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-colors duration-50 
                    ${event.status === 'confirmed' ? 'bg-theme-status-confirmed-bg text-theme-status-confirmed-text border-theme-status-confirmed-text/30' : ''}
                    ${event.status === 'draft' ? 'bg-theme-status-draft-bg text-theme-status-draft-text border-theme-status-draft-text/30' : ''}
                    ${event.status === 'cancelled' ? 'bg-theme-status-cancelled-bg text-theme-status-cancelled-text border-theme-status-cancelled-text/30' : ''}
                    ${event.status === 'in-progress' ? 'bg-theme-status-pending-bg text-theme-status-pending-text border-theme-status-pending-text/30' : ''}
                    ${event.status === 'completed' ? 'bg-theme-status-confirmed-bg text-theme-status-confirmed-text border-theme-status-confirmed-text/30' : ''}
                  `}
                >
                  <span>{event.status.charAt(0).toUpperCase() + event.status.slice(1).replace('-', ' ')}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                
                {isStatusOpen && (
                  <div 
                    className="absolute z-10 mt-1 w-48 rounded-md shadow-lg bg-theme-bg-card border border-theme-border-subtle"
                  >
                    <div className="py-1">
                      {['draft', 'confirmed', 'in-progress', 'completed', 'cancelled'].map((status) => (
                        <button
                          key={status}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-theme-bg-hover text-theme-text-secondary"
                          onClick={() => handleStatusChange(status as EventStatus)}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <span className="text-[13px] text-theme-text-tertiary">
                Created {new Date(event.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3 py-1.5 text-sm font-medium rounded border transition-colors duration-120 disabled:opacity-50 disabled:cursor-not-allowed bg-theme-bg-card border-theme-border-subtle text-theme-text-secondary hover:bg-theme-bg-hover hover:text-[#ED6B6B]"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
            <Link 
              href={`/en/events/${event.id}/edit`}
              className="px-3 py-1.5 text-white text-sm font-medium rounded border transition-colors duration-120 bg-theme-primary border-transparent hover:bg-theme-primary-hover hover:border-[#8D95F2]"
            >
              Edit Event
            </Link>
            <div className="flex gap-3">
              <Link 
                href={`/en/events/${event.id}/timeline`}
                className="px-3 py-1.5 text-sm font-medium rounded border transition-colors duration-120 flex items-center bg-theme-bg-card border-theme-border-subtle text-theme-text-secondary hover:bg-theme-bg-hover hover:text-theme-text-primary"
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
                className="px-3 py-1.5 text-sm font-medium rounded border transition-colors duration-120 flex items-center bg-theme-bg-card border-theme-border-subtle text-theme-text-secondary hover:bg-theme-bg-hover hover:text-theme-text-primary"
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
                className="px-3 py-1.5 text-sm font-medium rounded border transition-colors duration-120 flex items-center bg-theme-bg-card border-theme-border-subtle text-theme-text-secondary hover:bg-theme-bg-hover hover:text-theme-text-primary"
              >
                <svg className="mr-1.5" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1V23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 5H9.5C7.01472 5 5 7.01472 5 9.5C5 11.9853 7.01472 14 9.5 14H14.5C16.9853 14 19 16.0147 19 18.5C19 20.9853 16.9853 23 14.5 23H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Budget
              </Link>
              <Link 
                href={`/en/events/${event.id}/participants`}
                className="px-3 py-1.5 text-sm font-medium rounded border transition-colors duration-120 flex items-center bg-theme-bg-card border-theme-border-subtle text-theme-text-secondary hover:bg-theme-bg-hover hover:text-theme-text-primary"
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
      
      {/* Main content - with Linear-inspired improvements */}
      <div className="space-y-8">
        {/* Essential information panel */}
        <div className="rounded-md p-5 shadow-sm bg-theme-bg-card border border-theme-border-subtle">
          <SectionHeader title="Event Details" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <InfoItem 
              label="Start date" 
              value={
                <span className="font-mono text-[15px] text-theme-text-primary">{formatDate(event.startDate.toString())}</span>
              } 
            />
            
            <InfoItem 
              label="End date" 
              value={
                <span className="font-mono text-[15px] text-theme-text-primary">{formatDate(event.endDate.toString())}</span>
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
                <svg className="w-4 h-4 mr-1.5 text-theme-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                <span className="text-theme-text-primary">{event.attendeeCount}</span>
              </div>
            } 
          />
          
          {event.description && (
            <InfoItem 
              label="Description" 
              value={
                <div className="prose prose-sm prose-invert max-w-none">
                  <p className="whitespace-pre-line text-[14px] leading-relaxed text-theme-text-primary">
                    {event.description}
                  </p>
                </div>
              } 
            />
          )}
        </div>
        
        {/* Timeline Progress - Linear-inspired compact visualization */}
        <div className="pt-6 border-t border-theme-border-subtle">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-theme-text-secondary">Timeline Progress</h3>
            <Link href={`/en/events/${event.id}/timeline`} className="text-xs font-medium text-theme-primary">
              View Timeline
            </Link>
          </div>
          
          <div className="h-2 w-full rounded-full overflow-hidden bg-theme-border-subtle">
            <div className="h-full rounded-full bg-theme-primary" style={{ width: `${timelineProgress}%` }}></div>
          </div>
          
          <div className="flex justify-between text-xs mt-1 text-theme-text-tertiary">
            <span>{formatSimpleDate(event.startDate.toString())}</span>
            <span>{timelineProgress}% Complete</span>
            <span>{formatSimpleDate(event.endDate.toString())}</span>
          </div>
        </div>
        
        {/* Related items summary - Linear-inspired compact cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <CompactCard title="Vendors" value={vendors.length}>
            {vendors.length > 0 ? (
              <div className="flex items-center mt-2 space-x-2">
                {vendors.slice(0, 3).map((vendor, idx) => (
                  <div
                    key={vendor?.id || `vendor-${idx}`}
                    className="group relative h-8 w-8 rounded-full flex items-center justify-center"
                    style={{ 
                      backgroundColor: getVendorColor(vendor?.vendor_id), 
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold' 
                    }}
                    title={getVendorDisplayName(vendor, idx)}
                  >
                    {getVendorInitial(vendor)}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {getVendorDisplayName(vendor, idx)}
                    </div>
                  </div>
                ))}
                {vendors.length > 3 && (
                  <div className="h-8 w-8 rounded-full flex items-center justify-center bg-gray-200 text-gray-700 text-xs">
                    +{vendors.length - 3}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-xs text-theme-text-tertiary">No vendors assigned</span>
            )}
          </CompactCard>
          
          <CompactCard title="Budget" value={`$${budgetInfo.allocated.toLocaleString()}`}>
            {budgetInfo.total > 0 ? (
              <div className="w-full">
                <div className="h-1 w-full rounded-full overflow-hidden bg-theme-border-subtle">
                  <div 
                    className={`h-full rounded-full ${budgetInfo.allocated > budgetInfo.total ? 'bg-red-500' : 'bg-theme-status-confirmed-text'}`} 
                    style={{ 
                      width: budgetInfo.total ? `${Math.min(100, (budgetInfo.allocated / budgetInfo.total) * 100)}%` : '0%' 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className={`text-[10px] flex items-center ${budgetInfo.allocated > budgetInfo.total ? 'text-red-500' : 'text-theme-text-tertiary'}`}>
                    {budgetInfo.total ? (
                      budgetInfo.allocated > budgetInfo.total ? (
                        <>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-0.5">
                            <path d="M12 9V14M12 17.5V17.51M6.6 20H17.4C18.8852 20 19.6279 20 20.1613 19.6955C20.6265 19.4272 20.9944 19.0178 21.2251 18.5264C21.5 17.9558 21.5 17.2055 21.5 15.7051V8.29492C21.5 6.79449 21.5 6.04428 21.2251 5.47367C20.9944 4.98215 20.6265 4.57284 20.1613 4.30448C19.6279 4 18.8852 4 17.4 4H6.6C5.11477 4 4.37215 4 3.83869 4.30448C3.37346 4.57284 3.00558 4.98215 2.77487 5.47367C2.5 6.04428 2.5 6.79449 2.5 8.29492V15.7051C2.5 17.2055 2.5 17.9558 2.77487 18.5264C3.00558 19.0178 3.37346 19.4272 3.83869 19.6955C4.37215 20 5.11477 20 6.6 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Over budget
                        </>
                      ) : `${Math.round((budgetInfo.allocated / budgetInfo.total) * 100)}%`
                    ) : '0%'}
                  </span>
                  <span className="text-[10px] text-theme-text-tertiary">
                    Target: ${budgetInfo.total.toLocaleString()}
                  </span>
                </div>
                {budgetInfo.total === 0 && (
                  <button 
                    className="mt-2 text-xs font-medium text-left text-theme-primary"
                    onClick={() => router.push(`/events/${event.id}/budget`)}
                  >
                    Set up budget →
                  </button>
                )}
              </div>
            ) : (
              <div className="w-full">
                <div className="h-1 w-full rounded-full overflow-hidden bg-theme-border-subtle">
                  <div className="h-full rounded-full bg-theme-border-strong" style={{ width: '0%' }}></div>
                </div>
                <div className="mt-2">
                  <button 
                    className="text-xs font-medium text-left text-theme-primary" 
                    onClick={() => router.push(`/events/${event.id}/budget`)}
                  >
                    Set up budget →
                  </button>
                </div>
              </div>
            )}
          </CompactCard>
          
          <CompactCard title="Participants" value={participants.length.toString()}>
            {participants.length > 0 ? (
              <div className="flex flex-col w-full">
                <div className="h-1 w-full rounded-full overflow-hidden bg-theme-border-subtle">
                  <div 
                    className="h-full rounded-full bg-theme-primary" 
                    style={{ 
                      width: event.attendeeCount ? `${Math.min(100, (participants.length / event.attendeeCount) * 100)}%` : '0%' 
                    }}
                  ></div>
                </div>
                <span className="text-[10px] mt-1 text-theme-text-tertiary">
                  {event.attendeeCount ? `${Math.round((participants.length / event.attendeeCount) * 100)}% of capacity` : 'No capacity set'}
                </span>
              </div>
            ) : (
              <span className="text-xs text-theme-text-tertiary">No participants yet</span>
            )}
          </CompactCard>
        </div>
        
        {/* Status-Based Action Items - Linear-inspired workflow */}
        <div className="rounded-md p-4 mt-4 bg-theme-bg-card border border-theme-border-subtle">
          <h3 className="text-sm font-medium mb-3 text-theme-text-secondary">
            Next Steps
          </h3>
          
          <div className="space-y-2">
            {event.status === 'draft' && (
              <>
                <Link 
                  href={`/en/events/${event.id}/timeline/add`}
                  className="flex items-center px-3 py-2 text-sm rounded-md transition-colors hover:bg-theme-bg-hover text-theme-text-secondary"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add first timeline block
                </Link>
                <Link 
                  href={`/en/events/${event.id}/vendors`}
                  className="flex items-center px-3 py-2 text-sm rounded-md transition-colors hover:bg-theme-bg-hover text-theme-text-secondary"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Assign vendors
                </Link>
              </>
            )}
            
            {event.status === 'confirmed' && (
              <>
                <Link 
                  href={`/en/events/${event.id}/participants`}
                  className="flex items-center px-3 py-2 text-sm rounded-md transition-colors hover:bg-theme-bg-hover text-theme-text-secondary"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add participants
                </Link>
                <Link 
                  href={`/en/events/${event.id}/budget`}
                  className="flex items-center px-3 py-2 text-sm rounded-md transition-colors hover:bg-theme-bg-hover text-theme-text-secondary"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Update budget
                </Link>
              </>
            )}
            
            {event.status === 'in-progress' && (
              <>
                <Link 
                  href={`/en/events/${event.id}/timeline`}
                  className="flex items-center px-3 py-2 text-sm rounded-md transition-colors hover:bg-theme-bg-hover text-theme-text-secondary"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Update timeline progress
                </Link>
              </>
            )}
            
            {event.status === 'completed' && (
              <div className="flex items-center px-3 py-2 text-sm rounded-md text-theme-text-tertiary">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Event completed
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 