import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
    Box,
    Grid,
    Typography,
    CircularProgress,
    MenuItem,
    InputLabel,
    FormControl,
    Stack,
    Tooltip,
    Chip,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
} from "recharts";
import { RefreshCw, Zap, Clock, Hash, TrendingUp, Layers, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { adminEndPoints } from "../../services/adminApi";
import AdminPageHeader from "../../../../common/components/admin/AdminPageHeader";
import KpiCard from "../../../../common/components/cards/KpiCard";
import BaseCard from "../../../../common/components/cards/BaseCard";
import SecondaryButton from "../../../../common/components/buttons/SecondaryButton";
import FormSelect from "../../../../common/components/form/FormSelect";
import FormTextField from "../../../../common/components/form/FormTextField";
import DataTable from "../../../../common/components/table/DataTable";

const TIMEFRAME_OPTIONS = [
    { value: "24h", label: "Last 24 Hours" },
    { value: "7d", label: "Last 7 Days" },
    { value: "30d", label: "Last 30 Days" },
];

const COVERAGE_ROWS = [
    { endpoint: "extract-document", provider: "HuggingFace", logged: true, note: "Python-side; tokens reported as 0 (no usage in response)" },
    { endpoint: "api/transcript", provider: "HuggingFace", logged: true, note: "Python-side; tokens reported as 0 (no usage in response)" },
    { endpoint: "api/generate-assessment", provider: "HuggingFace", logged: true, note: "Python-side; tokens reported as 0 (no usage in response)" },
    { endpoint: "api/generate-roadmap", provider: "Gemini", logged: true, note: "Full token usage captured" },
    { endpoint: "smart-search-rerank", provider: "HuggingFace", logged: true, note: ".NET side; full token usage captured" },
    { endpoint: "api/evaluate-cv", provider: "HuggingFace", logged: true, note: "Python-side; tokens reported as 0 (no usage in response)" },
    { endpoint: "api/extract-cv", provider: "HuggingFace", logged: true, note: "Python-side; tokens reported as 0 (no usage in response)" },
    { endpoint: "api/last-cv-pdf-url", provider: "HuggingFace", logged: true, note: "Python-side; tokens reported as 0 (no usage in response)" },
];

function CoverageCard() {
    return (
        <BaseCard sx={{ p: 2.5, mb: 4 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
                AI Endpoint Coverage
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                Static reference. A checkmark means traffic for this endpoint is written to AiTrafficLog.
            </Typography>
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "1.6fr 1fr 0.5fr 2fr",
                    gap: 1,
                    px: 1.5,
                    py: 1,
                    bgcolor: "action.hover",
                    borderRadius: 1,
                }}
            >
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                    ENDPOINT
                </Typography>
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                    PROVIDER
                </Typography>
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                    LOGGED
                </Typography>
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                    NOTE
                </Typography>
            </Box>
            {COVERAGE_ROWS.map((row) => (
                <Box
                    key={row.endpoint}
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "1.6fr 1fr 0.5fr 2fr",
                        gap: 1,
                        px: 1.5,
                        py: 1,
                        borderBottom: 1,
                        borderColor: "divider",
                        alignItems: "center",
                    }}
                >
                    <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                        {row.endpoint}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {row.provider}
                    </Typography>
                    {row.logged ? (
                        <Check size={16} style={{ color: "var(--mui-palette-success-main)" }} />
                    ) : (
                        <X size={16} style={{ color: "var(--mui-palette-error-main)" }} />
                    )}
                    <Typography variant="caption" color="text.secondary">
                        {row.note}
                    </Typography>
                </Box>
            ))}
        </BaseCard>
    );
}

function useEndpointColors(endpoints) {
    const theme = useTheme();
    return useMemo(() => {
        const palette = [
            theme.palette.primary.main,
            theme.palette.success.main,
            theme.palette.info.main,
            theme.palette.warning.main,
            theme.palette.secondary.main,
            theme.palette.error.main,
        ];
        const map = {};
        endpoints.forEach((ep, i) => {
            map[ep] = palette[i % palette.length];
        });
        return map;
    }, [endpoints, theme]);
}

function UsageLineChart({ series, endpoints, bucketUnit }) {
    const theme = useTheme();
    const colorMap = useEndpointColors(endpoints);

    const { data, keyMap } = useMemo(() => {
        const map = {};
        endpoints.forEach((ep, i) => {
            map[ep] = `ep_${i}`;
        });
        const rows = (series ?? []).map((p) => {
            const bucketDate = new Date(p.bucket);
            const label =
                bucketUnit === "day"
                    ? bucketDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })
                    : bucketDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
            const row = { label };
            const counts = p.countByEndpoint ?? {};
            endpoints.forEach((ep) => {
                row[map[ep]] = Number(counts[ep] ?? 0);
            });
            return row;
        });
        return { data: rows, keyMap: map };
    }, [series, endpoints, bucketUnit]);

    const hasData =
        endpoints.length > 0 &&
        data.some((row) => endpoints.some((ep) => (row[keyMap[ep]] ?? 0) > 0));

    return (
        <BaseCard sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary", mb: 0.5 }}>
                Rows
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2 }}>
                Requests per endpoint ({bucketUnit === "day" ? "per day" : "per hour"})
            </Typography>

            <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: "wrap", rowGap: 1 }}>
                <LegendSwatch
                    color={theme.palette.text.disabled}
                    label="COUNT"
                    textColor={theme.palette.text.secondary}
                />
                {endpoints.map((ep) => (
                    <LegendSwatch
                        key={ep}
                        color={colorMap[ep]}
                        label={ep.toUpperCase()}
                        textColor={theme.palette.text.primary}
                    />
                ))}
            </Stack>

            {hasData ? (
                <Box sx={{ width: "100%", height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                            <CartesianGrid
                                stroke={theme.palette.divider}
                                strokeDasharray="3 3"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="label"
                                stroke={theme.palette.text.secondary}
                                tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                                axisLine={{ stroke: theme.palette.divider }}
                                tickLine={false}
                            />
                            <YAxis
                                stroke={theme.palette.text.secondary}
                                tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                                axisLine={{ stroke: theme.palette.divider }}
                                tickLine={false}
                                allowDecimals={false}
                            />
                            <RechartsTooltip
                                contentStyle={{
                                    backgroundColor: theme.palette.background.paper,
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 8,
                                    fontSize: 12,
                                    color: theme.palette.text.primary,
                                }}
                                labelStyle={{ color: theme.palette.text.primary, fontWeight: 600 }}
                                itemStyle={{ color: theme.palette.text.primary }}
                                cursor={{ stroke: alpha(theme.palette.text.primary, 0.2), strokeWidth: 1 }}
                                formatter={(value, name) => {
                                    const label = Object.entries(keyMap).find(([, v]) => v === name)?.[0] ?? name;
                                    return [value, label];
                                }}
                            />
                            {endpoints.map((ep) => (
                                <Line
                                    key={ep}
                                    type="monotone"
                                    dataKey={keyMap[ep]}
                                    name={keyMap[ep]}
                                    stroke={colorMap[ep]}
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 4 }}
                                    connectNulls={true}
                                    isAnimationActive={false}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </Box>
            ) : (
                <Box sx={{ height: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                        No traffic in the selected window.
                    </Typography>
                </Box>
            )}
        </BaseCard>
    );
}

function LegendSwatch({ color, label, textColor }) {
    return (
        <Stack direction="row" spacing={0.75} alignItems="center">
            <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: color }} />
            <Typography variant="caption" sx={{ color: textColor, letterSpacing: "0.5px", fontWeight: 600 }}>
                {label}
            </Typography>
        </Stack>
    );
}

export default function PythonServiceMonitorPage() {
    const [timeframe, setTimeframe] = useState("24h");
    const [provider, setProvider] = useState("");
    const [endpointFilter, setEndpointFilter] = useState("");
    const [endpointInput, setEndpointInput] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const debounceRef = useRef(null);

    const customRangeActive = Boolean(fromDate || toDate);

    const filters = useMemo(() => {
        const base = {
            page: page + 1,
            pageSize,
            provider: provider || undefined,
            endpoint: endpointFilter || undefined,
        };
        if (customRangeActive) {
            base.from = fromDate ? new Date(fromDate).toISOString() : undefined;
            base.to = toDate ? new Date(toDate).toISOString() : undefined;
        } else {
            base.timeframe = timeframe;
        }
        return base;
    }, [timeframe, provider, endpointFilter, fromDate, toDate, page, pageSize, customRangeActive]);

    const fetchMetrics = useCallback(async (f) => {
        setLoading(true);
        try {
            const res = await callApi({
                method: METHOD.GET,
                endpoint: adminEndPoints.GET_PYTHON_AI_METRICS(f),
            });
            if (res?.success) {
                setMetrics(res.data);
            } else {
                toast.error("Failed to load AI metrics.");
            }
        } catch {
            toast.error("Error fetching AI metrics.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMetrics(filters);
    }, [fetchMetrics, filters]);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setEndpointFilter(endpointInput.trim());
            setPage(0);
        }, 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [endpointInput]);

    const handleTimeframeChange = (e) => {
        setTimeframe(e.target.value);
        setPage(0);
    };

    const handleProviderChange = (e) => {
        setProvider(e.target.value);
        setPage(0);
    };

    const handleFromChange = (e) => {
        setFromDate(e.target.value);
        setPage(0);
    };

    const handleToChange = (e) => {
        setToDate(e.target.value);
        setPage(0);
    };

    const handleClearRange = () => {
        setFromDate("");
        setToDate("");
        setPage(0);
    };

    const handleRefresh = () => fetchMetrics(filters);

    const avgLatency = metrics ? Math.round(metrics.averageLatencyMs) : 0;
    const totalCount = metrics?.totalCount ?? 0;

    const tableColumns = useMemo(
        () => [
            {
                field: "timestamp",
                headerName: "Timestamp",
                render: (value) => (
                    <Typography variant="caption" color="text.secondary">
                        {new Date(value).toLocaleString()}
                    </Typography>
                ),
            },
            {
                field: "endpointName",
                headerName: "Endpoint",
                render: (value) => (
                    <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                        {value}
                    </Typography>
                ),
            },
            {
                field: "provider",
                headerName: "Provider",
                render: (value) => (
                    <Chip
                        label={value}
                        size="small"
                        sx={{
                            height: 20,
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            bgcolor: "action.hover",
                            color: "text.primary",
                        }}
                    />
                ),
            },
            {
                field: "promptTokens",
                headerName: "Prompt Tokens",
                render: (value) => (
                    <Typography variant="body2" fontWeight={600}>
                        {Number(value ?? 0).toLocaleString()}
                    </Typography>
                ),
            },
            {
                field: "completionTokens",
                headerName: "Completion Tokens",
                render: (value) => (
                    <Typography variant="body2" fontWeight={600}>
                        {Number(value ?? 0).toLocaleString()}
                    </Typography>
                ),
            },
            {
                field: "totalTokens",
                headerName: "Total Tokens",
                render: (value) => (
                    <Typography variant="body2" fontWeight={700}>
                        {Number(value ?? 0).toLocaleString()}
                    </Typography>
                ),
            },
            {
                field: "latencyMs",
                headerName: "Latency (ms)",
                render: (value) => (
                    <Typography variant="body2" fontWeight={600} color="text.secondary">
                        {Number(value ?? 0).toLocaleString()}
                    </Typography>
                ),
            },
        ],
        [],
    );

    return (
        <Box sx={{ p: { xs: 2, md: 4 } }}>
            <AdminPageHeader
                title="Python AI Monitor"
                subtitle="Token usage and latency metrics for all AI provider calls."
            />

            <BaseCard sx={{ p: 2.5, mb: 3 }}>
                <Stack
                    direction="row"
                    spacing={0.5}
                    sx={{ mb: 2, alignItems: "center" }}
                >
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                        Filters
                    </Typography>
                    {customRangeActive && (
                        <Chip
                            label="Custom range"
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ ml: 1, height: 20, fontSize: "0.68rem" }}
                        />
                    )}
                </Stack>

                <Grid container spacing={2} alignItems="flex-end">
                    <Grid size={{ xs: 12, sm: 6, md: 3, lg: 2 }}>
                        <Tooltip title={customRangeActive ? "Disabled while a custom date range is active" : ""}>
                            <FormControl size="small" fullWidth disabled={customRangeActive}>
                                <InputLabel>Timeframe</InputLabel>
                                <FormSelect
                                    value={timeframe}
                                    label="Timeframe"
                                    onChange={handleTimeframeChange}
                                >
                                    {TIMEFRAME_OPTIONS.map((opt) => (
                                        <MenuItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </MenuItem>
                                    ))}
                                </FormSelect>
                            </FormControl>
                        </Tooltip>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3, lg: 2 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel>Provider</InputLabel>
                            <FormSelect value={provider} label="Provider" onChange={handleProviderChange}>
                                <MenuItem value="">All providers</MenuItem>
                                {(metrics?.availableProviders ?? []).map((p) => (
                                    <MenuItem key={p} value={p}>
                                        {p}
                                    </MenuItem>
                                ))}
                            </FormSelect>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3, lg: 3 }}>
                        <FormTextField
                            size="small"
                            fullWidth
                            label="Endpoint contains"
                            value={endpointInput}
                            onChange={(e) => setEndpointInput(e.target.value)}
                            placeholder="e.g. evaluate-cv"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3, lg: 2 }}>
                        <FormTextField
                            size="small"
                            fullWidth
                            label="From"
                            type="datetime-local"
                            value={fromDate}
                            onChange={handleFromChange}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3, lg: 2 }}>
                        <FormTextField
                            size="small"
                            fullWidth
                            label="To"
                            type="datetime-local"
                            value={toDate}
                            onChange={handleToChange}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, lg: 1 }}>
                        <Stack direction="row" spacing={1} sx={{ justifyContent: { xs: "flex-start", lg: "flex-end" } }}>
                            {customRangeActive && (
                                <SecondaryButton onClick={handleClearRange} size="small">
                                    Clear
                                </SecondaryButton>
                            )}
                            <SecondaryButton
                                onClick={handleRefresh}
                                disabled={loading}
                                startIcon={<RefreshCw size={14} />}
                                size="small"
                            >
                                Refresh
                            </SecondaryButton>
                        </Stack>
                    </Grid>
                </Grid>
            </BaseCard>

            {loading && !metrics ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    <Grid container spacing={2.5} sx={{ mb: 4 }}>
                        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
                            <KpiCard
                                icon={<Hash size={22} />}
                                iconColor="primary"
                                label="Total Requests"
                                value={(metrics?.totalRequests ?? 0).toLocaleString()}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
                            <KpiCard
                                icon={<Zap size={22} />}
                                iconColor="warning"
                                label="Total Tokens"
                                value={(metrics?.totalTokens ?? 0).toLocaleString()}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
                            <KpiCard
                                icon={<TrendingUp size={22} />}
                                iconColor="info"
                                label="Prompt Tokens"
                                value={(metrics?.totalPromptTokens ?? 0).toLocaleString()}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
                            <KpiCard
                                icon={<Clock size={22} />}
                                iconColor="success"
                                label="Avg Latency"
                                value={`${avgLatency}ms`}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
                            <KpiCard
                                icon={<Layers size={22} />}
                                iconColor="secondary"
                                label="# Services"
                                value={(metrics?.serviceCount ?? 0).toLocaleString()}
                            />
                        </Grid>
                    </Grid>

                    <UsageLineChart
                        series={metrics?.endpointSeries ?? []}
                        endpoints={metrics?.seriesEndpoints ?? []}
                        bucketUnit={metrics?.seriesBucket ?? "hour"}
                    />

                    <CoverageCard />

                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                        Request Log
                    </Typography>
                    <BaseCard sx={{ overflow: "hidden" }}>
                        <DataTable
                            columns={tableColumns}
                            data={metrics?.logs ?? []}
                            totalItems={totalCount}
                            page={page}
                            pageSize={pageSize}
                            onPageChange={setPage}
                            onPageSizeChange={setPageSize}
                            loading={loading}
                            actions={false}
                            showHeader={false}
                        />
                    </BaseCard>
                </>
            )}
        </Box>
    );
}
