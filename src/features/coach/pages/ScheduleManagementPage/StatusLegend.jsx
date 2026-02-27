import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import { Label } from "@mui/icons-material";

const STATUS_ITEMS = [
    { label: "Available", color: "#6366f1", desc: "Open for booking" },
    { label: "Booked", color: "#10b981", desc: "Candidate confirmed" },
    { label: "Reserved", color: "#f59e0b", desc: "Hold for interview" },
    { label: "Past Slot", color: "#94a3b8", desc: "Historical slot", opacity: 0.6 },
];

const StatusLegend = ({ compact = false, items = STATUS_ITEMS }) => {
    if (compact) {
        return (
            <Stack
                direction="row"
                flexWrap="wrap"
                gap={1}
                sx={{
                    px: 1.5,
                    py: 0.75,
                    bgcolor: "var(--mui-palette-background-paper)",
                    borderRadius: "8px",
                    border: "1px solid var(--mui-palette-divider)",
                }}
            >
                {items.map((item) => (
                    <Stack key={item.label} direction="row" spacing={0.6} alignItems="center">
                        <Box
                            sx={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                bgcolor: item.color,
                                opacity: item.opacity || 1,
                                flexShrink: 0,
                            }}
                        />
                        <Typography
                            variant="caption"
                            fontWeight={600}
                            color="text.primary"
                            sx={{ fontSize: "0.72rem", lineHeight: 1 }}
                        >
                            {item.label}
                        </Typography>
                    </Stack>
                ))}
            </Stack>
        );
    }

    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px 8px",
            }}
        >
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
        </Box>
    );
};

export default StatusLegend;
