'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import type { BudgetItem } from '@/types/budget';
import { exportAsCSV, exportForGoogleSheets, exportForAirtable, createPrintView } from '../utils/exportUtils';

interface ExportMenuProps {
  items: BudgetItem[];
  totals: {
    plannedTotal: number;
    actualTotal: number;
    categoryTotals: {category: string, plannedAmount: number, actualAmount: number}[];
  };
  eventName: string;
  getVendorName: (vendorId?: string) => string;
  trackUserActivity: () => void;
}

export function ExportMenu({ items, totals, eventName, getVendorName, trackUserActivity }: ExportMenuProps) {
  // Handle export actions
  function handleExport(action: 'csv' | 'sheets' | 'airtable' | 'print') {
    trackUserActivity();
    
    switch (action) {
      case 'csv':
        exportAsCSV(items, totals, eventName, getVendorName);
        break;
      case 'sheets':
        exportForGoogleSheets(items, totals, eventName, getVendorName);
        break;
      case 'airtable':
        exportForAirtable(items, eventName, getVendorName);
        break;
      case 'print':
        createPrintView(items, totals, eventName, getVendorName);
        break;
    }
  }
  
  return (
    <div id="exportMenuRoot" style={{ position: 'relative' }} className="inline-block">
      <style jsx global>{`
        /* Make sure portals render on top of everything */
        #radix-portal {
          isolation: isolate;
          z-index: 99999;
        }
        
        /* Ensure content renders properly across all themes */
        .export-menu-content {
          background-color: white;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          border-radius: 6px;
          border: 1px solid #eee;
          overflow: hidden;
        }
        
        /* Dark theme support */
        [data-theme="dark"] .export-menu-content {
          background-color: #1f2937;
          border-color: #374151;
        }
      `}</style>
      
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            onClick={trackUserActivity}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md text-text-tertiary hover:text-text-secondary transition-colors duration-150"
          >
            Export
            <svg 
              width="15" 
              height="15" 
              viewBox="0 0 15 15" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="transition-transform duration-150 data-[state=open]:rotate-180"
            >
              <path d="M7.5 10.625L2.5 6.625L3.375 5.75L7.5 9.875L11.625 5.75L12.5 6.625L7.5 10.625Z" fill="currentColor" />
            </svg>
          </button>
        </DropdownMenu.Trigger>
        
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="export-menu-content z-[99999] min-w-[224px] overflow-hidden p-1"
            sideOffset={5}
            align="start"
            side="bottom"
          >
            <DropdownMenu.Item
              className="flex items-center w-full px-3 py-2 text-left text-[13px] text-text-primary rounded-md hover:bg-bg-hover focus:bg-bg-hover focus:outline-none cursor-default"
              onClick={() => handleExport('csv')}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mr-2 text-text-tertiary">
                <path d="M10 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 2v6m0 0-2-2m2 2 2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Export as CSV
            </DropdownMenu.Item>
            
            <DropdownMenu.Item
              className="flex items-center w-full px-3 py-2 text-left text-[13px] text-text-primary rounded-md hover:bg-bg-hover focus:bg-bg-hover focus:outline-none cursor-default"
              onClick={() => handleExport('sheets')}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mr-2 text-text-tertiary">
                <path d="M12 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 6h10M3 10h10M6 3v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Google Sheets Format
            </DropdownMenu.Item>
            
            <DropdownMenu.Item
              className="flex items-center w-full px-3 py-2 text-left text-[13px] text-text-primary rounded-md hover:bg-bg-hover focus:bg-bg-hover focus:outline-none cursor-default"
              onClick={() => handleExport('airtable')}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mr-2 text-text-tertiary">
                <rect x="3" y="3" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M3 6h10M6 3v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Airtable Format
            </DropdownMenu.Item>
            
            <DropdownMenu.Separator className="my-1 h-px bg-border-primary" />
            
            <DropdownMenu.Item
              className="flex items-center w-full px-3 py-2 text-left text-[13px] text-text-primary rounded-md hover:bg-bg-hover focus:bg-bg-hover focus:outline-none cursor-default"
              onClick={() => handleExport('print')}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mr-2 text-text-tertiary">
                <path d="M4 6V2h8v4M4 12H2V7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v5h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 9h8v5H4V9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Print View
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
} 