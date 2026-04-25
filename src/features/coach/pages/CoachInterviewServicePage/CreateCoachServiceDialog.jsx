import React, { useState } from "react";
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
import { trackCreateService } from "../../../../utils/analytics";
import FormTextField from "../../../../common/components/form/FormTextField";
import { dialogStyles } from "../../../../common/constants/uiStyles";
import { PrimaryButton, SecondaryButton } from "../../../../common/components/buttons";
import { MenuItem } from "@mui/material";

const DURATION_OPTIONS = Array.from({ length: 10 }, (_, i) => (i + 1) * 30);

export default function CreateCoachServiceDialog({ open, onClose, onCreated, interviewTypes }) {
    if (!interviewTypes) interviewTypes = [];
    const [form, setForm] = useState({
        interviewTypeId: "",
        price: "",
        durationMinutes: 30,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const selectedType = interviewTypes.find((t) => t.id === form.interviewTypeId);

    const handleSubmit = async () => {
        setError("");
        const price = Number(form.price || 0);
        const durationMinutes = Number(form.durationMinutes || 0);
        if (!form.interviewTypeId) {
            setError("Please select an interview type.");
            return;
        }
        if (selectedType && (price < selectedType.minPrice || price > selectedType.maxPrice)) {
            setError(`Price must be between ${selectedType.minPrice} and ${selectedType.maxPrice}.`);
            return;
        }
        if (durationMinutes < 15 || durationMinutes > 300) {
            setError("Duration must be between 15 and 300 minutes.");
            return;
        }
        if (durationMinutes % 30 !== 0) {
            setError("Duration must be a multiple of 30 minutes.");
            return;
        }

        setSaving(true);
        try {
            const payload = { ...form, price, durationMinutes };
            const res = await createCoachInterviewService(payload);
            try {
                trackCreateService(res?.id ?? null, form.interviewTypeId, price, durationMinutes);
            } catch (e) {}
            onCreated && onCreated();
            setForm({ interviewTypeId: "", price: "", durationMinutes: 30 });
        } catch (err) {
            // callApi with alertErrorMessage: true already shows the toast.
            // We just catch it here to stop the saving flow and avoid crashing.
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setForm({ interviewTypeId: "", price: "", durationMinutes: 30 });
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
                        Add interview service
                    </Typography>
                    <Typography sx={{ fontSize: "0.85rem", color: "#6b7280", mt: 0.5 }}>
                        Select an interview type and set your custom price &amp; duration.
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
                                label="Interview Type"
                                value={form.interviewTypeId}
                                onChange={(e) => {
                                    const typeId = e.target.value;
                                    const type = interviewTypes.find((t) => t.id === typeId);
                                    setForm((s) => ({
                                        ...s,
                                        interviewTypeId: typeId,
                                        durationMinutes: type?.suggestedDurationMinutes || s.durationMinutes,
                                        price: type?.minPrice ?? s.price,
                                    }));
                                }}
                                required
                            >
                                {interviewTypes.map((t) => (
                                    <MenuItem key={t.id} value={t.id}>
                                        {t.name} {t.isCoding ? "(Coding)" : ""}
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
                                    Price range: {selectedType.minPrice} – {selectedType.maxPrice} · Suggested duration:{" "}
                                    {selectedType.suggestedDurationMinutes} min
                                </Box>
                            </Grid>
                        )}

                        <Grid item xs={12} sx={{ width: "100%" }}>
                            <FormTextField
                                fullWidth
                                label="Your Price"
                                type="number"
                                value={form.price}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val.length <= 9) {
                                        setForm({ ...form, price: val });
                                    }
                                }}
                                inputProps={{ min: 0 }}
                                required
                                helperText={
                                    selectedType ? `Allowed: ${selectedType.minPrice} – ${selectedType.maxPrice}` : ""
                                }
                            />
                        </Grid>

                        <Grid item xs={12} sx={{ width: "100%" }}>
                            <FormTextField
                                fullWidth
                                select
                                label="Duration (minutes)"
                                value={form.durationMinutes}
                                onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                                required
                                helperText="30-minute blocks only (30 to 300 minutes)"
                            >
                                {DURATION_OPTIONS.map((duration) => (
                                    <MenuItem key={duration} value={duration}>
                                        {duration} minutes
                                    </MenuItem>
                                ))}
                            </FormTextField>
                        </Grid>
                    </Grid>

                    {error && <Typography sx={{ color: "error.main", mt: 2, fontSize: "0.85rem" }}>{error}</Typography>}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
                    <SecondaryButton onClick={handleClose} disabled={saving}>
                        Cancel
                    </SecondaryButton>
                    <PrimaryButton type="submit" loading={saving}>
                        Add service
                    </PrimaryButton>
                </DialogActions>
            </form>
        </Dialog>
    );
}
