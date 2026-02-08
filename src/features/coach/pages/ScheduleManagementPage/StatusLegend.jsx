import React from 'react';
import { Box, Typography, Stack } from '@mui/material';

const StatusLegend = () => {
    const items = [
        { label: 'Available', color: '#6366f1', desc: 'Open for booking' },
        { label: 'Booked', color: '#10b981', desc: 'Candidate confirmed' },
        { label: 'Reserved', color: '#f59e0b', desc: 'Hold for interview' },
        { label: 'Past Slot', color: '#94a3b8', desc: 'Historical slot', opacity: 0.6 },
    ];

    return (
        <Stack spacing={2}>
            {items.map((item) => (
                <Stack key={item.label} direction="row" spacing={1.5} alignItems="flex-start">
                    <Box
                        sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: item.color,
                            mt: '4px',
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
        </Stack>
    );
};

export default StatusLegend;
