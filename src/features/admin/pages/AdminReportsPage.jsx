import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    MenuItem,
    Select,
    TextField,
    Typography,
} from "@mui/material";
import GavelIcon from "@mui/icons-material/Gavel";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloseIcon from "@mui/icons-material/Close";
import toast from "react-hot-toast";

import AdminPageHeader from "../../../common/components/admin/AdminPageHeader";
import SearchInput from "../../../common/components/admin/SearchInput";
import FilterDropdown from "../../../common/components/admin/FilterDropdown";
import TableActionsMenu from "../../../common/components/table/TableActionsMenu";
import DataTable from "../../../common/components/table/DataTable";
import StatusChip from "../../../common/components/StatusChip";
import { PrimaryButton, SecondaryButton } from "../../../common/components/buttons";
import useTableState from "../../../hooks/useTableState";

import { callApi } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";
import { adminEndPoints } from "../services/adminApi";
import { dialogStyles } from "../../../common/constants/uiStyles";
import "./AdminDashboard.css";

// Backend QuestionReportStatus: Pending=1, Resolved=2, Dismissed=3
const REPORT_STATUS = {
    PENDING: 1,
    RESOLVED: 2,
    DISMISSED: 3,
};

const REPORT_STATUS_KEY = {
    ALL: "all",
    PENDING: "pending",
    RESOLVED: "resolved",
    DISMISSED: "dismissed",
};

// Backend ResolutionAction: NoAction=0, DeactivateQuestion=1, EditQuestion=2
const RESOLUTION_ACTION = {
    NoAction: 0,
    DeactivateQuestion: 1,
    EditQuestion: 2,
};

const statusKeyToChipColor = {
    [REPORT_STATUS_KEY.PENDING]: "warning",
    [REPORT_STATUS_KEY.RESOLVED]: "success",
    [REPORT_STATUS_KEY.DISMISSED]: "error",
};

const normalizeStatusKey = (status) => {
    if (status === null || status === undefined) return "";
    if (typeof status === "number") {
        if (status === REPORT_STATUS.PENDING) return REPORT_STATUS_KEY.PENDING;
        if (status === REPORT_STATUS.RESOLVED) return REPORT_STATUS_KEY.RESOLVED;
        if (status === REPORT_STATUS.DISMISSED) return REPORT_STATUS_KEY.DISMISSED;
    }
    const normalized = status.toString().trim().toLowerCase();
    if (normalized === "1" || normalized === "pending") return REPORT_STATUS_KEY.PENDING;
    if (normalized === "2" || normalized === "resolved" || normalized === "reviewed") return REPORT_STATUS_KEY.RESOLVED;
    if (normalized === "3" || normalized === "dismissed") return REPORT_STATUS_KEY.DISMISSED;
    return normalized;
};

const getStatusLabel = (status) => {
    const normalized = normalizeStatusKey(status);
    if (normalized === REPORT_STATUS_KEY.PENDING) return "Pending";
    if (normalized === REPORT_STATUS_KEY.RESOLVED) return "Resolved";
    if (normalized === REPORT_STATUS_KEY.DISMISSED) return "Dismissed";
    return "Unknown";
};

const statusKeyToNumber = {
    [REPORT_STATUS_KEY.PENDING]: REPORT_STATUS.PENDING,
    [REPORT_STATUS_KEY.RESOLVED]: REPORT_STATUS.RESOLVED,
    [REPORT_STATUS_KEY.DISMISSED]: REPORT_STATUS.DISMISSED,
};

const getRawStatus = (raw) => raw?.status ?? raw?.reportStatus ?? raw?.state ?? raw?.reportState;

const normalizeReport = (raw) => ({
    id: raw?.id || raw?.reportId || raw?.questionReportId || raw?.questionReport?.id || raw?.questionReport?.reportId,
    questionId: raw?.questionId || raw?.question?.id || raw?.question?.questionId || raw?.question?.Id || raw?.question?.questionID,
    status: getRawStatus(raw),
    reason: raw?.reason,
    expectTo: raw?.expectTo,
    createdAt: raw?.createdAt,
    updatedAt: raw?.updatedAt,
    questionTitle: raw?.questionTitle || raw?.question?.title || "-",
    reporterName: raw?.reporterName || raw?.reporter?.fullName || raw?.reporter?.name || raw?.reporterUser?.fullName || "-",
});

const HOUR_MS = 1000 * 60 * 60;

const getSlaRowSx = (createdAt, statusKey) => {
    if (statusKey !== REPORT_STATUS_KEY.PENDING || !createdAt) return undefined;
    const created = new Date(createdAt).getTime();
    if (Number.isNaN(created)) return undefined;
    const hours = (Date.now() - created) / HOUR_MS;
    if (hours > 72) return { bgcolor: "error.light" };
    if (hours > 48) return { bgcolor: "warning.main", "& *": { color: "warning.contrastText" } };
    if (hours > 24) return { bgcolor: "warning.light" };
    return undefined;
};

const RESOLVE_OPTIONS = [
    { key: "deactivate", label: "Deactivate question", status: REPORT_STATUS.RESOLVED, action: RESOLUTION_ACTION.DeactivateQuestion },
    { key: "dismiss", label: "Dismiss report", status: REPORT_STATUS.DISMISSED, action: RESOLUTION_ACTION.NoAction },
];

export default function AdminReportsPage() {
    const navigate = useNavigate();

    const {
        data: reports, setData: setReports,
        loading, setLoading,
        page, setPage,
        pageSize, setPageSize,
        totalItems, setTotalItems,
        handlePageChange, handlePageSizeChange
    } = useTableState(10);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState(REPORT_STATUS_KEY.ALL);

    const [resolveTarget, setResolveTarget] = useState(null);
    const [resolveOptionKey, setResolveOptionKey] = useState(RESOLVE_OPTIONS[0].key);
    const [resolveNote, setResolveNote] = useState("");
    const [resolveSubmitting, setResolveSubmitting] = useState(false);

    useEffect(() => {
        fetchReports();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, searchTerm, statusFilter]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const params = [`page=${page + 1}`, `pageSize=${pageSize}`];
            if (statusFilter !== REPORT_STATUS_KEY.ALL) {
                params.push(`status=${encodeURIComponent(getStatusLabel(statusFilter))}`);
            }
            if (searchTerm) {
                params.push(`search=${encodeURIComponent(searchTerm)}`);
            }
            const response = await callApi({
                method: METHOD.GET,
                endpoint: `${adminEndPoints.GET_QUESTION_REPORTS}?${params.join("&")}`,
                useGlobalLoading: false,
            });
            if (response?.success) {
                const items = response?.data?.items || response?.data?.reports || [];
                setReports(Array.isArray(items) ? items.map(normalizeReport) : []);
                setTotalItems(response?.data?.totalItems || response?.data?.total || 0);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to load reports");
        } finally {
            setLoading(false);
        }
    };

    const openResolveModal = (row) => {
        if (!row?.id) {
            toast.error("Cannot resolve: missing report id");
            return;
        }
        setResolveTarget(row);
        setResolveOptionKey(RESOLVE_OPTIONS[0].key);
        setResolveNote("");
    };

    const closeResolveModal = () => {
        if (resolveSubmitting) return;
        setResolveTarget(null);
        setResolveNote("");
    };

    const submitResolve = async () => {
        if (!resolveTarget?.id) return;
        const option = RESOLVE_OPTIONS.find((o) => o.key === resolveOptionKey) || RESOLVE_OPTIONS[0];
        const note = resolveNote.trim();
        if (!note) {
            toast.error("Resolution note is required.");
            return;
        }

        setResolveSubmitting(true);
        try {
            const response = await callApi({
                method: METHOD.PUT,
                endpoint: adminEndPoints.UPDATE_QUESTION_REPORT_STATUS(resolveTarget.id),
                arg: {
                    status: option.status,
                    actionTaken: option.action,
                    resolutionNote: note,
                },
                displaySuccessMessage: true,
            });

            if (response?.success) {
                setReports((prev) =>
                    prev.map((item) =>
                        item.id === resolveTarget.id
                            ? { ...item, status: option.status, updatedAt: new Date().toISOString() }
                            : item
                    )
                );
                setResolveTarget(null);
                setResolveNote("");
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to resolve report");
        } finally {
            setResolveSubmitting(false);
        }
    };

    const handleSearchChange = (val) => {
        setSearchTerm(val);
        setPage(0);
    };

    const handleStatusFilterChange = (val) => {
        setStatusFilter(val);
        setPage(0);
    };

    const statusOptions = [
        { label: 'Pending', value: REPORT_STATUS_KEY.PENDING },
        { label: 'Resolved', value: REPORT_STATUS_KEY.RESOLVED },
        { label: 'Dismissed', value: REPORT_STATUS_KEY.DISMISSED }
    ];

    const columns = useMemo(() => [
        {
            field: "questionTitle",
            headerName: "Question",
            render: (value, row) => (
                <Typography
                    sx={{
                        fontSize: "12px", fontWeight: 600,
                        color: row?.questionId ? "primary.main" : "text.primary",
                        maxWidth: 280, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        cursor: row?.questionId ? "pointer" : "default",
                        textDecoration: row?.questionId ? "underline" : "none",
                    }}
                    title={value || "-"}
                    onClick={() => { if (row?.questionId) navigate(`/questions/${row.questionId}`); }}
                >
                    {value || "-"}
                </Typography>
            ),
        },
        { field: "reporterName", headerName: "Reporter" },
        {
            field: "reason",
            headerName: "Reason",
            render: (value) => (
                <Typography sx={{ fontSize: "12px", color: "text.secondary", maxWidth: 320, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={value || "-"}>
                    {value || "-"}
                </Typography>
            ),
        },
        {
            field: "expectTo",
            headerName: "Expected Action",
            render: (value) => (
                <Typography sx={{ fontSize: "12px", color: "text.secondary", maxWidth: 260, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={value || "-"}>
                    {value || "-"}
                </Typography>
            ),
        },
        {
            field: "status",
            headerName: "Status",
            render: (value) => {
                const normalized = normalizeStatusKey(value);
                return <StatusChip label={getStatusLabel(normalized)} color={statusKeyToChipColor[normalized] || "default"} />;
            },
        },
        {
            field: "createdAt",
            headerName: "Reported At",
            render: (value) => {
                if (!value) return "-";
                const date = new Date(value);
                return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("vi-VN");
            },
        },
        {
            field: "actions",
            headerName: "Actions",
            render: (_, row) => {
                const status = normalizeStatusKey(row?.status);
                const canResolve = status === REPORT_STATUS_KEY.PENDING;

                const actions = [
                    {
                        label: 'Resolve report',
                        icon: <GavelIcon fontSize="small" sx={{ color: "primary.main" }} />,
                        onClick: () => openResolveModal(row),
                        show: canResolve,
                    },
                ];

                return <Box sx={{ display: "flex", justifyContent: "center" }}><TableActionsMenu actions={actions} /></Box>;
            },
        },
    ], [navigate]);

    const getRowSx = (row) => getSlaRowSx(row?.createdAt, normalizeStatusKey(row?.status));

    const selectedOption = RESOLVE_OPTIONS.find((o) => o.key === resolveOptionKey) || RESOLVE_OPTIONS[0];

    return (
        <Container maxWidth="xl" sx={{ py: 3 }} className="admin-page">
            <AdminPageHeader
                title="Question Reports"
                subtitle="Monitor and resolve reports submitted for interview questions."
                actionButton={
                    <PrimaryButton startIcon={<RefreshIcon />} onClick={fetchReports}>
                        Refresh
                    </PrimaryButton>
                }
            />

            <div className="admin-card">
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 2, alignItems: 'center', bgcolor: 'background.paper' }}>
                    <SearchInput placeholder="Search by question or reporter..." onSearch={handleSearchChange} />
                    <FilterDropdown placeholder="All status" options={statusOptions} value={statusFilter} onChange={handleStatusFilterChange} />
                </Box>

                <DataTable
                    showHeader={false}
                    showIndex
                    actions={false}
                    columns={columns}
                    data={reports}
                    totalItems={totalItems}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    loading={loading}
                    getRowSx={getRowSx}
                />
            </div>

            <Dialog
                open={!!resolveTarget}
                onClose={closeResolveModal}
                PaperProps={{ sx: dialogStyles.paper }}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>Resolve report</span>
                    <IconButton onClick={closeResolveModal} edge="end" sx={{ color: (theme) => theme.palette.grey[500] }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Typography sx={{ mb: 2, fontSize: 13, color: "text.secondary" }}>
                        Question: <strong>{resolveTarget?.questionTitle || "-"}</strong>
                    </Typography>

                    <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>Resolution action</Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <Select
                            size="small"
                            value={resolveOptionKey}
                            onChange={(e) => setResolveOptionKey(e.target.value)}
                        >
                            {RESOLVE_OPTIONS.map((opt) => (
                                <MenuItem key={opt.key} value={opt.key}>{opt.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
                        Resolution note <span style={{ color: "#d32f2f" }}>*</span>
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        maxRows={8}
                        placeholder="Describe the reasoning and outcome of this decision..."
                        value={resolveNote}
                        onChange={(e) => setResolveNote(e.target.value)}
                        inputProps={{ maxLength: 2000 }}
                    />
                    <Typography sx={{ mt: 1, fontSize: 12, color: "text.secondary" }}>
                        {selectedOption.status === REPORT_STATUS.RESOLVED
                            ? "The linked question will be hidden from the public bank."
                            : "No changes will be made to the linked question."}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
                    <SecondaryButton onClick={closeResolveModal} disabled={resolveSubmitting}>Cancel</SecondaryButton>
                    <PrimaryButton onClick={submitResolve} disabled={resolveSubmitting || !resolveNote.trim()}>
                        {resolveSubmitting ? "Submitting..." : "Submit"}
                    </PrimaryButton>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
