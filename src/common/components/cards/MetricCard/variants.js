// Maps a MetricCard variant name to MUI palette token paths.
// We pass *paths* (strings) so consumers stay theme-agnostic; resolution
// happens inside useMetricVariant against the live theme.
//
// Adding a new variant:
//   1. (If a new color is needed) extend `palette.accents` in theme.jsx.
//   2. Add an entry below.
//   3. No other file should need to change.

export const METRIC_VARIANTS = ["navy", "blue", "purple", "emerald", "amber", "rose"];

export const DEFAULT_VARIANT = "navy";

export const metricVariantMap = {
    navy: {
        glow: "primary.main",
        watermark: "primary.main",
        accentGradientFrom: "primary.main",
        accentGradientVia: "secondary.main",
    },
    blue: {
        glow: "info.main",
        watermark: "info.main",
        accentGradientFrom: "info.main",
        accentGradientVia: "secondary.main",
    },
    purple: {
        glow: "accents.purple",
        watermark: "accents.purple",
        accentGradientFrom: "accents.purple",
        accentGradientVia: "secondary.main",
    },
    emerald: {
        glow: "success.main",
        watermark: "success.main",
        accentGradientFrom: "success.main",
        accentGradientVia: "secondary.main",
    },
    amber: {
        glow: "warning.main",
        watermark: "warning.main",
        accentGradientFrom: "warning.main",
        accentGradientVia: "secondary.main",
    },
    rose: {
        glow: "error.main",
        watermark: "error.main",
        accentGradientFrom: "error.main",
        accentGradientVia: "secondary.main",
    },
};
