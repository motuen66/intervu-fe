import { useState, useEffect } from "react";
import {
    Modal,
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Button,
    Stack,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Card,
    CardContent,
    Grid,
    FormControl,
    InputLabel,
} from "@mui/material";
import FormSelect from "../../../../common/components/form/FormSelect";
import FormTextField from "../../../../common/components/form/FormTextField";
import CloseIcon from "@mui/icons-material/Close";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { callApi } from "../../../../common/utils/apiConnector.js";
import { METHOD } from "../../../../common/constants/api.js";
import { interviewEndPoints } from "../../services/interviewRoomApi";
import { formatCurrency } from "../../../../common/utils/dateFormatter.js";

const transactionStatusConfig = {
    PENDING: { label: "Pending", color: "#FFA500", bgColor: "#FFF3E0" },
    COMPLETED: { label: "Completed", color: "#4CAF50", bgColor: "#E8F5E9" },
    FAILED: { label: "Failed", color: "#F44336", bgColor: "#FFEBEE" },
    REFUNDED: { label: "Refunded", color: "#2196F3", bgColor: "#E3F2FD" },
};

function PaymentHistoryModal({ open, onClose }) {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

    useEffect(() => {
        if (open) {
            fetchPaymentHistory();
        }
    }, [open]);

    useEffect(() => {
        filterTransactions();
    }, [transactions, filterStatus, searchTerm]);

    const fetchPaymentHistory = async () => {
        setLoading(true);
        try {
            const res = await callApi({
                method: METHOD.GET,
                endpoint: interviewEndPoints.GET_PAYMENT_HISTORY,
                useGlobalLoading: false,
            });
            const incoming = res?.data;
            const normalized = Array.isArray(incoming)
                ? incoming
                : Array.isArray(incoming?.items)
                    ? incoming.items
                    : [];

            // Normalize status casing and amount type for consistent calculations
            const sanitized = normalized.map((t) => ({
                ...t,
                status: (t?.status || "").toString().toUpperCase(),
                amount: (() => {
                    if (typeof t?.amount === "number") return t.amount;
                    const raw = (t?.amount ?? "").toString().replace(/,/g, "").trim();
                    const parsed = Number(raw);
                    return Number.isFinite(parsed) ? parsed : 0;
                })(),
            }));

            setTransactions(sanitized);
        } catch (error) {
            console.error("Failed to fetch payment history:", error);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const filterTransactions = () => {
        let filtered = Array.isArray(transactions) ? transactions : [];

        // Filter by status
        if (filterStatus !== "ALL") {
            filtered = filtered.filter((t) => t.status === filterStatus);
        }

        // Filter by search term (coaching name, interview ID, etc.)
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (t) =>
                    t.coachName?.toLowerCase().includes(term) ||
                    t.interviewId?.toLowerCase().includes(term) ||
                    t.candidateName?.toLowerCase().includes(term)
            );
        }

        setFilteredTransactions(filtered);
    };

    const getStatusConfig = (status) => {
        return transactionStatusConfig[status] || transactionStatusConfig.PENDING;
    };

    const handleViewDetails = (transaction) => {
        setSelectedTransaction(transaction);
        setDetailsDialogOpen(true);
    };

    const handleCloseDetailsDialog = () => {
        setDetailsDialogOpen(false);
        setSelectedTransaction(null);
    };

    const handleDownloadReceipt = (transaction) => {
        // If backend provides a receipt URL or file, generate download
        const receiptData = `
Interview Booking Receipt
========================
Date: ${new Date(transaction.createdAt).toLocaleDateString()}
Transaction ID: ${transaction.id}
Status: ${transaction.status}
Amount: ${formatCurrency(transaction.amount)}
Coach: ${transaction.coachName}
Interview ID: ${transaction.interviewId}
        `;

        const element = document.createElement("a");
        element.setAttribute(
            "href",
            "data:text/plain;charset=utf-8," + encodeURIComponent(receiptData)
        );
        element.setAttribute("download", `receipt-${transaction.id}.txt`);
        element.style.display = "none";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    // Calculate summary stats
    const stats = {
        totalSpent: (Array.isArray(filteredTransactions) ? filteredTransactions : [])
            .filter((t) => t.status === "COMPLETED")
            .reduce((sum, t) => sum + (t.amount || 0), 0),
        totalPending: (Array.isArray(filteredTransactions) ? filteredTransactions : [])
            .filter((t) => t.status === "PENDING")
            .reduce((sum, t) => sum + (t.amount || 0), 0),
        transactionCount: Array.isArray(filteredTransactions) ? filteredTransactions.length : 0,
    };

    return (
        <>
        <Modal
            open={open}
            onClose={onClose}
        >
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "100vh",
                    p: 2,
                }}
            >
                <Box
                    sx={{
                        bgcolor: "background.paper",
                        borderRadius: 2,
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                        maxWidth: 1200,
                        width: "100%",
                        maxHeight: "90vh",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                    }}
                >
                    {/* Header */}
                    <Box
                        sx={{
                            p: 3,
                            borderBottom: "1px solid #E0E0E0",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            backgroundColor: "#f5f5f5",
                        }}
                    >
                    <Box>
                        <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
                            Payment History
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            View all your interview booking transactions
                        </Typography>
                    </Box>
                    <Button
                        onClick={onClose}
                        sx={{
                            minWidth: 40,
                            width: 40,
                            height: 40,
                            p: 0,
                            borderRadius: "50%",
                        }}
                    >
                        <CloseIcon />
                    </Button>
                </Box>

                {/* Content */}
                <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
                    {loading ? (
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                minHeight: 300,
                            }}
                        >
                            <CircularProgress />
                        </Box>
                    ) : transactions.length === 0 ? (
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                minHeight: 300,
                                flexDirection: "column",
                            }}
                        >
                            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                                No transactions found
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Your payment history will appear here
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card sx={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                                        <CardContent>
                                            <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>
                                                Total Transactions
                                            </Typography>
                                            <Typography variant="h5" fontWeight={700}>
                                                {stats.transactionCount}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card sx={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                                        <CardContent>
                                            <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>
                                                Total Spent (Completed)
                                            </Typography>
                                            <Typography
                                                variant="h5"
                                                fontWeight={700}
                                                sx={{ color: "#4CAF50" }}
                                            >
                                                {formatCurrency(stats.totalSpent)}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card sx={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                                        <CardContent>
                                            <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>
                                                Pending Amount
                                            </Typography>
                                            <Typography
                                                variant="h5"
                                                fontWeight={700}
                                                sx={{ color: "#FFA500" }}
                                            >
                                                {formatCurrency(stats.totalPending)}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card sx={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                                        <CardContent>
                                            <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>
                                                Average Amount
                                            </Typography>
                                            <Typography variant="h5" fontWeight={700}>
                                                {stats.transactionCount > 0
                                                    ? formatCurrency(stats.totalSpent / stats.transactionCount)
                                                    : "$0.00"}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* Filters */}
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
                                <FormTextField
                                    placeholder="Search by coach, interview ID, or candidate..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    size="small"
                                    sx={{ flex: 1 }}
                                    variant="outlined"
                                />
                                <FormControl size="small" sx={{ minWidth: 150 }}>
                                    <InputLabel id="payment-modal-status-label">Status</InputLabel>
                                    <FormSelect
                                        labelId="payment-modal-status-label"
                                        label="Status"
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                    >
                                        <MenuItem value="ALL">All Status</MenuItem>
                                        <MenuItem value="COMPLETED">Completed</MenuItem>
                                        <MenuItem value="PENDING">Pending</MenuItem>
                                        <MenuItem value="FAILED">Failed</MenuItem>
                                        <MenuItem value="REFUNDED">Refunded</MenuItem>
                                    </FormSelect>
                                </FormControl>
                            </Stack>

                            {/* Transactions Table */}
                            <TableContainer component={Paper} sx={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                                <Table>
                                    <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700, color: "text.primary" }}>
                                                Date
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: "text.primary" }}>
                                                Interview/Coach
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: "text.primary" }}>
                                                Amount
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: "text.primary" }}>
                                                Status
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: "text.primary" }} align="center">
                                                Actions
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(Array.isArray(filteredTransactions) ? filteredTransactions : []).map((transaction) => {
                                            const statusConfig = getStatusConfig(transaction.status);
                                            return (
                                                <TableRow
                                                    key={transaction.id}
                                                    sx={{
                                                        "&:hover": {
                                                            backgroundColor: "#fafafa",
                                                        },
                                                        "&:last-child td, &:last-child th": { border: 0 },
                                                    }}
                                                >
                                                    <TableCell>
                                                        {new Date(transaction.createdAt).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={600}>
                                                                {transaction.coachName}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                ID: {transaction.interviewId}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography fontWeight={600}>
                                                            {formatCurrency(transaction.amount)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box
                                                            sx={{
                                                                display: "inline-block",
                                                                px: 2,
                                                                py: 0.5,
                                                                borderRadius: 1,
                                                                backgroundColor: statusConfig.bgColor,
                                                                color: statusConfig.color,
                                                                fontWeight: 600,
                                                                fontSize: "0.75rem",
                                                            }}
                                                        >
                                                            {statusConfig.label}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Stack direction="row" spacing={1} justifyContent="center">
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                startIcon={<VisibilityOutlinedIcon />}
                                                                onClick={() => handleViewDetails(transaction)}
                                                                sx={{ textTransform: "none" }}
                                                            >
                                                                View
                                                            </Button>
                                                            {transaction.status === "COMPLETED" && (
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    startIcon={<FileDownloadIcon />}
                                                                    onClick={() => handleDownloadReceipt(transaction)}
                                                                    sx={{ textTransform: "none" }}
                                                                >
                                                                    Receipt
                                                                </Button>
                                                            )}
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* No results message */}
                            {filteredTransactions.length === 0 && transactions.length > 0 && (
                                <Box sx={{ textAlign: "center", py: 4 }}>
                                    <Typography color="text.secondary">
                                        No transactions match your filters
                                    </Typography>
                                </Box>
                            )}
                        </>
                    )}
                    </Box>
                </Box>
            </Box>
        </Modal>

            {/* Transaction Details Dialog */}
            <Dialog
                open={detailsDialogOpen}
                onClose={handleCloseDetailsDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Transaction Details</DialogTitle>
                <DialogContent>
                    {selectedTransaction && (
                        <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                <Typography variant="body2" color="text.secondary">
                                    Transaction ID:
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    {selectedTransaction.id}
                                </Typography>
                            </Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                <Typography variant="body2" color="text.secondary">
                                    Date:
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    {new Date(selectedTransaction.createdAt).toLocaleString()}
                                </Typography>
                            </Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                <Typography variant="body2" color="text.secondary">
                                    Coach:
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    {selectedTransaction.coachName}
                                </Typography>
                            </Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                <Typography variant="body2" color="text.secondary">
                                    Interview ID:
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    {selectedTransaction.interviewId}
                                </Typography>
                            </Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                <Typography variant="body2" color="text.secondary">
                                    Amount:
                                </Typography>
                                <Typography variant="body2" fontWeight={700}>
                                    {formatCurrency(selectedTransaction.amount)}
                                </Typography>
                            </Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                <Typography variant="body2" color="text.secondary">
                                    Status:
                                </Typography>
                                <Box
                                    sx={{
                                        px: 2,
                                        py: 0.5,
                                        borderRadius: 1,
                                        backgroundColor:
                                            getStatusConfig(selectedTransaction.status).bgColor,
                                        color: getStatusConfig(selectedTransaction.status).color,
                                        fontWeight: 600,
                                        fontSize: "0.75rem",
                                    }}
                                >
                                    {getStatusConfig(selectedTransaction.status).label}
                                </Box>
                            </Box>
                            {selectedTransaction.notes && (
                                <Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        Notes:
                                    </Typography>
                                    <Typography variant="body2" sx={{ p: 1.5, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
                                        {selectedTransaction.notes}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDetailsDialog}>Close</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default PaymentHistoryModal;
