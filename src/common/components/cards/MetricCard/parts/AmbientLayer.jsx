import Box from "@mui/material/Box";
import { alpha } from "@mui/material/styles";
import { cloneElement, isValidElement } from "react";
import { metricCardTokens } from "../tokens";

// Renders the two ambient layers behind the card content:
//   1. A blurred circular glow (color from variant)
//   2. A super-large outline icon, partially clipped by card edges
//
// Both react to the parent's hover/focus-visible state via CSS sibling
// selectors set up on CardSurface. Decorative only — aria-hidden.
export default function AmbientLayer({ glowColor, watermarkColor, watermarkIcon }) {
    const { glow, watermark } = metricCardTokens;

    const watermarkNode =
        isValidElement(watermarkIcon) &&
        cloneElement(watermarkIcon, {
            size: watermark.sizePx,
            strokeWidth: watermark.strokeWidth,
            "aria-hidden": true,
            focusable: false,
        });

    return (
        <>
            {/* Glow */}
            <Box
                aria-hidden
                sx={{
                    position: "absolute",
                    right: glow.offsetRightPx,
                    bottom: glow.offsetBottomPx,
                    width: glow.sizePx,
                    height: glow.sizePx,
                    borderRadius: "50%",
                    pointerEvents: "none",
                    backgroundColor: glowColor,
                    filter: `blur(${glow.blurPx}px)`,
                    opacity: glow.restOpacity,
                    transform: `scale(${glow.restScale})`,
                    transformOrigin: "center",
                    transition: `opacity ${metricCardTokens.motion.durationSlow} ${metricCardTokens.motion.ease}, transform ${metricCardTokens.motion.durationSlow} ${metricCardTokens.motion.ease}`,
                    willChange: "opacity, transform",
                    ".MetricCard-root:hover &, .MetricCard-root:focus-visible &": {
                        opacity: glow.hoverOpacity,
                        transform: `scale(${glow.hoverScale})`,
                    },
                }}
            />

            {/* Watermark */}
            {watermarkNode && (
                <Box
                    aria-hidden
                    sx={{
                        position: "absolute",
                        right: watermark.offsetRightPx,
                        bottom: watermark.offsetBottomPx,
                        pointerEvents: "none",
                        color: alpha(watermarkColor, 1),
                        opacity: watermark.restOpacity,
                        transform: "rotate(0deg) scale(1)",
                        transformOrigin: "center",
                        transition: `opacity ${metricCardTokens.motion.durationSlow} ${metricCardTokens.motion.ease}, transform ${metricCardTokens.motion.durationSlow} ${metricCardTokens.motion.ease}`,
                        lineHeight: 0,
                        ".MetricCard-root:hover &, .MetricCard-root:focus-visible &": {
                            opacity: watermark.hoverOpacity,
                            transform: `rotate(${watermark.hoverRotateDeg}deg) scale(${watermark.hoverScale})`,
                        },
                        "@media (prefers-reduced-motion: reduce)": {
                            ".MetricCard-root:hover &, .MetricCard-root:focus-visible &": {
                                transform: "none",
                            },
                        },
                    }}
                >
                    {watermarkNode}
                </Box>
            )}
        </>
    );
}
