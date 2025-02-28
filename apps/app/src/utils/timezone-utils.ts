/**
 * Timezone and Date Utilities
 * 
 * This file provides consistent handling of dates and times across the application,
 * specifically addressing timezone issues between the UI and database.
 */

/**
 * Formats a Date object or ISO string to the format needed for datetime-local inputs
 * while preserving the display time (not converting to UTC)
 * 
 * @param date - Date object or ISO date string
 * @returns Formatted date string in YYYY-MM-DDThh:mm format (local time)
 */
export function formatDateTimeForInput(date: Date | string): string {
  // For ISO strings representing UTC times, extract parts directly
  if (typeof date === 'string' && (date.endsWith('Z') || date.includes('+00:00'))) {
    // Format: "2023-02-28T12:30:00.000Z" or "2023-02-28T12:30:00+00:00"
    console.log('Direct time extraction for input form:', date);
    
    // Extract date and time parts directly from the string
    const year = date.substring(0, 4);
    const month = date.substring(5, 7);
    const day = date.substring(8, 10);
    const hours = date.substring(11, 13); 
    const minutes = date.substring(14, 16);
    
    const formattedForInput = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    // Add essential debug info
    console.log('Formatted time for form input:', {
      originalUTC: date,
      extractedHours: hours,
      extractedMinutes: minutes,
      formattedForInput,
      display12h: `${(parseInt(hours, 10) % 12) || 12}:${minutes} ${parseInt(hours, 10) >= 12 ? 'pm' : 'am'}`
    });
    
    return formattedForInput;
  }
  
  // For other formats, use Date object
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const hh = String(dateObj.getHours()).padStart(2, '0');
  const min = String(dateObj.getMinutes()).padStart(2, '0');
  
  const formattedForInput = `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  
  // Add debug info for non-UTC dates
  console.log('Formatted non-UTC time for form input:', {
    original: date,
    formattedForInput,
    display12h: `${(dateObj.getHours() % 12) || 12}:${min} ${dateObj.getHours() >= 12 ? 'pm' : 'am'}`
  });
  
  return formattedForInput;
}

/**
 * Converts a local time input to a properly formatted ISO string for database storage
 * This preserves the time AS ENTERED BY THE USER when storing in the database
 * 
 * @param dateTimeString - Local date time string from form input (e.g., "2023-02-28T12:30")
 * @returns ISO string preserving the exact time entered by the user
 */
export function localToUTCString(dateTimeString: string): string {
  if (!dateTimeString) return '';
  
  // Essential logging for debugging
  console.log('Converting local time to storage format:', {
    input: dateTimeString,
    localTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  
  try {
    // MOST DIRECT APPROACH: Simply extract the date and time parts
    // We're ignoring all timezone complexity and just storing the 
    // exact hours and minutes the user entered
    const matches = dateTimeString.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/);
    
    if (matches && matches.length === 3) {
      // We have the expected format YYYY-MM-DDThh:mm from the form input
      const [_, datePart, timePart] = matches;
      
      if (!datePart || !timePart) {
        console.warn('Missing date or time part in input:', dateTimeString);
        throw new Error('Invalid date format');
      }
      
      // Extract hours and minutes for special logging
      const [hoursStr, minutesStr] = timePart.split(':');
      const hours = parseInt(hoursStr as string, 10);
      const minutes = parseInt(minutesStr as string, 10);
      
      // Create the ISO string without any timezone conversion
      // This is the important part - we add the Z suffix which marks it as UTC
      // But we're INTENTIONALLY preserving the exact hours and minutes entered
      const preservedTimeISO = `${datePart}T${timePart}:00.000Z`;
      
      // Essential log for debugging
      console.log('Storing time with preserved values:', {
        originalHours: hours,
        originalMinutes: minutes,
        storedISO: preservedTimeISO,
        display12h: `${(hours % 12) || 12}:${minutesStr} ${hours >= 12 ? 'pm' : 'am'}`
      });
      
      return preservedTimeISO;
    }
    
    // Fallback for unexpected formats - still preserve the time exactly as entered
    console.warn('Using fallback time conversion for unexpected format:', dateTimeString);
    
    // Create a date object from the input
    const inputDate = new Date(dateTimeString);
    
    // Extract components directly to avoid timezone issues
    const year = inputDate.getFullYear();
    const month = String(inputDate.getMonth() + 1).padStart(2, '0');
    const day = String(inputDate.getDate()).padStart(2, '0');
    const hours = String(inputDate.getHours()).padStart(2, '0');
    const minutes = String(inputDate.getMinutes()).padStart(2, '0');
    
    // Create ISO string with extracted components
    const preservedTimeISO = `${year}-${month}-${day}T${hours}:${minutes}:00.000Z`;
    
    console.log('Fallback time conversion:', {
      originalInput: dateTimeString,
      extractedHours: inputDate.getHours(),
      storedISO: preservedTimeISO
    });
    
    return preservedTimeISO;
  } catch (error) {
    console.error('Error converting local time to ISO:', error);
    return new Date().toISOString(); // Default to now as last resort
  }
}

/**
 * Formats a time for display in timeline components
 * Directly extracts hours and minutes from ISO strings to ensure
 * we display exactly what the user entered
 * 
 * @param dateString - ISO date string
 * @returns Formatted time string (eg. "10:30 am")
 */
export function formatTimeForDisplay(dateString: string): string {
  if (!dateString) return '';
  
  // Essential logging only
  console.log('Formatting time for display:', dateString);
  
  try {
    // For ISO strings representing UTC times, extract hours directly
    // Handle both formats: '2023-02-28T12:30:00.000Z' and '2023-02-28T12:30:00+00:00'
    const isUTC = typeof dateString === 'string' && 
                 (dateString.endsWith('Z') || dateString.includes('+00:00'));
                 
    if (isUTC) {
      // Extract hours and minutes parts from the ISO string
      // Format is like: "2023-02-28T12:30:00.000Z" or "2023-02-28T12:30:00+00:00"
      const hoursStr = dateString.substring(11, 13);
      const minutesStr = dateString.substring(14, 16);
      
      // Parse to integers
      const hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);
      
      // Format to 12-hour with am/pm
      const hours12 = hours % 12 || 12;
      const ampm = hours >= 12 ? 'pm' : 'am';
      const minutesFormatted = minutes.toString().padStart(2, '0'); // Ensure 2 digits
      
      const display = `${hours12}:${minutesFormatted} ${ampm}`;
      
      // Essential log with key information only
      console.log('Formatted UTC time:', {
        extractedHours: hours, 
        display,
        utcFormat: dateString.endsWith('Z') ? 'Z suffix' : '+00:00 format'
      });
      
      return display;
    }
    
    // For other formats, use Date object with caution
    const date = new Date(dateString);
    
    // Format using Date object methods
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    const hours12 = hours % 12 || 12;
    const minutesFormatted = minutes.toString().padStart(2, '0');
    
    const display = `${hours12}:${minutesFormatted} ${ampm}`;
    
    console.log('Formatted non-UTC time:', {
      extractedHours: hours,
      display
    });
    
    return display;
  } catch (error) {
    console.error('Error formatting time for display:', error);
    return 'Invalid time';
  }
}

/**
 * Formats a date for display in a user-friendly way
 * 
 * @param dateString - ISO date string
 * @returns Formatted date (eg. "February 28, 2023")
 */
export function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString);
  
  const options: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  };
  
  return date.toLocaleDateString(undefined, options);
} 