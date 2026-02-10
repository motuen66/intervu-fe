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
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import { interviewTypeEndPoints } from "../../services/interviewTypeApi";
import Box from "@mui/material/Box";

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

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Update Interview Type</DialogTitle>
            <DialogContent>
                <Box display="flex" flexDirection="column" gap={2} mt={1}>
                    <TextField
                        label="Name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        fullWidth
                    />
                    <TextField
                        label="Description"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        fullWidth
                        multiline
                        rows={3}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={form.isCoding}
                                onChange={(e) => setForm({ ...form, isCoding: e.target.checked })}
                            />
                        }
                        label="Is coding"
                    />
                    <TextField
                        label="Duration minutes"
                        type="number"
                        value={form.durationMinutes}
                        onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                    />
                    <TextField
                        label="Base price"
                        type="number"
                        value={form.basePrice}
                        onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })}
                    />
                    <FormControl fullWidth>
                        <InputLabel id="status-label">Status</InputLabel>
                        <Select
                            labelId="status-label"
                            value={form.status}
                            label="Status"
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                        >
                            <MenuItem value={1}>Active</MenuItem>
                            <MenuItem value={0}>Inactive</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} variant="contained" disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
