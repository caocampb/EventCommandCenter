/**
 * Generates an array of dates between the specified start and end dates, inclusive.
 * Can return either Date objects or date strings in YYYY-MM-DD format.
 * 
 * @param startDate - The start date
 * @param endDate - The end date
 * @returns An array of dates in the specified format
 */
export function generateDateRange(startDate: Date, endDate: Date): Date[];
export function generateDateRange(startDate: string | Date, endDate: string | Date): string[];
export function generateDateRange(startDate: string | Date, endDate: string | Date): string[] | Date[] {
  // Normalize dates to YYYY-MM-DD format for consistent handling
  const normalizeDate = (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  
  const normalizedStart = normalizeDate(startDate);
  const normalizedEnd = normalizeDate(endDate);
  
  // Convert normalized strings to Date objects for iteration
  const start = new Date(`${normalizedStart}T00:00:00`);
  const end = new Date(`${normalizedEnd}T00:00:00`);
  
  // For Date return type (both inputs are Date objects)
  if (typeof startDate !== 'string' && typeof endDate !== 'string') {
    const dateRange: Date[] = [];
    const current = new Date(start);
    
    while (current <= end) {
      dateRange.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dateRange;
  }
  
  // For string return type
  const dates: string[] = [];
  const current = new Date(start);
  
  // Iterate through dates and add each normalized date string
  while (current <= end) {
    dates.push(normalizeDate(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

/**
 * Formats a date range for display
 * 
 * @param startDate - The start date string
 * @param endDate - The end date string
 * @returns Formatted date range string
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Check if dates are the same
  if (start.toDateString() === end.toDateString()) {
    // Single day event
    return start.toLocaleDateString(undefined, { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }
  
  // Multi-day event
  const startMonth = start.toLocaleDateString(undefined, { month: 'long' });
  const endMonth = end.toLocaleDateString(undefined, { month: 'long' });
  
  // Same month
  if (startMonth === endMonth && start.getFullYear() === end.getFullYear()) {
    return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
  }
  
  // Different months
  return `${start.toLocaleDateString(undefined, { 
    month: 'long', 
    day: 'numeric' 
  })} - ${end.toLocaleDateString(undefined, { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  })}`;
}

/**
 * Check if a date is today
 * 
 * @param date - The date to check
 * @returns Boolean indicating if the date is today
 */
export function isToday(date: Date | string): boolean {
  const dateToCheck = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return dateToCheck.getDate() === today.getDate() &&
    dateToCheck.getMonth() === today.getMonth() &&
    dateToCheck.getFullYear() === today.getFullYear();
} 