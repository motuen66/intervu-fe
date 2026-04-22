import { useState, useMemo, useEffect } from "react";
import { 
    Container, Box, Grid, Typography, MenuItem, Paper, Avatar, 
    Divider, Chip, InputAdornment
} from "@mui/material";
import { 
    Send, Users, UserCheck, ShieldAlert, Megaphone,
    ExternalLink, Clock
} from "lucide-react";
import CampaignIcon from "@mui/icons-material/Campaign";
import RateReviewIcon from "@mui/icons-material/RateReview";
import AccessAlarmIcon from "@mui/icons-material/AccessAlarm";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import RefreshIcon from "@mui/icons-material/Refresh";
import toast from "react-hot-toast";

import { callApi } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";
import { adminEndPoints } from "../services/adminApi";
import AdminPageHeader from "../../../common/components/admin/AdminPageHeader";
import BaseCard from "../../../common/components/cards/BaseCard";
import FormTextField from "../../../common/components/form/FormTextField";
import FormSelect from "../../../common/components/form/FormSelect";
import { PrimaryButton, SecondaryButton } from "../../../common/components/buttons";
import ConfirmModal from "../../../common/components/ConfirmModal";
import DataTable from "../../../common/components/table/DataTable";

const TARGET_OPTIONS = [
    { label: "All Users", value: "ALL", icon: Users },
    { label: "Coaches", value: "Coach", icon: UserCheck },
    { label: "Candidates", value: "Candidate", icon: Megaphone },
];

const NOTIFICATION_TYPES = [
    { label: "System Announcement", value: 10, icon: CampaignIcon, color: "#94a3b8", bg: "#f1f5f9" },
    { label: "Feedback Notification", value: 8, icon: RateReviewIcon, color: "#8b5cf6", bg: "#f5f3ff" },
    { label: "Interview Reminder", value: 7, icon: AccessAlarmIcon, color: "#3b82f6", bg: "#eff6ff" },
    { label: "AI Analysis Complete", value: 9, icon: AutoAwesomeIcon, color: "#10b981", bg: "#ecfdf5" },
];

const QUICK_LINKS = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "My Interviews", path: "/interview" },
    { label: "Booking Requests", path: "/booking-requests" },
    { label: "Questions", path: "/questions" },
    { label: "Roadmap", path: "/roadmap" },
    { label: "Settings", path: "/settings" },
];

const MAX_TITLE = 100;
const MAX_MESSAGE = 500;

export default function AdminBroadcastPage() {
    const [loading, setLoading] = useState(false);
    const [logsLoading, setLogsLoading] = useState(false);
    const [broadcastLogs, setBroadcastLogs] = useState([]);
    const [logsPage, setLogsPage] = useState(0);
    const [logsPageSize, setLogsPageSize] = useState(10);
    const [logsTotal, setLogsTotal] = useState(0);
    const [target, setTarget] = useState("ALL");
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [form, setForm] = useState({
        title: "",
        message: "",
        actionUrl: "",
        type: "",
    });

    const handleInputChange = (field) => (e) => {
        const value = field === "type"
            ? (e.target.value === "" ? "" : Number(e.target.value))
            : e.target.value;
        if (field === "title" && value.length > MAX_TITLE) return;
        if (field === "message" && value.length > MAX_MESSAGE) return;
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const fetchBroadcastLogs = async () => {
        setLogsLoading(true);
        try {
            const res = await callApi({
                method: METHOD.GET,
                endpoint: adminEndPoints.BROADCAST_LOGS(logsPage + 1, logsPageSize),
            });
            setBroadcastLogs(res?.data?.items || []);
            setLogsTotal(res?.data?.totalCount || 0);
        } catch (error) {
            console.error(error);
            setBroadcastLogs([]);
            setLogsTotal(0);
        } finally {
            setLogsLoading(false);
        }
    };

    useEffect(() => {
        fetchBroadcastLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [logsPage, logsPageSize]);

    const handleQuickLink = (path) => {
        setForm((prev) => ({ ...prev, actionUrl: path }));
    };

    const resetForm = () => {
        setForm({
            title: "",
            message: "",
            actionUrl: "",
            type: "",
        });
    };

    const handleSendClick = (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.message.trim() || !form.type) {
            toast.error("Title, Message and Notification Type are required.");
            return;
        }
        setConfirmOpen(true);
    };

    const handleConfirmSend = async () => {
        setConfirmOpen(false);
        setLoading(true);
        try {
            let endpoint;
            let payload = { ...form };

            if (target === "ALL") {
                endpoint = adminEndPoints.BROADCAST_ALL;
            } else {
                endpoint = adminEndPoints.BROADCAST_ROLE;
                payload.role = target;
            }

            const res = await callApi({
                method: METHOD.POST,
                endpoint,
                arg: payload,
            });

            if (res?.success) {
                toast.success("Broadcast published successfully!");
                resetForm();
                fetchBroadcastLogs();
            } else {
                toast.error(res?.message || "Failed to publish broadcast.");
            }
        } catch (err) {
            console.error(err);
            toast.error("An error occurred while publishing the broadcast.");
        } finally {
            setLoading(false);
        }
    };

    const activeTypeConfig = useMemo(() => 
        NOTIFICATION_TYPES.find(t => t.value === form.type) || NOTIFICATION_TYPES[0]
    , [form.type]);

    const targetLabel = useMemo(
        () => TARGET_OPTIONS.find((t) => t.value === target)?.label || "All Users",
        [target]
    );

    const logColumns = useMemo(() => [
        {
            field: "createdAt",
            headerName: "Sent At",
            render: (value) => (
                <Typography variant="caption" color="text.secondary">
                    {value ? new Date(value).toLocaleString() : "-"}
                </Typography>
            ),
        },
        {
            field: "type",
            headerName: "Type",
            render: (value) => (
                <Chip size="small" label={value || "-"} variant="outlined" sx={{ fontWeight: 600 }} />
            ),
        },
        {
            field: "title",
            headerName: "Title",
            render: (value) => (
                <Typography sx={{ fontSize: 12, fontWeight: 700, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {value || "-"}
                </Typography>
            ),
        },
        {
            field: "message",
            headerName: "Message",
            render: (value) => (
                <Typography sx={{ fontSize: 12, color: "text.secondary", maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {value || "-"}
                </Typography>
            ),
        },
        {
            field: "audience",
            headerName: "Recipients",
            render: (_, row) => (
                <Typography sx={{ fontSize: 12 }}>
                    Total: <strong>{row?.totalRecipients || 0}</strong> • Candidate: {row?.candidateRecipients || 0} • Coach: {row?.coachRecipients || 0}
                </Typography>
            ),
        },
        {
            field: "actionUrl",
            headerName: "Action URL",
            render: (value) => (
                <Typography sx={{ fontSize: 12, color: value ? "primary.main" : "text.disabled", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {value || "-"}
                </Typography>
            ),
        },
    ], []);

    return (
        <Container maxWidth="xl" className="admin-page" sx={{ py: { xs: 2, md: 3 } }}>
            <AdminPageHeader
                title="Publish Notification"
                subtitle="Broadcast critical updates and system announcements to your platform users."
            />

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.45fr) minmax(0, 1fr)" },
                    gap: { xs: 2.5, md: 3 },
                    alignItems: "start",
                }}
            >
                {/* Left: Configuration Form */}
                <Box sx={{ minWidth: 0 }}>
                    <BaseCard sx={{ p: { xs: 2, sm: 3, md: 3.5 }, borderRadius: "16px" }}>
                        <form onSubmit={handleSendClick}>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                                {/* Recipient Selection */}
                                <Grid container spacing={2.5} alignItems="flex-start">
                                    <Grid item xs={12} lg={8}>
                                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1.5, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                            Target Audience
                                        </Typography>
                                        <Grid container spacing={2}>
                                            {TARGET_OPTIONS.map((opt) => {
                                                const Icon = opt.icon;
                                                const isSelected = target === opt.value;
                                                return (
                                                    <Grid item xs={12} sm={6} md={4} key={opt.value}>
                                                        <Paper
                                                            onClick={() => setTarget(opt.value)}
                                                            elevation={0}
                                                            sx={{
                                                                p: 1,
                                                                border: "2px solid",
                                                                borderColor: isSelected ? "primary.main" : "divider",
                                                                borderRadius: "12px",
                                                                cursor: "pointer",
                                                                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                                                bgcolor: isSelected ? "rgba(99, 102, 241, 0.06)" : "common.white",
                                                                "&:hover": {
                                                                    borderColor: isSelected ? "primary.main" : "primary.light",
                                                                    transform: "translateY(-1px)",
                                                                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                                                                },
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "space-between",
                                                                gap: 1,
                                                                minHeight: 56,
                                                                width: "100%",
                                                            }}
                                                        >
                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                                <Avatar
                                                                    sx={{
                                                                        bgcolor: isSelected ? "primary.main" : "grey.100",
                                                                        color: isSelected ? "common.white" : "text.secondary",
                                                                        width: 26,
                                                                        height: 26,
                                                                    }}
                                                                >
                                                                    <Icon size={14} />
                                                                </Avatar>
                                                                <Typography
                                                                    variant="body2"
                                                                    fontWeight={isSelected ? 700 : 600}
                                                                    color={isSelected ? "primary.main" : "text.secondary"}
                                                                    sx={{ whiteSpace: "nowrap" }}
                                                                >
                                                                    {opt.label}
                                                                </Typography>
                                                            </Box>
                                                            <Box
                                                                sx={{
                                                                    width: 10,
                                                                    height: 10,
                                                                    borderRadius: "50%",
                                                                    bgcolor: isSelected ? "primary.main" : "transparent",
                                                                    border: "1.5px solid",
                                                                    borderColor: isSelected ? "primary.main" : "divider",
                                                                    flexShrink: 0,
                                                                }}
                                                            />
                                                        </Paper>
                                                    </Grid>
                                                );
                                            })}
                                        </Grid>
                                    </Grid>

                                    <Grid item xs={12} lg={4}>
                                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1.5, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                            Notification Type
                                        </Typography>
                                        <Box sx={{ width: { xs: "100%", lg: 300 }, maxWidth: "100%" }}>
                                            <FormSelect
                                                size="medium"
                                                fullWidth
                                                displayEmpty
                                                value={form.type}
                                                onChange={handleInputChange("type")}
                                                renderValue={(selected) => {
                                                    if (selected === "") {
                                                        return (
                                                            <Typography color="text.disabled" sx={{ fontSize: 14 }}>
                                                                Select notification type
                                                            </Typography>
                                                        );
                                                    }
                                                    const selectedType = NOTIFICATION_TYPES.find((type) => type.value === selected);
                                                    if (!selectedType) {
                                                        return <Typography sx={{ fontSize: 14 }}>Select notification type</Typography>;
                                                    }
                                                    return (
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                            <selectedType.icon sx={{ fontSize: 18, color: selectedType.color }} />
                                                            <Typography sx={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                                {selectedType.label}
                                                            </Typography>
                                                        </Box>
                                                    );
                                                }}
                                                sx={{
                                                    "& .MuiSelect-select": {
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 1,
                                                        minHeight: "24px !important",
                                                        fontSize: 14,
                                                    },
                                                }}
                                            >
                                                <MenuItem value="" disabled>
                                                    <Typography color="text.disabled">Select notification type</Typography>
                                                </MenuItem>
                                                {NOTIFICATION_TYPES.map((type) => (
                                                    <MenuItem key={type.value} value={type.value} sx={{ py: 1 }}>
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                            <type.icon sx={{ fontSize: 18, color: type.color }} />
                                                            {type.label}
                                                        </Box>
                                                    </MenuItem>
                                                ))}
                                            </FormSelect>
                                        </Box>
                                    </Grid>
                                </Grid>

                                <Divider />

                                {/* Basic Info */}
                                <FormTextField
                                    size="medium"
                                    fullWidth
                                    label="Broadcast Title"
                                    placeholder="Summarize the update..."
                                    value={form.title}
                                    onChange={handleInputChange("title")}
                                    helperText={`${form.title.length}/${MAX_TITLE}`}
                                    sx={{
                                        "& .MuiInputBase-input": { fontSize: 15 },
                                    }}
                                    required
                                />

                                <FormTextField
                                    size="small"
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Detailed Message"
                                    placeholder="Enter the full content visible to users..."
                                    value={form.message}
                                    onChange={handleInputChange("message")}
                                    helperText={`${form.message.length}/${MAX_MESSAGE}`}
                                    required
                                />

                                <Box>
                                    <FormTextField
                                        size="small"
                                        fullWidth
                                        label="Action URL"
                                        placeholder="Internal or external link (optional)..."
                                        value={form.actionUrl}
                                        onChange={handleInputChange("actionUrl")}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <ExternalLink size={16} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                    <Box sx={{ mt: 1.5, display: "flex", flexWrap: "wrap", gap: 1 }}>
                                        <Typography variant="caption" sx={{ mr: 1, py: 0.5, fontWeight: 700, color: "text.secondary" }}>
                                            Quick Links:
                                        </Typography>
                                        {QUICK_LINKS.map(link => (
                                            <Chip
                                                key={link.path}
                                                label={link.label}
                                                size="small"
                                                onClick={() => handleQuickLink(link.path)}
                                                variant="outlined"
                                                sx={{ 
                                                    borderRadius: "6px", 
                                                    cursor: "pointer",
                                                    fontSize: "11px",
                                                    "&:hover": {
                                                        bgcolor: "action.hover",
                                                        color: "primary.main",
                                                        borderColor: "primary.main",
                                                    },
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </Box>

                                <Box
                                    sx={{
                                        mt: 1,
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        flexWrap: "wrap",
                                        gap: 1.5,
                                    }}
                                >
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                        Current target: {targetLabel}
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            gap: 1.5,
                                            width: { xs: "100%", sm: "auto" },
                                            flexDirection: { xs: "column", sm: "row" },
                                            "& > *": { width: { xs: "100%", sm: "auto" } },
                                            "& .MuiButton-root": { minHeight: 40 },
                                        }}
                                    >
                                        <SecondaryButton onClick={resetForm} disabled={loading}>
                                        Discard
                                        </SecondaryButton>
                                        <PrimaryButton
                                            type="submit"
                                            loading={loading}
                                            startIcon={<Send size={18} />}
                                        >
                                            Publish Notification
                                        </PrimaryButton>
                                    </Box>
                                </Box>
                            </Box>
                        </form>
                    </BaseCard>
                </Box>

                {/* Right: Authentic Preview */}
                <Box sx={{ minWidth: 0 }}>
                    <Box
                        sx={{
                            position: { xs: "static", xl: "sticky" },
                            top: { xl: 84 },
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                            width: "100%",
                            minWidth: 0,
                        }}
                    >
                        {/* Realistic Notification Dropdown Look */}
                        <Box sx={{ 
                            bgcolor: "common.white", 
                            borderRadius: "16px", 
                            overflow: "hidden",
                            boxShadow: "0 12px 48px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.05)",
                            border: "1px solid",
                            borderColor: "divider",
                            width: "100%",
                            minWidth: 0,
                        }}>
                            <Box sx={{ px: 2.5, pt: 2, pb: 1, borderBottom: "1px solid", borderColor: "divider", bgcolor: "grey.50" }}>
                                <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                    Live App Preview
                                </Typography>
                            </Box>

                            {/* Panel Header */}
                            <Box sx={{ p: 2.5, pb: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Typography variant="h6" sx={{ fontSize: "16px", fontWeight: 700 }}>Notifications</Typography>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: "primary.main", cursor: "pointer" }}>Mark all as read</Typography>
                            </Box>
                            
                            {/* Dummy Tab */}
                            <Box sx={{ px: 2, pb: 1.5, display: "flex", gap: 2, borderBottom: "1px solid", borderColor: "divider" }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, pb: 0.5, color: "primary.main", borderBottom: "2px solid", borderColor: "primary.main" }}>All</Typography>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled" }}>Unread</Typography>
                            </Box>

                            {/* Preview Item (Reflecting current state) */}
                            <Box sx={{ 
                                p: 2, 
                                display: "flex", 
                                gap: 1.75, 
                                bgcolor: "rgba(99, 102, 241, 0.06)", // Simulating unread
                                borderBottom: "1px solid",
                                borderColor: "divider"
                            }}>
                                <Avatar 
                                    sx={{ 
                                        bgcolor: activeTypeConfig.bg, 
                                        color: activeTypeConfig.color, 
                                        width: 44, 
                                        height: 44,
                                        flexShrink: 0
                                    }}
                                >
                                    <activeTypeConfig.icon sx={{ fontSize: 22 }} />
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box sx={{ mb: 0.75 }}>
                                        <Chip size="small" label={targetLabel} variant="outlined" sx={{ height: 20, fontSize: 11 }} />
                                    </Box>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 800, fontSize: "14px", lineHeight: 1.3 }}>
                                            {form.title || "Message Title"}
                                        </Typography>
                                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "primary.main", flexShrink: 0 }} />
                                    </Box>
                                    <Typography 
                                        variant="body2" 
                                        color="text.secondary"
                                        sx={{ 
                                            fontSize: "13px", 
                                            lineHeight: 1.4,
                                            display: "-webkit-box",
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                            mb: 1
                                        }}
                                    >
                                        {form.message || "Start typing your broadcast message to see how it looks for the users..."}
                                    </Typography>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                        <Clock size={12} color="#94a3b8" />
                                        <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 500 }}>
                                            Just now
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>

                            {/* View All Footer */}
                            <Box sx={{ p: 1.5, textAlign: "center", bgcolor: "grey.50" }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>View All Notifications</Typography>
                            </Box>
                        </Box>

                        {/* Guidelines */}
                        <BaseCard sx={{ p: 2.5, borderLeft: "4px solid", borderLeftColor: "primary.main", borderRadius: "14px" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                <ShieldAlert size={16} color="#6366f1" />
                                <Typography variant="caption" fontWeight={800} sx={{ textTransform: "uppercase" }}>Delivery Checklist</Typography>
                            </Box>
                            <Box component="ul" sx={{ pl: 2, m: 0, display: "flex", flexDirection: "column", gap: 0.75 }}>
                                <Typography component="li" variant="caption" color="text.secondary">
                                    Target <strong>Coaches</strong> or <strong>Candidates</strong> specifically if the news isn't relevant to everyone.
                                </Typography>
                                <Typography component="li" variant="caption" color="text.secondary">
                                    Use the <strong>Quick Links</strong> to point users directly to new features or settings.
                                </Typography>
                                <Typography component="li" variant="caption" color="text.secondary">
                                    Keep title concise and action URL meaningful to improve click-through.
                                </Typography>
                            </Box>
                        </BaseCard>
                    </Box>
                </Box>
            </Box>

            <BaseCard sx={{ mt: 3, p: 0, borderRadius: "16px", overflow: "hidden" }}>
                <Box sx={{ px: 2.5, py: 1.75, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        Broadcast Logs
                    </Typography>
                    <SecondaryButton startIcon={<RefreshIcon />} onClick={fetchBroadcastLogs} disabled={logsLoading}>
                        Refresh
                    </SecondaryButton>
                </Box>
                <DataTable
                    title=""
                    columns={logColumns}
                    data={broadcastLogs}
                    totalItems={logsTotal}
                    page={logsPage}
                    pageSize={logsPageSize}
                    onPageChange={setLogsPage}
                    onPageSizeChange={(size) => {
                        setLogsPageSize(size);
                        setLogsPage(0);
                    }}
                    loading={logsLoading}
                    actions={false}
                    showIndex
                    showHeader={false}
                />
            </BaseCard>

            {/* Confirm Send Modal */}
            <ConfirmModal
                show={confirmOpen}
                title="Publish Global Notification"
                message={`Are you sure you want to broadcast this message to ${target === "ALL" ? "every user" : `all ${target} users`}? This will trigger push notifications for all targeted active sessions.`}
                onConfirm={handleConfirmSend}
                onCancel={() => setConfirmOpen(false)}
                confirmText={target === "ALL" ? "Broadcast to All" : `Broadcast to ${target}s`}
                cancelText="Let me double check"
            />
        </Container>
    );
}
