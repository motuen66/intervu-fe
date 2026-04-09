import Grid from "@mui/material/Grid";
import KpiCard from "./KpiCard";
import { AttachMoney, Groups, Star, CheckCircle } from "@mui/icons-material";
import { DASHBOARD_LAYOUT } from "./dashboardTokens";

export default function KpiCardsRow({ stats }) {
    if (!stats) return null;

    const cards = [
        {
            icon: <AttachMoney />,
            iconColor: "success",
            label: "Total Earnings",
            value: `$${stats.totalEarnings?.toLocaleString() ?? 0}`,
            growthPercent: stats.earningsGrowthPercent,
        },
        {
            icon: <Groups />,
            iconColor: "info",
            label: "Interviews Completed",
            value: stats.interviewsCompleted ?? 0,
            growthPercent: stats.interviewsGrowthPercent,
        },
        {
            icon: <Star />,
            iconColor: "warning",
            label: "Average Rating",
            value: stats.averageRating ?? 0,
            growthPercent: 0,
        },
        {
            icon: <CheckCircle />,
            iconColor: "success",
            label: "Acceptance Rate",
            value: `${stats.acceptanceRate ?? 0}%`,
            growthPercent: stats.acceptanceRateGrowthPercent,
        },
    ];

    return (
        <Grid container spacing={DASHBOARD_LAYOUT.panelGap}>
            {cards.map((card) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.label}>
                    <KpiCard {...card} />
                </Grid>
            ))}
        </Grid>
    );
}
