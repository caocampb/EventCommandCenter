'use client';

import { useState, useEffect } from 'react';
import { DocumentUpload } from './document-upload';
import { DocumentList } from './document-list';
import { VendorDocument } from '@/types/vendor';

interface DocumentsSectionProps {
  vendorId: string;
}

export function DocumentsSection({ vendorId }: DocumentsSectionProps) {
  const [documents, setDocuments] = useState<VendorDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

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

  // Handle document upload completion
  const handleUploadComplete = (document: VendorDocument) => {
    console.log("Upload complete - adding document to list:", document.name);
    setDocuments((prevDocuments) => [document, ...prevDocuments]);
    setUploadSuccess(true);
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setUploadSuccess(false);
    }, 3000);
  };

  // Handle document deletion
  const handleDeleteComplete = (documentId: string) => {
    console.log("Document deleted:", documentId);
    setDocuments((prevDocuments) => 
      prevDocuments.filter((doc) => doc.id !== documentId)
    );
  };

  return (
    <div className="space-y-6 pt-2">
      <div className="border-b border-[#1F1F1F] pb-2 mb-2">
        <h2 className="text-[15px] font-medium text-gray-400">Documents</h2>
      </div>
      
      {uploadSuccess && (
        <div className="bg-green-500/5 border border-green-500/20 text-green-500 px-4 py-3 rounded-md mb-6 text-sm">
          Document uploaded successfully!
        </div>
      )}
      
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
      ) : (
        <div className="space-y-4">
          <DocumentUpload 
            vendorId={vendorId} 
            onUploadComplete={handleUploadComplete}
          />
          
          <div className="mt-4">
            <DocumentList 
              vendorId={vendorId} 
              documents={documents}
              onDeleteComplete={handleDeleteComplete}
            />
          </div>
          
          <div className="text-xs text-gray-500 mt-2">
            <p>Only PDF files are supported (max 5MB)</p>
          </div>
        </div>
      )}
    </div>
  );
} 