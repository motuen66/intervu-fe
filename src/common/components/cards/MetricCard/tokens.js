// Non-color visual constants for MetricCard.
// Colors live in the MUI theme palette + variants.js — never here.

export const metricCardTokens = {
    radius: {
        card: "2.5rem",
        icon: "1rem",
        badge: "999px",
    },
    shadow: {
        rest: "0 8px 30px rgba(15, 23, 42, 0.04)",
        hover: "0 30px 60px -15px rgba(15, 23, 42, 0.10)",
    },
    glow: {
        sizePx: 360,
        restOpacity: 0.18,
        hoverOpacity: 0.5,
        restScale: 0.85,
        hoverScale: 1.05,
        offsetRightPx: 32,
        offsetBottomPx: 32,
    },
    watermark: {
        sizePx: 170,
        strokeWidth: 1.25,
        restOpacity: 0.07,
        hoverOpacity: 0.18,
        hoverRotateDeg: 6,
        hoverScale: 1.1,
        offsetRightPx: -16,
        offsetBottomPx: -16,
    },
    motion: {
        duration: "600ms",
        durationFast: "350ms",
        durationSlow: "700ms",
        ease: "cubic-bezier(0.22, 1, 0.36, 1)",
        liftPx: -10,
    },
    spacing: {
        padding: { sm: 2.5, md: 3, lg: 4 },
        iconBoxPx: 44,
    },
    type: {
        label: {
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
        },
        value: {
            sm: { variant: "h4" },
            md: { variant: "h3" },
            lg: { variant: "h2" },
        },
    },
    texture: {
        dotOpacity: 0.012,
        dotSizePx: 1.5,
        dotGapPx: 14,
    },
    accentLine: {
        heightPx: 2,
        restOpacity: 0,
        hoverOpacity: 1,
    },
};
