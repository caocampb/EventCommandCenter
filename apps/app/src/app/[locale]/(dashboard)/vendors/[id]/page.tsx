'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Vendor } from '@/types/vendor';

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;
  
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
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
        setVendor(data.data);
      } catch (err) {
        console.error('Error loading vendor:', err);
        setError(err instanceof Error ? err.message : 'Failed to load vendor');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadVendor();
  }, [vendorId]);

  // Helper to display price tier
  const getPriceDisplay = (tier: number) => {
    const symbols = Array(tier).fill('$').join('');
    const labels = ['Budget', 'Moderate', 'Premium', 'Luxury'];
    return `${symbols} - ${labels[tier - 1]}`;
  };
  
  // Handle delete vendor
  const handleDelete = useCallback(async () => {
    if (!confirm("Are you sure you want to delete this vendor? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/vendors/${vendorId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete vendor");
      }

      router.push("/en/vendors");
      router.refresh();
    } catch (error) {
      console.error("Error deleting vendor:", error);
      alert("Failed to delete vendor. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }, [vendorId, router]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="w-full max-w-3xl mx-auto p-6">
        <div className="flex items-center space-x-4">
          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-[#5E6AD2]"></div>
          <p className="text-gray-400">Loading vendor details...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error || !vendor) {
    return (
      <div className="w-full max-w-3xl mx-auto p-6">
        <div className="mb-6">
          <Link 
            href="/en/vendors"
            className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors duration-150"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1.5">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to vendors
          </Link>
        </div>
        
        <div className="bg-red-500/5 border border-red-500/20 text-red-500 px-4 py-3 rounded-md text-sm">
          {error || 'Vendor not found'}
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-3xl mx-auto p-6">
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
      </div>
      
      {/* Header with vendor name and actions */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-semibold text-white mb-1">{vendor.name}</h1>
          {vendor.isFavorite && (
            <div className="ml-3 p-1 rounded bg-[#5E6AD2]/5 relative top-[-3px]">
              <svg 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                className="text-[#5E6AD2] fill-[#5E6AD2]"
              >
                <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <span className="inline-flex px-2 py-1 bg-[#1A1A1A] text-gray-300 text-xs rounded capitalize">
            {vendor.category}
          </span>
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-3 py-1.5 bg-[#1E1E1E] hover:bg-[#2A2A2A] text-gray-300 hover:text-red-400 rounded-md text-sm transition-colors duration-150 inline-flex items-center shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
          <Link 
            href={`/en/vendors/${vendor.id}/edit`}
            className="px-3 py-1.5 bg-[#1E1E1E] hover:bg-[#2A2A2A] text-gray-300 hover:text-white rounded-md text-sm transition-colors duration-150 inline-flex items-center shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mr-1.5">
              <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Edit
          </Link>
        </div>
      </div>
      
      {/* Main content */}
      <div className="space-y-10">
        {/* Essential Information */}
        <section className="space-y-6">
          <div className="pb-1 mb-2 border-b border-[#1F1F1F]">
            <h2 className="text-[15px] font-medium text-white">Essential Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
            <div>
              <h3 className="text-[13px] font-medium text-gray-400 mb-1">Category</h3>
              <p className="text-[15px] text-white capitalize">{vendor.category}</p>
            </div>
            
            <div>
              <h3 className="text-[13px] font-medium text-gray-400 mb-1">Price Tier</h3>
              <p className="text-[15px] text-white">
                {getPriceDisplay(vendor.priceTier)}
              </p>
            </div>
            
            <div>
              <h3 className="text-[13px] font-medium text-gray-400 mb-1">Capacity</h3>
              <p className="text-[15px] text-white">{vendor.capacity || '—'}</p>
            </div>
            
            <div>
              <h3 className="text-[13px] font-medium text-gray-400 mb-1">Location</h3>
              <p className="text-[15px] text-white">{vendor.location || '—'}</p>
            </div>
          </div>
        </section>
        
        {/* Contact Information */}
        <section className="space-y-6">
          <div className="pb-1 mb-2 border-b border-[#1F1F1F]">
            <h2 className="text-[15px] font-medium text-gray-400">Contact Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
            <div>
              <h3 className="text-[13px] font-medium text-gray-400 mb-1">Contact Name</h3>
              <p className="text-[15px] text-white">{vendor.contactName || '—'}</p>
            </div>
            
            <div>
              <h3 className="text-[13px] font-medium text-gray-400 mb-1">Contact Phone</h3>
              <p className="text-[15px] text-white">{vendor.contactPhone || '—'}</p>
            </div>
            
            <div>
              <h3 className="text-[13px] font-medium text-gray-400 mb-1">Contact Email</h3>
              <p className="text-[15px] text-white">
                {vendor.contactEmail ? (
                  <a 
                    href={`mailto:${vendor.contactEmail}`} 
                    className="text-[#5E6AD2] hover:underline"
                  >
                    {vendor.contactEmail}
                  </a>
                ) : '—'}
              </p>
            </div>
            
            <div>
              <h3 className="text-[13px] font-medium text-gray-400 mb-1">Website</h3>
              <p className="text-[15px] text-white">
                {vendor.website ? (
                  <a 
                    href={vendor.website} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[#5E6AD2] hover:underline inline-flex items-center"
                  >
                    {vendor.website.replace(/^https?:\/\//, '')}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="ml-1 opacity-70">
                      <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                ) : '—'}
              </p>
            </div>
          </div>
        </section>
        
        {/* Notes */}
        {vendor.notes && (
          <section className="space-y-4">
            <div className="pb-1 mb-2 border-b border-[#1F1F1F]">
              <h2 className="text-[15px] font-medium text-gray-400">Notes</h2>
            </div>
            
            <div className="bg-[#121212] border border-[#1F1F1F] p-4 rounded-md">
              <p className="text-[14px] text-gray-300 whitespace-pre-wrap">{vendor.notes}</p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
} 