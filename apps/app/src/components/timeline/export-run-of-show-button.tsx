'use client';

import { useState } from 'react';
import { TimelineBlock } from '../../types/timeline';
import { generateRunOfShowPDF } from '../../utils/pdf-generator';

interface ExportRunOfShowButtonProps {
  eventName: string;
  eventLocation: string;
  eventDate: string;
  eventEndDate: string;
  blocks: TimelineBlock[];
}

export function ExportRunOfShowButton({
  eventName,
  eventLocation,
  eventDate,
  eventEndDate,
  blocks
}: ExportRunOfShowButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleExport = async () => {
    try {
      setIsGenerating(true);
      
      // Generate and download the PDF
      await generateRunOfShowPDF(eventName, eventLocation, eventDate, blocks, eventEndDate);
      
      // Show success in console (could add a toast notification in the future)
      console.log('Run of Show PDF generated successfully');
    } catch (error) {
      console.error('Error generating Run of Show PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <button
      onClick={handleExport}
      disabled={isGenerating || blocks.length === 0}
      className="px-3 py-2 bg-bg-tertiary hover:bg-bg-hover text-sm text-text-primary font-medium rounded-md transition-colors duration-120 border border-border-primary hover:border-border-strong inline-flex items-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      title={blocks.length === 0 ? 'Add timeline blocks first' : 'Generate Run of Show PDF'}
    >
      <svg 
        width="14" 
        height="14" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="mr-1.5"
      >
        <path d="M14 3v4a1 1 0 001 1h4" />
        <path d="M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" />
        <path d="M12 17v-6" />
        <path d="M9 14l3 3 3-3" />
      </svg>
      {isGenerating ? 'Generating...' : 'Export Run of Show'}
    </button>
  );
} 