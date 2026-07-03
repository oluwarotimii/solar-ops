
import { format } from 'date-fns';

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) {
    return 'N/A';
  }
  try {
    const dateObject = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObject.getTime())) {
      return 'Invalid Date';
    }
    return format(dateObject, 'd MMM yyyy'); // e.g., "2 Jul 2026"
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) {
    return 'N/A';
  }
  try {
    const dateObject = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObject.getTime())) {
      return 'Invalid Date';
    }
    return format(dateObject, 'd MMM yyyy HH:mm:ss'); // e.g., "2 Jul 2026 18:15:00"
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};
