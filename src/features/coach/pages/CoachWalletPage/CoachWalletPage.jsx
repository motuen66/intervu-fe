import { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import KpiCard from "../../../../common/components/cards/KpiCard";
import PaginationBar from "../../../../common/components/PaginationBar";
import { PrimaryButton } from "../../../../common/components/buttons";
import { formatCurrency, formattedDateTime } from "../../../../common/utils/dateFormatter";
import { getWalletBalance, getWithdrawalHistory } from "../../services/walletApi";
import WithdrawalRequestDialog from "./WithdrawalRequestDialog";
import { useTheme } from "@mui/material/styles";

const getWithdrawalStatusConfig = (theme) => ({
    0: { label: "Pending", color: theme.palette.warning.main, bgColor: theme.palette.warning.light },
    1: { label: "Approved", color: theme.palette.info.main, bgColor: theme.palette.info.light },
    2: { label: "Rejected", color: theme.palette.error.main, bgColor: theme.palette.error.light },
    3: { label: "Completed", color: theme.palette.success.main, bgColor: theme.palette.success.light },
});

const StatusBadge = ({ status }) => {
    const theme = useTheme();
    const configMap = getWithdrawalStatusConfig(theme);
    const config = configMap[status] || configMap[0];
    return (
        <Box
            component="span"
            sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: "6px",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: config.color,
                backgroundColor: config.bgColor,
            }}
        >
            {config.label}
        </Box>
    );
};

const PAGE_SIZE = 10;

export default function CoachWalletPage() {
    const [balance, setBalance] = useState(0);
    const [withdrawals, setWithdrawals] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [balanceRes, historyRes] = await Promise.all([
                getWalletBalance(),
                getWithdrawalHistory(page, PAGE_SIZE),
            ]);
            setBalance(balanceRes?.balance ?? 0);
            setWithdrawals(historyRes?.items ?? []);
            setTotalCount(historyRes?.totalCount ?? 0);
        } catch {
            // handled by callApi
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleWithdrawalSuccess = () => {
        fetchData();
    };

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h5" fontWeight={700}>
                    Wallet
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Tooltip title="Refresh">
                        <IconButton onClick={fetchData} size="small">
                            <RefreshRoundedIcon />
                        </IconButton>
                    </Tooltip>
                    <PrimaryButton onClick={() => setDialogOpen(true)}>
                        Request Withdrawal
                    </PrimaryButton>
                </Box>
            </Box>

            {/* Balance Card */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <KpiCard
                        icon={<AccountBalanceWalletRoundedIcon />}
                        iconColor="success"
                        label="Current Balance"
                        value={formatCurrency(balance)}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <KpiCard
                        icon={<SendRoundedIcon />}
                        iconColor="info"
                        label="Total Withdrawals"
                        value={totalCount}
                    />
                </Grid>
            </Grid>

            {/* Withdrawal History */}
            <Paper
                elevation={0}
                sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 3,
                    overflow: "hidden",
                }}
            >
                <Box sx={{ px: 3, py: 2, borderBottom: "1px solid", borderColor: "divider" }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                        Withdrawal History
                    </Typography>
                </Box>

                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                        <CircularProgress />
                    </Box>
                ) : withdrawals.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 6 }}>
                        <Typography color="text.secondary">No withdrawal requests yet.</Typography>
                    </Box>
                ) : (
                    <>
                        <Table sx={{ borderCollapse: "separate", borderSpacing: "0 4px" }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, color: "text.secondary", fontSize: "0.8rem" }}>
                                        Date
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "text.secondary", fontSize: "0.8rem" }}>
                                        Amount
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "text.secondary", fontSize: "0.8rem" }}>
                                        Bank Account
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "text.secondary", fontSize: "0.8rem" }}>
                                        Status
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "text.secondary", fontSize: "0.8rem" }}>
                                        Processed At
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "text.secondary", fontSize: "0.8rem" }}>
                                        Notes
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {withdrawals.map((w) => (
                                    <TableRow
                                        key={w.id}
                                        sx={{
                                            "&:hover": {
                                                backgroundColor: "action.hover",
                                            },
                                        }}
                                    >
                                        <TableCell sx={{ fontSize: "0.85rem" }}>
                                            {formattedDateTime(w.createdAt)}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: "0.85rem", fontWeight: 600 }}>
                                            {formatCurrency(w.amount)}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: "0.85rem" }}>
                                            {w.bankBinNumber} - {w.bankAccountNumber}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={w.status} />
                                        </TableCell>
                                        <TableCell sx={{ fontSize: "0.85rem" }}>
                                            {w.processedAt ? formattedDateTime(w.processedAt) : "—"}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: "0.85rem", maxWidth: 200 }}>
                                            <Typography noWrap sx={{ fontSize: "0.85rem" }}>
                                                {w.notes || "—"}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        <PaginationBar
                            count={totalPages}
                            page={page}
                            onChange={(_, val) => setPage(val)}
                        />
                    </>
                )}
            </Paper>

            {/* Withdrawal Dialog */}
            <WithdrawalRequestDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSuccess={handleWithdrawalSuccess}
                balance={balance}
            />
        </Container>
    );
}
