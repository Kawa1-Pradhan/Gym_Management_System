/**
 * Nepali Time (NPT) is UTC+5:45
 */
const NPT_OFFSET_MINUTES = 5 * 60 + 45;

/**
 * Returns the current time in NPT as a Date object.
 * This object's UTC methods will effectively return NPT values.
 */
export const getNPTDate = () => {
    const now = new Date();
    return new Date(now.getTime() + (now.getTimezoneOffset() + NPT_OFFSET_MINUTES) * 60000);
};

/**
 * Converts any date to a Date object where UTC methods return NPT values.
 */
export const toNPT = (date) => {
    if (!date) return null;
    const d = new Date(date);
    // Adjust to NPT wall clock
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    return new Date(utc + (NPT_OFFSET_MINUTES * 60000));
};

/**
 * Gets a Date object for a specific YYYY-MM-DD and HH:mm in NPT.
 */
export const getNPTDateFromParts = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;

    const [year, month, day] = dateStr.split('-').map(Number);

    // Support AM/PM or 24h
    let hours, minutes;
    const timeMatch = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);

    if (timeMatch) {
        hours = parseInt(timeMatch[1]);
        minutes = parseInt(timeMatch[2]);
        const ampm = timeMatch[3] ? timeMatch[3].toUpperCase() : null;

        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
    } else {
        // Fallback to basic split
        [hours, minutes] = timeStr.split(':').map(s => parseInt(s));
    }

    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) {
        return null;
    }

    // Create Date in UTC first
    const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
    // Substract offset to get the UTC point that corresponds to this NPT time
    return new Date(utcDate.getTime() - (NPT_OFFSET_MINUTES * 60000));
};
