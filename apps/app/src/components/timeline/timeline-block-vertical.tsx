// Timeline block utilities
/**
 * Calculates the exact duration between two timestamps in hours
 * Works reliably with ISO strings
 */
export function calculateDurationInHours(
  startTime: string | Date,
  endTime: string | Date
): number {
  // Handle different input types
  const start = typeof startTime === 'string' 
    ? new Date(startTime) 
    : startTime;
    
  const end = typeof endTime === 'string'
    ? new Date(endTime)
    : endTime;
    
  // Get the difference in milliseconds
  const diffMs = end.getTime() - start.getTime();
  
  // Convert to hours (milliseconds to hours)
  const durationHours = diffMs / (1000 * 60 * 60);
  
  return durationHours;
}

/**
 * Formats a timestamp for debugging display
 */
export function formatTimeDebug(time: string | Date): string {
  const timeStr = typeof time === 'string' ? time : time.toISOString();
  if (timeStr.endsWith('Z')) {
    return `${timeStr.substring(11, 16)} UTC`;
  } else {
    return new Date(timeStr).toLocaleTimeString();
  }
} 