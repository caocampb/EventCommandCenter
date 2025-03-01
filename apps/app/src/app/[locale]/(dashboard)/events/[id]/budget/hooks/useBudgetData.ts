import { useState, useEffect, useCallback } from 'react';
import type { BudgetItem } from '@/types/budget';

interface BudgetTotals {
  plannedTotal: number;
  actualTotal: number;
  categoryTotals: {category: string, plannedAmount: number, actualAmount: number}[];
}

export function useBudgetData(eventId: string) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [eventName, setEventName] = useState('');
  const [totals, setTotals] = useState<BudgetTotals>({
    plannedTotal: 0,
    actualTotal: 0,
    categoryTotals: []
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [totalBudgetValue, setTotalBudgetValue] = useState<number>(0);
  
  // Fetch budget data
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
  
  // Add a new budget item
  const addBudgetItem = useCallback(async (newItem: {
    description: string;
    category: string;
    plannedAmount: number;
    isPaid: boolean;
    vendorId?: string;
  }) => {
    try {
      if (!newItem.description || !newItem.category) {
        throw new Error('Description and category are required');
      }
      
      // Create the new item object
      const newBudgetItem = {
        description: newItem.description,
        category: newItem.category,
        plannedAmount: Number(newItem.plannedAmount),
        isPaid: newItem.isPaid,
        vendorId: newItem.vendorId
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
      setTotals(prev => ({
        ...prev,
        plannedTotal: prev.plannedTotal + Number(newItem.plannedAmount),
        categoryTotals: newCategoryTotals
      }));
      
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
      
      return true;
    } catch (err) {
      console.error('Error adding budget item:', err);
      // Refresh data to revert optimistic updates on error
      fetchBudgetData();
      throw err;
    }
  }, [eventId, totals, fetchBudgetData]);
  
  // Update actual amount
  const updateActualAmount = useCallback(async (item: BudgetItem, newActualAmount: number) => {
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
      
    } catch (err) {
      console.error('Error updating actual amount:', err);
      fetchBudgetData(); // Only refresh on error to reset state
      throw err;
    }
  }, [eventId, fetchBudgetData]);
  
  // Toggle paid status
  const togglePaidStatus = useCallback(async (item: BudgetItem) => {
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
      
    } catch (err) {
      console.error('Error updating budget item:', err);
      throw err;
    }
  }, [eventId]);
  
  // Delete a budget item
  const deleteBudgetItem = useCallback(async (item: BudgetItem) => {
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
      
    } catch (err) {
      console.error('Error deleting budget item:', err);
      throw err;
    }
  }, [eventId, fetchBudgetData]);
  
  // Update total budget
  const updateTotalBudget = useCallback(async (newTotalBudget: number) => {
    // Skip if value hasn't changed
    if (newTotalBudget === totals.plannedTotal) {
      return;
    }
    
    try {
      // API call to update the event budget
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          total_budget: newTotalBudget
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update budget: ${response.status}`);
      }
      
      // Optimistic update
      setTotals(prev => ({
        ...prev,
        plannedTotal: newTotalBudget
      }));
      
      setTotalBudgetValue(newTotalBudget);
      
    } catch (err) {
      console.error('Error updating total budget:', err);
      // Reset to previous value on error
      setTotalBudgetValue(totals.plannedTotal);
      throw err;
    }
  }, [eventId, totals.plannedTotal]);
  
  // Initialize data on mount
  useEffect(() => {
    fetchBudgetData();
  }, [fetchBudgetData]);
  
  // Set initial total budget value when data is loaded
  useEffect(() => {
    if (!isLoading && totals.plannedTotal) {
      setTotalBudgetValue(totals.plannedTotal);
    }
  }, [isLoading, totals.plannedTotal]);
  
  return {
    isLoading,
    error,
    budgetItems,
    eventName,
    totals,
    categories,
    totalBudgetValue,
    setTotalBudgetValue,
    actions: {
      fetchBudgetData,
      addBudgetItem,
      updateActualAmount,
      togglePaidStatus,
      deleteBudgetItem,
      updateTotalBudget
    }
  };
} 