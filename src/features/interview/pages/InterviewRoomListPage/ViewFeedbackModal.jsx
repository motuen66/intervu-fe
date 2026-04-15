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
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
} from "@mui/material";
import StatusChip from "../../../../common/components/StatusChip";
import { SecondaryButton } from "../../../../common/components/buttons";
import { dialogStyles } from "../../../../common/constants/uiStyles";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { ROLES } from "../../../../common/constants/common";
import StarIcon from "@mui/icons-material/Star";
import CloseIcon from "@mui/icons-material/Close";

function ViewFeedbackModal({ open, onClose, interviewRoomId, user }) {
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const parseEvaluationStructure = (data) => {
        const raw = data?.evaluationStructureJson ?? data?.EvaluationStructureJson ?? data?.evaluationStructure ?? data?.EvaluationStructure;
        if (!raw) return null;
        if (typeof raw === "string") {
            try {
                return JSON.parse(raw);
            } catch (err) {
                return null;
            }
        }
        if (typeof raw === "object") return raw;
        return null;
    };

    useEffect(() => {
        if (open && interviewRoomId && user) {
            fetchFeedback();
        }
    }, [open, interviewRoomId, user]);

    const fetchFeedback = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log("Fetching feedback for role:", user?.role, "Room ID:", interviewRoomId);
            const isCandidate = user?.role == ROLES.CANDIDATE; // Loose equality for safety
            // Now: Candidate views the evaluation they RECEIVED from the coach
            // Coach views the feedback they RECEIVED from the candidate
            const endpoint = isCandidate
                ? `/interviewroom/${interviewRoomId}/coach-evaluation`
                : `/Feedbacks/interview-room/${interviewRoomId}`;

            const res = await callApi({
                method: METHOD.GET,
                endpoint: endpoint,
            });

            console.log("Feedback API Response:", res);

            if (res.success && res.data) {
                if (res.data?.evaluationResults) {
                    // Evaluation data (usually for Candidate viewing Coach's feedback)
                    setFeedback(res.data);
                } else {
                    // Standard feedback data (usually for Coach viewing Candidate's feedback)
                    // Handle both array and single object response
                    let feedbackData = res.data;
                    if (Array.isArray(res.data) && res.data.length > 0) {
                        feedbackData = res.data[0];
                    }
                    setFeedback(feedbackData);
                }
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

    const evaluationStructure = parseEvaluationStructure(feedback || {});
    const evaluationResults = feedback?.evaluationResults || evaluationStructure?.results || [];
    const resolvedOthers = feedback?.others ?? evaluationStructure?.others;
    const resolvedHireDecision =
        feedback?.hireDecision ?? feedback?.hideDecision ?? evaluationStructure?.hireDecision ?? evaluationStructure?.hideDecision;
    const resolvedIsHire = feedback?.isHire ?? feedback?.IsHire;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    ...dialogStyles.paper,
                    borderRadius: "24px",
                    overflow: "hidden",
                }
            }}
        >
            <DialogTitle sx={{ p: 3, pb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }} component="div">
                <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: "-0.01em" }} component="span">
                    Performance Feedback
                </Typography>
                <IconButton onClick={handleClose} size="small" sx={{ color: "text.secondary" }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                {loading && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        {/* <CircularProgress /> */}
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
                        {evaluationResults.length > 0 ? (
                            /* Evaluation Results View (Questions + Scores) */
                            <Box>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                    Evaluation Details
                                </Typography>
                                <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "grey.200", borderRadius: "12px" }}>
                                    <Table size="medium">
                                        <TableHead sx={{ bgcolor: "grey.50" }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700 }}>Critria / Question</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 700, width: 100 }}>Score</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Feedback Details</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {evaluationResults?.map((item, index) => (
                                                <TableRow key={index} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                                                    <TableCell component="th" scope="row">
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {item.question}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Box
                                                            sx={{
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                width: 36,
                                                                height: 36,
                                                                borderRadius: "50%",
                                                                bgcolor: item.score >= 8 ? "success.50" : item.score >= 5 ? "warning.50" : "error.50",
                                                                color: item.score >= 8 ? "success.dark" : item.score >= 5 ? "warning.dark" : "error.dark",
                                                                fontWeight: 700,
                                                                border: "1px solid",
                                                                borderColor: item.score >= 8 ? "success.100" : item.score >= 5 ? "warning.100" : "error.100",
                                                            }}
                                                        >
                                                            {item.score}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                                                            {item.answer || "No specific feedback."}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {(resolvedHireDecision !== undefined || resolvedIsHire !== undefined) && (
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600 }}>Hire Decision</TableCell>
                                                    <TableCell align="center">-</TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {resolvedHireDecision
                                                                ? String(resolvedHireDecision).toLowerCase() === "yes"
                                                                    ? "Yes"
                                                                    : "No"
                                                                : resolvedIsHire
                                                                  ? "Yes"
                                                                  : "No"}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {resolvedOthers && (
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600 }}>Others</TableCell>
                                                    <TableCell align="center">-</TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                                                            {resolvedOthers}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                <Box sx={{ mt: 3, p: 2, bgcolor: "primary.50", borderRadius: "8px", border: "1px solid", borderColor: "primary.100" }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="subtitle2" color="primary.dark">
                                            Evaluation Status
                                        </Typography>
                                        <StatusChip
                                            label={feedback.isEvaluationCompleted ? "Fully Evaluated" : "In Progress"}
                                            color={feedback.isEvaluationCompleted ? "success" : "warning"}
                                        />
                                    </Stack>
                                </Box>

                            </Box>
                        ) : (
                            /* Candidate View: Standard Feedback (Rating + Comments) */
                            <>
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
                            </>
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
