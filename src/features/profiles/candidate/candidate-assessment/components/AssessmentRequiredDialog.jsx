import React from "react";
import { Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { PrimaryButton, TextButton } from "../../../../../common/components/buttons";

function AssessmentRequiredDialog({ open, onSkip, onProceed, loading = false }) {
    const handleDialogClose = (_event, reason) => {
        if (reason === "backdropClick" || reason === "escapeKeyDown") {
            return;
        }
    };

    return (
        <Dialog open={open} onClose={handleDialogClose} disableEscapeKeyDown fullWidth maxWidth="sm">
            <DialogTitle sx={{ fontWeight: 700, fontSize: 24 }}>Assessment Reminder</DialogTitle>
            <DialogContent>
                <Typography>
                    To ensure you have the best experience, please complete the assessment so we can understand you
                    better 🤩
                </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <TextButton onClick={onSkip} disabled={loading}>
                    Skip
                </TextButton>
                <PrimaryButton onClick={onProceed} loading={loading}>
                    Let&apos;s go
                </PrimaryButton>
            </DialogActions>
        </Dialog>
    );
}

export default AssessmentRequiredDialog;
