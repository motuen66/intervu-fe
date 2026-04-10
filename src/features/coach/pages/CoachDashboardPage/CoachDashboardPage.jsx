import { useState, useEffect, useCallback } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import DashboardHeader from "./DashboardHeader";
import KpiCardsRow from "./KpiCardsRow";
import EarningsChart from "./EarningsChart";
import UpcomingSessionsList from "./UpcomingSessionsList";
import PendingRequestsList from "./PendingRequestsList";
import AvailabilityWidget from "./AvailabilityWidget";
import ServiceDistributionChart from "./ServiceDistributionChart";
import FeedbackWall from "./FeedbackWall";
import { DASHBOARD_LAYOUT } from "./dashboardTokens";
import {
    getCoachDashboardStats,
    getCoachUpcomingSessions,
    getCoachPendingRequests,
    getCoachServiceDistribution,
    getCoachFeedbackWall,
    getCoachAvailability,
} from "../../services/coachDashboardApi";

function CardSkeleton({ height = 200 }) {
    return <Skeleton variant="rounded" height={height} sx={{ borderRadius: 4 }} />;
}

export default function CoachDashboardPage() {
    const [period, setPeriod] = useState("month");
    const [stats, setStats] = useState(null);
    const [sessions, setSessions] = useState(null);
    const [requests, setRequests] = useState(null);
    const [services, setServices] = useState(null);
    const [feedbacks, setFeedbacks] = useState(null);
    const [availability, setAvailability] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async (p) => {
        setLoading(true);
        try {
            const [statsRes, sessionsRes, requestsRes, servicesRes, feedbacksRes, availRes] = await Promise.all([
                getCoachDashboardStats(p),
                getCoachUpcomingSessions(),
                getCoachPendingRequests(),
                getCoachServiceDistribution(),
                getCoachFeedbackWall(),
                getCoachAvailability(),
            ]);
            setStats(statsRes);
            setSessions(sessionsRes);
            setRequests(requestsRes);
            setServices(servicesRes);
            setFeedbacks(feedbacksRes);
            setAvailability(availRes);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll(period);
    }, [period, fetchAll]);

    const handleRequestResponded = (requestId) => {
        setRequests((prev) => prev?.filter((r) => r.bookingRequestId !== requestId));
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "transparent", minHeight: "100vh" }}>
            <DashboardHeader period={period} onPeriodChange={setPeriod} />

            <Box sx={{ mt: DASHBOARD_LAYOUT.kpiSectionMarginTop }}>
                {loading ? (
                    <Grid container spacing={DASHBOARD_LAYOUT.panelGap}>
                        {[...Array(4)].map((_, i) => (
                            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                                <CardSkeleton height={130} />
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <KpiCardsRow stats={stats} />
                )}
            </Box>

            <Grid container spacing={DASHBOARD_LAYOUT.panelGap} sx={{ mt: DASHBOARD_LAYOUT.contentGridMarginTop }}>
                {/* Left column — 8/12 */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: DASHBOARD_LAYOUT.panelGap }}>
                        {loading ? (
                            <CardSkeleton height={340} />
                        ) : (
                            <EarningsChart data={stats?.earningsTrend} growthPercent={stats?.earningsGrowthPercent} />
                        )}

                        {loading ? <CardSkeleton height={260} /> : <UpcomingSessionsList sessions={sessions} />}

                        {/* {loading ? (
                            <CardSkeleton height={300} />
                        ) : (
                            <PendingRequestsList
                                requests={requests}
                                onResponded={handleRequestResponded}
                            />
                        )} */}
                    </Box>
                </Grid>

                {/* Right column — 4/12 */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: DASHBOARD_LAYOUT.panelGap }}>
                        {loading ? <CardSkeleton height={220} /> : <AvailabilityWidget availability={availability} />}

                        {loading ? <CardSkeleton height={300} /> : <ServiceDistributionChart services={services} />}

                        {loading ? <CardSkeleton height={350} /> : <FeedbackWall feedbacks={feedbacks} />}
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}
