'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Vendor } from '@/types/vendor';

// Type for vendor with assignment details
interface AssignedVendor {
  id: string;
  eventId: string;
  vendorId: string;
  role?: string | null;
  budget?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  vendor: Vendor; // Nested vendor data from the API
  assignmentId: string;
}

export default function EventVendorsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignedVendors, setAssignedVendors] = useState<AssignedVendor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Vendor[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [eventName, setEventName] = useState('');
  
  // Load assigned vendors
  useEffect(() => {
    async function loadAssignedVendors() {
      try {
        setIsLoading(true);
        
        // First get the event to display the name
        const eventResponse = await fetch(`/api/events/${eventId}`);
        if (!eventResponse.ok) {
          throw new Error(`Failed to fetch event: ${eventResponse.status}`);
        }
        const eventData = await eventResponse.json();
        setEventName(eventData.data.name);
        
        // Then get the vendors assigned to this event
        const response = await fetch(`/api/events/${eventId}/vendors`);
        if (!response.ok) {
          throw new Error(`Failed to fetch assigned vendors: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API response data:', JSON.stringify(data, null, 2));
        console.log('First vendor in response:', data.data?.[0]);
        setAssignedVendors(data.data || []);
      } catch (err) {
        console.error('Error loading assigned vendors:', err);
        setError(err instanceof Error ? err.message : 'Failed to load vendors');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadAssignedVendors();
  }, [eventId]);
  
  // Debug when assigned vendors change
  useEffect(() => {
    if (assignedVendors.length > 0) {
      console.log('Assigned vendors state:', assignedVendors);
    }
  }, [assignedVendors]);
  
  // Search for vendors to assign
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setIsSearching(true);
      const response = await fetch(`/api/vendors?search=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to search vendors: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Filter out vendors that are already assigned
      const assignedIds = assignedVendors.map(v => v.vendor.id);
      const filteredResults = data.data.filter((v: Vendor) => !assignedIds.includes(v.id));
      
      setSearchResults(filteredResults || []);
    } catch (err) {
      console.error('Error searching vendors:', err);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Assign a vendor to the event
  const assignVendor = async (vendor: Vendor) => {
    try {
      const response = await fetch(`/api/events/${eventId}/vendors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vendorId: vendor.id
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to assign vendor: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add the newly assigned vendor to the list
      const newAssignedVendor: AssignedVendor = {
        ...data.data,
        vendor: vendor
      };
      
      setAssignedVendors(prev => [...prev, newAssignedVendor]);
      
      // Clear the search results that include this vendor
      setSearchResults(prev => prev.filter(v => v.id !== vendor.id));
    } catch (err) {
      console.error('Error assigning vendor:', err);
      alert('Failed to assign vendor. Please try again.');
    }
  };
  
  // Remove a vendor from the event
  const removeVendor = async (assignmentId: string, vendorId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/vendors/${vendorId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to remove vendor: ${response.status}`);
      }
      
      // Remove the vendor from the assigned list
      setAssignedVendors(prev => prev.filter(v => v.assignmentId !== assignmentId));
    } catch (err) {
      console.error('Error removing vendor:', err);
      alert('Failed to remove vendor. Please try again.');
    }
  };
  
  if (isLoading) {
    return (
      <div className="w-full max-w-3xl mx-auto p-6">
        <div className="flex items-center space-x-4">
          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-[#5E6AD2]"></div>
          <p className="text-gray-400">Loading vendors...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="w-full max-w-3xl mx-auto p-6">
        <div className="mb-6">
          <Link 
            href={`/en/events/${eventId}`}
            className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors duration-150"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1.5">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to event
          </Link>
        </div>
        
        <div className="bg-red-500/5 border border-red-500/20 text-red-500 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      {/* Header with back button */}
      <div className="mb-8">
        <Link 
          href={`/en/events/${eventId}`}
          className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4 transition-colors duration-150"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1.5">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to event
        </Link>
        
        <h1 className="text-xl font-semibold tracking-tight mb-1">Vendors for {eventName}</h1>
        <p className="text-sm text-gray-400">Manage the vendors assigned to this event</p>
      </div>

      {/* Search vendors section */}
      <div className="bg-[#141414] border border-[#1F1F1F] rounded-md p-5 mb-6">
        <h2 className="text-[15px] font-medium text-white mb-4">Add Vendors</h2>
        
        <div className="relative mb-5">
          <input
            type="text"
            placeholder="Search for vendors to add..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-[#0C0C0C] border border-[#1F1F1F] rounded-md px-3 py-2 text-[14px] placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] transition-colors duration-120"
          />
          {isSearching && (
            <div className="absolute right-3 top-2.5">
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#5E6AD2]"></div>
            </div>
          )}
        </div>
        
        {searchResults.length > 0 && (
          <div className="border border-[#1F1F1F] rounded-md divide-y divide-[#1F1F1F] mb-2 overflow-hidden">
            {searchResults.slice(0, 5).map((vendor) => (
              <div key={vendor.id} className="flex items-center justify-between py-2 px-3 bg-[#0C0C0C] hover:bg-[#121212] transition-colors duration-120">
                <div>
                  <div className="text-[14px] font-medium text-white">{vendor.name}</div>
                  <div className="text-[13px] text-gray-400 capitalize">{vendor.category}</div>
                </div>
                <button
                  onClick={() => assignVendor(vendor)}
                  className="text-[13px] text-[#5E6AD2] hover:text-[#6872E5] px-2 py-1 rounded-md hover:bg-[#5E6AD2]/10 transition-colors duration-120"
                >
                  Assign
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assigned vendors list */}
      <div className="bg-[#141414] border border-[#1F1F1F] rounded-md">
        <div className="p-5 border-b border-[#1F1F1F]">
          <h2 className="text-[15px] font-medium text-white">Assigned Vendors</h2>
        </div>
        
        {assignedVendors.length === 0 ? (
          <div className="p-5 text-center">
            <p className="text-[14px] text-gray-400">No vendors assigned to this event yet</p>
            <p className="text-[13px] text-gray-500 mt-1">Use the search above to find and assign vendors</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1F1F1F]">
            {assignedVendors.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between p-4 hover:bg-[#161616] transition-colors duration-120">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="text-[14px] font-medium text-white">{assignment.vendor?.name}</span>
                    {assignment.vendor?.isFavorite && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#5E6AD2" className="ml-2">
                        <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" />
                      </svg>
                    )}
                  </div>
                  
                  <div className="flex items-center mt-1">
                    <span className="text-[13px] text-gray-400 capitalize">{assignment.vendor?.category}</span>
                    <span className="mx-2 text-gray-500">•</span>
                    <span className="text-[13px]">
                      <span className="text-gray-300">{'$'.repeat(assignment.vendor?.priceTier || 0)}</span>
                      <span className="text-gray-500">{'$'.repeat(4 - (assignment.vendor?.priceTier || 0))}</span>
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Link 
                    href={`/en/vendors/${assignment.vendor?.id}`}
                    className="text-[13px] text-gray-400 hover:text-white px-2 py-1 rounded-md hover:bg-[#1F1F1F] transition-colors duration-120 mr-2"
                  >
                    View
                  </Link>
                  
                  <button
                    onClick={() => removeVendor(assignment.id, assignment.vendorId)}
                    className="flex items-center text-[13px] text-gray-400 hover:text-red-400 px-2 py-1 rounded-md hover:bg-[#1F1F1F] transition-colors duration-150"
                    aria-label="Remove vendor"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 