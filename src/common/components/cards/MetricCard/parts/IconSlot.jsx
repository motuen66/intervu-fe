import Box from "@mui/material/Box";
import { cloneElement, isValidElement } from "react";
import { metricCardTokens } from "../tokens";

// Dark navy tile with a lime line-icon. The icon's color and stroke are forced
// here so consumers can pass any Lucide icon without needing to know the
// design contract.
export default function IconSlot({ icon }) {
    const sized =
        isValidElement(icon) &&
        cloneElement(icon, {
            size: 22,
            strokeWidth: 1.75,
            "aria-hidden": true,
            focusable: false,
        });

    return (
        <Box
            sx={{
                width: metricCardTokens.spacing.iconBoxPx,
                height: metricCardTokens.spacing.iconBoxPx,
                borderRadius: metricCardTokens.radius.icon,
                bgcolor: "primary.main",
                color: "secondary.main",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                position: "relative",
                zIndex: 1,
            }}
        >
            {sized}
        </Box>
    );
}
