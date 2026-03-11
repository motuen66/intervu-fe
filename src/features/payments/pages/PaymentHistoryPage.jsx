import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
    Box,
    Typography,
    Container,
    Grid,
    Card,
    CardContent,
    Stack,
    TextField,
    MenuItem,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    CircularProgress,
    Button,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { callApi } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";
import { interviewEndPoints } from "../../interview/services/interviewRoomApi";
import { profileEndPoints } from "../../profile/services/profileApi";
import { formatCurrency } from "../../../common/utils/dateFormatter";
import { ROLES } from "../../../common/constants/common";

const transactionStatusConfig = {
    PENDING: { label: "Pending", color: "#FFA500", bgColor: "#FFF3E0" },
    COMPLETED: { label: "Completed", color: "#4CAF50", bgColor: "#E8F5E9" },
    FAILED: { label: "Failed", color: "#F44336", bgColor: "#FFEBEE" },
    REFUNDED: { label: "Refunded", color: "#2196F3", bgColor: "#E3F2FD" },
};

// Map numeric status codes from API to string status
const mapStatusCodeToString = (statusCode) => {
    const statusMap = {
        0: "PENDING",
        1: "COMPLETED",  // Paid status
        2: "FAILED",
        3: "REFUNDED",
    };
    
    // If status is already a string, normalize it
    if (typeof statusCode === "string") {
        const upper = statusCode.toUpperCase();
        if (upper === "PAID") return "COMPLETED";
        return upper;
    }
    
    // If numeric, map to string
    return statusMap[statusCode] || "PENDING";
};

const formatAmountDisplay = (amount, isCoach) => {
    const safeAmount = typeof amount === "number" ? amount : Number((amount ?? "").toString().replace(/,/g, "")) || 0;
    const base = formatCurrency(safeAmount);
    return isCoach
        ? { text: `+ ${base}`, color: "#4CAF50" }
        : { text: `- ${base}`, color: "#F44336" };
};

const pickFirstString = (...vals) => vals.find((v) => typeof v === "string" && v.trim().length);

const sanitizeTransactions = (incoming) => {
    const normalized = Array.isArray(incoming)
        ? incoming
        : Array.isArray(incoming?.items)
            ? incoming.items
            : [];

    return normalized.map((t) => {
        const coachName = pickFirstString(
            t?.coachName,
            t?.interviewerName,
            t?.interviewerFullName,
            t?.interviewer?.fullName,
            t?.interviewer?.name,
            t?.coach?.fullName,
            t?.coach?.name,
            t?.interviewRoom?.coachName,
            t?.interviewRoom?.interviewerName
        );

        const candidateName = pickFirstString(
            t?.candidateName,
            t?.userName,
            t?.userFullName,
            t?.candidate?.fullName,
            t?.candidate?.name,
            t?.candidate?.username
        );

        const interviewId = pickFirstString(
            t?.interviewId,
            t?.interviewRoomId,
            t?.interviewRoom?.id,
            t?.interviewRoom?.roomId,
            t?.interview?.id,
            t?.scheduleId,
            t?.bookingId
        );

        const createdAt = pickFirstString(
            t?.createdAt,
            t?.createdOn,
            t?.createdDate,
            t?.bookingDate,
            t?.paymentDate,
            t?.interviewDate
        );

        return {
            ...t,
            coachId: t?.coachId || t?.interviewerId || t?.interviewRoom?.coachId,
            userId: t?.userId || t?.candidateId || t?.bookingUserId,
            coachName,
            candidateName,
            interviewId,
            createdAt,
            status: mapStatusCodeToString(t?.status),
            amount: (() => {
                if (typeof t?.amount === "number") return t.amount;
                const raw = (t?.amount ?? "").toString().replace(/,/g, "").trim();
                const parsed = Number(raw);
                return Number.isFinite(parsed) ? parsed : 0;
            })(),
        };
    });
};

const formatDateSafe = (value) => {
    if (!value) return "—";
    const parsed = new Date(value);
    return Number.isNaN(parsed.valueOf()) ? "—" : parsed.toLocaleDateString();
};

const formatDateTimeSafe = (value) => {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.valueOf())) return "—";
    return parsed.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

// Map numeric interview type codes to readable names
const mapInterviewType = (typeCode) => {
    const typeMap = {
        0: "Technical Interview",
        1: "Behavioral Interview",
        2: "System Design",
        3: "Coding Interview",
        4: "Mock Interview",
    };
    
    if (typeof typeCode === "number") {
        return typeMap[typeCode] || "Interview";
    }
    
    // If already a string, return as-is
    return typeCode || "Interview";
};

const fetchProfilesByIds = async (ids = []) => {
    const unique = Array.from(new Set(ids.filter(Boolean)));
    if (!unique.length) return new Map();

    const pairs = await Promise.all(
        unique.map(async (id) => {
            try {
                const res = await callApi({ method: METHOD.GET, endpoint: profileEndPoints.GET_PROFILE(id) });
                const profile = res?.data || {};
                const name = profile.fullName || profile.name || profile.username || profile.email || id;
                return [id, name];
            } catch (error) {
                console.error("Failed to fetch profile", id, error);
                return [id, id];
            }
        })
    );

    return new Map(pairs);
};

const PaymentHistoryPage = () => {
    const { userData } = useSelector((state) => state.auth || {});
    const isCoach = userData?.role === ROLES.INTERVIEWER;

    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    useEffect(() => {
        fetchPaymentHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let filtered = Array.isArray(transactions) ? transactions : [];

        if (filterStatus !== "ALL") {
            filtered = filtered.filter((t) => t.status === filterStatus);
        }

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
    }, [transactions, filterStatus, searchTerm]);

    const fetchPaymentHistory = async () => {
        setLoading(true);
        try {
            const res = await callApi({
                method: METHOD.GET,
                endpoint: interviewEndPoints.GET_PAYMENT_HISTORY,
            });
            const sanitized = sanitizeTransactions(res?.data);

            // Resolve missing names via profile endpoint when only IDs are returned
            const idList = sanitized.flatMap((t) => [t.coachId, t.userId]);
            const profileMap = await fetchProfilesByIds(idList);

            const enriched = sanitized.map((t) => ({
                ...t,
                coachName: t.coachName || profileMap.get(t.coachId) || "—",
                candidateName: t.candidateName || profileMap.get(t.userId) || "—",
            }));

            setTransactions(enriched);
        } catch (error) {
            console.error("Failed to fetch payment history:", error);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const list = Array.isArray(filteredTransactions) ? filteredTransactions : [];
        const completed = list.filter((t) => t.status === "COMPLETED");
        const pending = list.filter((t) => t.status === "PENDING");
        const totalSpent = completed.reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalPending = pending.reduce((sum, t) => sum + (t.amount || 0), 0);
        return {
            transactionCount: list.length,
            totalSpent,
            totalPending,
            average: list.length ? totalSpent / list.length : 0,
        };
    }, [filteredTransactions]);

    const getStatusConfig = (status) => transactionStatusConfig[status] || transactionStatusConfig.PENDING;

    const getInterviewDetails = (transaction) => {
        if (!transaction) return [];

        // Get interview type (handle both numeric and string)
        const typeValue = transaction?.type ?? transaction?.interviewType ?? transaction?.interviewRoom?.interviewType;
        const interviewType = mapInterviewType(typeValue);

        // Get schedule time
        const scheduleTime = transaction?.startTime 
            || transaction?.interviewStartTime 
            || transaction?.interviewRoom?.startTime 
            || transaction?.scheduledAt 
            || transaction?.interviewDate;

        return [
            { label: "Coach", value: transaction.coachName || "-" },
            { label: "Candidate", value: transaction.candidateName || "-" },
            { label: "Interview Type", value: interviewType },
            { label: "Schedule", value: formatDateTimeSafe(scheduleTime) },
            { label: "Payment Date", value: formatDateSafe(transaction.createdAt) },
            { label: "Amount", value: formatCurrency(transaction.amount || 0) },
            { label: "Status", value: getStatusConfig(transaction.status).label },
        ];
    };

    return (
        <Box sx={{ bgcolor: "#f8f9fb", minHeight: "100vh", py: 4 }}>
            <Container maxWidth="lg">
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Box>
                        <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
                            Payment History
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            View all your interview booking transactions
                        </Typography>
                    </Box>
                    <Tooltip title="Refresh">
                        <IconButton onClick={fetchPaymentHistory} aria-label="refresh payment history" sx={{ border: "1px solid #d6d9e0" }}>
                            <RefreshRoundedIcon />
                        </IconButton>
                    </Tooltip>
                </Stack>

                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 320 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        {/* Summary */}
                        <Stack
                            direction="row"
                            spacing={2}
                            useFlexGap
                            flexWrap="wrap"
                            alignItems="stretch"
                            sx={{ mb: 3 }}
                        >
                            <Card sx={{ flex: 1, minWidth: 200, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                                <CardContent>
                                    <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>
                                        Total Transactions
                                    </Typography>
                                        <Typography variant="h5" fontWeight={700}>{stats.transactionCount}</Typography>
                                </CardContent>
                            </Card>
                            <Card sx={{ flex: 1, minWidth: 200, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                                <CardContent>
                                    <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>
                                        Completed Amount
                                    </Typography>
                                        <Typography variant="h5" fontWeight={700} sx={{ color: "text.primary" }}>
                                            {formatAmountDisplay(stats.totalSpent, isCoach).text}
                                        </Typography>
                                </CardContent>
                            </Card>
                            <Card sx={{ flex: 1, minWidth: 200, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                                <CardContent>
                                    <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>
                                        Pending Amount
                                    </Typography>
                                        <Typography variant="h5" fontWeight={700} sx={{ color: "text.primary" }}>
                                            {formatAmountDisplay(stats.totalPending, isCoach).text}
                                        </Typography>
                                </CardContent>
                            </Card>
                            <Card sx={{ flex: 1, minWidth: 200, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                                <CardContent>
                                    <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>
                                        Average Amount
                                    </Typography>
                                        <Typography variant="h5" fontWeight={700} sx={{ color: "text.primary" }}>
                                            {formatAmountDisplay(stats.average, isCoach).text}
                                        </Typography>
                                </CardContent>
                            </Card>
                        </Stack>

                        {/* Filters */}
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
                            <TextField
                                placeholder="Search by coach, interview ID, or candidate..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                size="small"
                                sx={{ flex: 1 }}
                                variant="outlined"
                            />
                            <TextField
                                select
                                label="Status"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                size="small"
                                sx={{ minWidth: 160 }}
                            >
                                <MenuItem value="ALL">All Status</MenuItem>
                                <MenuItem value="COMPLETED">Completed</MenuItem>
                                <MenuItem value="PENDING">Pending</MenuItem>
                                <MenuItem value="FAILED">Failed</MenuItem>
                                <MenuItem value="REFUNDED">Refunded</MenuItem>
                            </TextField>
                        </Stack>

                        {/* Table */}
                        <Paper sx={{ boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
                            <Table>
                                <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Interview/Coach</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(Array.isArray(filteredTransactions) ? filteredTransactions : []).map((transaction, index) => {
                                        const statusConfig = getStatusConfig(transaction.status);
                                        return (
                                            <TableRow key={transaction.id || transaction.interviewId || index}>
                                                <TableCell>{formatDateSafe(transaction.createdAt)}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600}>{transaction.coachName}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography fontWeight={700} sx={{ color: formatAmountDisplay(transaction.amount, isCoach).color }}>
                                                        {formatAmountDisplay(transaction.amount, isCoach).text}
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
                                                <TableCell>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<VisibilityOutlinedIcon fontSize="small" />}
                                                        onClick={() => setSelectedTransaction(transaction)}
                                                        sx={{ textTransform: "none", minWidth: 110 }}
                                                    >
                                                        View details
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>

                            {(!filteredTransactions || filteredTransactions.length === 0) && (
                                <Box sx={{ textAlign: "center", py: 5 }}>
                                    <Typography color="text.secondary">No transactions found</Typography>
                                </Box>
                            )}
                        </Paper>

                        <Dialog
                            open={Boolean(selectedTransaction)}
                            onClose={() => setSelectedTransaction(null)}
                            fullWidth
                            maxWidth="sm"
                        >
                            <DialogTitle>Paid Interview Details</DialogTitle>
                            <DialogContent dividers>
                                <Stack spacing={1.25}>
                                    {getInterviewDetails(selectedTransaction).map((item) => (
                                        <Box key={item.label}>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                                {item.label}
                                            </Typography>
                                            <Typography variant="body2" fontWeight={600}>
                                                {item.value}
                                            </Typography>
                                            <Divider sx={{ mt: 1 }} />
                                        </Box>
                                    ))}
                                </Stack>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setSelectedTransaction(null)}>Close</Button>
                            </DialogActions>
                        </Dialog>
                    </>
                )}
            </Container>
        </Box>
    );
};

export default PaymentHistoryPage;
