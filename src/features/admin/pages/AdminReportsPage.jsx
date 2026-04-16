import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Container, Typography } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import BlockIcon from "@mui/icons-material/Block";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import toast from "react-hot-toast";

import AdminPageHeader from "../../../common/components/admin/AdminPageHeader";
import SearchInput from "../../../common/components/admin/SearchInput";
import FilterDropdown from "../../../common/components/admin/FilterDropdown";
import TableActionsMenu from "../../../common/components/table/TableActionsMenu";
import DataTable from "../../../common/components/table/DataTable";
import StatusChip from "../../../common/components/StatusChip";
import ConfirmModal from "../../../common/components/ConfirmModal";
import { PrimaryButton } from "../../../common/components/buttons";
import useTableState from "../../../hooks/useTableState";

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
    const currentIsNumeric = typeof currentStatus === "number" || ["0", "1", "2"].includes((currentStatus ?? "").toString().trim());
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
    const [statusFilter, setStatusFilter] = useState(REPORT_STATUSES.ALL);
    
    // Deletion targets
    const [updatingIds, setUpdatingIds] = useState({});
    const [deletingQuestionIds, setDeletingQuestionIds] = useState({});
    const [deleteQuestionTarget, setDeleteQuestionTarget] = useState(null);

    useEffect(() => {
        fetchReports();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, searchTerm, statusFilter]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const params = [`page=${page + 1}`, `pageSize=${pageSize}`];
            if (statusFilter !== REPORT_STATUSES.ALL) {
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
                        item.id === reportId ? { ...item, status, updatedAt: new Date().toISOString() } : item
                    )
                );
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
        if (!questionId) return;

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

    const handleSearchChange = (val) => {
        setSearchTerm(val);
        setPage(0);
    };

    const handleStatusFilterChange = (val) => {
        setStatusFilter(val);
        setPage(0);
    };

    const statusOptions = [
        { label: 'Pending', value: REPORT_STATUSES.PENDING },
        { label: 'Reviewed', value: REPORT_STATUSES.REVIEWED },
        { label: 'Dismissed', value: REPORT_STATUSES.DISMISSED }
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
                return <StatusChip label={getStatusLabel(normalized)} color={statusToChipColor[normalized] || "default"} />;
            },
        },
        {
            field: "updatedAt",
            headerName: "Updated At",
            render: (_, row) => {
                const source = row?.updatedAt || row?.createdAt;
                if (!source) return "-";
                const date = new Date(source);
                return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("vi-VN");
            },
        },
        {
            field: "actions",
            headerName: "Actions",
            render: (_, row) => {
                const status = normalizeStatusKey(row?.status);
                const canReview = status !== REPORT_STATUSES.REVIEWED && status !== REPORT_STATUSES.DISMISSED;
                const canDismiss = status !== REPORT_STATUSES.DISMISSED;

                const actions = [
                    { 
                        label: 'Mark Reviewed', 
                        icon: <CheckCircleOutlineIcon fontSize="small" sx={{ color: "success.main" }} />, 
                        onClick: () => handleUpdateStatus(row.id, "Reviewed", row.status), 
                        show: canReview 
                    },
                    { 
                        label: 'Mark Dismissed', 
                        icon: <BlockIcon fontSize="small" sx={{ color: "warning.main" }} />, 
                        onClick: () => handleUpdateStatus(row.id, "Dismissed", row.status), 
                        show: canDismiss 
                    },
                    { 
                        label: 'Delete Question', 
                        icon: <DeleteOutlineIcon fontSize="small" sx={{ color: "error.main" }} />, 
                        onClick: () => openDeleteQuestionModal(row.questionId, row.questionTitle), 
                        show: !!row?.questionId, 
                        color: "error.main" 
                    }
                ];

                return <Box sx={{ display: "flex", justifyContent: "center" }}><TableActionsMenu actions={actions} /></Box>;
            },
        },
    ], [updatingIds, deletingQuestionIds, navigate]);

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
                <Box sx={{ p: 2, borderBottom: '1px solid #E2E8F0', display: 'flex', gap: 2, alignItems: 'center', bgcolor: '#fff' }}>
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