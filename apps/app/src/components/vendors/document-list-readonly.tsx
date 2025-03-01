'use client';

import { useState, useEffect } from 'react';
import { VendorDocument } from '@/types/vendor';

interface DocumentListReadonlyProps {
  vendorId: string;
  documents: VendorDocument[];
}

export function DocumentListReadonly({ vendorId, documents }: DocumentListReadonlyProps) {
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

  if (documents.length === 0) {
    return (
      <div className="text-sm text-gray-400 py-3">
        No documents available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {documents.map((document) => (
          <div 
            key={document.id} 
            className="flex items-center justify-between px-3 py-2 bg-[#121212] border border-[#1F1F1F] rounded-md group"
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 