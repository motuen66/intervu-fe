import {
    Alert,
    Box,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    Typography,
} from "@mui/material";
import { PrimaryButton, SecondaryButton } from "../../../../../common/components/buttons";

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

    const defaultMessage = `Are you sure you want to cancel this interview?\n\nRefund policy:\n- Cancel >= 24 hours before start time: 100% refund\n- Cancel >= 12 hours before start time: 50% refund\n- Cancel < 12 hours before start time: no refund\n\nPreview (if you cancel now): ${previewText}`;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <Stack spacing={1.25} sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-line", color: "text.secondary" }}>
                        {message || defaultMessage}
                    </Typography>

                    <Box sx={{ p: 1.25, borderRadius: 1.5, bgcolor: "action.hover" }}>
                        <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
                            Preview refund amount
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.25 }}>
                            <strong>Percent:</strong> {previewText}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.25 }}>
                            <strong>Amount:</strong> {formatCurrency(previewRefundAmount)}
                        </Typography>
                    </Box>

                    <Box sx={{ mt: 0.5, p: 1.5, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                            Refund Destination
                        </Typography>

                        {bankInfo?.loading ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <CircularProgress size={16} />
                                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                    Loading bank details...
                                </Typography>
                            </Box>
                        ) : (
                            <Stack spacing={0.75}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                                    {bankInfo?.bankLogo ? (
                                        <Box
                                            component="img"
                                            src={bankInfo.bankLogo}
                                            alt={bankInfo.bankCode || "Bank logo"}
                                            sx={{ width: 32, height: 32, objectFit: "contain", borderRadius: 1 }}
                                        />
                                    ) : null}
                                    <Typography variant="body2">
                                        <strong>Bank:</strong> {bankInfo?.bankCode || "N/A"}
                                        {bankInfo?.bankShortName ? ` (${bankInfo.bankShortName})` : ""}
                                    </Typography>
                                </Box>
                                <Typography variant="body2">
                                    <strong>BIN:</strong> {bankInfo?.bankBinNumber || "N/A"}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Account:</strong> {bankInfo?.maskedAccountNumber || "N/A"}
                                </Typography>
                            </Stack>
                        )}

                        {bankInfo?.error && !bankInfo?.loading && (
                            <Alert severity="warning" sx={{ mt: 1.25 }}>
                                {bankInfo.error}
                            </Alert>
                        )}
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
                <SecondaryButton onClick={onClose}>{cancelText}</SecondaryButton>
                <PrimaryButton onClick={onConfirm} loading={confirmLoading}>
                    {confirmText}
                </PrimaryButton>
            </DialogActions>
        </Dialog>
    );
}

export default CancelInterviewConfirmDialog;
