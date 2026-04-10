import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { adminEndPoints } from "../../services/adminApi";
import SystemOverviewRow from "./SystemOverviewRow";
import GrowthCharts from "./GrowthCharts";
import NeedsAttentionTable from "./NeedsAttentionTable";
import TopCoachesLeaderboard from "./TopCoachesLeaderboard";

export default function AdminDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [charts, setCharts] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [attentionQueue, setAttentionQueue] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, chartsRes, leaderboardRes, queueRes] = await Promise.allSettled([
                    callApi({ method: METHOD.GET, endpoint: adminEndPoints.GET_DASHBOARD_STATS }),
                    callApi({ method: METHOD.GET, endpoint: adminEndPoints.GET_DASHBOARD_CHARTS }),
                    callApi({ method: METHOD.GET, endpoint: `${adminEndPoints.GET_TOP_COACHES}?count=3` }),
                    callApi({ method: METHOD.GET, endpoint: adminEndPoints.GET_ATTENTION_QUEUE }),
                ]);

                if (statsRes.status === "fulfilled" && statsRes.value?.success) {
                    setStats(statsRes.value.data);
                }

                if (chartsRes.status === "fulfilled" && chartsRes.value?.success) {
                    setCharts(chartsRes.value.data);
                }

                if (leaderboardRes.status === "fulfilled" && leaderboardRes.value?.success) {
                    setLeaderboard(
                        Array.isArray(leaderboardRes.value.data) ? leaderboardRes.value.data.slice(0, 3) : [],
                    );
                }

                if (queueRes.status === "fulfilled" && queueRes.value?.success) {
                    setAttentionQueue(Array.isArray(queueRes.value.data) ? queueRes.value.data : []);
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Admin Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Welcome back! Here's what's happening on the platform today.
                </Typography>
            </Box>

            <SystemOverviewRow stats={stats} loading={loading} />

            <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12 }}>
                    <GrowthCharts data={charts} loading={loading} />
                </Grid>

                <Grid size={{ xs: 12, lg: 4 }}>
                    <TopCoachesLeaderboard data={leaderboard} loading={loading} />
                </Grid>

                <Grid size={{ xs: 12, lg: 8 }}>
                    <NeedsAttentionTable data={attentionQueue} loading={loading} />
                </Grid>
            </Grid>
        </Box>
    );
}
