'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { BudgetItem } from '@/types/budget';
import type { Event } from '@/types/events';

interface AggregatedBudget {
  totalBudget: number;
  totalAllocated: number;
  totalSpent: number;
  totalRemaining: number;
  eventBudgets: EventBudgetSummary[];
  categoryTotals: CategoryTotal[];
  vendorTotals: VendorTotal[];
}

interface EventBudgetSummary {
  id: string;
  name: string;
  date: string;
  budget: number;
  spent: number;
  remaining: number;
  totalBudget: number;
}

interface CategoryTotal {
  category: string;
  budget: number;
  spent: number;
  percentage: number;
}

interface VendorTotal {
  id: string;
  name: string;
  total: number;
  events: {
    eventId: string;
    eventName: string;
    amount: number;
  }[];
}

export default function BudgetPage() {
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [budgetData, setBudgetData] = useState<AggregatedBudget>({
    totalBudget: 0,
    totalAllocated: 0,
    totalSpent: 0,
    totalRemaining: 0,
    eventBudgets: [],
    categoryTotals: [],
    vendorTotals: []
  });
  
  // State for editing total budget
  const [isEditingTotalBudget, setIsEditingTotalBudget] = useState(false);
  const [totalBudgetValue, setTotalBudgetValue] = useState(0);
  const totalBudgetInputRef = useRef<HTMLInputElement>(null);
  
  // Load budget data
  useEffect(() => {
    async function loadBudgetData() {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/budget');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch budget data: ${response.status}`);
        }
        
        const data = await response.json();
        setBudgetData(data.data);
        setTotalBudgetValue(data.data.totalBudget);
      } catch (err) {
        console.error('Error loading budget data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load budget data');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadBudgetData();
  }, []);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Budget status pill component for Linear-style status indicators
  const BudgetStatusPill = ({ budget, spent }: { budget: number; spent: number }) => {
    // Calculate percentage over budget
    const remaining = budget - spent;
    const percentageUsed = budget > 0 ? (spent / budget) * 100 : 0;
    const isOverBudget = remaining < 0;
    
    // Determine status based on budget health
    let status: 'on-track' | 'at-risk' | 'over-budget' = 'on-track';
    if (isOverBudget) {
      // Over 20% over budget is critical
      status = percentageUsed > 120 ? 'over-budget' : 'at-risk';
    }
    
    // Style maps for different statuses (Linear-inspired)
    const statusStyles = {
      'on-track': 'bg-green-500/10 text-green-400 border border-green-500/20',
      'at-risk': 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
      'over-budget': 'bg-red-500/10 text-red-400 border border-red-500/20'
    };
    
    // Text for different statuses
    const statusText = {
      'on-track': 'On Track',
      'at-risk': 'At Risk',
      'over-budget': 'Over Budget'
    };
    
    return (
      <div className="flex items-center justify-end gap-2">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}>
          {statusText[status]}
        </span>
        <span className="font-mono">
          {remaining < 0 ? `-${formatCurrency(Math.abs(remaining))}` : formatCurrency(remaining)}
        </span>
      </div>
    );
  };
  
  // Navigate to event budget
  const navigateToEventBudget = useCallback((eventId: string) => {
    router.push(`/en/events/${eventId}/budget`);
  }, [router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full px-6 py-6">
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
      <div className="w-full px-6 py-6">
        <div className="bg-red-500/5 border border-red-500/20 text-red-500 px-4 py-3 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Budget</h1>
        <div className="flex gap-3">
          <Link
            href="/en/events"
            className="inline-flex items-center px-3 py-1.5 bg-[#1E1E1E] hover:bg-[#2A2A2A] text-sm text-gray-300 hover:text-white font-medium rounded transition-colors duration-120 border border-[#333333] hover:border-[#444444]"
          >
            View Events
          </Link>
        </div>
      </div>

      {/* Budget summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#141414] border border-[#1F1F1F] rounded-md p-4">
          <div className="text-sm text-gray-400 mb-1">Total Budget</div>
          <div 
            className="text-xl font-medium cursor-pointer"
            onClick={() => !isEditingTotalBudget && setIsEditingTotalBudget(true)}
          >
            {isEditingTotalBudget ? (
              <input
                ref={totalBudgetInputRef}
                type="number"
                value={totalBudgetValue}
                onChange={(e) => setTotalBudgetValue(Number(e.target.value))}
                onBlur={() => {
                  setBudgetData(prev => ({
                    ...prev,
                    totalBudget: totalBudgetValue,
                    totalRemaining: totalBudgetValue - prev.totalSpent
                  }));
                  setIsEditingTotalBudget(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setBudgetData(prev => ({
                      ...prev,
                      totalBudget: totalBudgetValue,
                      totalRemaining: totalBudgetValue - prev.totalSpent
                    }));
                    setIsEditingTotalBudget(false);
                  }
                  if (e.key === 'Escape') {
                    setIsEditingTotalBudget(false);
                    setTotalBudgetValue(budgetData.totalBudget);
                  }
                }}
                className="w-full bg-[#0F0F0F] border border-[#5E6AD2] rounded text-xl font-medium text-white px-2 py-1"
                autoFocus
              />
            ) : (
              <div className="hover:text-[#5E6AD2] transition-colors duration-150">
                {formatCurrency(budgetData.totalBudget)}
              </div>
            )}
          </div>
        </div>
        <div className="bg-[#141414] border border-[#1F1F1F] rounded-md p-4">
          <div className="text-sm text-gray-400 mb-1">Allocated</div>
          <div className="text-xl font-medium">{formatCurrency(budgetData.totalAllocated)}</div>
        </div>
        <div className="bg-[#141414] border border-[#1F1F1F] rounded-md p-4">
          <div className="text-sm text-gray-400 mb-1">Spent</div>
          <div className="text-xl font-medium">{formatCurrency(budgetData.totalSpent)}</div>
        </div>
        <div className="bg-[#141414] border border-[#1F1F1F] rounded-md p-4">
          <div className="text-sm text-gray-400 mb-1">Remaining</div>
          <div className="text-xl font-medium">
            {budgetData.totalRemaining < 0 ? (
              <div className="flex justify-between items-center">
                <span className="font-mono">{`-${formatCurrency(Math.abs(budgetData.totalRemaining))}`}</span>
                <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
                  {budgetData.totalSpent > budgetData.totalBudget * 1.2 ? 'Over Budget' : 'At Risk'}
                </span>
              </div>
            ) : (
              <div>
                <span className="font-mono">{formatCurrency(budgetData.totalRemaining)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Budgets Table */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-medium text-gray-400">Events</h2>
        </div>
        <div className="border border-[#1F1F1F] rounded-md overflow-hidden bg-[#141414]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1F1F1F]">
                <th className="text-left px-4 py-3 text-[13px] font-medium text-gray-400">Event</th>
                <th className="text-left px-4 py-3 text-[13px] font-medium text-gray-400">Date</th>
                <th className="text-right px-4 py-3 text-[13px] font-medium text-gray-400">Total Budget</th>
                <th className="text-right px-4 py-3 text-[13px] font-medium text-gray-400">Budget</th>
                <th className="text-right px-4 py-3 text-[13px] font-medium text-gray-400">Spent</th>
                <th className="text-right px-4 py-3 text-[13px] font-medium text-gray-400 w-[220px]">Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F1F]">
              {budgetData.eventBudgets.map((event) => (
                <tr 
                  key={event.id} 
                  className="hover:bg-[#1A1A1A] cursor-pointer transition-colors duration-100"
                  onClick={() => navigateToEventBudget(event.id)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{event.name}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{event.date}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(event.totalBudget)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(event.budget)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(event.spent)}</td>
                  <td className="px-4 py-3 text-right">
                    {event.remaining < 0 ? (
                      <div className="flex justify-end items-center">
                        <div className="w-[120px] flex justify-end mr-4">
                          <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
                            Over Budget
                          </span>
                        </div>
                        <span className="font-mono w-[100px] text-right">{`-${formatCurrency(Math.abs(event.remaining))}`}</span>
                      </div>
                    ) : (
                      <div className="flex justify-end items-center">
                        <div className="w-[120px] flex justify-end mr-4">
                          {/* Empty space to maintain alignment */}
                        </div>
                        <span className="font-mono w-[100px] text-right">{formatCurrency(event.remaining)}</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {budgetData.eventBudgets.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-center text-gray-500">
                    No events with budget data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Categories Section */}
      <div className="mb-8">
        <div className="mb-4">
          <h2 className="text-[15px] font-medium text-gray-400">Categories</h2>
        </div>
        <div className="bg-[#141414] border border-[#1F1F1F] rounded-md p-4 space-y-4">
          {budgetData.categoryTotals.map((category) => (
            <div key={category.category}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">{category.category}</span>
                <span className="text-sm text-gray-400">{formatCurrency(category.spent)} / {formatCurrency(category.budget)}</span>
              </div>
              <div className="h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    category.spent > category.budget 
                      ? 'bg-[#E5484D]/80' 
                      : category.spent > category.budget * 0.8 
                        ? 'bg-[#E8A33C]/80' 
                        : 'bg-[#4CC38A]/80'
                  }`}
                  style={{ width: `${Math.min(100, (category.spent / category.budget) * 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
          {budgetData.categoryTotals.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No category data available
            </div>
          )}
        </div>
      </div>

      {/* Vendors Section */}
      <div>
        <div className="mb-4">
          <h2 className="text-[15px] font-medium text-gray-400">Vendors</h2>
        </div>
        <div className="border border-[#1F1F1F] rounded-md overflow-hidden bg-[#141414]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1F1F1F]">
                <th className="text-left px-4 py-3 text-[13px] font-medium text-gray-400">Vendor</th>
                <th className="text-right px-4 py-3 text-[13px] font-medium text-gray-400">Total</th>
                <th className="text-left px-4 py-3 text-[13px] font-medium text-gray-400">Events</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F1F]">
              {budgetData.vendorTotals.map((vendor) => (
                <tr key={vendor.id} className="group">
                  <td className="px-4 py-3">
                    <Link 
                      href={`/en/vendors/${vendor.id}`}
                      className="font-medium hover:text-[#5E6AD2] transition-colors duration-150"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {vendor.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(vendor.total)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {vendor.events.map(event => (
                        <div 
                          key={event.eventId}
                          className="opacity-80 group-hover:opacity-100 transition-opacity duration-150"
                        >
                          <Link 
                            href={`/en/events/${event.eventId}/budget`}
                            className="text-xs px-2 py-0.5 bg-[#1A1A1A] rounded-full hover:bg-[#222222] transition-colors duration-150"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {event.eventName}
                          </Link>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {budgetData.vendorTotals.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-center text-gray-500">
                    No vendor data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 