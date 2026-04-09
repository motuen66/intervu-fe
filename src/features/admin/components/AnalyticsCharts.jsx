import React from "react";
import { Box, Paper, Typography, Grid } from "@mui/material";
import useAdminAnalytics from "../hooks/useAdminAnalytics";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    Legend,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
} from "recharts";

// System Colors from theme.jsx
const THEME_COLORS = {
    primary: "#0F172A", // Navy
    secondary: "#D9F99D", // Electric Lime
    info: "#0EA5E9", // Blue
    success: "#22C55E", // Green
    warning: "#EAB308", // Yellow
    error: "#EF4444", // Red
};

function Section({ title, subtitle, children }) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                height: "100%",
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
            }}
        >
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="caption" color="text.secondary">
                        {subtitle}
                    </Typography>
                )}
            </Box>
            <Box sx={{ height: 260 }}>{children}</Box>
        </Paper>
    );
}

export default function AnalyticsCharts() {
    const { data, loading } = useAdminAnalytics();

    if (loading || !data) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
                <Typography variant="body2" color="text.secondary">
                    Ứng dụng đang tải dữ liệu báo cáo...
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
                {/* 1. Revenue Trends (Area Chart) */}
                <Grid item xs={12} md={8}>
                    <Section title="Revenue Trends" subtitle="Daily transaction volume (USD)">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={THEME_COLORS.info} stopOpacity={0.1} />
                                        <stop offset="95%" stopColor={THEME_COLORS.info} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: "#64748B" }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: "#64748B" }}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <RechartsTooltip
                                    contentStyle={{
                                        borderRadius: "8px",
                                        border: "none",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke={THEME_COLORS.info}
                                    fillOpacity={1}
                                    fill="url(#colorRev)"
                                    strokeWidth={3}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Section>
                </Grid>

                {/* 2. User Distribution (Pie Chart) */}
                <Grid item xs={12} md={4}>
                    <Section title="User Distribution" subtitle="Account type breakdown">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.userDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.userDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </Section>
                </Grid>

                {/* 3. Platform Growth (Bar Chart) */}
                <Grid item xs={12}>
                    <Section title="Platform Activity" subtitle="New rooms vs Question bank additions">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.activityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: "#64748B" }}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748B" }} />
                                <RechartsTooltip
                                    cursor={{ fill: "#F1F5F9" }}
                                    contentStyle={{
                                        borderRadius: "8px",
                                        border: "none",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                    }}
                                />
                                <Legend verticalAlign="top" align="right" />
                                <Bar
                                    dataKey="rooms"
                                    name="Interview Rooms"
                                    fill={THEME_COLORS.secondary}
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    dataKey="questions"
                                    name="New Questions"
                                    fill={THEME_COLORS.primary}
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </Section>
                </Grid>
            </Grid>
        </Box>
    );
}
