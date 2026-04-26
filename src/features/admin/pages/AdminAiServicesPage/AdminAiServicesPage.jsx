import { useState, useEffect, useCallback } from "react";
import { Box, Grid, Typography, CircularProgress, Container } from "@mui/material";
import { RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { adminEndPoints } from "../../services/adminApi";
import AdminPageHeader from "../../../../common/components/admin/AdminPageHeader";
import BaseCard from "../../../../common/components/cards/BaseCard";
import SecondaryButton from "../../../../common/components/buttons/SecondaryButton";
import StatusChip from "../../../../common/components/StatusChip";
import SectionHeading from "../../../../common/components/SectionHeading";

const STATUS_COLOR = {
    Healthy: "success",
    Configured: "success",
    Degraded: "warning",
    Unreachable: "error",
    KeyMissing: "error",
};

function ServiceHealthCard({ service }) {
    const color = STATUS_COLOR[service.status] ?? "default";

    return (
        <BaseCard sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1, mr: 1 }}>
                    {service.serviceName}
                </Typography>
                <StatusChip label={service.status} color={color} />
            </Box>

            <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                    display: "block",
                    mb: 1.5,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                }}
                title={service.endpoint}
            >
                {service.endpoint}
            </Typography>

            <Box sx={{ display: "flex", gap: 3 }}>
                <Box>
                    <Typography variant="caption" color="text.disabled" sx={{ display: "block" }}>
                        Response
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                        {service.responseTimeMs > 0 ? `${service.responseTimeMs}ms` : "—"}
                    </Typography>
                </Box>
                <Box>
                    <Typography variant="caption" color="text.disabled" sx={{ display: "block" }}>
                        Requests
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                        {service.totalRequestsSinceStartup?.toLocaleString() ?? "0"}
                    </Typography>
                </Box>
                <Box>
                    <Typography variant="caption" color="text.disabled" sx={{ display: "block" }}>
                        Checked At
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                        {service.checkedAt ? new Date(service.checkedAt).toLocaleTimeString() : "—"}
                    </Typography>
                </Box>
            </Box>
        </BaseCard>
    );
}

export default function AdminAiServicesPage() {
    const [health, setHealth] = useState([]);
    const [config, setConfig] = useState([]);
    const [healthLoading, setHealthLoading] = useState(true);
    const [configLoading, setConfigLoading] = useState(true);

    const fetchHealth = useCallback(async () => {
        setHealthLoading(true);
        try {
            const res = await callApi({ method: METHOD.GET, endpoint: adminEndPoints.GET_AI_HEALTH });
            if (res?.success) {
                setHealth(Array.isArray(res.data) ? res.data : []);
            } else {
                toast.error("Failed to load AI service health.");
            }
        } catch {
            toast.error("Error fetching AI service health.");
        } finally {
            setHealthLoading(false);
        }
    }, []);

    const fetchConfig = useCallback(async () => {
        setConfigLoading(true);
        try {
            const res = await callApi({ method: METHOD.GET, endpoint: adminEndPoints.GET_AI_CONFIG });
            if (res?.success) {
                setConfig(Array.isArray(res.data) ? res.data : []);
            } else {
                toast.error("Failed to load AI configuration.");
            }
        } catch {
            toast.error("Error fetching AI configuration.");
        } finally {
            setConfigLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHealth();
        fetchConfig();
    }, [fetchHealth, fetchConfig]);

    const handleRefreshHealth = () => fetchHealth();

    return (
        <Container maxWidth="xl" className="admin-page" sx={{ py: 3 }}>
            <AdminPageHeader
                title="AI Services"
                subtitle="Live health status and read-only configuration for all AI integrations."
            />

            {/* Health Status Section */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <SectionHeading title="Health Status" size="sm" />
                    <SecondaryButton
                        size="md"
                        onClick={handleRefreshHealth}
                        disabled={healthLoading}
                        startIcon={<RefreshCw size={16} />}
                    >
                        Refresh
                    </SecondaryButton>
                </Box>

                {healthLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Grid container spacing={2.5}>
                        {health.map((svc) => (
                            <Grid key={svc.serviceName} size={{ xs: 12, sm: 6, lg: 3 }}>
                                <ServiceHealthCard service={svc} />
                            </Grid>
                        ))}
                        {health.length === 0 && (
                            <Grid size={{ xs: 12 }}>
                                <Typography color="text.secondary" variant="body2">
                                    No health data available.
                                </Typography>
                            </Grid>
                        )}
                    </Grid>
                )}
            </Box>

            {/* Configuration Section */}
            <Box>
                <SectionHeading title="Configuration (Read-only)" size="sm" />

                {configLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress size={28} />
                    </Box>
                ) : (
                    <BaseCard sx={{ overflow: "hidden" }}>
                        {/* Table Header */}
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: "1.5fr 1.5fr 2fr 1fr 1.5fr",
                                gap: 2,
                                px: 2.5,
                                py: 1.5,
                                bgcolor: "action.hover",
                                borderBottom: 1,
                                borderColor: "divider",
                            }}
                        >
                            {["Service", "Model", "Endpoint", "API Key", "Purpose"].map((h) => (
                                <Typography key={h} variant="caption" fontWeight={700} color="text.secondary">
                                    {h.toUpperCase()}
                                </Typography>
                            ))}
                        </Box>

                        {/* Table Rows */}
                        {config.map((item, idx) => (
                            <Box
                                key={item.serviceName}
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: "1.5fr 1.5fr 2fr 1fr 1.5fr",
                                    gap: 2,
                                    px: 2.5,
                                    py: 1.75,
                                    borderBottom: idx < config.length - 1 ? 1 : 0,
                                    borderColor: "divider",
                                    alignItems: "center",
                                    "&:hover": { bgcolor: "action.hover" },
                                }}
                            >
                                <Typography variant="body2" fontWeight={600}>
                                    {item.serviceName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {item.modelName}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        display: "block",
                                    }}
                                    title={item.endpoint}
                                >
                                    {item.endpoint}
                                </Typography>
                                <StatusChip
                                    label={item.hasApiKey ? "Configured" : "Missing"}
                                    color={item.hasApiKey ? "success" : "error"}
                                />
                                <Typography variant="body2" color="text.secondary">
                                    {item.purpose}
                                </Typography>
                            </Box>
                        ))}

                        {config.length === 0 && (
                            <Box sx={{ px: 2.5, py: 3 }}>
                                <Typography color="text.secondary" variant="body2">
                                    No configuration data available.
                                </Typography>
                            </Box>
                        )}
                    </BaseCard>
                )}
            </Box>
        </Container>
    );
}
