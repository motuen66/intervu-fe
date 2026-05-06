import Grid from "@mui/material/Grid";
import { Undo2, UserCircle2, Users, TrendingUp } from "lucide-react";
import { MetricCard, MetricCardSkeleton, buildMetricTrend } from "../../../../common/components/cards/MetricCard";
import { formatCurrency } from "../../../../common/utils/dateFormatter";

export default function SystemOverviewRow({ stats, loading }) {
    if (loading && !stats) {
        return (
            <Grid container spacing={3}>
                {[1, 2, 3, 4].map((i) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                        <MetricCardSkeleton />
                    </Grid>
                ))}
            </Grid>
        );
    }

    const cards = [
        {
            icon: <Users />,
            variant: "navy",
            label: "Total Users",
            value: stats?.totalUsers?.toLocaleString() || "0",
            growthPercent: stats?.totalUsersGrowth,
        },
        {
            icon: <UserCircle2 />,
            variant: "blue",
            label: "Active Users (30D)",
            value: stats?.activeUsers30D?.toLocaleString() || "0",
            growthPercent: stats?.activeUsersGrowth,
        },
        {
            icon: <TrendingUp />,
            variant: "emerald",
            label: "Total Net Revenue",
            value: formatCurrency(stats?.totalRevenue ?? 0),
            growthPercent: stats?.revenueGrowth,
        },
        {
            icon: <Undo2 />,
            variant: "rose",
            label: "Refund Rate",
            value: `${stats?.refundRate || "0"}%`,
            growthPercent: stats?.refundRateGrowth,
            preferLower: true,
        },
    ];

    return (
        <Grid container spacing={3}>
            {cards.map(({ growthPercent, preferLower, ...card }) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.label}>
                    <MetricCard
                        {...card}
                        trend={buildMetricTrend({ delta: growthPercent, preferLower })}
                    />
                </Grid>
            ))}
        </Grid>
    );
}
