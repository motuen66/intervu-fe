import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import FormTextField from "../../../../common/components/form/FormTextField";
import { PrimaryButton, SecondaryButton } from "../../../../common/components/buttons";
import { dialogStyles } from "../../../../common/constants/uiStyles";
import { formatCurrency } from "../../../../common/utils/dateFormatter";
import { requestWithdrawal } from "../../services/walletApi";

export default function WithdrawalRequestDialog({ open, onClose, onSuccess, balance }) {
    const [form, setForm] = useState({ amount: 0, notes: "" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const theme = useTheme();

    const handleSubmit = async () => {
        setError("");
        if (form.amount <= 2000) {
            setError("Amount must be greater than 2000.");
            return;
        }
        if (form.amount > balance) {
            setError("Amount exceeds your current balance.");
            return;
        }

        setSaving(true);
        try {
            await requestWithdrawal({ amount: form.amount, notes: form.notes || null });
            onSuccess?.();
            setForm({ amount: 0, notes: "" });
            onClose();
        } catch {
            // Error already handled by callApi
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setForm({ amount: 0, notes: "" });
        setError("");
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: dialogStyles.paper }}>
            <DialogTitle
                sx={{
                    fontWeight: 700,
                    pb: 1,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", color: theme.palette.text.primary }}>
                        Request Withdrawal
                    </Typography>
                    <Typography sx={{ fontSize: "0.85rem", color: theme.palette.text.secondary, mt: 0.5 }}>
                        Available balance: {formatCurrency(balance)}
                    </Typography>
                </Box>
                <IconButton
                    onClick={handleClose}
                    size="small"
                    sx={{
                        color: theme.palette.text.secondary,
                        "&:hover": { backgroundColor: theme.palette.action.hover },
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}
            >
                <DialogContent sx={{ pt: 3 }}>
                    <FormTextField
                        fullWidth
                        label="Amount"
                        type="number"
                        value={form.amount}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val.length <= 12) {
                                setForm({ ...form, amount: Number(val) });
                            }
                        }}
                        inputProps={{ min: 0 }}
                        required
                        helperText={`Maximum: ${formatCurrency(balance)}`}
                    />
                    <FormTextField
                        fullWidth
                        label="Notes (optional)"
                        multiline
                        rows={3}
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        sx={{ mt: 2 }}
                    />
                    {error && <Typography sx={{ color: "error.main", mt: 2, fontSize: "0.85rem" }}>{error}</Typography>}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
                    <SecondaryButton onClick={handleClose} disabled={saving}>
                        Cancel
                    </SecondaryButton>
                    <PrimaryButton type="submit" loading={saving}>
                        Withdraw
                    </PrimaryButton>
                </DialogActions>
            </form>
        </Dialog>
    );
}
