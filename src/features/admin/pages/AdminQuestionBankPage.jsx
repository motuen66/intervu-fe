import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Container, IconButton, ListItemIcon, ListItemText, MenuItem, Tooltip, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import toast from "react-hot-toast";
import DataTable from "../components/DataTable";
import ConfirmModal from "../../../common/components/ConfirmModal";
import ActionMenu from "../../../common/components/ActionMenu";
import { PrimaryButton } from "../../../common/components/buttons";
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
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [deleteTarget, setDeleteTarget] = useState(null);
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

    const handleCloseMenu = () => {
        setActionMenuAnchor(null);
        setActionMenuRow(null);
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
                render: (_, row) => (
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                setActionMenuAnchor(e.currentTarget);
                                setActionMenuRow(row);
                            }}
                        >
                            <MoreVertIcon fontSize="small" />
                        </IconButton>
                    </Box>
                ),
            },
        ],
        [],
    );

    return (
        <Container maxWidth="xl" className="admin-page">
            <Box className="admin-page-header">
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        Question Bank
                    </Typography>
                    <Typography className="admin-page-subtitle">Manage all questions in the platform.</Typography>
                </Box>
                <PrimaryButton startIcon={<RefreshIcon />} onClick={fetchQuestions}>
                    Refresh
                </PrimaryButton>
            </Box>

            <Box className="admin-card">
                <Box sx={{ mb: 2, display: "flex", gap: 1.5, alignItems: "center" }}>
                    <input
                        className="admin-search-input"
                        placeholder="Search by question title..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        style={{ maxWidth: 420 }}
                    />
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
                    onPageChange={setPage}
                    onPageSizeChange={(size) => {
                        setPage(0);
                        setPageSize(size);
                    }}
                    loading={loading}
                />
            </Box>

            <ActionMenu anchorEl={actionMenuAnchor} open={Boolean(actionMenuAnchor)} onClose={handleCloseMenu}>
                <MenuItem
                    disabled={!actionMenuRow?.id}
                    onClick={() => {
                        navigate(`/questions/${actionMenuRow.id}`);
                        handleCloseMenu();
                    }}
                >
                    <ListItemIcon>
                        <VisibilityIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="View question" primaryTypographyProps={{ fontSize: "13px", fontWeight: 600 }} />
                </MenuItem>
                <MenuItem
                    disabled={!actionMenuRow?.id}
                    onClick={() => {
                        setDeleteTarget({ id: actionMenuRow.id, title: actionMenuRow.title });
                        handleCloseMenu();
                    }}
                    sx={{ color: "error.main" }}
                >
                    <ListItemIcon>
                        <DeleteOutlineIcon fontSize="small" sx={{ color: "error.main" }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Delete question"
                        primaryTypographyProps={{ fontSize: "13px", fontWeight: 600 }}
                    />
                </MenuItem>
            </ActionMenu>

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