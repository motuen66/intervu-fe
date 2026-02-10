import React, { useEffect, useState, useCallback } from "react";
import { interviewTypeEndPoints } from "../../services/interviewTypeApi";
import CreateInterviewTypeDialog from "./CreateInterviewTypeDialog";
import UpdateInterviewTypeDialog from "./UpdateInterviewTypeDialog";
import ConfirmModal from "../../../../common/components/ConfirmModal";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import TablePagination from "@mui/material/TablePagination";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import "./InterviewTypeManagementPage.css";

export default function InterviewTypeManagementPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openCreate, setOpenCreate] = useState(false);
    const [openUpdate, setOpenUpdate] = useState(false);
    const [activeItem, setActiveItem] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [search, setSearch] = useState("");

    const fetchItems = useCallback(
        async (p = page, ps = pageSize, q = search) => {
            setLoading(true);
            try {
                const apiPage = p + 1;
                const params = new URLSearchParams();
                params.set("page", String(apiPage));
                params.set("pageSize", String(ps));
                if (q) params.set("q", q);

                const url = `${interviewTypeEndPoints.GET_ALL_TYPES}?${params.toString()}`;
                const response = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                if (!response.ok) {
                    const text = await response.text().catch(() => "");
                    throw new Error(`Request failed: ${response.status} ${response.statusText} ${text}`);
                }
                const data = await response.json().catch(() => {
                    throw new Error("Invalid JSON response from interview types endpoint");
                });
                if (!data || data.success === false) {
                    throw new Error(data?.message || "Interview types API returned an error");
                }

                const itemsList = data.items || data.data || [];
                const total = data.total ?? data.totalItems ?? data.totalCount ?? itemsList.length;
                setItems(itemsList || []);
                setTotalCount(Number(total) || 0);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        },
        [page, pageSize, search],
    );

    useEffect(() => {
        fetchItems(page, pageSize, search);
    }, [fetchItems, page, pageSize, search]);

    const handleCreateSuccess = () => {
        setOpenCreate(false);
        // reload current page
        fetchItems(page, pageSize, search);
    };

    const handleUpdateClick = (item) => {
        setActiveItem(item);
        setOpenUpdate(true);
    };

    const handleUpdateSuccess = () => {
        setOpenUpdate(false);
        setActiveItem(null);
        fetchItems(page, pageSize, search);
    };

    const handleDeleteClick = (id) => {
        setDeletingId(id);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        setConfirmOpen(false);
        if (!deletingId) return;
        try {
            const res = await fetch(interviewTypeEndPoints.DELETE_TYPE(deletingId), {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (!res.ok) throw new Error("Delete failed");
            // reload page after delete
            fetchItems(page, pageSize, search);
        } catch (err) {
            console.error(err);
        } finally {
            setDeletingId(null);
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangePageSize = (event) => {
        const newSize = parseInt(event.target.value, 10) || 10;
        setPageSize(newSize);
        // reset to first page when page size changes
        setPage(0);
    };

    // const handleSearchChange = (e) => {
    //     setSearch(e.target.value);
    //     // reset to first page when searching
    //     setPage(0);
    // };

    return (
        <Box className="interview-type-management" p={2}>
            <Paper elevation={2} sx={{ overflow: "hidden" }}>
                <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Typography variant="h6">Interview Types</Typography>
                        {/* <TextField
                            size="small"
                            placeholder="Search by name..."
                            value={search}
                            onChange={handleSearchChange}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        /> */}
                    </Box>

                    <Box>
                        <Button variant="contained" onClick={() => setOpenCreate(true)}>
                            Create New
                        </Button>
                    </Box>
                </Toolbar>

                {loading ? (
                    <Box display="flex" justifyContent="center" mt={6} mb={6}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell>Is Coding</TableCell>
                                <TableCell>Duration (min)</TableCell>
                                <TableCell>Base Price</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {items.map((it) => (
                                <TableRow key={it.id} hover>
                                    <TableCell sx={{ fontWeight: 600 }}>{it.name}</TableCell>
                                    <TableCell sx={{ color: "text.secondary", maxWidth: 400 }}>
                                        {it.description}
                                    </TableCell>
                                    <TableCell>{it.isCoding ? "Yes" : "No"}</TableCell>
                                    <TableCell>{it.durationMinutes}</TableCell>
                                    <TableCell>{it.basePrice}</TableCell>
                                    <TableCell>{String(it.status)}</TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => handleUpdateClick(it)}>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => handleDeleteClick(it.id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

                <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                    <TablePagination
                        component="div"
                        count={totalCount}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={pageSize}
                        onRowsPerPageChange={(e) => handleChangePageSize(e)}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        labelRowsPerPage="Rows"
                    />
                </Box>
            </Paper>

            <CreateInterviewTypeDialog
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                onCreated={handleCreateSuccess}
            />
            <UpdateInterviewTypeDialog
                open={openUpdate}
                onClose={() => setOpenUpdate(false)}
                item={activeItem}
                onUpdated={handleUpdateSuccess}
            />

            <ConfirmModal
                show={confirmOpen}
                title="Delete interview type"
                message="Are you sure you want to delete this interview type? This action cannot be undone."
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </Box>
    );
}
