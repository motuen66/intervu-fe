import { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    CircularProgress,
    Alert,
    Stack,
    Divider,
    Rating,
} from "@mui/material";
import StatusChip from "../../../../common/components/StatusChip";
import { SecondaryButton } from "../../../../common/components/buttons";
import { dialogStyles } from "../../../../common/constants/uiStyles";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import StarIcon from "@mui/icons-material/Star";

function ViewFeedbackModal({ open, onClose, interviewRoomId }) {
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (open && interviewRoomId) {
            fetchFeedback();
        }
    }, [open, interviewRoomId]);

    const fetchFeedback = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await callApi({
                method: METHOD.GET,
                endpoint: `/Feedbacks/interview-room/${interviewRoomId}`,
            });

            console.log("Feedback API Response:", res);

            if (res.success && res.data) {
                console.log("Feedback Data:", res.data);

                // Handle both array and single object response
                let feedbackData = res.data;
                if (Array.isArray(res.data) && res.data.length > 0) {
                    feedbackData = res.data[0]; // Get first feedback if array
                    console.log("Using first feedback from array:", feedbackData);
                }

                setFeedback(feedbackData);
            } else {
                console.log("No feedback found in response");
                setError("No feedback available for this interview.");
            }
        } catch (err) {
            console.error("Error fetching feedback:", err);
            setError("Failed to load feedback. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFeedback(null);
        setError(null);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: dialogStyles.paper }}>
            <DialogTitle>
                <Typography variant="h5" component="div" fontWeight={600}>
                    Interview Feedback
                </Typography>
            </DialogTitle>

            <DialogContent>
                {loading && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress />
                    </Box>
                )}

                {error && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {!loading && !error && !feedback && (
                    <Alert severity="info">
                        No feedback data loaded. Please try again.
                    </Alert>
                )}

                {!loading && feedback && (
                    <Stack spacing={3}>
                        {/* Rating Section */}
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Overall Rating
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Rating
                                    value={feedback.rating || 0}
                                    readOnly
                                    precision={0.5}
                                    icon={<StarIcon fontSize="inherit" />}
                                />
                                <Typography variant="h6" component="div" color="primary">
                                    {feedback.rating ? feedback.rating.toFixed(1) : "N/A"}
                                </Typography>
                            </Stack>
                        </Box>

                        <Divider />

                        {/* Comments Section */}
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Feedback Comments
                            </Typography>
                            <Box
                                sx={{
                                    bgcolor: "grey.50",
                                    p: 2,
                                    borderRadius: "8px",
                                    border: "1px solid",
                                    borderColor: "grey.200",
                                }}
                            >
                                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                                    {feedback.comments || "No comments provided."}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Strengths */}
                        {feedback.strengths && (
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Strengths
                                </Typography>
                                <Box
                                    sx={{
                                        bgcolor: "success.50",
                                        p: 2,
                                        borderRadius: "8px",
                                        border: "1px solid",
                                        borderColor: "success.200",
                                    }}
                                >
                                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                                        {feedback.strengths}
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        {/* Areas for Improvement */}
                        {feedback.areasForImprovement && (
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Areas for Improvement
                                </Typography>
                                <Box
                                    sx={{
                                        bgcolor: "warning.50",
                                        p: 2,
                                        borderRadius: "8px",
                                        border: "1px solid",
                                        borderColor: "warning.200",
                                    }}
                                >
                                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                                        {feedback.areasForImprovement}
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        {/* Status */}
                        <Box>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Typography variant="subtitle2" color="text.secondary">
                                    Status:
                                </Typography>
                                <StatusChip
                                    label={feedback.isSubmitted ? "Submitted" : "Draft"}
                                    color={feedback.isSubmitted ? "success" : "default"}
                                />
                            </Stack>
                        </Box>

                        {/* Submitted Date */}
                        {feedback.submittedAt && (
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Submitted on: {new Date(feedback.submittedAt).toLocaleString()}
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
                <SecondaryButton onClick={handleClose}>
                    Close
                </SecondaryButton>
            </DialogActions>
        </Dialog>
    );
}

export default ViewFeedbackModal;
