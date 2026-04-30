import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { metricCardTokens } from "../tokens";

// Trend semantics override variant tint:
//   up   → success palette
//   down → error palette
//   flat → neutral
// On parent hover, the up/flat badges swap to lime+navy (the hero interaction).
// Down badges keep error tint so a regression never reads as "celebrated".
function resolveDirection(trend) {
    if (!trend) return null;
    if (trend.direction) return trend.direction;
    if (typeof trend.value === "number") {
        if (trend.value > 0) return "up";
        if (trend.value < 0) return "down";
    }
    return "flat";
}

const ICON_BY_DIRECTION = {
    up: TrendingUp,
    down: TrendingDown,
    flat: Minus,
};

export default function TrendBadge({ trend }) {
    const direction = resolveDirection(trend);
    if (!direction) return null;

    const Icon = ICON_BY_DIRECTION[direction];
    const isDown = direction === "down";

    const formatted =
        trend.label ??
        (typeof trend.value === "number"
            ? `${trend.value > 0 ? "+" : ""}${trend.value}%`
            : trend.value);

    return (
        <Box
            sx={(theme) => ({
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                px: 1.25,
                py: 0.5,
                borderRadius: metricCardTokens.radius.badge,
                position: "relative",
                zIndex: 1,
                bgcolor: isDown ? theme.palette.error.light : theme.palette.success.light,
                color: isDown ? theme.palette.error.dark : theme.palette.success.dark,
                transition: `background-color ${metricCardTokens.motion.durationFast} ${metricCardTokens.motion.ease}, color ${metricCardTokens.motion.durationFast} ${metricCardTokens.motion.ease}`,
                ...(isDown
                    ? {}
                    : {
                          ".MetricCard-root:hover &, .MetricCard-root:focus-visible &": {
                              bgcolor: theme.palette.secondary.main,
                              color: theme.palette.primary.main,
                          },
                      }),
            })}
        >
            <Icon size={14} strokeWidth={2.25} aria-hidden focusable={false} />
            <Typography
                component="span"
                sx={{
                    fontSize: 12,
                    fontWeight: 700,
                    lineHeight: 1,
                    letterSpacing: "0.01em",
                }}
            >
                {formatted}
            </Typography>
        </Box>
    );
}
