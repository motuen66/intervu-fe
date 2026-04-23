import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { BarChart as BarChartIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import BaseCard from "../../../../common/components/cards/BaseCard";
import TextButton from "../../../../common/components/buttons/TextButton";
import SectionHeading from "../../../../common/components/SectionHeading";
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
            <Box sx={{ mb: DASHBOARD_LAYOUT.cardHeaderMarginBottom }}>
                <SectionHeading
                    title="Common Services"
                    size="sm"
                    icon={<BarChartIcon sx={{ color: "primary.main", fontSize: 20 }} />}
                    action={
                        <TextButton size="sm" onClick={() => navigate(COACH_SERVICES_ROUTE)}>
                            Manage
                        </TextButton>
                    }
                    disableGutters
                />
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
