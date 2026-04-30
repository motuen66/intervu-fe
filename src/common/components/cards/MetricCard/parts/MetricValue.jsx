import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { metricCardTokens } from "../tokens";

export default function MetricValue({ children, size = "md", showAccentDot = true, id }) {
    const variant = metricCardTokens.type.value[size]?.variant ?? "h3";

    return (
        <Box sx={{ display: "inline-flex", alignItems: "baseline", gap: 0.75, position: "relative", zIndex: 1 }}>
            <Typography
                id={id}
                component="p"
                variant={variant}
                sx={{
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    color: "text.primary",
                    m: 0,
                    lineHeight: 1.1,
                }}
            >
                {children}
            </Typography>

            {showAccentDot && (
                <Box
                    aria-hidden
                    sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        bgcolor: "secondary.main",
                        opacity: 0.5,
                        transform: "scale(1)",
                        transition: `opacity ${metricCardTokens.motion.durationFast} ${metricCardTokens.motion.ease}, transform ${metricCardTokens.motion.durationFast} ${metricCardTokens.motion.ease}`,
                        ".MetricCard-root:hover &, .MetricCard-root:focus-visible &": {
                            opacity: 1,
                            transform: "scale(1.15)",
                        },
                        "@media (prefers-reduced-motion: reduce)": {
                            ".MetricCard-root:hover &, .MetricCard-root:focus-visible &": {
                                transform: "none",
                            },
                        },
                    }}
                />
            )}
        </Box>
    );
}
