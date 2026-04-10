import React from "react";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import { People, AccountCircle, TrendingUp, Undo } from "@mui/icons-material";
import KpiCard from "../../../../common/components/cards/KpiCard";

export default function SystemOverviewRow({ stats, loading }) {
    if (loading && !stats) {
        return (
            <Grid container spacing={3}>
                {[1, 2, 3, 4].map((i) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                        <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 4 }} />
                    </Grid>
                ))}
            </Grid>
        );
    }

    return (
        <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <KpiCard
                    icon={<People />}
                    iconColor="primary"
                    label="Total Users"
                    value={stats?.totalUsers?.toLocaleString() || "0"}
                    growthPercent={stats?.totalUsersGrowth}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <KpiCard
                    icon={<AccountCircle />}
                    iconColor="info"
                    label="Active Users (30D)"
                    value={stats?.activeUsers30D?.toLocaleString() || "0"}
                    growthPercent={stats?.activeUsersGrowth}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <KpiCard
                    icon={<TrendingUp />}
                    iconColor="success"
                    label="Total Revenue"
                    value={`$${stats?.totalRevenue?.toLocaleString() || "0"}`}
                    growthPercent={stats?.revenueGrowth}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <KpiCard
                    icon={<Undo />}
                    iconColor="error"
                    label="Refund Rate"
                    value={`${stats?.refundRate || "0"}%`}
                    growthPercent={stats?.refundRateGrowth}
                />
            </Grid>
        </Grid>
    );
}
