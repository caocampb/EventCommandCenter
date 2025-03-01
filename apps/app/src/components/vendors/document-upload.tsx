'use client';

import { useState, useRef } from 'react';
import { VendorDocument } from '@/types/vendor';

interface DocumentUploadProps {
  vendorId: string;
  onUploadComplete?: (document: VendorDocument) => void;
}

export function DocumentUpload({ vendorId, onUploadComplete }: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = (e: React.MouseEvent) => {
    // Prevent any default form submission
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Prevent default form submission behavior
    e.preventDefault();
    
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("File selected:", file.name, "Size:", file.size, "Type:", file.type);

    // Validate file type (only PDF for now)
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are supported');
      return;
    }

    // Max file size (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setError('File size exceeds 5MB limit');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      console.log("Starting file upload process...");
      
      // Read file as base64
      const base64Content = await readFileAsBase64(file);
      
      console.log("File encoded, sending to API...");
      
      // Upload to API
      const response = await fetch(`/api/vendors/${vendorId}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileContent: base64Content
        }),
      });
      
      console.log("API response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload document');
      }
      
      const data = await response.json();
      console.log("Upload successful:", data);
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Call the callback if provided
      if (onUploadComplete) {
        onUploadComplete(data.data);
      }
    } catch (err) {
      console.error('Error uploading document:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  };

  // Helper to read file as base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read file: No result'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf"
        className="hidden"
        onClick={(e) => e.stopPropagation()} // Prevent click from bubbling
      />
      <button
        type="button" // Explicitly set type to button to prevent form submission
        onClick={handleUploadClick}
        disabled={isUploading}
        className="flex items-center px-3 py-1.5 bg-[#1E1E1E] hover:bg-[#2A2A2A] text-sm font-medium rounded border border-[#333333] transition-colors duration-120 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="mr-1.5 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        {isUploading ? 'Uploading...' : 'Upload PDF'}
      </button>
      
      {error && (
        <div className="mt-2 text-xs text-red-500">
          {error}
        </div>
      )}
    </div>
  );
} 