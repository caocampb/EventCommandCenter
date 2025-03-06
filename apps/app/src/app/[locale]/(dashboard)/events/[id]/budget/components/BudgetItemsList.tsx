'use client';

import type { BudgetItem } from '@/types/budget';
import { useState, useRef, useEffect, useCallback } from 'react';
import { PencilIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

// High z-index to ensure it's above everything
const MODAL_Z_INDEX = 50000;

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
  function formatCurrency(amount: number | undefined | null): string {
    if (amount === undefined || amount === null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  
  return (
    <div className="border border-border-primary rounded-md overflow-hidden bg-bg-secondary">
      <div className="p-5 border-b border-border-primary flex justify-between items-center">
        <h2 className="text-[15px] font-medium text-text-primary">Budget Items</h2>
        
        {/* Filter dropdown - replaced with Radix UI */}
        <div id="filterDropdownRoot" style={{ position: 'relative' }} className="inline-block">
          <style jsx global>{`
            /* Make sure portals render on top of everything */
            #radix-portal {
              isolation: isolate;
              z-index: 99999;
            }
            
            /* Ensure filter content renders properly across all themes */
            .filter-menu-content {
              background-color: white;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              border-radius: 6px;
              border: 1px solid #eee;
              overflow: hidden;
              width: 260px;
            }
            
            /* Dark theme support */
            [data-theme="dark"] .filter-menu-content {
              background-color: #1f2937;
              border-color: #374151;
            }
          `}</style>
          
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                onClick={trackUserActivity}
                className={`flex items-center px-3 py-1.5 text-sm rounded-md border gap-1.5 transition-colors duration-150 ${
                  activeFilters.length > 0
                    ? 'bg-primary-default/10 text-primary-default border-primary-default/20'
                    : 'bg-bg-card text-text-secondary border-border-subtle hover:border-border-strong'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.5 3C4.67157 3 4 3.67157 4 4.5C4 5.32843 4.67157 6 5.5 6C6.32843 6 7 5.32843 7 4.5C7 3.67157 6.32843 3 5.5 3ZM3 4.5C3 3.11929 4.11929 2 5.5 2C6.88071 2 8 3.11929 8 4.5C8 5.88071 6.88071 7 5.5 7C4.11929 7 3 5.88071 3 4.5ZM11.5 9C10.6716 9 10 9.67157 10 10.5C10 11.3284 10.6716 12 11.5 12C12.3284 12 13 11.3284 13 10.5C13 9.67157 12.3284 9 11.5 9ZM9 10.5C9 9.11929 10.1193 8 11.5 8C12.8807 8 14 9.11929 14 10.5C14 11.8807 12.8807 13 11.5 13C10.1193 13 9 11.8807 9 10.5ZM2 10.5C2 10.2239 2.22386 10 2.5 10H7.5C7.77614 10 8 10.2239 8 10.5C8 10.7761 7.77614 11 7.5 11H2.5C2.22386 11 2 10.7761 2 10.5ZM8.5 5C8.22386 5 8 4.77614 8 4.5C8 4.22386 8.22386 4 8.5 4H12.5C12.7761 4 13 4.22386 13 4.5C13 4.77614 12.7761 5 12.5 5H8.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                </svg>
                Filter
                {activeFilters.length > 0 && (
                  <span className="flex items-center justify-center bg-primary-default text-white rounded-full w-5 h-5 text-[11px] font-medium">
                    {activeFilters.length}
                  </span>
                )}
              </button>
            </DropdownMenu.Trigger>
            
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="filter-menu-content z-[99999]"
                sideOffset={5}
                align="end"
                side="bottom"
              >
                <div className="p-3 border-b border-border-subtle flex justify-between items-center">
                  <h3 className="text-[13px] font-medium text-text-primary">Filter by Category</h3>
                  <button 
                    onClick={clearAllFilters}
                    className="text-[12px] text-primary-default hover:text-primary-hover"
                  >
                    Clear all
                  </button>
                </div>
                
                <div className="max-h-60 overflow-y-auto p-1">
                  {categories.map(category => (
                    <DropdownMenu.Item
                      key={category}
                      className={`flex items-center w-full px-3 py-2 text-left text-[13px] rounded-md ${
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
                    </DropdownMenu.Item>
                  ))}
                </div>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
      
      {filteredItems().length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-text-tertiary text-sm mb-2">No budget items found</p>
          {activeFilters.length > 0 && (
            <button 
              onClick={clearAllFilters} 
              className="text-primary-default hover:text-primary-hover text-sm"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bg-tertiary">
              <tr>
                <th className="px-4 py-3 text-left text-[13px] font-medium text-text-tertiary">Description</th>
                <th className="px-4 py-3 text-left text-[13px] font-medium text-text-tertiary">Category</th>
                <th className="px-4 py-3 text-left text-[13px] font-medium text-text-tertiary">Vendor</th>
                <th className="px-4 py-3 text-right text-[13px] font-medium text-text-tertiary">Planned</th>
                <th className="px-4 py-3 text-right text-[13px] font-medium text-text-tertiary">Actual</th>
                <th className="px-4 py-3 text-center text-[13px] font-medium text-text-tertiary">Status</th>
                <th className="px-4 py-3 text-right text-[13px] font-medium text-text-tertiary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems().map((item) => (
                <tr key={item.id} className="border-t border-border-primary hover:bg-bg-tertiary">
                  <td className="px-4 py-3 text-[14px] text-text-primary">
                    <div className="flex flex-col">
                      <span className="font-medium">{item.description}</span>
                      {item.notes && <span className="text-[12px] mt-0.5 text-text-tertiary">{item.notes}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[14px] text-text-primary">
                    <span className="px-2 py-1 rounded-full text-[12px] font-medium bg-primary-default/10 text-primary-default">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[14px] text-text-primary">
                    {getVendorName(item.vendorId)}
                  </td>
                  <td className="px-4 py-3 text-[14px] text-right text-text-primary">
                    <div>
                      <span className="tabular-nums">{formatCurrency(item.plannedAmount)}</span>
                      {item.isPerAttendee && participantCount > 0 && (
                        <div className="text-[11px] text-text-tertiary mt-1">
                          {formatCurrency(item.plannedAmount / participantCount)} / person
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[14px] text-right text-text-primary">
                    {editingItemId === item.id ? (
                      <input
                        ref={editInputRef}
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleSaveEdit(item)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(item);
                          if (e.key === 'Escape') setEditingItemId(null);
                        }}
                        className="w-24 bg-bg-tertiary border border-primary-default rounded text-[14px] text-text-primary text-right px-2 py-1"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => startEditing(item)}
                        className="text-[14px] text-text-primary hover:text-primary-hover transition-colors duration-150"
                      >
                        {formatCurrency(item.actualAmount)}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleTogglePaid(item)}
                      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 cursor-pointer ${
                        item.isPaid 
                          ? 'bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20' 
                          : 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'
                      }`}
                      title={item.isPaid ? 'Mark as unpaid' : 'Mark as paid'}
                    >
                      {item.isPaid ? (
                        <>
                          <CheckCircleIcon className="w-3.5 h-3.5 mr-1" />
                          Paid
                        </>
                      ) : (
                        <>
                          <svg width="14" height="14" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
                            <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                          </svg>
                          Unpaid
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => startEditing(item)}
                        className="p-1.5 text-text-tertiary hover:text-text-primary transition-colors duration-150 rounded-md hover:bg-bg-hover"
                        title="Edit amount"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="p-1.5 text-text-tertiary hover:text-error-default transition-colors duration-150 rounded-md hover:bg-bg-hover"
                        title="Delete item"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
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

// Helper function to calculate position
function getPositionStyles(buttonElement: HTMLElement) {
  const rect = buttonElement.getBoundingClientRect();
  const top = rect.bottom + window.scrollY + 8;
  const right = window.innerWidth - (rect.right + window.scrollX);
  
  return {
    top: `${top}px`,
    right: `${right}px`,
  };
} 