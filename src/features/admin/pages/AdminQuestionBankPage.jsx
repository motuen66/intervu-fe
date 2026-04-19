import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Container, Tab, Tabs, Tooltip, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import BlockIcon from "@mui/icons-material/Block";
import toast from "react-hot-toast";

import AdminPageHeader from "../../../common/components/admin/AdminPageHeader";
import SearchInput from "../../../common/components/admin/SearchInput";
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

// Backend QuestionStatus: Pending=1, Approved=2, Rejected=3, Removed=4
const QUESTION_STATUS = {
    PENDING: 1,
    APPROVED: 2,
    REJECTED: 3,
    REMOVED: 4,
};

const TAB_KEYS = {
    PUBLISHED: "published",
    PENDING: "pending",
};

const formatEnumLabel = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    if (typeof value === "number") return `${value}`;
    const text = String(value).replace(/_/g, " ").trim();
    return text.charAt(0).toUpperCase() + text.slice(1);
};

export default function AdminQuestionBankPage() {
    const navigate = useNavigate();

    const {
        data: questions, setData: setQuestions,
        loading, setLoading,
        page, setPage,
        pageSize, setPageSize,
        totalItems, setTotalItems,
        handlePageChange, handlePageSizeChange
    } = useTableState(10);

    const [tab, setTab] = useState(TAB_KEYS.PUBLISHED);
    const [searchTerm, setSearchTerm] = useState("");
    const [moderationTarget, setModerationTarget] = useState(null);
    const [moderating, setModerating] = useState(false);

    const activeStatus = tab === TAB_KEYS.PENDING ? QUESTION_STATUS.PENDING : QUESTION_STATUS.APPROVED;

    useEffect(() => {
        fetchQuestions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, searchTerm, tab]);

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const response = await callApi({
                method: METHOD.GET,
                endpoint: adminEndPoints.GET_QUESTIONS,
                arg: {
                    page: page + 1,
                    pageSize,
                    status: activeStatus,
                    ...(searchTerm && { searchTerm }),
                },
                useGlobalLoading: false,
            });

            if (response?.success) {
                const items = response?.data?.items || [];
                setQuestions(Array.isArray(items) ? items : []);
                setTotalItems(response?.data?.totalItems || items.length || 0);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to load questions");
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (_, nextTab) => {
        if (!nextTab || nextTab === tab) return;
        setTab(nextTab);
        setPage(0);
    };

    const handleSearchChange = (val) => {
        setSearchTerm(val);
        setPage(0);
    };

    const openModerationModal = (row, action) => {
        if (!row?.id) return;
        setModerationTarget({
            id: row.id,
            title: row.title,
            action,
        });
    };

    const confirmModeration = async () => {
        if (!moderationTarget) return;
        const { id, action } = moderationTarget;
        const nextStatus = action === "approve" ? QUESTION_STATUS.APPROVED : QUESTION_STATUS.REJECTED;
        setModerating(true);
        try {
            const response = await callApi({
                method: METHOD.POST,
                endpoint: adminEndPoints.MODERATE_QUESTION(id),
                arg: { status: nextStatus },
                displaySuccessMessage: true,
            });

            if (response?.success) {
                setModerationTarget(null);
                fetchQuestions();
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to moderate question");
        } finally {
            setModerating(false);
        }
    };

    const columns = useMemo(
        () => {
            const base = [
                {
                    field: "title",
                    headerName: "Question",
                    width: 260,
                    render: (value, row) => (
                        <Tooltip title={value || "-"}>
                            <Typography
                                sx={{
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    color: row?.id ? "primary.main" : "text.primary",
                                    maxWidth: 240,
                                    whiteSpace: "normal",
                                    wordBreak: "break-word",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    lineHeight: 1.35,
                                    cursor: row?.id ? "pointer" : "default",
                                    textDecoration: row?.id ? "underline" : "none",
                                }}
                                onClick={() => {
                                    if (row?.id) navigate(`/questions/${row.id}`);
                                }}
                            >
                                {value || "-"}
                            </Typography>
                        </Tooltip>
                    ),
                },
                {
                    field: "companyNames",
                    headerName: "Companies",
                    width: 180,
                    render: (value) => (Array.isArray(value) && value.length ? value.join(", ") : "-"),
                },
                {
                    field: "roles",
                    headerName: "Roles",
                    width: 160,
                    render: (value) => (Array.isArray(value) && value.length ? value.join(", ") : "-"),
                },
                {
                    field: "category",
                    headerName: "Category",
                    width: 130,
                    render: (value) => formatEnumLabel(value),
                },
                {
                    field: "level",
                    headerName: "Level",
                    width: 100,
                    render: (value) => formatEnumLabel(value),
                },
                {
                    field: "round",
                    headerName: "Round",
                    width: 100,
                    render: (value) => formatEnumLabel(value),
                },
            ];

            if (tab === TAB_KEYS.PUBLISHED) {
                base.push(
                    {
                        field: "vote",
                        headerName: "Votes",
                        width: 80,
                        render: (value) => value ?? 0,
                    },
                    {
                        field: "commentCount",
                        headerName: "Comments",
                        width: 100,
                        render: (value) => value ?? 0,
                    },
                );
            } else {
                base.push({
                    field: "status",
                    headerName: "Status",
                    width: 110,
                    render: () => <StatusChip label="Pending" color="warning" />,
                });
            }

            base.push({
                field: "createdAt",
                headerName: "Created",
                width: 130,
                render: (value) => {
                    if (!value) return "-";
                    const date = new Date(value);
                    if (Number.isNaN(date.getTime())) return "-";
                    return date.toLocaleDateString("vi-VN");
                },
            });

            base.push({
                field: "actions",
                headerName: "Actions",
                width: 80,
                render: (_, row) => {
                    const actions = [
                        {
                            label: 'View question',
                            icon: <VisibilityIcon fontSize="small" />,
                            onClick: () => {
                                if (row?.id) navigate(`/questions/${row.id}`);
                            },
                        },
                    ];
                    if (tab === TAB_KEYS.PENDING) {
                        actions.push(
                            {
                                label: 'Approve',
                                icon: <CheckCircleOutlineIcon fontSize="small" sx={{ color: "success.main" }} />,
                                onClick: () => openModerationModal(row, "approve"),
                            },
                            {
                                label: 'Reject',
                                icon: <BlockIcon fontSize="small" sx={{ color: "error.main" }} />,
                                onClick: () => openModerationModal(row, "reject"),
                                color: "error.main",
                            },
                        );
                    }
                    return <Box sx={{ display: "flex", justifyContent: "center" }}><TableActionsMenu actions={actions} /></Box>;
                },
            });

            return base;
        },
        [navigate, tab],
    );

    return (
        <Container maxWidth="xl" sx={{ py: 3 }} className="admin-page">
            <AdminPageHeader
                title="Question Bank"
                subtitle="Moderate incoming contributions and manage published questions."
                actionButton={
                    <PrimaryButton startIcon={<RefreshIcon />} onClick={fetchQuestions}>
                        Refresh
                    </PrimaryButton>
                }
            />

            <Box className="admin-card">
                <Box sx={{ borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
                    <Tabs value={tab} onChange={handleTabChange} sx={{ px: 2 }}>
                        <Tab value={TAB_KEYS.PUBLISHED} label="Published Library" />
                        <Tab value={TAB_KEYS.PENDING} label="Pending Moderation" />
                    </Tabs>
                </Box>

                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 1.5, alignItems: 'center', bgcolor: 'background.paper' }}>
                    <SearchInput placeholder="Search by question title..." onSearch={handleSearchChange} />
                </Box>

                <DataTable
                    title="Question Bank"
                    showHeader={false}
                    showIndex
                    actions={false}
                    columns={columns}
                    data={questions}
                    totalItems={totalItems}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    loading={loading}
                />
            </Box>

            <ConfirmModal
                show={!!moderationTarget}
                title={moderationTarget?.action === "approve" ? "Approve question" : "Reject question"}
                message={
                    moderationTarget?.action === "approve"
                        ? `Publish "${moderationTarget?.title || "this question"}" to the public library?`
                        : `Reject "${moderationTarget?.title || "this question"}"? It will not appear in the public library.`
                }
                confirmText={moderating ? "Submitting..." : (moderationTarget?.action === "approve" ? "Approve" : "Reject")}
                cancelText="Cancel"
                onConfirm={confirmModeration}
                onCancel={() => !moderating && setModerationTarget(null)}
            />
        </Container>
    );
}
