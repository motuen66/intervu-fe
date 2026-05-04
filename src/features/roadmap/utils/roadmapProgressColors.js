import { alpha } from "@mui/material/styles";

/**
 * Bar color by completion percent (MUI palette tokens only).
 * p < 30 → error; 30 ≤ p < 68 → warning; p ≥ 68 → success (plan bands, no gaps).
 */
export function getProgressBarMainColor(theme, percent) {
    const p = Math.max(0, Math.min(100, Number(percent) || 0));
    if (p >= 68) return theme.palette.success.main;
    if (p >= 30) return theme.palette.warning.main;
    return theme.palette.error.main;
}

/**
 * sx for MUI LinearProgress (determinate): tinted track + colored bar.
 * Merge with local sx (height, borderRadius, etc.).
 */
export function getLinearProgressSxForPercent(theme, percent, { trackAlpha = 0.14 } = {}) {
    const main = getProgressBarMainColor(theme, percent);
    return {
        bgcolor: alpha(main, trackAlpha),
        "& .MuiLinearProgress-bar": {
            bgcolor: main,
        },
    };
}

/** sx color key matching the same percent bands (for Typography % labels). */
export function getProgressPercentCaptionSxColor(percent) {
    const p = Math.max(0, Math.min(100, Number(percent) || 0));
    if (p >= 68) return "success.main";
    if (p >= 30) return "warning.main";
    return "error.main";
}
