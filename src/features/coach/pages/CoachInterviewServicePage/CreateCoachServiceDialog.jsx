import React, { useState } from "react";
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
import { createCoachInterviewService } from "../../services/coachInterviewServiceApi";
import FormTextField from "../../../../common/components/form/FormTextField";
import { dialogStyles } from "../../../../common/constants/uiStyles";
import { PrimaryButton, SecondaryButton } from "../../../../common/components/buttons";
import { MenuItem } from "@mui/material";

export default function CreateCoachServiceDialog({ open, onClose, onCreated, interviewTypes }) {
    const { t } = useTranslation();
    if (!interviewTypes) interviewTypes = [];
    const [form, setForm] = useState({
        interviewTypeId: "",
        price: 0,
        durationMinutes: 30,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const selectedType = interviewTypes.find((t) => t.id === form.interviewTypeId);

    const handleSubmit = async () => {
        setError("");
        if (!form.interviewTypeId) {
            setError(t("coach.services.dialog.error_select_type"));
            return;
        }
        if (selectedType && (form.price < selectedType.minPrice || form.price > selectedType.maxPrice)) {
            setError(t("coach.services.dialog.error_price_range", { min: selectedType.minPrice, max: selectedType.maxPrice }));
            return;
        }
        if (form.durationMinutes < 15 || form.durationMinutes > 300) {
            setError(t("coach.services.dialog.error_duration"));
            return;
        }

        setSaving(true);
        try {
            await createCoachInterviewService(form);
            onCreated && onCreated();
            setForm({ interviewTypeId: "", price: 0, durationMinutes: 30 });
        } catch (err) {
            // callApi with alertErrorMessage: true already shows the toast.
            // We just catch it here to stop the saving flow and avoid crashing.
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setForm({ interviewTypeId: "", price: 0, durationMinutes: 30 });
        setError("");
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: dialogStyles.paper }}
        >
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
                        {t("coach.services.dialog.create_title")}
                    </Typography>
                    <Typography sx={{ fontSize: "0.85rem", color: "#6b7280", mt: 0.5 }}>
                        {t("coach.services.dialog.subtitle")}
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
                        <Grid item xs={12} sx={{ width: "100%" }}>
                            <FormTextField
                                fullWidth
                                select
                                label={t("coach.services.dialog.label_type")}
                                value={form.interviewTypeId}
                                onChange={(e) => {
                                    const typeId = e.target.value;
                                    const type = interviewTypes.find((t) => t.id === typeId);
                                    setForm((s) => ({
                                        ...s,
                                        interviewTypeId: typeId,
                                        durationMinutes: type?.suggestedDurationMinutes || s.durationMinutes,
                                        price: type?.minPrice || s.price,
                                    }));
                                }}
                                required
                            >
                                {console.log(interviewTypes)}
                                {interviewTypes.map((t) => (
                                    <MenuItem key={t.id} value={t.id}>
                                        {t.name} {t.isCoding ? `(${t("coach.services.card.coding")})` : ""}
                                    </MenuItem>
                                ))}
                            </FormTextField>
                        </Grid>

                        {selectedType && (
                            <Grid item xs={12} sx={{ width: "100%" }}>
                                <Box
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        backgroundColor: "#f0f4ff",
                                        fontSize: "0.82rem",
                                        color: "#4338ca",
                                    }}
                                >
                                    {t("coach.services.dialog.hint_range", { min: selectedType.minPrice, max: selectedType.maxPrice, suggested: selectedType.suggestedDurationMinutes })}
                                </Box>
                            </Grid>
                        )}

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
                                helperText={
                                    selectedType ? t("coach.services.dialog.hint_allowed", { min: selectedType.minPrice, max: selectedType.maxPrice }) : ""
                                }
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
                        {t("coach.services.dialog.btn_add")}
                    </PrimaryButton>
                </DialogActions>
            </form>
        </Dialog>
    );
}
