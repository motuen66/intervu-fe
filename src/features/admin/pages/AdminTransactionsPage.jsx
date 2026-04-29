import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Container,
    Box,
    Typography,
    Avatar,
    Grid,
    Stack,
    Button,
    Skeleton,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
    TrendingUpRounded,
    TrendingDownRounded,
    RemoveRounded,
    DownloadRounded,
    PaymentsRounded,
    MonetizationOnRounded,
    CheckCircleRounded,
    ReceiptLongRounded,
} from '@mui/icons-material';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { callApi } from '../../../common/utils/apiConnector';
import { METHOD } from '../../../common/constants/api';
import { adminEndPoints } from '../services/adminApi';
import toast from 'react-hot-toast';
import DataTable from '../../../common/components/table/DataTable';
import AdminPageHeader from '../../../common/components/admin/AdminPageHeader';
import BaseCard from '../../../common/components/cards/BaseCard';
import SectionHeading from '../../../common/components/SectionHeading';
import useTableState from '../../../hooks/useTableState';
import StatusChip from '../../../common/components/StatusChip';
import { formatCurrency } from '../../../common/utils/dateFormatter';
import './AdminDashboard.css';

const STATUS_COLOR_MAP = {
    Paid: 'success',
    PendingPayout: 'info',
    Created: 'warning',
    Cancel: 'error',
};

const TYPE_COLOR_MAP = {
    Payment: 'primary',
    Payout: 'error',
    Refund: 'warning',
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const ANALYTICS_PAGE_SIZE = 100;
const WINDOW_OPTIONS = [7, 30, 90];

const getInitials = (name = '') =>
    name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase() || '?';

const parseAmount = (value) => {
    if (typeof value === 'number') return value;
    const normalized = Number(String(value ?? '').replace(/,/g, '').trim());
    return Number.isFinite(normalized) ? normalized : 0;
};

const toStatusLabel = (status) => {
    if (typeof status === 'number') {
        if (status === 1) return 'Paid';
        if (status === 2) return 'Cancel';
        if (status === 3) return 'PendingPayout';
        return 'Created';
    }
    if (typeof status !== 'string') return 'Created';
    const normalized = status.trim();
    if (!normalized) return 'Created';
    const lower = normalized.toLowerCase();
    if (lower === 'completed') return 'Paid';
    if (lower === 'pending') return 'Created';
    return normalized;
};

const toTypeLabel = (type) => {
    if (typeof type === 'number') {
        if (type === 1) return 'Payment';
        if (type === 2) return 'Payout';
        if (type === 3) return 'Refund';
        return String(type);
    }
    return String(type || 'Unknown');
};

const normalizeTransaction = (item) => ({
    ...item,
    orderCode: item?.orderCode || item?.transactionCode || item?.id || '-',
    type: toTypeLabel(item?.type),
    status: toStatusLabel(item?.status),
    userName: item?.userName || item?.candidateName || item?.coachName || item?.partyName || '-',
    userEmail: item?.userEmail || item?.candidateEmail || item?.coachEmail || item?.email || '',
    amount: parseAmount(item?.amount),
    createdAt: item?.createdAt || item?.createdOn || item?.createdDate || item?.transactionDate || null,
});

const getDirection = (transaction) => {
    const type = String(transaction?.type || '').toLowerCase();
    if (type === 'payment') return 'inbound';
    if (type === 'refund' || type === 'payout') return 'outbound';
    return 'unknown';
};

const isPaidStatus = (status) => {
    const value = String(status || '').toLowerCase();
    return value === 'paid' || value === 'completed' || value === 'success';
};

const isPaidTransaction = (transaction) => {
    const direction = getDirection(transaction);
    return isPaidStatus(transaction?.status) && (direction === 'inbound' || direction === 'outbound');
};

const getDateSafe = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isReliableBusinessDate = (date) => Boolean(date) && date.getFullYear() >= 2000;

const toPercentChange = (current, previous) => {
    if (!previous) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
};

const formatSignedPercent = (value) => {
    const safe = Number(value) || 0;
    const sign = safe > 0 ? '+' : safe < 0 ? '-' : '';
    return `${sign}${Math.abs(safe).toFixed(1)}%`;
};

const formatCompactNumber = (value) =>
    new Intl.NumberFormat('vi-VN', {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value || 0);

const toDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

function StatCard({ title, value, deltaValue, outflowMode = false, icon, compareDays = 30 }) {
    const safeDelta = Number(deltaValue) || 0;
    const isIncrease = safeDelta > 0;
    const isDecrease = safeDelta < 0;
    const isNeutral = safeDelta === 0;
    const isGood = outflowMode ? isDecrease : isIncrease;
    const tone = isNeutral ? 'text.secondary' : isGood ? 'success.main' : 'error.main';

    return (
        <BaseCard sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                <Box>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600 }}>
                        {title}
                    </Typography>
                    <Typography sx={{ mt: 1, fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>
                        {value}
                    </Typography>
                </Box>
                <Box
                    sx={(theme) => ({
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main',
                    })}
                >
                    {icon}
                </Box>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 1.5 }}>
                {isNeutral ? (
                    <RemoveRounded sx={{ color: 'text.secondary', fontSize: 18 }} />
                ) : isIncrease ? (
                    <TrendingUpRounded sx={{ color: tone, fontSize: 18 }} />
                ) : (
                    <TrendingDownRounded sx={{ color: tone, fontSize: 18 }} />
                )}
                <Typography
                    sx={{
                        fontSize: 12,
                        color: tone,
                        fontWeight: 700,
                    }}
                >
                    {formatSignedPercent(safeDelta)}
                </Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{`vs previous ${compareDays} days`}</Typography>
            </Stack>
        </BaseCard>
    );
}

export default function AdminTransactionsPage({ filterType, filterStatus, title, subtitle }) {
    const isOutflowContext = filterType === 'Payout' || filterType === 'Refund';
    const isEarningsContext = filterType === 'Payment';
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

    const getQueryString = useCallback((pageValue, pageSizeValue) => {
        const params = new URLSearchParams();
        params.set('page', String(pageValue));
        params.set('pageSize', String(pageSizeValue));
        if (filterType) params.set('type', filterType);
        if (filterStatus) params.set('status', filterStatus);
        return params.toString();
    }, [filterType, filterStatus]);

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const response = await callApi({
                method: METHOD.GET,
                endpoint: `${adminEndPoints.GET_TRANSACTIONS}?${getQueryString(page + 1, pageSize)}`,
                useGlobalLoading: false,
            });

            if (response?.success) {
                setTransactions((response.data?.items || []).map(normalizeTransaction));
                setTotalItems(response.data?.totalItems || 0);
            }
        } catch {
            toast.error('Error loading transactions');
        } finally {
            setLoading(false);
        }
    }, [getQueryString, page, pageSize, setLoading, setTotalItems, setTransactions]);

    const fetchAnalyticsTransactions = useCallback(async () => {
        setAnalyticsLoading(true);
        try {
            const all = [];
            let currentPage = 1;
            let totalItems = Number.POSITIVE_INFINITY;

            while (all.length < totalItems) {
                const response = await callApi({
                    method: METHOD.GET,
                    endpoint: `${adminEndPoints.GET_TRANSACTIONS}?${getQueryString(currentPage, ANALYTICS_PAGE_SIZE)}`,
                    useGlobalLoading: false,
                });

                if (!response?.success) break;

                const items = (response.data?.items || []).map(normalizeTransaction);
                if (!items.length) break;

                totalItems = Number(response.data?.totalItems) || items.length;
                all.push(...items);
                currentPage += 1;
            }

            setAnalyticsTransactions(all);
        } catch {
            setAnalyticsTransactions([]);
            toast.error('Error loading analytics data');
        } finally {
            setAnalyticsLoading(false);
        }
    }, [getQueryString]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    useEffect(() => {
        fetchAnalyticsTransactions();
    }, [fetchAnalyticsTransactions]);

    const analytics = useMemo(() => {
        const data = analyticsTransactions.length ? analyticsTransactions : transactions;
        const now = Date.now();
        const currentStart = now - windowDays * DAY_IN_MS;
        const previousStart = now - (windowDays * 2) * DAY_IN_MS;

        const transactionCount = data.length;
        let grossValue = 0;
        let paidCount = 0;
        let paidTransactionCount = 0;

        let currentCount = 0;
        let previousCount = 0;
        let currentGross = 0;
        let previousGross = 0;
        let currentPaid = 0;
        let previousPaid = 0;
        let currentPaidTransactionCount = 0;
        let previousPaidTransactionCount = 0;

        const trendMap = new Map();
        const trendKeys = Array.from({ length: windowDays }).map((_, index) => {
            const d = new Date(now - (windowDays - 1 - index) * DAY_IN_MS);
            d.setHours(0, 0, 0, 0);
            const key = toDateKey(d);
            trendMap.set(key, {
                label: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
                value: 0,
            });
            return key;
        });

        data.forEach((transaction) => {
            const amount = Math.abs(transaction.amount || 0);
            const status = transaction.status || 'Unknown';
            const createdAt = getDateSafe(transaction.createdAt);
            const paidTransaction = isPaidTransaction(transaction);

            if (paidTransaction) {
                grossValue += amount;
                paidTransactionCount += 1;
            }
            if (isPaidStatus(status)) paidCount += 1;

            if (isReliableBusinessDate(createdAt)) {
                const time = createdAt.getTime();
                if (time >= currentStart) {
                    currentCount += 1;
                    if (paidTransaction) {
                        currentGross += amount;
                        currentPaidTransactionCount += 1;
                    }
                    if (isPaidStatus(status)) currentPaid += 1;
                } else if (time >= previousStart && time < currentStart) {
                    previousCount += 1;
                    if (paidTransaction) {
                        previousGross += amount;
                        previousPaidTransactionCount += 1;
                    }
                    if (isPaidStatus(status)) previousPaid += 1;
                }

                const monthData = trendMap.get(toDateKey(createdAt));
                if (monthData && paidTransaction) {
                    monthData.value += amount;
                }
            } else {
                const latestKey = trendKeys[trendKeys.length - 1];
                const monthData = trendMap.get(latestKey);
                if (monthData && paidTransaction) {
                    monthData.value += amount;
                }
            }
        });

        const monthlyTrend = trendKeys.map((key) => {
            const monthData = trendMap.get(key);
            return {
                label: monthData?.label || key,
                value: monthData?.value || 0,
            };
        });

        const successRate = transactionCount ? (paidCount / transactionCount) * 100 : 0;
        const currentSuccessRate = currentCount ? (currentPaid / currentCount) * 100 : 0;
        const previousSuccessRate = previousCount ? (previousPaid / previousCount) * 100 : 0;
        const averagePaidValue = paidTransactionCount ? grossValue / paidTransactionCount : 0;
        const currentAveragePaidValue = currentPaidTransactionCount ? currentGross / currentPaidTransactionCount : 0;
        const previousAveragePaidValue = previousPaidTransactionCount ? previousGross / previousPaidTransactionCount : 0;
        const countChange = toPercentChange(currentCount, previousCount);
        const valueChange = toPercentChange(currentGross, previousGross);
        const successDelta = toPercentChange(currentSuccessRate, previousSuccessRate);
        const averagePaidValueDelta = toPercentChange(currentAveragePaidValue, previousAveragePaidValue);

        return {
            transactionCount,
            grossValue,
            successRate,
            averagePaidValue,
            countChange,
            valueChange,
            successDelta,
            averagePaidValueDelta,
            monthlyTrend,
        };
    }, [analyticsTransactions, transactions, windowDays]);

    const handleExportCsv = useCallback(() => {
        if (!analyticsTransactions.length) {
            toast.error('No data to export');
            return;
        }

        const rows = analyticsTransactions.map((transaction) => ({
            orderCode: transaction.orderCode || '',
            type: transaction.type || '',
            status: transaction.status || '',
            party: transaction.userName || '',
            email: transaction.userEmail || '',
            amount: transaction.amount || 0,
            createdAt: transaction.createdAt || '',
        }));

        const header = ['orderCode', 'type', 'status', 'party', 'email', 'amount', 'createdAt'];
        const csv = [
            header.join(','),
            ...rows.map((row) => header.map((key) => `"${String(row[key] ?? '').replace(/"/g, '""')}"`).join(',')),
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const cleanTitle = String(title || 'transactions').trim().toLowerCase().replace(/\s+/g, '-');
        link.href = url;
        link.setAttribute('download', `${cleanTitle}-report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [analyticsTransactions, title]);

    const columns = useMemo(
        () => [
            {
                field: 'orderCode',
                headerName: 'Order Code',
                render: (val) => (
                    <Typography sx={{ fontSize: '12px', fontWeight: 600, color: 'text.primary', fontFamily: 'monospace' }}>
                        #{val}
                    </Typography>
                ),
            },
            {
                field: 'type',
                headerName: 'Type',
                render: (val) => (
                    <StatusChip label={val} color={TYPE_COLOR_MAP[val] || 'default'} />
                ),
            },
            {
                field: 'userName',
                headerName: 'Party',
                render: (val, row) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                            sx={{
                                width: 28,
                                height: 28,
                                fontSize: 11,
                                fontWeight: 700,
                                bgcolor: 'secondary.main',
                                color: 'primary.main',
                            }}
                        >
                            {getInitials(val)}
                        </Avatar>
                        <Box>
                            <Typography sx={{ fontSize: '13px', fontWeight: 600, color: 'text.primary', lineHeight: 1.3 }}>
                                {val || '-'}
                            </Typography>
                            <Typography sx={{ fontSize: '11px', color: 'text.secondary' }}>
                                {row.userEmail || ''}
                            </Typography>
                        </Box>
                    </Box>
                ),
            },
            {
                field: 'amount',
                headerName: 'Amount',
                render: (val, row) => {
                    const direction = getDirection(row);
                    const prefix = direction === 'inbound' ? '+' : direction === 'outbound' ? '-' : '';
                    const tone = direction === 'inbound'
                        ? 'success.main'
                        : direction === 'outbound'
                            ? 'error.main'
                            : 'text.primary';
                    return (
                        <Typography sx={{ fontSize: '13px', fontWeight: 700, color: tone }}>
                            {prefix ? `${prefix} ` : ''}{formatCurrency(Math.abs(val))}
                        </Typography>
                    );
                },
            },
            {
                field: 'status',
                headerName: 'Status',
                render: (val) => (
                    <StatusChip label={val} color={STATUS_COLOR_MAP[val] || 'default'} />
                ),
            },
            {
                field: 'createdAt',
                headerName: 'Date',
                render: (val) => {
                    const d = getDateSafe(val);
                    return !d
                        ? '-'
                        : d.toLocaleString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
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
                actionButton={(
                    <Button
                        onClick={handleExportCsv}
                        variant="contained"
                        startIcon={<DownloadRounded />}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        Export Report
                    </Button>
                )}
            />

            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <StatCard
                        title="Transactions"
                        value={analytics.transactionCount.toLocaleString()}
                        deltaValue={analytics.countChange}
                        icon={<ReceiptLongRounded fontSize="small" />}
                        compareDays={windowDays}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <StatCard
                        title={isOutflowContext ? 'Money Out' : isEarningsContext ? 'Money In' : 'Paid Value'}
                        value={formatCurrency(analytics.grossValue)}
                        deltaValue={analytics.valueChange}
                        outflowMode={isOutflowContext}
                        icon={<PaymentsRounded fontSize="small" />}
                        compareDays={windowDays}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <StatCard
                        title="Paid Rate"
                        value={`${analytics.successRate.toFixed(1)}%`}
                        deltaValue={analytics.successDelta}
                        icon={<CheckCircleRounded fontSize="small" />}
                        compareDays={windowDays}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <StatCard
                        title="Average Paid Value"
                        value={formatCurrency(analytics.averagePaidValue)}
                        deltaValue={analytics.averagePaidValueDelta}
                        icon={<MonetizationOnRounded fontSize="small" />}
                        compareDays={windowDays}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                    <BaseCard sx={{ p: 2.5 }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={1.25}>
                            <SectionHeading
                                title={isOutflowContext ? 'Money Out Trend' : 'Money In Trend'}
                                description={`Using live data from current ${title?.toLowerCase() || 'tab'} (${windowDays} days)`}
                                disableGutters
                            />
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
                        {analyticsLoading ? (
                            <Skeleton variant="rounded" height={320} />
                        ) : (
                            <Box sx={{ height: 320, width: '100%' }}>
                                <ResponsiveContainer>
                                    <AreaChart data={analytics.monthlyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={isOutflowContext ? theme.palette.error.main : theme.palette.secondary.main} stopOpacity={0.2} />
                                                <stop offset="95%" stopColor={isOutflowContext ? theme.palette.error.main : theme.palette.secondary.main} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
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
                                        <Tooltip
                                            formatter={(value) => formatCurrency(Number(value || 0))}
                                            contentStyle={{
                                                border: `1px solid ${theme.palette.divider}`,
                                                borderRadius: 10,
                                                boxShadow: theme.shadows[4],
                                            }}
                                            itemStyle={{ color: theme.palette.text.primary, fontWeight: 600 }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            name={isOutflowContext ? 'Money Out' : 'Money In'}
                                            stroke={isOutflowContext ? theme.palette.error.main : theme.palette.secondary.main}
                                            strokeWidth={2.5}
                                            fillOpacity={1}
                                            fill="url(#valueGradient)"
                                        />
                                    </AreaChart>
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
