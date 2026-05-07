import { formatCurrency } from "./dateFormatter";
import { isTransactionAmountCredit } from "./transactionType";

/**
 * Signed amount for payment history: refunds and other credits show +, payments and withdrawals show -.
 * @param {unknown} amount
 * @param {boolean} isCoach
 * @param {unknown} transactionTypeRaw — API `type` (TransactionType enum)
 * @returns {{ text: string, color: string }}
 */
export function formatTransactionAmountDisplay(amount, isCoach, transactionTypeRaw) {
    const safeAmount = typeof amount === "number" ? amount : Number((amount ?? "").toString().replace(/,/g, "")) || 0;
    const base = formatCurrency(safeAmount);
    const credit = isTransactionAmountCredit(transactionTypeRaw);
    if (credit === true) {
        return { text: `+ ${base}`, color: "#4CAF50" };
    }
    if (credit === false) {
        return { text: `- ${base}`, color: "#F44336" };
    }
    return isCoach ? { text: `+ ${base}`, color: "#4CAF50" } : { text: `- ${base}`, color: "#F44336" };
}
