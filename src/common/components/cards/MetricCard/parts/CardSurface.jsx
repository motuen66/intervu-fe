import Box from "@mui/material/Box";
import { alpha } from "@mui/material/styles";
import { forwardRef } from "react";
import { metricCardTokens } from "../tokens";

// Base shell: super-rounded white surface, soft border, ambient shadow,
// hover lift, dot-mesh texture overlay, content clipping.
//
// Children render layered: ambient layer at z=0, content above. Decorative
// stuff is positioned absolutely so the content's own intrinsic height
// determines the card's height.
const CardSurface = forwardRef(function CardSurface(
    { children, interactive = false, sx, ...rest },
    ref,
) {
    const { radius, shadow, motion, texture } = metricCardTokens;

    return (
        <Box
            ref={ref}
            className="MetricCard-root"
            sx={(theme) => ({
                position: "relative",
                bgcolor: "background.paper",
                borderRadius: radius.card,
                border: "1px solid",
                borderColor: alpha(theme.palette.divider, 0.8),
                boxShadow: shadow.rest,
                overflow: "hidden",
                isolation: "isolate",
                cursor: interactive ? "pointer" : "default",
                transform: "translateY(0)",
                transition: `transform ${motion.duration} ${motion.ease}, box-shadow ${motion.duration} ${motion.ease}`,
                willChange: "transform",
                "&:hover, &:focus-visible": {
                    transform: `translateY(${motion.liftPx}px)`,
                    boxShadow: shadow.hover,
                },
                "&:focus-visible": {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: 4,
                },
                // Subtle dot-mesh texture overlay
                "&::before": {
                    content: '""',
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    opacity: texture.dotOpacity,
                    backgroundImage: `radial-gradient(${theme.palette.primary.main} ${texture.dotSizePx}px, transparent ${texture.dotSizePx}px)`,
                    backgroundSize: `${texture.dotGapPx}px ${texture.dotGapPx}px`,
                    zIndex: 0,
                    [theme.breakpoints.down("md")]: { display: "none" },
                },
                "@media (prefers-reduced-motion: reduce)": {
                    transition: `box-shadow ${motion.duration} ${motion.ease}`,
                    "&:hover, &:focus-visible": { transform: "none" },
                },
                ...(typeof sx === "function" ? sx(theme) : sx),
            })}
            {...rest}
        >
            {children}
        </Box>
    );
});

export default CardSurface;
