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
import Pagination from "@mui/material/Pagination";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Toolbar from "@mui/material/Toolbar";
import toast from "react-hot-toast";
import "./BookingRequestPage.css";
import FormTextField from "../../../../common/components/form/FormTextField";
import StatusChip from "../../../../common/components/StatusChip";

const STATUS_COLOR_MAP = {
    [BOOKING_REQUEST_STATUS.PENDING]: "warning",
    [BOOKING_REQUEST_STATUS.PendingForApprovalAfterPayment]: "info",
    [BOOKING_REQUEST_STATUS.ACCEPTED]: "success",
    [BOOKING_REQUEST_STATUS.REJECTED]: "error",
    [BOOKING_REQUEST_STATUS.EXPIRED]: "default",
    [BOOKING_REQUEST_STATUS.CANCELLED]: "default",
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

    const fieldSx = { minWidth: 160 };

    return (
        <Box className="booking-list-page">
            <Box className="page-header">
                <Typography variant="h5" fontWeight={700}>
                    Your Bookings
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {isCoach ? "Manage incoming bookings from candidates." : "Track your bookings to coaches."}
                </Typography>
            </Box>

            {/* Filters */}
            <Box className="booking-list-filters">
                <FormTextField
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
                </FormTextField>

                <FormTextField
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
                </FormTextField>
            </Box>

            {/* Table */}
            {loading ? (
                <Box display="flex" justifyContent="center" mt={6} mb={6}>
                    {/* <CircularProgress size={30} /> */}
                </Box>
            ) : items.length === 0 ? (
                <Box textAlign="center" py={6}>
                    <Typography variant="h6" color="text.secondary">
                        No booking found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {typeFilter || statusFilter
                            ? "Try adjusting your filters."
                            : isCoach
                              ? "You have no incoming bookings yet."
                              : "You haven't submitted any bookings yet."}
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
                                        {/* Action */}
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
                                            <StatusChip label={BOOKING_REQUEST_TYPE_LABELS[req.type]} color="default" />
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
                                            <StatusChip
                                                label={BOOKING_REQUEST_STATUS_LABELS[req.status] || "Unknown"}
                                                color={STATUS_COLOR_MAP[req.status] || "default"}
                                            />
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
