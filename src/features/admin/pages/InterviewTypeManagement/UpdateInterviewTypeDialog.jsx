import React, { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import MenuItem from "@mui/material/MenuItem";
import Grid from "@mui/material/Grid";
import { interviewTypeEndPoints } from "../../services/interviewTypeApi";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";

export default function UpdateInterviewTypeDialog({ open, onClose, item, onUpdated }) {
    const [form, setForm] = useState({
        name: "",
        description: "",
        isCoding: false,
        durationMinutes: 30,
        basePrice: 0,
        status: 1,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (item) {
            setForm({
                name: item.name || "",
                description: item.description || "",
                isCoding: !!item.isCoding,
                durationMinutes: item.durationMinutes || 30,
                basePrice: item.basePrice || 0,
                status: item.status ?? 1,
            });
        }
    }, [item]);

    const handleSubmit = async () => {
        if (!item) return;
        setSaving(true);
        try {
            const response = await fetch(interviewTypeEndPoints.UPDATE_TYPE(item.id), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                // include id to ensure backend receives the identifying key
                body: JSON.stringify({ id: item.id, ...form }),
            });
            if (!response.ok) {
                const text = await response.text().catch(() => "");
                throw new Error(`Request failed: ${response.status} ${response.statusText} ${text}`);
            }
            const data = await response.json().catch(() => {
                throw new Error("Invalid JSON response from interview types endpoint");
            });
            if (!data || data.success === false) {
                throw new Error(data?.message || "Interview types API returned an error");
            }
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

    const primaryCtaSx = {
        textTransform: "none",
        background: "#2f5cf6",
        color: "#ffffff",
        px: 3,
        py: 1,
        borderRadius: "999px",
        fontSize: "14px",
        fontWeight: 600,
        boxShadow: "0 10px 24px rgba(47, 92, 246, 0.32)",
        "&:hover": {
            background: "#2952e6",
        },
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    background: "rgba(255,255,255,0.98)",
                },
            }}
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
                        <TextField
                            fullWidth
                            label="Name"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    "&:hover fieldset": { borderColor: "#667eea" },
                                    "&.Mui-focused fieldset": { borderColor: "#667eea" },
                                },
                                "& .MuiInputLabel-root.Mui-focused": { color: "#667eea" },
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sx={{ width: "100%" }}>
                        <TextField
                            fullWidth
                            label="Description"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            multiline
                            rows={4}
                            required
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    "&:hover fieldset": { borderColor: "#667eea" },
                                    "&.Mui-focused fieldset": { borderColor: "#667eea" },
                                },
                                "& .MuiInputLabel-root.Mui-focused": { color: "#667eea" },
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sx={{ width: "100%" }}>
                        <TextField
                            fullWidth
                            select
                            label="Status"
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                            required
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    "&:hover fieldset": { borderColor: "#667eea" },
                                    "&.Mui-focused fieldset": { borderColor: "#667eea" },
                                },
                                "& .MuiInputLabel-root.Mui-focused": { color: "#667eea" },
                            }}
                        >
                            <MenuItem value={1}>Active</MenuItem>
                            <MenuItem value={0}>Inactive</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sx={{ width: "100%" }}>
                        <TextField
                            fullWidth
                            label="Duration (minutes)"
                            type="number"
                            value={form.durationMinutes}
                            onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                            inputProps={{ min: 0 }}
                            required
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    "&:hover fieldset": { borderColor: "#667eea" },
                                    "&.Mui-focused fieldset": { borderColor: "#667eea" },
                                },
                                "& .MuiInputLabel-root.Mui-focused": { color: "#667eea" },
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sx={{ width: "100%" }}>
                        <TextField
                            fullWidth
                            label="Base price"
                            type="number"
                            value={form.basePrice}
                            onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })}
                            inputProps={{ min: 0 }}
                            required
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    "&:hover fieldset": { borderColor: "#667eea" },
                                    "&.Mui-focused fieldset": { borderColor: "#667eea" },
                                },
                                "& .MuiInputLabel-root.Mui-focused": { color: "#667eea" },
                            }}
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
                    <Button
                        onClick={handleClose}
                        disabled={saving}
                        sx={primaryCtaSx}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={saving}
                        sx={primaryCtaSx}
                    >
                        {saving ? "Saving..." : "Save changes"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
