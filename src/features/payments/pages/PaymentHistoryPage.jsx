import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
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
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import { callApi } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";
import SecondaryButton from "../../../common/components/buttons/SecondaryButton";
import { interviewEndPoints } from "../../interview/services/interviewRoomApi";
import { profileEndPoints } from "../../profile/services/profileApi";
import { formatCurrency } from "../../../common/utils/dateFormatter";
import { ROLES } from "../../../common/constants/common";

const transactionStatusConfig = {
    PENDING: { color: "#FFA500", bgColor: "#FFF3E0" },
    COMPLETED: { color: "#4CAF50", bgColor: "#E8F5E9" },
    FAILED: { color: "#F44336", bgColor: "#FFEBEE" },
    REFUNDED: { color: "#2196F3", bgColor: "#E3F2FD" },
};

// Map status to i18n key
const getStatusTranslationKey = (status) => {
    const keyMap = {
        PENDING: "payment_history.filters.pending",
        COMPLETED: "payment_history.filters.completed",
        FAILED: "payment_history.filters.failed",
        REFUNDED: "payment_history.filters.refunded",
    };
    return keyMap[status] || "payment_history.filters.pending";
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

const mapInterviewType = (typeCode) => {
    const typeMap = {
        0: "interview_types.technical_interview",
        1: "interview_types.behavioral_interview",
        2: "interview_types.system_design",
        3: "interview_types.coding_interview",
        4: "interview_types.mock_interview",
    };
    
    if (typeof typeCode === "number") {
        return typeMap[typeCode] || "interview_types.interview";
    }
    
    // If already a string, return as-is or assume it's a key
    return typeCode || "interview_types.interview";
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
    const { t } = useTranslation();
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
            average: completed.length ? totalSpent / completed.length : 0,
        };
    }, [filteredTransactions]);

    const getStatusConfig = (status) => transactionStatusConfig[status] || transactionStatusConfig.PENDING;

    const getInterviewDetails = (transaction) => {
        if (!transaction) return [];

        // Get interview type (handle both numeric and string)
        const typeValue = transaction?.type ?? transaction?.interviewType ?? transaction?.interviewRoom?.interviewType;
        const interviewTypeKey = mapInterviewType(typeValue);
        const interviewType = t(`payment_history.${interviewTypeKey}`);

        // Get schedule time
        const scheduleTime = transaction?.startTime 
            || transaction?.interviewStartTime 
            || transaction?.interviewRoom?.startTime 
            || transaction?.scheduledAt 
            || transaction?.interviewDate;

        return [
            { label: t("payment_history.interview_details.coach"), value: transaction.coachName || "-" },
            { label: t("payment_history.interview_details.candidate"), value: transaction.candidateName || "-" },
            { label: t("payment_history.interview_details.interview_type"), value: interviewType },
            { label: t("payment_history.interview_details.schedule"), value: formatDateTimeSafe(scheduleTime) },
            { label: t("payment_history.interview_details.payment_date"), value: formatDateSafe(transaction.createdAt) },
            { label: t("payment_history.interview_details.amount"), value: formatCurrency(transaction.amount || 0) },
            { label: t("payment_history.interview_details.status"), value: t(getStatusTranslationKey(transaction.status)) },
        ];
    };

    return (
        <Box sx={{ bgcolor: "#f8f9fb", minHeight: "100vh", py: 4 }}>
            <Container maxWidth="lg">
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Box>
                        <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5, fontFamily: "var(--heading-font)" }}>
                            {t("payment_history.title")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "var(--body-font)" }}>
                            {t("payment_history.subtitle")}
                        </Typography>
                    </Box>
                    <Tooltip title={t("payment_history.refresh_tooltip")}>
                        <IconButton onClick={fetchPaymentHistory} aria-label="refresh payment history" sx={{ border: "1px solid #d6d9e0", bgcolor: 'white' }}>
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
                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Box sx={{ bgcolor: '#e3f2fd', color: '#2196f3', p: 1.5, borderRadius: 2, display: 'flex' }}>
                                            <ReceiptLongRoundedIcon />
                                        </Box>
                                        <Box>
                                            <Typography color="text.secondary" variant="caption" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: "var(--body-font)" }}>
                                                {t("payment_history.stats.total_transactions")}
                                            </Typography>
                                            <Typography variant="h5" fontWeight={700} sx={{ fontFamily: "var(--heading-font)" }}>{stats.transactionCount}</Typography>
                                        </Box>
                                    </Stack>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Box sx={{ bgcolor: '#e8f5e9', color: '#4caf50', p: 1.5, borderRadius: 2, display: 'flex' }}>
                                            <CheckCircleRoundedIcon />
                                        </Box>
                                        <Box>
                                            <Typography color="text.secondary" variant="caption" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: "var(--body-font)" }}>
                                                {t("payment_history.stats.completed_amount")}
                                            </Typography>
                                            <Typography variant="h5" fontWeight={700} sx={{ color: '#2e7d32', fontFamily: "var(--heading-font)" }}>
                                                {formatCurrency(stats.totalSpent)}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Box sx={{ bgcolor: '#fff3e0', color: '#ff9800', p: 1.5, borderRadius: 2, display: 'flex' }}>
                                            <HourglassEmptyRoundedIcon />
                                        </Box>
                                        <Box>
                                            <Typography color="text.secondary" variant="caption" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: "var(--body-font)" }}>
                                                {t("payment_history.stats.pending_amount")}
                                            </Typography>
                                            <Typography variant="h5" fontWeight={700} sx={{ color: '#ed6c02', fontFamily: "var(--heading-font)" }}>
                                                {formatCurrency(stats.totalPending)}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Box sx={{ bgcolor: '#f3e5f5', color: '#9c27b0', p: 1.5, borderRadius: 2, display: 'flex' }}>
                                            <AttachMoneyRoundedIcon />
                                        </Box>
                                        <Box>
                                            <Typography color="text.secondary" variant="caption" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: "var(--body-font)" }}>
                                                {t("payment_history.stats.average_amount")}
                                            </Typography>
                                            <Typography variant="h5" fontWeight={700} sx={{ color: '#7b1fa2', fontFamily: "var(--heading-font)" }}>
                                                {formatCurrency(stats.average)}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Box>
                            </Grid>
                        </Grid>

                        {/* Filters */}
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
                            <TextField
                                placeholder={t("payment_history.filters.search_placeholder")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                size="small"
                                sx={{ flex: 1, bgcolor: 'white', borderRadius: 2, fontFamily: "var(--body-font)" }}
                                variant="outlined"
                            />
                            <TextField
                                select
                                label={t("payment_history.filters.status_label")}
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                size="small"
                                sx={{ minWidth: 160, bgcolor: 'white', borderRadius: 2, fontFamily: "var(--body-font)" }}
                            >
                                <MenuItem value="ALL" sx={{ fontFamily: "var(--body-font)" }}>{t("payment_history.filters.all_status")}</MenuItem>
                                <MenuItem value="COMPLETED" sx={{ fontFamily: "var(--body-font)" }}>{t("payment_history.filters.completed")}</MenuItem>
                                <MenuItem value="PENDING" sx={{ fontFamily: "var(--body-font)" }}>{t("payment_history.filters.pending")}</MenuItem>
                                <MenuItem value="FAILED" sx={{ fontFamily: "var(--body-font)" }}>{t("payment_history.filters.failed")}</MenuItem>
                                <MenuItem value="REFUNDED" sx={{ fontFamily: "var(--body-font)" }}>{t("payment_history.filters.refunded")}</MenuItem>
                            </TextField>
                        </Stack>

                        {/* Table */}
                        <Box sx={{ mt: 2 }}>
                            <Table sx={{ borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                                <TableHead>
                                    <TableRow sx={{ '& .MuiTableCell-root': { borderBottom: 'none', color: 'text.secondary', fontWeight: 600, px: 3, fontFamily: "var(--heading-font)" } }}>
                                        <TableCell>{t("payment_history.table.date")}</TableCell>
                                        <TableCell>{t("payment_history.table.interview_coach")}</TableCell>
                                        <TableCell>{t("payment_history.table.amount")}</TableCell>
                                        <TableCell>{t("payment_history.table.status")}</TableCell>
                                        <TableCell align="right">{t("payment_history.table.action")}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(Array.isArray(filteredTransactions) ? filteredTransactions : []).map((transaction, index) => {
                                        const statusConfig = getStatusConfig(transaction.status);
                                        return (
                                            <TableRow 
                                                key={transaction.id || transaction.interviewId || index}
                                                sx={{ 
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                                    bgcolor: 'white',
                                                    '&:hover': { boxShadow: '0 8px 16px rgba(0,0,0,0.06)' },
                                                    '& .MuiTableCell-root': { border: 'none', py: 2.5, px: 3 }
                                                }}
                                            >
                                                <TableCell sx={{ fontWeight: 600, borderTopLeftRadius: 16, borderBottomLeftRadius: 16, fontFamily: "var(--body-font)" }}>
                                                    {formatDateSafe(transaction.startTime)}
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600} sx={{ fontFamily: "var(--body-font)" }}>{transaction.coachName}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography fontWeight={700} sx={{ color: formatAmountDisplay(transaction.amount, isCoach).color, fontFamily: "var(--body-font)" }}>
                                                        {formatAmountDisplay(transaction.amount, isCoach).text}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
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
                                                            fontFamily: "var(--body-font)",
                                                        }}
                                                    >
                                                        {t(getStatusTranslationKey(transaction.status))}
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right" sx={{ borderTopRightRadius: 16, borderBottomRightRadius: 16 }}>
                                                    <SecondaryButton
                                                        size="small"
                                                        onClick={() => setSelectedTransaction(transaction)}
                                                        sx={{ py: 0.5, px: 2, fontFamily: "var(--body-font)" }}
                                                    >
                                                        {t("payment_history.table.view_details")}
                                                    </SecondaryButton>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>

                            {(!filteredTransactions || filteredTransactions.length === 0) && (
                                <Box sx={{ textAlign: "center", py: 5 }}>
                                    <Typography color="text.secondary" sx={{ fontFamily: "var(--body-font)" }}>{t("payment_history.table.no_transactions")}</Typography>
                                </Box>
                            )}
                        </Box>

                        <Dialog
                            open={Boolean(selectedTransaction)}
                            onClose={() => setSelectedTransaction(null)}
                            fullWidth
                            maxWidth="sm"
                        >
                            <DialogTitle sx={{ fontFamily: "var(--heading-font)" }}>{t("common.modals.payment_details.title")}</DialogTitle>
                            <DialogContent dividers>
                                <Stack spacing={1.25}>
                                    {getInterviewDetails(selectedTransaction).map((item) => (
                                        <Box key={item.label}>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontFamily: "var(--body-font)" }}>
                                                {item.label}
                                            </Typography>
                                            <Typography variant="body2" fontWeight={600} sx={{ fontFamily: "var(--body-font)" }}>
                                                {item.value}
                                            </Typography>
                                            <Divider sx={{ mt: 1 }} />
                                        </Box>
                                    ))}
                                </Stack>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setSelectedTransaction(null)} sx={{ fontFamily: "var(--body-font)" }}>{t("common.modals.payment_details.btn_close")}</Button>
                            </DialogActions>
                        </Dialog>
                    </>
                )}
            </Container>
        </Box>
    );
};

export default PaymentHistoryPage;
