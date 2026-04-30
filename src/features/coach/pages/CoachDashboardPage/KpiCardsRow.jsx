import Grid from "@mui/material/Grid";
import { CheckCircle2, DollarSign, Star, Users } from "lucide-react";
import { MetricCard, buildMetricTrend } from "../../../../common/components/cards/MetricCard";
import { DASHBOARD_LAYOUT } from "./dashboardTokens";

export default function KpiCardsRow({ stats }) {
    if (!stats) return null;

    const cards = [
        {
            icon: <DollarSign />,
            variant: "emerald",
            label: "Total Earnings",
            value: `$${stats.totalEarnings?.toLocaleString() ?? 0}`,
            growthPercent: stats.earningsGrowthPercent,
        },
        {
            icon: <Users />,
            variant: "blue",
            label: "Interviews Completed",
            value: stats.interviewsCompleted ?? 0,
            growthPercent: stats.interviewsGrowthPercent,
        },
        {
            icon: <Star />,
            variant: "amber",
            label: "Average Rating",
            value: stats.averageRating ?? 0,
            growthPercent: 0,
        },
        {
            icon: <CheckCircle2 />,
            variant: "emerald",
            label: "Acceptance Rate",
            value: `${stats.acceptanceRate ?? 0}%`,
            growthPercent: stats.acceptanceRateGrowthPercent,
        },
    ];

    return (
        <Grid container spacing={DASHBOARD_LAYOUT.panelGap}>
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
