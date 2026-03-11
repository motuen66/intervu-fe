import React from "react";
import { Box, Typography, Stack, useTheme } from "@mui/material";

const StatusLegend = () => {
    const theme = useTheme();

    const items = [
        { label: "Available", color: theme.palette.secondary.main, desc: "Open for booking" },
        { label: "Unavailable", color: "#F43F5E", desc: "Not available" },
        { label: "Past Slot", color: "#D1D5DB", desc: "Historical slot", opacity: 0.7 },
    ];

    return (
        <Stack spacing={2}>
            {items.map((item) => (
                <Stack key={item.label} direction="row" spacing={1.5} alignItems="flex-start">
                    <Box
                        sx={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            bgcolor: item.color,
                            mt: "4px",
                            opacity: item.opacity || 1,
                            flexShrink: 0,
                            boxShadow: `0 0 6px 1px ${item.color}40`,
                        }}
                    />
                    <Box>
                        <Typography variant="caption" fontWeight={600} color="text.primary" lineHeight={1}>
                            {item.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                            {item.desc}
                        </Typography>
                    </Box>
                </Stack>
            ))}
        </Stack>
    );
};

export default StatusLegend;
