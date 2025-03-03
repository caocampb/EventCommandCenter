'use client';

import { useState } from 'react';
import type { VendorAssignment } from '../hooks/useEventVendors';
import { colors } from '@/styles/colors';

interface NewBudgetItem {
  description: string;
  category: string;
  plannedAmount: number;
  isPaid: boolean;
  isPerAttendee: boolean;
  vendorId?: string;
}

interface AddBudgetItemFormProps {
  categories: string[];
  vendors: VendorAssignment[];
  onAdd: (item: NewBudgetItem) => Promise<boolean>;
  onCancel: () => void;
  trackUserActivity: () => void;
}

export function AddBudgetItemForm({
  categories,
  vendors,
  onAdd,
  onCancel,
  trackUserActivity
}: AddBudgetItemFormProps) {
  const [newItem, setNewItem] = useState<NewBudgetItem>({
    description: '',
    category: '',
    plannedAmount: 0,
    isPaid: false,
    isPerAttendee: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    trackUserActivity();
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate form
      if (!newItem.description) {
        setError('Description is required');
        return;
      }
      if (!newItem.category) {
        setError('Category is required');
        return;
      }
      if (newItem.plannedAmount <= 0) {
        setError('Planned amount must be greater than zero');
        return;
      }
      
      const success = await onAdd(newItem);
      
      if (success) {
        // Reset form and close
        setNewItem({
          description: '',
          category: '',
          plannedAmount: 0,
          isPaid: false,
          isPerAttendee: false
        });
        onCancel();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="border border-[#1F1F1F] rounded-md p-5 mb-6" style={{ backgroundColor: colors.background.card }}>
      <h2 className="text-[15px] font-medium text-white mb-4">Add Budget Item</h2>
      
      {error && (
        <div className="mb-4 px-3 py-2 bg-[#E5484D]/10 border border-[#E5484D]/20 rounded-md text-[#E5484D] text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Description field */}
        <div>
          <label htmlFor="description" className="block text-[13px] text-gray-400 mb-1">
            Description
          </label>
          <input
            id="description"
            type="text"
            value={newItem.description}
            onChange={(e) => {
              trackUserActivity();
              setNewItem({...newItem, description: e.target.value});
            }}
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
              onChange={(e) => {
                trackUserActivity();
                setNewItem({...newItem, category: e.target.value});
              }}
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

        {/* Vendor field */}
        <div>
          <label htmlFor="vendorId" className="block text-[13px] text-gray-400 mb-1">
            Vendor (Optional)
          </label>
          <select
            id="vendorId"
            value={newItem.vendorId || ''}
            onChange={(e) => {
              trackUserActivity();
              setNewItem({...newItem, vendorId: e.target.value || undefined});
            }}
            className="w-full px-3 py-2 bg-[#0C0C0C] border border-[#1F1F1F] rounded-md text-[14px] placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] transition-colors duration-150"
          >
            <option value="">-- Select Vendor (Optional) --</option>
            {vendors.map((assignment) => (
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
            onChange={(e) => {
              trackUserActivity();
              setNewItem({...newItem, plannedAmount: parseInt(e.target.value, 10) || 0});
            }}
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
            onChange={(e) => {
              trackUserActivity();
              setNewItem({...newItem, isPaid: e.target.checked});
            }}
            className="h-4 w-4 rounded border-gray-600 text-[#5E6AD2] focus:ring-[#5E6AD2]"
          />
          <label htmlFor="isPaid" className="ml-2 block text-[13px] text-gray-400">
            Already paid
          </label>
        </div>
        
        {/* Add Budget Type toggle */}
        <div>
          <label className="block text-[13px] text-gray-400 mb-1">Budget Type</label>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => {
                trackUserActivity();
                setNewItem({...newItem, isPerAttendee: false});
              }}
              className={`flex-1 px-3 py-2 rounded-md text-[14px] border transition-colors duration-150 ${
                !newItem.isPerAttendee 
                  ? 'bg-[#5E6AD2]/10 border-[#5E6AD2]/30 text-[#5E6AD2]' 
                  : 'bg-[#0C0C0C] border-[#1F1F1F] text-gray-400 hover:border-[#5E6AD2]/20'
              }`}
            >
              Fixed Cost
            </button>
            <button
              type="button"
              onClick={() => {
                trackUserActivity();
                setNewItem({...newItem, isPerAttendee: true});
              }}
              className={`flex-1 px-3 py-2 rounded-md text-[14px] border transition-colors duration-150 ${
                newItem.isPerAttendee
                  ? 'bg-[#5E6AD2]/10 border-[#5E6AD2]/30 text-[#5E6AD2]'
                  : 'bg-[#0C0C0C] border-[#1F1F1F] text-gray-400 hover:border-[#5E6AD2]/20'
              }`}
            >
              Per Student
            </button>
          </div>
          <p className="mt-1 text-[12px] text-gray-500">
            {newItem.isPerAttendee 
              ? 'This cost applies per student attending the event.' 
              : 'This is a fixed cost regardless of attendance.'}
          </p>
        </div>
        
        {/* Form buttons */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => {
              trackUserActivity();
              onCancel();
            }}
            className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#252525] text-gray-400 rounded-md text-[13px] mr-3 transition-colors duration-150"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-3 py-1.5 bg-[#5E6AD2] hover:bg-[#6872E5] text-white rounded-md text-[13px] transition-colors duration-150 border border-transparent hover:border-[#8D95F2] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Adding...' : 'Add Item'}
          </button>
        </div>
      </form>
    </div>
  );
} 