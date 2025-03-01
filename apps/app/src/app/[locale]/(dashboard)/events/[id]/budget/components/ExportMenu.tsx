'use client';

import { useState, useRef, useEffect } from 'react';
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
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle export actions
  const handleExportCSV = () => {
    trackUserActivity();
    exportAsCSV(items, totals, eventName, getVendorName);
    setShowMenu(false);
  };
  
  const handleExportGoogleSheets = () => {
    trackUserActivity();
    exportForGoogleSheets(items, totals, eventName, getVendorName);
    setShowMenu(false);
  };
  
  const handleExportAirtable = () => {
    trackUserActivity();
    exportForAirtable(items, eventName, getVendorName);
    setShowMenu(false);
  };
  
  const handlePrintView = () => {
    trackUserActivity();
    createPrintView(items, totals, eventName, getVendorName);
    setShowMenu(false);
  };
  
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => {
          trackUserActivity();
          setShowMenu(!showMenu);
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md text-gray-400 hover:text-gray-200 transition-colors duration-150"
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7.5 10.625L2.5 6.625L3.375 5.75L7.5 9.875L11.625 5.75L12.5 6.625L7.5 10.625Z" fill="currentColor" />
        </svg>
        Export
      </button>
      
      {showMenu && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-[#1C1C1C] border border-[#333333] rounded-md shadow-lg overflow-hidden z-10">
          <div className="p-1">
            <button
              onClick={handleExportCSV}
              className="flex items-center w-full px-3 py-2 text-left text-[13px] text-gray-400 hover:bg-[#232323] rounded-md"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                <path d="M14 3v4a1 1 0 001 1h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Export as CSV
            </button>
            
            <button
              onClick={handleExportGoogleSheets}
              className="flex items-center w-full px-3 py-2 text-left text-[13px] text-gray-400 hover:bg-[#232323] rounded-md"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                <path d="M14 3v4a1 1 0 001 1h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Google Sheets Format
            </button>
            
            <button
              onClick={handleExportAirtable}
              className="flex items-center w-full px-3 py-2 text-left text-[13px] text-gray-400 hover:bg-[#232323] rounded-md"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                <path d="M14 3v4a1 1 0 001 1h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Airtable Format
            </button>
            
            <hr className="my-1 border-[#333333]" />
            
            <button
              onClick={handlePrintView}
              className="flex items-center w-full px-3 py-2 text-left text-[13px] text-gray-400 hover:bg-[#232323] rounded-md"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 14h12v8H6v-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Print View
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 