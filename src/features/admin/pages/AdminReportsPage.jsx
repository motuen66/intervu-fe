import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Container,
    FormControl,
    MenuItem,
    Select,
    Typography,
} from "@mui/material";
import toast from "react-hot-toast";
import DataTable from "../components/DataTable";
import StatusChip from "../../../common/components/StatusChip";
import ConfirmModal from "../../../common/components/ConfirmModal";
import { DangerButton, SecondaryButton } from "../../../common/components/buttons";
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
        if (status === 0) return REPORT_STATUSES.PENDING;
        if (status === 1) return REPORT_STATUSES.REVIEWED;
        if (status === 2) return REPORT_STATUSES.DISMISSED;
    }

    const normalized = status.toString().trim().toLowerCase();
    if (normalized === "0") return REPORT_STATUSES.PENDING;
    if (normalized === "1") return REPORT_STATUSES.REVIEWED;
    if (normalized === "2") return REPORT_STATUSES.DISMISSED;

    return normalized;
};

const getRawStatus = (raw) => raw?.status ?? raw?.reportStatus ?? raw?.state ?? raw?.reportState;

const toStatusValueForRequest = (targetStatus, currentStatus) => {
    const normalizedTarget = normalizeStatusKey(targetStatus);
    const numberMap = {
        [REPORT_STATUSES.PENDING]: 0,
        [REPORT_STATUSES.REVIEWED]: 1,
        [REPORT_STATUSES.DISMISSED]: 2,
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
            });

            if (response?.success) {
                toast.success("Updated report status successfully");

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
            });

            if (response?.success) {
                toast.success("Question deleted successfully");
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

                    return (
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <SecondaryButton
                                disabled={!row?.id || !canReview || isUpdating || isDeletingQuestion}
                                loading={canReview && isUpdating}
                                onClick={() => handleUpdateStatus(row.id, "Reviewed", row.status)}
                                sx={{
                                    minWidth: 86,
                                    height: 30,
                                    borderRadius: "999px",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    px: 1.5,
                                }}
                            >
                                Reviewed
                            </SecondaryButton>
                            <DangerButton
                                disabled={!row?.id || !canDismiss || isUpdating || isDeletingQuestion}
                                loading={canDismiss && isUpdating}
                                onClick={() => handleUpdateStatus(row.id, "Dismissed", row.status)}
                                sx={{
                                    minWidth: 86,
                                    height: 30,
                                    borderRadius: "999px",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    px: 1.5,
                                    bgcolor: "secondary.main",
                                    color: "secondary.contrastText",
                                    "&:hover": {
                                        bgcolor: "secondary.dark",
                                    },
                                }}
                            >
                                Dismissed
                            </DangerButton>
                            <DangerButton
                                disabled={!row?.questionId || isDeletingQuestion || isUpdating}
                                loading={isDeletingQuestion}
                                onClick={() => openDeleteQuestionModal(row.questionId, row.questionTitle)}
                                sx={{
                                    minWidth: 120,
                                    height: 30,
                                    borderRadius: "999px",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    px: 1.5,
                                }}
                            >
                                Delete Question
                            </DangerButton>
                        </Box>
                    );
                },
            },
        ],
        [deletingQuestionIds, updatingIds],
    );

    return (
        <Container maxWidth="xl" className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h2 className="admin-page-title">Reports</h2>
                    <p className="admin-page-subtitle">Review and resolve question reports.</p>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-table-toolbar">
                    <div className="admin-toolbar-left">
                        <input
                            className="admin-search-input"
                            placeholder="Search by question or reporter"
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                        />
                        <FormControl size="small" sx={{ minWidth: 170 }}>
                            <Select
                                displayEmpty
                                value={statusFilter}
                                onChange={(event) => {
                                    setStatusFilter(event.target.value);
                                    setPage(0);
                                }}
                                sx={{
                                    height: 36,
                                    borderRadius: "10px",
                                    background:
                                        "linear-gradient(180deg, #ffffff 0%, #f7f8ff 100%)",
                                    boxShadow:
                                        "inset 0 0 0 1px rgba(255, 255, 255, 0.6), 0 6px 16px rgba(17, 24, 39, 0.06)",
                                    ".MuiSelect-select": {
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        color: "#1f2937",
                                        padding: "6px 10px",
                                    },
                                    "& .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "rgba(102, 126, 234, 0.25)",
                                    },
                                    "&:hover .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "rgba(102, 126, 234, 0.5)",
                                    },
                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "#4F46E5",
                                    },
                                }}
                            >
                                <MenuItem value={REPORT_STATUSES.ALL}>All status</MenuItem>
                                <MenuItem value={REPORT_STATUSES.PENDING}>Pending</MenuItem>
                                <MenuItem value={REPORT_STATUSES.REVIEWED}>Reviewed</MenuItem>
                                <MenuItem value={REPORT_STATUSES.DISMISSED}>Dismissed</MenuItem>
                            </Select>
                        </FormControl>
                    </div>
                </div>

                <DataTable
                    showHeader={false}
                    showIndex
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
            </div>

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
        </Container>
    );
}
