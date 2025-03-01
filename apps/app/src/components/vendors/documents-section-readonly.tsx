'use client';

import { useState, useEffect } from 'react';
import { DocumentListReadonly } from './document-list-readonly';
import { VendorDocument } from '@/types/vendor';

interface DocumentsSectionReadonlyProps {
  vendorId: string;
}

export function DocumentsSectionReadonly({ vendorId }: DocumentsSectionReadonlyProps) {
  const [documents, setDocuments] = useState<VendorDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load documents on mount
  useEffect(() => {
    async function loadDocuments() {
      try {
        console.log("Loading documents for vendor:", vendorId);
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/vendors/${vendorId}/documents`);
        
        if (!response.ok) {
          console.error("Error response:", response.status);
          throw new Error(`Failed to fetch documents: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Documents loaded:", data.data?.length || 0, "documents");
        setDocuments(data.data || []);
      } catch (err) {
        console.error('Error loading documents:', err);
        setError(err instanceof Error ? err.message : 'Failed to load documents');
      } finally {
        setIsLoading(false);
      }
    }
    
    if (vendorId) {
      loadDocuments();
    }
  }, [vendorId]);

  return (
    <div className="space-y-4">
      <div className="pb-1 mb-2 border-b border-[#1F1F1F]">
        <h2 className="text-[15px] font-medium text-gray-400">Documents</h2>
      </div>
      
      {error && (
        <div className="bg-red-500/5 border border-red-500/20 text-red-500 px-4 py-3 rounded-md mb-6 text-sm">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex items-center space-x-2 text-gray-400 py-3">
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#5E6AD2]"></div>
          <span className="text-sm">Loading documents...</span>
        </div>
      ) : documents.length === 0 ? (
        <div className="py-3">
          <p className="text-[14px] text-gray-400">No documents attached to this vendor</p>
        </div>
      ) : (
        <DocumentListReadonly 
          vendorId={vendorId} 
          documents={documents}
        />
      )}
    </div>
  );
} 