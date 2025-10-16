/**
 * Timezone helpers for Cancún/Tulum (GMT-6 / America/Cancun)
 * 
 * All appointments should be handled in Cancún timezone (GMT-6)
 */

const CANCUN_TIMEZONE_OFFSET = -6; // GMT-6

/**
 * Converts a datetime-local string (YYYY-MM-DDTHH:mm) to a Date object in Cancún timezone
 * This ensures the date is correctly interpreted as Cancún time and converted to UTC for storage
 * 
 * @param datetimeLocalString - String from datetime-local input (e.g., "2024-10-16T14:00")
 * @returns Date object in UTC that represents the Cancún local time
 */
export function datetimeLocalToCancunDate(datetimeLocalString: string): Date {
  if (!datetimeLocalString) return new Date();
  
  // Parse the datetime-local string
  const [datePart, timePart] = datetimeLocalString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  // Create a date in UTC that represents Cancún local time
  // We need to add 6 hours to convert from Cancún (GMT-6) to UTC
  const cancunDate = new Date(Date.UTC(year, month - 1, day, hours + 6, minutes, 0, 0));
  
  return cancunDate;
}

/**
 * Converts a Date object (assumed to be in UTC) to datetime-local string format in Cancún timezone
 * This is used to populate datetime-local inputs with the correct Cancún time
 * 
 * @param date - Date object (in UTC from backend)
 * @returns String in format "YYYY-MM-DDTHH:mm" in Cancún timezone
 */
export function dateToDatetimeLocalCancun(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Convert UTC to Cancún time by subtracting 6 hours
  const cancunTime = new Date(d.getTime() - (6 * 60 * 60 * 1000));
  
  const year = cancunTime.getUTCFullYear();
  const month = String(cancunTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(cancunTime.getUTCDate()).padStart(2, '0');
  const hours = String(cancunTime.getUTCHours()).padStart(2, '0');
  const minutes = String(cancunTime.getUTCMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Gets the current date/time in Cancún timezone as a datetime-local string
 * Useful for setting default values in appointment forms
 * 
 * @returns String in format "YYYY-MM-DDTHH:mm" for current Cancún time
 */
export function getCurrentCancunDatetimeLocal(): string {
  const now = new Date();
  return dateToDatetimeLocalCancun(now);
}

/**
 * Formats a date for display in Cancún timezone
 * 
 * @param date - Date object or ISO string
 * @param includeTime - Whether to include time in the output
 * @returns Formatted date string in Cancún timezone
 */
export function formatCancunDate(date: Date | string, includeTime: boolean = true): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Convert to Cancún time
  const cancunTime = new Date(d.getTime() - (6 * 60 * 60 * 1000));
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Cancun',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(includeTime && {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
  
  return cancunTime.toLocaleString('es-MX', options);
}

/**
 * Combines a date and time string (HH:mm) into a Date object in Cancún timezone
 * Used when user selects date from calendar and time from separate input
 * 
 * @param date - Date object from calendar picker
 * @param timeString - Time in format "HH:mm" (e.g., "14:00")
 * @returns Date object in UTC that represents the Cancún local time
 */
export function combineDateAndTimeCancun(date: Date, timeString: string): Date {
  const [hours, minutes] = timeString.split(":").map(Number);
  
  // Get date components
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  // Create a date in UTC that represents Cancún local time
  // We need to add 6 hours to convert from Cancún (GMT-6) to UTC
  const cancunDate = new Date(Date.UTC(year, month, day, hours + 6, minutes, 0, 0));
  
  return cancunDate;
}

/**
 * Extracts time in HH:mm format from a Date object in Cancún timezone
 * 
 * @param date - Date object (in UTC from backend)
 * @returns String in format "HH:mm" in Cancún timezone
 */
export function getTimeCancun(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Convert UTC to Cancún time by subtracting 6 hours
  const cancunTime = new Date(d.getTime() - (6 * 60 * 60 * 1000));
  
  const hours = String(cancunTime.getUTCHours()).padStart(2, '0');
  const minutes = String(cancunTime.getUTCMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

/**
 * Converts a UTC date to a Date object that represents Cancún local time
 * This is useful for formatting with date-fns while maintaining Cancún timezone
 * 
 * @param date - Date object or ISO string (in UTC from backend)
 * @returns Date object adjusted to Cancún timezone for formatting purposes
 */
export function utcToCancunDate(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Convert UTC to Cancún time by subtracting 6 hours
  return new Date(d.getTime() - (6 * 60 * 60 * 1000));
}
