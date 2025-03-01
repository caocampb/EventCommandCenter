'use client';

import React from 'react';

interface AddParticipantButtonProps {
  eventId: string;
}

export function AddParticipantButton({ eventId }: AddParticipantButtonProps) {
  const handleClick = () => {
    // Dispatch a custom event that the ParticipantsList component listens for
    document.dispatchEvent(new CustomEvent('openAddParticipantModal'));
  };
  
  return (
    <button
      onClick={handleClick}
      className="flex items-center px-3 py-2 bg-[#1E1E1E] hover:bg-[#2A2A2A] text-sm font-medium rounded border border-[#333333] transition-colors duration-120"
    >
      <svg className="mr-1.5 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
      Add Participant
    </button>
  );
} 