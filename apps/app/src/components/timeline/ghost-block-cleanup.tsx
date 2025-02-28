'use client';

import React, { useState } from 'react';
import { TimelineBlock } from "../../types/timeline";

interface GhostBlockCleanupProps {
  blocks: TimelineBlock[];
  eventId: string;
}

export function GhostBlockCleanup({ blocks, eventId }: GhostBlockCleanupProps) {
  const [deletingBlocks, setDeletingBlocks] = useState<Record<string, boolean>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Convert string or Date to string for display
  function formatTime(dateValue: string | Date): string {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    }).toLowerCase();
  }
  
  // Format date for display
  function formatDate(dateValue: string | Date): string {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return date.toLocaleDateString([], { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric' 
    });
  }
  
  // Delete a single ghost block
  const deleteBlock = async (blockId: string) => {
    setDeletingBlocks(prev => ({ ...prev, [blockId]: true }));
    setSuccessMessage(null);
    setErrorMessage(null);
    
    try {
      const response = await fetch(`/api/events/${eventId}/timeline/${blockId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      // Success - show message and keep the delete state
      setSuccessMessage(`Block deleted successfully`);
    } catch (error) {
      console.error('Failed to delete block:', error);
      setErrorMessage('Failed to delete the timeline block');
      setDeletingBlocks(prev => ({ ...prev, [blockId]: false }));
    }
  };
  
  // Delete all ghost blocks
  const deleteAllGhostBlocks = async () => {
    // Mark all blocks as deleting
    const allDeleting: Record<string, boolean> = {};
    blocks.forEach(block => {
      allDeleting[block.id] = true;
    });
    
    setDeletingBlocks(allDeleting);
    setSuccessMessage(null);
    setErrorMessage(null);
    
    try {
      // Delete each block individually
      for (const block of blocks) {
        await fetch(`/api/events/${eventId}/timeline/${block.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
      
      setSuccessMessage('All problematic blocks deleted successfully');
    } catch (error) {
      console.error('Failed to delete all blocks:', error);
      setErrorMessage('Failed to delete all blocks');
    }
  };
  
  // Check if all blocks are being deleted
  const allDeleting = blocks.every(block => deletingBlocks[block.id]);
  
  return (
    <div className="mb-6 bg-[#1A1010] border border-red-500/20 rounded-md p-4 shadow-sm">
      <h3 className="text-[14px] font-medium text-gray-200 mb-3 flex items-center">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-red-400">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        Detected {blocks.length} problematic timeline blocks
      </h3>
      
      <p className="text-sm text-gray-400 mb-4">
        The following blocks may cause display issues. They either have invalid start/end times or are missing required fields.
      </p>
      
      {successMessage && (
        <div className="mb-4 px-3 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-md text-sm">
          {successMessage}
        </div>
      )}
      
      {errorMessage && (
        <div className="mb-4 px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-md text-sm">
          {errorMessage}
        </div>
      )}
      
      <div className="space-y-3 mb-4">
        {blocks.map(block => (
          <div 
            key={block.id} 
            className="p-3 bg-[#141414] border border-[#2A2A2A] rounded-md flex justify-between items-start"
          >
            <div>
              <div className="font-medium text-[14px] mb-1">{block.title || 'Untitled Block'}</div>
              <div className="text-xs text-gray-400">
                Start: {formatDate(block.startTime)} at {formatTime(block.startTime)}<br/>
                End: {formatDate(block.endTime)} at {formatTime(block.endTime)}
              </div>
            </div>
            <button
              onClick={() => deleteBlock(block.id)}
              disabled={deletingBlocks[block.id]}
              className={`px-2 py-1 text-xs rounded-md border ${
                deletingBlocks[block.id] 
                  ? 'bg-[#141414] text-gray-500 border-gray-700 cursor-not-allowed' 
                  : 'bg-[#2A1010] text-red-400 border-red-700/30 hover:bg-[#3A1515]'
              }`}
            >
              {deletingBlocks[block.id] ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        ))}
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={deleteAllGhostBlocks}
          disabled={allDeleting || blocks.length === 0}
          className={`px-3 py-1.5 text-sm rounded-md border ${
            allDeleting 
              ? 'bg-[#141414] text-gray-500 border-gray-700 cursor-not-allowed' 
              : 'bg-[#2A1010] text-red-400 border-red-700/30 hover:bg-[#3A1515]'
          }`}
        >
          {allDeleting ? 'Deleting all...' : 'Delete all blocks'}
        </button>
      </div>
    </div>
  );
} 