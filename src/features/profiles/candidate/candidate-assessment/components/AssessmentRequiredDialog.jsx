import React from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";

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
                <Button onClick={onSkip} disabled={loading}>
                    Skip
                </Button>
                <Button
                    variant="contained"
                    sx={{
                        bgcolor: "var(--mui-palette-secondary-main)",
                        color: "var(--mui-palette-primary-main)",
                        "&:hover": {
                            bgcolor: "var(--mui-palette-primary-main)",
                            color: "var(--mui-palette-secondary-main)",
                        },
                    }}
                    onClick={onProceed}
                    disabled={loading}
                >
                    Let&apos;s go
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AssessmentRequiredDialog;
