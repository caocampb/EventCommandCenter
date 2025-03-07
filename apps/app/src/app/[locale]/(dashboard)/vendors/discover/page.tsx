'use client';

import { useState } from 'react';
import Link from 'next/link';
import { VendorDiscoverySearch } from '@/components/vendors/vendor-discovery-search';
import { VendorDiscoveryResults } from '@/components/vendors/vendor-discovery-results';
import { VendorDiscoveryContext, EventContext } from '@/components/vendors/vendor-discovery-context';
import { DiscoveredVendor } from '@/types/vendor';
import { Toaster } from 'sonner';

export default function VendorDiscoveryPage() {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<DiscoveredVendor[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [eventContext, setEventContext] = useState<EventContext>({
    attendeeCount: '',
    eventType: 'venue',
    specialRequirements: ''
  });

  const handleContextChange = (context: EventContext) => {
    setEventContext(context);
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setSearchQuery(query);
    setHasSearched(true);
    
    try {
      // Filter out empty context values before sending to API
      const filteredContext = Object.fromEntries(
        Object.entries(eventContext).filter(([_, value]) => !!value)
      );
      
      const response = await fetch('/api/discovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query,
          context: Object.keys(filteredContext).length > 0 ? filteredContext : undefined
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }
      
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Error searching for vendors:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddVendor = async (vendor: DiscoveredVendor) => {
    // Convert discovered vendor to your vendor format and add it
    try {
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: vendor.name,
          category: vendor.category || 'other',
          price_tier: vendor.priceLevel || 1,
          website: vendor.website || '',
          phone: vendor.phoneNumber || '',
          location: vendor.location || '',
          notes: vendor.description || '',
          source: 'discovery',
          source_id: vendor.placeId
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add vendor');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error adding vendor:', error);
      throw error;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-theme-bg-page">
      <Toaster position="top-right" />
      
      {/* Header with back navigation */}
      <header className="space-y-1 mb-6">
        <Link
          href="/en/vendors"
          className="flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
            <path d="M8.84182 3.13514C9.04327 3.32401 9.05348 3.64042 8.86462 3.84188L5.43521 7.49991L8.86462 11.1579C9.05348 11.3594 9.04327 11.6758 8.84182 11.8647C8.64036 12.0535 8.32394 12.0433 8.13508 11.8419L4.38508 7.84188C4.20477 7.64955 4.20477 7.35027 4.38508 7.15794L8.13508 3.15794C8.32394 2.95648 8.64036 2.94628 8.84182 3.13514Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
          </svg>
          Back to Vendors
        </Link>
        <h1 className="text-2xl font-semibold text-theme-text-primary">Discover Vendors</h1>
      </header>
      
      {/* Introduction and search - tighter spacing */}
      <div className="mb-8">
        <p className="text-sm text-theme-text-tertiary mb-8">
          Find vendors that match your exact requirements using natural language search
        </p>
        
        {/* Event Context Component */}
        <VendorDiscoveryContext onContextChange={handleContextChange} />
        
        {/* Search Component - without center alignment */}
        <div>
          <VendorDiscoverySearch onSearch={handleSearch} isSearching={isSearching} />
        </div>
      </div>
      
      {/* Results or Empty State */}
      {hasSearched ? (
        <div>
          {/* Search info with adjusted spacing */}
          {!isSearching && results.length > 0 && (
            <div className="mb-6 text-sm text-theme-text-tertiary">
              Found {results.length} vendors matching "{searchQuery}"
            </div>
          )}
          
          {/* Results */}
          <VendorDiscoveryResults 
            results={results}
            isLoading={isSearching}
            onAddVendor={handleAddVendor}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4 text-theme-text-tertiary">
            <path d="M10.5 6a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" fill="currentColor" />
          </svg>
          <h3 className="text-xl font-medium text-theme-text-primary mb-2">Ready to discover vendors</h3>
          <p className="text-theme-text-tertiary text-sm max-w-md">
            Try searching for specific requirements like "outdoor wedding venue near downtown" or "catering service with vegan options for corporate event"
          </p>
        </div>
      )}
    </div>
  );
} 