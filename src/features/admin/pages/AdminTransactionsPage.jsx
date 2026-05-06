import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
    Container,
    Box,
    Typography,
    Avatar,
    Grid,
    Stack,
    Skeleton,
    ToggleButton,
    ToggleButtonGroup,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DownloadRounded } from "@mui/icons-material";
import { Receipt, Banknote, CheckCircle2, Coins } from "lucide-react";
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceLine,
} from "recharts";
import { callApi } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";
import { adminEndPoints } from "../services/adminApi";
import toast from "react-hot-toast";
import DataTable from "../../../common/components/table/DataTable";
import AdminPageHeader from "../../../common/components/admin/AdminPageHeader";
import BaseCard from "../../../common/components/cards/BaseCard";
import SectionHeading from "../../../common/components/SectionHeading";
import useTableState from "../../../hooks/useTableState";
import StatusChip from "../../../common/components/StatusChip";
import { MetricCard, buildMetricTrend } from "../../../common/components/cards/MetricCard";
import { formatCurrency } from "../../../common/utils/dateFormatter";
import "./AdminDashboard.css";
import { PrimaryButton } from "../../../common/components";

const STATUS_COLOR_MAP = {
    Paid: "success",
    PendingPayout: "info",
    Created: "warning",
    Cancel: "error",
};

const TYPE_COLOR_MAP = {
    Payment: "primary",
    Payout: "error",
    Refund: "warning",
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const ANALYTICS_PAGE_SIZE = 100;
const WINDOW_OPTIONS = [7, 30, 90];
const FLOW_BAR_SIZE = 14;
const FLOW_STAGGER_GAP = 2;
const ANALYTICS_SCOPE_OPTIONS = [
    { value: "system", label: "System" },
    { value: "tab", label: "This tab" },
];

const getInitials = (name = "") =>
    name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "?";

const parseAmount = (value) => {
    if (typeof value === "number") return value;
    const normalized = Number(
        String(value ?? "")
            .replace(/,/g, "")
            .trim(),
    );
    return Number.isFinite(normalized) ? normalized : 0;
};

const toStatusLabel = (status) => {
    if (typeof status === "number") {
        if (status === 1) return "Paid";
        if (status === 2) return "Cancel";
        if (status === 3) return "PendingPayout";
        return "Created";
    }
    if (typeof status !== "string") return "Created";
    const normalized = status.trim();
    if (!normalized) return "Created";
    const lower = normalized.toLowerCase();
    if (lower === "completed") return "Paid";
    if (lower === "pending") return "Created";
    return normalized;
};

const toTypeLabel = (type) => {
    if (typeof type === "number") {
        if (type === 1) return "Payment";
        if (type === 2) return "Payout";
        if (type === 3) return "Refund";
        return String(type);
    }
    return String(type || "Unknown");
};

const normalizeTransaction = (item) => ({
    ...item,
    orderCode: item?.orderCode || item?.transactionCode || item?.id || "-",
    type: toTypeLabel(item?.type),
    status: toStatusLabel(item?.status),
    userName: item?.userName || item?.candidateName || item?.coachName || item?.partyName || "-",
    userEmail: item?.userEmail || item?.candidateEmail || item?.coachEmail || item?.email || "",
    amount: parseAmount(item?.amount),
    createdAt: item?.createdAt || item?.createdOn || item?.createdDate || item?.transactionDate || null,
});

const getDirection = (transaction) => {
    const type = String(transaction?.type || "").toLowerCase();
    if (type === "payment") return "inbound";
    if (type === "refund" || type === "payout") return "outbound";
    return "unknown";
};

const isPaidStatus = (status) => {
    const value = String(status || "").toLowerCase();
    return value === "paid" || value === "completed" || value === "success";
};

const getDateSafe = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isReliableBusinessDate = (date) => Boolean(date) && date.getFullYear() >= 2000;

const toPercentChange = (current, previous) => {
    const currentValue = Number(current) || 0;
    const previousValue = Number(previous) || 0;

    if (currentValue === 0 && previousValue === 0) return 0;
    // Use symmetric percent difference so trend stays within [-100%, 100%]
    // and avoids misleading spikes when baseline is very small.
    const denominator = Math.max(Math.abs(currentValue), Math.abs(previousValue), 1);
    return ((currentValue - previousValue) / denominator) * 100;
};

const formatCompactNumber = (value) =>
    new Intl.NumberFormat("vi-VN", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(value || 0);

const toDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

export default function AdminTransactionsPage({ filterType, filterStatus, title, subtitle }) {
    const theme = useTheme();
    const {
        data: transactions,
        setData: setTransactions,
        loading,
        setLoading,
        page,
        pageSize,
        totalItems,
        setTotalItems,
        handlePageChange,
        handlePageSizeChange,
    } = useTableState(10);

    const [analyticsTransactions, setAnalyticsTransactions] = useState([]);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [windowDays, setWindowDays] = useState(30);
    const [analyticsScope, setAnalyticsScope] = useState("system");
    const transactionsRequestRef = useRef(0);
    const analyticsRequestRef = useRef(0);

    const getQueryString = useCallback(
        (pageValue, pageSizeValue, includeFilters = true) => {
            const params = new URLSearchParams();
            params.set("page", String(pageValue));
            params.set("pageSize", String(pageSizeValue));
            if (includeFilters) {
                if (filterType) params.set("type", filterType);
                if (filterStatus) params.set("status", filterStatus);
            }
            return params.toString();
        },
        [filterType, filterStatus],
    );

    const fetchTransactions = useCallback(async () => {
        const requestId = transactionsRequestRef.current + 1;
        transactionsRequestRef.current = requestId;
        setLoading(true);
        try {
            const response = await callApi({
                method: METHOD.GET,
                endpoint: `${adminEndPoints.GET_TRANSACTIONS}?${getQueryString(page + 1, pageSize)}`,
                useGlobalLoading: false,
            });

            if (response?.success && requestId === transactionsRequestRef.current) {
                setTransactions((response.data?.items || []).map(normalizeTransaction));
                setTotalItems(response.data?.totalItems || 0);
            }
        } catch {
            if (requestId === transactionsRequestRef.current) {
                toast.error("Error loading transactions");
            }
        } finally {
            if (requestId === transactionsRequestRef.current) {
                setLoading(false);
            }
        }
    }, [getQueryString, page, pageSize, setLoading, setTotalItems, setTransactions]);

    const fetchAnalyticsTransactions = useCallback(async () => {
        const requestId = analyticsRequestRef.current + 1;
        analyticsRequestRef.current = requestId;
        setAnalyticsLoading(true);
        setAnalyticsTransactions([]);
        try {
            const all = [];
            let currentPage = 1;
            let totalItems = Number.POSITIVE_INFINITY;

            while (all.length < totalItems) {
                const response = await callApi({
                    method: METHOD.GET,
                    endpoint: `${adminEndPoints.GET_TRANSACTIONS}?${getQueryString(
                        currentPage,
                        ANALYTICS_PAGE_SIZE,
                        analyticsScope === "tab",
                    )}`,
                    useGlobalLoading: false,
                });

                if (!response?.success) break;

                const items = (response.data?.items || []).map(normalizeTransaction);
                if (!items.length) break;

                totalItems = Number(response.data?.totalItems) || items.length;
                all.push(...items);
                currentPage += 1;
            }

            if (requestId === analyticsRequestRef.current) {
                setAnalyticsTransactions(all);
            }
        } catch {
            if (requestId === analyticsRequestRef.current) {
                setAnalyticsTransactions([]);
                toast.error("Error loading analytics data");
            }
        } finally {
            if (requestId === analyticsRequestRef.current) {
                setAnalyticsLoading(false);
            }
        }
    }, [analyticsScope, getQueryString]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    useEffect(() => {
        fetchAnalyticsTransactions();
    }, [fetchAnalyticsTransactions]);

    useEffect(() => {
        setTransactions([]);
        setTotalItems(0);
        setAnalyticsTransactions([]);
    }, [filterType, filterStatus, setTotalItems, setTransactions]);

    const analytics = useMemo(() => {
        const data = analyticsTransactions;
        const now = Date.now();
        const currentStart = now - windowDays * DAY_IN_MS;
        const previousStart = now - windowDays * 2 * DAY_IN_MS;

        const transactionCount = data.length;
        let grossInValue = 0;
        let refundOutValue = 0;
        let payoutOutValue = 0;
        let totalOutValue = 0;
        let netValue = 0;
        let paidCount = 0;
        let paidTransactionCount = 0;

        let currentCount = 0;
        let previousCount = 0;
        let currentIn = 0;
        let previousIn = 0;
        let currentOut = 0;
        let previousOut = 0;
        let currentNet = 0;
        let previousNet = 0;
        let currentPaid = 0;
        let previousPaid = 0;
        let currentPaidTransactionCount = 0;
        let previousPaidTransactionCount = 0;
        let currentPaidAbsTotal = 0;
        let previousPaidAbsTotal = 0;

        const trendMap = new Map();
        const trendKeys = Array.from({ length: windowDays }).map((_, index) => {
            const d = new Date(now - (windowDays - 1 - index) * DAY_IN_MS);
            d.setHours(0, 0, 0, 0);
            const key = toDateKey(d);
            trendMap.set(key, {
                label: d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
                inbound: 0,
                outbound: 0,
                net: 0,
            });
            return key;
        });

        data.forEach((transaction) => {
            const amount = Math.abs(transaction.amount || 0);
            const status = transaction.status || "Unknown";
            const createdAt = getDateSafe(transaction.createdAt);
            const paidStatus = isPaidStatus(status);
            const direction = getDirection(transaction);
            const txType = String(transaction?.type || "").toLowerCase();
            const isPaidInbound = paidStatus && direction === "inbound";
            const isPaidOutbound = paidStatus && direction === "outbound";
            const paidTransaction = isPaidInbound || isPaidOutbound;
            const signedImpact = isPaidInbound ? amount : isPaidOutbound ? -amount : 0;

            if (isPaidInbound) {
                grossInValue += amount;
                paidTransactionCount += 1;
            }
            if (isPaidOutbound) {
                totalOutValue += amount;
                paidTransactionCount += 1;
                if (txType === "refund") refundOutValue += amount;
                if (txType === "payout") payoutOutValue += amount;
            }
            netValue += signedImpact;
            if (isPaidStatus(status)) paidCount += 1;

            if (isReliableBusinessDate(createdAt)) {
                const time = createdAt.getTime();
                if (time >= currentStart) {
                    currentCount += 1;
                    if (isPaidInbound) {
                        currentIn += amount;
                        currentNet += amount;
                    }
                    if (isPaidOutbound) {
                        currentOut += amount;
                        currentNet -= amount;
                    }
                    if (paidTransaction && amount > 0) {
                        currentPaidTransactionCount += 1;
                        currentPaidAbsTotal += amount;
                    }
                    if (isPaidStatus(status)) currentPaid += 1;
                } else if (time >= previousStart && time < currentStart) {
                    previousCount += 1;
                    if (isPaidInbound) {
                        previousIn += amount;
                        previousNet += amount;
                    }
                    if (isPaidOutbound) {
                        previousOut += amount;
                        previousNet -= amount;
                    }
                    if (paidTransaction && amount > 0) {
                        previousPaidTransactionCount += 1;
                        previousPaidAbsTotal += amount;
                    }
                    if (isPaidStatus(status)) previousPaid += 1;
                }

                const monthData = trendMap.get(toDateKey(createdAt));
                if (monthData) {
                    if (isPaidInbound) monthData.inbound += amount;
                    if (isPaidOutbound) monthData.outbound += amount;
                    monthData.net += signedImpact;
                }
            }
        });

        const flowTrend = trendKeys.map((key) => {
            const monthData = trendMap.get(key);
            return {
                label: monthData?.label || key,
                inbound: monthData?.inbound || 0,
                // Always render outflow below zero for clearer "market-style" reading.
                outbound: -Math.abs(monthData?.outbound || 0),
                net: monthData?.net || 0,
            };
        });

        const successRate = transactionCount ? (paidCount / transactionCount) * 100 : 0;
        const currentSuccessRate = currentCount ? (currentPaid / currentCount) * 100 : 0;
        const previousSuccessRate = previousCount ? (previousPaid / previousCount) * 100 : 0;
        const averagePaidValue = paidTransactionCount ? (grossInValue + totalOutValue) / paidTransactionCount : 0;
        const currentAveragePaidValue = currentPaidTransactionCount
            ? currentPaidAbsTotal / currentPaidTransactionCount
            : 0;
        const previousAveragePaidValue = previousPaidTransactionCount
            ? previousPaidAbsTotal / previousPaidTransactionCount
            : 0;
        const countChange = toPercentChange(currentCount, previousCount);
        const grossInChange = toPercentChange(currentIn, previousIn);
        const outflowChange = toPercentChange(currentOut, previousOut);
        const netChange = toPercentChange(currentNet, previousNet);
        const successDelta = toPercentChange(currentSuccessRate, previousSuccessRate);
        const averagePaidValueDelta = toPercentChange(currentAveragePaidValue, previousAveragePaidValue);

        return {
            transactionCount,
            grossInValue,
            refundOutValue,
            payoutOutValue,
            totalOutValue,
            netValue,
            successRate,
            averagePaidValue,
            countChange,
            grossInChange,
            outflowChange,
            netChange,
            successDelta,
            averagePaidValueDelta,
            flowTrend,
        };
    }, [analyticsTransactions, windowDays]);

    const handleExportCsv = useCallback(() => {
        if (!analyticsTransactions.length) {
            toast.error("No data to export");
            return;
        }

        const rows = analyticsTransactions.map((transaction) => ({
            orderCode: transaction.orderCode || "",
            type: transaction.type || "",
            status: transaction.status || "",
            party: transaction.userName || "",
            email: transaction.userEmail || "",
            amount: transaction.amount || 0,
            createdAt: transaction.createdAt || "",
        }));

        const header = ["orderCode", "type", "status", "party", "email", "amount", "createdAt"];
        const csv = [
            header.join(","),
            ...rows.map((row) => header.map((key) => `"${String(row[key] ?? "").replace(/"/g, '""')}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const cleanTitle = String(title || "transactions")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-");
        const now = new Date();
        const dateSuffix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
            now.getDate(),
        ).padStart(2, "0")}`;
        link.href = url;
        link.setAttribute("download", `${cleanTitle}-report-${dateSuffix}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [analyticsTransactions, title]);

    const renderFlowBarShape = useCallback((props, isOutbound = false) => {
        const { x, y, width, height, fill, stroke, strokeWidth, payload } = props || {};
        if (![x, y, width, height].every(Number.isFinite) || height <= 0) {
            return null;
        }

        const inboundValue = Math.abs(Number(payload?.inbound || 0));
        const outboundValue = Math.abs(Number(payload?.outbound || 0));
        const hasBothFlows = inboundValue > 0 && outboundValue > 0;

        let drawX = x;
        let drawWidth = width;

        // Stagger only when both money-in and money-out exist on the same day.
        if (hasBothFlows) {
            const gap = Math.min(FLOW_STAGGER_GAP, Math.max(1, width * 0.2));
            drawWidth = Math.max(3, (width - gap) / 2);
            drawX = isOutbound ? x + width - drawWidth : x;
        }

        const r = Math.min(3, drawWidth / 2);
        return (
            <rect
                x={drawX}
                y={y}
                width={drawWidth}
                height={height}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                rx={r}
                ry={r}
            />
        );
    }, []);

    const inboundBarShape = useCallback((props) => renderFlowBarShape(props, false), [renderFlowBarShape]);
    const outboundBarShape = useCallback((props) => renderFlowBarShape(props, true), [renderFlowBarShape]);

    const columns = useMemo(
        () => [
            {
                field: "orderCode",
                headerName: "Order Code",
                render: (val) => (
                    <Typography
                        sx={{ fontSize: "12px", fontWeight: 600, color: "text.primary", fontFamily: "monospace" }}
                    >
                        #{val}
                    </Typography>
                ),
            },
            {
                field: "type",
                headerName: "Type",
                render: (val) => <StatusChip label={val} color={TYPE_COLOR_MAP[val] || "default"} />,
            },
            // {
            //     field: "flow",
            //     headerName: "Flow",
            //     render: (_, row) => {
            //         const direction = getDirection(row);
            //         if (direction === "inbound") {
            //             return <StatusChip label="Inbound" color="success" />;
            //         }
            //         if (direction === "outbound") {
            //             return <StatusChip label="Outbound" color="error" />;
            //         }
            //         return <StatusChip label="Unknown" color="default" />;
            //     },
            // },
            {
                field: "userName",
                headerName: "Party",
                render: (val, row) => (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar
                            sx={{
                                width: 28,
                                height: 28,
                                fontSize: 11,
                                fontWeight: 700,
                                bgcolor: "secondary.main",
                                color: "primary.main",
                            }}
                        >
                            {getInitials(val)}
                        </Avatar>
                        <Box>
                            <Typography
                                sx={{ fontSize: "13px", fontWeight: 600, color: "text.primary", lineHeight: 1.3 }}
                            >
                                {val || "-"}
                            </Typography>
                            <Typography sx={{ fontSize: "11px", color: "text.secondary" }}>
                                {row.userEmail || ""}
                            </Typography>
                        </Box>
                    </Box>
                ),
            },
            {
                field: "amount",
                headerName: "Impact",
                render: (val, row) => {
                    const direction = getDirection(row);
                    const prefix = direction === "inbound" ? "+" : direction === "outbound" ? "-" : "";
                    const tone =
                        direction === "inbound"
                            ? "success.main"
                            : direction === "outbound"
                              ? "error.main"
                              : "text.primary";
                    return (
                        <Typography sx={{ fontSize: "13px", fontWeight: 700, color: tone }}>
                            {prefix ? `${prefix} ` : ""}
                            {formatCurrency(Math.abs(val))}
                        </Typography>
                    );
                },
            },
            {
                field: "status",
                headerName: "Status",
                render: (val) => <StatusChip label={val} color={STATUS_COLOR_MAP[val] || "default"} />,
            },
            {
                field: "createdAt",
                headerName: "Date",
                render: (val) => {
                    const d = getDateSafe(val);
                    return !d
                        ? "-"
                        : d.toLocaleString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                          });
                },
            },
        ],
        [],
    );

    return (
        <Container maxWidth="xl" className="admin-page" sx={{ py: 3 }}>
            <AdminPageHeader
                title={title}
                subtitle={subtitle}
                actionButton={
                    <PrimaryButton
                        onClick={handleExportCsv}
                        variant="contained"
                        startIcon={<DownloadRounded />}
                        sx={{ textTransform: "none", fontWeight: 600 }}
                    >
                        Export Report
                    </PrimaryButton>
                }
            />

            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
                    <MetricCard
                        icon={<Receipt />}
                        variant="navy"
                        label="Transactions"
                        value={analytics.transactionCount.toLocaleString()}
                        trend={buildMetricTrend({ delta: analytics.countChange })}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
                    <MetricCard
                        icon={<Banknote />}
                        variant="emerald"
                        label="Gross In"
                        value={formatCurrency(analytics.grossInValue)}
                        trend={buildMetricTrend({ delta: analytics.grossInChange })}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
                    <MetricCard
                        icon={<Coins />}
                        variant="rose"
                        label="Money Out"
                        value={formatCurrency(analytics.totalOutValue)}
                        trend={buildMetricTrend({ delta: analytics.outflowChange, preferLower: true })}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
                    <MetricCard
                        icon={<Banknote />}
                        variant={analytics.netValue >= 0 ? "blue" : "rose"}
                        label="Net Cash"
                        value={`${analytics.netValue >= 0 ? "+" : "-"} ${formatCurrency(Math.abs(analytics.netValue))}`}
                        trend={buildMetricTrend({ delta: analytics.netChange })}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
                    <MetricCard
                        icon={<CheckCircle2 />}
                        variant="blue"
                        label="Paid Rate"
                        value={`${analytics.successRate.toFixed(1)}%`}
                        trend={buildMetricTrend({ delta: analytics.successDelta })}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
                    <MetricCard
                        icon={<Coins />}
                        variant="purple"
                        label="Average Paid Value"
                        value={formatCurrency(analytics.averagePaidValue)}
                        trend={buildMetricTrend({ delta: analytics.averagePaidValueDelta })}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                    <BaseCard sx={{ p: 2.5 }}>
                        <Stack
                            direction={{ xs: "column", md: "row" }}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", md: "center" }}
                            spacing={1.25}
                        >
                            <SectionHeading
                                title="Cash Flow Breakdown"
                                description={`Money In, Money Out, and Net over ${windowDays} days (${analyticsScope === "system" ? "system-wide" : "current tab"})`}
                                disableGutters
                            />
                            <Stack direction="row" spacing={1} alignItems="center">
                                <ToggleButtonGroup
                                    size="small"
                                    value={analyticsScope}
                                    exclusive
                                    onChange={(_, value) => {
                                        if (value) setAnalyticsScope(value);
                                    }}
                                >
                                    {ANALYTICS_SCOPE_OPTIONS.map((option) => (
                                        <ToggleButton key={option.value} value={option.value} sx={{ px: 1.5, fontWeight: 700 }}>
                                            {option.label}
                                        </ToggleButton>
                                    ))}
                                </ToggleButtonGroup>
                                <ToggleButtonGroup
                                    size="small"
                                    value={windowDays}
                                    exclusive
                                    onChange={(_, value) => {
                                        if (value) setWindowDays(value);
                                    }}
                                >
                                    {WINDOW_OPTIONS.map((option) => (
                                        <ToggleButton key={option} value={option} sx={{ px: 1.75, fontWeight: 700 }}>
                                            {option} days
                                        </ToggleButton>
                                    ))}
                                </ToggleButtonGroup>
                            </Stack>
                        </Stack>
                        <Typography sx={{ mt: 0.75, mb: 1.5, fontSize: 12, color: "text.secondary" }}>
                            Net = Gross In - Refund Out - Payout Out
                        </Typography>
                        {analyticsLoading ? (
                            <Skeleton variant="rounded" height={320} />
                        ) : (
                            <Box sx={{ height: 320, width: "100%" }}>
                                <ResponsiveContainer>
                                    <ComposedChart
                                        data={analytics.flowTrend}
                                        stackOffset="sign"
                                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient id="inboundGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop
                                                    offset="5%"
                                                    stopColor={theme.palette.success.main}
                                                    stopOpacity={0.2}
                                                />
                                                <stop
                                                    offset="95%"
                                                    stopColor={theme.palette.success.main}
                                                    stopOpacity={0}
                                                />
                                            </linearGradient>
                                            <linearGradient id="outboundGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop
                                                    offset="5%"
                                                    stopColor={theme.palette.error.main}
                                                    stopOpacity={0.2}
                                                />
                                                <stop
                                                    offset="95%"
                                                    stopColor={theme.palette.error.main}
                                                    stopOpacity={0}
                                                />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke={theme.palette.divider}
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="label"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: theme.palette.text.primary, fontSize: 11 }}
                                            minTickGap={20}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                                            tickFormatter={(value) => formatCompactNumber(value)}
                                        />
                                        <ReferenceLine y={0} stroke={theme.palette.divider} />
                                        <Tooltip
                                            formatter={(value, name) => {
                                                const numeric = Number(value || 0);
                                                if (name === "Money Out") return [formatCurrency(Math.abs(numeric)), name];
                                                if (name === "Net")
                                                    return [
                                                        `${numeric >= 0 ? "+" : "-"} ${formatCurrency(Math.abs(numeric))}`,
                                                        name,
                                                    ];
                                                return [formatCurrency(Math.abs(numeric)), name];
                                            }}
                                            contentStyle={{
                                                border: `1px solid ${theme.palette.divider}`,
                                                borderRadius: 10,
                                                boxShadow: theme.shadows[4],
                                            }}
                                            itemStyle={{ color: theme.palette.text.primary, fontWeight: 600 }}
                                        />
                                        <Legend />
                                        <Bar
                                            dataKey="inbound"
                                            name="Money In"
                                            stackId="flow"
                                            fill="url(#inboundGradient)"
                                            stroke={theme.palette.success.main}
                                            strokeWidth={1.5}
                                            barSize={14}
                                        />
                                        <Bar
                                            dataKey="outbound"
                                            name="Money Out"
                                            stackId="flow"
                                            fill="url(#outboundGradient)"
                                            stroke={theme.palette.error.main}
                                            strokeWidth={1.5}
                                            barSize={14}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="net"
                                            name="Net"
                                            stroke={theme.palette.info.main}
                                            strokeWidth={2.5}
                                            dot={false}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </Box>
                        )}
                    </BaseCard>
                </Grid>
            </Grid>

            <Box className="admin-card">
                <DataTable
                    showHeader={false}
                    showIndex
                    columns={columns}
                    data={transactions}
                    totalItems={totalItems}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    loading={loading}
                    actions={false}
                />
            </Box>
        </Container>
    );
}
