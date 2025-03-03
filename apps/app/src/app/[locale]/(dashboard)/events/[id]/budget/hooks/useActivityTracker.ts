import { useState, useEffect, useCallback, useRef } from 'react';

type RefreshFunction = () => Promise<void>;
type DependencyList = ReadonlyArray<unknown>;

// This hook tracks user activity and provides non-disruptive auto-refresh for collaboration
export function useActivityTracker(
  refreshFn: RefreshFunction, 
  dependencies: DependencyList = [],
  options = {
    refreshInterval: 300000, // 5 minutes (increased from 2)
    inactivityThreshold: 120000 // 2 minutes (increased from 1)
  }
) {
  const [lastUserActivity, setLastUserActivity] = useState<number>(Date.now());
  const userIsScrolling = useRef(false);
  const userIsEditing = useRef(false);
  
  // Track user activity
  const trackUserActivity = useCallback(() => {
    setLastUserActivity(Date.now());
    // When user interacts, assume they might be starting to edit something
    userIsEditing.current = true;
    
    // Clear editing flag after a short period of inactivity
    // This prevents refresh during brief pauses while actively working
    setTimeout(() => {
      userIsEditing.current = false;
    }, 30000); // 30 seconds
  }, []);
  
  // Enhanced activity tracker that handles multiple user events
  useEffect(() => {
    // Track user events to prevent unwanted refreshes
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click', 'focus'];
    
    // Set up timeout ref
    let scrollTimeout: NodeJS.Timeout | undefined;
    
    // Handle scroll specifically - set flag when scrolling starts and clear after scrolling stops
    const handleScroll = () => {
      userIsScrolling.current = true;
      setLastUserActivity(Date.now());
      
      // Clear scrolling flag after scrolling stops (with a small delay)
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        userIsScrolling.current = false;
      }, 100);
    };
    
    // Generic handler for other events
    const handleActivity = () => trackUserActivity();
    
    // Add all event listeners
    events.forEach(event => {
      if (event === 'scroll') {
        window.addEventListener(event, handleScroll, { passive: true });
      } else {
        window.addEventListener(event, handleActivity);
      }
    });
    
    // Cleanup
    return () => {
      events.forEach(event => {
        if (event === 'scroll') {
          window.removeEventListener(event, handleScroll);
        } else {
          window.removeEventListener(event, handleActivity);
        }
      });
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [trackUserActivity]);
  
  // Set up periodic refresh with improved conditions for collaborative use
  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now();
      const userIsInactive = (now - lastUserActivity) > options.inactivityThreshold;
      
      // Only refresh if:
      // 1. User has been inactive for the threshold time
      // 2. User is not actively scrolling
      // 3. User is not in the middle of editing something
      if (userIsInactive && !userIsScrolling.current && !userIsEditing.current) {
        console.log("Background refresh for collaboration");
        refreshFn();
      }
    }, options.refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [refreshFn, lastUserActivity, options.inactivityThreshold, options.refreshInterval]);
  
  return { 
    trackUserActivity,
    lastUserActivity,
    isScrolling: () => userIsScrolling.current,
    isEditing: () => userIsEditing.current
  };
} 