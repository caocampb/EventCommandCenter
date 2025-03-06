'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Vendor } from '@/types/vendor';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQueryState, parseAsString, parseAsBoolean } from 'nuqs';

// Filter state interface
interface VendorFilters {
  category: string;
  capacity: string;
  price: string;
  showFavorites: boolean;
}

// Sort direction type
type SortDirection = 'asc' | 'desc';

// Sort field type
type SortField = 'name' | 'capacity' | 'priceTier' | null;

// Option definitions for filters
const categoryOptions = {
  'venue': 'Venue',
  'catering': 'Catering',
  'entertainment': 'Entertainment',
  'staffing': 'Staffing',
  'equipment': 'Equipment',
  'transportation': 'Transportation',
  'other': 'Other'
};

const capacityOptions = {
  'small': 'Up to 50',
  'medium': '51-100',
  'large': '101-250',
  'xl': '251-500',
  'xxl': '500+'
};

const priceOptions = {
  'budget': '$ Budget',
  'moderate': '$$ Moderate',
  'premium': '$$$ Premium',
  'luxury': '$$$$ Luxury'
};

function VendorsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  
  // State for API data
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dropdown state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // Use useQueryState hooks for filter state
  const [searchQuery, setSearchQuery] = useQueryState('q', parseAsString);
  const [categoryFilter, setCategoryFilter] = useQueryState('cat', parseAsString);
  const [capacityFilter, setCapacityFilter] = useQueryState('cap', parseAsString);
  const [priceFilter, setPriceFilter] = useQueryState('price', parseAsString);
  const [showFavorites, setShowFavorites] = useQueryState('fav', parseAsBoolean);
  const [sortField, setSortField] = useQueryState('sort', parseAsString);
  const [sortDirection, setSortDirection] = useQueryState('dir', parseAsString.withDefault('asc'));
  const [prioritizeFavorites, setPrioritizeFavorites] = useQueryState('pfav', parseAsString);
  
  // ref for dropdown handling
  const setDropdownRef = (id: string) => (el: HTMLDivElement | null) => {
    dropdownRefs.current[id] = el;
  };
  
  // Fetch vendors whenever the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/vendors');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch vendors: ${response.status}`);
        }
        
        const data = await response.json();
        setVendors(data.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching vendors:', err);
        setError(err instanceof Error ? err.message : 'Failed to load vendors');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Handle sort click
  const handleSort = (field: SortField) => {
    // If clicking the active sort field, toggle direction
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a new field, set it and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Toggle prioritize favorites
  const togglePrioritizeFavorites = () => {
    setPrioritizeFavorites(prioritizeFavorites === 'true' ? null : 'true');
    // Close dropdown after selection
    setOpenDropdown(null);
  };
  
  // Toggle show favorites only
  const toggleShowFavoritesOnly = () => {
    setShowFavorites(prev => !prev);
    // Close dropdown after selection
    setOpenDropdown(null);
  };
  
  // Apply all filters to the vendors data
  const filteredVendors = useMemo(() => {
    if (!vendors.length) return [];
    
    let result = [...vendors];
    
    // Apply search filter if present
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(vendor => 
        vendor.name.toLowerCase().includes(query) || 
        (vendor.location && vendor.location.toLowerCase().includes(query))
      );
    }
    
    // Apply category filter if selected
    if (categoryFilter) {
      result = result.filter(vendor => vendor.category === categoryFilter);
    }
    
    // Apply capacity filter if selected
    if (capacityFilter) {
      result = result.filter(vendor => {
        // Convert vendor capacity to string for comparison with the filter value
        if (vendor.capacity === undefined) return false;
        
        // Map the numeric capacity to the filter categories
        const capacityKey = capacityFilter;
        if (capacityKey === 'small') return vendor.capacity <= 50;
        if (capacityKey === 'medium') return vendor.capacity > 50 && vendor.capacity <= 100;
        if (capacityKey === 'large') return vendor.capacity > 100 && vendor.capacity <= 250;
        if (capacityKey === 'xl') return vendor.capacity > 250 && vendor.capacity <= 500;
        if (capacityKey === 'xxl') return vendor.capacity > 500;
        
        return false;
      });
    }
    
    // Apply price filter if selected
    if (priceFilter) {
      result = result.filter(vendor => {
        // Convert vendor priceTier to string for comparison with the filter value
        let vendorPriceKey: string | undefined;
        
        // Map numeric price tier to key in priceOptions
        if (vendor.priceTier === 1) vendorPriceKey = 'budget';
        else if (vendor.priceTier === 2) vendorPriceKey = 'moderate';
        else if (vendor.priceTier === 3) vendorPriceKey = 'premium';
        else if (vendor.priceTier === 4) vendorPriceKey = 'luxury';
        
        return vendorPriceKey === priceFilter;
      });
    }
    
    // Apply favorites filter if enabled
    if (showFavorites) {
      result = result.filter(vendor => vendor.isFavorite);
    }
    
    // Sort the filtered results
    result = result.sort((a, b) => {
      // First apply prioritization of favorites if enabled
      if (prioritizeFavorites === 'true') {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
      }
      
      // Then apply the selected sort
      if (sortField === 'name') {
        return sortDirection === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      
      if (sortField === 'capacity') {
        // Parse capacity values for comparison
        const aCapacity = a.capacity !== undefined ? a.capacity : 0;
        const bCapacity = b.capacity !== undefined ? b.capacity : 0;
        
        return sortDirection === 'asc'
          ? aCapacity - bCapacity
          : bCapacity - aCapacity;
      }
      
      if (sortField === 'priceTier') {
        // Parse price tiers for comparison
        const aPriceTier = a.priceTier !== undefined ? a.priceTier : 0;
        const bPriceTier = b.priceTier !== undefined ? b.priceTier : 0;
        
        return sortDirection === 'asc'
          ? aPriceTier - bPriceTier
          : bPriceTier - aPriceTier;
      }
      
      // Default sort by name ascending
      return a.name.localeCompare(b.name);
    });
    
    return result;
  }, [
    vendors, 
    searchQuery, 
    categoryFilter, 
    capacityFilter, 
    priceFilter, 
    showFavorites, 
    prioritizeFavorites, 
    sortField, 
    sortDirection
  ]);
  
  // Toggle favorite status for a vendor
  const toggleFavorite = async (vendor: Vendor) => {
    try {
      // Optimistic update for better UX
      setVendors(prev => 
        prev.map(v => 
          v.id === vendor.id 
            ? { ...v, isFavorite: !v.isFavorite } 
            : v
        )
      );
      
      // API call to update favorite status
      const response = await fetch(`/api/vendors/${vendor.id}/favorite`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isFavorite: !vendor.isFavorite })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update favorite status: ${response.status}`);
      }
      
      // No need to update state again since we did it optimistically
    } catch (err) {
      console.error('Error toggling favorite:', err);
      
      // Revert the optimistic update on error
      setVendors(prev => 
        prev.map(v => 
          v.id === vendor.id 
            ? { ...v, isFavorite: vendor.isFavorite } 
            : v
        )
      );
    }
  };
  
  // Update the parseCapacityForSort function to handle number | undefined
  const parseCapacityForSort = (capacity: number | undefined): number => {
    if (capacity === undefined) return 0;
    return capacity;
  };
  
  // Filter helper functions
  const getCategoryName = (value: string): string => {
    if (!value) return 'All Categories';
    return categoryOptions[value as keyof typeof categoryOptions] || 'All Categories';
  };
  
  const getCapacityName = (value: string): string => {
    if (!value) return 'Any capacity';
    return capacityOptions[value as keyof typeof capacityOptions] || 'Any capacity';
  };
  
  const getPriceName = (value: string): string => {
    if (!value) return 'Any price';
    return priceOptions[value as keyof typeof priceOptions] || 'Any price';
  };
  
  // Clear all filters and sort preferences
  const clearAllFilters = () => {
    // Clear all query params
    setSearchQuery('');
    setCategoryFilter('');
    setCapacityFilter('');
    setPriceFilter('');
    setShowFavorites(false);
    setSortField('');
    setSortDirection('asc');
    setPrioritizeFavorites('');
    
    // Close any open dropdowns
    setOpenDropdown(null);
  };
  
  // Clear sort preferences only
  const clearSortPreferences = () => {
    setSortField(null);
    setSortDirection(null);
    setPrioritizeFavorites(null);
    
    // Close any open dropdowns
    setOpenDropdown(null);
  };
  
  // Toggle dropdown open/closed
  const toggleDropdown = (dropdown: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdown(prev => prev === dropdown ? null : dropdown);
  };
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (openDropdown) {
        const currentRef = dropdownRefs.current[openDropdown];
        if (currentRef && !currentRef.contains(e.target as Node)) {
          setOpenDropdown(null);
        }
      }
    };
    
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [openDropdown]);

  // Fix the input element and the search handler function
  const handleUpdateSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-theme-bg-page">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-theme-text-primary">Vendors</h1>
        <div className="flex space-x-3">
          <Link 
            href="/en/vendors/discover"
            className="px-4 py-2 bg-theme-bg-card text-theme-text-primary rounded-md text-sm font-medium hover:bg-theme-bg-hover transition-colors duration-200 border border-theme-border-subtle hover:border-theme-border-strong"
          >
            <span className="flex items-center">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1.5">
                <path d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
              Discover
            </span>
          </Link>
          <Link 
            href="/en/vendors/add"
            className="px-4 py-2 bg-theme-primary text-white rounded-md text-sm font-medium hover:bg-theme-primary-hover transition-colors duration-200 border border-transparent"
          >
            Add Vendor
          </Link>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center mb-6 pb-3 border-b border-theme-border-subtle">
        {/* Search input - Left aligned */}
        <div className="relative flex-grow max-w-sm mr-3">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-theme-text-tertiary">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
          </div>
          <input
            value={searchQuery || ''}
            onChange={handleUpdateSearch}
            type="text"
            className="w-full rounded-md pl-10 pr-12 py-1.5 text-sm bg-theme-bg-input border border-theme-border-subtle text-theme-text-primary placeholder-theme-text-tertiary focus:outline-none focus:ring-1 focus:ring-theme-primary focus:border-theme-primary"
            placeholder="Search vendors or locations..."
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-theme-text-tertiary hover:text-theme-text-secondary"
              aria-label="Clear search"
            >
              <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Category filter */}
          <div className="relative mr-2 mb-2 sm:mb-0" ref={setDropdownRef('category')}>
            <button
              onClick={(e) => toggleDropdown('category', e)}
              className={`flex items-center px-3 py-1.5 text-sm rounded-md border transition-all duration-150 ${
                categoryFilter 
                  ? 'bg-theme-primary-light text-theme-primary border-theme-primary/20' 
                  : 'bg-theme-bg-card text-theme-text-secondary border-theme-border-subtle hover:border-theme-border-strong'
              }`}
            >
              <span>
                {categoryFilter ? categoryOptions[categoryFilter as keyof typeof categoryOptions] : 'Category'}
              </span>
              <svg 
                className="ml-1 w-4 h-4" 
                viewBox="0 0 15 15" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </button>
            
            {/* Dropdown menu */}
            {openDropdown === 'category' && (
              <div className="absolute left-0 mt-1 z-10 w-48 rounded-md shadow-lg bg-theme-bg-card border border-theme-border-subtle">
                <div className="py-1">
                  {/* Category options */}
                  {Object.entries(categoryOptions).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => { 
                        setCategoryFilter(prev => prev === key ? null : key); 
                        setOpenDropdown(null);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        categoryFilter === key
                          ? 'bg-theme-primary-light text-theme-primary'
                          : 'text-theme-text-secondary hover:bg-theme-bg-hover'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  
                  {/* Clear filter option - only show if filter is active */}
                  {categoryFilter && (
                    <>
                      <div className="border-t border-theme-border-subtle my-1"></div>
                      <button
                        onClick={() => { 
                          setCategoryFilter(null); 
                          setOpenDropdown(null);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-theme-text-secondary hover:bg-theme-bg-hover"
                      >
                        Clear filter
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Capacity filter */}
          <div className="relative mr-2 mb-2 sm:mb-0" ref={setDropdownRef('capacity')}>
            <button
              onClick={(e) => toggleDropdown('capacity', e)}
              className={`flex items-center px-3 py-1.5 text-sm rounded-md border transition-all duration-150 ${
                capacityFilter 
                  ? 'bg-theme-primary-light text-theme-primary border-theme-primary/20' 
                  : 'bg-theme-bg-card text-theme-text-secondary border-theme-border-subtle hover:border-theme-border-strong'
              }`}
            >
              <span>
                {capacityFilter ? getCapacityName(capacityFilter) : 'Capacity'}
              </span>
              <svg 
                className="ml-1 w-4 h-4" 
                viewBox="0 0 15 15" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </button>
            
            {/* Dropdown menu */}
            {openDropdown === 'capacity' && (
              <div className="absolute left-0 mt-1 z-10 w-48 rounded-md shadow-lg bg-theme-bg-card border border-theme-border-subtle">
                <div className="py-1">
                  {/* Capacity options */}
                  {Object.entries(capacityOptions).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => { 
                        setCapacityFilter(prev => prev === key ? null : key); 
                        setOpenDropdown(null);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        capacityFilter === key
                          ? 'bg-theme-primary-light text-theme-primary'
                          : 'text-theme-text-secondary hover:bg-theme-bg-hover'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  
                  {/* Clear filter option - only show if filter is active */}
                  {capacityFilter && (
                    <>
                      <div className="border-t border-theme-border-subtle my-1"></div>
                      <button
                        onClick={() => { 
                          setCapacityFilter(null); 
                          setOpenDropdown(null);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-theme-text-secondary hover:bg-theme-bg-hover"
                      >
                        Clear filter
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Price filter */}
          <div className="relative mr-2 mb-2 sm:mb-0" ref={setDropdownRef('price')}>
            <button
              onClick={(e) => toggleDropdown('price', e)}
              className={`flex items-center px-3 py-1.5 text-sm rounded-md border transition-all duration-150 ${
                priceFilter 
                  ? 'bg-theme-primary-light text-theme-primary border-theme-primary/20' 
                  : 'bg-theme-bg-card text-theme-text-secondary border-theme-border-subtle hover:border-theme-border-strong'
              }`}
            >
              <span>
                {priceFilter ? getPriceName(priceFilter) : 'Price'}
              </span>
              <svg 
                className="ml-1 w-4 h-4" 
                viewBox="0 0 15 15" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </button>
            
            {/* Dropdown menu */}
            {openDropdown === 'price' && (
              <div className="absolute left-0 mt-1 z-10 w-48 rounded-md shadow-lg bg-theme-bg-card border border-theme-border-subtle">
                <div className="py-1">
                  {/* Price options */}
                  {Object.entries(priceOptions).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => { 
                        setPriceFilter(prev => prev === key ? null : key); 
                        setOpenDropdown(null);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        priceFilter === key
                          ? 'bg-theme-primary-light text-theme-primary'
                          : 'text-theme-text-secondary hover:bg-theme-bg-hover'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  
                  {/* Clear filter option - only show if filter is active */}
                  {priceFilter && (
                    <>
                      <div className="border-t border-theme-border-subtle my-1"></div>
                      <button
                        onClick={() => { 
                          setPriceFilter(null); 
                          setOpenDropdown(null);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-theme-text-secondary hover:bg-theme-bg-hover"
                      >
                        Clear filter
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Favorites filter */}
          <div className="relative mr-2 mb-2 sm:mb-0" ref={setDropdownRef('favorites')}>
            <button
              onClick={(e) => toggleDropdown('favorites', e)}
              className={`flex items-center px-3 py-1.5 text-sm rounded-md border transition-all duration-150 ${
                showFavorites || prioritizeFavorites
                  ? 'bg-theme-primary-light text-theme-primary border-theme-primary/20' 
                  : 'bg-theme-bg-card text-theme-text-secondary border-theme-border-subtle hover:border-theme-border-strong'
              }`}
            >
              <span>
                {showFavorites || prioritizeFavorites ? 'Show Favorites Only' : 'Favorites'}
              </span>
              <svg 
                className="ml-1 w-4 h-4" 
                viewBox="0 0 15 15" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </button>
            
            {/* Dropdown menu */}
            {openDropdown === 'favorites' && (
              <div className="absolute left-0 mt-1 z-10 w-48 rounded-md shadow-lg bg-theme-bg-card border border-theme-border-subtle">
                <div className="py-1">
                  {/* Favorites options */}
                  <button
                    onClick={toggleShowFavoritesOnly}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      showFavorites ? 'bg-theme-primary-light text-theme-primary' : 'text-theme-text-secondary hover:bg-theme-bg-hover'
                    }`}
                  >
                    Show Favorites Only
                  </button>
                  <div className="border-t border-theme-border-subtle my-1"></div>
                  <button
                    onClick={togglePrioritizeFavorites}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      prioritizeFavorites ? 'bg-theme-primary-light text-theme-primary' : 'text-theme-text-secondary hover:bg-theme-bg-hover'
                    }`}
                  >
                    Sort Favorites First
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Clear all filters button */}
          {(searchQuery || categoryFilter || capacityFilter || priceFilter || showFavorites || prioritizeFavorites) && (
            <button
              onClick={clearAllFilters}
              className="ml-2 text-sm text-theme-primary hover:text-theme-primary transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-md mb-6 shadow-[0_1px_3px_rgba(255,0,0,0.05)]">
          <h3 className="font-medium mb-1">Error fetching vendors</h3>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="py-12 text-center">
          <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-theme-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-theme-text-primary">Loading vendors</h3>
          <p className="mt-1 text-theme-text-secondary">Please wait while we fetch your vendor data.</p>
        </div>
      )}

      {/* Results Summary */}
      {!isLoading && filteredVendors.length > 0 && (
        <div className="mt-4 text-xs text-theme-text-tertiary">
          Showing {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''}
          {(searchQuery || categoryFilter || capacityFilter || priceFilter) && ' matching your filters'}
        </div>
      )}

      {/* Vendor Table View */}
      {!isLoading && filteredVendors.length > 0 && (
        <div className="mt-6 border rounded-md overflow-hidden shadow-sm border-theme-border-subtle bg-theme-bg-card">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-theme-border-subtle">
                <th className="text-left px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-theme-text-tertiary">Vendor</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-theme-text-tertiary">Category</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-theme-text-tertiary">Location</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-theme-text-tertiary">Price</th>
                <th className="w-5"></th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.map((vendor) => (
                <tr 
                  key={vendor.id}
                  onClick={() => router.push(`/${locale}/vendors/${vendor.id}`)}
                  className="border-t border-theme-border-subtle hover:bg-theme-bg-hover transition-colors duration-150 cursor-pointer group relative"
                  tabIndex={0}
                  role="link"
                  aria-label={`View details for ${vendor.name}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/${locale}/vendors/${vendor.id}`);
                    }
                  }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(vendor);
                        }}
                        className={`mr-2 p-1.5 rounded-full ${
                          vendor.isFavorite
                            ? 'text-theme-primary'
                            : 'text-theme-text-tertiary group-hover:text-theme-text-secondary'
                        }`}
                        aria-label={vendor.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill={vendor.isFavorite ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                      </button>
                      <div>
                        <div className="font-medium text-theme-text-primary">{vendor.name}</div>
                        {vendor.contactName && (
                          <div className="text-sm text-theme-text-secondary mt-0.5">
                            {vendor.contactName}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-theme-text-secondary">
                    <span className="capitalize">{vendor.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <div className="text-theme-text-secondary">
                        {vendor.location || 'No location specified'}
                      </div>
                      {vendor.capacity && vendor.capacity > 0 && (
                        <div className="flex items-center text-xs mt-1 text-theme-text-tertiary">
                          <svg className="mr-1" width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                          {vendor.capacity}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-theme-text-secondary">
                    {'$'.repeat(vendor.priceTier)}
                    <span className="text-theme-text-tertiary">{'$'.repeat(4 - vendor.priceTier)}</span>
                    
                    {vendor.rating && (
                      <div className="flex items-center text-xs mt-1 text-theme-text-tertiary">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          stroke="none"
                          className="mr-1"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        {vendor.rating}/5
                      </div>
                    )}
                  </td>
                  
                  {/* Linear-style subtle chevron that appears on hover/focus */}
                  <td className="w-5 opacity-0 group-hover:opacity-40 focus-within:opacity-40 transition-opacity duration-150">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-theme-text-tertiary">
                      <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredVendors.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 mt-6 border border-theme-border-subtle rounded-lg bg-theme-bg-card">
          <svg
            className="w-12 h-12 mb-3 text-theme-text-tertiary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"
            />
            <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" points="17 21 17 13 7 13 7 21" />
            <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" points="7 3 7 8 15 8" />
          </svg>
          <h3 className="text-lg font-medium text-theme-text-primary mb-1">No vendors found</h3>
          <p className="text-theme-text-secondary text-center max-w-sm">
            {vendors.length > 0
              ? "Try adjusting your filters to see more results."
              : "You haven't added any vendors yet. Get started by adding your first vendor."}
          </p>
          {vendors.length === 0 && (
            <Link
              href="/en/vendors/add"
              className="mt-4 px-4 py-2 bg-theme-primary text-white rounded-md text-sm font-medium hover:bg-theme-primary-hover transition-colors duration-200"
            >
              Add Vendor
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default VendorsPage; 