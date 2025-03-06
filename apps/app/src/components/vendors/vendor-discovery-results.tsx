'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { DiscoveredVendor } from '@/types/vendor';

interface VendorDiscoveryResultsProps {
  results: DiscoveredVendor[];
  isLoading: boolean;
  onAddVendor: (vendor: DiscoveredVendor) => Promise<void>;
}

export function VendorDiscoveryResults({
  results,
  isLoading,
  onAddVendor,
}: VendorDiscoveryResultsProps) {
  const [selectedVendor, setSelectedVendor] = useState<DiscoveredVendor | null>(null);
  const [addingVendorIds, setAddingVendorIds] = useState<Set<string>>(new Set());
  
  // Add filter state
  const [venueTypeFilter, setVenueTypeFilter] = useState<string | null>(null);
  const [priceFilter, setPriceFilter] = useState<number | null>(null);
  const [minimumRating, setMinimumRating] = useState<number | null>(null);
  const [showSavedOnly, setShowSavedOnly] = useState<boolean>(false);
  
  // State for saved venues
  const [savedVendorIds, setSavedVendorIds] = useState<Set<string>>(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('savedVendors');
        if (saved) {
          return new Set(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Error loading saved venues', e);
      }
    }
    return new Set();
  });
  
  // Save to localStorage when savedVendorIds changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('savedVendors', JSON.stringify([...savedVendorIds]));
    }
  }, [savedVendorIds]);

  // Toggle save/unsave vendor
  const toggleSaveVendor = (vendorId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedVendorIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vendorId)) {
        newSet.delete(vendorId);
        toast.success('Removed from saved venues');
      } else {
        newSet.add(vendorId);
        toast.success('Added to saved venues');
      }
      return newSet;
    });
  };

  // Handle add vendor
  const handleAddVendor = async (vendor: DiscoveredVendor, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      setAddingVendorIds(prev => new Set(prev).add(vendor.placeId));
      await onAddVendor(vendor);
      toast.success(`Added ${vendor.name} to your vendors`);
    } catch (error) {
      console.error('Error adding vendor:', error);
      toast.error('Failed to add vendor. Please try again.');
    } finally {
      setAddingVendorIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(vendor.placeId);
        return newSet;
      });
    }
  };

  // Calculate unique venue types for filtering
  const venueTypes = useMemo(() => {
    if (!results.length) return [];
    
    const types = new Set<string>();
    
    results.forEach(venue => {
      if (venue.sourceData?.types && Array.isArray(venue.sourceData.types)) {
        venue.sourceData.types.forEach((type: string) => {
          // Filter out some common but less useful types
          if (
            !['point_of_interest', 'establishment', 'food', 'premise', 'political'].includes(type)
          ) {
            types.add(type.replace(/_/g, ' '));
          }
        });
      }
    });
    
    return Array.from(types).sort();
  }, [results]);

  // Apply filters
  const filteredResults = useMemo(() => {
    if (isLoading || !results.length) return [];
    
    return results.filter(venue => {
      // Apply venue type filter
      if (venueTypeFilter && venue.sourceData?.types) {
        const normalizedFilter = venueTypeFilter.replace(' ', '_');
        if (!venue.sourceData.types.includes(normalizedFilter)) {
          return false;
        }
      }
      
      // Apply price filter
      if (priceFilter !== null && venue.priceLevel !== undefined) {
        if (venue.priceLevel !== priceFilter) {
          return false;
        }
      }
      
      // Apply rating filter
      if (minimumRating !== null && venue.rating !== undefined) {
        if (venue.rating < minimumRating) {
          return false;
        }
      }
      
      // Apply saved only filter
      if (showSavedOnly && !savedVendorIds.has(venue.placeId)) {
        return false;
      }
      
      return true;
    });
  }, [
    results,
    isLoading,
    venueTypeFilter,
    priceFilter,
    minimumRating,
    showSavedOnly,
    savedVendorIds
  ]);

  // Close modal when clicking escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedVendor(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close modal when clicking outside
  const modalRef = useRef<HTMLDivElement>(null);
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setSelectedVendor(null);
    }
  }, []);

  useEffect(() => {
    if (selectedVendor) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedVendor, handleClickOutside]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4 mt-4">
        <div className="flex items-center justify-center w-full mb-6">
          <div className="flex items-center space-x-3 px-4 py-2 rounded-full bg-theme-bg-card border border-theme-border-subtle">
            <div className="flex space-x-1">
              <div className="h-2 w-2 bg-theme-primary rounded-full animate-pulse"></div>
              <div className="h-2 w-2 bg-theme-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="h-2 w-2 bg-theme-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <p className="text-sm text-theme-text-secondary">Claude is searching for the perfect matches...</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div 
              key={i} 
              className="rounded-lg border border-theme-border-subtle overflow-hidden h-72 bg-theme-bg-card relative"
            >
              <div className="h-32 bg-gradient-to-r from-theme-bg-hover to-theme-bg-card animate-pulse flex items-center justify-center">
                <svg className="w-12 h-12 text-theme-border-subtle opacity-30" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="p-3 space-y-2">
                <div className="h-5 w-3/4 bg-gradient-to-r from-theme-bg-hover to-theme-bg-card animate-pulse rounded" />
                <div className="flex items-center space-x-1 mt-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(star => (
                      <svg key={star} className="w-3 h-3 text-theme-border-subtle" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </div>
                  <div className="h-3 w-8 bg-theme-bg-hover animate-pulse rounded" />
                </div>
                <div className="h-4 w-2/3 bg-gradient-to-r from-theme-bg-hover to-theme-bg-card animate-pulse rounded" />
                <div className="h-8 w-full flex justify-between items-center mt-4">
                  <div className="h-7 w-24 bg-gradient-to-r from-theme-bg-hover to-theme-bg-card animate-pulse rounded-full" />
                  <div className="h-7 w-7 bg-gradient-to-r from-theme-bg-hover to-theme-bg-card animate-pulse rounded-full" />
                </div>
              </div>
              <div className="absolute top-2 right-2 flex space-x-1 opacity-70">
                <div className="h-2 w-2 bg-theme-primary rounded-full animate-pulse"></div>
                <div className="h-2 w-2 bg-theme-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (filteredResults.length === 0) {
    return (
      <div className="mt-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Venue type filter */}
          <select 
            className="px-3 py-1 rounded-full text-sm border border-theme-border-subtle bg-theme-bg-card text-theme-text-secondary hover:border-theme-border-strong focus:border-theme-primary focus:ring-1 focus:ring-theme-primary focus:outline-none transition-colors"
            value={venueTypeFilter || ""}
            onChange={e => setVenueTypeFilter(e.target.value || null)}
          >
            <option value="">All venue types</option>
            {venueTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
          
          {/* Price filter */}
          <select 
            className="px-3 py-1 rounded-full text-sm border border-theme-border-subtle bg-theme-bg-card text-theme-text-secondary hover:border-theme-border-strong focus:border-theme-primary focus:ring-1 focus:ring-theme-primary focus:outline-none transition-colors"
            value={priceFilter !== null ? priceFilter : ""}
            onChange={e => setPriceFilter(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Any price</option>
            <option value="1">$ Inexpensive</option>
            <option value="2">$$ Moderate</option>
            <option value="3">$$$ Expensive</option>
            <option value="4">$$$$ Very Expensive</option>
          </select>
          
          {/* Minimum rating filter */}
          <select 
            className="px-3 py-1 rounded-full text-sm border border-theme-border-subtle bg-theme-bg-card text-theme-text-secondary hover:border-theme-border-strong focus:border-theme-primary focus:ring-1 focus:ring-theme-primary focus:outline-none transition-colors"
            value={minimumRating !== null ? minimumRating : ""}
            onChange={e => setMinimumRating(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Any rating</option>
            <option value="3">3+ stars</option>
            <option value="3.5">3.5+ stars</option>
            <option value="4">4+ stars</option>
            <option value="4.5">4.5+ stars</option>
          </select>
          
          {/* Saved toggle */}
          <button
            className={`px-3 py-1 rounded-full text-sm border ${
              showSavedOnly 
                ? 'bg-theme-primary text-white border-theme-primary' 
                : 'border-theme-border-subtle bg-theme-bg-card text-theme-text-secondary hover:border-theme-border-strong'
            } flex items-center gap-1 transition-colors`}
            onClick={() => setShowSavedOnly(!showSavedOnly)}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="12" 
              height="12" 
              viewBox="0 0 24 24" 
              fill={showSavedOnly ? "currentColor" : "none"} 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            Saved only
          </button>
        </div>
        
        <div className="flex flex-col items-center justify-center py-12 border border-theme-border-subtle rounded-lg bg-theme-bg-card">
          <svg 
            className="w-12 h-12 mb-3 text-theme-text-tertiary" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="text-lg font-medium text-theme-text-primary mb-1">No venues found</h3>
          <p className="text-theme-text-secondary text-center max-w-sm">
            {results.length > 0
              ? "Try adjusting your filters to see more results."
              : "Try a different search term or check a different location."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Venue type filter */}
        <select 
          className="px-3 py-1 rounded-full text-sm border border-theme-border-subtle bg-theme-bg-card text-theme-text-secondary hover:border-theme-border-strong focus:border-theme-primary focus:ring-1 focus:ring-theme-primary focus:outline-none transition-colors"
          value={venueTypeFilter || ""}
          onChange={e => setVenueTypeFilter(e.target.value || null)}
        >
          <option value="">All venue types</option>
          {venueTypes.map(type => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
        
        {/* Price filter */}
        <select 
          className="px-3 py-1 rounded-full text-sm border border-theme-border-subtle bg-theme-bg-card text-theme-text-secondary hover:border-theme-border-strong focus:border-theme-primary focus:ring-1 focus:ring-theme-primary focus:outline-none transition-colors"
          value={priceFilter !== null ? priceFilter : ""}
          onChange={e => setPriceFilter(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Any price</option>
          <option value="1">$ Inexpensive</option>
          <option value="2">$$ Moderate</option>
          <option value="3">$$$ Expensive</option>
          <option value="4">$$$$ Very Expensive</option>
        </select>
        
        {/* Minimum rating filter */}
        <select 
          className="px-3 py-1 rounded-full text-sm border border-theme-border-subtle bg-theme-bg-card text-theme-text-secondary hover:border-theme-border-strong focus:border-theme-primary focus:ring-1 focus:ring-theme-primary focus:outline-none transition-colors"
          value={minimumRating !== null ? minimumRating : ""}
          onChange={e => setMinimumRating(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Any rating</option>
          <option value="3">3+ stars</option>
          <option value="3.5">3.5+ stars</option>
          <option value="4">4+ stars</option>
          <option value="4.5">4.5+ stars</option>
        </select>
        
        {/* Saved toggle */}
        <button
          className={`px-3 py-1 rounded-full text-sm border ${
            showSavedOnly 
              ? 'bg-theme-primary text-white border-theme-primary' 
              : 'border-theme-border-subtle bg-theme-bg-card text-theme-text-secondary hover:border-theme-border-strong'
          } flex items-center gap-1 transition-colors`}
          onClick={() => setShowSavedOnly(!showSavedOnly)}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="12" 
            height="12" 
            viewBox="0 0 24 24" 
            fill={showSavedOnly ? "currentColor" : "none"} 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
          Saved only
        </button>
      </div>
      
      {/* Results grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResults.map(vendor => {
          const isSaved = savedVendorIds.has(vendor.placeId);
          const isAdding = addingVendorIds.has(vendor.placeId);
          
          return (
            <div 
              key={vendor.placeId}
              onClick={() => setSelectedVendor(vendor)}
              className="rounded-lg border border-theme-border-subtle bg-theme-bg-card hover:shadow-sm transition-all duration-150 overflow-hidden cursor-pointer hover:border-theme-border-strong"
            >
              {/* Card Header */}
              <div className="p-4 pb-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-medium text-theme-text-primary line-clamp-1">{vendor.name}</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSaveVendor(vendor.placeId, e);
                    }}
                    className={`ml-2 p-1 rounded-full ${isSaved ? 'text-theme-primary' : 'text-theme-text-tertiary hover:text-theme-text-secondary'}`}
                    aria-label={isSaved ? "Unsave vendor" : "Save vendor"}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill={isSaved ? "currentColor" : "none"} 
                      stroke="currentColor" 
                      strokeWidth="1.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Image */}
              {vendor.sourceData?.photos && vendor.sourceData.photos[0]?.name ? (
                <div className="w-full aspect-[5/2] relative overflow-hidden">
                  <img 
                    src={`/api/places/photo?reference=${vendor.sourceData.photos[0].name}&maxwidth=600`}
                    alt={vendor.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
              ) : (
                <div className="w-full aspect-[5/2] bg-theme-bg-hover flex items-center justify-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="40" 
                    height="40" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="text-theme-text-quaternary opacity-40"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
              )}
              
              {/* Card Info Section */}
              <div className="p-4 pt-3">
                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  <div className="flex items-center gap-1 text-xs text-theme-text-secondary">
                    <div className="py-0.5 px-1.5 bg-theme-bg-hover rounded capitalize">
                      {vendor.category || (vendor.sourceData?.types?.[0]?.replace('_', ' ') || 'Venue')}
                    </div>
                    
                    {vendor.priceLevel !== undefined && (
                      <div className="py-0.5 px-1.5 bg-theme-bg-hover rounded">
                        {`$`.repeat(vendor.priceLevel)}
                      </div>
                    )}
                    
                    {vendor.rating && (
                      <div className="flex items-center gap-0.5 py-0.5 px-1.5 bg-theme-bg-hover rounded">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="10" 
                          height="10" 
                          viewBox="0 0 24 24" 
                          fill="currentColor" 
                          stroke="none"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        <span>{vendor.rating}</span>
                        {vendor.user_ratings_total && (
                          <span className="text-xs text-theme-text-tertiary ml-1">
                            ({vendor.user_ratings_total.toLocaleString()})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Location */}
                <div className="flex items-start text-xs text-theme-text-secondary mb-2">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="12" 
                    height="12" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    className="mr-1.5 mt-0.5 flex-shrink-0 text-theme-text-tertiary"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span className="line-clamp-1">{vendor.sourceData?.vicinity || vendor.sourceData?.formatted_address || vendor.location || 'No address available'}</span>
                </div>
                
                {/* Capacity (if applicable) */}
                {vendor.sourceData?.types?.some((type: string) => 
                  ['restaurant', 'event_venue', 'banquet_hall', 'bar'].includes(type)
                ) && (
                  <div className="flex items-start text-xs text-theme-text-secondary mb-3">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="12" 
                      height="12" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1.5" 
                      className="mr-1.5 mt-0.5 flex-shrink-0 text-theme-text-tertiary"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>
                      {vendor.sourceData?.types?.includes('restaurant') ? 'Est. 20-80 guests' : 
                       vendor.sourceData?.types?.includes('banquet_hall') ? 'Est. 50-200 guests' : 
                       'Est. capacity varies'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Linear-style detail panel/modal */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div 
            ref={modalRef}
            className="bg-theme-bg-card max-w-2xl w-full max-h-[85vh] rounded-lg shadow-lg overflow-hidden flex flex-col animate-fadeIn"
          >
            {/* Modal header */}
            <div className="p-4 border-b border-theme-border-subtle flex items-center justify-between sticky top-0 bg-theme-bg-card z-10">
              <h2 className="font-medium text-lg text-theme-text-primary flex items-center">
                {selectedVendor.name}
                {savedVendorIds.has(selectedVendor.placeId) && (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="currentColor" 
                    stroke="none"
                    className="ml-2 text-theme-primary"
                  >
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                )}
              </h2>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedVendor(null);
                }}
                className="p-1 rounded-full text-theme-text-tertiary hover:text-theme-text-secondary hover:bg-theme-bg-hover transition-colors"
                aria-label="Close"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            {/* Modal content */}
            <div className="overflow-y-auto p-4 space-y-5 flex-1">
              {/* Image */}
              {selectedVendor.sourceData?.photos && selectedVendor.sourceData.photos[0]?.name ? (
                <div className="w-full aspect-[16/9] rounded-md overflow-hidden">
                  <img 
                    src={`/api/places/photo?reference=${selectedVendor.sourceData.photos[0].name}&maxwidth=800`}
                    alt={selectedVendor.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : null}
              
              {/* Key info section */}
              <div className="flex flex-wrap gap-3 py-1">
                {/* Price */}
                {selectedVendor.priceLevel !== undefined && (
                  <div className="flex flex-col items-center">
                    <div className="text-xs uppercase text-theme-text-tertiary mb-1">Price</div>
                    <div className="text-sm text-theme-text-primary font-medium">{`$`.repeat(selectedVendor.priceLevel)}</div>
                  </div>
                )}
                
                {/* Rating */}
                {selectedVendor.rating && (
                  <div className="flex flex-col items-center">
                    <div className="text-xs uppercase text-theme-text-tertiary mb-1">Rating</div>
                    <div className="text-sm text-theme-text-primary font-medium flex items-center">
                      <span>{selectedVendor.rating}</span>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="12" 
                        height="12" 
                        viewBox="0 0 24 24" 
                        fill="currentColor" 
                        stroke="none"
                        className="ml-0.5 text-amber-400"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      {selectedVendor.user_ratings_total && (
                        <span className="text-xs text-theme-text-tertiary ml-1">
                          ({selectedVendor.user_ratings_total.toLocaleString()})
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Capacity */}
                {selectedVendor.sourceData?.types?.some((type: string) => 
                  ['restaurant', 'event_venue', 'banquet_hall', 'bar'].includes(type)
                ) && (
                  <div className="flex flex-col items-center">
                    <div className="text-xs uppercase text-theme-text-tertiary mb-1">Est. Capacity</div>
                    <div className="text-sm text-theme-text-primary font-medium">
                      {selectedVendor.sourceData?.types?.includes('restaurant') ? '20-80 guests' : 
                       selectedVendor.sourceData?.types?.includes('banquet_hall') ? '50-200 guests' : 
                       'Varies'}
                    </div>
                  </div>
                )}
                
                {/* Business status */}
                {selectedVendor.sourceData?.opening_hours && (
                  <div className="flex flex-col items-center">
                    <div className="text-xs uppercase text-theme-text-tertiary mb-1">Status</div>
                    <div className="text-sm">
                      {selectedVendor.sourceData.opening_hours.open_now 
                        ? <span className="text-emerald-500 font-medium">Open now</span> 
                        : <span className="text-rose-500 font-medium">Closed now</span>}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Venue Types */}
              {selectedVendor.sourceData?.types && selectedVendor.sourceData.types.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-medium uppercase text-theme-text-tertiary">Venue Type</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedVendor.sourceData.types
                      .filter((type: string) => !['point_of_interest', 'establishment', 'food', 'premise', 'political'].includes(type))
                      .map((type: string) => (
                        <span 
                          key={type} 
                          className="text-xs px-2 py-0.5 rounded-full bg-theme-bg-hover text-theme-text-secondary capitalize"
                        >
                          {type.replace(/_/g, ' ')}
                        </span>
                      ))}
                  </div>
                </div>
              )}
              
              {/* Contact section */}
              <div className="space-y-2">
                <h3 className="text-xs font-medium uppercase text-theme-text-tertiary">Contact</h3>
                <div className="space-y-2">
                  {/* Address */}
                  <div className="flex items-start text-sm">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="14" 
                      height="14" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1.5" 
                      className="mr-2 mt-0.5 flex-shrink-0 text-theme-text-tertiary"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span className="text-theme-text-secondary">
                      {selectedVendor.sourceData?.vicinity || selectedVendor.sourceData?.formatted_address || selectedVendor.location || 'No address available'}
                    </span>
                  </div>
                  
                  {/* Phone */}
                  {selectedVendor.phoneNumber && (
                    <div className="flex items-center text-sm">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="14" 
                        height="14" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="mr-2 text-theme-text-tertiary"
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                      <a 
                        href={`tel:${selectedVendor.phoneNumber}`} 
                        className="text-theme-primary hover:underline"
                        onClick={e => e.stopPropagation()}
                      >
                        {selectedVendor.phoneNumber}
                      </a>
                    </div>
                  )}
                  
                  {/* Website */}
                  {selectedVendor.website && (
                    <div className="flex items-center text-sm">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="14" 
                        height="14" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="mr-2 text-theme-text-tertiary"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                      </svg>
                      <a 
                        href={selectedVendor.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-theme-primary hover:underline truncate"
                        onClick={e => e.stopPropagation()}
                      >
                        {selectedVendor.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </a>
                    </div>
                  )}
                  
                  {/* Google Maps link */}
                  <div className="flex items-center text-sm">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="14" 
                      height="14" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="mr-2 text-theme-text-tertiary"
                    >
                      <path d="M15 3h6v6"></path>
                      <path d="M10 14 21 3"></path>
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    </svg>
                    <a 
                      href={`https://www.google.com/maps/place/?q=place_id:${selectedVendor.placeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-theme-primary hover:underline"
                      onClick={e => e.stopPropagation()}
                    >
                      View on Google Maps
                    </a>
                  </div>
                </div>
              </div>
              
              {/* AI-specific information */}
              {(selectedVendor.eventSuitabilityScore || selectedVendor.description) && (
                <div className="space-y-2">
                  <h3 className="text-xs font-medium uppercase text-theme-text-tertiary">AI Analysis</h3>
                  
                  {/* Event suitability score */}
                  {selectedVendor.eventSuitabilityScore && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm text-theme-text-secondary">Event Suitability</div>
                        <div className="text-sm font-medium">
                          <span 
                            className={`px-1.5 py-0.5 rounded-full ${
                              selectedVendor.eventSuitabilityScore >= 8 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                              selectedVendor.eventSuitabilityScore >= 6 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                              'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                            }`}
                          >
                            {selectedVendor.eventSuitabilityScore}/10
                          </span>
                        </div>
                      </div>
                      
                      {/* Bar indicator */}
                      <div className="w-full h-1.5 bg-theme-bg-hover rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            selectedVendor.eventSuitabilityScore >= 8 ? 'bg-emerald-500' : 
                            selectedVendor.eventSuitabilityScore >= 6 ? 'bg-amber-500' :
                            'bg-rose-500'
                          }`}
                          style={{ width: `${selectedVendor.eventSuitabilityScore * 10}%` }}
                        ></div>
                      </div>
                      
                      {/* Description text */}
                      <p className="text-xs text-theme-text-secondary mt-1">
                        {selectedVendor.eventSuitabilityScore >= 8 ? 'Excellent fit for your event type' :
                         selectedVendor.eventSuitabilityScore >= 6 ? 'Good match with some considerations' :
                         'May require adaptations for your needs'}
                      </p>
                    </div>
                  )}
                  
                  {/* Description */}
                  {selectedVendor.description && (
                    <p className="text-sm text-theme-text-secondary mt-2">
                      {selectedVendor.description}
                    </p>
                  )}
                </div>
              )}
            </div>
            
            {/* Modal footer with action buttons */}
            <div className="p-4 border-t border-theme-border-subtle sticky bottom-0 bg-theme-bg-card flex justify-between">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSaveVendor(selectedVendor.placeId, e);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
                  savedVendorIds.has(selectedVendor.placeId) 
                    ? 'bg-theme-primary/10 text-theme-primary border border-theme-primary/20 hover:bg-theme-primary/20'
                    : 'bg-theme-bg-hover text-theme-text-secondary border border-theme-border-subtle hover:border-theme-border-strong hover:text-theme-text-primary'
                }`}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill={savedVendorIds.has(selectedVendor.placeId) ? "currentColor" : "none"} 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
                {savedVendorIds.has(selectedVendor.placeId) ? 'Saved' : 'Save'}
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddVendor(selectedVendor, e);
                }}
                disabled={addingVendorIds.has(selectedVendor.placeId)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 flex items-center
                  ${addingVendorIds.has(selectedVendor.placeId)
                    ? 'bg-theme-primary/10 text-theme-primary border border-theme-primary/20'
                    : 'bg-theme-primary text-white hover:bg-theme-primary-hover'
                  }`}
              >
                {addingVendorIds.has(selectedVendor.placeId) ? (
                  <>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="mr-2"
                    >
                      <path d="M20 6L9 17l-5-5"></path>
                    </svg>
                    Added to Vendors
                  </>
                ) : (
                  <>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="mr-2"
                    >
                      <path d="M12 5v14M5 12h14"></path>
                    </svg>
                    Add to Vendors
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 