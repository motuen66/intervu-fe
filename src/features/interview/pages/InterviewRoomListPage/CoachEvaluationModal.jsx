import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, CircularProgress, Modal, Slider, Stack, TextField, Typography, Divider } from "@mui/material";
import { callApi } from "../../../../common/utils/apiConnector.js";
import { METHOD } from "../../../../common/constants/api.js";
import { interviewEndPoints } from "../../services/interviewRoomApi";
import { buttonStyles, dialogStyles, fieldStyles } from "../../../../common/constants/uiStyles";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

function CoachEvaluationModal({ open, room, onClose, onSubmitted }) {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [items, setItems] = useState([]);
    const [otherFeedback, setOtherFeedback] = useState("");
    const [error, setError] = useState("");
    const [isCompleted, setIsCompleted] = useState(false);

    const interviewLabel = useMemo(() => {
        if (!room?.scheduledTime) return "";
        try {
            const start = new Date(room.scheduledTime);
            const end = room.durationMinutes ? new Date(start.getTime() + room.durationMinutes * 60000) : null;
            const startLabel = start.toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
            });
            const endLabel = end?.toLocaleTimeString(undefined, { timeStyle: "short" });
            return endLabel ? `${startLabel} - ${endLabel}` : startLabel;
        } catch (err) {
            return "";
        }
    }, [room]);

    useEffect(() => {
        const fetchEvaluation = async () => {
            if (!open || !room?.id) return;
            setLoading(true);
            setError("");
            try {
                const res = await callApi({
                    method: METHOD.GET,
                    endpoint: interviewEndPoints.GET_COACH_EVALUATION(room.id),
                    alertErrorMessage: true,
                });
                const data = res?.data;

                const allResults = data?.evaluationResults || [];
                
                // 1. Filter out "Other" from the main items list
                const filteredResults = allResults
                    .filter(r => (r.type || r.Type) !== "Other")
                    .map(item => ({
                        type: item.type || item.Type || "",
                        question: item.question || item.Question || "",
                        score: item.score ?? item.Score ?? 0,
                        answer: item.answer ?? item.Answer ?? ""
                    }));

                setItems(filteredResults);
                
                // 2. Always reset other feedback to empty string on load, regardless of database content
                setOtherFeedback("");

                setIsCompleted(Boolean(data?.isEvaluationCompleted));
            } catch (err) {
                setError(err?.response?.data?.message || "Failed to load evaluation form.");
            } finally {
                setLoading(false);
            }
        };

        fetchEvaluation();
    }, [open, room?.id]);

    const handleItemChange = (index, field, value) => {
        setItems((prev) =>
            prev.map((item, i) =>
                i === index
                    ? {
                        ...item,
                        [field]: field === "score" ? Number(value) : value,
                    }
                    : item,
            ),
        );
    };

    const handleSubmit = async () => {
        if (!room?.id) return;
        setError("");

        // Validation: Enforce fill in response for the main items
        if (items.some(item => !item.answer || item.answer.trim() === "")) {
            setError("Please provide feedback for all evaluation items.");
            return;
        }

        if (items.some((item) => item.score < 0 || item.score > 10)) {
            setError("Scores must be between 0 and 10.");
            return;
        }

        setSubmitting(true);
        try {
            const resultsToSubmit = [...items];
            
            // Append "Other" feedback to the results if provided
            if (otherFeedback.trim() !== "") {
                resultsToSubmit.push({
                    type: "Other",
                    question: "Overall / Other Feedback",
                    score: 10, // Default score for other feedback
                    answer: otherFeedback
                });
            }

            await callApi({
                method: METHOD.POST,
                endpoint: interviewEndPoints.SUBMIT_COACH_EVALUATION(room.id),
                arg: { results: resultsToSubmit },
                displaySuccessMessage: true,
                alertErrorMessage: true,
            });
            setIsCompleted(true);
            if (onSubmitted) {
                onSubmitted();
            }
            // onClose will be handled by the parent or by calling it here
            if (onClose) {
                onClose();
            }
        } catch (err) {
            setError(err?.response?.data?.message || err?.response?.message || "Failed to submit evaluation.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = (event, reason) => {
        // If it's role coach/interviewer leaving room, they MUST submit.
        // The modal logic for "hasPending" already handles blocking close if not completed.
        const hasPending = !isCompleted && !error;
        if (hasPending) {
            return;
        }
        setItems([]);
        setOtherFeedback("");
        setError("");
        setIsCompleted(false);
        if (onClose) {
            onClose();
        }
    };

    const getScoreLabel = (score) => {
        if (score <= 2) return "Very Bad";
        if (score <= 4) return "Bad";
        if (score <= 6) return "Average";
        if (score <= 8) return "Good";
        return "Very Good";
    };

    const getScoreColor = (score) => {
        if (score <= 2) return "error.main";
        if (score <= 4) return "warning.main";
        if (score <= 6) return "info.main";
        if (score <= 8) return "primary.main";
        return "success.main";
    };

    return (
        <Modal open={open} onClose={handleClose} aria-labelledby="coach-evaluation-modal">
            <Box
                sx={(theme) => ({
                    ...dialogStyles.paper(theme),
                    width: 800,
                    maxWidth: "90vw",
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    p: 3,
                })}
            >
                <Typography id="coach-evaluation-modal" variant="h5" component="h2" sx={{ mb: 1, fontWeight: 700 }}>
                    Final Interview Evaluation
                </Typography>

                {room?.candidateName && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Candidate: <strong>{room.candidateName}</strong>
                    </Typography>
                )}
                {interviewLabel && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {interviewLabel}
                    </Typography>
                )}

                <Alert
                    severity="warning"
                    icon={<WarningAmberIcon />}
                    sx={{ mb: 2, '& .MuiAlert-message': { fontWeight: 600 } }}
                >
                    Note: You can only submit feedback one time. After submission, both you and the candidate will only be able to view it.
                </Alert>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Stack alignItems="center" sx={{ py: 4 }}>
                        <CircularProgress size={28} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Loading evaluation form...
                        </Typography>
                    </Stack>
                ) : (
                    <Stack spacing={2} sx={{ maxHeight: "60vh", overflowY: "auto", pr: 1 }}>
                        {items.length === 0 ? (
                            <Typography color="text.secondary">No evaluation items configured.</Typography>
                        ) : (
                            items.map((item, index) => (
                                <Box
                                    key={`${item.type}-${index}`}
                                    sx={{
                                        border: "1px solid",
                                        borderColor: "divider",
                                        borderRadius: 2,
                                        p: 2,
                                        bgcolor: "#F9FAFB"
                                    }}
                                >
                                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 700 }}>
                                        {item.question}
                                    </Typography>
                                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 0.5 }}>
                                        <Box sx={{ flex: 1 }}>
                                            <Slider
                                                value={item.score}
                                                min={0}
                                                max={10}
                                                step={1}
                                                marks
                                                valueLabelDisplay="auto"
                                                onChange={(_, val) => handleItemChange(index, "score", val)}
                                            />
                                            <Stack direction="row" justifyContent="space-between" sx={{ mt: -1 }}>
                                                <Typography variant="caption" color="text.secondary">Very Bad</Typography>
                                                <Typography variant="caption" color="text.secondary">Average</Typography>
                                                <Typography variant="caption" color="text.secondary">Very Good</Typography>
                                            </Stack>
                                        </Box>
                                        <Box sx={{ width: 80, textAlign: "right" }}>
                                            <Typography variant="h6" color={getScoreColor(item.score)} sx={{ fontWeight: 700, lineHeight: 1 }}>
                                                {item.score}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {getScoreLabel(item.score)}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                    <TextField
                                        label="Response / Feedback"
                                        placeholder="Enter detailed feedback here..."
                                        value={item.answer || ""}
                                        onChange={(e) => handleItemChange(index, "answer", e.target.value)}
                                        multiline
                                        minRows={2}
                                        fullWidth
                                        required
                                        sx={(theme) => ({ ...fieldStyles.outlinedFocus(theme), bgcolor: "white" })}
                                        margin="dense"
                                    />
                                </Box>
                            ))
                        )}

                        <Divider sx={{ my: 1 }} />

                        <Box sx={{ p: 2, border: "1px solid", borderColor: "primary.light", borderRadius: 2, bgcolor: "#EFF6FF" }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: "primary.main" }}>
                                Other / Additional Feedback (Optional)
                            </Typography>
                            <TextField
                                label="Other Comments"
                                placeholder="Any other observations or closing thoughts..."
                                value={otherFeedback}
                                onChange={(e) => setOtherFeedback(e.target.value)}
                                multiline
                                minRows={3}
                                fullWidth
                                sx={(theme) => ({ ...fieldStyles.outlinedFocus(theme), bgcolor: "white" })}
                            />
                        </Box>

                        <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ pt: 1, pb: 1 }}>
                            <Button
                                variant="contained"
                                disabled={submitting || items.length === 0}
                                onClick={handleSubmit}
                                sx={(theme) => ({ ...buttonStyles.primaryCta(theme), px: 4, py: 1.5 })}
                            >
                                {submitting ? "Submitting..." : "Submit and Leave Room"}
                            </Button>
                        </Stack>
                    </Stack>
                )}
            </Box>
        </Modal>
    );
}

export default CoachEvaluationModal;
