'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Vendor } from '@/types/vendor';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryState, parseAsString, parseAsBoolean } from 'nuqs';
import { colors } from '@/styles/colors';

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
    <div className="w-full max-w-7xl mx-auto p-6" style={{ backgroundColor: colors.background.page }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: colors.text.primary }}>Vendors</h1>
        <Link 
          href="/en/vendors/add"
          className="px-4 py-2 bg-[#5E6AD2] text-white rounded-md text-sm font-medium hover:bg-[#6872E5] transition-all duration-200 border border-transparent hover:border-[#8D95F2] shadow-[0_2px_4px_rgba(0,0,0,0.08),0_1px_2px_rgba(94,106,210,0.2)]"
        >
          Add Vendor
        </Link>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center mb-6 pb-3" style={{ borderBottomColor: colors.border.subtle, borderBottomWidth: '1px' }}>
        {/* Search input - Left aligned */}
        <div className="relative flex-grow max-w-sm mr-3">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none" style={{ color: colors.text.tertiary }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
          </div>
          <input
            value={searchQuery || ''}
            onChange={handleUpdateSearch}
            type="text"
            className="w-full rounded-md pl-10 pr-12 py-1.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2]"
            style={{ 
              backgroundColor: colors.background.input,
              borderColor: colors.border.subtle,
              borderWidth: '1px',
              color: colors.text.primary
            }}
            placeholder="Search vendors..."
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 hover:text-white"
              style={{ color: colors.text.tertiary }}
            >
              <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Category filter */}
          <div className="relative" ref={setDropdownRef('category')} data-dropdown>
            <button
              onClick={(e) => toggleDropdown('category', e)}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-colors
                ${categoryFilter ? 'text-white bg-[#1F1F1F] border border-[#2D2D2D]' : 'text-gray-400 hover:text-white'}`}
            >
              Category
              {categoryFilter && (
                <>
                  <span className="ml-1 text-white">:</span>
                  <span className="ml-1 text-[#5E6AD2]">{getCategoryName(categoryFilter)}</span>
                </>
              )}
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 15 15" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg" 
                className={`ml-1 ${openDropdown === 'category' ? 'rotate-180' : ''}`}
              >
                <path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" />
              </svg>
            </button>
            {openDropdown === 'category' && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-[#1A1A1A] border border-[#262626] rounded-md shadow-lg z-10">
                {Object.keys(categoryOptions).map((value) => (
                  <button
                    key={value}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between
                      ${categoryFilter === value ? 'text-white bg-[#232323]' : 'text-gray-400 hover:bg-[#232323] hover:text-white'}`}
                    onClick={() => {
                      setCategoryFilter(value === categoryFilter ? null : value);
                      setOpenDropdown(null);
                    }}
                  >
                    {getCategoryName(value)}
                    {categoryFilter === value && (
                      <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Capacity filter */}
          <div className="relative" ref={setDropdownRef('capacity')} data-dropdown>
            <button
              onClick={(e) => toggleDropdown('capacity', e)}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-colors
                ${capacityFilter ? 'text-white bg-[#1F1F1F] border border-[#2D2D2D]' : 'text-gray-400 hover:text-white'}`}
            >
              Capacity
              {capacityFilter && (
                <>
                  <span className="ml-1 text-white">:</span>
                  <span className="ml-1 text-[#5E6AD2]">{getCapacityName(capacityFilter)}</span>
                </>
              )}
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 15 15" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg" 
                className={`ml-1 ${openDropdown === 'capacity' ? 'rotate-180' : ''}`}
              >
                <path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" />
              </svg>
            </button>
            {openDropdown === 'capacity' && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-[#1A1A1A] border border-[#262626] rounded-md shadow-lg z-10">
                {Object.entries(capacityOptions).map(([value, label]) => (
                  <button
                    key={value}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between
                      ${capacityFilter === value ? 'text-white bg-[#232323]' : 'text-gray-400 hover:bg-[#232323] hover:text-white'}`}
                    onClick={() => {
                      setCapacityFilter(value === capacityFilter ? null : value);
                      setOpenDropdown(null);
                    }}
                  >
                    {label}
                    {capacityFilter === value && (
                      <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Price filter */}
          <div className="relative" ref={setDropdownRef('price')} data-dropdown>
            <button
              onClick={(e) => toggleDropdown('price', e)}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-colors
                ${priceFilter ? 'text-white bg-[#1F1F1F] border border-[#2D2D2D]' : 'text-gray-400 hover:text-white'}`}
            >
              Price
              {priceFilter && (
                <>
                  <span className="ml-1 text-white">:</span>
                  <span className="ml-1 text-[#5E6AD2]">{getPriceName(priceFilter)}</span>
                </>
              )}
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 15 15" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg" 
                className={`ml-1 ${openDropdown === 'price' ? 'rotate-180' : ''}`}
              >
                <path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" />
              </svg>
            </button>
            {openDropdown === 'price' && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-[#1A1A1A] border border-[#262626] rounded-md shadow-lg z-10">
                {Object.entries(priceOptions).map(([value, label]) => (
                  <button
                    key={value}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between
                      ${priceFilter === value ? 'text-white bg-[#232323]' : 'text-gray-400 hover:bg-[#232323] hover:text-white'}`}
                    onClick={() => {
                      setPriceFilter(value === priceFilter ? null : value);
                      setOpenDropdown(null);
                    }}
                  >
                    {label}
                    {priceFilter === value && (
                      <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Favorites filter */}
          <div className="relative" ref={setDropdownRef('favorites')} data-dropdown>
            <button
              onClick={(e) => toggleDropdown('favorites', e)}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-colors
                ${showFavorites || prioritizeFavorites ? 'text-white bg-[#1F1F1F] border border-[#2D2D2D]' : 'text-gray-400 hover:text-white'}`}
            >
              Favorites
              {(showFavorites || prioritizeFavorites) && (
                <>
                  <span className="ml-1 text-white">:</span>
                  <span className="ml-1 text-[#5E6AD2]">
                    {showFavorites ? 'Show Only' : ''}
                    {showFavorites && prioritizeFavorites ? ' + ' : ''}
                    {prioritizeFavorites ? 'Sort First' : ''}
                  </span>
                </>
              )}
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 15 15" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg" 
                className={`ml-1 ${openDropdown === 'favorites' ? 'rotate-180' : ''}`}
              >
                <path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" />
              </svg>
            </button>
            {openDropdown === 'favorites' && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-[#1A1A1A] border border-[#262626] rounded-md shadow-lg z-10">
                <button
                  className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between
                    ${showFavorites ? 'text-white bg-[#232323]' : 'text-gray-400 hover:bg-[#232323] hover:text-white'}`}
                  onClick={toggleShowFavoritesOnly}
                >
                  Show Favorites Only
                  {showFavorites && (
                    <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                    </svg>
                  )}
                </button>
                <div className="w-full border-t border-[#262626]"></div>
                <button
                  className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between
                    ${prioritizeFavorites ? 'text-white bg-[#232323]' : 'text-gray-400 hover:bg-[#232323] hover:text-white'}`}
                  onClick={togglePrioritizeFavorites}
                >
                  Sort Favorites First
                  {prioritizeFavorites && (
                    <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Clear all filters button */}
          {(searchQuery || categoryFilter || capacityFilter || priceFilter || showFavorites || prioritizeFavorites) && (
            <button
              onClick={clearAllFilters}
              className="ml-2 text-sm text-[#5E6AD2] hover:text-[#6872E5] transition-colors"
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

      {/* Loading State - Enhance with subtle shadow */}
      {isLoading ? (
        <div className="py-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5E6AD2] shadow-[0_0_10px_rgba(94,106,210,0.2)]"></div>
        </div>
      ) : filteredVendors.length === 0 ? (
        // Empty state - Updated for color consistency
        <div className="flex flex-col items-center justify-center h-56 border rounded-lg" 
             style={{ borderColor: colors.border.subtle, backgroundColor: colors.background.card }}>
          {vendors.length === 0 ? (
            <>
              <p className="mb-4" style={{ color: colors.text.secondary }}>No vendors found</p>
              <p className="text-sm mb-6" style={{ color: colors.text.tertiary }}>Add your first vendor to get started</p>
              <Link 
                href="/en/vendors/add"
                className="px-4 py-2 text-sm inline-flex items-center rounded-md transition-colors"
                style={{
                  backgroundColor: colors.background.hover,
                  color: colors.text.secondary,
                  borderColor: colors.border.subtle,
                  borderWidth: '1px'
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                  <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Add Vendor
              </Link>
            </>
          ) : (
            <>
              <p className="mb-4" style={{ color: colors.text.secondary }}>No matching vendors</p>
              <p className="text-sm" style={{ color: colors.text.tertiary }}>Try adjusting your search or filters</p>
            </>
          )}
        </div>
      ) : (
        // Table View - Updated for color consistency
        <div className="border rounded-md overflow-hidden shadow-sm" 
             style={{ borderColor: colors.border.subtle, backgroundColor: colors.background.card }}>
          {/* Table Header */}
          <div className="grid grid-cols-10 text-left border-b" style={{ borderColor: colors.border.subtle }}>
            <div 
              className="col-span-4 px-4 py-3 cursor-pointer hover:bg-[#161616]/80 transition-all duration-150 flex items-center group"
              onClick={() => handleSort('name')}
              role="button"
              aria-sort={sortField === 'name' 
                ? (sortDirection === 'asc' ? 'ascending' : 'descending') 
                : 'none'}
            >
              <span className="text-[13px] font-medium" style={{ color: colors.text.tertiary }}>Name</span>
              <svg 
                className={`ml-1 w-3.5 h-3.5 transition-all duration-150 ${
                  sortField === 'name' 
                    ? 'text-gray-400' 
                    : 'text-gray-500 opacity-0 group-hover:opacity-50'
                }`} 
                viewBox="0 0 14 14" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                {sortField === 'name' && sortDirection === 'desc' ? (
                  <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                ) : (
                  <path d="M3 9L7 5L11 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                )}
              </svg>
            </div>
            <div className="col-span-2 px-4 py-3">
              <span className="text-[13px] font-medium" style={{ color: colors.text.tertiary }}>Category</span>
            </div>
            <div 
              className="col-span-2 px-4 py-3 cursor-pointer hover:bg-[#161616]/80 transition-all duration-150 flex items-center group"
              onClick={() => handleSort('capacity')}
              role="button"
              aria-sort={sortField === 'capacity' 
                ? (sortDirection === 'asc' ? 'ascending' : 'descending') 
                : 'none'}
            >
              <span className="text-[13px] font-medium" style={{ color: colors.text.tertiary }}>Capacity</span>
              <svg 
                className={`ml-1 w-3.5 h-3.5 transition-all duration-150 ${
                  sortField === 'capacity' 
                    ? 'text-gray-400' 
                    : 'text-gray-500 opacity-0 group-hover:opacity-50'
                }`} 
                viewBox="0 0 14 14" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                {sortField === 'capacity' && sortDirection === 'desc' ? (
                  <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                ) : (
                  <path d="M3 9L7 5L11 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                )}
              </svg>
            </div>
            <div 
              className="col-span-2 px-4 py-3 cursor-pointer hover:bg-[#161616]/80 transition-all duration-150 flex items-center group"
              onClick={() => handleSort('priceTier')}
              role="button"
              aria-sort={sortField === 'priceTier' 
                ? (sortDirection === 'asc' ? 'ascending' : 'descending') 
                : 'none'}
            >
              <span className="text-[13px] font-medium" style={{ color: colors.text.tertiary }}>Price</span>
              <svg 
                className={`ml-1 w-3.5 h-3.5 transition-all duration-150 ${
                  sortField === 'priceTier' 
                    ? 'text-gray-400' 
                    : 'text-gray-500 opacity-0 group-hover:opacity-50'
                }`} 
                viewBox="0 0 14 14" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                {sortField === 'priceTier' && sortDirection === 'desc' ? (
                  <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                ) : (
                  <path d="M3 9L7 5L11 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                )}
              </svg>
            </div>
          </div>
          
          {/* Table Rows */}
          {filteredVendors.map((vendor) => (
            <Link
              key={vendor.id}
              href={`/en/vendors/${vendor.id}`}
              className="grid grid-cols-10 text-left border-b border-[#1F1F1F] hover:bg-[#161616]/80 transition-all duration-150 cursor-pointer"
            >
              <div className="col-span-4 px-4 py-3">
                <div className="flex items-center">
                  {vendor.isFavorite ? (
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(vendor);
                      }}
                      className="mr-2 text-[#5E6AD2] hover:opacity-80 transition-opacity relative group"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" />
                      </svg>
                      <span className="absolute left-0 top-full mt-1 whitespace-nowrap bg-[#222222] text-gray-200 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-10">
                        Remove from favorites
                      </span>
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(vendor);
                      }}
                      className="mr-2 text-gray-500 hover:text-gray-300 transition-colors relative group"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" />
                      </svg>
                      <span className="absolute left-0 top-full mt-1 whitespace-nowrap bg-[#222222] text-gray-200 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-10">
                        Add to favorites
                      </span>
                    </button>
                  )}
                  <div>
                    <span className="font-medium text-white">{vendor.name}</span>
                    {vendor.location && (
                      <div className="text-xs text-gray-500 mt-1">{vendor.location}</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-span-2 px-4 py-3">
                <span className="text-gray-400 capitalize">{vendor.category}</span>
              </div>
              <div className="col-span-2 px-4 py-3">
                <span className="text-gray-400">{vendor.capacity || '—'}</span>
              </div>
              <div className="col-span-2 px-4 py-3">
                <div className="inline-flex px-2 py-1 bg-[#1A1A1A]/90 border border-[#2A2A2A] rounded text-xs text-gray-400 shadow-[0_1px_2px_rgba(0,0,0,0.06)] backdrop-blur-[1px]">
                  {Array(vendor.priceTier).fill('$').join('')}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      
      {/* Results Summary */}
      {!isLoading && filteredVendors.length > 0 && (
        <div className="mt-4 text-xs text-gray-500">
          Showing {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''}
          {(searchQuery || categoryFilter || capacityFilter || priceFilter) && ' matching your filters'}
        </div>
      )}
    </div>
  );
}

export default VendorsPage; 