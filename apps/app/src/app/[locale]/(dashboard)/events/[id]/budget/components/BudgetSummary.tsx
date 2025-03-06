'use client';

import { useState, useRef } from 'react';
import type { BudgetItem } from '@/types/budget';

interface CategoryTotal {
  category: string;
  plannedAmount: number;
  actualAmount: number;
}

interface BudgetSummaryProps {
  totalBudgetValue: number;
  setTotalBudgetValue: (value: number) => void;
  totals: {
    plannedTotal: number;
    actualTotal: number;
    categoryTotals: CategoryTotal[];
  };
  onAddItem: () => void;
  onSaveTotalBudget: (value: number) => Promise<void>;
  trackUserActivity: () => void;
  participantCount?: number;
}

export function BudgetSummary({ 
  totalBudgetValue, 
  setTotalBudgetValue, 
  totals, 
  onAddItem, 
  onSaveTotalBudget,
  trackUserActivity,
  participantCount = 0
}: BudgetSummaryProps) {
  const [isEditingTotalBudget, setIsEditingTotalBudget] = useState(false);
  const totalBudgetInputRef = useRef<HTMLInputElement>(null);
  
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
  
  // Handle saving total budget
  const handleSaveTotalBudget = async () => {
    trackUserActivity();
    
    try {
      await onSaveTotalBudget(totalBudgetValue);
    } finally {
      setIsEditingTotalBudget(false);
    }
  };
  
  // Calculate per-student costs when applicable
  const perStudentPlanned = participantCount > 0 
    ? totals.plannedTotal / participantCount 
    : 0;
  
  return (
    <div className="border border-border-primary rounded-md p-5 mb-6 bg-bg-secondary">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[15px] font-medium text-text-primary">Budget Summary</h2>
        <button
          onClick={() => {
            trackUserActivity();
            onAddItem();
          }}
          className="text-[13px] bg-primary-default hover:bg-primary-hover text-white px-3 py-1.5 rounded-md transition-colors duration-150 border border-transparent hover:border-primary-muted"
        >
          + Add Item
        </button>
      </div>
      
      <div className="mb-6">
        {/* Total Budget - Linear style editable field */}
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[13px] text-text-tertiary">Total Budget</span>
          
          <div 
            className="text-right"
            onClick={() => {
              if (!isEditingTotalBudget) {
                trackUserActivity();
                setIsEditingTotalBudget(true);
              }
            }}
          >
            {isEditingTotalBudget ? (
              <input
                ref={totalBudgetInputRef}
                type="number"
                value={totalBudgetValue}
                onChange={(e) => setTotalBudgetValue(Number(e.target.value))}
                onBlur={handleSaveTotalBudget}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTotalBudget();
                  if (e.key === 'Escape') {
                    setIsEditingTotalBudget(false);
                    setTotalBudgetValue(totals.plannedTotal);
                  }
                }}
                className="w-28 border border-primary-default rounded text-[15px] font-medium text-text-primary text-right px-2 py-1 bg-bg-tertiary"
                autoFocus
              />
            ) : (
              <span className="text-[15px] font-medium text-text-primary cursor-pointer hover:text-primary-default transition-colors duration-150">
                {formatCurrency(totals.plannedTotal)}
              </span>
            )}
          </div>
        </div>
        
        {/* Show per-student cost when applicable */}
        {participantCount > 0 && (
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[13px] text-text-tertiary">Per Student ({participantCount} students)</span>
            <span className="text-[15px] font-medium text-text-primary">{formatCurrency(perStudentPlanned)}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[13px] text-text-tertiary">Spent</span>
          <span className="text-[15px] font-medium text-text-primary">{formatCurrency(totals.actualTotal)}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-[13px] text-text-tertiary">Remaining</span>
          <span className="text-[15px] font-medium text-text-primary">{formatCurrency(totals.plannedTotal - totals.actualTotal)}</span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-bg-tertiary h-2 rounded-full overflow-hidden">
          <div 
            className={`h-2 rounded-full ${
              totals.actualTotal > totals.plannedTotal * 1.2
                ? 'bg-theme-status-over-budget-text/80'  // Over 120% - Red
                : totals.actualTotal > totals.plannedTotal
                  ? 'bg-theme-status-near-limit-text/80' // 100-120% - Amber
                  : totals.actualTotal > totals.plannedTotal * 0.8
                    ? 'bg-theme-status-near-limit-text/80' // 80-100% - Amber
                    : 'bg-theme-status-under-budget-text/80' // Under 80% - Green
            }`}
            style={{ width: `${calculateBudgetPercentage(totals.actualTotal, totals.plannedTotal)}%` }}
          ></div>
        </div>
        <div className="flex justify-end mt-1">
          <span className="text-[12px] text-text-quaternary">
            {calculateBudgetPercentage(totals.actualTotal, totals.plannedTotal)}% used
          </span>
        </div>
      </div>
      
      {/* Category breakdown */}
      {totals.categoryTotals.length > 0 && (
        <div>
          <h3 className="text-[13px] font-medium text-text-tertiary mb-3">Category Breakdown</h3>
          <div className="space-y-3">
            {totals.categoryTotals.map((category) => (
              <div key={category.category}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[13px] text-text-secondary">{category.category}</span>
                  <div className="flex items-center gap-2">
                    <span 
                      className={`px-1.5 py-0.5 text-[10px] rounded-sm font-medium ${
                        category.actualAmount > category.plannedAmount * 1.2
                          ? 'bg-theme-status-over-budget-bg text-theme-status-over-budget-text'  // Over 120% - Red
                          : category.actualAmount > category.plannedAmount
                            ? 'bg-theme-status-near-limit-bg text-theme-status-near-limit-text' // 100-120% - Amber
                            : category.actualAmount > category.plannedAmount * 0.8
                              ? 'bg-theme-status-near-limit-bg text-theme-status-near-limit-text' // 80-100% - Amber
                              : 'bg-theme-status-under-budget-bg text-theme-status-under-budget-text' // Under 80% - Green
                      }`}
                    >
                      {category.actualAmount > category.plannedAmount * 1.2
                        ? 'Over Budget'
                        : category.actualAmount > category.plannedAmount
                          ? 'Exceeding'
                          : category.actualAmount > category.plannedAmount * 0.8
                            ? 'Near Limit'
                            : 'Under Budget'
                      }
                    </span>
                    <span className="text-[13px] text-text-secondary">
                      {formatCurrency(category.actualAmount)} / {formatCurrency(category.plannedAmount)}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-bg-tertiary h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-1.5 rounded-full ${
                      category.actualAmount > category.plannedAmount * 1.2
                        ? 'bg-theme-status-over-budget-text/80'  // Over 120% - Red
                        : category.actualAmount > category.plannedAmount
                          ? 'bg-theme-status-near-limit-text/80' // 100-120% - Amber
                          : category.actualAmount > category.plannedAmount * 0.8
                            ? 'bg-theme-status-near-limit-text/80' // 80-100% - Amber
                            : 'bg-theme-status-under-budget-text/80' // Under 80% - Green
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
  );
} 