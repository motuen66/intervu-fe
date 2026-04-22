import { useState } from "react";
import {
    Box,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import toast from "react-hot-toast";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { interactionEndPoints } from "../../service/interactionApi";
import { dialogStyles } from "../../../../common/constants/uiStyles";
import { PrimaryButton, SecondaryButton } from "../../../../common/components/buttons";
import { FormTextField, Tag } from "../../../../common/components";

export default function ReportDialog({ open, onClose, questionId, questionTitle, questionAuthor, currentUserName }) {
    const MAX_REASON_LENGTH = 500;
    const [reason, setReason] = useState("");
    const [reasonError, setReasonError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        const trimmedReason = reason.trim();
        if (!trimmedReason || !questionId) return;

        if (trimmedReason.length >= MAX_REASON_LENGTH) {
            setReasonError(`Reason must be less than ${MAX_REASON_LENGTH} characters.`);
            return;
        }

        setReasonError("");
        setSubmitting(true);
        try {
            await callApi({
                method: METHOD.POST,
                endpoint: interactionEndPoints.REPORT_QUESTION(questionId),
                arg: { reason: trimmedReason },
                useGlobalLoading: false,
            });
            toast.success("Question reported");
            setReason("");
            onClose();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to submit report");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (submitting) return;
        setReason("");
        setReasonError("");
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: dialogStyles.paper }}>
            <DialogTitle
                sx={{
                    pb: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1}>
                    <FlagOutlinedIcon fontSize="small" color="warning" />
                    <Box>
                        <Typography sx={{ fontWeight: 700 }}>Report question</Typography>
                        <Typography variant="caption" color="text.secondary">
                            Help us review content that may violate community guidelines.
                        </Typography>
                    </Box>
                </Stack>

                <IconButton
                    aria-label="close"
                    onClick={handleClose}
                    edge="end"
                    disabled={submitting}
                    sx={{ color: (theme) => theme.palette.grey[500] }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                <Stack gap={2}>
                    <Stack direction="row" flexWrap="wrap" useFlexGap gap={1}>
                        <Tag label={`Author: ${questionAuthor ?? "Unknown"}`} size="sm" variant="outlined" />
                        <Tag label={`Reported by: ${currentUserName ?? "Unknown"}`} size="sm" variant="outlined" />
                    </Stack>

                    <Box
                        sx={{
                            px: 1.5,
                            py: 1.25,
                            borderRadius: 1.5,
                            backgroundColor: "grey.50",
                            border: "1px solid",
                            borderColor: "divider",
                        }}
                    >
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Question
                        </Typography>
                        <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                            {questionTitle ?? "Unknown question"}
                        </Typography>
                    </Box>

                    <FormTextField
                        label="Reason *"
                        value={reason}
                        onChange={(e) => {
                            const nextReason = e.target.value.slice(0, MAX_REASON_LENGTH);
                            setReason(nextReason);
                            if (reasonError && nextReason.trim().length < MAX_REASON_LENGTH) {
                                setReasonError("");
                            }
                        }}
                        sizeVariant="md"
                        fullWidth
                        multiline
                        minRows={4}
                        placeholder="Describe why this question should be reviewed..."
                        error={!!reasonError}
                        helperText={reasonError || `${reason.length}/${MAX_REASON_LENGTH}`}
                    />
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
                <SecondaryButton onClick={handleClose} disabled={submitting}>
                    Cancel
                </SecondaryButton>
                <PrimaryButton
                    onClick={handleSubmit}
                    loading={submitting}
                    disabled={!reason.trim() || !questionId}
                >
                    Submit report
                </PrimaryButton>
            </DialogActions>
        </Dialog>
    );
}
