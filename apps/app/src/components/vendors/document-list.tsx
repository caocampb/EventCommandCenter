'use client';

import { useState, useEffect } from 'react';
import { VendorDocument } from '@/types/vendor';

interface DocumentListProps {
  vendorId: string;
  documents: VendorDocument[];
  onDeleteComplete?: (id: string) => void;
}

export function DocumentList({ vendorId, documents, onDeleteComplete }: DocumentListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // When documents change, log them
  useEffect(() => {
    console.log("Document list received documents:", documents.length);
  }, [documents]);

  // Format file size helper
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Handle preview document
  const handlePreview = (document: VendorDocument) => {
    console.log("Opening preview for document:", document.id);
    window.open(`/api/vendors/${vendorId}/documents/${document.id}/download?preview=true`, '_blank');
  };

  // Handle download document
  const handleDownload = (document: VendorDocument) => {
    console.log("Downloading document:", document.id);
    const link = window.document.createElement('a');
    link.href = `/api/vendors/${vendorId}/documents/${document.id}/download`;
    link.download = document.name;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  // Handle delete document
  const handleDelete = async (documentId: string) => {
    console.log("Deleting document:", documentId);
    setDeletingId(documentId);
    setError(null);

    try {
      const response = await fetch(`/api/vendors/${vendorId}/documents?documentId=${documentId}`, {
        method: 'DELETE',
      });

      console.log("Delete response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete document');
      }

      console.log("Document deleted successfully");
      
      // Call the callback if provided
      if (onDeleteComplete) {
        onDeleteComplete(documentId);
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while deleting');
    } finally {
      setDeletingId(null);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-sm text-gray-400 py-3">
        No documents uploaded yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="text-xs text-red-500 mb-2">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        {documents.map((document) => (
          <div 
            key={document.id} 
            className="flex items-center justify-between px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-md group"
          >
            <div className="flex items-center space-x-3">
              {/* PDF Icon */}
              <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 18H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate" title={document.name}>
                  {document.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(document.fileSize)} • {new Date(document.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              {/* Preview Button */}
              <button
                type="button"
                onClick={() => handlePreview(document)}
                className="p-1.5 rounded hover:bg-[#1E1E1E] text-gray-400 hover:text-white transition-colors duration-150"
                title="Preview"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
              
              {/* Download Button */}
              <button
                type="button"
                onClick={() => handleDownload(document)}
                className="p-1.5 rounded hover:bg-[#1E1E1E] text-gray-400 hover:text-white transition-colors duration-150"
                title="Download"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </button>
              
              {/* Delete Button */}
              <button
                type="button"
                onClick={() => handleDelete(document.id)}
                disabled={deletingId === document.id}
                className="p-1.5 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors duration-150"
                title="Delete"
              >
                {deletingId === document.id ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M16 12a4 4 0 11-8 0M12 8v4" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 