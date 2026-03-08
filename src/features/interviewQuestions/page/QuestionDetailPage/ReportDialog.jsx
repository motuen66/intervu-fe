import { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";
import toast from "react-hot-toast";

/**
 * ReportDialog — frontend-only mock.
 * Replace the mock handler body with a real API call when the endpoint is ready.
 */
export default function ReportDialog({ open, onClose, questionTitle, questionAuthor, currentUserName }) {
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!reason.trim()) return;
        setSubmitting(true);
        try {
            // TODO: replace with real API call
            // await callApi({ method: METHOD.POST, endpoint: reportEndPoints.SUBMIT, arg: {
            //     questionTitle, reportedBy: currentUserName, reason: reason.trim(),
            // }});
            await new Promise((r) => setTimeout(r, 400)); // mock network delay
            toast.success("Report submitted successfully");
            setReason("");
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (submitting) return;
        setReason("");
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ pb: 1 }}>Report</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" mb={2}>
                    Help us keep the community safe by reporting inappropriate or misleading content.
                </Typography>
                <Stack gap={2}>
                    <TextField
                        label="Question"
                        value={questionTitle ?? ""}
                        size="small"
                        fullWidth
                        inputProps={{ readOnly: true }}
                        sx={{ "& .MuiInputBase-input": { color: "text.secondary" } }}
                    />
                    <TextField
                        label="Author"
                        value={questionAuthor ?? ""}
                        size="small"
                        fullWidth
                        inputProps={{ readOnly: true }}
                        sx={{ "& .MuiInputBase-input": { color: "text.secondary" } }}
                    />
                    <TextField
                        label="Reported by"
                        value={currentUserName ?? ""}
                        size="small"
                        fullWidth
                        inputProps={{ readOnly: true }}
                        sx={{ "& .MuiInputBase-input": { color: "text.secondary" } }}
                    />
                    <TextField
                        label="Reason *"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        size="small"
                        fullWidth
                        multiline
                        minRows={3}
                        placeholder="Describe the issue..."
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleClose} disabled={submitting} sx={{ textTransform: "none" }}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!reason.trim() || submitting}
                    sx={{ textTransform: "none", borderRadius: 999 }}
                >
                    {submitting ? "Submitting..." : "Submit Report"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
