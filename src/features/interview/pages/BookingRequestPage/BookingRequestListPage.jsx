import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getBookingRequests } from "../../services/bookingRequestApi";
import {
    BOOKING_REQUEST_STATUS,
    BOOKING_REQUEST_STATUS_LABELS,
    BOOKING_REQUEST_TYPE,
    BOOKING_REQUEST_TYPE_LABELS,
} from "../../../../common/constants/status";
import useUser from "../../../../common/hooks/useUser";
import { ROLES } from "../../../../common/constants/common";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Pagination from "@mui/material/Pagination";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Toolbar from "@mui/material/Toolbar";
import toast from "react-hot-toast";
import "./BookingRequestPage.css";

const STATUS_COLOR_MAP = {
    [BOOKING_REQUEST_STATUS.PENDING]: "status-pending",
    [BOOKING_REQUEST_STATUS.ACCEPTED]: "status-accepted",
    [BOOKING_REQUEST_STATUS.REJECTED]: "status-rejected",
    [BOOKING_REQUEST_STATUS.PAID]: "status-paid",
    [BOOKING_REQUEST_STATUS.EXPIRED]: "status-expired",
    [BOOKING_REQUEST_STATUS.CANCELLED]: "status-cancelled",
};

export default function BookingRequestListPage() {
    const navigate = useNavigate();
    const user = useUser();
    const isCoach = user?.role === ROLES.INTERVIEWER;

    const [items, setItems] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [typeFilter, setTypeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const filters = { page, pageSize };
            if (typeFilter !== "") filters.type = Number(typeFilter);
            if (statusFilter !== "") filters.statuses = [Number(statusFilter)];

            const result = await getBookingRequests(filters);
            setItems(result.items || []);
            setTotalCount(result.totalCount || 0);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load booking requests.");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, typeFilter, statusFilter]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePageChange = (_event, value) => {
        setPage(value);
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const fieldSx = {
        minWidth: 160,
        "& .MuiOutlinedInput-root": {
            "&:hover fieldset": { borderColor: "#667eea" },
            "&.Mui-focused fieldset": { borderColor: "#667eea" },
        },
        "& .MuiInputLabel-root.Mui-focused": { color: "#667eea" },
    };

    return (
        <Box className="booking-list-page">
            <Box className="page-header">
                <Typography variant="h5" fontWeight={700}>
                    Booking Requests
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {isCoach
                        ? "Manage incoming booking requests from candidates."
                        : "Track your booking requests to coaches."}
                </Typography>
            </Box>

            {/* Filters */}
            <Box className="booking-list-filters">
                <TextField
                    select
                    size="small"
                    label="Type"
                    value={typeFilter}
                    onChange={(e) => {
                        setTypeFilter(e.target.value);
                        setPage(1);
                    }}
                    sx={fieldSx}
                >
                    <MenuItem value="">All types</MenuItem>
                    {Object.entries(BOOKING_REQUEST_TYPE_LABELS).map(([val, label]) => (
                        <MenuItem key={val} value={val}>
                            {label}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    select
                    size="small"
                    label="Status"
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                    }}
                    sx={fieldSx}
                >
                    <MenuItem value="">All statuses</MenuItem>
                    {Object.entries(BOOKING_REQUEST_STATUS_LABELS).map(([val, label]) => (
                        <MenuItem key={val} value={val}>
                            {label}
                        </MenuItem>
                    ))}
                </TextField>
            </Box>

            {/* Table */}
            {loading ? (
                <Box display="flex" justifyContent="center" mt={6} mb={6}>
                    <CircularProgress />
                </Box>
            ) : items.length === 0 ? (
                <Box textAlign="center" py={6}>
                    <Typography variant="h6" color="text.secondary">
                        No booking requests found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {typeFilter || statusFilter
                            ? "Try adjusting your filters."
                            : isCoach
                              ? "You have no incoming booking requests yet."
                              : "You haven't submitted any booking requests yet."}
                    </Typography>
                </Box>
            ) : (
                <>
                    <TableContainer className="booking-list-table">
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>
                                        {isCoach ? "Candidate" : "Coach"}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Type</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Interview</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Amount</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Created</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 13 }} align="center">
                                        Action
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items.map((req) => (
                                    <TableRow
                                        key={req.id}
                                        hover
                                        sx={{
                                            cursor: "pointer",
                                            "&:hover": { backgroundColor: "#f9fafb" },
                                        }}
                                        onClick={() => navigate(`/booking-requests/${req.id}`)}
                                    >
                                        <TableCell>
                                            <Typography fontWeight={600} fontSize={14}>
                                                {isCoach ? req.candidateName || "—" : req.coachName || "—"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={BOOKING_REQUEST_TYPE_LABELS[req.type] || "Unknown"}
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontSize: 12, fontWeight: 600 }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography fontSize={13}>
                                                {req.interviewTypeName ||
                                                    (req.rounds?.length ? `${req.rounds.length} rounds` : "—")}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography fontWeight={600} fontSize={14} color="#4F46E5">
                                                {req.totalAmount?.toLocaleString()} ₫
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`status-chip ${STATUS_COLOR_MAP[req.status] || ""}`}>
                                                {BOOKING_REQUEST_STATUS_LABELS[req.status] || "Unknown"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Typography fontSize={13} color="text.secondary">
                                                {formatDate(req.createdAt)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/booking-requests/${req.id}`);
                                                }}
                                            >
                                                <VisibilityIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {totalPages > 1 && (
                        <Stack direction="row" justifyContent="center" sx={{ mt: 3 }}>
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={handlePageChange}
                                color="primary"
                                shape="rounded"
                            />
                        </Stack>
                    )}
                </>
            )}
        </Box>
    );
}
