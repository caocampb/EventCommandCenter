'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { BudgetItem } from '@/types/budget';
import type { Vendor } from '@/types/vendor';

// Type for event vendors with assignment details
interface VendorAssignment {
  id: string;
  eventId: string;
  vendorId: string;
  vendor: Vendor;
}

// Type for our new item form
interface NewBudgetItem {
  description: string;
  category: string;
  plannedAmount: number;
  isPaid: boolean;
  vendorId?: string; // New: Optional vendor ID
}

export default function EventBudgetPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [eventName, setEventName] = useState('');
  const [eventVendors, setEventVendors] = useState<VendorAssignment[]>([]); // New: Store event vendors
  
  // For adding new items with proper typing
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState<NewBudgetItem>({
    description: '',
    category: '',
    plannedAmount: 0,
    isPaid: false
  });
  
  // For editing actual amounts
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const editInputRef = useRef<HTMLInputElement>(null);
  
  // UI states
  const [categories, setCategories] = useState<string[]>([]);
  const [totals, setTotals] = useState({
    plannedTotal: 0,
    actualTotal: 0,
    categoryTotals: [] as {category: string, plannedAmount: number, actualAmount: number}[]
  });
  // Add state for active category filters
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // State for export dropdown
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Add a user activity tracker to prevent refreshes during edits
  const [lastUserActivity, setLastUserActivity] = useState<number>(Date.now());
  const USER_INACTIVE_THRESHOLD = 30000; // 30 seconds of inactivity before we consider refreshes

  // Track user activity
  const trackUserActivity = useCallback(() => {
    setLastUserActivity(Date.now());
  }, []);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Extract the fetch logic into a reusable function
  const fetchBudgetData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // First get the event to display the name
      const eventResponse = await fetch(`/api/events/${eventId}`);
      if (!eventResponse.ok) {
        throw new Error(`Failed to fetch event: ${eventResponse.status}`);
      }
      const eventData = await eventResponse.json();
      setEventName(eventData.data.name);
      
      // Then get the budget items
      const response = await fetch(`/api/events/${eventId}/budget`);
      if (!response.ok) {
        throw new Error(`Failed to fetch budget items: ${response.status}`);
      }
      
      const data = await response.json();
      setBudgetItems(data.data || []);
      setTotals({
        plannedTotal: data.totals?.plannedTotal || 0,
        actualTotal: data.totals?.actualTotal || 0,
        categoryTotals: data.totals?.categories || []
      });
      
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set((data.data || []).map((item: BudgetItem) => item.category))
      ) as string[];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Error loading budget data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load budget data');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  // Fetch event vendors
  const fetchEventVendors = useCallback(async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/vendors`);
      if (!response.ok) {
        throw new Error(`Failed to fetch event vendors: ${response.status}`);
      }
      
      const data = await response.json();
      setEventVendors(data.data || []);
    } catch (err) {
      console.error('Error fetching event vendors:', err);
      // Don't set error state here, as it's not critical to the main functionality
    }
  }, [eventId]);

  // Load data on component mount
  useEffect(() => {
    fetchBudgetData();
    fetchEventVendors();
  }, [fetchBudgetData, fetchEventVendors]);
  
  // Set up periodic refresh (every 60 seconds) with smarter handling
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Only refresh if:
      // 1. Not actively loading data
      // 2. Not in the middle of adding an item
      // 3. Not editing an existing item
      // 4. User has been inactive for at least 30 seconds
      const now = Date.now();
      const userIsInactive = (now - lastUserActivity) > USER_INACTIVE_THRESHOLD;
      
      if (!isLoading && !isAddingItem && !editingItemId && userIsInactive) {
        console.log("Auto-refreshing budget data after inactivity");
        fetchBudgetData();
        fetchEventVendors();
      }
    }, 60000); // 60 seconds
    
    return () => clearInterval(intervalId);
  }, [fetchBudgetData, fetchEventVendors, isLoading, isAddingItem, editingItemId, lastUserActivity]);
  
  // Handle saving actual amount edits - with tracked activity
  const updateActualAmount = useCallback(async (item: BudgetItem, newActualAmount: number) => {
    trackUserActivity();
    
    // Don't update if the value hasn't changed
    if (newActualAmount === item.actualAmount) {
      return;
    }
    
    try {
      const previousAmount = item.actualAmount || 0;
      
      // Optimistic update for UI
      setBudgetItems(prev => 
        prev.map(i => i.id === item.id ? { ...i, actualAmount: newActualAmount } : i)
      );
      
      // Update totals optimistically
      setTotals(prev => {
        const difference = newActualAmount - previousAmount;
        
        // Create new category totals with the updated amount
        const newCategoryTotals = prev.categoryTotals.map(cat => {
          if (cat.category === item.category) {
            return {
              ...cat,
              actualAmount: cat.actualAmount + difference
            };
          }
          return cat;
        });
        
        return {
          ...prev,
          actualTotal: prev.actualTotal + difference,
          categoryTotals: newCategoryTotals
        };
      });
      
      // Make API call
      const response = await fetch(`/api/events/${eventId}/budget/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          actualAmount: newActualAmount
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update budget item: ${response.status}`);
      }
      
      // Don't refresh in the background after success - trust the optimistic update
      // This prevents the double-update issue
      
    } catch (err) {
      console.error('Error updating actual amount:', err);
      alert('Failed to update amount. Please try again.');
      fetchBudgetData(); // Only refresh on error to reset state
    }
  }, [eventId, fetchBudgetData, trackUserActivity]);
  
  // Save edit handler - with tracked activity
  const handleSaveEdit = useCallback((item: BudgetItem) => {
    trackUserActivity();
    
    if (editingItemId === item.id) {
      const newValue = parseFloat(editValue);
      if (!isNaN(newValue) && newValue >= 0) {
        updateActualAmount(item, newValue);
      }
      setEditingItemId(null);
    }
  }, [editingItemId, editValue, updateActualAmount, trackUserActivity]);
  
  // Add a new budget item - with tracked activity
  const handleAddItem = useCallback(async () => {
    trackUserActivity();
    
    try {
      if (!newItem.description || !newItem.category) {
        alert('Description and category are required');
        return;
      }
      
      // Create the new item object
      const newBudgetItem = {
        description: newItem.description,
        category: newItem.category,
        plannedAmount: Number(newItem.plannedAmount),
        isPaid: newItem.isPaid,
        vendorId: newItem.vendorId // Include vendor ID if selected
      };
      
      // Generate a temporary ID for optimistic update
      const tempId = `temp-${Date.now()}`;
      
      // Optimistic UI update
      const optimisticItem: BudgetItem = {
        id: tempId,
        eventId: eventId,
        ...newBudgetItem,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Update local state for immediate feedback
      setBudgetItems(prev => [...prev, optimisticItem]);
      
      // Update category totals optimistically
      const categoryName = newItem.category || 'Uncategorized';
      let newCategoryTotals = [...totals.categoryTotals];
      const categoryIndex = newCategoryTotals.findIndex(c => c.category === categoryName);
      
      if (categoryIndex >= 0 && newCategoryTotals[categoryIndex]) {
        newCategoryTotals[categoryIndex].plannedAmount += Number(newItem.plannedAmount);
      } else {
        newCategoryTotals.push({
          category: categoryName,
          plannedAmount: Number(newItem.plannedAmount),
          actualAmount: 0
        });
      }
      
      // Update totals state optimistically
      setTotals({
        ...totals,
        plannedTotal: totals.plannedTotal + Number(newItem.plannedAmount),
        categoryTotals: newCategoryTotals
      });
      
      // Reset form
      setNewItem({
        description: '',
        category: '',
        plannedAmount: 0,
        isPaid: false
      });
      setIsAddingItem(false);
      
      // Make API call
      const response = await fetch(`/api/events/${eventId}/budget`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newBudgetItem)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create budget item: ${response.status}`);
      }
      
      // Get the real ID from the response to update our local state
      const responseData = await response.json();
      const newItemWithRealId = responseData.data;
      
      if (newItemWithRealId && newItemWithRealId.id) {
        // Replace our temporary ID with the real one
        setBudgetItems(prev => 
          prev.map(item => 
            item.id === tempId ? { ...item, id: newItemWithRealId.id } : item
          )
        );
      }
      
      // Don't fetch after success - trust our optimistic update
      
    } catch (err) {
      console.error('Error adding budget item:', err);
      alert('Failed to add budget item. Please try again.');
      // Refresh data to revert optimistic updates only on error
      fetchBudgetData();
    }
  }, [eventId, newItem, totals, fetchBudgetData, trackUserActivity]);
  
  // Toggle paid status for a budget item - with tracked activity
  const togglePaidStatus = useCallback(async (item: BudgetItem) => {
    trackUserActivity();
    
    try {
      // Optimistic update for UI responsiveness
      setBudgetItems(prev => 
        prev.map(i => i.id === item.id ? { ...i, isPaid: !i.isPaid } : i)
      );
      
      // API call
      const response = await fetch(`/api/events/${eventId}/budget/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isPaid: !item.isPaid
        })
      });
      
      if (!response.ok) {
        // Revert optimistic update on error
        setBudgetItems(prev => 
          prev.map(i => i.id === item.id ? { ...i, isPaid: item.isPaid } : i)
        );
        throw new Error(`Failed to update budget item: ${response.status}`);
      }
      
      // Don't refresh after success - trust our optimistic update
      
    } catch (err) {
      console.error('Error updating budget item:', err);
      alert('Failed to update budget item. Please try again.');
    }
  }, [eventId, trackUserActivity]);
  
  // Delete a budget item - with tracked activity
  const handleDeleteItem = useCallback(async (item: BudgetItem) => {
    trackUserActivity();
    
    if (!confirm('Are you sure you want to delete this budget item?')) {
      return;
    }
    
    try {
      // Store the original item for potential rollback
      const originalItem = item;
      
      // Optimistic update for UI
      setBudgetItems(prev => prev.filter(i => i.id !== item.id));
      
      // Update totals optimistically
      setTotals(prev => {
        // Calculate new planned total
        const newPlannedTotal = prev.plannedTotal - item.plannedAmount;
        
        // Calculate new actual total
        const newActualTotal = prev.actualTotal - (item.actualAmount || 0);
        
        // Update category totals
        const newCategoryTotals = prev.categoryTotals.map(cat => {
          if (cat.category === item.category) {
            return {
              ...cat,
              plannedAmount: cat.plannedAmount - item.plannedAmount,
              actualAmount: cat.actualAmount - (item.actualAmount || 0)
            };
          }
          return cat;
        });
        
        return {
          plannedTotal: newPlannedTotal,
          actualTotal: newActualTotal,
          categoryTotals: newCategoryTotals
        };
      });
      
      // API call
      const response = await fetch(`/api/events/${eventId}/budget/${item.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        // Revert optimistic updates on error
        setBudgetItems(prev => [...prev, originalItem]);
        // Refresh data to restore correct totals on error
        fetchBudgetData();
        throw new Error(`Failed to delete budget item: ${response.status}`);
      }
      
      // Don't refresh after success - trust our optimistic update
      
    } catch (err) {
      console.error('Error deleting budget item:', err);
      alert('Failed to delete budget item. Please try again.');
    }
  }, [eventId, fetchBudgetData, trackUserActivity]);
  
  // Track user activity on input focus, clicks, etc.
  useEffect(() => {
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'focus'];
    
    const handleActivity = () => trackUserActivity();
    
    // Add event listeners to track user activity
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity);
    });
    
    // Clean up event listeners
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [trackUserActivity]);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Calculate how much of the budget is used (as a percentage)
  const calculateBudgetPercentage = (used: number, total: number) => {
    if (total === 0) return 0;
    return Math.min(Math.round((used / total) * 100), 100);
  };
  
  // Get vendor name from ID
  const getVendorName = (vendorId?: string) => {
    if (!vendorId) return '—';
    const vendorAssignment = eventVendors.find(v => v.vendorId === vendorId);
    return vendorAssignment ? vendorAssignment.vendor.name : '—';
  };
  
  // Get filtered budget items based on active filters
  const filteredBudgetItems = useCallback(() => {
    if (activeFilters.length === 0) {
      return budgetItems;
    }
    return budgetItems.filter(item => activeFilters.includes(item.category));
  }, [budgetItems, activeFilters]);
  
  // Export budget as CSV
  const handleExportCSV = useCallback(() => {
    // Prepare the data
    const csvRows = [
      // Header row
      ['Description', 'Category', 'Vendor', 'Planned Amount', 'Actual Amount', 'Status'],
      
      // Data rows - use current filtered items
      ...filteredBudgetItems().map(item => [
        item.description,
        item.category,
        getVendorName(item.vendorId),
        // Format numbers without quotes for better spreadsheet imports
        item.plannedAmount,
        item.actualAmount || '',
        item.isPaid ? 'Paid' : 'Unpaid'
      ]),
      
      // Empty row before totals
      [],
      
      // Totals - Format better for import
      ['TOTAL', '', '', totals.plannedTotal, totals.actualTotal, '']
    ];
    
    // Convert to CSV content with better number handling
    const csvContent = csvRows
      .map(row => {
        return row.map(cell => {
          // Don't quote numbers for better spreadsheet imports
          if (typeof cell === 'number') return cell;
          // Quote strings properly, escaping any quotes within
          if (typeof cell === 'string') return `"${cell.replace(/"/g, '""')}"`;
          // Handle empty values
          return cell === null || cell === undefined ? '' : `"${cell}"`;
        }).join(',');
      })
      .join('\n');
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Create a clean filename
    const cleanEventName = eventName.toLowerCase().replace(/\s+/g, '-');
    const date = new Date().toISOString().split('T')[0];
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${cleanEventName}-budget-${date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Simple feedback - optional toast could be added later
    console.log('Budget exported as CSV');
  }, [filteredBudgetItems, totals, eventName, getVendorName]);

  // New: Export for Google Sheets with better formatting
  const handleExportForSheets = useCallback(() => {
    // Almost identical to CSV export but with Google Sheets optimizations
    const csvRows = [
      // Header row
      ['Description', 'Category', 'Vendor', 'Planned Amount', 'Actual Amount', 'Status'],
      
      // Data rows - use current filtered items
      ...filteredBudgetItems().map(item => [
        item.description,
        item.category,
        getVendorName(item.vendorId),
        // Format numbers without quotes for better spreadsheet imports
        item.plannedAmount,
        item.actualAmount || '',
        item.isPaid ? 'Paid' : 'Unpaid'
      ]),
      
      // Empty row before totals
      [],
      
      // Add formulas for Google Sheets
      ['TOTAL', '', '', '=SUM(D2:D' + (filteredBudgetItems().length + 1) + ')', '=SUM(E2:E' + (filteredBudgetItems().length + 1) + ')', '']
    ];
    
    // Convert to CSV content with Google Sheets optimizations
    const csvContent = csvRows
      .map(row => {
        return row.map(cell => {
          // Don't quote numbers for better spreadsheet imports
          if (typeof cell === 'number') return cell;
          // Quote strings properly, escaping any quotes within
          if (typeof cell === 'string') return `"${cell.replace(/"/g, '""')}"`;
          // Handle empty values
          return cell === null || cell === undefined ? '' : `"${cell}"`;
        }).join(',');
      })
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const cleanEventName = eventName.toLowerCase().replace(/\s+/g, '-');
    const date = new Date().toISOString().split('T')[0];
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${cleanEventName}-budget-sheets-${date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredBudgetItems, totals, eventName, getVendorName]);

  // New: Export for Airtable with optimal formatting
  const handleExportForAirtable = useCallback(() => {
    // Airtable prefers a flat structure without totals
    const csvRows = [
      // Header row - using Airtable-friendly names
      ['Name', 'Category', 'Vendor', 'Planned Amount', 'Actual Amount', 'Status'],
      
      // Data rows only - Airtable will calculate its own totals
      ...filteredBudgetItems().map(item => [
        item.description,
        item.category,
        getVendorName(item.vendorId),
        // Format numbers without quotes for better imports
        item.plannedAmount,
        item.actualAmount || '',
        item.isPaid ? 'Paid' : 'Unpaid'
      ])
    ];
    
    // Convert to CSV content
    const csvContent = csvRows
      .map(row => {
        return row.map(cell => {
          if (typeof cell === 'number') return cell;
          if (typeof cell === 'string') return `"${cell.replace(/"/g, '""')}"`;
          return cell === null || cell === undefined ? '' : `"${cell}"`;
        }).join(',');
      })
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const cleanEventName = eventName.toLowerCase().replace(/\s+/g, '-');
    const date = new Date().toISOString().split('T')[0];
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${cleanEventName}-budget-airtable-${date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredBudgetItems, eventName, getVendorName]);

  // Print View function - Linear style
  const handlePrintView = useCallback(() => {
    // Create a new window for the print view
    const printWindow = window.open('', '_blank');
    if (!printWindow) return; // Exit if popup blocked
    
    // Format numbers with commas and currency symbol
    const formatAmount = (amount?: number) => {
      if (amount === undefined || amount === null) return '—';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    };
    
    // Calculate budget metrics
    const remainingBudget = totals.plannedTotal - totals.actualTotal;
    const isOverBudget = remainingBudget < 0;
    const percentUsed = totals.plannedTotal === 0 ? 0 : 
      Math.min(Math.round((totals.actualTotal / totals.plannedTotal) * 100), 999);
    
    // Generate HTML content with Linear-inspired design
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${eventName} Budget</title>
          <meta charset="UTF-8">
          <style>
            /* Linear-inspired typography and spacing */
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.5;
              color: #333;
              max-width: 1000px;
              margin: 0 auto;
              padding: 40px 20px;
            }
            .header-section {
              margin-bottom: 30px;
              padding-bottom: 15px;
              border-bottom: 1px solid #eee;
            }
            h1 {
              font-size: 24px;
              font-weight: 600;
              margin: 0 0 10px 0;
            }
            .subtitle {
              color: #777;
              font-size: 14px;
              margin: 0;
            }
            .timestamp {
              color: #888;
              font-size: 13px;
              margin-top: 15px;
            }
            .summary-section {
              display: flex;
              flex-wrap: wrap;
              gap: 30px;
              margin-bottom: 30px;
              padding: 15px;
              background: #f9f9f9;
              border-radius: 4px;
            }
            .metric {
              flex: 1;
              min-width: 120px;
            }
            .metric-label {
              font-size: 13px;
              color: #555;
              margin: 0 0 5px 0;
            }
            .metric-value {
              font-size: 18px;
              font-weight: 600;
              margin: 0;
            }
            .over-budget {
              color: #e25c5c;
            }
            .categories-section {
              margin-bottom: 30px;
            }
            .category-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              padding-bottom: 8px;
              border-bottom: 1px solid #f0f0f0;
            }
            .category-label {
              font-size: 14px;
            }
            .category-values {
              font-size: 14px;
              font-variant-numeric: tabular-nums;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
              font-size: 14px;
            }
            th {
              text-align: left;
              padding: 10px 15px;
              border-bottom: 1px solid #ddd;
              font-weight: 500;
              color: #555;
            }
            td {
              padding: 12px 15px;
              border-bottom: 1px solid #eee;
              vertical-align: top;
            }
            .numeric {
              text-align: right;
              font-variant-numeric: tabular-nums;
            }
            .status-pill {
              display: inline-block;
              padding: 3px 8px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 500;
            }
            .status-paid {
              background: #e3f6e5;
              color: #2c7a39;
            }
            .status-unpaid {
              background: #f0f0f0;
              color: #666;
            }
            /* Print-specific styles */
            @media print {
              body { padding: 0; font-size: 12px; }
              .summary-section { break-inside: avoid; }
              table { break-inside: auto; }
              tr { break-inside: avoid; break-after: auto; }
              @page { margin: 0.5cm; }
            }
          </style>
        </head>
        <body>
          <div class="header-section">
            <h1>${eventName} Budget</h1>
            <p class="subtitle">Budget summary and detailed expenses</p>
            <p class="timestamp">Generated on ${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', month: 'long', day: 'numeric' 
            })}</p>
          </div>
          
          <div class="summary-section">
            <div class="metric">
              <p class="metric-label">Total Budget</p>
              <p class="metric-value">${formatAmount(totals.plannedTotal)}</p>
            </div>
            <div class="metric">
              <p class="metric-label">Spent</p>
              <p class="metric-value">${formatAmount(totals.actualTotal)}</p>
            </div>
            <div class="metric">
              <p class="metric-label">Remaining</p>
              <p class="metric-value ${isOverBudget ? 'over-budget' : ''}">${formatAmount(remainingBudget)}</p>
            </div>
            <div class="metric">
              <p class="metric-label">Budget Used</p>
              <p class="metric-value ${isOverBudget ? 'over-budget' : ''}">${percentUsed}%</p>
            </div>
          </div>
          
          ${totals.categoryTotals.length > 0 ? `
            <div class="categories-section">
              <h2>Category Breakdown</h2>
              ${totals.categoryTotals.map(cat => `
                <div class="category-row">
                  <span class="category-label">${cat.category}</span>
                  <span class="category-values">
                    ${formatAmount(cat.actualAmount)} / ${formatAmount(cat.plannedAmount)}
                  </span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          <h2>Budget Items</h2>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Vendor</th>
                <th class="numeric">Planned</th>
                <th class="numeric">Actual</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredBudgetItems().map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.category}</td>
                  <td>${getVendorName(item.vendorId)}</td>
                  <td class="numeric">${formatAmount(item.plannedAmount)}</td>
                  <td class="numeric">${formatAmount(item.actualAmount)}</td>
                  <td>
                    <span class="status-pill ${item.isPaid ? 'status-paid' : 'status-unpaid'}">
                      ${item.isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3"><strong>TOTAL</strong></td>
                <td class="numeric"><strong>${formatAmount(totals.plannedTotal)}</strong></td>
                <td class="numeric"><strong>${formatAmount(totals.actualTotal)}</strong></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
          
          <script>
            // Auto-open print dialog when the page loads
            window.onload = function() {
              // Small delay to ensure styles are applied
              setTimeout(() => { 
                window.print();
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  }, [eventName, filteredBudgetItems, getVendorName, totals]);

  // Toggle a category filter on/off
  const toggleCategoryFilter = useCallback((category: string) => {
    setActiveFilters(prev => {
      if (prev.includes(category)) {
        return prev.filter(cat => cat !== category);
      } else {
        return [...prev, category];
      }
    });
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setActiveFilters([]);
  }, []);

  // Check if a filter is active
  const isFilterActive = useCallback((category: string) => {
    return activeFilters.includes(category);
  }, [activeFilters]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="w-full max-w-3xl mx-auto p-6">
        <div className="flex items-center space-x-4">
          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-[#5E6AD2]"></div>
          <p className="text-gray-400">Loading budget data...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="w-full max-w-3xl mx-auto p-6">
        <div className="mb-6">
          <Link 
            href={`/en/events/${eventId}`}
            className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors duration-150"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1.5">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to event
          </Link>
        </div>
        
        <div className="bg-red-500/5 border border-red-500/20 text-red-500 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      {/* Header with back button */}
      <div className="mb-8">
        <Link 
          href={`/en/events/${eventId}`}
          className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4 transition-colors duration-150"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1.5">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to event
        </Link>
        
        <h1 className="text-xl font-semibold tracking-tight mb-1">Budget for {eventName}</h1>
        <p className="text-sm text-gray-400">Manage your event budget</p>
      </div>
      
      {/* Budget Summary */}
      <div className="bg-[#141414] border border-[#1F1F1F] rounded-md p-5 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[15px] font-medium text-white">Budget Summary</h2>
          <button
            onClick={() => setIsAddingItem(true)}
            className="text-[13px] bg-[#5E6AD2] hover:bg-[#6872E5] text-white px-3 py-1.5 rounded-md transition-colors duration-150 border border-transparent hover:border-[#8D95F2]"
          >
            + Add Item
          </button>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[13px] text-gray-400">Total Budget</span>
            <span className="text-[15px] font-medium text-white">{formatCurrency(totals.plannedTotal)}</span>
          </div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[13px] text-gray-400">Spent</span>
            <span className="text-[15px] font-medium text-white">{formatCurrency(totals.actualTotal)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[13px] text-gray-400">Remaining</span>
            <span className="text-[15px] font-medium text-white">{formatCurrency(totals.plannedTotal - totals.actualTotal)}</span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-[#1A1A1A] h-2 rounded-full overflow-hidden">
            <div 
              className={`h-2 rounded-full ${
                totals.actualTotal > totals.plannedTotal 
                  ? 'bg-red-500' 
                  : 'bg-[#5E6AD2]'
              }`}
              style={{ width: `${calculateBudgetPercentage(totals.actualTotal, totals.plannedTotal)}%` }}
            ></div>
          </div>
          <div className="flex justify-end mt-1">
            <span className="text-[12px] text-gray-500">
              {calculateBudgetPercentage(totals.actualTotal, totals.plannedTotal)}% used
            </span>
          </div>
        </div>
        
        {/* Category breakdown */}
        {totals.categoryTotals.length > 0 && (
          <div>
            <h3 className="text-[13px] font-medium text-gray-400 mb-3">Category Breakdown</h3>
            <div className="space-y-3">
              {totals.categoryTotals.map((category) => (
                <div key={category.category}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[13px] text-gray-300">{category.category}</span>
                    <span className="text-[13px] text-gray-300">
                      {formatCurrency(category.actualAmount)} / {formatCurrency(category.plannedAmount)}
                    </span>
                  </div>
                  <div className="w-full bg-[#1A1A1A] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-1.5 rounded-full ${
                        category.actualAmount > category.plannedAmount 
                          ? 'bg-red-500/70' 
                          : 'bg-[#5E6AD2]/70'
                      }`}
                      style={{ width: `${calculateBudgetPercentage(category.actualAmount, category.plannedAmount)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Add New Item Form - Only shown when adding */}
      {isAddingItem && (
        <div className="bg-[#141414] border border-[#1F1F1F] rounded-md p-5 mb-6">
          <h2 className="text-[15px] font-medium text-white mb-4">Add Budget Item</h2>
          
          <div className="space-y-4">
            {/* Description field */}
            <div>
              <label htmlFor="description" className="block text-[13px] text-gray-400 mb-1">
                Description
              </label>
              <input
                id="description"
                type="text"
                value={newItem.description}
                onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                className="w-full px-3 py-2 bg-[#0C0C0C] border border-[#1F1F1F] rounded-md text-[14px] placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] transition-colors duration-150"
                placeholder="Enter item description"
              />
            </div>
            
            {/* Category field */}
            <div>
              <label htmlFor="category" className="block text-[13px] text-gray-400 mb-1">
                Category
              </label>
              <div className="relative">
                <input
                  id="category"
                  type="text"
                  value={newItem.category}
                  onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                  list="categories"
                  className="w-full px-3 py-2 bg-[#0C0C0C] border border-[#1F1F1F] rounded-md text-[14px] placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] transition-colors duration-150"
                  placeholder="Enter or select a category"
                />
                <datalist id="categories">
                  {categories.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Vendor field (NEW) */}
            <div>
              <label htmlFor="vendorId" className="block text-[13px] text-gray-400 mb-1">
                Vendor (Optional)
              </label>
              <select
                id="vendorId"
                value={newItem.vendorId || ''}
                onChange={(e) => setNewItem({...newItem, vendorId: e.target.value || undefined})}
                className="w-full px-3 py-2 bg-[#0C0C0C] border border-[#1F1F1F] rounded-md text-[14px] placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] transition-colors duration-150"
              >
                <option value="">-- Select Vendor (Optional) --</option>
                {eventVendors.map((assignment) => (
                  <option key={assignment.vendorId} value={assignment.vendorId}>
                    {assignment.vendor.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Amount field */}
            <div>
              <label htmlFor="plannedAmount" className="block text-[13px] text-gray-400 mb-1">
                Planned Amount
              </label>
              <input
                id="plannedAmount"
                type="number"
                min="0"
                value={newItem.plannedAmount}
                onChange={(e) => setNewItem({...newItem, plannedAmount: parseInt(e.target.value, 10) || 0})}
                className="w-full px-3 py-2 bg-[#0C0C0C] border border-[#1F1F1F] rounded-md text-[14px] placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] transition-colors duration-150"
                placeholder="Enter amount"
              />
            </div>
            
            {/* Is Paid checkbox */}
            <div className="flex items-center">
              <input
                id="isPaid"
                type="checkbox"
                checked={newItem.isPaid}
                onChange={(e) => setNewItem({...newItem, isPaid: e.target.checked})}
                className="h-4 w-4 rounded border-gray-600 text-[#5E6AD2] focus:ring-[#5E6AD2]"
              />
              <label htmlFor="isPaid" className="ml-2 block text-[13px] text-gray-400">
                Already paid
              </label>
            </div>
            
            {/* Form buttons */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsAddingItem(false)}
                className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#252525] text-gray-400 rounded-md text-[13px] mr-3 transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 bg-[#5E6AD2] hover:bg-[#6872E5] text-white rounded-md text-[13px] transition-colors duration-150 border border-transparent hover:border-[#8D95F2]"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Budget Items List */}
      <div className="bg-[#141414] border border-[#1F1F1F] rounded-md overflow-hidden">
        <div className="p-5 border-b border-[#1F1F1F] flex justify-between items-center">
          <h2 className="text-[15px] font-medium text-white">Budget Items</h2>
          
          {/* Linear-style export button with dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="text-gray-400 hover:text-gray-200 transition-colors duration-150 p-1.5 rounded flex items-center gap-1"
              aria-label="Export options"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 3v4a1 1 0 001 1h4" />
                <path d="M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" />
                <path d="M12 17v-6" />
                <path d="M9 14l3 3 3-3" />
              </svg>
              <span className="text-xs">Export</span>
            </button>
            
            {/* Linear-style dropdown menu */}
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-[#1A1A1A] border border-[#262626] rounded-md shadow-lg z-10 overflow-hidden">
                <div className="py-1">
                  <button
                    onClick={() => {
                      handleExportCSV();
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-[13px] text-gray-300 hover:bg-[#242424] transition-colors duration-150 flex items-center"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mr-2">
                      <path d="M14 3v4a1 1 0 001 1h4" />
                      <path d="M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" />
                    </svg>
                    Export as CSV
                  </button>
                  <button
                    onClick={() => {
                      handleExportForSheets();
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-[13px] text-gray-300 hover:bg-[#242424] transition-colors duration-150 flex items-center"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mr-2">
                      <rect width="20" height="18" x="2" y="3" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M2 7h20M7 3v18" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                    Google Sheets
                  </button>
                  <button
                    onClick={() => {
                      handleExportForAirtable();
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-[13px] text-gray-300 hover:bg-[#242424] transition-colors duration-150 flex items-center"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mr-2">
                      <rect width="18" height="18" x="3" y="3" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M3 9h18M9 3v18" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                    Airtable
                  </button>
                  <button
                    onClick={() => {
                      handlePrintView();
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-[13px] text-gray-300 hover:bg-[#242424] transition-colors duration-150 flex items-center"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mr-2">
                      <path d="M6 9V2h12v7" />
                      <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                      <path d="M6 14h12v8H6z" />
                    </svg>
                    Print View
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Category Filter Bar - Linear Style */}
        {categories.length > 0 && (
          <div className="px-5 py-3 border-b border-[#1F1F1F] flex flex-wrap items-center gap-2">
            {activeFilters.length > 0 && (
              <button
                onClick={clearAllFilters}
                className="px-2 py-1 text-[12px] text-gray-400 hover:text-white transition-colors duration-150 flex items-center"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mr-1">
                  <path d="M19 12H5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Clear filters
              </button>
            )}
            
            {categories.map(category => (
              <button
                key={category}
                onClick={() => toggleCategoryFilter(category)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] ${
                  isFilterActive(category)
                    ? 'bg-[#5E6AD2]/10 text-[#5E6AD2] border border-[#5E6AD2]/20'
                    : 'bg-[#1A1A1A] text-gray-400 border border-[#1A1A1A] hover:border-[#333333]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
        
        {budgetItems.length === 0 ? (
          <div className="p-5 text-center">
            <p className="text-[14px] text-gray-400">No budget items yet</p>
            <p className="text-[13px] text-gray-500 mt-1">Add items to track your event budget</p>
          </div>
        ) : filteredBudgetItems().length === 0 ? (
          <div className="p-5 text-center">
            <p className="text-[14px] text-gray-400">No items match the selected filters</p>
            <p className="text-[13px] text-gray-500 mt-1">Try selecting different categories or clear the filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#111111] border-b border-[#1F1F1F]">
                <tr>
                  <th className="text-left px-4 py-2.5 text-[13px] font-medium text-gray-400">Description</th>
                  <th className="text-left px-4 py-2.5 text-[13px] font-medium text-gray-400">Category</th>
                  <th className="text-left px-4 py-2.5 text-[13px] font-medium text-gray-400">Vendor</th>
                  <th className="text-right px-4 py-2.5 text-[13px] font-medium text-gray-400">Planned</th>
                  <th className="text-right px-4 py-2.5 text-[13px] font-medium text-gray-400">Actual</th>
                  <th className="text-center px-4 py-2.5 text-[13px] font-medium text-gray-400">Status</th>
                  <th className="text-right px-4 py-2.5 text-[13px] font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F1F]">
                {filteredBudgetItems().map((item) => (
                  <tr key={item.id} className="hover:bg-[#161616] transition-colors duration-150">
                    <td className="px-4 py-3 text-[13px] text-white">
                      {item.description}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-gray-300">
                      {item.category}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-gray-300">
                      {getVendorName(item.vendorId)}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-gray-300 text-right">
                      {formatCurrency(item.plannedAmount)}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-right">
                      {editingItemId === item.id ? (
                        <div className="flex justify-end">
                          <input
                            ref={editInputRef}
                            type="number"
                            min="0"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveEdit(item);
                              } else if (e.key === 'Escape') {
                                setEditingItemId(null);
                              }
                            }}
                            onBlur={() => handleSaveEdit(item)}
                            autoFocus
                            className="w-24 px-2 py-1 bg-[#1E1E1E] border border-[#5E6AD2] rounded-sm text-right text-white text-[13px] focus:outline-none"
                          />
                        </div>
                      ) : (
                        <div 
                          onClick={() => {
                            setEditingItemId(item.id);
                            setEditValue((item.actualAmount || 0).toString());
                          }}
                          className="group cursor-text hover:text-[#5E6AD2] flex justify-end items-center transition-colors duration-150"
                          role="button"
                          tabIndex={0}
                          aria-label="Edit actual amount"
                        >
                          <span>{item.actualAmount ? formatCurrency(item.actualAmount) : '—'}</span>
                          <svg 
                            className="w-3.5 h-3.5 ml-1.5 opacity-0 group-hover:opacity-70 transition-all duration-150" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2"
                          >
                            <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => togglePaidStatus(item)}
                        className={`px-2 py-1 rounded-md text-[12px] ${
                          item.isPaid 
                            ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                            : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                        }`}
                      >
                        {item.isPaid ? 'Paid' : 'Unpaid'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="text-gray-400 hover:text-red-400 transition-colors duration-150"
                        aria-label="Delete item"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
    </div>
  );
}