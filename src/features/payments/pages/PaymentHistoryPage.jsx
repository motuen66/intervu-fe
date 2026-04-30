import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Stack,
    MenuItem,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    CircularProgress,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    FormControl,
    InputLabel,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import FormSelect from "../../../common/components/form/FormSelect";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import { callApi } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";
import { interviewEndPoints } from "../../interview/services/interviewRoomApi";
import { profileEndPoints } from "../../profile/services/profileApi";
import { formatCurrency } from "../../../common/utils/dateFormatter";
import { ROLES } from "../../../common/constants/common";
import { trackPaymentSuccess } from "../../../utils/analytics";
import { useSearchParams } from "react-router-dom";
import { AppText, FormTextField, PageHeader } from "../../../common/components";
import { SecondaryButton, TextButton } from "../../../common/components/buttons";

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
        1: "COMPLETED", // Paid status
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
    return isCoach ? { text: `+ ${base}`, color: "#4CAF50" } : { text: `- ${base}`, color: "#F44336" };
};

const pickFirstString = (...vals) => vals.find((v) => typeof v === "string" && v.trim().length);

const sanitizeTransactions = (incoming) => {
    const normalized = Array.isArray(incoming) ? incoming : Array.isArray(incoming?.items) ? incoming.items : [];

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
            t?.interviewRoom?.interviewerName,
        );

        const candidateName = pickFirstString(
            t?.candidateName,
            t?.userName,
            t?.userFullName,
            t?.candidate?.fullName,
            t?.candidate?.name,
            t?.candidate?.username,
        );

        const interviewId = pickFirstString(
            t?.interviewId,
            t?.interviewRoomId,
            t?.interviewRoom?.id,
            t?.interviewRoom?.roomId,
            t?.interview?.id,
            t?.scheduleId,
            t?.bookingId,
        );

        const createdAt = pickFirstString(
            t?.createdAt,
            t?.createdOn,
            t?.createdDate,
            t?.bookingDate,
            t?.paymentDate,
            t?.interviewDate,
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
    if (Number.isNaN(parsed.valueOf())) return "—";
    return parsed.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const formatDateTimeSafe = (value) => {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.valueOf())) return "—";
    return parsed.toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
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
                const res = await callApi({
                    method: METHOD.GET,
                    endpoint: profileEndPoints.GET_PROFILE(id),
                    useGlobalLoading: false,
                });
                const profile = res?.data || {};
                const name = profile.fullName || profile.name || profile.username || profile.email || id;
                return [id, name];
            } catch (error) {
                console.error("Failed to fetch profile", id, error);
                return [id, id];
            }
        }),
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

    const [searchParams] = useSearchParams();
    const theme = useTheme();
    const highlightTransactionId = searchParams.get("transactionId");
    const normalizedHighlightId = highlightTransactionId ? String(highlightTransactionId).toLowerCase() : null;
    const highlightedRowRef = useRef(null);
    const lastScrolledIdRef = useRef(null);

    const isHighlightMatch = (value) =>
        Boolean(normalizedHighlightId) && value && String(value).toLowerCase() === normalizedHighlightId;

    useEffect(() => {
        if (!normalizedHighlightId) return;
        if (lastScrolledIdRef.current === normalizedHighlightId) return;
        if (!highlightedRowRef.current) return;

        lastScrolledIdRef.current = normalizedHighlightId;
        highlightedRowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }, [filteredTransactions, normalizedHighlightId]);

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
                    t.candidateName?.toLowerCase().includes(term),
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
                useGlobalLoading: false,
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

            // If user landed here after a payment gateway redirect (e.g. ?status=success&orderCode=...),
            // attempt to find the matching transaction and emit a payment_success event.
            try {
                const statusParam = (
                    searchParams.get("status") ||
                    searchParams.get("paymentStatus") ||
                    ""
                ).toLowerCase();
                const orderCode =
                    searchParams.get("orderCode") || searchParams.get("order_id") || searchParams.get("order") || null;

                if (statusParam && ["success", "paid", "completed"].includes(statusParam)) {
                    // try to match by common identifiers
                    let matched = null;
                    if (orderCode) {
                        matched = enriched.find((t) =>
                            [t.orderCode, t.orderId, t.bookingId, t.interviewId, t.id].some(
                                (k) => k && String(k) === String(orderCode),
                            ),
                        );
                    }

                    if (!matched) {
                        // fallback: most recent COMPLETED transaction within last 3 minutes
                        const now = Date.now();
                        const recent = enriched
                            .filter((t) => t.status === "COMPLETED" && t.createdAt)
                            .map((t) => ({
                                tx: t,
                                ts: new Date(t.createdAt).valueOf() || 0,
                            }))
                            .sort((a, b) => b.ts - a.ts);

                        if (recent.length && now - recent[0].ts <= 1000 * 60 * 3) {
                            matched = recent[0].tx;
                        }
                    }

                    if (matched) {
                        try {
                            trackPaymentSuccess(
                                matched.interviewId || matched.bookingId || matched.id || null,
                                matched.amount ?? null,
                            );
                        } catch (e) {
                            console.warn("trackPaymentSuccess failed", e);
                        }
                    }
                }
            } catch (err) {
                console.warn("payment tracking heuristic failed", err);
            }
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
            average: completed.length ? totalSpent / completed.length : 0,
        };
    }, [filteredTransactions]);

    const getStatusConfig = (status) => transactionStatusConfig[status] || transactionStatusConfig.PENDING;

    const getInterviewDetails = (transaction) => {
        if (!transaction) return [];

        // Get interview type (handle both numeric and string)
        const typeValue = transaction?.type ?? transaction?.interviewType ?? transaction?.interviewRoom?.interviewType;
        const interviewType = mapInterviewType(typeValue);

        // Get schedule time
        const scheduleTime =
            transaction?.startTime ||
            transaction?.interviewStartTime ||
            transaction?.interviewRoom?.startTime ||
            transaction?.scheduledAt ||
            transaction?.interviewDate;

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
        <>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <PageHeader title="Payment History" subtitle="View all your interview booking transactions" />
                <Tooltip title="Refresh">
                    <IconButton
                        onClick={fetchPaymentHistory}
                        aria-label="refresh payment history"
                        sx={{ border: "1px solid #d6d9e0", bgcolor: "white" }}
                    >
                        <RefreshRoundedIcon />
                    </IconButton>
                </Tooltip>
            </Stack>

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 320 }}>
                    <CircularProgress size={32} />
                </Box>
            ) : (
                <>
                    {/* Summary */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Box
                                sx={{
                                    p: 3,
                                    bgcolor: "white",
                                    borderRadius: 4,
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                                }}
                            >
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box
                                        sx={{
                                            bgcolor: "#e3f2fd",
                                            color: "#2196f3",
                                            p: 1.5,
                                            borderRadius: 2,
                                            display: "flex",
                                        }}
                                    >
                                        <ReceiptLongRoundedIcon />
                                    </Box>
                                    <Box>
                                        <AppText
                                            variant="caption"
                                            sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}
                                        >
                                            Total Transactions
                                        </AppText>
                                        <Typography variant="h5" fontWeight={700}>
                                            {stats.transactionCount}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Box
                                sx={{
                                    p: 3,
                                    bgcolor: "white",
                                    borderRadius: 4,
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                                }}
                            >
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box
                                        sx={{
                                            bgcolor: "#e8f5e9",
                                            color: "#4caf50",
                                            p: 1.5,
                                            borderRadius: 2,
                                            display: "flex",
                                        }}
                                    >
                                        <CheckCircleRoundedIcon />
                                    </Box>
                                    <Box>
                                        <AppText
                                            variant="caption"
                                            sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}
                                        >
                                            Completed Amount
                                        </AppText>
                                        <Typography variant="h5" fontWeight={700} sx={{ color: "#2e7d32" }}>
                                            {formatCurrency(stats.totalSpent)}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Box
                                sx={{
                                    p: 3,
                                    bgcolor: "white",
                                    borderRadius: 4,
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                                }}
                            >
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box
                                        sx={{
                                            bgcolor: "#fff3e0",
                                            color: "#ff9800",
                                            p: 1.5,
                                            borderRadius: 2,
                                            display: "flex",
                                        }}
                                    >
                                        <HourglassEmptyRoundedIcon />
                                    </Box>
                                    <Box>
                                        <AppText
                                            variant="caption"
                                            sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}
                                        >
                                            Pending Amount
                                        </AppText>
                                        <Typography variant="h5" fontWeight={700} sx={{ color: "#ed6c02" }}>
                                            {formatCurrency(stats.totalPending)}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Box
                                sx={{
                                    p: 3,
                                    bgcolor: "white",
                                    borderRadius: 4,
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                                }}
                            >
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box
                                        sx={{
                                            bgcolor: "#f3e5f5",
                                            color: "#9c27b0",
                                            p: 1.5,
                                            borderRadius: 2,
                                            display: "flex",
                                        }}
                                    >
                                        <AttachMoneyRoundedIcon />
                                    </Box>
                                    <Box>
                                        <AppText
                                            variant="caption"
                                            sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}
                                        >
                                            Average Amount
                                        </AppText>
                                        <Typography variant="h5" fontWeight={700} sx={{ color: "#7b1fa2" }}>
                                            {formatCurrency(stats.average)}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        </Grid>
                    </Grid>

                    {/* Filters */}
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
                        <FormTextField
                            placeholder="Search by coach, interview ID, or candidate..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            sizeVariant="sm"
                            sx={{ flex: 1, bgcolor: "white", borderRadius: 2 }}
                        />
                        <FormControl size="small" sx={{ minWidth: 160, bgcolor: "white", borderRadius: 2 }}>
                            <InputLabel id="history-page-status-label">Status</InputLabel>
                            <FormSelect
                                labelId="history-page-status-label"
                                label="Status"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                sx={{ borderRadius: 2 }}
                            >
                                <MenuItem value="ALL">All Status</MenuItem>
                                <MenuItem value="COMPLETED">Completed</MenuItem>
                                <MenuItem value="PENDING">Pending</MenuItem>
                                <MenuItem value="FAILED">Failed</MenuItem>
                                <MenuItem value="REFUNDED">Refunded</MenuItem>
                            </FormSelect>
                        </FormControl>
                    </Stack>

                    {/* Table */}
                    <Box sx={{ mt: 2 }}>
                        <Table sx={{ borderCollapse: "separate", borderSpacing: "0 12px" }}>
                            <TableHead>
                                <TableRow
                                    sx={{
                                        "& .MuiTableCell-root": {
                                            borderBottom: "none",
                                            color: "text.secondary",
                                            fontWeight: 600,
                                            px: 3,
                                        },
                                    }}
                                >
                                    <TableCell>Date</TableCell>
                                    <TableCell>Interview/Coach</TableCell>
                                    <TableCell>Amount</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(Array.isArray(filteredTransactions) ? filteredTransactions : []).map(
                                    (transaction, index) => {
                                        const statusConfig = getStatusConfig(transaction.status);
                                        const isHighlighted =
                                            Boolean(normalizedHighlightId) && isHighlightMatch(transaction.id);
                                        const highlightBorder = isHighlighted
                                            ? `1px solid ${alpha(theme.palette.success.main, 1)}`
                                            : "none";
                                        const highlightCellSx = isHighlighted
                                            ? {
                                                  borderTop: highlightBorder,
                                                  borderBottom: highlightBorder,
                                              }
                                            : {};
                                        return (
                                            <TableRow
                                                key={transaction.id || transaction.interviewId || index}
                                                ref={isHighlighted ? highlightedRowRef : null}
                                                sx={{
                                                    bgcolor: isHighlighted
                                                        ? alpha(theme.palette.success.main, 0.08)
                                                        : "white",
                                                }}
                                            >
                                                <TableCell
                                                    sx={{
                                                        ...highlightCellSx,
                                                        borderLeft: highlightBorder,
                                                        fontWeight: 600,
                                                        borderTopLeftRadius: 16,
                                                        borderBottomLeftRadius: 16,
                                                    }}
                                                >
                                                    {formatDateSafe(transaction.startTime)}
                                                </TableCell>
                                                <TableCell sx={highlightCellSx}>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {transaction.coachName}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={highlightCellSx}>
                                                    <Typography
                                                        fontWeight={700}
                                                        sx={{
                                                            color: formatAmountDisplay(transaction.amount, isCoach)
                                                                .color,
                                                        }}
                                                    >
                                                        {formatAmountDisplay(transaction.amount, isCoach).text}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={highlightCellSx}>
                                                    <Box
                                                        sx={{
                                                            display: "inline-block",
                                                            px: 2,
                                                            py: 0.5,
                                                            borderRadius: 1.5,
                                                            backgroundColor: statusConfig.bgColor,
                                                            color: statusConfig.color,
                                                            fontWeight: 600,
                                                            fontSize: "0.75rem",
                                                        }}
                                                    >
                                                        {statusConfig.label}
                                                    </Box>
                                                </TableCell>
                                                <TableCell
                                                    align="right"
                                                    sx={{
                                                        ...highlightCellSx,
                                                        borderRight: highlightBorder,
                                                        borderTopRightRadius: 16,
                                                        borderBottomRightRadius: 16,
                                                    }}
                                                >
                                                    <SecondaryButton
                                                        size="sm"
                                                        onClick={() => setSelectedTransaction(transaction)}
                                                    >
                                                        View details
                                                    </SecondaryButton>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    },
                                )}
                            </TableBody>
                        </Table>

                        {(!filteredTransactions || filteredTransactions.length === 0) && (
                            <Box sx={{ textAlign: "center", py: 5 }}>
                                <AppText variant="muted">No transactions found</AppText>
                            </Box>
                        )}
                    </Box>

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
                                        <AppText variant="caption" sx={{ display: "block" }}>
                                            {item.label}
                                        </AppText>
                                        <Typography variant="body2" fontWeight={600}>
                                            {item.value}
                                        </Typography>
                                        <Divider sx={{ mt: 1 }} />
                                    </Box>
                                ))}
                            </Stack>
                        </DialogContent>
                        <DialogActions>
                            <TextButton onClick={() => setSelectedTransaction(null)} size="sm">
                                Close
                            </TextButton>
                        </DialogActions>
                    </Dialog>
                </>
            )}
        </>
    );
};

export default PaymentHistoryPage;
