import { useState, useEffect, useCallback, useMemo } from "react";
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
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { RefreshCw, Zap, Clock, Hash, TrendingUp, Layers } from "lucide-react";
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

const USE_CASE_LABELS = {
    SmartSearchQuestion: "Smart Question Search",
    SmartSearchCoach: "Smart Coach Search",
    SmartSearchCvExtraction: "CV Extraction (Smart Search)",
    CvEvaluation: "Candidate CV Evaluation",
    CvExtraction: "CV Extraction",
    AutoAssessment: "Automated Interview Assessment",
    GenerateRoadmap: "Generate Learning Roadmap",
    UpdateRoadmapProgress: "Update Roadmap Progress",
    InterviewTranscript: "Interview Transcript",
};

const labelUseCase = (uc) => {
    if (!uc) return "(Unlabeled)";
    return USE_CASE_LABELS[uc] ?? uc;
};

function useUseCaseColors(useCases) {
    const theme = useTheme();
    return useMemo(() => {
        const palette = [
            theme.palette.primary.main,
            theme.palette.success.main,
            theme.palette.info.main,
            theme.palette.warning.main,
            theme.palette.secondary.main,
            theme.palette.error.main,
            theme.palette.primary.light,
            theme.palette.success.dark,
        ];
        const map = {};
        useCases.forEach((uc, i) => {
            map[uc] = palette[i % palette.length];
        });
        return map;
    }, [useCases, theme]);
}

function UseCaseLegend({ useCases }) {
    const theme = useTheme();
    const colorMap = useUseCaseColors(useCases);
    return (
        <BaseCard sx={{ p: 2, mb: 2.5 }}>
            <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", rowGap: 1, justifyContent: "flex-start" }}>
                <LegendSwatch color={theme.palette.text.disabled} label="REQUESTS" textColor={theme.palette.text.secondary} />
                {useCases.map((uc) => (
                    <LegendSwatch key={uc} color={colorMap[uc]} label={labelUseCase(uc)} textColor={theme.palette.text.primary} />
                ))}
            </Stack>
        </BaseCard>
    );
}

function UsagePieChart({ series, useCases }) {
    const theme = useTheme();
    const colorMap = useUseCaseColors(useCases);

    const data = useMemo(() => {
        const totals = {};
        useCases.forEach((uc) => {
            totals[uc] = 0;
        });
        (series ?? []).forEach((p) => {
            const counts = p.countByUseCase ?? {};
            useCases.forEach((uc) => {
                totals[uc] += Number(counts[uc] ?? 0);
            });
        });
        return useCases
            .map((uc) => ({ name: uc, label: labelUseCase(uc), value: totals[uc] }))
            .filter((d) => d.value > 0);
    }, [series, useCases]);

    const grandTotal = data.reduce((s, d) => s + d.value, 0);

    return (
        <BaseCard sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary", mb: 0.5 }}>
                Distribution by Feature
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2 }}>
                AI call ratio by use case
            </Typography>

            {grandTotal > 0 ? (
                <Box sx={{ width: "100%", height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                dataKey="value"
                                nameKey="label"
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={110}
                                paddingAngle={2}
                                stroke={theme.palette.background.paper}
                                strokeWidth={2}
                                isAnimationActive={false}
                            >
                                {data.map((entry) => (
                                    <Cell key={entry.name} fill={colorMap[entry.name]} />
                                ))}
                            </Pie>
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
                                formatter={(value, name) => {
                                    const pct = grandTotal > 0 ? ((value / grandTotal) * 100).toFixed(1) : 0;
                                    return [`${value} (${pct}%)`, name];
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </Box>
            ) : (
                <Box sx={{ height: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                        No traffic in this time range.
                    </Typography>
                </Box>
            )}
        </BaseCard>
    );
}

function UsageLineChart({ series, useCases, bucketUnit }) {
    const theme = useTheme();
    const colorMap = useUseCaseColors(useCases);

    const { data, keyMap } = useMemo(() => {
        const map = {};
        useCases.forEach((uc, i) => {
            map[uc] = `uc_${i}`;
        });
        const rows = (series ?? []).map((p) => {
            const bucketDate = new Date(p.bucket);
            const label =
                bucketUnit === "day"
                    ? bucketDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })
                    : bucketDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
            const row = { label };
            const counts = p.countByUseCase ?? {};
            useCases.forEach((uc) => {
                row[map[uc]] = Number(counts[uc] ?? 0);
            });
            return row;
        });
        return { data: rows, keyMap: map };
    }, [series, useCases, bucketUnit]);

    const hasData =
        useCases.length > 0 &&
        data.some((row) => useCases.some((uc) => (row[keyMap[uc]] ?? 0) > 0));

    return (
        <BaseCard sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary", mb: 0.5 }}>
                Traffic Over Time
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2 }}>
                AI calls by use case ({bucketUnit === "day" ? "daily" : "hourly"})
            </Typography>

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
                                    const uc = Object.entries(keyMap).find(([, v]) => v === name)?.[0] ?? name;
                                    return [value, labelUseCase(uc)];
                                }}
                            />
                            {useCases.map((uc) => (
                                <Line
                                    key={uc}
                                    type="monotone"
                                    dataKey={keyMap[uc]}
                                    name={keyMap[uc]}
                                    stroke={colorMap[uc]}
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
                        No traffic in this time range.
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
    const [useCaseFilter, setUseCaseFilter] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    const customRangeActive = Boolean(fromDate || toDate);

    const filters = useMemo(() => {
        const base = {
            page: page + 1,
            pageSize,
            provider: provider || undefined,
            useCase: useCaseFilter || undefined,
        };
        if (customRangeActive) {
            base.from = fromDate ? new Date(fromDate).toISOString() : undefined;
            base.to = toDate ? new Date(toDate).toISOString() : undefined;
        } else {
            base.timeframe = timeframe;
        }
        return base;
    }, [timeframe, provider, useCaseFilter, fromDate, toDate, page, pageSize, customRangeActive]);

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

    const handleTimeframeChange = (e) => {
        setTimeframe(e.target.value);
        setPage(0);
    };

    const handleProviderChange = (e) => {
        setProvider(e.target.value);
        setPage(0);
    };

    const handleUseCaseChange = (e) => {
        setUseCaseFilter(e.target.value);
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
                field: "useCase",
                headerName: "Feature",
                render: (value, row) => (
                    <Box>
                        <Typography variant="body2" fontWeight={600}>
                            {labelUseCase(value)}
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{ fontFamily: "monospace", fontSize: "0.68rem", color: "text.secondary" }}
                        >
                            {row.endpointName}
                        </Typography>
                    </Box>
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
                headerName: "Prompt tokens",
                render: (value) => (
                    <Typography variant="body2" fontWeight={600}>
                        {Number(value ?? 0).toLocaleString()}
                    </Typography>
                ),
            },
            {
                field: "completionTokens",
                headerName: "Completion tokens",
                render: (value) => (
                    <Typography variant="body2" fontWeight={600}>
                        {Number(value ?? 0).toLocaleString()}
                    </Typography>
                ),
            },
            {
                field: "totalTokens",
                headerName: "Total tokens",
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
                title="Python AI Service Monitoring"
                subtitle="Traffic, tokens, and latency by business use case."
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
                        <Tooltip title={customRangeActive ? "Disabled while using a custom range" : ""}>
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
                                <MenuItem value="">All</MenuItem>
                                {(metrics?.availableProviders ?? []).map((p) => (
                                    <MenuItem key={p} value={p}>
                                        {p}
                                    </MenuItem>
                                ))}
                            </FormSelect>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3, lg: 3 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel>Feature (Use Case)</InputLabel>
                            <FormSelect
                                value={useCaseFilter}
                                label="Feature (Use Case)"
                                onChange={handleUseCaseChange}
                            >
                                <MenuItem value="">All features</MenuItem>
                                {(metrics?.availableUseCases ?? []).map((uc) => (
                                    <MenuItem key={uc} value={uc}>
                                        {labelUseCase(uc)}
                                    </MenuItem>
                                ))}
                            </FormSelect>
                        </FormControl>
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
                                label="Total requests"
                                value={(metrics?.totalRequests ?? 0).toLocaleString()}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
                            <KpiCard
                                icon={<Zap size={22} />}
                                iconColor="warning"
                                label="Total tokens"
                                value={(metrics?.totalTokens ?? 0).toLocaleString()}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
                            <KpiCard
                                icon={<TrendingUp size={22} />}
                                iconColor="info"
                                label="Prompt tokens"
                                value={(metrics?.totalPromptTokens ?? 0).toLocaleString()}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
                            <KpiCard
                                icon={<Clock size={22} />}
                                iconColor="success"
                                label="Avg latency"
                                value={`${avgLatency}ms`}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
                            <KpiCard
                                icon={<Layers size={22} />}
                                iconColor="secondary"
                                label="Provider count"
                                value={(metrics?.serviceCount ?? 0).toLocaleString()}
                            />
                        </Grid>
                    </Grid>

                    <UseCaseLegend useCases={metrics?.seriesUseCases ?? []} />

                    <Grid container spacing={2.5} sx={{ mb: 4 }}>
                        <Grid size={{ xs: 12, lg: 8 }}>
                            <UsageLineChart
                                series={metrics?.useCaseSeries ?? []}
                                useCases={metrics?.seriesUseCases ?? []}
                                bucketUnit={metrics?.seriesBucket ?? "hour"}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, lg: 4 }}>
                            <UsagePieChart
                                series={metrics?.useCaseSeries ?? []}
                                useCases={metrics?.seriesUseCases ?? []}
                            />
                        </Grid>
                    </Grid>

                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                        Request logs
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
