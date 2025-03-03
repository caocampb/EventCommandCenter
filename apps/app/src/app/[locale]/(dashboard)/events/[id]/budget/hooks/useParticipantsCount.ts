import { useState, useEffect, useCallback } from 'react';

export function useParticipantsCount(eventId: string) {
  const [participantCount, setParticipantCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchParticipantCount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/events/${eventId}/participants`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch participants');
      }
      
      const data = await response.json();
      // Number of participants is the length of the data array
      setParticipantCount(data.data.length);
    } catch (err) {
      console.error('Error fetching participant count:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Default to 0 on error
      setParticipantCount(0);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchParticipantCount();
  }, [fetchParticipantCount]);

  return {
    participantCount,
    loading,
    error,
    refetchCount: fetchParticipantCount
  };
} 