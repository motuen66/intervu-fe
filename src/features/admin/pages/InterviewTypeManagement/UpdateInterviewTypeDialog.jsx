import React, { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import MenuItem from "@mui/material/MenuItem";
import Grid from "@mui/material/Grid";
import { interviewTypeEndPoints } from "../../services/interviewTypeApi";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import { dialogStyles } from "../../../../common/constants/uiStyles";
import { PrimaryButton, SecondaryButton } from "../../../../common/components/buttons";
import FormTextField from "../../../../common/components/form/FormTextField";

export default function UpdateInterviewTypeDialog({ open, onClose, item, onUpdated }) {
    const [form, setForm] = useState({
        name: "",
        description: "",
        isCoding: false,
        suggestedDurationMinutes: 30,
        minPrice: 0,
        maxPrice: 0,
        status: 1,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (item) {
            setForm({
                name: item.name || "",
                description: item.description || "",
                isCoding: !!item.isCoding,
                suggestedDurationMinutes: item.suggestedDurationMinutes || 30,
                minPrice: item.minPrice || 0,
                maxPrice: item.maxPrice || 0,
                status: item.status ?? 1,
            });
        }
    }, [item]);

    const handleSubmit = async () => {
        if (!item) return;
        setSaving(true);
        try {
            await callApi({
                method: METHOD.PUT,
                endpoint: interviewTypeEndPoints.UPDATE_TYPE(item.id),
                // include id to ensure backend receives the identifying key
                arg: { id: item.id, ...form },
                displaySuccessMessage: true,
                alertErrorMessage: true,
            });
            onUpdated && onUpdated();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
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
                        Edit interview type
                    </Typography>
                    <Typography sx={{ fontSize: "0.85rem", color: "#6b7280", mt: 0.5 }}>
                        Update the details used for scheduling and pricing.
                    </Typography>
                </Box>
                <IconButton
                    onClick={handleClose}
                    size="small"
                    sx={{
                        color: "#6b7280",
                        "&:hover": { background: "rgba(15,23,42,0.06)" },
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
                    <Grid container spacing={2.5} direction="column">
                        <Grid item xs={12} sx={{ width: "100%" }}>
                            <FormTextField
                                fullWidth
                                label="Name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sx={{ width: "100%" }}>
                            <FormTextField
                                fullWidth
                                label="Description"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                multiline
                                rows={4}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sx={{ width: "100%" }}>
                            <FormTextField
                                fullWidth
                                select
                                label="Status"
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value })}
                                required
                            >
                                <MenuItem value={1}>Active</MenuItem>
                                <MenuItem value={0}>Inactive</MenuItem>
                            </FormTextField>
                        </Grid>
                        <Grid item xs={12} sx={{ width: "100%" }}>
                            <FormTextField
                                fullWidth
                                label="Suggested Duration (minutes)"
                                type="number"
                                value={form.suggestedDurationMinutes}
                                onChange={(e) => setForm({ ...form, suggestedDurationMinutes: Number(e.target.value) })}
                                inputProps={{ min: 0 }}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sx={{ width: "100%" }}>
                            <FormTextField
                                fullWidth
                                label="Min Price"
                                type="number"
                                value={form.minPrice}
                                onChange={(e) => setForm({ ...form, minPrice: Number(e.target.value) })}
                                inputProps={{ min: 0 }}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sx={{ width: "100%" }}>
                            <FormTextField
                                fullWidth
                                label="Max Price"
                                type="number"
                                value={form.maxPrice}
                                onChange={(e) => setForm({ ...form, maxPrice: Number(e.target.value) })}
                                inputProps={{ min: 0 }}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sx={{ width: "100%" }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={form.isCoding}
                                        onChange={(e) => setForm({ ...form, isCoding: e.target.checked })}
                                    />
                                }
                                label="Coding interview"
                                sx={{
                                    "& .MuiFormControlLabel-label": { color: "#111827" },
                                }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
                    <SecondaryButton onClick={handleClose} disabled={saving}>
                        Cancel
                    </SecondaryButton>
                    <PrimaryButton type="submit" loading={saving}>
                        Save changes
                    </PrimaryButton>
                </DialogActions>
            </form>
        </Dialog>
    );
}
