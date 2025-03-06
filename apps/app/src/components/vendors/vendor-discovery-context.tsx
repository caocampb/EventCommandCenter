'use client';

import { useState, useEffect, useRef } from 'react';

export interface EventContext {
  attendeeCount: string;
  eventType: string;
  specialRequirements: string;
}

interface VendorDiscoveryContextProps {
  onContextChange: (context: EventContext) => void;
}

export function VendorDiscoveryContext({ onContextChange }: VendorDiscoveryContextProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState('');
  const [eventType, setEventType] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');
  
  // Add a ref to track if values have changed
  const valuesRef = useRef({ attendeeCount, eventType, specialRequirements });

  // Use a ref for the timer to prevent it from being recreated
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved context on component mount (only once)
  useEffect(() => {
    const savedContext = localStorage.getItem('eventContext');
    if (savedContext) {
      try {
        const parsedContext = JSON.parse(savedContext) as EventContext;
        setAttendeeCount(parsedContext.attendeeCount || '');
        setEventType(parsedContext.eventType || '');
        setSpecialRequirements(parsedContext.specialRequirements || '');
      } catch (error) {
        console.error('Error parsing context:', error);
      }
    }
  }, []);

  // Helper to check if context is active
  const isContextActive = () => {
    return !!attendeeCount || !!eventType || !!specialRequirements;
  };

  // Update context when values change, with debounce
  useEffect(() => {
    // Check if values actually changed
    const prevValues = valuesRef.current;
    if (
      prevValues.attendeeCount !== attendeeCount ||
      prevValues.eventType !== eventType ||
      prevValues.specialRequirements !== specialRequirements
    ) {
      // Update ref with new values
      valuesRef.current = { attendeeCount, eventType, specialRequirements };
      
      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      // Set a new timer
      timerRef.current = setTimeout(() => {
        // Only include non-empty values in the context
        const context = {
          attendeeCount: attendeeCount.trim(),
          eventType: eventType.trim(),
          specialRequirements: specialRequirements.trim()
        };
        
        // Save to localStorage only if we have actual values
        if (isContextActive()) {
          localStorage.setItem('eventContext', JSON.stringify(context));
        } else {
          // Clear localStorage if all values are empty
          localStorage.removeItem('eventContext');
        }
        
        // Notify parent component
        onContextChange(context);
      }, 500); // 500ms debounce
    }
    
    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [attendeeCount, eventType, specialRequirements, onContextChange]);

  // Toggle disclosure panel
  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="mb-4">
      {/* Disclosure Button */}
      <button 
        type="button"
        onClick={togglePanel}
        className="flex items-center text-sm text-theme-text-secondary hover:text-theme-text-primary mb-2 transition-colors focus:outline-none"
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1.5">
          <path d="M7.5 0.875C5.49797 0.875 3.875 2.49797 3.875 4.5C3.875 6.15288 4.98124 7.54738 6.49373 7.98351C5.2997 8.12901 4.27557 8.55134 3.50407 9.31167C2.52216 10.2794 2.02502 11.72 2.02502 13.5999C2.02502 13.8623 2.23769 14.0749 2.50002 14.0749C2.76236 14.0749 2.97502 13.8623 2.97502 13.5999C2.97502 11.8799 3.42786 10.7206 4.17091 9.9883C4.91536 9.25463 6.02674 8.87499 7.49995 8.87499C8.97317 8.87499 10.0846 9.25463 10.8291 9.98831C11.5721 10.7206 12.025 11.8799 12.025 13.5999C12.025 13.8623 12.2376 14.0749 12.5 14.0749C12.7623 14.075 12.975 13.8623 12.975 13.6C12.975 11.72 12.4779 10.2794 11.496 9.3117C10.7246 8.55135 9.70019 8.129 8.50627 7.98352C10.0188 7.5474 11.125 6.15289 11.125 4.5C11.125 2.49797 9.50203 0.875 7.5 0.875ZM4.825 4.5C4.825 3.02264 6.02264 1.825 7.5 1.825C8.97736 1.825 10.175 3.02264 10.175 4.5C10.175 5.97736 8.97736 7.175 7.5 7.175C6.02264 7.175 4.825 5.97736 4.825 4.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
        </svg>
        <span>Event Context</span>
        {isContextActive() && (
          <div className="relative ml-2 flex items-center">
            <span className="absolute animate-ping h-2 w-2 rounded-full bg-emerald-500 opacity-50"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 border border-emerald-600"></span>
            {isOpen || (
              <span className="ml-1.5 text-xs text-emerald-500 font-medium">Active</span>
            )}
          </div>
        )}
        <svg 
          width="15" 
          height="15" 
          viewBox="0 0 15 15" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className={`ml-1.5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84198 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.8419 6.86477L7.84198 10.6148C7.64964 10.7951 7.35036 10.7951 7.15802 10.6148L3.15802 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
        </svg>
      </button>
      
      {/* Disclosure Panel */}
      {isOpen && (
        <div className="mb-4 p-3 bg-theme-bg-card border border-theme-border-subtle rounded-md animate-fadeIn">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label htmlFor="attendeeCount" className="block text-xs text-theme-text-secondary mb-1">Attendees</label>
              <input 
                id="attendeeCount"
                type="number" 
                value={attendeeCount} 
                onChange={e => setAttendeeCount(e.target.value)}
                placeholder="Number of attendees"
                className="w-full bg-theme-bg-input border border-theme-border-subtle rounded px-2 py-1.5 text-sm text-theme-text-primary focus:outline-none focus:ring-1 focus:ring-theme-primary focus:border-theme-primary transition-all duration-120"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="eventType" className="block text-xs text-theme-text-secondary mb-1">
                Event Type
              </label>
              <select 
                id="eventType"
                value={eventType}
                onChange={e => setEventType(e.target.value)}
                className="w-full bg-theme-bg-input border border-theme-border-subtle rounded px-2 py-1.5 text-sm text-theme-text-primary focus:outline-none focus:ring-1 focus:ring-theme-primary focus:border-theme-primary transition-all duration-120"
              >
                <option value="">-- Select event type --</option>
                <option value="venue">Venue/Location</option>
                <option value="food">Food/Catering</option>
                <option value="entertainment">Entertainment</option>
                <option value="staffing">Staffing</option>
                <option value="equipment">Equipment</option>
                <option value="transportation">Transportation</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="specialRequirements" className="block text-xs text-theme-text-secondary mb-1">Special Requirements</label>
            <textarea
              id="specialRequirements"
              value={specialRequirements}
              onChange={e => setSpecialRequirements(e.target.value)}
              placeholder="Indoor/outdoor, accessibility needs, budget constraints, etc."
              className="w-full h-16 bg-theme-bg-input border border-theme-border-subtle rounded px-2 py-1.5 text-sm text-theme-text-primary focus:outline-none focus:ring-1 focus:ring-theme-primary focus:border-theme-primary transition-all duration-120 resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
} 