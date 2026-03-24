
import { parseISO, format } from 'date-fns';

/**
 * Parses a date string in YYYY-MM-DD format as a Local Date,
 * preventing the common UTC -1 day shift in browsers.
 */
export const parseLocalDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();

    // If it's already a full ISO string with T, use standard parser
    if (dateStr.includes('T')) {
        return parseISO(dateStr);
    }

    // For YYYY-MM-DD, append T00:00:00 to force local interpretation in most browsers,
    // or parse parts manually for absolute reliability.
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
};

/**
 * Formats a date to YYYY-MM-DD string in local time.
 */
export const formatLocalDate = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
};
