import React, { useMemo } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import BaseCard from "../../../../common/components/cards/BaseCard";
import SectionHeading from "../../../../common/components/SectionHeading";
import { useTheme } from "@mui/material/styles";

const HOUR_IN_MS = 60 * 60 * 1000;
const DAY_IN_MS = 24 * HOUR_IN_MS;
const RANGE_DAY_MAP = { "24h": 1, "7d": 7, "30d": 30 };

const parseDateLike = (value) => {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    const raw = String(value).trim();
    if (!raw) return null;

    const ddMmMatch = raw.match(/^(\d{1,2})[/-](\d{1,2})$/);
    if (ddMmMatch) {
        const [, dStr, mStr] = ddMmMatch;
        const now = new Date();
        const parsedDdMm = new Date(now.getFullYear(), Number(mStr) - 1, Number(dStr), 0, 0, 0, 0);
        if (!Number.isNaN(parsedDdMm.getTime())) return parsedDdMm;
    }

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const clampToStartOfDay = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

const toDayKey = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

const toHourKey = (date) => {
    const d = new Date(date);
    d.setMinutes(0, 0, 0);
    return d.toISOString();
};

const getNumeric = (item, keys) => {
    for (const key of keys) {
        const value = Number(item?.[key]);
        if (Number.isFinite(value)) return value;
    }
    return 0;
};

const normalizeDailySeries = ({ rawSeries, days, valueResolver, locale = "vi-VN", rangeStart = null, rangeEnd = null }) => {
    const now = Date.now();
    const startDate = rangeStart ? clampToStartOfDay(rangeStart) : new Date(now - (days - 1) * DAY_IN_MS);
    const endDate = rangeEnd ? clampToStartOfDay(rangeEnd) : clampToStartOfDay(new Date(now));
    const computedDays = Math.max(1, Math.floor((endDate - startDate) / DAY_IN_MS) + 1);
    const points = [];
    const map = new Map();

    for (let i = 0; i < computedDays; i += 1) {
        const d = new Date(startDate.getTime() + i * DAY_IN_MS);
        const key = toDayKey(d);
        const point = {
            xLabel: d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" }),
            value: 0,
            candidates: 0,
            coaches: 0,
        };
        points.push(point);
        map.set(key, point);
    }

    (Array.isArray(rawSeries) ? rawSeries : []).forEach((item) => {
        const itemDate =
            parseDateLike(item?.date) ||
            parseDateLike(item?.label) ||
            parseDateLike(item?.time) ||
            parseDateLike(item?.timestamp) ||
            parseDateLike(item?.createdAt);
        if (!itemDate) return;
        if (rangeStart && itemDate < rangeStart) return;
        if (rangeEnd && itemDate > rangeEnd) return;

        const bucket = map.get(toDayKey(itemDate));
        if (!bucket) return;

        const values = valueResolver(item);
        Object.keys(values).forEach((k) => {
            bucket[k] += Number(values[k] || 0);
        });
    });

    return points;
};

const normalizeHourlySeries = ({ rawSeries, valueResolver, locale = "vi-VN", rangeStart = null, rangeEnd = null }) => {
    const now = Date.now();
    const start = rangeStart ? rangeStart.getTime() : now - 23 * HOUR_IN_MS;
    const end = rangeEnd ? rangeEnd.getTime() : now;
    const totalHours = Math.max(1, Math.floor((end - start) / HOUR_IN_MS) + 1);
    const points = [];
    const map = new Map();

    for (let i = 0; i < totalHours; i += 1) {
        const d = new Date(start + i * HOUR_IN_MS);
        d.setMinutes(0, 0, 0);
        const key = toHourKey(d);
        const point = {
            xLabel: d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }),
            value: 0,
            candidates: 0,
            coaches: 0,
        };
        points.push(point);
        map.set(key, point);
    }

    (Array.isArray(rawSeries) ? rawSeries : []).forEach((item) => {
        const itemDate =
            parseDateLike(item?.date) ||
            parseDateLike(item?.label) ||
            parseDateLike(item?.time) ||
            parseDateLike(item?.timestamp) ||
            parseDateLike(item?.createdAt);
        if (!itemDate) return;
        if (rangeStart && itemDate < rangeStart) return;
        if (rangeEnd && itemDate > rangeEnd) return;

        const d = new Date(itemDate);
        d.setMinutes(0, 0, 0);
        const bucket = map.get(toHourKey(d));
        if (!bucket) return;

        const values = valueResolver(item);
        Object.keys(values).forEach((k) => {
            bucket[k] += Number(values[k] || 0);
        });
    });

    return points;
};

const pickSourceByView = (data, view, baseKey) => {
    const ranges = data?.[`${baseKey}Ranges`] || data?.[`${baseKey}ByRange`] || data?.[`${baseKey}Range`];
    if (ranges && typeof ranges === "object" && Array.isArray(ranges[view])) return ranges[view];
    if (view === "24h" && Array.isArray(data?.[`${baseKey}24h`])) return data[`${baseKey}24h`];
    if (view === "7d" && Array.isArray(data?.[`${baseKey}7d`])) return data[`${baseKey}7d`];
    if (view === "30d" && Array.isArray(data?.[`${baseKey}30d`])) return data[`${baseKey}30d`];
    return data?.[baseKey] || [];
};

const parseAmount = (value) => {
    if (typeof value === "number") return value;
    const normalized = Number(String(value ?? "").replace(/,/g, "").trim());
    return Number.isFinite(normalized) ? normalized : 0;
};

const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

const toStatusLabel = (status) => {
    if (typeof status === "number") {
        if (status === 1) return "Paid";
        if (status === 2) return "Cancel";
        if (status === 3) return "PendingPayout";
        return "Created";
    }
    const raw = String(status || "").trim().toLowerCase();
    if (raw === "paid" || raw === "completed" || raw === "success") return "Paid";
    if (raw === "pending") return "Created";
    return raw ? status : "Created";
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

const isPaidInbound = (transaction) => {
    const type = String(toTypeLabel(transaction?.type)).toLowerCase();
    const status = String(toStatusLabel(transaction?.status)).toLowerCase();
    return type === "payment" && (status === "paid" || status === "completed" || status === "success");
};

const isPaidPayout = (transaction) => {
    const type = String(toTypeLabel(transaction?.type)).toLowerCase();
    const status = String(toStatusLabel(transaction?.status)).toLowerCase();
    return type === "payout" && (status === "paid" || status === "completed" || status === "success");
};

const getTransactionDate = (item) =>
    parseDateLike(item?.createdAt || item?.createdOn || item?.createdDate || item?.transactionDate || item?.date);

const buildRevenueSeriesFromTransactions = (transactions, view, commissionRate, fromDate, toDate) => {
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    const hasPayoutData = safeTransactions.some(isPaidPayout);
    const customRangeActive = Boolean(fromDate || toDate);
    const rangeStart = fromDate ? new Date(fromDate) : null;
    const rangeEnd = toDate ? new Date(toDate) : null;

    const mapped = safeTransactions
        .map((item) => {
            const createdAt = getTransactionDate(item);
            if (!createdAt) return null;

            const amount = Math.abs(parseAmount(item?.amount));
            if (!amount) return null;

            if (isPaidInbound(item)) return { createdAt, value: amount };
            if (isPaidPayout(item)) return { createdAt, value: -amount };
            return null;
        })
        .filter(Boolean);

    const aggregate =
        !customRangeActive && view === "24h"
            ? normalizeHourlySeries({
                  rawSeries: mapped,
                  valueResolver: (item) => ({ value: Number(item?.value || 0) }),
                  rangeStart,
                  rangeEnd,
              })
            : normalizeDailySeries({
                  rawSeries: mapped,
                  days: RANGE_DAY_MAP[view] || 7,
                  valueResolver: (item) => ({ value: Number(item?.value || 0) }),
                  rangeStart,
                  rangeEnd,
              });

    if (hasPayoutData) {
        return aggregate.map((item) => ({ ...item, value: Math.max(0, Number(item?.value || 0)) }));
    }

    const rate = Number(commissionRate);
    if (Number.isFinite(rate) && rate >= 0 && rate <= 1) {
        return aggregate.map((item) => ({ ...item, value: Math.max(0, Number(item?.value || 0) * rate) }));
    }

    return aggregate.map((item) => ({ ...item, value: Math.max(0, Number(item?.value || 0)) }));
};

export default function GrowthCharts({
    data,
    platformTransactions,
    commissionRate,
    timeframe = "7d",
    fromDate = "",
    toDate = "",
    loading,
}) {
    const theme = useTheme();
    const customRangeActive = Boolean(fromDate || toDate);
    const rangeStart = fromDate ? new Date(fromDate) : null;
    const rangeEnd = toDate ? new Date(toDate) : null;

    const revenueSeries = useMemo(
        () => buildRevenueSeriesFromTransactions(platformTransactions, timeframe, commissionRate, fromDate, toDate),
        [platformTransactions, timeframe, commissionRate, fromDate, toDate],
    );

    const userGrowthSeries = useMemo(() => {
        const source = pickSourceByView(data, timeframe, "userGrowth");
        const resolver = (item) => ({
            candidates: getNumeric(item, ["candidates", "candidate", "candidateCount"]),
            coaches: getNumeric(item, ["coaches", "coach", "coachCount"]),
        });
        if (!customRangeActive && timeframe === "24h") {
            return normalizeHourlySeries({ rawSeries: source, valueResolver: resolver });
        }
        return normalizeDailySeries({
            rawSeries: source,
            days: RANGE_DAY_MAP[timeframe] || 7,
            valueResolver: resolver,
            rangeStart,
            rangeEnd,
        });
    }, [data, timeframe, customRangeActive, rangeStart, rangeEnd]);

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
                            <AreaChart data={revenueSeries}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                                <XAxis dataKey="xLabel" axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} minTickGap={20} />
                                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    name="Revenue"
                                    stroke={theme.palette.info.main}
                                    strokeWidth={2.5}
                                    fillOpacity={0.15}
                                    fill={theme.palette.info.main}
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
                            <BarChart data={userGrowthSeries}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                                <XAxis dataKey="xLabel" axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} minTickGap={20} />
                                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="candidates" stackId="a" name="Candidates" fill={theme.palette.info.main} radius={[0, 0, 0, 0]} barSize={26} />
                                <Bar dataKey="coaches" stackId="a" name="Coaches" fill={theme.palette.success.main} radius={[4, 4, 0, 0]} barSize={26} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                </BaseCard>
            </Grid>
        </Grid>
    );
}
