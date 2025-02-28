'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vendorSchema } from '@/lib/validations/vendor-schema';
import type { VendorFormValues } from '@/lib/validations/vendor-schema';
import type { PriceTier } from '@/types/vendor';
import Link from 'next/link';

export default function AddVendorPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: '',
      category: 'venue',
      priceTier: 2 as PriceTier,
      isFavorite: false,
    },
  });
  
  async function onSubmit(data: VendorFormValues) {
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('Submitting vendor data:', data);
      
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create vendor');
      }
      
      router.push('/en/vendors');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <Link 
          href="/en/vendors"
          className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4 transition-colors duration-150"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1.5">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to vendors
        </Link>
        <h1 className="text-2xl font-semibold text-white">Add Vendor</h1>
      </div>
      
      {error && (
        <div className="bg-red-500/5 border border-red-500/20 text-red-500 px-4 py-3 rounded-md mb-6 text-sm">
          {error}
        </div>
      )}
      
      <div className="bg-[#141414]/80 border border-[#1F1F1F] p-6 rounded-md mb-6">
        <p className="text-gray-400 text-sm">
          Enter the essential details to quickly add a vendor. You can add more information later.
        </p>
      </div>
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Name field */}
        <div className="space-y-2">
          <label htmlFor="name" className="text-[13px] font-medium text-gray-300">
            Vendor Name <span className="text-[#5E6AD2]">*</span>
          </label>
          <input
            id="name"
            type="text"
            {...form.register('name')}
            className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] placeholder:text-gray-600 transition-colors duration-120 text-[14px]"
            placeholder="Enter vendor name"
            autoFocus
          />
          {form.formState.errors.name && (
            <p className="text-red-500 text-[13px] mt-1.5">{form.formState.errors.name.message}</p>
          )}
        </div>
        
        {/* Category field */}
        <div className="space-y-2">
          <label htmlFor="category" className="text-[13px] font-medium text-gray-300">
            Category <span className="text-[#5E6AD2]">*</span>
          </label>
          <select
            id="category"
            {...form.register('category')}
            className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] transition-colors duration-120 text-[14px]"
          >
            <option value="venue">Venue</option>
            <option value="catering">Catering</option>
            <option value="entertainment">Entertainment</option>
            <option value="staffing">Staffing</option>
            <option value="equipment">Equipment</option>
            <option value="transportation">Transportation</option>
            <option value="other">Other</option>
          </select>
          {form.formState.errors.category && (
            <p className="text-red-500 text-[13px] mt-1.5">{form.formState.errors.category.message}</p>
          )}
        </div>
        
        {/* Price tier field */}
        <div className="space-y-2">
          <label htmlFor="priceTier" className="text-[13px] font-medium text-gray-300">
            Price Tier <span className="text-[#5E6AD2]">*</span>
          </label>
          <select
            id="priceTier"
            {...form.register('priceTier', { 
              valueAsNumber: true 
            })}
            className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] transition-colors duration-120 text-[14px]"
          >
            <option value="1">$ - Budget</option>
            <option value="2">$$ - Moderate</option>
            <option value="3">$$$ - Premium</option>
            <option value="4">$$$$ - Luxury</option>
          </select>
          {form.formState.errors.priceTier && (
            <p className="text-red-500 text-[13px] mt-1.5">{form.formState.errors.priceTier.message}</p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Capacity field */}
          <div className="space-y-2">
            <label htmlFor="capacity" className="text-[13px] font-medium text-gray-400">
              Capacity
            </label>
            <input
              id="capacity"
              type="number"
              min="1"
              {...form.register('capacity', {
                setValueAs: (value) => {
                  if (value === "" || value === undefined) return undefined;
                  return Number(value);
                }
              })}
              className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] placeholder:text-gray-600 transition-colors duration-120 text-[14px]"
              placeholder="Enter capacity"
            />
            {form.formState.errors.capacity && (
              <p className="text-red-500 text-[13px] mt-1.5">{form.formState.errors.capacity.message}</p>
            )}
          </div>
          
          {/* Location field */}
          <div className="space-y-2">
            <label htmlFor="location" className="text-[13px] font-medium text-gray-400">
              Location
            </label>
            <input
              id="location"
              type="text"
              {...form.register('location')}
              className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] placeholder:text-gray-600 transition-colors duration-120 text-[14px]"
              placeholder="Enter location"
            />
            {form.formState.errors.location && (
              <p className="text-red-500 text-[13px] mt-1.5">{form.formState.errors.location.message}</p>
            )}
          </div>
        </div>
        
        {/* Form actions */}
        <div className="flex justify-end border-t border-[#1F1F1F] pt-6 mt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 mr-4 bg-[#1E1E1E] hover:bg-[#2A2A2A] text-gray-400 rounded-md text-[14px] transition-colors duration-120"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-[#5E6AD2] hover:bg-[#6872E5] text-white rounded-md transition-colors duration-120 disabled:opacity-50 disabled:cursor-not-allowed text-[14px] font-medium border border-transparent hover:border-[#8D95F2] shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-[0_3px_12px_rgba(94,106,210,0.2)]"
          >
            {isSubmitting ? 'Creating...' : 'Create Vendor'}
          </button>
        </div>
      </form>
    </div>
  );
} 