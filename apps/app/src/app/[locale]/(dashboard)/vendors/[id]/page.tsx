'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Vendor } from '@/types/vendor';
import { EventStatus } from '@/types/events';
import { DocumentsSectionReadonly } from '@/components/vendors/documents-section-readonly';
import { StatusPill } from '@/components/ui/StatusPill';
import { colors } from '@/styles/colors';

// Type for events assigned to this vendor
interface EventAssignment {
  id: string;
  eventId: string;
  vendorId: string;
  role?: string | null;
  budget?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  event: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    location: string;
    status: EventStatus;
    attendeeCount: number;
    description?: string;
    createdAt: string;
    updatedAt: string;
  };
}

// Add a mapping function to convert event status to our StatusPill types
function mapEventStatusToType(status: string): 'confirmed' | 'draft' | 'cancelled' | 'pending' {
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

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;
  
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [assignedEvents, setAssignedEvents] = useState<EventAssignment[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentQuery, setAssignmentQuery] = useState('');
  const [availableEvents, setAvailableEvents] = useState<Array<{id: string, name: string, startDate: string}>>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Fetch vendor data
  useEffect(() => {
    async function loadVendor() {
      try {
        const response = await fetch(`/api/vendors/${vendorId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch vendor: ${response.status}`);
        }
        
        const data = await response.json();
        if (!data) throw new Error('Vendor not found');
        
        // Extract vendor data from the nested 'data' property
        setVendor(data.data);
      } catch (err) {
        console.error('Error loading vendor:', err);
        setError(err instanceof Error ? err.message : 'Failed to load vendor');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadVendor();
  }, [vendorId]);

  // Fetch events assigned to this vendor
  useEffect(() => {
    async function loadAssignedEvents() {
      if (!vendor) return;
      
      try {
        setEventsLoading(true);
        const response = await fetch(`/api/vendors/${vendorId}/events`);
        
        if (!response.ok) {
          console.error(`Error fetching assigned events: ${response.status}`);
          return;
        }
        
        const data = await response.json();
        setAssignedEvents(data.data || []);
      } catch (err) {
        console.error('Error loading assigned events:', err);
      } finally {
        setEventsLoading(false);
      }
    }
    
    loadAssignedEvents();
  }, [vendor, vendorId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Fetch available events for assignment
  const fetchAvailableEvents = useCallback(async () => {
    if (!vendor) return;
    
    try {
      setIsLoadingEvents(true);
      const response = await fetch(`/api/events?exclude=${assignedEvents.map(a => a.eventId).join(',')}&search=${assignmentQuery}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }
      
      const data = await response.json();
      setAvailableEvents(data.data || []);
    } catch (err) {
      console.error('Error fetching available events:', err);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [assignedEvents, assignmentQuery, vendor]);
  
  // Fetch events when dropdown opens or query changes
  useEffect(() => {
    if (dropdownOpen) {
      fetchAvailableEvents();
    }
  }, [dropdownOpen, assignmentQuery, fetchAvailableEvents]);
  
  // Assign this vendor to an event
  const assignToEvent = async (eventId: string, eventName: string, eventDate: string) => {
    try {
      setIsAssigning(true);
      
      // Create an optimistic assignment
      const optimisticAssignment: EventAssignment = {
        id: `temp-${Date.now()}`, // Temporary ID for optimistic update
        eventId,
        vendorId: vendorId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        event: {
          id: eventId,
          name: eventName,
          startDate: eventDate,
          endDate: eventDate, // Temporary, will be updated with real data
          location: '',
          status: 'draft' as EventStatus,
          attendeeCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
      
      // Optimistically update UI
      setAssignedEvents(prev => [...prev, optimisticAssignment]);
      
      // Close the dropdown
      setDropdownOpen(false);
      setAssignmentQuery('');
      
      // Make API call
      const response = await fetch(`/api/events/${eventId}/vendors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vendorId: vendorId
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to assign vendor: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Replace optimistic assignment with real data
      setAssignedEvents(prev => 
        prev.map(assignment => 
          assignment.id === optimisticAssignment.id ? 
            {...assignment, id: data.data.id} : 
            assignment
        )
      );
    } catch (err) {
      console.error('Error assigning vendor to event:', err);
      
      // Remove optimistic assignment on error
      setAssignedEvents(prev => 
        prev.filter(assignment => assignment.id !== `temp-${Date.now()}`)
      );
      
      alert('Failed to assign vendor to event. Please try again.');
    } finally {
      setIsAssigning(false);
    }
  };
  
  // Filter available events based on search query
  const filteredEvents = assignmentQuery.trim() === '' 
    ? availableEvents
    : availableEvents.filter(event => 
        event.name.toLowerCase().includes(assignmentQuery.toLowerCase())
      );
  
  // Helper to display price tier
  const getPriceDisplay = (tier: number) => {
    const symbols = Array(tier).fill('$').join('');
    const labels = ['Budget', 'Moderate', 'Premium', 'Luxury'];
    return `${symbols} - ${labels[tier - 1]}`;
  };
  
  // Handle delete vendor
  const handleDelete = useCallback(async () => {
    if (!confirm("Are you sure you want to delete this vendor? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/vendors/${vendorId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete vendor");
      }

      router.push("/en/vendors");
      router.refresh();
    } catch (error) {
      console.error("Error deleting vendor:", error);
      alert("Failed to delete vendor. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }, [vendorId, router]);
  
  // Remove event assignment
  const removeEventAssignment = async (assignmentId: string, eventId: string) => {
    try {
      // Call the same API endpoint but in reverse direction
      const response = await fetch(`/api/events/${eventId}/vendors/${vendorId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to remove assignment: ${response.status}`);
      }
      
      // Optimistically update UI by removing this assignment
      setAssignedEvents(prev => prev.filter(a => a.id !== assignmentId));
      
    } catch (err) {
      console.error('Error removing event assignment:', err);
      alert('Failed to remove assignment. Please try again.');
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48" style={{ backgroundColor: colors.background.page }}>
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 rounded-full" style={{ borderColor: colors.text.secondary }}></div>
      </div>
    );
  }
  
  // Error state
  if (error || !vendor) {
    return (
      <div className="p-6" style={{ backgroundColor: colors.background.page }}>
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-md">
          <h3 className="font-medium mb-1">Error</h3>
          <p>{error || 'Vendor not found'}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 w-full max-w-7xl mx-auto" style={{ backgroundColor: colors.background.page }}>
      {/* Header section with breadcrumb and buttons */}
      <div className="mb-6">
        <Link 
          href="/en/vendors" 
          className="inline-flex items-center text-sm mb-4 hover:text-white transition-colors"
          style={{ color: colors.text.tertiary }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
            <path d="M19 12H5M5 12L12 19M5 12L12 5"/>
          </svg>
          Back to vendors
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold mb-1" style={{ color: colors.text.primary }}>{vendor.name}</h1>
            <div className="flex items-center gap-3">
              <span className="text-sm capitalize" style={{ color: colors.text.secondary }}>{vendor.category}</span>
              {vendor.location && (
                <>
                  <span className="text-sm px-1" style={{ color: colors.text.tertiary }}>•</span>
                  <span className="text-sm" style={{ color: colors.text.secondary }}>{vendor.location}</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3 py-1.5 bg-[#1E1E1E] hover:bg-[#2A2A2A] text-sm font-medium rounded border border-[#333333] transition-colors duration-120 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: colors.background.card, 
                borderColor: colors.border.subtle,
                color: colors.text.secondary
              }}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
            <Link 
              href={`/en/vendors/${vendor.id}/edit`}
              className="px-3 py-1.5 bg-[#5E6AD2] hover:bg-[#6872E5] text-white text-sm font-medium rounded border border-transparent hover:border-[#8D95F2] transition-colors duration-120"
            >
              Edit Vendor
            </Link>
          </div>
        </div>
      </div>
      
      {/* Content grid - main information and sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Info panel */}
          <div className="rounded-md p-5 border shadow-sm" style={{ 
            backgroundColor: colors.background.card,
            borderColor: colors.border.subtle
          }}>
            <h2 className="text-[15px] font-medium mb-4" style={{ color: colors.text.primary }}>Vendor Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <h3 className="text-[13px] font-medium text-gray-400 mb-1">Category</h3>
                <p className="text-[15px] text-white capitalize">{vendor.category}</p>
              </div>
              
              <div>
                <h3 className="text-[13px] font-medium text-gray-400 mb-1">Price Tier</h3>
                <p className="text-[15px] text-white">
                  {getPriceDisplay(vendor.priceTier)}
                </p>
              </div>
              
              <div>
                <h3 className="text-[13px] font-medium text-gray-400 mb-1">Capacity</h3>
                <p className="text-[15px] text-white">{vendor.capacity || '—'}</p>
              </div>
            </div>
          </div>
          
          {/* Contact Information */}
          <section className="space-y-6">
            <div className="pb-1 mb-2 border-b border-[#1F1F1F]">
              <h2 className="text-[15px] font-medium text-gray-400">Contact Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <h3 className="text-[13px] font-medium text-gray-400 mb-1">Contact Name</h3>
                <p className="text-[15px] text-white">{vendor.contactName || '—'}</p>
              </div>
              
              <div>
                <h3 className="text-[13px] font-medium text-gray-400 mb-1">Contact Phone</h3>
                <p className="text-[15px] text-white">{vendor.contactPhone || '—'}</p>
              </div>
              
              <div>
                <h3 className="text-[13px] font-medium text-gray-400 mb-1">Contact Email</h3>
                <p className="text-[15px] text-white">
                  {vendor.contactEmail ? (
                    <a 
                      href={`mailto:${vendor.contactEmail}`} 
                      className="text-[#5E6AD2] hover:underline"
                    >
                      {vendor.contactEmail}
                    </a>
                  ) : '—'}
                </p>
              </div>
              
              <div>
                <h3 className="text-[13px] font-medium text-gray-400 mb-1">Website</h3>
                <p className="text-[15px] text-white">
                  {vendor.website ? (
                    <a 
                      href={vendor.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[#5E6AD2] hover:underline inline-flex items-center"
                    >
                      {vendor.website.replace(/^https?:\/\//, '')}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="ml-1 opacity-70">
                        <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </a>
                  ) : '—'}
                </p>
              </div>
            </div>
          </section>
          
          {/* Notes */}
          {vendor.notes && (
            <section className="space-y-4">
              <div className="pb-1 mb-2 border-b border-[#1F1F1F]">
                <h2 className="text-[15px] font-medium text-gray-400">Notes</h2>
              </div>
              
              <div className="bg-[#121212] border border-[#1F1F1F] p-4 rounded-md">
                <p className="text-[14px] text-gray-300 whitespace-pre-wrap">{vendor.notes}</p>
              </div>
            </section>
          )}
          
          {/* Documents Section */}
          <section className="space-y-4">
            <DocumentsSectionReadonly vendorId={vendorId} />
          </section>
          
          {/* Assigned Events */}
          <section className="space-y-4">
            <div className="pb-1 mb-2 border-b border-[#1F1F1F] flex justify-between items-center">
              <h2 className="text-[15px] font-medium text-gray-400">Assigned Events</h2>
              {!eventsLoading && assignedEvents.length > 0 && (
                <span className="text-[13px] text-gray-500">{assignedEvents.length} event{assignedEvents.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            
            {eventsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-[#5E6AD2]"></div>
                <span className="ml-3 text-sm text-gray-400">Loading events...</span>
              </div>
            ) : assignedEvents.length === 0 ? (
              <div className="bg-[#121212] border border-[#1F1F1F] rounded-md p-6 text-center">
                <p className="text-[14px] text-gray-400">This vendor is not assigned to any events yet</p>
                <p className="text-[13px] text-gray-500 mt-1">Assign this vendor to events from the event detail page</p>
              </div>
            ) : (
              <div className="space-y-2">
                {assignedEvents.map((assignment) => (
                  <div 
                    key={assignment.id}
                    className="relative bg-[#121212] border border-[#1F1F1F] rounded-md p-4 hover:bg-[#161616] transition-colors duration-150 group"
                  >
                    <Link 
                      href={`/en/events/${assignment.event.id}`}
                      className="block"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-[15px] font-medium text-white group-hover:text-[#5E6AD2] transition-colors duration-150">{assignment.event.name}</h3>
                          <div className="flex items-center mt-2 space-x-3">
                            <EventStatusBadge status={assignment.event.status} />
                            <span className="text-[13px] text-gray-400 flex items-center">
                              <svg className="w-3.5 h-3.5 mr-1.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDate(assignment.event.startDate)}
                            </span>
                            {assignment.event.location && (
                              <span className="text-[13px] text-gray-400 flex items-center">
                                <svg className="w-3.5 h-3.5 mr-1.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {assignment.event.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-1">
                          <svg className="w-5 h-5 text-gray-500 group-hover:text-[#5E6AD2] transition-colors duration-150" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                      
                      {assignment.role && (
                        <div className="mt-3 pt-3 border-t border-[#1A1A1A]">
                          <span className="text-[13px] text-gray-400">
                            <span className="text-gray-500">Role:</span> {assignment.role}
                          </span>
                        </div>
                      )}
                    </Link>
                    
                    {/* Linear-style Remove Button - Only visible on hover */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (confirm("Remove this vendor from the event?")) {
                          removeEventAssignment(assignment.id, assignment.event.id);
                        }
                      }}
                      className="absolute top-3 right-3 p-1 rounded text-gray-500 opacity-0 group-hover:opacity-100 hover:bg-[#1A1A1A] hover:text-red-400 transition-all duration-150"
                      aria-label="Remove assignment"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Assign to Event Action */}
            <div className="mt-4 relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                disabled={isAssigning}
                className="w-full py-2 px-3 bg-[#121212] border border-[#1F1F1F] rounded-md text-[13px] text-gray-400 hover:bg-[#161616] transition-colors duration-150 flex items-center justify-center"
              >
                <svg className="w-3.5 h-3.5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 4v16m-8-8h16" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Assign to event
              </button>
              
              {dropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-[#141414] border border-[#1F1F1F] rounded-md shadow-lg overflow-hidden z-10">
                  <div className="p-2">
                    <input
                      type="text"
                      placeholder="Search events..."
                      value={assignmentQuery}
                      onChange={(e) => setAssignmentQuery(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0C0C0C] border border-[#1F1F1F] rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] placeholder:text-gray-600 transition-colors"
                      autoFocus
                    />
                  </div>
                  
                  <div className="max-h-48 overflow-y-auto">
                    {isLoadingEvents ? (
                      <div className="p-4 text-center">
                        <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-e-transparent text-gray-500 align-[-0.125em]"></div>
                        <span className="ml-2 text-[13px] text-gray-500">Loading events...</span>
                      </div>
                    ) : filteredEvents.length === 0 ? (
                      <div className="p-4 text-center text-[13px] text-gray-500">
                        {assignmentQuery.trim() === '' ? 'No events available' : 'No matching events found'}
                      </div>
                    ) : (
                      <div className="py-1">
                        {filteredEvents.map(event => (
                          <button
                            key={event.id}
                            onClick={() => assignToEvent(event.id, event.name, event.startDate)}
                            disabled={isAssigning}
                            className="w-full text-left px-3 py-2 text-[13px] text-gray-300 hover:bg-[#1A1A1A] transition-colors duration-150 flex items-center justify-between"
                          >
                            <span>{event.name}</span>
                            <span className="text-gray-500 text-[12px]">{formatDate(event.startDate)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// Replace the EventStatusBadge component with our StatusPill
function EventStatusBadge({ status }: { status: string }) {
  return <StatusPill status={mapEventStatusToType(status)} />;
}

// Format date to display in a clean way
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
} 