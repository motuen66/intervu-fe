import Box from "@mui/material/Box";
import { alpha } from "@mui/material/styles";
import { metricCardTokens } from "../tokens";

// Thin gradient line pinned to the card bottom. Center-bright, edges fade out
// — a classic "premium accent" that only reads on hover/focus.
export default function BottomAccent({ from, via }) {
    const { accentLine, motion, radius } = metricCardTokens;

    return (
        <Box
            aria-hidden
            sx={{
                position: "absolute",
                left: "8%",
                right: "8%",
                bottom: 0,
                height: accentLine.heightPx,
                pointerEvents: "none",
                borderRadius: radius.badge,
                opacity: accentLine.restOpacity,
                transition: `opacity ${motion.duration} ${motion.ease}`,
                background: `linear-gradient(90deg, ${alpha(from, 0)} 0%, ${via} 50%, ${alpha(from, 0)} 100%)`,
                ".MetricCard-root:hover &, .MetricCard-root:focus-visible &": {
                    opacity: accentLine.hoverOpacity,
                },
            }}
        />
    );
}
