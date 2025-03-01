'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface CSVImportButtonProps {
  eventId: string;
  onImportComplete?: (count: number) => void;
  className?: string;
  id?: string;
}

export function CSVImportButton({ eventId, onImportComplete, className = '', id }: CSVImportButtonProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError(null);

    try {
      // Read the file
      const text = await readFileAsText(file);
      
      // Parse CSV
      const participants = parseCSV(text);
      
      if (participants.length === 0) {
        throw new Error('No valid participants found in the CSV file');
      }
      
      // Upload to API
      const response = await fetch(`/api/events/${eventId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(participants),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import participants');
      }
      
      const data = await response.json();
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Call the callback if provided
      if (onImportComplete) {
        onImportComplete(data.count);
      }
      
      // Refresh the page to show the new participants
      router.refresh();
    } catch (err) {
      console.error('Error importing participants:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during import');
    } finally {
      setIsImporting(false);
    }
  };

  // Helper to read file as text
  const readFileAsText = (file: File): Promise<string> => {
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
      reader.readAsText(file);
    });
  };

  // Parse CSV into participant objects
  const parseCSV = (text: string) => {
    // Split by lines
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    
    if (lines.length < 2) {
      throw new Error('CSV file must have a header row and at least one data row');
    }
    
    // Get headers - ensure lines[0] exists before splitting
    const firstLine = lines[0] || '';
    const headers = firstLine.split(',').map(h => h.trim().toLowerCase());
    
    // Check for required headers
    if (!headers.includes('name') || !headers.includes('email')) {
      throw new Error('CSV file must have "name" and "email" columns');
    }
    
    // Map headers to our fields
    const fieldMap: Record<string, string> = {
      'name': 'name',
      'email': 'email',
      'organization': 'organization',
      'company': 'organization',  // Alternative name
      'role': 'role',
      'position': 'role',  // Alternative name
      'title': 'role',  // Alternative name
      'dietary requirements': 'dietaryRequirements',
      'dietary': 'dietaryRequirements',  // Alternative name
      'diet': 'dietaryRequirements',  // Alternative name
      'accessibility needs': 'accessibilityNeeds',
      'accessibility': 'accessibilityNeeds',  // Alternative name
      'notes': 'notes',
      'comments': 'notes'  // Alternative name
    };
    
    // Map CSV rows to participant objects
    const participants = [];
    for (let i = 1; i < lines.length; i++) {
      // Get the current line and skip if empty
      const currentLine = lines[i];
      if (!currentLine || !currentLine.trim()) continue;
      
      // Split the line into values
      const values = currentLine.split(',').map(v => v.trim());
      
      // Skip if not enough values
      if (values.length < 2) continue;
      
      // Create participant object
      const participant: Record<string, string> = {};
      
      // Map values to fields
      headers.forEach((header, index) => {
        const field = fieldMap[header];
        if (field && index < values.length && values[index]) {
          participant[field] = values[index];
        }
      });
      
      // Skip if missing required fields
      if (!participant.name || !participant.email) continue;
      
      participants.push(participant);
    }
    
    return participants;
  };

  return (
    <div className={className}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv"
        className="hidden"
        id={id}
      />
      {className !== 'hidden' && (
        <button
          onClick={handleImportClick}
          disabled={isImporting}
          className="flex items-center px-3 py-1.5 bg-[#1E1E1E] hover:bg-[#2A2A2A] text-sm font-medium rounded border border-[#333333] transition-colors duration-120 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="mr-1.5 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          {isImporting ? 'Importing...' : 'Import CSV'}
        </button>
      )}
      
      {error && (
        <div className="mt-2 text-xs text-red-500">
          {error}
        </div>
      )}
      
      {/* Linear-style help text */}
      <div className="mt-2 text-xs text-gray-500">
        <p>CSV must include "name" and "email" columns.</p>
        <p>Optional: organization, role, dietary requirements, accessibility needs, notes.</p>
      </div>
    </div>
  );
} 