/**
 * Maps InterviewBookingTransactionHistoryDto.type (C# TransactionType enum) to a display label.
 * Order matches Intervu.Domain.Entities.Constants.TransactionType.
 */
const BY_INDEX = ["Payment", "Payout", "Refund", "Compensation", "Earnings", "Withdrawal"];

const BY_NAME = BY_INDEX.reduce((acc, label) => {
    acc[label.toLowerCase()] = label;
    return acc;
}, {});

/**
 * @param {unknown} raw — numeric enum, or string name from API
 * @returns {string}
 */
export function formatTransactionType(raw) {
    if (raw === null || raw === undefined || raw === "") return "—";

    if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw < BY_INDEX.length) {
        return BY_INDEX[raw];
    }

    if (typeof raw === "string") {
        const trimmed = raw.trim();
        if (!trimmed) return "—";
        const asNum = Number(trimmed);
        if (Number.isInteger(asNum) && asNum >= 0 && asNum < BY_INDEX.length) {
            return BY_INDEX[asNum];
        }
        const lower = trimmed.toLowerCase();
        if (BY_NAME[lower]) return BY_NAME[lower];
    }

    return "—";
}

/**
 * @param {unknown} raw
 * @returns {number | null}
 */
function resolveTransactionTypeIndex(raw) {
    if (raw === null || raw === undefined || raw === "") return null;

    if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw < BY_INDEX.length) {
        return raw;
    }

    if (typeof raw === "string") {
        const trimmed = raw.trim();
        if (!trimmed) return null;
        const asNum = Number(trimmed);
        if (Number.isInteger(asNum) && asNum >= 0 && asNum < BY_INDEX.length) {
            return asNum;
        }
        const lower = trimmed.toLowerCase();
        if (BY_NAME[lower]) {
            return BY_INDEX.indexOf(BY_NAME[lower]);
        }
    }

    return null;
}

/**
 * Money in (+) for the transaction owner: Payout, Refund, Compensation, Earnings.
 * Money out (-): Payment, Withdrawal.
 * @param {unknown} raw
 * @returns {boolean | null}
 */
export function isTransactionAmountCredit(raw) {
    const idx = resolveTransactionTypeIndex(raw);
    if (idx === null) return null;
    return idx !== 0 && idx !== 5;
}
