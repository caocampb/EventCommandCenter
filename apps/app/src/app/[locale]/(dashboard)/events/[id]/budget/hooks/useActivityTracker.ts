import { useState, useEffect, useCallback, useRef } from 'react';

type RefreshFunction = () => Promise<void>;
type DependencyList = ReadonlyArray<unknown>;

// This hook tracks user activity and manages auto-refresh functionality
export function useActivityTracker(
  refreshFn: RefreshFunction, 
  dependencies: DependencyList = [],
  options = {
    refreshInterval: 120000, // 2 minutes
    inactivityThreshold: 60000 // 1 minute
  }
) {
  const [lastUserActivity, setLastUserActivity] = useState<number>(Date.now());
  const userIsScrolling = useRef(false);
  
  // Track user activity
  const trackUserActivity = useCallback(() => {
    setLastUserActivity(Date.now());
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
  
  // Set up periodic refresh with conditional execution based on user activity
  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now();
      const userIsInactive = (now - lastUserActivity) > options.inactivityThreshold;
      
      // Only refresh if user has been inactive for the specified time
      // and is not actively scrolling
      if (userIsInactive && !userIsScrolling.current) {
        console.log("Auto-refreshing after inactivity");
        refreshFn();
      } else {
        console.log("Skipping auto-refresh due to user activity");
      }
    }, options.refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [refreshFn, lastUserActivity, options.inactivityThreshold, options.refreshInterval]);
  
  return { 
    trackUserActivity,
    lastUserActivity,
    isScrolling: () => userIsScrolling.current
  };
} 