'use client';

// Force dynamic rendering to prevent client reference manifest issues
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { BudgetItem } from '@/types/budget';
import type { Event } from '@/types/events';

// Define CSS variables at the root level
const rootStyle = {
  '--primary-color': 'var(--primary-default)'
} as React.CSSProperties;

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
    // Special case: Any spending against a $0 budget is over budget
    if (budget === 0 && spent > 0) {
      return (
        <div className="flex justify-end">
          <span className="budget-pill budget-pill-over-budget">
            Over Budget
          </span>
        </div>
      );
    }
    
    // Calculate percentage of budget used
    const percentageUsed = budget > 0 ? (spent / budget) * 100 : 0;
    
    // Determine status based on consistent thresholds
    let status: 'on-track' | 'at-risk' | 'over-budget' = 'on-track';
    
    if (percentageUsed > 100) {
      status = 'over-budget';
    } else if (percentageUsed >= 80) {
      status = 'at-risk';
    }
    
    return (
      <div className="flex justify-end">
        <span 
          className={`budget-pill ${
            status === 'on-track' 
              ? 'budget-pill-on-track' 
              : status === 'at-risk'
                ? 'budget-pill-at-risk'
                : 'budget-pill-over-budget'
          }`}
        >
          {status === 'on-track' ? 'On Track' : status === 'at-risk' ? 'At Risk' : 'Over Budget'}
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
          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary-default"></div>
          <p className="text-text-tertiary">Loading budget data...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="w-full px-6 py-6">
        <div style={{ 
          backgroundColor: 'var(--status-error-bg)20', 
          borderColor: 'var(--status-error-border)40',
          color: 'var(--status-error-text)',
          padding: '0.75rem 1rem',
          borderRadius: '0.375rem',
          borderWidth: '1px',
          borderStyle: 'solid'
        }}>
          {error}
        </div>
      </div>
    );
  }

  // Main content return
  return (
    <div className="w-full px-6 py-6" style={rootStyle}>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-theme-text-primary">Budget</h1>
        <div className="flex gap-3">
          <Link
            href="/en/events"
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded transition-colors duration-120 hover:bg-opacity-80 bg-bg-secondary text-text-secondary border border-theme-border-subtle"
          >
            View Events
          </Link>
        </div>
      </div>

      {/* Budget summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-md p-4 bg-bg-secondary border border-theme-border-subtle">
          <div className="text-sm text-text-tertiary mb-1">Total Budget</div>
          <div className="text-xl font-medium text-text-primary flex justify-between items-center">
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
                className="w-full px-2 py-1 border border-primary-default rounded bg-bg-tertiary text-text-primary"
                autoFocus
              />
            ) : (
              <div 
                className="transition-colors duration-150 hover:opacity-80 text-text-primary"
              >
                {formatCurrency(budgetData.totalBudget)}
              </div>
            )}
          </div>
        </div>
        <div className="rounded-md p-4 bg-bg-secondary border border-theme-border-subtle">
          <div className="text-sm text-text-tertiary mb-1">Allocated</div>
          <div className="text-xl font-medium text-text-primary">{formatCurrency(budgetData.totalAllocated)}</div>
        </div>
        <div className="rounded-md p-4 bg-bg-secondary border border-theme-border-subtle">
          <div className="text-sm text-text-tertiary mb-1">Spent</div>
          <div className="text-xl font-medium text-text-primary">{formatCurrency(budgetData.totalSpent)}</div>
        </div>
        <div className="rounded-md p-4 bg-bg-secondary border border-theme-border-subtle">
          <div className="text-sm text-text-tertiary mb-1">Remaining</div>
          <div className="text-xl font-medium text-text-primary">
            {budgetData.totalRemaining < 0 || (budgetData.totalBudget === 0 && budgetData.totalSpent > 0) ? (
              <div className="flex justify-between items-center">
                <span className="font-mono">{`-${formatCurrency(Math.abs(budgetData.totalRemaining))}`}</span>
                <span className="budget-pill budget-pill-over-budget">
                  Over Budget
                </span>
              </div>
            ) : (
              <div>
                <span className="font-mono">{formatCurrency(budgetData.totalRemaining)}</span>
                {budgetData.totalBudget > 0 && (budgetData.totalSpent / budgetData.totalBudget) >= 0.8 && (budgetData.totalSpent / budgetData.totalBudget) < 1 && (
                  <span className="ml-2 budget-pill budget-pill-at-risk">
                    At Risk
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Budgets Table */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-medium text-text-tertiary">Events</h2>
        </div>
        <div className="rounded-md overflow-hidden bg-bg-secondary border border-theme-border-subtle">
          <table className="w-full">
            <thead>
              <tr className="border-b border-theme-border-subtle">
                <th className="text-left px-4 py-3 text-[13px] font-medium text-text-tertiary">Event</th>
                <th className="text-left px-4 py-3 text-[13px] font-medium text-text-tertiary">Date</th>
                <th className="text-right px-4 py-3 text-[13px] font-medium text-text-tertiary">Total Budget</th>
                <th className="text-right px-4 py-3 text-[13px] font-medium text-text-tertiary">Spent</th>
                <th className="text-right px-4 py-3 text-[13px] font-medium text-text-tertiary">Remaining</th>
                <th className="text-right px-4 py-3 text-[13px] font-medium text-text-tertiary">Status</th>
              </tr>
            </thead>
            <tbody>
              {budgetData.eventBudgets.map((event) => (
                <tr 
                  key={event.id} 
                  className="interactive-row border-b border-theme-border-subtle hover:bg-theme-hover-row hover:border-theme-border-strong transition-all duration-200 cursor-pointer group relative"
                  onClick={() => navigateToEventBudget(event.id)}
                >
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-text-primary">{event.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-tertiary">{event.date}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(event.totalBudget)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(event.spent)}</td>
                  <td className="px-4 py-3 text-right">
                    <div>
                      <div className="font-mono">
                        {event.remaining < 0 
                          ? <span style={{ color: 'var(--status-error-text)' }}>-{formatCurrency(Math.abs(event.remaining))}</span>
                          : <span>{formatCurrency(event.remaining)}</span>
                        }
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <BudgetStatusPill budget={event.totalBudget} spent={event.spent} />
                  </td>
                </tr>
              ))}
              {budgetData.eventBudgets.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-center text-text-tertiary">
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
          <h2 className="text-[15px] font-medium text-text-tertiary">Categories</h2>
        </div>
        <div className="rounded-md p-4 space-y-4 bg-bg-secondary border border-theme-border-subtle">
          {budgetData.categoryTotals.map((category) => (
            <div key={category.category}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-text-primary">{category.category}</span>
                <span className="text-sm text-text-tertiary">{formatCurrency(category.spent)} / {formatCurrency(category.budget)}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-theme-border-subtle">
                <div 
                  className={`h-full rounded-full ${
                    category.spent > category.budget 
                      ? 'progress-bar-over-budget'
                      : category.spent > category.budget * 0.8 
                        ? 'progress-bar-at-risk'
                        : 'progress-bar-on-track'
                  }`}
                  style={{ 
                    width: `${Math.min(100, (category.spent / category.budget) * 100)}%`
                  }}
                ></div>
              </div>
            </div>
          ))}
          {budgetData.categoryTotals.length === 0 && (
            <div className="text-center py-4 text-text-tertiary">
              No category data available
            </div>
          )}
        </div>
      </div>

      {/* Vendors Section */}
      <div>
        <div className="mb-4">
          <h2 className="text-[15px] font-medium text-text-tertiary">Vendors</h2>
        </div>
        <div className="rounded-md overflow-hidden bg-bg-secondary border border-theme-border-subtle">
          <table className="w-full">
            <thead>
              <tr className="border-b border-theme-border-subtle">
                <th className="text-left px-4 py-3 text-[13px] font-medium text-text-tertiary">Vendor</th>
                <th className="text-right px-4 py-3 text-[13px] font-medium text-text-tertiary">Total Amount</th>
                <th className="text-left px-4 py-3 text-[13px] font-medium text-text-tertiary">Related to</th>
              </tr>
            </thead>
            <tbody>
              {budgetData.vendorTotals.map((vendor) => (
                <tr 
                  key={vendor.id} 
                  className="interactive-row border-b border-theme-border-subtle hover:bg-theme-hover-row hover:border-theme-border-strong transition-all duration-200 cursor-pointer group relative"
                  onClick={() => router.push(`/en/vendors/${vendor.id}`)}
                >
                  <td className="px-4 py-3">
                    <Link 
                      href={`/en/vendors/${vendor.id}`}
                      className="font-medium transition-colors duration-150 hover:text-primary"
                      style={{ color: 'var(--text-primary)' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {vendor.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(vendor.total)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {vendor.events.map(event => {
                        // Find the corresponding event to get its budget status
                        const eventData = budgetData.eventBudgets.find(e => e.id === event.eventId);
                        
                        // Special case: Any spending against a $0 budget is over budget
                        if (eventData && eventData.totalBudget === 0 && eventData.spent > 0) {
                          return (
                            <div 
                              key={event.eventId}
                              className="opacity-80 group-hover:opacity-100 transition-opacity duration-150"
                            >
                              <Link 
                                href={`/en/events/${event.eventId}/budget`}
                                className="text-xs px-2.5 py-1 rounded-full transition-colors duration-150 hover:opacity-80 inline-flex items-center gap-1.5 bg-bg-secondary border border-theme-border-subtle"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span>{event.eventName}</span>
                                <span 
                                  className="block w-2 h-2 rounded-full flex-shrink-0" 
                                  style={{ backgroundColor: 'var(--status-over-budget-text)' }}
                                ></span>
                              </Link>
                            </div>
                          );
                        }
                        
                        // Calculate percentage of budget used with consistent thresholds
                        const percentageUsed = eventData && eventData.totalBudget > 0 
                          ? (eventData.spent / eventData.totalBudget) * 100 
                          : 0;
                        
                        // Determine status using same thresholds as BudgetStatusPill
                        let status: 'on-track' | 'at-risk' | 'over-budget' = 'on-track';
                        if (percentageUsed > 100) {
                          status = 'over-budget';
                        } else if (percentageUsed >= 80) {
                          status = 'at-risk';
                        }
                        
                        // Get status color (dot indicator)
                        const statusColor = status === 'over-budget'
                          ? 'var(--status-over-budget-text)'
                          : status === 'at-risk'
                            ? 'var(--status-near-limit-text)' 
                            : 'var(--status-under-budget-text)';
                        
                        return (
                          <div 
                            key={event.eventId}
                            className="opacity-80 group-hover:opacity-100 transition-opacity duration-150"
                          >
                            <Link 
                              href={`/en/events/${event.eventId}/budget`}
                              className="text-xs px-2.5 py-1 rounded-full transition-colors duration-150 hover:opacity-80 inline-flex items-center gap-1.5 bg-bg-secondary border border-theme-border-subtle"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span>{event.eventName}</span>
                              <span 
                                className="block w-2 h-2 rounded-full flex-shrink-0" 
                                style={{ backgroundColor: statusColor }}
                              ></span>
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
              {budgetData.vendorTotals.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-center text-text-tertiary">
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