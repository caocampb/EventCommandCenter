'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { BudgetItem } from '@/types/budget';
import type { Event } from '@/types/events';
import { colors } from '@/styles/colors';

// Define CSS variables at the root level
const rootStyle = {
  '--primary-color': colors.primary.default
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
      // Map budget statuses to our color system
      const statusStyles = {
        'on-track': {
          backgroundColor: colors.status.confirmed.bg,
          color: colors.status.confirmed.text,
          borderColor: `${colors.status.confirmed.text}40` // 40 = 25% opacity
        },
        'at-risk': {
          backgroundColor: colors.status.pending.bg,
          color: colors.status.pending.text,
          borderColor: `${colors.status.pending.text}40` // 40 = 25% opacity
        },
        'over-budget': {
          backgroundColor: colors.status.cancelled.bg,
          color: colors.status.cancelled.text,
          borderColor: `${colors.status.cancelled.text}40` // 40 = 25% opacity
        }
      };
      
      return (
        <div className="flex justify-end">
          <span 
            className="px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
            style={statusStyles['over-budget']}
          >
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
    
    // Map budget statuses to our color system
    const statusStyles = {
      'on-track': {
        backgroundColor: colors.status.confirmed.bg,
        color: colors.status.confirmed.text,
        borderColor: `${colors.status.confirmed.text}40` // 40 = 25% opacity
      },
      'at-risk': {
        backgroundColor: colors.status.pending.bg,
        color: colors.status.pending.text,
        borderColor: `${colors.status.pending.text}40` // 40 = 25% opacity
      },
      'over-budget': {
        backgroundColor: colors.status.cancelled.bg,
        color: colors.status.cancelled.text,
        borderColor: `${colors.status.cancelled.text}40` // 40 = 25% opacity
      }
    };
    
    return (
      <div className="flex justify-end">
        <span 
          className="px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
          style={statusStyles[status]}
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
          <div className="h-5 w-5 animate-spin rounded-full border-b-2" style={{ borderColor: colors.primary.default }}></div>
          <p className="text-gray-400">Loading budget data...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="w-full px-6 py-6">
        <div style={{ 
          backgroundColor: `${colors.status.cancelled.bg}20`, 
          borderColor: `${colors.status.cancelled.text}40`,
          color: colors.status.cancelled.text,
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

  return (
    <div style={rootStyle}>
      <div className="w-full px-6 py-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-xl font-semibold tracking-tight">Budget</h1>
          <div className="flex gap-3">
            <Link
              href="/en/events"
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded transition-colors duration-120 hover:bg-opacity-80"
              style={{ 
                backgroundColor: colors.background.card,
                color: colors.text.secondary,
                borderColor: colors.border.subtle,
                borderWidth: '1px',
                borderStyle: 'solid'
              }}
            >
              View Events
            </Link>
          </div>
        </div>

        {/* Budget summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-md p-4" style={{ backgroundColor: colors.background.card, borderColor: colors.border.subtle, borderWidth: '1px', borderStyle: 'solid' }}>
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
                  className="w-full rounded text-xl font-medium text-white px-2 py-1"
                  style={{ backgroundColor: colors.background.input, borderColor: colors.primary.default, borderWidth: '1px', borderStyle: 'solid' }}
                  autoFocus
                />
              ) : (
                <div 
                  className="transition-colors duration-150 hover:opacity-80" 
                  style={{ color: colors.text.primary }}
                >
                  {formatCurrency(budgetData.totalBudget)}
                </div>
              )}
            </div>
          </div>
          <div className="rounded-md p-4" style={{ backgroundColor: colors.background.card, borderColor: colors.border.subtle, borderWidth: '1px', borderStyle: 'solid' }}>
            <div className="text-sm text-gray-400 mb-1">Allocated</div>
            <div className="text-xl font-medium">{formatCurrency(budgetData.totalAllocated)}</div>
          </div>
          <div className="rounded-md p-4" style={{ backgroundColor: colors.background.card, borderColor: colors.border.subtle, borderWidth: '1px', borderStyle: 'solid' }}>
            <div className="text-sm text-gray-400 mb-1">Spent</div>
            <div className="text-xl font-medium">{formatCurrency(budgetData.totalSpent)}</div>
          </div>
          <div className="rounded-md p-4" style={{ backgroundColor: colors.background.card, borderColor: colors.border.subtle, borderWidth: '1px', borderStyle: 'solid' }}>
            <div className="text-sm text-gray-400 mb-1">Remaining</div>
            <div className="text-xl font-medium">
              {budgetData.totalRemaining < 0 || (budgetData.totalBudget === 0 && budgetData.totalSpent > 0) ? (
                <div className="flex justify-between items-center">
                  <span className="font-mono">{`-${formatCurrency(Math.abs(budgetData.totalRemaining))}`}</span>
                  <span style={{ 
                    backgroundColor: `${colors.status.cancelled.bg}20`, 
                    color: colors.status.cancelled.text,
                    borderColor: `${colors.status.cancelled.text}40`,
                    padding: '0 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    whiteSpace: 'nowrap',
                    borderWidth: '1px',
                    borderStyle: 'solid'
                  }}>
                    Over Budget
                  </span>
                </div>
              ) : (
                <div>
                  <span className="font-mono">{formatCurrency(budgetData.totalRemaining)}</span>
                  {budgetData.totalBudget > 0 && (budgetData.totalSpent / budgetData.totalBudget) >= 0.8 && (budgetData.totalSpent / budgetData.totalBudget) < 1 && (
                    <span className="ml-2" style={{ 
                      backgroundColor: `${colors.status.pending.bg}20`, 
                      color: colors.status.pending.text,
                      borderColor: `${colors.status.pending.text}40`,
                      padding: '0 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      borderWidth: '1px',
                      borderStyle: 'solid'
                    }}>
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
            <h2 className="text-[15px] font-medium text-gray-400">Events</h2>
          </div>
          <div className="rounded-md overflow-hidden" style={{ backgroundColor: colors.background.card, borderColor: colors.border.subtle, borderWidth: '1px', borderStyle: 'solid' }}>
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: colors.border.subtle }}>
                  <th className="text-left px-4 py-3 text-[13px] font-medium text-gray-400">Event</th>
                  <th className="text-left px-4 py-3 text-[13px] font-medium text-gray-400">Date</th>
                  <th className="text-right px-4 py-3 text-[13px] font-medium text-gray-400">Total Budget</th>
                  <th className="text-right px-4 py-3 text-[13px] font-medium text-gray-400">Spent</th>
                  <th className="text-right px-4 py-3 text-[13px] font-medium text-gray-400">Remaining</th>
                  <th className="text-right px-4 py-3 text-[13px] font-medium text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {budgetData.eventBudgets.map((event) => (
                  <tr 
                    key={event.id} 
                    className="border-b hover:bg-black/20 cursor-pointer"
                    style={{ borderColor: colors.border.subtle }}
                    onClick={() => navigateToEventBudget(event.id)}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-white">{event.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{event.date}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(event.totalBudget)}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(event.spent)}</td>
                    <td className="px-4 py-3 text-right">
                      <div>
                        <div className="font-mono">
                          {event.remaining < 0 
                            ? <span style={{ color: colors.status.cancelled.text }}>-{formatCurrency(Math.abs(event.remaining))}</span>
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
          <div className="rounded-md p-4 space-y-4" style={{ backgroundColor: colors.background.card, borderColor: colors.border.subtle, borderWidth: '1px', borderStyle: 'solid' }}>
            {budgetData.categoryTotals.map((category) => (
              <div key={category.category}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{category.category}</span>
                  <span className="text-sm text-gray-400">{formatCurrency(category.spent)} / {formatCurrency(category.budget)}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.border.subtle }}>
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${Math.min(100, (category.spent / category.budget) * 100)}%`,
                      backgroundColor: category.spent > category.budget 
                        ? colors.status.cancelled.text
                        : category.spent > category.budget * 0.8 
                          ? colors.status.pending.text
                          : colors.status.confirmed.text
                    }}
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
          <div className="rounded-md overflow-hidden" style={{ backgroundColor: colors.background.card, borderColor: colors.border.subtle, borderWidth: '1px', borderStyle: 'solid' }}>
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: colors.border.subtle }}>
                  <th className="text-left px-4 py-3 text-[13px] font-medium text-gray-400">Vendor</th>
                  <th className="text-right px-4 py-3 text-[13px] font-medium text-gray-400">Total Amount</th>
                  <th className="text-left px-4 py-3 text-[13px] font-medium text-gray-400">Related to</th>
                </tr>
              </thead>
              <tbody>
                {budgetData.vendorTotals.map((vendor) => (
                  <tr 
                    key={vendor.id} 
                    className="border-b hover:bg-black/20 cursor-pointer"
                    style={{ borderColor: colors.border.subtle }}
                    onClick={() => router.push(`/en/vendors/${vendor.id}`)}
                  >
                    <td className="px-4 py-3">
                      <Link 
                        href={`/en/vendors/${vendor.id}`}
                        className="font-medium transition-colors duration-150 hover:text-primary"
                        style={{ color: colors.text.primary }}
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
                                  className="text-xs px-2.5 py-1 rounded-full transition-colors duration-150 hover:opacity-80 inline-flex items-center gap-1.5"
                                  style={{ 
                                    backgroundColor: colors.background.card,
                                    borderColor: colors.border.subtle,
                                    borderWidth: '1px',
                                    borderStyle: 'solid'
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span>{event.eventName}</span>
                                  <span 
                                    className="block w-2 h-2 rounded-full flex-shrink-0" 
                                    style={{ backgroundColor: colors.status.cancelled.text }}
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
                            ? colors.status.cancelled.text
                            : status === 'at-risk'
                              ? colors.status.pending.text 
                              : colors.status.confirmed.text;
                          
                          return (
                            <div 
                              key={event.eventId}
                              className="opacity-80 group-hover:opacity-100 transition-opacity duration-150"
                            >
                              <Link 
                                href={`/en/events/${event.eventId}/budget`}
                                className="text-xs px-2.5 py-1 rounded-full transition-colors duration-150 hover:opacity-80 inline-flex items-center gap-1.5"
                                style={{ 
                                  backgroundColor: colors.background.card,
                                  borderColor: colors.border.subtle,
                                  borderWidth: '1px',
                                  borderStyle: 'solid'
                                }}
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
    </div>
  );
} 