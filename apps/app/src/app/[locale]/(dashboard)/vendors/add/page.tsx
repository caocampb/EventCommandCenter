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
    <div className="p-6 bg-theme-bg-page max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/en/vendors"
          className="inline-flex items-center text-sm mb-4 text-theme-text-tertiary hover:text-theme-text-primary transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
            <path d="M19 12H5M5 12L12 19M5 12L12 5"/>
          </svg>
          Back to vendors
        </Link>
        
        <h1 className="text-2xl font-semibold text-theme-text-primary">Add New Vendor</h1>
      </div>
      
      {error && (
        <div className="bg-red-500/5 border border-red-500/20 text-red-500 px-4 py-3 rounded-md mb-6 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Name field */}
        <div className="space-y-2">
          <label htmlFor="name" className="text-[13px] font-medium text-theme-text-secondary">
            Vendor Name <span className="text-theme-primary">*</span>
          </label>
          <input
            id="name"
            type="text"
            {...form.register('name')}
            className="w-full px-3 py-2 bg-theme-bg-input border border-theme-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-theme-primary focus:border-theme-primary placeholder:text-theme-text-tertiary transition-colors duration-120 text-[14px] text-theme-text-primary"
            placeholder="Enter vendor name"
          />
          {form.formState.errors.name && (
            <p className="text-red-500 text-[13px] mt-1.5">{form.formState.errors.name.message}</p>
          )}
        </div>
        
        {/* Category field */}
        <div className="space-y-2">
          <label htmlFor="category" className="text-[13px] font-medium text-theme-text-secondary">
            Category <span className="text-theme-primary">*</span>
          </label>
          <select
            id="category"
            {...form.register('category')}
            className="w-full px-3 py-2 bg-theme-bg-input border border-theme-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-theme-primary focus:border-theme-primary transition-colors duration-120 text-[14px] text-theme-text-primary"
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
          <label htmlFor="priceTier" className="text-[13px] font-medium text-theme-text-secondary">
            Price Tier <span className="text-theme-primary">*</span>
          </label>
          <select
            id="priceTier"
            {...form.register('priceTier', { 
              valueAsNumber: true 
            })}
            className="w-full px-3 py-2 bg-theme-bg-input border border-theme-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-theme-primary focus:border-theme-primary transition-colors duration-120 text-[14px] text-theme-text-primary"
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
            <label htmlFor="capacity" className="text-[13px] font-medium text-theme-text-tertiary">
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
              className="w-full px-3 py-2 bg-theme-bg-input border border-theme-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-theme-primary focus:border-theme-primary placeholder:text-theme-text-tertiary transition-colors duration-120 text-[14px] text-theme-text-primary"
              placeholder="Enter capacity"
            />
            {form.formState.errors.capacity && (
              <p className="text-red-500 text-[13px] mt-1.5">{form.formState.errors.capacity.message}</p>
            )}
          </div>
          
          {/* Location field */}
          <div className="space-y-2">
            <label htmlFor="location" className="text-[13px] font-medium text-theme-text-tertiary">
              Location
            </label>
            <input
              id="location"
              type="text"
              {...form.register('location')}
              className="w-full px-3 py-2 bg-theme-bg-input border border-theme-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-theme-primary focus:border-theme-primary placeholder:text-theme-text-tertiary transition-colors duration-120 text-[14px] text-theme-text-primary"
              placeholder="Enter location"
            />
            {form.formState.errors.location && (
              <p className="text-red-500 text-[13px] mt-1.5">{form.formState.errors.location.message}</p>
            )}
          </div>
        </div>
        
        {/* Form submit */}
        <div className="flex justify-end border-t border-theme-border-subtle pt-6 mt-8">
          <button
            type="button"
            onClick={() => router.push('/en/vendors')}
            className="px-4 py-2 mr-4 bg-theme-bg-card hover:bg-theme-bg-hover text-theme-text-secondary rounded-md text-[14px] transition-colors duration-120"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-theme-primary hover:bg-theme-primary-hover text-white rounded-md transition-colors duration-120 disabled:opacity-50 disabled:cursor-not-allowed text-[14px] font-medium border border-transparent hover:border-theme-primary shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-[0_3px_12px_rgba(94,106,210,0.2)]"
          >
            {isSubmitting ? 'Adding...' : 'Add Vendor'}
          </button>
        </div>
      </form>
    </div>
  );
} 