import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import { createCoachInterviewService } from "../../services/coachInterviewServiceApi";
import FormTextField from "../../../../common/components/form/FormTextField";
import { dialogStyles } from "../../../../common/constants/uiStyles";
import { PrimaryButton, SecondaryButton } from "../../../../common/components/buttons";

export default function CreateCoachServiceDialog({ open, onClose, onCreated, interviewTypes }) {
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
            setError("Please select an interview type.");
            return;
        }
        if (selectedType && (form.price < selectedType.minPrice || form.price > selectedType.maxPrice)) {
            setError(`Price must be between ${selectedType.minPrice} and ${selectedType.maxPrice}.`);
            return;
        }
        if (form.durationMinutes < 15 || form.durationMinutes > 300) {
            setError("Duration must be between 15 and 300 minutes.");
            return;
        }

        setSaving(true);
        try {
            await createCoachInterviewService(form);
            onCreated && onCreated();
            setForm({ interviewTypeId: "", price: 0, durationMinutes: 30 });
        } catch (err) {
            setError(err.message || "Failed to create service.");
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
                                        price: type?.minPrice || s.price,
                                    }));
                                }}
                                required
                            >
                                {console.log(interviewTypes)}
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
                                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
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
                                label="Duration (minutes)"
                                type="number"
                                value={form.durationMinutes}
                                onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                                inputProps={{ min: 15, max: 300 }}
                                required
                                helperText="Between 15 and 300 minutes"
                            />
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
