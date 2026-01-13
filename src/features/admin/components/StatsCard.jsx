import { Card, CardContent, Typography, Box } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

export default function StatsCard({ title, value, icon: Icon, color = '#7B61FF', trend }) {
    return (
        <Card 
            sx={{ 
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${color}40`,
                borderRadius: '12px',
                boxShadow: `0 2px 12px rgba(0,0,0,0.08), 0 0 20px ${color}10`,
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 4px 20px rgba(0,0,0,0.12), 0 0 30px ${color}20`,
                }
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.6)', fontSize: '13px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {title}
                    </Typography>
                    <Box sx={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '10px', 
                        background: `${color}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {Icon && <Icon sx={{ color: color, fontSize: '20px' }} />}
                    </Box>
                </Box>
                
                <Typography variant="h4" sx={{ color: '#1a1a2e', fontWeight: 700, mb: 0.5 }}>
                    {value?.toLocaleString() || 0}
                </Typography>
                
                {trend && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TrendingUpIcon sx={{ color: '#4ade80', fontSize: '16px' }} />
                        <Typography variant="caption" sx={{ color: '#4ade80', fontSize: '12px' }}>
                            {trend}
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}
