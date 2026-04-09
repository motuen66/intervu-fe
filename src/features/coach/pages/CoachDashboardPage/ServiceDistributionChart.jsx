import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { BarChart as BarChartIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import BaseCard from "../../../../common/components/cards/BaseCard";
import {
    COACH_SERVICES_ROUTE,
    DASHBOARD_LAYOUT,
    getServiceColorByName,
} from "./dashboardTokens";

export default function ServiceDistributionChart({ services }) {
    const theme = useTheme();
    const navigate = useNavigate();

    const rankedServices = [...(services || [])]
        .sort((a, b) => (b.count || 0) - (a.count || 0))
        .slice(0, DASHBOARD_LAYOUT.panelItemLimit);

    const chartData = rankedServices.map((s, i) => ({
        name: s.serviceName,
        value: s.count,
        color: getServiceColorByName(theme, s.serviceName, i),
    }));

    return (
        <BaseCard sx={{ p: DASHBOARD_LAYOUT.cardPadding }}>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    rowGap: 0.75,
                    mb: DASHBOARD_LAYOUT.cardHeaderMarginBottom,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                    <BarChartIcon sx={{ color: "primary.main", fontSize: 20 }} />
                    <Typography variant="h6" fontWeight={700}>
                        Common Services
                    </Typography>
                </Box>

                <Button
                    size="small"
                    onClick={() => navigate(COACH_SERVICES_ROUTE)}
                    sx={{
                        textTransform: "none",
                        minWidth: "auto",
                        px: "10%",
                        py: 0.35,
                        borderRadius: 1.5,
                        bgcolor: "action.hover",
                        "&:hover": { bgcolor: "action.selected" },
                        fontWeight: 600,
                        fontSize: "0.8125rem",
                        flexShrink: 0,
                    }}
                >
                    Manage
                </Button>
            </Box>

            {!chartData.length ? (
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ py: DASHBOARD_LAYOUT.emptyStatePaddingY, textAlign: "center" }}
                >
                    No data available
                </Typography>
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                dataKey="value"
                                strokeWidth={2}
                                stroke={theme.palette.background.paper}
                            >
                                {chartData.map((entry, idx) => (
                                    <Cell key={idx} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 1,
                            mt: 1.5,
                        }}
                    >
                        {chartData.map((entry) => (
                            <Box key={entry.name} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Box
                                    sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        bgcolor: entry.color,
                                        flexShrink: 0,
                                    }}
                                />
                                <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap>
                                    {entry.name}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </>
            )}
        </BaseCard>
    );
}
