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
}

export function BudgetSummary({ 
  totalBudgetValue, 
  setTotalBudgetValue, 
  totals, 
  onAddItem, 
  onSaveTotalBudget,
  trackUserActivity 
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
  
  return (
    <div className="bg-[#141414] border border-[#1F1F1F] rounded-md p-5 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[15px] font-medium text-white">Budget Summary</h2>
        <button
          onClick={() => {
            trackUserActivity();
            onAddItem();
          }}
          className="text-[13px] bg-[#5E6AD2] hover:bg-[#6872E5] text-white px-3 py-1.5 rounded-md transition-colors duration-150 border border-transparent hover:border-[#8D95F2]"
        >
          + Add Item
        </button>
      </div>
      
      <div className="mb-6">
        {/* Total Budget - Linear style editable field */}
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[13px] text-gray-400">Total Budget</span>
          
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
                className="w-28 bg-[#0F0F0F] border border-[#5E6AD2] rounded text-[15px] font-medium text-white text-right px-2 py-1"
                autoFocus
              />
            ) : (
              <span className="text-[15px] font-medium text-white cursor-pointer hover:text-[#5E6AD2] transition-colors duration-150">
                {formatCurrency(totals.plannedTotal)}
              </span>
            )}
          </div>
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
              totals.actualTotal > totals.plannedTotal * 1.2
                ? 'bg-[#E5484D]/80'  // Over 120% - Red
                : totals.actualTotal > totals.plannedTotal
                  ? 'bg-[#E8A33C]/80' // 100-120% - Amber
                  : totals.actualTotal > totals.plannedTotal * 0.8
                    ? 'bg-[#E8A33C]/80' // 80-100% - Amber
                    : 'bg-[#4CC38A]/80' // Under 80% - Green
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
                  <div className="flex items-center gap-2">
                    <span 
                      className={`px-1.5 py-0.5 text-[10px] rounded-sm font-medium ${
                        category.actualAmount > category.plannedAmount * 1.2
                          ? 'bg-[#E5484D]/10 text-[#E5484D]'  // Over 120% - Red
                          : category.actualAmount > category.plannedAmount
                            ? 'bg-[#E8A33C]/10 text-[#E8A33C]' // 100-120% - Amber
                            : category.actualAmount > category.plannedAmount * 0.8
                              ? 'bg-[#E8A33C]/10 text-[#E8A33C]' // 80-100% - Amber
                              : 'bg-[#4CC38A]/10 text-[#4CC38A]' // Under 80% - Green
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
                    <span className="text-[13px] text-gray-300">
                      {formatCurrency(category.actualAmount)} / {formatCurrency(category.plannedAmount)}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-[#1A1A1A] h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-1.5 rounded-full ${
                      category.actualAmount > category.plannedAmount * 1.2
                        ? 'bg-[#E5484D]/80'  // Over 120% - Red
                        : category.actualAmount > category.plannedAmount
                          ? 'bg-[#E8A33C]/80' // 100-120% - Amber
                          : category.actualAmount > category.plannedAmount * 0.8
                            ? 'bg-[#E8A33C]/80' // 80-100% - Amber
                            : 'bg-[#4CC38A]/80' // Under 80% - Green
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