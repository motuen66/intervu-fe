import React, { useState, useEffect, useMemo } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { adminEndPoints } from "../../services/adminApi";
import SystemOverviewRow from "./SystemOverviewRow";
import GrowthCharts, { buildRevenueSeriesFromTransactions } from "./GrowthCharts";
import NeedsAttentionTable from "./NeedsAttentionTable";
import TopCoachesLeaderboard from "./TopCoachesLeaderboard";
import BaseCard from "../../../../common/components/cards/BaseCard";
import SectionHeading from "../../../../common/components/SectionHeading";
import SecondaryButton from "../../../../common/components/buttons/SecondaryButton";
import FormTextField from "../../../../common/components/form/FormTextField";
import { RefreshCw } from "lucide-react";

const TIMEFRAME_OPTIONS = [
    { value: "24h", label: "Last 24 Hours" },
    { value: "7d", label: "Last 7 Days" },
    { value: "30d", label: "Last 30 Days" },
];

export default function AdminDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState("7d");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const [stats, setStats] = useState(null);
    const [charts, setCharts] = useState(null);
    const [platformTransactions, setPlatformTransactions] = useState([]);
    const [commissionRate, setCommissionRate] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [attentionQueue, setAttentionQueue] = useState([]);
    const customRangeActive = Boolean(fromDate || toDate);

    const parseDateSafe = (value) => {
        if (!value) return null;
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : d;
    };

    const toRangeBounds = () => {
        const now = new Date();
        if (customRangeActive) {
            const start = fromDate ? parseDateSafe(fromDate) : null;
            const end = toDate ? parseDateSafe(toDate) : null;
            if (start) start.setSeconds(0, 0);
            if (end) end.setSeconds(59, 999);
            return { start, end };
        }

        if (timeframe === "24h") {
            return { start: new Date(now.getTime() - 24 * 60 * 60 * 1000), end: now };
        }
        const days = timeframe === "30d" ? 30 : 7;
        const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        return { start, end: now };
    };

    const isInRange = (dateValue) => {
        const d = parseDateSafe(dateValue);
        if (!d) return false;
        const { start, end } = toRangeBounds();
        if (start && d < start) return false;
        if (end && d > end) return false;
        return true;
    };

    const buildFilterParams = () => {
        const params = new URLSearchParams();
        if (customRangeActive) {
            if (fromDate) params.set("from", new Date(fromDate).toISOString());
            if (toDate) params.set("to", new Date(toDate).toISOString());
        } else {
            params.set("timeframe", timeframe);
        }
        return params;
    };

    useEffect(() => {
        setLoading(true);
        setStats(null);
        setCharts(null);
        setLeaderboard([]);
        setAttentionQueue([]);
        setPlatformTransactions([]);
        const fetchTransactionsByType = async (type) => {
            const all = [];
            let currentPage = 1;
            let totalItems = Number.POSITIVE_INFINITY;
            const pageSize = 100;

            while (all.length < totalItems) {
                const params = new URLSearchParams();
                params.set("page", String(currentPage));
                params.set("pageSize", String(pageSize));
                params.set("type", type);
                params.set("status", "Paid");
                const filterParams = buildFilterParams();
                filterParams.forEach((value, key) => params.set(key, value));

                const response = await callApi({
                    method: METHOD.GET,
                    endpoint: `${adminEndPoints.GET_TRANSACTIONS}?${params.toString()}`,
                    useGlobalLoading: false,
                });

                if (!response?.success) break;
                const items = response.data?.items || [];
                if (!items.length) break;

                all.push(...items);
                totalItems = Number(response.data?.totalItems) || all.length;
                currentPage += 1;
            }

            return all;
        };

        const fetchPlatformTransactions = async () => {
            const [payments, payouts, refunds] = await Promise.all([
                fetchTransactionsByType("Payment"),
                fetchTransactionsByType("Payout"),
                fetchTransactionsByType("Refund"),
            ]);
            return [...payments, ...payouts, ...refunds];
        };

        const fetchData = async () => {
            try {
                const filter = buildFilterParams().toString();
                const withFilter = (endpoint) => (filter ? `${endpoint}?${filter}` : endpoint);
                const withCountAndFilter = () => {
                    const params = buildFilterParams();
                    params.set("count", "3");
                    return `${adminEndPoints.GET_TOP_COACHES}?${params.toString()}`;
                };
                const [statsRes, chartsRes, leaderboardRes, queueRes, platformTxRes, commissionRes] = await Promise.allSettled([
                    callApi({ method: METHOD.GET, endpoint: withFilter(adminEndPoints.GET_DASHBOARD_STATS) }),
                    callApi({ method: METHOD.GET, endpoint: withFilter(adminEndPoints.GET_DASHBOARD_CHARTS) }),
                    callApi({ method: METHOD.GET, endpoint: withCountAndFilter() }),
                    callApi({ method: METHOD.GET, endpoint: withFilter(adminEndPoints.GET_ATTENTION_QUEUE) }),
                    fetchPlatformTransactions(),
                    callApi({ method: METHOD.GET, endpoint: adminEndPoints.GET_COMMISSION_RATE }),
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

                if (platformTxRes.status === "fulfilled") {
                    setPlatformTransactions(Array.isArray(platformTxRes.value) ? platformTxRes.value : []);
                }

                if (commissionRes.status === "fulfilled" && commissionRes.value?.success) {
                    const rate = Number(commissionRes.value.data?.commissionRate);
                    setCommissionRate(Number.isFinite(rate) ? rate : null);
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [timeframe, fromDate, toDate, refreshKey]);

    const filteredStats = useMemo(() => {
        const base = stats || {};
        const tx = Array.isArray(platformTransactions) ? platformTransactions : [];
        const normalizeType = (t) => String(t || "").toLowerCase();
        const normalizeStatus = (s) => String(s || "").toLowerCase();
        const amountOf = (v) => {
            const n = Number(String(v ?? "").replace(/,/g, "").trim());
            return Number.isFinite(n) ? Math.abs(n) : 0;
        };

        const paidPayments = tx.filter((item) => {
            const txDate = item?.createdAt || item?.createdOn || item?.createdDate || item?.transactionDate || item?.date;
            return (
                normalizeType(item?.type) === "payment" &&
                ["paid", "completed", "success", "1"].includes(normalizeStatus(item?.status)) &&
                isInRange(txDate)
            );
        });
        const paidRefunds = tx.filter((item) => {
            const txDate = item?.createdAt || item?.createdOn || item?.createdDate || item?.transactionDate || item?.date;
            return (
                normalizeType(item?.type) === "refund" &&
                ["paid", "completed", "success", "1"].includes(normalizeStatus(item?.status)) &&
                isInRange(txDate)
            );
        });

        const revenueSeries = buildRevenueSeriesFromTransactions(
            platformTransactions,
            timeframe,
            commissionRate,
            fromDate,
            toDate,
        );
        const paymentSum = revenueSeries.reduce((sum, item) => sum + Number(item?.value || 0), 0);
        const refundRate = paidPayments.length ? (paidRefunds.length / paidPayments.length) * 100 : 0;

        return {
            ...base,
            totalRevenue: paymentSum,
            refundRate: Number(refundRate.toFixed(1)),
        };
    }, [stats, platformTransactions, timeframe, fromDate, toDate, commissionRate, customRangeActive]);

    return (
        <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                    Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    Welcome back! Here's what's happening on the platform today.
                </Typography>
                <BaseCard sx={{ p: 2.5 }}>
                    <Stack direction="row" spacing={0.75} sx={{ mb: 2, alignItems: "center" }}>
                        <SectionHeading title="Filters" size="sm" disableGutters />
                        {customRangeActive && (
                            <Chip
                                label="Custom range"
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ height: 20, fontSize: "0.68rem" }}
                            />
                        )}
                    </Stack>
                    <Grid container spacing={2} alignItems="flex-end">
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                            <FormControl size="small" fullWidth disabled={customRangeActive}>
                                <InputLabel>Timeframe</InputLabel>
                                <Select
                                    value={timeframe}
                                    label="Timeframe"
                                    onChange={(e) => setTimeframe(e.target.value)}
                                >
                                    {TIMEFRAME_OPTIONS.map((opt) => (
                                        <MenuItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                            <FormTextField
                                size="small"
                                fullWidth
                                label="From"
                                type="datetime-local"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                            <FormTextField
                                size="small"
                                fullWidth
                                label="To"
                                type="datetime-local"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 12, lg: 3 }}>
                            <Stack direction="row" spacing={1} sx={{ justifyContent: { xs: "flex-start", lg: "flex-end" } }}>
                                {customRangeActive && (
                                    <SecondaryButton onClick={() => { setFromDate(""); setToDate(""); }} size="sm">
                                        Clear
                                    </SecondaryButton>
                                )}
                                <SecondaryButton
                                    onClick={() => setRefreshKey((v) => v + 1)}
                                    disabled={loading}
                                    startIcon={<RefreshCw size={14} />}
                                    size="sm"
                                >
                                    Refresh
                                </SecondaryButton>
                            </Stack>
                        </Grid>
                    </Grid>
                </BaseCard>
            </Box>

            <SystemOverviewRow stats={filteredStats} loading={loading} />

            <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12 }} sx={{ mt: { xs: 1, md: 2 } }}>
                    <GrowthCharts
                        data={charts}
                        platformTransactions={platformTransactions}
                        commissionRate={commissionRate}
                        timeframe={timeframe}
                        fromDate={fromDate}
                        toDate={toDate}
                        loading={loading}
                    />
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
