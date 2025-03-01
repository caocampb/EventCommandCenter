import { useState, useEffect, useCallback } from 'react';
import type { Vendor } from '@/types/vendor';

// Type for event vendors with assignment details
export interface VendorAssignment {
  id: string;
  eventId: string;
  vendorId: string;
  vendor: Vendor;
}

export function useEventVendors(eventId: string) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventVendors, setEventVendors] = useState<VendorAssignment[]>([]);
  
  // Fetch event vendors
  const fetchEventVendors = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/events/${eventId}/vendors`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch event vendors: ${response.status}`);
      }
      
      const data = await response.json();
      setEventVendors(data.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching event vendors:', err);
      setError(err instanceof Error ? err.message : 'Failed to load vendors');
      // Don't set error state here, as it's not critical to the main functionality
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);
  
  // Initialize on mount
  useEffect(() => {
    fetchEventVendors();
  }, [fetchEventVendors]);
  
  // Helper to get vendor name from ID
  const getVendorName = useCallback((vendorId?: string) => {
    if (!vendorId) return '—';
    const vendorAssignment = eventVendors.find(v => v.vendorId === vendorId);
    return vendorAssignment ? vendorAssignment.vendor.name : '—';
  }, [eventVendors]);
  
  return {
    isLoading,
    error,
    eventVendors,
    getVendorName,
    fetchEventVendors
  };
} 