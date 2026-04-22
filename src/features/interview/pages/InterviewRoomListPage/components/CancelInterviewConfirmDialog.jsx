import {
    Alert,
    Box,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import { PrimaryButton, DangerButton } from "../../../../../common/components/buttons";
import StatusChip from "../../../../../common/components/StatusChip";

function CancelInterviewConfirmDialog({
    open,
    onClose,
    onConfirm,
    confirmLoading = false,
    previewRefundPercent,
    previewRefundAmount,
    bankInfo,
    title = "Cancel Interview",
    confirmText = "Cancel Interview",
    cancelText = "Keep Interview",
    subtitle,
    message,
}) {
    const previewText =
        previewRefundPercent === null
            ? "Unable to calculate refund preview."
            : `${previewRefundPercent}% of the paid amount`;

    const formatCurrency = (amount) => {
        if (typeof amount !== "number" || Number.isNaN(amount)) return "Unable to calculate refund amount.";
        return `${amount.toLocaleString("vi-VN")} VND`;
    };

    const displaySubtitle = subtitle || message || "Are you sure you want to cancel this session?";
    const refundPercentBadge = previewRefundPercent === null ? "Unknown" : `${previewRefundPercent}% of paid amount`;
    const previewRefundColor =
        previewRefundPercent === null
            ? "default"
            : previewRefundPercent >= 100
              ? "success"
              : previewRefundPercent >= 50
                ? "warning"
                : "error";

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            PaperProps={{
                sx: (theme) => ({
                    borderRadius: "28px",
                    overflow: "hidden",
                    bgcolor: "background.paper",
                    border: `1px solid ${theme.palette.divider}`,
                }),
            }}
        >
            <DialogTitle sx={(theme) => ({ px: 3, py: 2.5, borderBottom: `1px solid ${theme.palette.divider}` })}>
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                        <Box
                            sx={(theme) => ({
                                width: 30,
                                height: 30,
                                borderRadius: "50%",
                                border: `1px solid ${theme.palette.error.light}`,
                                color: "error.main",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: alpha(theme.palette.error.main, 0.1),
                            })}
                        >
                            <ErrorOutlineRoundedIcon sx={{ fontSize: 18 }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary", lineHeight: 1.2 }}>
                                {title}
                            </Typography>
                            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                                {displaySubtitle}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={onClose} size="small" sx={{ color: "text.secondary" }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2.25} sx={{ mt: 2.25 }}>
                    <Box
                        sx={(theme) => ({
                            p: 2,
                            borderRadius: "16px",
                            border: `1px solid ${theme.palette.info.light}`,
                            bgcolor: alpha(theme.palette.info.main, 0.08),
                        })}
                    >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                            <InfoOutlinedIcon sx={{ color: "info.main", fontSize: 18 }} />
                            <Typography sx={{ color: "info.dark", fontWeight: 700 }}>Refund Policy</Typography>
                        </Box>
                        <Stack spacing={1}>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "success.main" }} />
                                    <Typography sx={{ color: "text.secondary", fontWeight: 600 }}>
                                        &gt;= 24 hours before start
                                    </Typography>
                                </Box>
                                <StatusChip label="100% Refund" color="success" />
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "warning.main" }} />
                                    <Typography sx={{ color: "text.secondary", fontWeight: 600 }}>
                                        &gt;= 12 hours before start
                                    </Typography>
                                </Box>
                                <StatusChip label="50% Refund" color="warning" />
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "error.main" }} />
                                    <Typography sx={{ color: "text.secondary", fontWeight: 600 }}>
                                        &lt; 12 hours before start
                                    </Typography>
                                </Box>
                                <StatusChip label="No Refund" color="error" />
                            </Box>
                        </Stack>
                    </Box>

                    <Box
                        sx={(theme) => ({
                            p: 2.25,
                            borderRadius: "16px",
                            border: `1px solid ${theme.palette.divider}`,
                            bgcolor: "background.paper",
                        })}
                    >
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.25 }}>
                            <Typography sx={{ color: "text.secondary", fontWeight: 800, letterSpacing: "0.06em" }}>
                                PREVIEW REFUND AMOUNT
                            </Typography>
                            <StatusChip label={refundPercentBadge} color={previewRefundColor} />
                        </Box>
                        <Typography
                            sx={{ color: "text.primary", fontWeight: 900, fontSize: "2.2rem", lineHeight: 1.1 }}
                        >
                            {formatCurrency(previewRefundAmount)}
                        </Typography>
                    </Box>

                    <Box>
                        <Typography sx={{ color: "text.primary", fontWeight: 800, mb: 1.25 }}>
                            Refund Destination
                        </Typography>

                        <Box
                            sx={(theme) => ({
                                p: 1.75,
                                borderRadius: "16px",
                                border: `1px solid ${theme.palette.divider}`,
                                bgcolor: "background.paper",
                            })}
                        >
                            {bankInfo?.loading ? (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <CircularProgress size={16} />
                                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                        Loading bank details...
                                    </Typography>
                                </Box>
                            ) : (
                                <Stack spacing={1}>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            justifyContent: "space-between",
                                            gap: 2,
                                        }}
                                    >
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                                            {bankInfo?.bankLogo ? (
                                                <Box
                                                    sx={theme => ({
                                                        width: 60,
                                                        height: 60,
                                                        borderRadius: "12px",
                                                        border: `1px solid ${alpha(theme.palette.success.main, 0.5)}`,
                                                        bgcolor: "success.50",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                    })}
                                                >
                                                    <Box
                                                        component="img"
                                                        src={bankInfo.bankLogo}
                                                        alt={bankInfo.bankCode || "Bank logo"}
                                                        sx={{ width: "100%", height: "100%", objectFit: "contain" }}
                                                    />
                                                </Box>
                                            ) : (
                                                <Box
                                                    sx={{
                                                        width: 48,
                                                        height: 48,
                                                        borderRadius: "12px",
                                                        bgcolor: "action.hover",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        color: "text.secondary",
                                                    }}
                                                >
                                                    <CreditCardOutlinedIcon fontSize="small" />
                                                </Box>
                                            )}
                                            <Box>
                                                <Typography sx={{ color: "text.primary", fontWeight: 800 }}>
                                                    {bankInfo?.bankCode || "N/A"}
                                                    {bankInfo?.bankShortName ? ` (${bankInfo.bankShortName})` : ""}
                                                </Typography>
                                                <Typography sx={{ color: "text.secondary", mt: 0.25, fontWeight: 600 }}>
                                                    <CreditCardOutlinedIcon
                                                        sx={{ fontSize: 13, mr: 0.6, mb: "-1px" }}
                                                    />
                                                    {bankInfo?.maskedAccountNumber || "N/A"}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {bankInfo?.error ? (
                                        <Alert severity="warning" sx={{ mt: 0.5 }}>
                                            {bankInfo.error}
                                        </Alert>
                                    ) : null}
                                </Stack>
                            )}
                        </Box>
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5 }}>
                <Box sx={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <DangerButton
                        onClick={onConfirm}
                        disabled={confirmLoading}
                    >
                        {confirmLoading ? <CircularProgress size={16} color="inherit" /> : confirmText}
                    </DangerButton>
                    <Box sx={{ minWidth: 150 }}>
                        <PrimaryButton fullWidth onClick={onClose}>
                            {cancelText}
                        </PrimaryButton>
                    </Box>
                </Box>
            </DialogActions>
        </Dialog>
    );
}

export default CancelInterviewConfirmDialog;
