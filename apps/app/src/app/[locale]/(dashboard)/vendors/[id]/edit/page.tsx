'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vendorSchema } from '@/lib/validations/vendor-schema';
import type { VendorFormValues } from '@/lib/validations/vendor-schema';
import type { PriceTier, Vendor } from '@/types/vendor';
import Link from 'next/link';
import { DocumentsSection } from '@/components/vendors/documents-section';

export default function EditVendorPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: '',
      category: 'venue',
      priceTier: 2 as PriceTier,
      isFavorite: false,
    },
  });
  
  // Fetch vendor data
  useEffect(() => {
    async function loadVendor() {
      try {
        const response = await fetch(`/api/vendors/${vendorId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch vendor: ${response.status}`);
        }
        
        const data = await response.json();
        if (!data) throw new Error('Vendor not found');
        
        // Extract vendor data from the nested 'data' property
        const vendorData = data.data;
        if (!vendorData) throw new Error('Vendor data not found');
        
        // Transform any null values to undefined before setting form values
        const formValues = {
          name: vendorData.name,
          category: vendorData.category,
          priceTier: vendorData.priceTier,
          capacity: vendorData.capacity || undefined,
          location: vendorData.location || undefined,
          contactName: vendorData.contactName || undefined,
          contactEmail: vendorData.contactEmail || undefined,
          contactPhone: vendorData.contactPhone || undefined,
          website: vendorData.website || undefined,
          notes: vendorData.notes || undefined,
          isFavorite: vendorData.isFavorite || false,
          amenities: vendorData.amenities || undefined,
        };
        
        // Set form values
        form.reset(formValues);
      } catch (err) {
        console.error('Error loading vendor:', err);
        setError(err instanceof Error ? err.message : 'Failed to load vendor');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadVendor();
  }, [vendorId, form]);
  
  async function onSubmit(data: VendorFormValues) {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/vendors/${vendorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update vendor');
      }
      
      router.push(`/en/vendors`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }
  
  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6">
        <div className="flex items-center space-x-4 mb-8">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#5E6AD2]"></div>
          <p className="text-gray-400">Loading vendor data...</p>
        </div>
      </div>
    );
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">Edit Vendor</h1>
          <label className="inline-flex items-center cursor-pointer group relative">
            <input
              type="checkbox"
              {...form.register('isFavorite')}
              className="sr-only peer"
            />
            <div className="p-1.5 rounded hover:bg-[#1E1E1E] transition-colors duration-150">
              <svg 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                className={`transition-all duration-150 ${form.watch('isFavorite') 
                  ? 'text-[#5E6AD2] fill-[#5E6AD2]' 
                  : 'text-gray-500 group-hover:text-gray-300'}`}
              >
                <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#222222] text-gray-200 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
              {form.watch('isFavorite') ? 'Remove from favorites' : 'Add to favorites'}
            </span>
          </label>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-500/5 border border-red-500/20 text-red-500 px-4 py-3 rounded-md mb-6 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Essential Information Section */}
        <div className="space-y-6">
          <div className="border-b border-[#1F1F1F] pb-2 mb-2">
            <h2 className="text-[15px] font-medium text-white">Essential Information</h2>
          </div>
          
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
                min="0"
                {...form.register('capacity', {
                  setValueAs: (value) => {
                    if (value === "" || value === undefined || value === null) return undefined;
                    const num = Number(value);
                    return isNaN(num) || num <= 0 ? undefined : num;
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
                {...form.register('location', {
                  setValueAs: (value) => value === "" ? undefined : value
                })}
                className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] placeholder:text-gray-600 transition-colors duration-120 text-[14px]"
                placeholder="Enter location"
              />
              {form.formState.errors.location && (
                <p className="text-red-500 text-[13px] mt-1.5">{form.formState.errors.location.message}</p>
              )}
            </div>
          </div>
        </div>
      
        {/* Contact Information Section */}
        <div className="space-y-6 pt-2">
          <div className="border-b border-[#1F1F1F] pb-2 mb-2">
            <h2 className="text-[15px] font-medium text-gray-400">Contact Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Name */}
            <div className="space-y-2">
              <label htmlFor="contactName" className="text-[13px] font-medium text-gray-400">
                Contact Name
              </label>
              <input
                id="contactName"
                type="text"
                {...form.register('contactName', {
                  setValueAs: (value) => value === "" ? undefined : value
                })}
                className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] placeholder:text-gray-600 transition-colors duration-120 text-[14px]"
                placeholder="Enter contact name"
              />
              {form.formState.errors.contactName && (
                <p className="text-red-500 text-[13px] mt-1.5">{form.formState.errors.contactName.message}</p>
              )}
            </div>
            
            {/* Contact Phone */}
            <div className="space-y-2">
              <label htmlFor="contactPhone" className="text-[13px] font-medium text-gray-400">
                Contact Phone
              </label>
              <input
                id="contactPhone"
                type="tel"
                {...form.register('contactPhone', {
                  setValueAs: (value) => value === "" ? undefined : value
                })}
                className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] placeholder:text-gray-600 transition-colors duration-120 text-[14px]"
                placeholder="Enter contact phone"
              />
              {form.formState.errors.contactPhone && (
                <p className="text-red-500 text-[13px] mt-1.5">{form.formState.errors.contactPhone.message}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Email */}
            <div className="space-y-2">
              <label htmlFor="contactEmail" className="text-[13px] font-medium text-gray-400">
                Contact Email
              </label>
              <input
                id="contactEmail"
                type="email"
                {...form.register('contactEmail', {
                  setValueAs: (value) => value === "" ? undefined : value
                })}
                className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] placeholder:text-gray-600 transition-colors duration-120 text-[14px]"
                placeholder="Enter contact email"
              />
              {form.formState.errors.contactEmail && (
                <p className="text-red-500 text-[13px] mt-1.5">{form.formState.errors.contactEmail.message}</p>
              )}
            </div>
            
            {/* Website */}
            <div className="space-y-2">
              <label htmlFor="website" className="text-[13px] font-medium text-gray-400">
                Website
              </label>
              <input
                id="website"
                type="url"
                {...form.register('website', {
                  setValueAs: (value) => value === "" ? undefined : value
                })}
                className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] placeholder:text-gray-600 transition-colors duration-120 text-[14px]"
                placeholder="https://example.com"
              />
              {form.formState.errors.website && (
                <p className="text-red-500 text-[13px] mt-1.5">{form.formState.errors.website.message}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Additional Information Section */}
        <div className="space-y-6 pt-2">
          <div className="border-b border-[#1F1F1F] pb-2 mb-2">
            <h2 className="text-[15px] font-medium text-gray-400">Additional Information</h2>
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <label htmlFor="notes" className="text-[13px] font-medium text-gray-400">
              Notes
            </label>
            <textarea
              id="notes"
              {...form.register('notes', {
                setValueAs: (value) => value === "" ? undefined : value
              })}
              rows={4}
              className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] placeholder:text-gray-600 transition-colors duration-120 text-[14px]"
              placeholder="Additional notes about this vendor"
            />
            {form.formState.errors.notes && (
              <p className="text-red-500 text-[13px] mt-1.5">{form.formState.errors.notes.message}</p>
            )}
          </div>
        </div>
        
        {/* Documents Section */}
        <div className="space-y-6 pt-2" onClick={(e) => e.stopPropagation()}>
          <DocumentsSection vendorId={vendorId} />
        </div>
        
        {/* Form actions */}
        <div className="flex justify-end border-t border-[#1F1F1F] pt-6 mt-8">
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
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
} 