import React from "react";
import { Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { PrimaryButton, TextButton } from "../../../../../common/components/buttons";
import AppText from "../../../../../common/components/AppText";
import SectionHeading from "../../../../../common/components/SectionHeading";

function AssessmentRequiredDialog({ open, onSkip, onProceed, loading = false }) {
    const handleDialogClose = (_event, reason) => {
        if (reason === "backdropClick" || reason === "escapeKeyDown") {
            return;
        }
    };

    return (
        <Dialog open={open} onClose={handleDialogClose} disableEscapeKeyDown fullWidth maxWidth="sm">
            <DialogTitle component="div">
                <SectionHeading title="Assessment Reminder" disableGutters as="h2" />
            </DialogTitle>
            <DialogContent>
                <AppText variant="body">
                    To ensure you have the best experience, please complete the assessment so we can understand you
                    better 🤩
                </AppText>
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
