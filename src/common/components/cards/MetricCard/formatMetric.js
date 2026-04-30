// Format a numeric metric with k / M / B suffixes.
// Strings or non-finite numbers pass through unchanged so callers can render
// pre-formatted values (e.g. "1.24s", "99.98%") without losing their suffix.

const SUFFIXES = [
    { v: 1e9, s: "B" },
    { v: 1e6, s: "M" },
    { v: 1e3, s: "k" },
];

export default function formatMetric(value, { decimals = 1, locale } = {}) {
    if (value == null || typeof value !== "number" || !Number.isFinite(value)) return value;

    const abs = Math.abs(value);
    const match = SUFFIXES.find((sfx) => abs >= sfx.v);

    if (!match) {
        return value.toLocaleString(locale, { maximumFractionDigits: decimals });
    }

    const scaled = value / match.v;
    const fixed = scaled.toLocaleString(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
    });
    return `${fixed}${match.s}`;
}
