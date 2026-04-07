import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import { updateCoachInterviewService } from "../../services/coachInterviewServiceApi";
import FormTextField from "../../../../common/components/form/FormTextField";
import { dialogStyles } from "../../../../common/constants/uiStyles";
import { PrimaryButton, SecondaryButton } from "../../../../common/components/buttons";

export default function UpdateCoachServiceDialog({ open, onClose, item, onUpdated }) {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        price: 0,
        durationMinutes: 30,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (item) {
            setForm({
                price: item.price || 0,
                durationMinutes: item.durationMinutes || 30,
            });
        }
    }, [item]);

    const handleSubmit = async () => {
        if (!item) return;
        setError("");
        if (form.durationMinutes < 15 || form.durationMinutes > 300) {
            setError(t("coach.services.dialog.error_duration"));
            return;
        }

        setSaving(true);
        try {
            await updateCoachInterviewService(item.id, form);
            onUpdated && onUpdated();
        } catch (err) {
            // callApi alertErrorMessage: true already handles the toast.
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
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
                    <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", color: "#111827" }}>
                        {t("coach.services.dialog.update_title")}
                    </Typography>
                    <Typography sx={{ fontSize: "0.85rem", color: "#6b7280", mt: 0.5 }}>
                        {item?.interviewTypeName
                            ? t("coach.services.dialog.update_subtitle", { name: item.interviewTypeName })
                            : t("coach.services.dialog.update_subtitle_fallback")}
                    </Typography>
                </Box>
                <IconButton
                    onClick={handleClose}
                    size="small"
                    sx={{ color: "#6b7280", "&:hover": { background: "rgba(15,23,42,0.06)" } }}
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
                    <Grid container spacing={2.5} direction="column">
                        {/* Read-only interview type name */}
                        <Grid item xs={12} sx={{ width: "100%" }}>
                            <FormTextField
                                fullWidth
                                label={t("coach.services.dialog.label_type")}
                                value={item?.interviewTypeName || ""}
                                InputProps={{ readOnly: true }}
                            />
                        </Grid>

                        <Grid item xs={12} sx={{ width: "100%" }}>
                            <FormTextField
                                fullWidth
                                label={t("coach.services.dialog.label_price")}
                                type="number"
                                value={form.price}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val.length <= 9) {
                                        setForm({ ...form, price: Number(val) });
                                    }
                                }}
                                inputProps={{ min: 0 }}
                                required
                            />
                        </Grid>

                        <Grid item xs={12} sx={{ width: "100%" }}>
                            <FormTextField
                                fullWidth
                                label={t("coach.services.dialog.label_duration")}
                                type="number"
                                value={form.durationMinutes}
                                onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                                inputProps={{ min: 15, max: 300 }}
                                required
                                helperText={t("coach.services.dialog.hint_duration")}
                            />
                        </Grid>
                    </Grid>

                    {error && <Typography sx={{ color: "error.main", mt: 2, fontSize: "0.85rem" }}>{error}</Typography>}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
                    <SecondaryButton onClick={handleClose} disabled={saving}>
                        {t("coach.services.dialog.btn_cancel")}
                    </SecondaryButton>
                    <PrimaryButton type="submit" loading={saving}>
                        {t("coach.services.dialog.btn_save")}
                    </PrimaryButton>
                </DialogActions>
            </form>
        </Dialog>
    );
}
