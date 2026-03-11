import { CardContent, Typography, Box } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import BaseCard from "../../../common/components/cards/BaseCard";

export default function StatsCard({ title, value, icon: Icon, color = "primary.main", trend }) {
    return (
        <BaseCard
            sx={(theme) => {
                const resolved = color?.includes?.(".") ? theme.palette?.[color.split(".")[0]]?.[color.split(".")[1]] : color;
                const main = resolved || theme.palette.primary.main;
                return {
                    background: "rgba(255,255,255,0.95)",
                    backdropFilter: "blur(10px)",
                    border: `1px solid ${main}40`,
                    borderRadius: "12px",
                    boxShadow: `0 2px 12px rgba(0,0,0,0.08), 0 0 20px ${main}10`,
                    transition: "all 0.3s ease",
                    "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: `0 4px 20px rgba(0,0,0,0.12), 0 0 30px ${main}20`,
                    },
                };
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {title}
                    </Typography>
                    <Box sx={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: (theme) => {
                            const resolved = color?.includes?.(".")
                                ? theme.palette?.[color.split(".")[0]]?.[color.split(".")[1]]
                                : color;
                            const main = resolved || theme.palette.primary.main;
                            return `${main}20`;
                        },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {Icon && (
                            <Icon
                                sx={{
                                    color: (theme) => {
                                        const resolved = color?.includes?.(".")
                                            ? theme.palette?.[color.split(".")[0]]?.[color.split(".")[1]]
                                            : color;
                                        return resolved || theme.palette.primary.main;
                                    },
                                    fontSize: "20px",
                                }}
                            />
                        )}
                    </Box>
                </Box>

                <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700, mb: 0.5 }}>
                    {value?.toLocaleString() || 0}
                </Typography>

                {trend && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TrendingUpIcon sx={{ color: "success.main", fontSize: "16px" }} />
                        <Typography variant="caption" sx={{ color: "success.main", fontSize: "12px" }}>
                            {trend}
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </BaseCard>
    );
}
