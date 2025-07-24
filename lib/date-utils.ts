
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
    return format(dateObject, 'PP'); // Format as 'Month day, year'
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
    return format(dateObject, 'PPpp'); // Format as 'Month day, year, h:mm:ss AM/PM'
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};
