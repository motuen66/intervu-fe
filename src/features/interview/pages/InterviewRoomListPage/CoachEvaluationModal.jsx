import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    FormControl,
    FormControlLabel,
    FormHelperText,
    IconButton,
    Modal,
    Radio,
    RadioGroup,
    Slider,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { callApi } from "../../../../common/utils/apiConnector.js";
import { METHOD } from "../../../../common/constants/api.js";
import { interviewEndPoints } from "../../services/interviewRoomApi";
import { buttonStyles, dialogStyles, fieldStyles } from "../../../../common/constants/uiStyles";

function CoachEvaluationModal({
    open,
    room,
    onClose,
    onSubmitted,
    allowClose = false,
    showCloseButton = false,
}) {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [items, setItems] = useState([]);
    const [error, setError] = useState("");
    const [others, setOthers] = useState("");
    const [hireDecision, setHireDecision] = useState("");

    const normalizeHireDecision = (value) => {
        if (value === true) return "yes";
        if (value === false) return "no";
        if (typeof value === "string") {
            const normalized = value.trim().toLowerCase();
            if (normalized === "yes" || normalized === "no") return normalized;
            if (normalized === "true") return "yes";
            if (normalized === "false") return "no";
        }
        return "";
    };

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
                const evaluationStructure = parseEvaluationStructure(data);

                // Normalize keys to ensure consistency (handles both lowercase and PascalCase from API)
                const normalizedResults = (
                    data?.evaluationResults ||
                    evaluationStructure?.evaluationResults ||
                    evaluationStructure?.results ||
                    []
                ).map(item => ({
                    type: item.type || item.Type || "",
                    question: item.question || item.Question || "",
                    score: item.score ?? item.Score ?? 0,
                    answer: item.answer ?? item.Answer ?? ""
                }));

                setItems(normalizedResults);
                setOthers(data?.others ?? data?.Others ?? evaluationStructure?.others ?? "");
                setHireDecision(
                    normalizeHireDecision(
                        data?.hireDecision ??
                        data?.isHire ??
                        evaluationStructure?.hireDecision ??
                        "",
                    ),
                );
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
        const othersWordCount = others.trim() ? others.trim().split(/\s+/).length : 0;
        if (items.some((item) => item.score < 0 || item.score > 10)) {
            setError("Scores must be between 0 and 10.");
            return;
        }
        if (othersWordCount > 300) {
            setError("Others must be 300 words or fewer.");
            return;
        }
        if (!hireDecision) {
            setError("Please choose a hire decision.");
            return;
        }
        setSubmitting(true);
        try {
            const cleanedOthers = others.trim();
            const pascalCaseResults = items.map((item) => ({
                Type: item.type,
                Score: item.score,
                Answer: item.answer ?? "",
                Question: item.question,
            }));
            const evaluationStructurePayload = {
                results: items,
                evaluationResults: pascalCaseResults,
                others: cleanedOthers,
                hireDecision,
                hideDecision: hireDecision,
            };
            const evaluationStructureJson = JSON.stringify(evaluationStructurePayload);

            await callApi({
                method: METHOD.POST,
                endpoint: interviewEndPoints.SUBMIT_COACH_EVALUATION(room.id),
                arg: {
                    results: items,
                    others: cleanedOthers,
                    hireDecision,
                    evaluationStructure: evaluationStructureJson,
                    evaluationStructureJson,
                },
                displaySuccessMessage: true,
                alertErrorMessage: true,
            });
            if (onSubmitted) {
                onSubmitted();
            }
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to submit evaluation.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = (event, reason) => {
        if (!allowClose) {
            return;
        }
        setItems([]);
        setOthers("");
        setHireDecision("");
        setError("");
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

    const othersWordCount = others.trim() ? others.trim().split(/\s+/).length : 0;
    const handleOthersChange = (event) => {
        const nextValue = event.target.value;
        const words = nextValue.trim() ? nextValue.trim().split(/\s+/) : [];

        if (words.length <= 300) {
            setOthers(nextValue);
            return;
        }

        setOthers(words.slice(0, 300).join(" "));
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="coach-evaluation-modal"
            disableEscapeKeyDown={!allowClose}
        >
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
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography id="coach-evaluation-modal" variant="h5" component="h2">
                        Incomplete Mock Interview Evaluation
                    </Typography>
                    {showCloseButton && (
                        <IconButton
                            aria-label="Close evaluation modal"
                            onClick={handleClose}
                            sx={{ color: "text.secondary", cursor: "pointer" }}
                        >
                            <CloseIcon />
                        </IconButton>
                    )}
                </Stack>
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
                                    }}
                                >
                                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
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
                                        label="Feedback"
                                        value={item.answer || ""}
                                        onChange={(e) => handleItemChange(index, "answer", e.target.value)}
                                        multiline
                                        minRows={2}
                                        fullWidth
                                        sx={(theme) => fieldStyles.outlinedFocus(theme)}
                                        margin="dense"
                                    />
                                </Box>
                            ))
                        )}
                        <Box
                            sx={{
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 2,
                                p: 2,
                            }}
                        >
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Others
                            </Typography>
                            <TextField
                                label="Additional notes"
                                value={others}
                                onChange={handleOthersChange}
                                multiline
                                minRows={3}
                                fullWidth
                                sx={(theme) => fieldStyles.outlinedFocus(theme)}
                                error={othersWordCount > 300}
                                helperText={`${othersWordCount}/300 words`}
                            />
                        </Box>

                        <Box
                            sx={{
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 2,
                                p: 2,
                            }}
                        >
                            <FormControl required error={!hireDecision && !!error}>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                    Hire Decision
                                </Typography>
                                <RadioGroup
                                    row
                                    value={hireDecision}
                                    onChange={(e) => setHireDecision(e.target.value)}
                                >
                                    <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                                    <FormControlLabel value="no" control={<Radio />} label="No" />
                                </RadioGroup>
                                {!hireDecision && !!error && <FormHelperText>Please select Yes or No.</FormHelperText>}
                            </FormControl>
                        </Box>
                        <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ pt: 1 }}>
                            <Button
                                variant="contained"
                                disabled={submitting || items.length === 0}
                                onClick={handleSubmit}
                                sx={(theme) => ({ ...buttonStyles.primaryCta(theme) })}
                            >
                                {submitting ? "Submitting..." : "Submit"}
                            </Button>
                        </Stack>
                    </Stack>
                )}
            </Box>
        </Modal>
    );
}

export default CoachEvaluationModal;
