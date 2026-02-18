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
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);

    // Create Date in UTC first
    const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
    // Substract offset to get the UTC point that corresponds to this NPT time
    return new Date(utcDate.getTime() - (NPT_OFFSET_MINUTES * 60000));
};
