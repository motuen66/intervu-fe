const BLOCK_MINUTES = 30;

/**
 * Validates JD booking rounds in the block-based model.
 * Each round must have the correct number of consecutive availability block IDs.
 *
 * @param {Array<{serviceId: string, availabilityIds: string[], durationMinutes: number}>} selectedRounds
 * @param {Array<{id: string, startTime: Date|string, endTime: Date|string}>} freeSlots - all available blocks
 * @returns {{ isValid: boolean, errorMsg?: string }}
 */
export const validateJDBookingRounds = (selectedRounds, freeSlots) => {
    // Rule 1: At least 1 round
    if (!selectedRounds || selectedRounds.length < 1) {
        return { isValid: false, errorMsg: "At least 1 round is required." };
    }

    // Build a lookup of free slot IDs for quick validation
    const slotMap = new Map();
    freeSlots.forEach((slot) => {
        const start = slot.startTime instanceof Date ? slot.startTime : new Date(slot.startTime);
        const end = slot.endTime instanceof Date ? slot.endTime : new Date(slot.endTime);
        slotMap.set(String(slot.id), { start, end });
    });

    const allUsedBlockIds = new Set();

    for (let i = 0; i < selectedRounds.length; i++) {
        const round = selectedRounds[i];
        const label = `Round ${i + 1}`;

        // Rule 2: Each round must have availability IDs
        if (!round.availabilityIds || round.availabilityIds.length === 0) {
            return { isValid: false, errorMsg: `${label}: no time slots selected.` };
        }

        // Rule 3: Block count matches service duration / 30
        const expectedBlocks = Math.ceil(round.durationMinutes / BLOCK_MINUTES);
        if (round.availabilityIds.length !== expectedBlocks) {
            return {
                isValid: false,
                errorMsg: `${label}: expected ${expectedBlocks} blocks for ${round.durationMinutes}-minute service, got ${round.availabilityIds.length}.`,
            };
        }

        // Rule 4: All block IDs must exist in available slots
        const blocks = [];
        for (const blockId of round.availabilityIds) {
            const slot = slotMap.get(String(blockId));
            if (!slot) {
                return { isValid: false, errorMsg: `${label}: block ${blockId} is not available.` };
            }
            blocks.push({ id: blockId, ...slot });
        }

        // Rule 5: Blocks must be consecutive
        const sorted = [...blocks].sort((a, b) => a.start - b.start);
        for (let j = 1; j < sorted.length; j++) {
            if (sorted[j].start.getTime() !== sorted[j - 1].end.getTime()) {
                return {
                    isValid: false,
                    errorMsg: `${label}: blocks are not consecutive.`,
                };
            }
        }

        // Rule 6: Start time must be in the future
        if (sorted[0].start.getTime() <= Date.now()) {
            return { isValid: false, errorMsg: `${label}: start time must be in the future.` };
        }

        // Rule 7: No block used in multiple rounds
        for (const blockId of round.availabilityIds) {
            if (allUsedBlockIds.has(String(blockId))) {
                return { isValid: false, errorMsg: `${label}: block ${blockId} is already used in another round.` };
            }
            allUsedBlockIds.add(String(blockId));
        }
    }

    return { isValid: true };
};
