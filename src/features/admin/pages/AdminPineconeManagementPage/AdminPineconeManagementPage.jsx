import { useState, useEffect, useCallback } from "react";
import {
    Box,
    Grid,
    Typography,
    Divider,
    CircularProgress,
    Container,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Tooltip,
} from "@mui/material";
import { Database, Layers, RefreshCw, AlertTriangle, CheckCircle, XCircle, Trash2, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { adminEndPoints } from "../../services/adminApi";
import AdminPageHeader from "../../../../common/components/admin/AdminPageHeader";
import KpiCard from "../../../../common/components/cards/KpiCard";
import BaseCard from "../../../../common/components/cards/BaseCard";
import PrimaryButton from "../../../../common/components/buttons/PrimaryButton";
import SecondaryButton from "../../../../common/components/buttons/SecondaryButton";
import SectionHeading from "../../../../common/components/SectionHeading";
import DataTable from "../../../../common/components/table/DataTable";

const StatusBadge = ({ status }) => {
    switch (status) {
        case "Synced":
            return (
                <Chip
                    icon={<CheckCircle size={14} />}
                    label="Synced"
                    color="success"
                    size="small"
                    sx={{ fontWeight: 600 }}
                />
            );
        case "Excess":
            return (
                <Chip icon={<XCircle size={14} />} label="Excess" color="error" size="small" sx={{ fontWeight: 600 }} />
            );
        case "Stale":
            return (
                <Chip
                    icon={<AlertTriangle size={14} />}
                    label="Stale"
                    color="warning"
                    size="small"
                    sx={{ fontWeight: 600 }}
                />
            );
        default:
            return <Chip label={status || "Unknown"} size="small" />;
    }
};

export default function AdminPineconeManagementPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [syncingNs, setSyncingNs] = useState({});
    const [purgingNs, setPurgingNs] = useState({});

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const res = await callApi({ method: METHOD.GET, endpoint: adminEndPoints.GET_PINECONE_STATS });
            if (res?.success) {
                setStats(res.data);
            } else {
                toast.error("Could not retrieve vector statistics. Please try again later.");
            }
        } catch {
            toast.error("An unexpected error occurred while fetching vector stats.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const handleSync = async (namespace) => {
        setSyncingNs((prev) => ({ ...prev, [namespace]: true }));
        try {
            const res = await callApi({
                method: METHOD.POST,
                endpoint: adminEndPoints.POST_PINECONE_SYNC,
                arg: { namespace },
            });
            if (res?.success) {
                toast.success(`Vector sync started for "${namespace}". This process may take a few minutes.`);
                fetchStats();
            } else {
                toast.error(res?.message || `Unable to start sync for "${namespace}".`);
            }
        } catch {
            toast.error(`An unexpected error occurred while starting sync for "${namespace}".`);
        } finally {
            setSyncingNs((prev) => ({ ...prev, [namespace]: false }));
        }
    };

    const handlePurge = async (namespace) => {
        if (
            !window.confirm(
                `WARNING: Are you sure you want to PURGE all vectors in the "${namespace}" namespace? This action cannot be undone and will break semantic search until a re-sync is performed.`,
            )
        ) {
            return;
        }

        setPurgingNs((prev) => ({ ...prev, [namespace]: true }));
        try {
            const res = await callApi({
                method: METHOD.DELETE,
                endpoint: adminEndPoints.DELETE_PINECONE_NAMESPACE(namespace),
            });
            if (res?.success) {
                toast.success(`Successfully cleared all data from "${namespace}" namespace.`);
                fetchStats();
            } else {
                toast.error(res?.message || `Unable to purge "${namespace}".`);
            }
        } catch {
            toast.error(`An unexpected error occurred while purging "${namespace}".`);
        } finally {
            setPurgingNs((prev) => ({ ...prev, [namespace]: false }));
        }
    };

    const namespaceRows = stats?.namespaces
        ? Object.entries(stats.namespaces).sort(([a], [b]) => a.localeCompare(b))
        : [];

    const outOfSyncCount = namespaceRows.reduce((acc, [_, data]) => acc + Math.abs(data.delta), 0);

    return (
        <Container maxWidth="xl" className="admin-page" sx={{ py: 3 }}>
            <AdminPageHeader
                title="Pinecone Management"
                subtitle="Monitor vector index health, detect data drift between SQL and Vector DB, and trigger re-sync operations."
                actionButton={
                    <SecondaryButton
                        size="md"
                        onClick={fetchStats}
                        disabled={loading}
                        startIcon={<RefreshCw size={16} />}
                    >
                        Refresh
                    </SecondaryButton>
                }
            />

            {/* KPI Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <KpiCard
                        icon={<Database size={22} />}
                        iconColor="primary"
                        label="Total Vectors"
                        value={loading ? "—" : (stats?.totalVectorCount?.toLocaleString() ?? "—")}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <KpiCard
                        icon={<AlertTriangle size={22} />}
                        iconColor={outOfSyncCount > 0 ? "warning" : "success"}
                        label="Out-of-sync Records"
                        value={loading ? "—" : outOfSyncCount.toLocaleString()}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <KpiCard
                        icon={<Layers size={22} />}
                        iconColor="secondary"
                        label="Dimensions"
                        value={loading ? "—" : (stats?.dimension?.toLocaleString() ?? "—")}
                    />
                </Grid>
            </Grid>

            {/* Namespace Breakdown */}
            <BaseCard sx={{ p: 0 }}>
                <Box sx={{ p: 3, pb: 1 }}>
                    <SectionHeading
                        title="SQL vs Pinecone Comparison"
                        description="Compare record counts between the primary SQL database and the Pinecone vector index to detect data drift."
                        size="sm"
                    />
                </Box>
                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress size={32} />
                    </Box>
                ) : namespaceRows.length === 0 ? (
                    <Typography color="text.secondary" variant="body2" sx={{ p: 3 }}>
                        No namespace data available.
                    </Typography>
                ) : (
                    <Box sx={{ p: 0 }}>
                        <DataTable
                            columns={[
                                {
                                    field: "namespace",
                                    headerName: "Namespace",
                                    render: (val) => (
                                        <Box sx={{ fontWeight: 600, textTransform: "capitalize" }}>{val}</Box>
                                    ),
                                },
                                {
                                    field: "sqlCount",
                                    headerName: "SQL Count",
                                    render: (val) => (
                                        <Box sx={{ fontWeight: 500 }}>{Number(val ?? 0).toLocaleString()}</Box>
                                    ),
                                },
                                {
                                    field: "vectorCount",
                                    headerName: "Vector Count",
                                    render: (val) => (
                                        <Box sx={{ fontWeight: 500, color: "primary.main" }}>
                                            {Number(val ?? 0).toLocaleString()}
                                        </Box>
                                    ),
                                },
                                {
                                    field: "delta",
                                    headerName: "Delta",
                                    render: (val) => (
                                        <Box
                                            sx={{
                                                fontWeight: 700,
                                                color:
                                                    val === 0
                                                        ? "success.main"
                                                        : val > 0
                                                          ? "error.main"
                                                          : "warning.main",
                                            }}
                                        >
                                            {val > 0 ? `+${val}` : val}
                                        </Box>
                                    ),
                                },
                                {
                                    field: "status",
                                    headerName: "Status",
                                    render: (val) => <StatusBadge status={val} />,
                                },
                                {
                                    field: "actions",
                                    headerName: "Actions",
                                    render: (_, row) => (
                                        <Box sx={{ display: "flex", gap: 1 }}>
                                            <Tooltip title="Trigger Full Re-sync">
                                                <IconButton
                                                    color="primary"
                                                    size="small"
                                                    onClick={() => handleSync(row.namespace)}
                                                    disabled={syncingNs[row.namespace] || purgingNs[row.namespace]}
                                                >
                                                    {syncingNs[row.namespace] ? (
                                                        <CircularProgress size={16} />
                                                    ) : (
                                                        <Zap size={18} />
                                                    )}
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Purge Namespace (Delete All)">
                                                <IconButton
                                                    color="error"
                                                    size="small"
                                                    onClick={() => handlePurge(row.namespace)}
                                                    disabled={syncingNs[row.namespace] || purgingNs[row.namespace]}
                                                >
                                                    {purgingNs[row.namespace] ? (
                                                        <CircularProgress size={16} />
                                                    ) : (
                                                        <Trash2 size={18} />
                                                    )}
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    ),
                                },
                            ]}
                            data={namespaceRows.map(([ns, data]) => ({
                                id: ns,
                                namespace: ns,
                                sqlCount: data.sqlCount,
                                vectorCount: data.vectorCount,
                                delta: data.delta,
                                status: data.status,
                            }))}
                            totalItems={namespaceRows.length}
                            page={0}
                            pageSize={10}
                            loading={false}
                            actions={false}
                            showIndex={false}
                            showHeader={false}
                        />
                    </Box>
                )}
                {stats?.fetchedAt && (
                    <Box sx={{ p: 2, bgcolor: "action.hover", borderTop: 1, borderColor: "divider" }}>
                        <Typography variant="caption" color="text.secondary">
                            Last fetched: {new Date(stats.fetchedAt).toLocaleString()}
                        </Typography>
                    </Box>
                )}
            </BaseCard>
        </Container>
    );
}
