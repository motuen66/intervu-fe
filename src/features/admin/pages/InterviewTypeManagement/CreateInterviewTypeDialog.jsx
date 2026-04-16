import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { interviewTypeEndPoints } from "../../services/interviewTypeApi";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { PrimaryButton, SecondaryButton } from "../../../../common/components/buttons";
import FormTextField from "../../../../common/components/form/FormTextField";
import FormSelect from "../../../../common/components/form/FormSelect";
import { FormControl, InputLabel } from "@mui/material";

const DURATION_OPTIONS = Array.from({ length: 10 }, (_, i) => (i + 1) * 30);

export default function CreateInterviewTypeDialog({ open, onClose, onCreated }) {
    const [form, setForm] = useState({
        name: "",
        description: "",
        isCoding: false,
        suggestedDurationMinutes: 30,
        minPrice: 0,
        maxPrice: 0,
        status: 1,
        evaluationStructure: [
            {
                type: "",
                question: "",
            },
        ],
    });
    const [saving, setSaving] = useState(false);

    const resetForm = () => {
        setForm({
            name: "",
            description: "",
            isCoding: false,
            suggestedDurationMinutes: 30,
            minPrice: 0,
            maxPrice: 0,
            status: 1,
            evaluationStructure: [
                {
                    type: "",
                    question: "",
                },
            ],
        });
    };

    const handleChange = (key) => (e) => {
        const value = e?.target?.type === "checkbox" ? e.target.checked : e.target.value;
        setForm((s) => ({ ...s, [key]: value }));
    };

    const handleEvaluationChange = (index, key, value) => {
        setForm((s) => {
            const next = [...(s.evaluationStructure || [])];
            next[index] = { ...next[index], [key]: value };
            return { ...s, evaluationStructure: next };
        });
    };

    const handleAddEvaluation = () => {
        setForm((s) => ({
            ...s,
            evaluationStructure: [...(s.evaluationStructure || []), { type: "", question: "" }],
        }));
    };

    const handleRemoveEvaluation = (index) => {
        setForm((s) => {
            const next = [...(s.evaluationStructure || [])];
            next.splice(index, 1);
            return {
                ...s,
                evaluationStructure: next.length === 0 ? [{ type: "", question: "" }] : next,
            };
        });
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            const evaluationStructure = (form.evaluationStructure || [])
                .map((item) => ({
                    type: item.type?.trim() || "",
                    question: item.question?.trim() || "",
                }))
                .filter((item) => item.type || item.question);

            await callApi({
                method: METHOD.POST,
                endpoint: interviewTypeEndPoints.CREATE_TYPE,
                arg: { ...form, evaluationStructure },
            });
            onCreated && onCreated();
            resetForm();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
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
                        Create interview type
                    </Typography>
                    <Typography sx={{ fontSize: "0.85rem", color: "#6b7280", mt: 0.5 }}>
                        Define the defaults used for scheduling and pricing.
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
                            <FormControl fullWidth required>
                                <InputLabel id="status-label">Status</InputLabel>
                                <FormSelect
                                    labelId="status-label"
                                    label="Status"
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                >
                                    <MenuItem value={1}>Active</MenuItem>
                                    <MenuItem value={0}>Inactive</MenuItem>
                                </FormSelect>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sx={{ width: "100%" }}>
                            <FormControl fullWidth required>
                                <InputLabel id="duration-label">Suggested Duration (minutes)</InputLabel>
                                <FormSelect
                                    labelId="duration-label"
                                    label="Suggested Duration (minutes)"
                                    value={form.suggestedDurationMinutes}
                                    onChange={(e) => setForm({ ...form, suggestedDurationMinutes: Number(e.target.value) })}
                                >
                                    {DURATION_OPTIONS.map((duration) => (
                                        <MenuItem key={duration} value={duration}>
                                            {duration} minutes
                                        </MenuItem>
                                    ))}
                                </FormSelect>
                            </FormControl>
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
                                control={<Checkbox checked={form.isCoding} onChange={handleChange("isCoding")} />}
                                label="Coding interview"
                                sx={{
                                    "& .MuiFormControlLabel-label": { color: "#111827" },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sx={{ width: "100%" }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                                <Typography sx={{ fontWeight: 600, color: "#111827" }}>Evaluation structure</Typography>
                            </Box>

                            <Box display="flex" flexDirection="column" gap={2}>
                                {(form.evaluationStructure || []).map((item, idx) => (
                                    <Box
                                        key={idx}
                                        sx={{
                                            border: "1px solid #e5e7eb",
                                            borderRadius: 1.5,
                                            p: 2,
                                            bgcolor: "#f8fafc",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 1.5,
                                        }}
                                    >
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography sx={{ fontWeight: 600, fontSize: "0.95rem" }}>
                                                Item {idx + 1}
                                            </Typography>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleRemoveEvaluation(idx)}
                                                disabled={(form.evaluationStructure || []).length === 1}
                                            >
                                                <DeleteOutlineIcon fontSize="small" />
                                            </IconButton>
                                        </Box>

                                        <FormTextField
                                            fullWidth
                                            label="Category / Type"
                                            value={item.type}
                                            onChange={(e) => handleEvaluationChange(idx, "type", e.target.value)}
                                            required
                                        />
                                        <FormTextField
                                            fullWidth
                                            label="Guiding question"
                                            value={item.question}
                                            onChange={(e) => handleEvaluationChange(idx, "question", e.target.value)}
                                            multiline
                                            rows={3}
                                            required
                                        />
                                    </Box>
                                ))}
                                <SecondaryButton
                                    variant="outlined"
                                    startIcon={<AddCircleOutlineIcon />}
                                    onClick={handleAddEvaluation}
                                >
                                    Add
                                </SecondaryButton>
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
                    <SecondaryButton onClick={handleClose} disabled={saving}>
                        Cancel
                    </SecondaryButton>
                    <PrimaryButton type="submit" loading={saving}>
                        Create interview type
                    </PrimaryButton>
                </DialogActions>
            </form>
        </Dialog>
    );
}
