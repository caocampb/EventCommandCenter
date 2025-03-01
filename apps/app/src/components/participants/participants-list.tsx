'use client';

import { useState, useEffect } from 'react';
import { CSVImportButton } from './csv-import-button';
import { AddParticipantModal } from './add-participant-modal';

interface Participant {
  id: string;
  name: string;
  email: string;
  organization?: string;
  role?: string;
  dietaryRequirements?: string;
  accessibilityNeeds?: string;
  notes?: string;
}

interface EventParticipant {
  id: string;
  eventId: string;
  participantId: string;
  status: string;
  notes?: string;
  participant: Participant;
}

interface ParticipantsListProps {
  eventId: string;
  initialParticipants?: EventParticipant[];
}

export function ParticipantsList({ eventId, initialParticipants = [] }: ParticipantsListProps) {
  const [participants, setParticipants] = useState<EventParticipant[]>(initialParticipants);
  const [loading, setLoading] = useState(initialParticipants.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Fetch participants if not provided
  useEffect(() => {
    if (initialParticipants.length > 0) {
      // No need to fetch if we have initial data
      return;
    }
    
    async function fetchParticipants() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/events/${eventId}/participants`);
        
        if (!response.ok) {
          throw new Error('Failed to load participants');
        }
        
        const data = await response.json();
        setParticipants(data.data || []);
      } catch (err) {
        console.error('Error loading participants:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    fetchParticipants();
  }, [eventId, initialParticipants]);
  
  // Listen for external open modal events (from the page header button)
  useEffect(() => {
    const handleOpenModalEvent = () => {
      setIsModalOpen(true);
    };
    
    // Add event listener
    document.addEventListener('openAddParticipantModal', handleOpenModalEvent);
    
    // Clean up
    return () => {
      document.removeEventListener('openAddParticipantModal', handleOpenModalEvent);
    };
  }, []);
  
  // Handle successful participant addition
  const handleParticipantAdded = async () => {
    // Show success message
    setImportSuccess('Participant added successfully');
    
    // Clear success message after 5 seconds
    setTimeout(() => {
      setImportSuccess(null);
    }, 5000);
    
    // Refresh participants list
    try {
      const response = await fetch(`/api/events/${eventId}/participants`);
      
      if (!response.ok) {
        throw new Error('Failed to refresh participants');
      }
      
      const data = await response.json();
      setParticipants(data.data || []);
    } catch (err) {
      console.error('Error refreshing participants:', err);
    }
  };
  
  // Handle successful import
  const handleImportComplete = (count: number) => {
    setImportSuccess(`Successfully imported ${count} participants`);
    
    // Clear success message after 5 seconds
    setTimeout(() => {
      setImportSuccess(null);
    }, 5000);
    
    // Refresh participants list
    handleParticipantAdded();
  };
  
  // Remove a participant from the event
  const handleRemoveParticipant = async (participantId: string) => {
    if (!confirm('Are you sure you want to remove this participant from the event?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/events/${eventId}/participants?participantId=${participantId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove participant');
      }
      
      // Update the local state
      setParticipants(participants.filter(p => p.participantId !== participantId));
    } catch (err) {
      console.error('Error removing participant:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };
  
  // Group participants by dietary requirement
  const dietaryGroups = participants.reduce((groups, participant) => {
    const requirement = participant.participant.dietaryRequirements;
    if (requirement && requirement.trim()) {
      const normalizedReq = requirement.trim().toLowerCase();
      groups[normalizedReq] = (groups[normalizedReq] || 0) + 1;
    }
    return groups;
  }, {} as Record<string, number>);
  
  // Create a summary string for dietary requirements
  const dietarySummary = Object.entries(dietaryGroups)
    .sort((a, b) => b[1] - a[1]) // Sort by count, descending
    .map(([req, count]) => `${count} ${req}`)
    .join(', ');
  
  // Group participants by accessibility need
  const accessibilityGroups = participants.reduce((groups, participant) => {
    const need = participant.participant.accessibilityNeeds;
    if (need && need.trim()) {
      const normalizedNeed = need.trim().toLowerCase();
      groups[normalizedNeed] = (groups[normalizedNeed] || 0) + 1;
    }
    return groups;
  }, {} as Record<string, number>);
  
  // Create a summary string for accessibility needs
  const accessibilitySummary = Object.entries(accessibilityGroups)
    .sort((a, b) => b[1] - a[1]) // Sort by count, descending
    .map(([need, count]) => `${count} ${need}`)
    .join(', ');
  
  return (
    <div className="space-y-6">
      {/* Header - without any buttons */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[13px] font-medium uppercase tracking-wider text-gray-400">
          Participants ({participants.length})
        </h3>
        {/* No buttons here - keeping it clean per Linear design */}
      </div>
      
      {/* AddParticipantModal - will only render when isModalOpen is true */}
      <AddParticipantModal
        eventId={eventId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleParticipantAdded}
      />
      
      {/* Success message */}
      {importSuccess && (
        <div className="bg-green-500/5 border border-green-500/20 text-green-500 px-4 py-3 rounded-md text-sm mb-4">
          {importSuccess}
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="bg-red-500/5 border border-red-500/20 text-red-500 px-4 py-3 rounded-md text-sm mb-4">
          {error}
        </div>
      )}
      
      {/* Requirements summary - only shown when there are participants */}
      {participants.length > 0 && (
        <div className="bg-[#141414] border border-[#1F1F1F] rounded-md p-4 mb-6">
          <h4 className="text-[13px] font-medium mb-3">Requirements Summary</h4>
          
          {dietarySummary && (
            <div className="mb-3">
              <div className="text-[13px] text-gray-400 mb-1">Dietary Requirements:</div>
              <div className="text-[14px]">{dietarySummary}</div>
            </div>
          )}
          
          {accessibilitySummary && (
            <div>
              <div className="text-[13px] text-gray-400 mb-1">Accessibility Needs:</div>
              <div className="text-[14px]">{accessibilitySummary}</div>
            </div>
          )}
          
          {!dietarySummary && !accessibilitySummary && (
            <div className="text-[14px] text-gray-500 italic">No special requirements recorded</div>
          )}
        </div>
      )}
      
      {/* Participants table */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#5E6AD2]"></div>
          <p className="mt-2 text-gray-500 text-sm">Loading participants...</p>
        </div>
      ) : participants.length > 0 ? (
        <div className="border border-[#1F1F1F] rounded-md overflow-hidden bg-[#141414]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1F1F1F]">
                <th className="text-left px-4 py-3 text-[13px] font-medium text-gray-400">Name</th>
                <th className="text-left px-4 py-3 text-[13px] font-medium text-gray-400">Email</th>
                <th className="text-left px-4 py-3 text-[13px] font-medium text-gray-400">Organization</th>
                <th className="text-left px-4 py-3 text-[13px] font-medium text-gray-400">Requirements</th>
                <th className="text-left px-4 py-3 text-[13px] font-medium text-gray-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F1F]">
              {participants.map((ep) => (
                <tr key={ep.id} className="hover:bg-[#1A1A1A] transition-colors duration-100">
                  <td className="px-4 py-3 text-sm">{ep.participant.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    <a href={`mailto:${ep.participant.email}`} className="hover:text-[#5E6AD2] transition-colors duration-100">
                      {ep.participant.email}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{ep.participant.organization || '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    {/* Show dietary requirements and accessibility needs with icons */}
                    <div className="flex flex-col gap-1">
                      {ep.participant.dietaryRequirements && (
                        <div className="flex items-center gap-1.5 text-gray-300">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="text-xs">{ep.participant.dietaryRequirements}</span>
                        </div>
                      )}
                      {ep.participant.accessibilityNeeds && (
                        <div className="flex items-center gap-1.5 text-gray-300">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 013 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                          </svg>
                          <span className="text-xs">{ep.participant.accessibilityNeeds}</span>
                        </div>
                      )}
                      {!ep.participant.dietaryRequirements && !ep.participant.accessibilityNeeds && '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleRemoveParticipant(ep.participantId)}
                      className="text-gray-500 hover:text-red-500 transition-colors duration-100"
                      title="Remove participant"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border border-[#1F1F1F] rounded-md p-6 text-center">
          <p className="text-gray-400 mb-4">No participants yet</p>
          <div className="text-sm flex flex-col items-center gap-2">
            {/* Linear-style subtle import option with tooltip */}
            <div className="relative group">
              <button 
                onClick={() => document.getElementById('csv-file-input')?.click()}
                className="text-gray-400 hover:text-[#5E6AD2] transition-colors duration-150"
              >
                Import via CSV
              </button>
              
              {/* Hidden file input */}
              <CSVImportButton 
                eventId={eventId} 
                onImportComplete={handleImportComplete} 
                className="hidden" 
                id="csv-file-input"
              />
              
              {/* Linear-style tooltip that appears on hover */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-72 bg-[#1A1A1A] border border-[#333333] rounded px-3 py-2 text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none shadow-lg">
                <p>CSV must include "name" and "email" columns.</p>
                <p className="text-gray-500 mt-1">Optional: organization, role, dietary requirements, accessibility needs, notes.</p>
              </div>
            </div>
            <p className="text-gray-500">or add them manually</p>
          </div>
        </div>
      )}
    </div>
  );
} 