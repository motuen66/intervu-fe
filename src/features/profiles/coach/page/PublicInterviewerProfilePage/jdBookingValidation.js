const MIN_GAP_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Validates if a string is a valid fully-qualified http, https, or ftp URL.
 * @param {string} urlString
 * @returns {boolean}
 */
export const isValidUrl = (urlString) => {
    if (!urlString) return false;
    try {
        const url = new URL(urlString);
        return ["http:", "https:", "ftp:"].includes(url.protocol);
    } catch {
        return false;
    }
};

/**
 * Validates JD multi-round booking rounds against available free slots.
 *
 * @param {Array<{serviceId: string, startTime: Date, durationMinutes: number}>} selectedRounds
 * @param {Array<{id: string, startTime: Date, endTime: Date}>} freeSlots
 * @returns {{ isValid: boolean, errorMsg?: string }}
 */
export const validateJDBookingRounds = (selectedRounds, freeSlots) => {
    // Rule 1: At least 2 rounds
    if (!selectedRounds || selectedRounds.length < 2) {
        return { isValid: false, errorMsg: "At least 2 rounds are required." };
    }

    // Validate all start times are in the future (preserve provided order)
    const now = Date.now();
    for (let i = 0; i < selectedRounds.length; i++) {
        const r = selectedRounds[i];
        if (r.startTime.getTime() <= now) {
            return { isValid: false, errorMsg: `Round ${i + 1} start time must be in the future.` };
        }
    }

    // Compute end times in original order
    const roundRanges = selectedRounds.map((r, i) => ({
        index: i,
        start: r.startTime.getTime(),
        end: r.startTime.getTime() + r.durationMinutes * 60 * 1000,
    }));

    // Rule 3: Every round must fit within at least one free slot
    for (const { index, start, end } of roundRanges) {
        const fits = freeSlots.some((slot) => {
            const slotStart = slot.startTime.getTime();
            const slotEnd = slot.endTime.getTime();
            return start >= slotStart && end <= slotEnd;
        });

        if (!fits) {
            return {
                isValid: false,
                errorMsg: `Round ${index + 1} does not fit within any available time slot.`,
            };
        }
    }

    // Rule 4: Strict sequence — Round N must happen before Round N+1 with at least MIN_GAP_MS gap
    for (let i = 1; i < roundRanges.length; i++) {
        const prev = roundRanges[i - 1];
        const curr = roundRanges[i];

        if (curr.start < prev.end + MIN_GAP_MS) {
            return {
                isValid: false,
                errorMsg: `Round ${i + 1} must start at least 15 minutes after Round ${i} ends.`,
            };
        }
    }

    return { isValid: true };
};
