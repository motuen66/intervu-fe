import React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import BaseCard from "../../../../common/components/cards/BaseCard";
import SectionHeading from "../../../../common/components/SectionHeading";
import { useTheme } from "@mui/material/styles";

export default function GrowthCharts({ data, loading }) {
    const theme = useTheme();

    if (loading && !data) {
        return (
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4 }} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4 }} />
                </Grid>
            </Grid>
        );
    }

    return (
        <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
                <BaseCard sx={{ p: 3, height: 400 }}>
                    <Box sx={{ mb: 2 }}>
                        <SectionHeading title="Revenue Trend" size="sm" />
                    </Box>
                    <Box sx={{ height: 300, width: "100%" }}>
                        <ResponsiveContainer>
                            <AreaChart data={data?.revenue || []}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: 8,
                                        border: "none",
                                        boxShadow: theme.shadows[3],
                                        background: theme.palette.background.paper
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke={theme.palette.primary.main}
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Box>
                </BaseCard>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
                <BaseCard sx={{ p: 3, height: 400 }}>
                    <Box sx={{ mb: 2 }}>
                        <SectionHeading title="User Growth" size="sm" />
                    </Box>
                    <Box sx={{ height: 300, width: "100%" }}>
                        <ResponsiveContainer>
                            <BarChart data={data?.userGrowth || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: 8,
                                        border: "none",
                                        boxShadow: theme.shadows[3],
                                        background: theme.palette.background.paper
                                    }}
                                />
                                <Bar dataKey="candidates" stackId="a" fill={theme.palette.info.main} radius={[0, 0, 0, 0]} barSize={32} />
                                <Bar dataKey="coaches" stackId="a" fill={theme.palette.success.main} radius={[4, 4, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                </BaseCard>
            </Grid>
        </Grid>
    );
}
