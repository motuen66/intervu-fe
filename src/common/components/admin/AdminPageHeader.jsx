import { Box, Typography } from '@mui/material';

export default function AdminPageHeader({ title, subtitle, actionButton }) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '20px', mb: 0.5 }}>
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="body2" sx={{ color: '#64748B', fontSize: '13px' }}>
                        {subtitle}
                    </Typography>
                )}
            </Box>
            {actionButton && (
                <Box>
                    {actionButton}
                </Box>
            )}
        </Box>
    );
}
