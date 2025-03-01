'use client';

import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ExportRunOfShowButton } from './export-run-of-show-button';
import { TimelineBlock } from '../../types/timeline';

export function ExportButtonHydration() {
  useEffect(() => {
    // Find the container for the export button
    const container = document.getElementById('export-button-container');
    
    if (container) {
      try {
        // Get data from data attributes
        const eventName = container.getAttribute('data-event-name') || '';
        const eventLocation = container.getAttribute('data-event-location') || '';
        const eventDate = container.getAttribute('data-event-date') || '';
        const eventEndDate = container.getAttribute('data-event-end-date') || eventDate; // Use start date as fallback
        const blocksJson = container.getAttribute('data-blocks') || '[]';
        
        // Parse the timeline blocks
        const blocks = JSON.parse(blocksJson) as TimelineBlock[];
        
        // Create a root and render the button
        const root = createRoot(container);
        root.render(
          <ExportRunOfShowButton
            eventName={eventName}
            eventLocation={eventLocation}
            eventDate={eventDate}
            eventEndDate={eventEndDate}
            blocks={blocks}
          />
        );
      } catch (error) {
        console.error('Error hydrating export button:', error);
      }
    }
  }, []);
  
  // This component doesn't render anything itself
  return null;
} 