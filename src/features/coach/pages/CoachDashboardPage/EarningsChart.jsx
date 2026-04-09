import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme, alpha } from "@mui/material/styles";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Equalizer } from "@mui/icons-material";
import BaseCard from "../../../../common/components/cards/BaseCard";
import { DASHBOARD_LAYOUT } from "./dashboardTokens";

export default function EarningsChart({ data, growthPercent }) {
    const theme = useTheme();
    const successColor = theme.palette.success.main;

    return (
        <BaseCard sx={{ p: DASHBOARD_LAYOUT.cardPadding }}>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: DASHBOARD_LAYOUT.cardHeaderMarginBottom,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Equalizer sx={{ color: "success.main", fontSize: 20 }} />
                    <Typography variant="h6" fontWeight={700}>
                        Earnings Trend
                    </Typography>
                </Box>

                {growthPercent !== undefined && growthPercent !== 0 && (
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            color: "success.main",
                        }}
                    >
                        <TrendingUp sx={{ fontSize: 16 }} />
                        <Typography variant="body2" fontWeight={600} color="success.main">
                            +{growthPercent}% from last week
                        </Typography>
                    </Box>
                )}
            </Box>

            <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data || []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                        <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={successColor} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={successColor} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis
                        dataKey="day"
                        tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                        axisLine={{ stroke: theme.palette.divider }}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 8,
                            boxShadow: theme.shadows[2],
                        }}
                        formatter={(value) => [`$${value}`, "Earnings"]}
                    />
                    <Area
                        type="monotone"
                        dataKey="amount"
                        stroke={successColor}
                        strokeWidth={2.5}
                        fill="url(#earningsGradient)"
                        dot={false}
                        activeDot={{
                            r: 5,
                            stroke: successColor,
                            strokeWidth: 2,
                            fill: theme.palette.background.paper,
                        }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </BaseCard>
    );
}
