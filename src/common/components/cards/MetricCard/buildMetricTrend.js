// Single source of truth for MetricCard trend props.
//
// Why this exists:
//   - `0` is falsy, so `delta ? { value: delta } : undefined` silently dropped
//     valid 0% trends. We need an explicit numeric check.
//   - Some metrics are lower-is-better (latency, error rate, refund rate). The
//     visual direction must invert without lying about the sign in the label.
//
// Returns a TrendBadge-compatible `{ direction, value, label }` or `undefined`
// when there is nothing meaningful to render.

export function formatSignedPercent(value, precision = 1) {
    const safe = Number(value) || 0;
    const sign = safe > 0 ? "+" : safe < 0 ? "-" : "";
    return `${sign}${Math.abs(safe).toFixed(precision)}%`;
}

export default function buildMetricTrend({
    delta,
    baseline,
    preferLower = false,
    precision = 1,
    hideWhenNoBaseline = true,
    zeroAsFlat = true,
} = {}) {
    if (!Number.isFinite(delta)) return undefined;

    // Only enforce the no-baseline rule when the caller actually passed one.
    // A missing baseline means "caller doesn't track it" — not "no data".
    if (hideWhenNoBaseline && baseline !== undefined && !baseline) return undefined;

    const safe = Number(delta);
    let direction;
    if (safe === 0) {
        if (!zeroAsFlat) return undefined;
        direction = "flat";
    } else if (preferLower) {
        direction = safe > 0 ? "down" : "up";
    } else {
        direction = safe > 0 ? "up" : "down";
    }

    return {
        direction,
        value: safe,
        label: formatSignedPercent(safe, precision),
    };
}
