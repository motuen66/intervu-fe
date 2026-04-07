import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Container,
    FormControl,
    IconButton,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Select,
    Typography,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import BlockIcon from "@mui/icons-material/Block";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import toast from "react-hot-toast";
import DataTable from "../components/DataTable";
import StatusChip from "../../../common/components/StatusChip";
import ConfirmModal from "../../../common/components/ConfirmModal";
import ActionMenu from "../../../common/components/ActionMenu";
import { PrimaryButton } from "../../../common/components/buttons";
import { callApi } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";
import { adminEndPoints } from "../services/adminApi";
import "./AdminDashboard.css";

const REPORT_STATUSES = {
    ALL: "all",
    PENDING: "pending",
    REVIEWED: "reviewed",
    DISMISSED: "dismissed",
};

const statusToChipColor = {
    pending: "warning",
    reviewed: "success",
    dismissed: "error",
};

const normalizeStatusKey = (status) => {
    if (status === null || status === undefined) return "";

    if (typeof status === "number") {
        if (status === 1) return REPORT_STATUSES.PENDING;
        if (status === 2) return REPORT_STATUSES.REVIEWED;
        if (status === 3) return REPORT_STATUSES.DISMISSED;
    }

    const normalized = status.toString().trim().toLowerCase();
    if (normalized === "1") return REPORT_STATUSES.PENDING;
    if (normalized === "2") return REPORT_STATUSES.REVIEWED;
    if (normalized === "3") return REPORT_STATUSES.DISMISSED;

    return normalized;
};

const getRawStatus = (raw) => raw?.status ?? raw?.reportStatus ?? raw?.state ?? raw?.reportState;

const toStatusValueForRequest = (targetStatus, currentStatus) => {
    const normalizedTarget = normalizeStatusKey(targetStatus);
    const numberMap = {
        [REPORT_STATUSES.PENDING]: 1,
        [REPORT_STATUSES.REVIEWED]: 2,
        [REPORT_STATUSES.DISMISSED]: 3,
    };

    const currentIsNumeric =
        typeof currentStatus === "number" || ["0", "1", "2"].includes((currentStatus ?? "").toString().trim());

    if (currentIsNumeric) {
        return numberMap[normalizedTarget] ?? targetStatus;
    }

    return getStatusLabel(normalizedTarget);
};

const getStatusLabel = (status) => {
    const normalized = normalizeStatusKey(status);
    if (normalized === REPORT_STATUSES.PENDING) return "Pending";
    if (normalized === REPORT_STATUSES.REVIEWED) return "Reviewed";
    if (normalized === REPORT_STATUSES.DISMISSED) return "Dismissed";
    return "Unknown";
};

const normalizeReport = (raw) => ({
    id:
        raw?.id ||
        raw?.reportId ||
        raw?.questionReportId ||
        raw?.questionReport?.id ||
        raw?.questionReport?.reportId,
    questionId:
        raw?.questionId ||
        raw?.question?.id ||
        raw?.question?.questionId ||
        raw?.question?.Id ||
        raw?.question?.questionID,
    status: getRawStatus(raw),
    reason: raw?.reason,
    createdAt: raw?.createdAt,
    updatedAt: raw?.updatedAt,
    questionTitle: raw?.questionTitle || raw?.question?.title || "-",
    reporterName:
        raw?.reporterName || raw?.reporter?.fullName || raw?.reporter?.name || raw?.reporterUser?.fullName || "-",
});

export default function AdminReportsPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [reports, setReports] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState(REPORT_STATUSES.ALL);
    const [updatingIds, setUpdatingIds] = useState({});
    const [deletingQuestionIds, setDeletingQuestionIds] = useState({});
    const [deleteQuestionTarget, setDeleteQuestionTarget] = useState(null);
    const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
    const [actionMenuRow, setActionMenuRow] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(searchInput.trim());
            setPage(0);
        }, 400);

        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        fetchReports();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, searchTerm, statusFilter]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const params = [
                `page=${page + 1}`,
                `pageSize=${pageSize}`,
            ];

            if (statusFilter !== REPORT_STATUSES.ALL) {
                params.push(`status=${encodeURIComponent(getStatusLabel(statusFilter))}`);
            }

            if (searchTerm) {
                params.push(`search=${encodeURIComponent(searchTerm)}`);
            }

            const response = await callApi({
                method: METHOD.GET,
                endpoint: `${adminEndPoints.GET_QUESTION_REPORTS}?${params.join("&")}`,
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

    const handleUpdateStatus = async (reportId, status, currentStatus) => {
        if (!reportId) {
            toast.error("Cannot update report: missing report id");
            return;
        }

        setUpdatingIds((prev) => ({ ...prev, [reportId]: true }));
        try {
            const response = await callApi({
                method: METHOD.PUT,
                endpoint: adminEndPoints.UPDATE_QUESTION_REPORT_STATUS(reportId),
                arg: { status: toStatusValueForRequest(status, currentStatus) },
                displaySuccessMessage: true,
            });

            if (response?.success) {

                setReports((prev) =>
                    prev.map((item) =>
                        item.id === reportId
                            ? {
                                ...item,
                                status,
                                updatedAt: new Date().toISOString(),
                            }
                            : item,
                    ),
                );

                // Keep list in sync with server-side filters/pagination after optimistic UI update.
                fetchReports();
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to update report status");
        } finally {
            setUpdatingIds((prev) => ({ ...prev, [reportId]: false }));
        }
    };

    const openDeleteQuestionModal = (questionId, questionTitle) => {
        if (!questionId) {
            toast.error("Cannot delete question: missing question id");
            return;
        }

        setDeleteQuestionTarget({ questionId, questionTitle });
    };

    const handleDeleteQuestion = async () => {
        const questionId = deleteQuestionTarget?.questionId;
        if (!questionId) {
            setDeleteQuestionTarget(null);
            return;
        }

        setDeletingQuestionIds((prev) => ({ ...prev, [questionId]: true }));
        try {
            const response = await callApi({
                method: METHOD.DELETE,
                endpoint: adminEndPoints.DELETE_QUESTION(questionId),
                displaySuccessMessage: true,
            });

            if (response?.success) {
                fetchReports();
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to delete question");
        } finally {
            setDeletingQuestionIds((prev) => ({ ...prev, [questionId]: false }));
            setDeleteQuestionTarget(null);
        }
    };

    const columns = useMemo(
        () => [
            {
                field: "questionTitle",
                headerName: "Question",
                render: (value, row) => (
                    <Typography
                        sx={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: row?.questionId ? "primary.main" : "text.primary",
                            maxWidth: 280,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            cursor: row?.questionId ? "pointer" : "default",
                            textDecoration: row?.questionId ? "underline" : "none",
                        }}
                        title={value || "-"}
                        onClick={() => {
                            if (row?.questionId) {
                                navigate(`/questions/${row.questionId}`);
                            }
                        }}
                    >
                        {value || "-"}
                    </Typography>
                ),
            },
            {
                field: "reporterName",
                headerName: "Reporter",
            },
            {
                field: "reason",
                headerName: "Reason",
                render: (value) => (
                    <Typography
                        sx={{
                            fontSize: "12px",
                            color: "text.secondary",
                            maxWidth: 320,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                        title={value || "-"}
                    >
                        {value || "-"}
                    </Typography>
                ),
            },
            {
                field: "status",
                headerName: "Status",
                render: (value) => {
                    const normalized = normalizeStatusKey(value);
                    return (
                        <StatusChip
                            label={getStatusLabel(normalized)}
                            color={statusToChipColor[normalized] || "default"}
                        />
                    );
                },
            },
            {
                field: "updatedAt",
                headerName: "Updated At",
                render: (_, row) => {
                    const source = row?.updatedAt || row?.createdAt;
                    if (!source) return "-";

                    const date = new Date(source);
                    if (Number.isNaN(date.getTime())) return "-";

                    return date.toLocaleString("vi-VN");
                },
            },
            {
                field: "actions",
                headerName: "Actions",
                render: (_, row) => {
                    const status = normalizeStatusKey(row?.status);
                    const canReview = status !== REPORT_STATUSES.REVIEWED && status !== REPORT_STATUSES.DISMISSED;
                    const canDismiss = status !== REPORT_STATUSES.DISMISSED;
                    const isUpdating = !!updatingIds[row?.id];
                    const isDeletingQuestion = !!deletingQuestionIds[row?.questionId];
                    const isBusy = isUpdating || isDeletingQuestion;

                    return (
                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                            <IconButton
                                size="small"
                                disabled={isBusy}
                                onClick={(e) => {
                                    setActionMenuAnchor(e.currentTarget);
                                    setActionMenuRow(row);
                                }}
                                sx={{
                                    bgcolor: "action.hover",
                                    borderRadius: "10px",
                                    height: 32,
                                    width: 32,
                                    "&:hover": { bgcolor: "divider" },
                                }}
                            >
                                <MoreVertIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    );
                },
            },
        ],
        [deletingQuestionIds, updatingIds],
    );

    const menuRow = actionMenuRow;
    const menuStatus = normalizeStatusKey(menuRow?.status);
    const menuCanReview = menuStatus !== REPORT_STATUSES.REVIEWED && menuStatus !== REPORT_STATUSES.DISMISSED;
    const menuCanDismiss = menuStatus !== REPORT_STATUSES.DISMISSED;

    const handleCloseMenu = () => {
        setActionMenuAnchor(null);
        setActionMenuRow(null);
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }} className="admin-page">
            <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                    <Typography
                        variant="h4"
                        sx={{ fontWeight: 800, color: "text.primary", letterSpacing: "-0.02em", mb: 0.5 }}
                    >
                        Question Reports
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
                        Monitor and resolve reports submitted for interview questions.
                    </Typography>
                </Box>
                <PrimaryButton
                    startIcon={<RefreshIcon />}
                    onClick={fetchReports}
                    sx={{ borderRadius: "12px", px: 3, py: 1 }}
                >
                    Refresh
                </PrimaryButton>
            </Box>

            <Box sx={{ p: 0, overflow: "hidden" }} className="admin-card">
                <Box sx={{ mb: 2.5, display: "flex", gap: 2, alignItems: "center" }}>
                    <Box sx={{ position: "relative", flex: 1, maxWidth: "400px" }}>
                        <SearchIcon
                            sx={{
                                position: "absolute",
                                left: 14,
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: "text.disabled",
                                fontSize: 20,
                            }}
                        />
                        <input
                            className="admin-search-input"
                            placeholder="Search by question or reporter"
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            style={{
                                paddingLeft: "44px",
                                height: "44px",
                                borderRadius: "12px",
                                fontSize: "14px",
                                width: "100%",
                                border: "1px solid",
                                borderColor: "#E2E8F0",
                                background: "#fff",
                                fontWeight: 500,
                                outline: "none",
                            }}
                        />
                    </Box>
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                            <Select
                                displayEmpty
                                value={statusFilter}
                                onChange={(event) => {
                                    setStatusFilter(event.target.value);
                                    setPage(0);
                                }}
                                startAdornment={<FilterListIcon sx={{ color: "text.disabled", mr: 1, fontSize: 18 }} />}
                                sx={{
                                    height: 44,
                                    borderRadius: "12px",
                                    bgcolor: "#fff",
                                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E2E8F0" },
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    color: "text.primary",
                                }}
                            >
                                <MenuItem value={REPORT_STATUSES.ALL}>All status</MenuItem>
                                <MenuItem value={REPORT_STATUSES.PENDING}>Pending</MenuItem>
                                <MenuItem value={REPORT_STATUSES.REVIEWED}>Reviewed</MenuItem>
                                <MenuItem value={REPORT_STATUSES.DISMISSED}>Dismissed</MenuItem>
                            </Select>
                    </FormControl>
                </Box>

                <DataTable
                    showHeader={false}
                    actions={false}
                    columns={columns}
                    data={reports}
                    totalItems={totalItems}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={(newPage) => setPage(newPage)}
                    onPageSizeChange={(newPageSize) => {
                        setPageSize(newPageSize);
                        setPage(0);
                    }}
                    loading={loading}
                />
            </Box>

            <ConfirmModal
                show={!!deleteQuestionTarget}
                title="Delete question"
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDeleteQuestion}
                onCancel={() => setDeleteQuestionTarget(null)}
                message={
                    <>
                        Are you sure you want to delete <strong>{deleteQuestionTarget?.questionTitle || "this question"}</strong>?{"\n\n"}
                        <span style={{ color: "#d32f2f", fontSize: "0.875rem" }}>This action cannot be undone.</span>
                    </>
                }
            />

            <ActionMenu
                anchorEl={actionMenuAnchor}
                open={Boolean(actionMenuAnchor)}
                onClose={handleCloseMenu}
            >
                <MenuItem
                    disabled={!menuCanReview}
                    onClick={() => {
                        handleUpdateStatus(menuRow.id, "Reviewed", menuRow.status);
                        handleCloseMenu();
                    }}
                >
                    <ListItemIcon>
                        <CheckCircleOutlineIcon fontSize="small" sx={{ color: "success.main" }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Reviewed"
                        primaryTypographyProps={{ fontSize: "13px", fontWeight: 600 }}
                    />
                </MenuItem>
                <MenuItem
                    disabled={!menuCanDismiss}
                    onClick={() => {
                        handleUpdateStatus(menuRow.id, "Dismissed", menuRow.status);
                        handleCloseMenu();
                    }}
                >
                    <ListItemIcon>
                        <BlockIcon fontSize="small" sx={{ color: "warning.main" }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Dismissed"
                        primaryTypographyProps={{ fontSize: "13px", fontWeight: 600 }}
                    />
                </MenuItem>
                <MenuItem
                    disabled={!menuRow?.questionId}
                    onClick={() => {
                        openDeleteQuestionModal(menuRow.questionId, menuRow.questionTitle);
                        handleCloseMenu();
                    }}
                    sx={{ color: "error.main" }}
                >
                    <ListItemIcon>
                        <DeleteOutlineIcon fontSize="small" sx={{ color: "error.main" }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Delete Question"
                        primaryTypographyProps={{ fontSize: "13px", fontWeight: 600 }}
                    />
                </MenuItem>
            </ActionMenu>
        </Container>
    );
}
