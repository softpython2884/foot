
import { format, parseISO } from 'date-fns';

// This function will run on the client, so it will use the user's local timezone.
export function formatMatchDateTime(isoString: string): { date: string; time: string } {
  if (!isoString) return { date: 'N/A', time: 'N/A' };
  try {
    const dateObj = parseISO(isoString); // Use parseISO for robust ISO string parsing
    // Example: "Sat, Jul 20"
    const formattedDate = format(dateObj, 'EEE, MMM d');
    // Example: "02:00 PM"
    const formattedTime = format(dateObj, 'p');
    return { date: formattedDate, time: formattedTime };
  } catch (error) {
    console.error("Error formatting date: ", isoString, error);
    return { date: 'Invalid Date', time: 'Invalid Time' };
  }
}

// Example function to get today's date in YYYY-MM-DD format
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

// Example function to get date N days from now in YYYY-MM-DD format
export function getDateNDaysFromNowString(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}
