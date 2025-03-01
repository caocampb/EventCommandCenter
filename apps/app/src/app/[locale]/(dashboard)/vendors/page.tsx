'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Vendor } from '@/types/vendor';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';

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
  const [vendors, setVendors] = useState<Vendor[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    capacity: '',
    price: '',
    showFavorites: false,
  });
  
  // Sort state
  const [sortField, setSortField] = useQueryState('sort');
  const [sortDirection, setSortDirection] = useQueryState('dir');
  const [prioritizeFavorites, setPrioritizeFavorites] = useQueryState('favFirst', { 
    parse: (value) => value !== 'false', // Default to true if not explicitly set to false
    serialize: (value) => value ? 'true' : 'false',
  });
  
  // Filter dropdowns
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // Set up dropdown ref
  const setDropdownRef = (key: string) => (el: HTMLDivElement | null) => {
    dropdownRefs.current[key] = el;
  };
  
  const router = useRouter();
  
  // Initialize sort state if not present in URL
  useEffect(() => {
    const initializeSort = async () => {
      if (!sortField) {
        await setSortField('name');
      }
      if (!sortDirection) {
        await setSortDirection('asc');
      }
    };
    
    initializeSort();
  }, [sortField, sortDirection, setSortField, setSortDirection]);
  
  // Handle sort click
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and reset direction to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Fetch vendors with refresh capability
  const loadVendors = useCallback(async () => {
    try {
      console.log("Loading vendors data...");
      setIsLoading(true);
      
      // Use the absolute URL for the API request
      const response = await fetch("http://localhost:3000/api/vendors", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Add cache buster to avoid browser caching
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Error fetching vendors: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched vendors:", data);
      setVendors(data.data as Vendor[]);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Call loadVendors when component mounts or refreshTrigger changes
  useEffect(() => {
    loadVendors();
  }, [loadVendors, refreshTrigger]);
  
  // Toggle favorite status
  const toggleFavorite = async (vendor: Vendor) => {
    const newStatus = !vendor.isFavorite;
    console.log(`Toggling favorite for vendor ${vendor.id} to ${newStatus}`);
    
    try {
      // Optimistically update the UI
      setVendors(prevVendors => {
        console.log('Vendors before update:', prevVendors);
        const updatedVendors = prevVendors ? prevVendors.map(v => 
          v.id === vendor.id ? { ...v, isFavorite: newStatus } : v
        ) : null;
        console.log('Vendors after update:', updatedVendors);
        return updatedVendors;
      });
      console.log('Optimistic update applied');
      
      // Make API call to update the favorite status
      console.log(`Making API call to: http://localhost:3000/api/vendors/${vendor.id}/favorite`);
      const response = await fetch(`http://localhost:3000/api/vendors/${vendor.id}/favorite`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: newStatus })
      });
      
      console.log(`API response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update favorite status: ${response.status} - ${errorText}`);
      }
      
      const responseData = await response.json();
      console.log('API response data:', responseData);
      
      // Trigger a refresh to get the latest data from the server
      // This helps ensure our data is in sync after a short delay
      setTimeout(() => {
        console.log('Refreshing vendors data after favorite toggle');
        setRefreshTrigger(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error toggling favorite status:', error);
      
      // If the API call fails, revert the optimistic update
      setVendors(prevVendors => 
        prevVendors ? prevVendors.map(v => 
          v.id === vendor.id ? { ...v, isFavorite: !newStatus } : v
        ) : null
      );
      console.log('Optimistic update reverted due to error');
    }
  };
  
  // Filter vendors based on search term, category, capacity, and price
  const filteredVendors = vendors?.filter(vendor => {
    // Apply search filter
    const matchesSearch = searchQuery === '' || 
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vendor.location && vendor.location.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Apply category filter
    const matchesCategory = filters.category === '' || vendor.category === filters.category;
    
    // Apply capacity filter
    let matchesCapacity = true;
    if (filters.capacity !== '') {
      const capacity = vendor.capacity || 0;
      
      switch (filters.capacity) {
        case 'small':
          matchesCapacity = capacity > 0 && capacity <= 50;
          break;
        case 'medium':
          matchesCapacity = capacity >= 51 && capacity <= 100;
          break;
        case 'large':
          matchesCapacity = capacity >= 101 && capacity <= 250;
          break;
        case 'xl':
          matchesCapacity = capacity >= 251 && capacity <= 500;
          break;
        case 'xxl':
          matchesCapacity = capacity > 500;
          break;
      }
    }
    
    // Apply price filter
    let matchesPrice = true;
    if (filters.price !== '') {
      // If price filter is a string representation of a tier (like "1", "2", "3")
      if (filters.price === "budget" || filters.price === "moderate" || filters.price === "premium") {
        // Handle named price tiers
        const tierMap: Record<string, number> = {
          budget: 1,
          moderate: 2,
          premium: 3
        };
        
        const tierValue = tierMap[filters.price] || 0;
        matchesPrice = vendor.priceTier === tierValue;
      } else {
        // Try to convert to a number and filter
        const priceTierValue = parseInt(filters.price, 10);
        if (!isNaN(priceTierValue)) {
          matchesPrice = vendor.priceTier === priceTierValue;
        }
      }
    }
    
    // Apply favorites filter
    const matchesFavorites = !filters.showFavorites || vendor.isFavorite;
    
    return matchesSearch && matchesCategory && matchesCapacity && matchesPrice && matchesFavorites;
  });
  
  // Modify the sorting logic to handle filters properly
  const sortedVendors = useMemo(() => {
    console.log('sortedVendors useMemo recomputing');
    if (!vendors) return [];
    
    let filtered = [...vendors];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(vendor => 
        vendor.name.toLowerCase().includes(query) || 
        (vendor.location && vendor.location.toLowerCase().includes(query))
      );
    }
    
    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(vendor => vendor.category === filters.category);
    }
    
    // Apply capacity filter
    if (filters.capacity) {
      filtered = filtered.filter(vendor => {
        // Need to handle different capacity formats
        if (typeof vendor.capacity === 'string' && typeof filters.capacity === 'string') {
          return vendor.capacity === filters.capacity;
        }
        return false;
      });
    }
    
    // Apply price filter
    if (filters.price) {
      // Handle different price tier representations
      const priceTiers: Record<string, number> = {
        'budget': 1,
        'moderate': 2,
        'premium': 3,
        'luxury': 4
      };
      
      // If it's a named tier
      if (filters.price in priceTiers) {
        const tierValue = priceTiers[filters.price];
        filtered = filtered.filter(vendor => vendor.priceTier === tierValue);
      } 
      // If it's a numeric string
      else if (/^\d+$/.test(filters.price)) {
        const priceTierValue = parseInt(filters.price, 10);
        filtered = filtered.filter(vendor => vendor.priceTier === priceTierValue);
      }
    }
    
    // Apply favorites filter
    if (filters.showFavorites) {
      filtered = filtered.filter(vendor => vendor.isFavorite);
    }
    
    // Sort the filtered vendors
    return filtered.sort((a, b) => {
      // First prioritize favorites if enabled
      if (prioritizeFavorites) {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
      }
      
      // Then sort by the selected field
      if (sortField === 'name') {
        return sortDirection === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      
      if (sortField === 'capacity') {
        // Make sure we're parsing strings to numbers safely with fallbacks
        const aCapacity = typeof a.capacity === 'string' ? parseInt(a.capacity, 10) || 0 : (a.capacity || 0);
        const bCapacity = typeof b.capacity === 'string' ? parseInt(b.capacity, 10) || 0 : (b.capacity || 0);
        return sortDirection === 'asc' ? aCapacity - bCapacity : bCapacity - aCapacity;
      }
      
      if (sortField === 'priceTier') {
        return sortDirection === 'asc' 
          ? a.priceTier - b.priceTier 
          : b.priceTier - a.priceTier;
      }
      
      return 0;
    });
  }, [vendors, searchQuery, filters, sortField, sortDirection, prioritizeFavorites]);

  // Get category display name
  const getCategoryName = (value: string): string => {
    const categories: Record<string, string> = {
      'venue': 'Venue',
      'catering': 'Catering',
      'entertainment': 'Entertainment',
      'staffing': 'Staffing',
      'equipment': 'Equipment',
      'transportation': 'Transportation',
      'other': 'Other'
    };
    return categories[value] || value;
  };

  // Get capacity display name
  const getCapacityName = (value: string): string => {
    const capacities: Record<string, string> = {
      'small': 'Up to 50',
      'medium': '51-100',
      'large': '101-250',
      'xl': '251-500',
      'xxl': '500+'
    };
    return capacities[value] || value;
  };

  // Get price display name
  const getPriceName = (value: string): string => {
    const prices: Record<string, string> = {
      'budget': '$ Budget',
      'moderate': '$$ Moderate',
      'premium': '$$$ Premium',
      'luxury': '$$$$ Luxury'
    };
    return prices[value] || value;
  };

  // Clear a specific filter
  const clearFilter = (filterType: 'search' | 'category' | 'capacity' | 'price' | 'showFavorites', e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    switch (filterType) {
      case 'search':
        setSearchQuery('');
        break;
      case 'category':
        setFilters({...filters, category: ''});
        break;
      case 'capacity':
        setFilters({...filters, capacity: ''});
        break;
      case 'price':
        setFilters({...filters, price: ''});
        break;
      case 'showFavorites':
        setFilters({...filters, showFavorites: false});
        break;
    }
  };
  
  // Toggle dropdown visibility
  const toggleDropdown = (dropdown: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };
  
  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      // Don't close if clicking on a dropdown or its menu
      const clickedElement = e.target as HTMLElement;
      const isDropdownClick = clickedElement.closest('[data-dropdown]');
      
      if (!isDropdownClick) {
        setOpenDropdown(null);
      }
    };
    
    document.addEventListener('click', handleOutsideClick);
    
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  // Add debugging - log when vendors state changes
  useEffect(() => {
    if (vendors) {
      console.log('vendors state changed:', vendors.length, 'vendors');
      // Log favorite state of first 3 vendors for debugging
      vendors.slice(0, 3).forEach(v => {
        console.log(`Vendor ${v.id} favorite status: ${v.isFavorite}`);
      });
    }
  }, [vendors]);

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-white">Vendors</h1>
        <Link 
          href="/en/vendors/add" 
          className="px-4 py-2 bg-[#5E6AD2] text-white rounded-md text-sm font-medium hover:bg-[#6872E5] transition-all duration-200 border border-transparent hover:border-[#8D95F2] shadow-[0_2px_4px_rgba(0,0,0,0.08),0_1px_2px_rgba(94,106,210,0.2)]"
        >
          Add Vendor
        </Link>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center mb-6 border-b border-[#1F1F1F] pb-3">
        {/* Search input - Left aligned */}
        <div className="relative flex-grow max-w-sm mr-3">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
              <path d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
          </div>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            type="text"
            className="w-full bg-transparent border border-[#262626] rounded-md pl-10 pr-12 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2]"
            placeholder="Search vendors..."
          />
          {searchQuery && (
            <button
              onClick={(e) => clearFilter('search', e)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
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
                ${filters.category ? 'text-white bg-[#1F1F1F] border border-[#2D2D2D]' : 'text-gray-400 hover:text-white'}`}
            >
              Category
              {filters.category && (
                <>
                  <span className="ml-1 text-white">:</span>
                  <span className="ml-1 text-[#5E6AD2]">{getCategoryName(filters.category)}</span>
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
                      ${filters.category === value ? 'text-white bg-[#232323]' : 'text-gray-400 hover:bg-[#232323] hover:text-white'}`}
                    onClick={() => {
                      setFilters({
                        ...filters,
                        category: filters.category === value ? '' : value
                      });
                      setOpenDropdown(null);
                    }}
                  >
                    {getCategoryName(value)}
                    {filters.category === value && (
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
                ${filters.capacity ? 'text-white bg-[#1F1F1F] border border-[#2D2D2D]' : 'text-gray-400 hover:text-white'}`}
            >
              Capacity
              {filters.capacity && (
                <>
                  <span className="ml-1 text-white">:</span>
                  <span className="ml-1 text-[#5E6AD2]">{getCapacityName(filters.capacity)}</span>
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
                {Object.keys(capacityOptions).map((value) => (
                  <button
                    key={value}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between
                      ${filters.capacity === value ? 'text-white bg-[#232323]' : 'text-gray-400 hover:bg-[#232323] hover:text-white'}`}
                    onClick={() => {
                      setFilters({
                        ...filters,
                        capacity: filters.capacity === value ? '' : value
                      });
                      setOpenDropdown(null);
                    }}
                  >
                    {getCapacityName(value)}
                    {filters.capacity === value && (
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
                ${filters.price ? 'text-white bg-[#1F1F1F] border border-[#2D2D2D]' : 'text-gray-400 hover:text-white'}`}
            >
              Price
              {filters.price && (
                <>
                  <span className="ml-1 text-white">:</span>
                  <span className="ml-1 text-[#5E6AD2]">{getPriceName(filters.price)}</span>
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
                {Object.keys(priceOptions).map((value) => (
                  <button
                    key={value}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between
                      ${filters.price === value ? 'text-white bg-[#232323]' : 'text-gray-400 hover:bg-[#232323] hover:text-white'}`}
                    onClick={() => {
                      setFilters({
                        ...filters,
                        price: filters.price === value ? '' : value
                      });
                      setOpenDropdown(null);
                    }}
                  >
                    {getPriceName(value)}
                    {filters.price === value && (
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
                ${filters.showFavorites || prioritizeFavorites ? 'text-white bg-[#1F1F1F] border border-[#2D2D2D]' : 'text-gray-400 hover:text-white'}`}
            >
              Favorites
              {(filters.showFavorites || prioritizeFavorites) && (
                <>
                  <span className="ml-1 text-white">:</span>
                  <span className="ml-1 text-[#5E6AD2]">
                    {filters.showFavorites ? 'Show Only' : prioritizeFavorites ? 'Sort First' : ''}
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
                    ${filters.showFavorites ? 'text-white bg-[#232323]' : 'text-gray-400 hover:bg-[#232323] hover:text-white'}`}
                  onClick={() => {
                    setFilters({
                      ...filters,
                      showFavorites: !filters.showFavorites
                    });
                    setOpenDropdown(null);
                  }}
                >
                  Show Favorites Only
                  {filters.showFavorites && (
                    <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                    </svg>
                  )}
                </button>
                <button
                  className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between
                    ${prioritizeFavorites ? 'text-white bg-[#232323]' : 'text-gray-400 hover:bg-[#232323] hover:text-white'}`}
                  onClick={() => {
                    setPrioritizeFavorites(!prioritizeFavorites);
                    setOpenDropdown(null);
                  }}
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
          {(searchQuery || filters.category || filters.capacity || filters.price || filters.showFavorites || prioritizeFavorites) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilters({
                  category: '',
                  capacity: '',
                  price: '',
                  showFavorites: false
                });
                setPrioritizeFavorites(false);
              }}
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
      ) : sortedVendors.length === 0 ? (
        // Empty State - Add subtle shadow and glass effect
        <div className="bg-[#141414]/90 border border-[#1F1F1F] rounded-md p-8 text-center shadow-[0_2px_6px_rgba(0,0,0,0.1)] backdrop-blur-[2px]">
          {vendors?.length === 0 ? (
            <>
              <p className="text-gray-400 mb-4">No vendors found</p>
              <p className="text-gray-500 text-sm mb-6">Add your first vendor to get started</p>
              <Link 
                href="/en/vendors/add" 
                className="px-4 py-2 bg-[#1E1E1E] hover:bg-[#2A2A2A] text-gray-400 rounded-md text-sm inline-flex items-center transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                  <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Add Vendor
              </Link>
            </>
          ) : (
            <>
              <p className="text-gray-400 mb-4">No matching vendors</p>
              <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
            </>
          )}
        </div>
      ) : (
        // Table View - Enhanced with glass effects
        <div className="bg-[#141414]/90 border border-[#1F1F1F] rounded-md overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.12)] backdrop-blur-[2px]">
          {/* Table Header */}
          <div className="grid grid-cols-12 text-left border-b border-[#1F1F1F] bg-[#131313]/95 backdrop-blur-[4px]">
            <div 
              className="col-span-4 px-4 py-3 cursor-pointer hover:bg-[#161616]/80 transition-all duration-150 flex items-center group"
              onClick={() => handleSort('name')}
              role="button"
              aria-sort={sortField === 'name' 
                ? (sortDirection === 'asc' ? 'ascending' : 'descending') 
                : 'none'}
            >
              <span className="text-[13px] font-medium text-gray-400">Name</span>
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
              <span className="text-[13px] font-medium text-gray-400">Category</span>
            </div>
            <div 
              className="col-span-2 px-4 py-3 cursor-pointer hover:bg-[#161616]/80 transition-all duration-150 flex items-center group"
              onClick={() => handleSort('capacity')}
              role="button"
              aria-sort={sortField === 'capacity' 
                ? (sortDirection === 'asc' ? 'ascending' : 'descending') 
                : 'none'}
            >
              <span className="text-[13px] font-medium text-gray-400">Capacity</span>
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
              <span className="text-[13px] font-medium text-gray-400">Price</span>
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
            <div className="col-span-2 px-4 py-3 text-right">
              <span className="text-[13px] font-medium text-gray-400">Actions</span>
            </div>
          </div>
          
          {/* Table Rows */}
          {sortedVendors.map((vendor) => (
            <Link 
              key={vendor.id}
              href={`/en/vendors/${vendor.id}`}
              className="grid grid-cols-12 text-left border-b border-[#1F1F1F] hover:bg-[#161616]/80 transition-all duration-150 cursor-pointer"
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
              <div className="col-span-2 px-4 py-3 text-right">
                <div className="flex items-center justify-end space-x-4">
                  <Link 
                    href={`/en/vendors/${vendor.id}`} 
                    className="text-gray-400 hover:text-white transition-colors duration-150 relative group"
                    aria-label="View vendor"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#222222] text-gray-200 text-xs px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap border border-[#333333] shadow-[0_2px_6px_rgba(0,0,0,0.25),0_1px_2px_rgba(0,0,0,0.3)]">
                      View details
                    </span>
                  </Link>
                  <Link 
                    href={`/en/vendors/${vendor.id}/edit`} 
                    className="text-gray-400 hover:text-white transition-colors duration-150 relative group"
                    aria-label="Edit vendor"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(`/en/vendors/${vendor.id}/edit`);
                    }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="absolute -top-8 right-0 bg-[#222222] text-gray-200 text-xs px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap border border-[#333333] shadow-[0_2px_6px_rgba(0,0,0,0.25),0_1px_2px_rgba(0,0,0,0.3)]">
                      Edit vendor
                    </span>
                  </Link>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      
      {/* Results Summary */}
      {!isLoading && sortedVendors.length > 0 && (
        <div className="mt-4 text-xs text-gray-500">
          Showing {sortedVendors.length} vendor{sortedVendors.length !== 1 ? 's' : ''}
          {(searchQuery || filters.category || filters.capacity || filters.price) && ' matching your filters'}
        </div>
      )}
    </div>
  );
}

export default VendorsPage; 