import { format, parseISO, isValid } from 'date-fns';

export const formatTaskDate = (dueDate) => {
    if (!dueDate) return '';
    
    if (dueDate.includes(' - ')) {
        const parts = dueDate.split(' - ');
        const start = parseISO(parts[0]);
        const end = parseISO(parts[1]);
        
        if (!isValid(start)) return '';
        
        const includeTime = parts[0].includes('T');
        const startStr = format(start, includeTime ? 'MMMM d, yyyy h:mm a' : 'MMMM d, yyyy');
        
        if (isValid(end)) {
            const endIncludeTime = parts[1].includes('T');
            
            // If same day, don't repeat the date
            if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
                const startTime = includeTime ? format(start, 'h:mm a') : '';
                const endTime = endIncludeTime ? format(end, 'h:mm a') : '';
                
                if (includeTime && endIncludeTime) {
                    return `${format(start, 'MMMM d, yyyy')} ${startTime} - ${endTime}`;
                } else if (includeTime) {
                    return `${format(start, 'MMMM d, yyyy')} ${startTime}`;
                } else if (endIncludeTime) {
                    return `${format(start, 'MMMM d, yyyy')} - ${endTime}`;
                }
                return format(start, 'MMMM d, yyyy');
            }
            
            const endStr = format(end, endIncludeTime ? 'MMMM d, yyyy h:mm a' : 'MMMM d, yyyy');
            return `${startStr} - ${endStr}`;
        }
        return startStr;
    } else {
        const d = parseISO(dueDate);
        if (!isValid(d)) return '';
        const includeTime = dueDate.includes('T');
        return format(d, includeTime ? 'MMMM d, yyyy h:mm a' : 'MMMM d, yyyy');
    }
};
