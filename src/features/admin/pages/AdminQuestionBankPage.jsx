import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Container, Tooltip, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import toast from "react-hot-toast";

import AdminPageHeader from "../../../common/components/admin/AdminPageHeader";
import SearchInput from "../../../common/components/admin/SearchInput";
import TableActionsMenu from "../../../common/components/table/TableActionsMenu";
import DataTable from "../../../common/components/table/DataTable";
import ConfirmModal from "../../../common/components/ConfirmModal";
import { PrimaryButton } from "../../../common/components/buttons";
import useTableState from "../../../hooks/useTableState";
import { callApi } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";
import { adminEndPoints } from "../services/adminApi";
import "./AdminDashboard.css";

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

    const [searchTerm, setSearchTerm] = useState("");
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        fetchQuestions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, searchTerm]);

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const response = await callApi({
                method: METHOD.GET,
                endpoint: adminEndPoints.GET_QUESTIONS,
                arg: {
                    page: page + 1,
                    pageSize,
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

    const handleDeleteQuestion = async () => {
        const id = deleteTarget?.id;
        if (!id) return;

        try {
            const response = await callApi({
                method: METHOD.DELETE,
                endpoint: adminEndPoints.DELETE_QUESTION(id),
            });

            if (response?.success) {
                toast.success("Question deleted successfully");
                setDeleteTarget(null);
                fetchQuestions();
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to delete question");
        }
    };

    const handleSearchChange = (val) => {
        setSearchTerm(val);
        setPage(0);
    };

    const columns = useMemo(
        () => [
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
                                if (row?.id) {
                                    navigate(`/questions/${row.id}`);
                                }
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
            {
                field: "createdAt",
                headerName: "Created",
                width: 130,
                render: (value) => {
                    if (!value) return "-";
                    const date = new Date(value);
                    if (Number.isNaN(date.getTime())) return "-";
                    return date.toLocaleDateString("vi-VN");
                },
            },
            {
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
                        {
                            label: 'Delete question',
                            icon: <DeleteOutlineIcon fontSize="small" sx={{ color: "error.main" }} />,
                            onClick: () => setDeleteTarget({ id: row.id, title: row.title }),
                            color: "error.main"
                        }
                    ];
                    return <Box sx={{ display: "flex", justifyContent: "center" }}><TableActionsMenu actions={actions} /></Box>;
                },
            },
        ],
        [navigate],
    );

    return (
        <Container maxWidth="xl" sx={{ py: 3 }} className="admin-page">
            <AdminPageHeader 
                title="Question Bank" 
                subtitle="Manage all questions in the platform."
                actionButton={
                    <PrimaryButton startIcon={<RefreshIcon />} onClick={fetchQuestions}>
                        Refresh
                    </PrimaryButton>
                }
            />

            <Box className="admin-card">
                <Box sx={{ p: 2, borderBottom: '1px solid #E2E8F0', display: 'flex', gap: 1.5, alignItems: 'center', bgcolor: '#fff' }}>
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
                show={!!deleteTarget}
                title="Delete question"
                message={`Are you sure you want to delete ${deleteTarget?.title || "this question"}?`}
                confirmText="Delete"
                onConfirm={handleDeleteQuestion}
                onCancel={() => setDeleteTarget(null)}
            />
        </Container>
    );
}