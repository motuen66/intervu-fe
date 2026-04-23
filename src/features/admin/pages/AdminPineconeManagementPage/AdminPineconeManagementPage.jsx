import { useState, useEffect, useCallback } from "react";
import { Box, Grid, Typography, Divider, CircularProgress, Container } from "@mui/material";
import { Database, Layers, RefreshCw } from "lucide-react";
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

export default function AdminPineconeManagementPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [syncingCoaches, setSyncingCoaches] = useState(false);
    const [syncingQuestions, setSyncingQuestions] = useState(false);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const res = await callApi({ method: METHOD.GET, endpoint: adminEndPoints.GET_PINECONE_STATS });
            if (res?.success) {
                setStats(res.data);
            } else {
                toast.error("Failed to load Pinecone stats.");
            }
        } catch {
            toast.error("Error fetching Pinecone stats.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const handleSync = async (namespace, setSyncing) => {
        setSyncing(true);
        try {
            const res = await callApi({
                method: METHOD.POST,
                endpoint: adminEndPoints.POST_PINECONE_SYNC,
                arg: { namespace },
            });
            if (res?.success) {
                toast.success(`Sync job for "${namespace}" queued successfully.`);
            } else {
                toast.error(res?.message || `Failed to queue sync for "${namespace}".`);
            }
        } catch {
            toast.error(`Error queuing sync for "${namespace}".`);
        } finally {
            setSyncing(false);
        }
    };

    const namespaceRows = stats?.namespaces ? Object.entries(stats.namespaces) : [];
    const namespaceCount = namespaceRows.length;

    return (
        <Container maxWidth="xl" className="admin-page" sx={{ py: 3 }}>
            <AdminPageHeader
                title="Pinecone Management"
                subtitle="Monitor vector index health and trigger manual re-sync operations."
                actionButton={
                    <SecondaryButton
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
                        icon={<Layers size={22} />}
                        iconColor="secondary"
                        label="Dimensions"
                        value={loading ? "—" : (stats?.dimension?.toLocaleString() ?? "—")}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <KpiCard
                        icon={<Database size={22} />}
                        iconColor="info"
                        label="Namespaces"
                        value={loading ? "—" : namespaceCount}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Namespace Breakdown */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <BaseCard sx={{ p: 3 }}>
                        <SectionHeading title="Namespace Breakdown" size="sm" />
                        {loading ? (
                            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                                <CircularProgress size={32} />
                            </Box>
                        ) : namespaceRows.length === 0 ? (
                            <Typography color="text.secondary" variant="body2">
                                No namespace data available.
                            </Typography>
                        ) : (
                            <Box>
                                {/* Header */}
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        px: 1.5,
                                        pb: 1,
                                        borderBottom: 1,
                                        borderColor: "divider",
                                    }}
                                >
                                    <Typography variant="caption" fontWeight={700} color="text.secondary">
                                        NAMESPACE
                                    </Typography>
                                    <Typography variant="caption" fontWeight={700} color="text.secondary">
                                        VECTOR COUNT
                                    </Typography>
                                </Box>
                                {namespaceRows.map(([ns, count], idx) => (
                                    <Box key={ns}>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                px: 1.5,
                                                py: 1.5,
                                            }}
                                        >
                                            <Typography
                                                variant="body2"
                                                fontWeight={500}
                                                sx={{ textTransform: "capitalize" }}
                                            >
                                                {ns}
                                            </Typography>
                                            <Typography variant="body2" fontWeight={700} color="primary.main">
                                                {count.toLocaleString()}
                                            </Typography>
                                        </Box>
                                        {idx < namespaceRows.length - 1 && <Divider />}
                                    </Box>
                                ))}
                                {stats?.fetchedAt && (
                                    <Typography
                                        variant="caption"
                                        color="text.disabled"
                                        sx={{ display: "block", mt: 2, px: 1.5 }}
                                    >
                                        Last fetched: {new Date(stats.fetchedAt).toLocaleString()}
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </BaseCard>
                </Grid>

                {/* Re-sync Controls */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <BaseCard sx={{ p: 3 }}>
                        <SectionHeading
                            title="Re-sync Vectors"
                            description="Enqueue a background job to rebuild the vector index for a namespace. The main thread returns immediately — sync runs via Hangfire."
                            size="sm"
                        />
                        <Box sx={{ mb: 1.5 }} />

                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    border: 1,
                                    borderColor: "divider",
                                    bgcolor: "action.hover",
                                }}
                            >
                                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                                    Coaches Namespace
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                                    Re-indexes all coach profiles for semantic search.
                                </Typography>
                                <PrimaryButton
                                    loading={syncingCoaches}
                                    onClick={() => handleSync("coaches", setSyncingCoaches)}
                                    fullWidth
                                >
                                    Re-sync Coaches
                                </PrimaryButton>
                            </Box>

                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    border: 1,
                                    borderColor: "divider",
                                    bgcolor: "action.hover",
                                }}
                            >
                                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                                    Questions Namespace
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                                    Re-indexes all question bank entries for semantic search.
                                </Typography>
                                <PrimaryButton
                                    loading={syncingQuestions}
                                    onClick={() => handleSync("questions", setSyncingQuestions)}
                                    fullWidth
                                >
                                    Re-sync Questions
                                </PrimaryButton>
                            </Box>
                        </Box>
                    </BaseCard>
                </Grid>
            </Grid>
        </Container>
    );
}
