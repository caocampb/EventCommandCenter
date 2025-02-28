'use client';

import { useState, useEffect } from 'react';
import { Vendor } from "@/types/vendor";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Sort direction type
type SortDirection = 'asc' | 'desc';

// Sort field type
type SortField = 'name' | 'capacity' | 'priceTier' | null;

function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [favoritesFilter, setFavoritesFilter] = useState(false);
  
  // Sort state
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Dropdown state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  const router = useRouter();
  
  // Handle sort click
  const handleSort = (field: SortField) => {
    // If clicking the same field, toggle direction
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, set it and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Fetch vendors
  useEffect(() => {
    async function loadVendors() {
      try {
        // Use the absolute URL for the API request
        const response = await fetch("http://localhost:3000/api/vendors", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
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
        setLoading(false);
      }
    }
    
    loadVendors();
  }, []);
  
  // Toggle a vendor's favorite status
  const toggleFavorite = async (vendor: Vendor) => {
    try {
      const newStatus = !vendor.isFavorite;
      
      // Optimistically update the UI
      setVendors(prevVendors => 
        prevVendors.map(v => 
          v.id === vendor.id ? { ...v, isFavorite: newStatus } : v
        )
      );
      
      // Call the API to update the backend
      const response = await fetch(`/api/vendors/${vendor.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isFavorite: newStatus }),
      });
      
      if (!response.ok) {
        // If the API call fails, revert the optimistic update
        setVendors(prevVendors => 
          prevVendors.map(v => 
            v.id === vendor.id ? { ...v, isFavorite: !newStatus } : v
          )
        );
        throw new Error('Failed to update favorite status');
      }
    } catch (error) {
      console.error('Error updating favorite status:', error);
    }
  };
  
  // Filter vendors based on search term, category, capacity, and price
  const filteredVendors = vendors.filter(vendor => {
    // Apply search filter
    const matchesSearch = searchTerm === '' || 
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vendor.location && vendor.location.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Apply category filter
    const matchesCategory = categoryFilter === '' || vendor.category === categoryFilter;
    
    // Apply capacity filter
    let matchesCapacity = true;
    if (capacityFilter !== '') {
      const capacity = vendor.capacity || 0;
      
      switch (capacityFilter) {
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
    if (priceFilter !== '') {
      const priceTier = vendor.priceTier || 0;
      
      switch (priceFilter) {
        case 'budget':
          matchesPrice = priceTier === 1;
          break;
        case 'moderate':
          matchesPrice = priceTier === 2;
          break;
        case 'premium':
          matchesPrice = priceTier === 3;
          break;
        case 'luxury':
          matchesPrice = priceTier === 4;
          break;
      }
    }
    
    // Apply favorites filter
    const matchesFavorites = !favoritesFilter || vendor.isFavorite;
    
    return matchesSearch && matchesCategory && matchesCapacity && matchesPrice && matchesFavorites;
  });
  
  // Sort the filtered vendors
  const sortedVendors = [...filteredVendors].sort((a, b) => {
    if (!sortField) return 0;
    
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    
    if (sortField === 'name') {
      return multiplier * a.name.localeCompare(b.name);
    }
    
    if (sortField === 'capacity') {
      const capacityA = a.capacity || 0;
      const capacityB = b.capacity || 0;
      return multiplier * (capacityA - capacityB);
    }
    
    if (sortField === 'priceTier') {
      const priceA = a.priceTier || 0;
      const priceB = b.priceTier || 0;
      return multiplier * (priceA - priceB);
    }
    
    return 0;
  });

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
  const clearFilter = (filterType: 'search' | 'category' | 'capacity' | 'price' | 'favorites', e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    switch (filterType) {
      case 'search':
        setSearchTerm('');
        break;
      case 'category':
        setCategoryFilter('');
        break;
      case 'capacity':
        setCapacityFilter('');
        break;
      case 'price':
        setPriceFilter('');
        break;
      case 'favorites':
        setFavoritesFilter(false);
        break;
    }
  };
  
  // Toggle dropdown visibility
  const toggleDropdown = (dropdown: string, e: React.MouseEvent) => {
    // Stop event propagation to prevent document click from immediately closing the dropdown
    e.stopPropagation();
    
    if (openDropdown === dropdown) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(dropdown);
    }
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

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Search Input */}
        <div className="relative flex-grow max-w-md">
          <input
            type="text"
            placeholder="Search vendors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] placeholder:text-gray-600 transition-colors duration-150 text-sm"
          />
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="absolute left-3 top-3 text-gray-500">
            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {searchTerm && (
            <button
              onClick={(e) => clearFilter('search', e)}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
                <path d="M18 6L6 18M6 6L18 18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
        
        {/* Category Filter */}
        <div className="relative" data-dropdown="category">
          <button
            onClick={(e) => toggleDropdown('category', e)}
            className={`px-3 py-1.5 text-sm rounded-md flex items-center hover:bg-[#1C1C1C] ${
              categoryFilter ? 'bg-[#5E6AD2]/10 text-[#5E6AD2] hover:bg-[#5E6AD2]/15' : 'bg-[#141414] text-gray-300 border border-[#1F1F1F]'
            }`}
          >
            <span>Category</span>
            {categoryFilter && (
              <>
                <span className="inline-block mx-1">:</span>
                <span className="font-medium capitalize">{getCategoryName(categoryFilter)}</span>
                <button
                  onClick={(e) => clearFilter('category', e)}
                  className="ml-1.5 text-gray-400 hover:text-white"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3.5 h-3.5">
                    <path d="M18 6L6 18M6 6L18 18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </>
            )}
            {!categoryFilter && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="ml-1.5 w-3.5 h-3.5 text-gray-500">
                <path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          
          {/* Category Dropdown */}
          {openDropdown === 'category' && (
            <div className="absolute z-10 mt-1 w-56 rounded-md shadow-lg bg-[#1A1A1A] border border-[#262626] overflow-hidden">
              <div className="py-1.5">
                {Object.entries({
                  'venue': 'Venue',
                  'catering': 'Catering',
                  'entertainment': 'Entertainment',
                  'staffing': 'Staffing',
                  'equipment': 'Equipment',
                  'transportation': 'Transportation',
                  'other': 'Other'
                }).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCategoryFilter(value);
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      categoryFilter === value 
                        ? 'bg-[#5E6AD2] text-white' 
                        : 'text-gray-300 hover:bg-[#252525]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Capacity Filter */}
        <div className="relative" data-dropdown="capacity">
          <button
            onClick={(e) => toggleDropdown('capacity', e)}
            className={`px-3 py-1.5 text-sm rounded-md flex items-center hover:bg-[#1C1C1C] ${
              capacityFilter ? 'bg-[#5E6AD2]/10 text-[#5E6AD2] hover:bg-[#5E6AD2]/15' : 'bg-[#141414] text-gray-300 border border-[#1F1F1F]'
            }`}
          >
            <span>Capacity</span>
            {capacityFilter && (
              <>
                <span className="inline-block mx-1">:</span>
                <span className="font-medium">{getCapacityName(capacityFilter)}</span>
                <button
                  onClick={(e) => clearFilter('capacity', e)}
                  className="ml-1.5 text-gray-400 hover:text-white"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3.5 h-3.5">
                    <path d="M18 6L6 18M6 6L18 18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </>
            )}
            {!capacityFilter && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="ml-1.5 w-3.5 h-3.5 text-gray-500">
                <path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          
          {/* Capacity Dropdown */}
          {openDropdown === 'capacity' && (
            <div className="absolute z-10 mt-1 w-56 rounded-md shadow-lg bg-[#1A1A1A] border border-[#262626] overflow-hidden">
              <div className="py-1.5">
                {Object.entries({
                  'small': 'Up to 50',
                  'medium': '51-100',
                  'large': '101-250',
                  'xl': '251-500',
                  'xxl': '500+'
                }).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCapacityFilter(value);
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      capacityFilter === value 
                        ? 'bg-[#5E6AD2] text-white' 
                        : 'text-gray-300 hover:bg-[#252525]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Price Filter */}
        <div className="relative" data-dropdown="price">
          <button
            onClick={(e) => toggleDropdown('price', e)}
            className={`px-3 py-1.5 text-sm rounded-md flex items-center hover:bg-[#1C1C1C] ${
              priceFilter ? 'bg-[#5E6AD2]/10 text-[#5E6AD2] hover:bg-[#5E6AD2]/15' : 'bg-[#141414] text-gray-300 border border-[#1F1F1F]'
            }`}
          >
            <span>Price</span>
            {priceFilter && (
              <>
                <span className="inline-block mx-1">:</span>
                <span className="font-medium">{getPriceName(priceFilter)}</span>
                <button
                  onClick={(e) => clearFilter('price', e)}
                  className="ml-1.5 text-gray-400 hover:text-white"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3.5 h-3.5">
                    <path d="M18 6L6 18M6 6L18 18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </>
            )}
            {!priceFilter && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="ml-1.5 w-3.5 h-3.5 text-gray-500">
                <path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          
          {/* Price Dropdown */}
          {openDropdown === 'price' && (
            <div className="absolute z-10 mt-1 w-56 rounded-md shadow-lg bg-[#1A1A1A] border border-[#262626] overflow-hidden">
              <div className="py-1.5">
                {Object.entries({
                  'budget': '$ Budget',
                  'moderate': '$$ Moderate',
                  'premium': '$$$ Premium',
                  'luxury': '$$$$ Luxury'
                }).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPriceFilter(value);
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      priceFilter === value 
                        ? 'bg-[#5E6AD2] text-white' 
                        : 'text-gray-300 hover:bg-[#252525]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Favorites Filter */}
        <div className="relative">
          <button
            onClick={() => setFavoritesFilter(prev => !prev)}
            className={`px-3 py-1.5 text-sm rounded-md flex items-center hover:bg-[#1C1C1C] ${
              favoritesFilter ? 'bg-[#5E6AD2]/10 text-[#5E6AD2] hover:bg-[#5E6AD2]/15' : 'bg-[#141414] text-gray-300 border border-[#1F1F1F]'
            }`}
          >
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill={favoritesFilter ? "currentColor" : "none"} 
              stroke="currentColor" 
              className="mr-1.5"
            >
              <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Favorites</span>
            {favoritesFilter && (
              <button
                onClick={(e) => clearFilter('favorites', e)}
                className="ml-1.5 text-gray-400 hover:text-white"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3.5 h-3.5">
                  <path d="M18 6L6 18M6 6L18 18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </button>
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
      {loading ? (
        <div className="py-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5E6AD2] shadow-[0_0_10px_rgba(94,106,210,0.2)]"></div>
        </div>
      ) : sortedVendors.length === 0 ? (
        // Empty State - Add subtle shadow and glass effect
        <div className="bg-[#141414]/90 border border-[#1F1F1F] rounded-md p-8 text-center shadow-[0_2px_6px_rgba(0,0,0,0.1)] backdrop-blur-[2px]">
          {vendors.length === 0 ? (
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
            <div 
              key={vendor.id}
              className="grid grid-cols-12 text-left border-b border-[#1F1F1F] hover:bg-[#161616]/80 transition-all duration-150"
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
            </div>
          ))}
        </div>
      )}
      
      {/* Results Summary */}
      {!loading && sortedVendors.length > 0 && (
        <div className="mt-4 text-xs text-gray-500">
          Showing {sortedVendors.length} vendor{sortedVendors.length !== 1 ? 's' : ''}
          {(searchTerm || categoryFilter || capacityFilter || priceFilter) && ' matching your filters'}
        </div>
      )}
    </div>
  );
}

export default VendorsPage; 