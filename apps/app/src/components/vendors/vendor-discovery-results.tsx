'use client';

import { useState, useMemo, useEffect } from 'react';
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

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4 mt-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-7 w-24 rounded bg-theme-bg-hover animate-pulse" />
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div 
              key={i} 
              className="rounded-lg border border-theme-border-subtle overflow-hidden h-72 bg-theme-bg-card"
            >
              <div className="h-32 bg-theme-bg-hover animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-5 w-3/4 bg-theme-bg-hover animate-pulse rounded" />
                <div className="h-4 w-1/2 bg-theme-bg-hover animate-pulse rounded" />
                <div className="h-4 w-2/3 bg-theme-bg-hover animate-pulse rounded" />
                <div className="h-8 w-full bg-theme-bg-hover animate-pulse rounded mt-4" />
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
              className={`rounded-lg border group transition-all duration-150 overflow-hidden ${
                selectedVendor?.placeId === vendor.placeId
                  ? 'border-theme-primary shadow-sm'
                  : 'border-theme-border-subtle hover:border-theme-border-strong'
              } bg-theme-bg-card`}
              onClick={() => setSelectedVendor(
                selectedVendor?.placeId === vendor.placeId ? null : vendor
              )}
              tabIndex={0}
              role="button"
              aria-expanded={selectedVendor?.placeId === vendor.placeId}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedVendor(
                    selectedVendor?.placeId === vendor.placeId ? null : vendor
                  );
                }
              }}
            >
              {/* Image section */}
              <div className="h-32 bg-theme-bg-hover relative">
                {vendor.sourceData?.photos && vendor.sourceData.photos[0]?.photo_reference ? (
                  <img 
                    src={`/api/places/photo?reference=${vendor.sourceData.photos[0].photo_reference}&maxwidth=400`}
                    alt={vendor.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-theme-text-tertiary">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="24" 
                      height="24" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                )}
                
                {/* Save button */}
                <button
                  className={`absolute top-2 right-2 p-1.5 rounded-full ${
                    isSaved
                      ? 'bg-theme-primary text-white'
                      : 'bg-black/30 text-white hover:bg-black/50'
                  } transition-colors`}
                  onClick={e => toggleSaveVendor(vendor.placeId, e)}
                  aria-label={isSaved ? 'Unsave venue' : 'Save venue'}
                  title={isSaved ? 'Unsave venue' : 'Save venue'}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill={isSaved ? "currentColor" : "none"} 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                </button>
              </div>
              
              {/* Info section */}
              <div className="p-3">
                <div className="flex justify-between">
                  <h3 className="font-medium truncate text-theme-text-primary">{vendor.name}</h3>
                  
                  {/* Rating display */}
                  {vendor.rating && (
                    <div className="flex items-center gap-1 text-theme-text-secondary">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="12" 
                        height="12" 
                        viewBox="0 0 24 24" 
                        fill="currentColor" 
                        stroke="none"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <span className="text-xs">{vendor.rating}</span>
                    </div>
                  )}
                </div>
                
                {/* Address */}
                <p className="text-sm truncate mt-1 text-theme-text-secondary">
                  {vendor.sourceData?.vicinity || vendor.sourceData?.formatted_address || vendor.location || 'No address available'}
                </p>
                
                {/* Price level */}
                {vendor.priceLevel !== undefined && (
                  <div className="mt-1 text-theme-text-secondary">
                    {'$'.repeat(vendor.priceLevel)}
                    <span className="text-theme-text-tertiary">
                      {'$'.repeat(4 - vendor.priceLevel)}
                    </span>
                  </div>
                )}
                
                {/* Add button */}
                <button
                  className={`mt-3 w-full py-1.5 px-3 rounded text-sm flex items-center justify-center gap-1.5 ${
                    isAdding
                      ? 'bg-theme-bg-hover text-theme-text-secondary'
                      : 'bg-theme-primary hover:bg-theme-primary-hover text-white'
                  } transition-colors`}
                  onClick={e => handleAddVendor(vendor, e)}
                  disabled={isAdding}
                >
                  {isAdding ? (
                    <>
                      <svg 
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-theme-text-secondary" 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24"
                      >
                        <circle 
                          className="opacity-25" 
                          cx="12" 
                          cy="12" 
                          r="10" 
                          stroke="currentColor" 
                          strokeWidth="4"
                        ></circle>
                        <path 
                          className="opacity-75" 
                          fill="currentColor" 
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Adding...
                    </>
                  ) : (
                    <>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="14" 
                        height="14" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      Add to Vendors
                    </>
                  )}
                </button>
              </div>
              
              {/* Expanded view when selected */}
              {selectedVendor?.placeId === vendor.placeId && (
                <div className="border-t border-theme-border-subtle p-3 animate-fadeIn">
                  {/* Types */}
                  {vendor.sourceData?.types && vendor.sourceData.types.length > 0 && (
                    <div className="mb-2">
                      <h4 className="text-xs font-medium uppercase text-theme-text-tertiary mb-1">Venue Type</h4>
                      <div className="flex flex-wrap gap-1">
                        {vendor.sourceData.types
                          .filter((type: string) => !['point_of_interest', 'establishment', 'food', 'premise', 'political'].includes(type))
                          .map((type: string) => (
                            <span 
                              key={type} 
                              className="text-xs px-2 py-0.5 rounded-full bg-theme-bg-hover text-theme-text-secondary"
                            >
                              {type.replace(/_/g, ' ')}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Hours */}
                  {vendor.sourceData?.opening_hours && (
                    <div className="mb-2">
                      <h4 className="text-xs font-medium uppercase text-theme-text-tertiary mb-1">Hours</h4>
                      <div className="text-sm text-theme-text-secondary">
                        {vendor.sourceData.opening_hours.open_now 
                          ? <span className="text-green-500">Open now</span> 
                          : <span className="text-red-500">Closed now</span>}
                      </div>
                    </div>
                  )}
                  
                  {/* Contact */}
                  <div className="mb-2">
                    <h4 className="text-xs font-medium uppercase text-theme-text-tertiary mb-1">Contact</h4>
                    {vendor.website ? (
                      <a 
                        href={vendor.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-theme-primary hover:underline block"
                        onClick={e => e.stopPropagation()}
                      >
                        Visit website
                      </a>
                    ) : (
                      <span className="text-sm text-theme-text-secondary">Website not available</span>
                    )}
                    
                    {vendor.phoneNumber && (
                      <a 
                        href={`tel:${vendor.phoneNumber}`}
                        className="text-sm text-theme-primary hover:underline block mt-1"
                        onClick={e => e.stopPropagation()}
                      >
                        {vendor.phoneNumber}
                      </a>
                    )}
                  </div>
                  
                  {/* Google Maps link */}
                  <a 
                    href={`https://www.google.com/maps/place/?q=place_id:${vendor.placeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-theme-primary hover:underline flex items-center gap-1 mt-2"
                    onClick={e => e.stopPropagation()}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="12" 
                      height="12" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                    View on Google Maps
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 