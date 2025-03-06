'use client';

import type { BudgetItem } from '@/types/budget';
import { useState, useRef, useEffect, useCallback } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/20/solid';
import { formatCurrency } from '@/lib/utils';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface BudgetItemsListProps {
  items: BudgetItem[];
  categories: string[];
  getVendorName: (vendorId?: string) => string;
  onUpdateAmount: (item: BudgetItem, amount: number) => Promise<void>;
  onTogglePaid: (item: BudgetItem) => Promise<void>;
  onDeleteItem: (item: BudgetItem) => Promise<void>;
  trackUserActivity: () => void;
  participantCount: number;
}

export function BudgetItemsList({
  items,
  categories,
  getVendorName,
  onUpdateAmount,
  onTogglePaid,
  onDeleteItem,
  trackUserActivity,
  participantCount
}: BudgetItemsListProps) {
  // State for category filters
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  
  // For editing actual amounts
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const editInputRef = useRef<HTMLInputElement>(null);
  
  // Filter items based on active category filters
  const filteredItems = useCallback(() => {
    if (activeFilters.length === 0) {
      return items;
    }
    return items.filter(item => activeFilters.includes(item.category));
  }, [items, activeFilters]);
  
  // Toggle a category filter on/off
  const toggleCategoryFilter = useCallback((category: string) => {
    trackUserActivity();
    setActiveFilters(prev => {
      if (prev.includes(category)) {
        return prev.filter(cat => cat !== category);
      } else {
        return [...prev, category];
      }
    });
  }, [trackUserActivity]);
  
  // Clear all filters
  const clearAllFilters = useCallback(() => {
    trackUserActivity();
    setActiveFilters([]);
  }, [trackUserActivity]);
  
  // Check if a filter is active
  const isFilterActive = useCallback((category: string) => {
    return activeFilters.includes(category);
  }, [activeFilters]);
  
  // Start editing an item's actual amount
  const startEditing = useCallback((item: BudgetItem) => {
    trackUserActivity();
    setEditingItemId(item.id);
    setEditValue(item.actualAmount?.toString() || '');
    
    // Focus on the input after a short delay (to allow rendering)
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.select();
      }
    }, 50);
  }, [trackUserActivity]);
  
  // Save edit
  const handleSaveEdit = useCallback((item: BudgetItem) => {
    trackUserActivity();
    
    if (editingItemId === item.id) {
      const newValue = parseFloat(editValue);
      if (!isNaN(newValue) && newValue >= 0) {
        onUpdateAmount(item, newValue);
      }
      setEditingItemId(null);
    }
  }, [editingItemId, editValue, onUpdateAmount, trackUserActivity]);
  
  // Toggle paid status
  const handleTogglePaid = useCallback((item: BudgetItem) => {
    trackUserActivity();
    onTogglePaid(item);
  }, [onTogglePaid, trackUserActivity]);
  
  // Delete item
  const handleDeleteItem = useCallback((item: BudgetItem) => {
    trackUserActivity();
    
    if (confirm('Are you sure you want to delete this budget item?')) {
      onDeleteItem(item);
    }
  }, [onDeleteItem, trackUserActivity]);
  
  // Format currency
  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  return (
    <div className="border border-border-primary rounded-md overflow-hidden bg-bg-secondary">
      <div className="p-5 border-b border-border-primary flex justify-between items-center">
        <h2 className="text-[15px] font-medium text-text-primary">Budget Items</h2>
        
        {/* Action buttons container */}
        <div className="flex items-center gap-3">
          {/* Filter button */}
          {categories.length > 0 && (
            <div className="relative" id="filter-dropdown-container">
              <button
                onClick={() => {
                  trackUserActivity();
                  setIsFilterDropdownOpen(!isFilterDropdownOpen);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors duration-120 ${
                  activeFilters.length > 0 
                    ? 'bg-bg-tertiary text-text-primary border border-border-primary' 
                    : 'text-text-tertiary hover:text-text-primary transition-colors duration-150'
                }`}
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.5 8.5v-6a.5.5 0 011 0v6a.5.5 0 01-1 0z" fill="currentColor"></path>
                  <path d="M9.5 12.5v-10a.5.5 0 00-1 0v10a.5.5 0 001 0z" fill="currentColor"></path>
                  <path d="M3 8.5a3 3 0 116 0 3 3 0 01-6 0z" fill="currentColor"></path>
                  <path d="M7 12.5a3 3 0 100-6 3 3 0 000 6z" fill="currentColor"></path>
                </svg>
                Filter
                {activeFilters.length > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full bg-primary-default text-white">
                    {activeFilters.length}
                  </span>
                )}
              </button>
              
              {isFilterDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-bg-tertiary border border-border-primary rounded-md shadow-lg overflow-hidden z-10">
                  <div className="p-3 border-b border-border-primary flex justify-between items-center">
                    <h3 className="text-[13px] font-medium text-text-primary">Filter by Category</h3>
                    <button 
                      onClick={clearAllFilters}
                      className="text-[12px] text-primary-default hover:text-primary-hover"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {categories.map(category => (
                      <button
                        key={category}
                        className={`flex items-center w-full px-3 py-2 text-left text-[13px] ${
                          isFilterActive(category) ? 'text-text-primary bg-bg-hover' : 'text-text-tertiary hover:bg-bg-hover/50'
                        }`}
                        onClick={() => toggleCategoryFilter(category)}
                      >
                        <div className={`w-4 h-4 mr-2 rounded border flex items-center justify-center ${
                          isFilterActive(category) 
                            ? 'bg-primary-default border-primary-default' 
                            : 'border-border-strong'
                        }`}>
                          {isFilterActive(category) && (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8.54 3.12L4.4 7.25a.5.5 0 01-.8 0L1.7 5.34a.5.5 0 01.7-.7l1.6 1.58L7.85 2.4a.5.5 0 01.7.72z" fill="white"></path>
                            </svg>
                          )}
                        </div>
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {filteredItems().length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-gray-400 text-sm mb-2">No budget items found</p>
          {activeFilters.length > 0 && (
            <button 
              onClick={clearAllFilters} 
              className="text-[#5E6AD2] hover:text-[#6872E5] text-sm"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0F0F0F]">
              <tr>
                <th className="px-4 py-3 text-left text-[13px] font-medium text-gray-400">Description</th>
                <th className="px-4 py-3 text-left text-[13px] font-medium text-gray-400">Category</th>
                <th className="px-4 py-3 text-left text-[13px] font-medium text-gray-400">Vendor</th>
                <th className="px-4 py-3 text-right text-[13px] font-medium text-gray-400">Planned</th>
                <th className="px-4 py-3 text-right text-[13px] font-medium text-gray-400">Actual</th>
                <th className="px-4 py-3 text-center text-[13px] font-medium text-gray-400">Status</th>
                <th className="px-4 py-3 text-right text-[13px] font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems().map((item) => (
                <tr key={item.id} className="border-t border-[#1F1F1F] hover:bg-[#0F0F0F]">
                  <td className="px-4 py-3 text-[14px] text-white">
                    <div className="flex flex-col">
                      <span className="font-medium">{item.description}</span>
                      {item.notes && <span className="text-[12px] mt-0.5 text-gray-500">{item.notes}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[14px] text-white">
                    <span className="px-2 py-1 rounded-full text-[12px] font-medium bg-[#5E6AD2]/10 text-[#5E6AD2]">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[14px] text-white">
                    {getVendorName(item.vendorId)}
                  </td>
                  <td className="px-4 py-3 text-[14px] text-right text-white">
                    <div>
                      <span className="tabular-nums">{formatCurrency(item.plannedAmount)}</span>
                      {item.isPerAttendee && participantCount > 0 && (
                        <div className="text-[11px] text-gray-400 mt-1">
                          {formatCurrency(item.plannedAmount / participantCount)} / person
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[14px] text-right text-white">
                    {editingItemId === item.id ? (
                      <input
                        ref={editInputRef}
                        type="number"
                        value={editValue}
                        onChange={(e) => {
                          trackUserActivity();
                          setEditValue(e.target.value);
                        }}
                        onBlur={() => handleSaveEdit(item)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(item);
                          if (e.key === 'Escape') setEditingItemId(null);
                        }}
                        className="w-24 bg-[#0F0F0F] border border-[#5E6AD2] rounded text-[14px] text-white text-right px-2 py-1"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => startEditing(item)}
                        className="text-[14px] text-white hover:text-[#5E6AD2] transition-colors duration-150"
                      >
                        {formatCurrency(item.actualAmount)}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleTogglePaid(item)}
                      className={`inline-block text-[11px] font-medium px-2 py-1 rounded-full ${
                        item.isPaid 
                          ? 'bg-[#4CC38A]/10 text-[#4CC38A]' 
                          : 'bg-[#444444]/20 text-gray-400'
                      }`}
                    >
                      {item.isPaid ? 'Paid' : 'Unpaid'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDeleteItem(item)}
                      className="text-gray-400 hover:text-[#E5484D] transition-colors duration-150"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 7V18C6 19.1046 6.89543 20 8 20H16C17.1046 20 18 19.1046 18 18V7M6 7H5M6 7H8M18 7H19M18 7H16M10 11V16M14 11V16M8 7V5C8 3.89543 8.89543 3 10 3H14C15.1046 3 16 3.89543 16 5V7M8 7H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 