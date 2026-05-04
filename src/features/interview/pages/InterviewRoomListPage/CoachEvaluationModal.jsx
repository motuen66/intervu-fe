import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
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
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { callApi } from "../../../../common/utils/apiConnector.js";
import { METHOD } from "../../../../common/constants/api.js";
import { interviewEndPoints } from "../../services/interviewRoomApi";
import { dialogStyles, fieldStyles } from "../../../../common/constants/uiStyles";
import FormTextField from "../../../../common/components/form/FormTextField";
import { PrimaryButton, TextButton } from "../../../../common/components/buttons";
import SectionHeading from "../../../../common/components/SectionHeading";
import AppText from "../../../../common/components/AppText";
import ConfirmModal from "../../../../common/components/ConfirmModal";
import toast from "react-hot-toast";

function CoachEvaluationModal({ open, room, onClose, onSubmitted, onLeaveWithoutEvaluating, allowClose = false }) {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [items, setItems] = useState([]);
    const [error, setError] = useState("");
    const [others, setOthers] = useState("");
    const [hireDecision, setHireDecision] = useState("");
    const [emergencyConfirmOpen, setEmergencyConfirmOpen] = useState(false);
    const [checkpointContext, setCheckpointContext] = useState(null);

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
        const raw =
            data?.evaluationStructureJson ??
            data?.EvaluationStructureJson ??
            data?.evaluationStructure ??
            data?.EvaluationStructure;
        if (!raw) return null;
        if (typeof raw === "string") {
            try {
                return JSON.parse(raw);
            } catch {
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
        } catch {
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
                ).map((item) => ({
                    type: item.type || item.Type || "",
                    question: item.question || item.Question || "",
                    score: item.score ?? item.Score ?? 0,
                    answer: item.answer ?? item.Answer ?? "",
                }));

                setItems(normalizedResults);
                setOthers(data?.others ?? data?.Others ?? evaluationStructure?.others ?? "");
                setHireDecision(
                    normalizeHireDecision(
                        data?.hireDecision ?? data?.isHire ?? evaluationStructure?.hireDecision ?? "",
                    ),
                );
                setCheckpointContext({
                    roadmapNodeId: data?.roadmapNodeId ?? data?.RoadmapNodeId ?? "",
                    passThreshold: data?.checkpointPassThreshold ?? data?.CheckpointPassThreshold ?? 70,
                });
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
                displaySuccessMessage: false,
                alertErrorMessage: true,
            });
            toast.success("Score submitted. Roadmap checkpoint is updating.");
            if (onSubmitted) {
                onSubmitted();
            }
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to submit evaluation.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!allowClose) {
            return;
        }
        setItems([]);
        setOthers("");
        setHireDecision("");
        setCheckpointContext(null);
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
        <>
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
                    <SectionHeading title="Incomplete Mock Interview Evaluation" as="h2" disableGutters />
                    {room?.candidateName && (
                        <AppText variant="muted" sx={{ mb: 0.5 }}>
                            Candidate: <strong>{room.candidateName}</strong>
                        </AppText>
                    )}
                    {interviewLabel && (
                        <AppText variant="muted" sx={{ mb: 2 }}>
                            {interviewLabel}
                        </AppText>
                    )}
                    {checkpointContext?.roadmapNodeId && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Roadmap live checkpoint. Passing threshold: {checkpointContext.passThreshold}%.
                        </Alert>
                    )}
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    {loading ? (
                        <Stack alignItems="center" sx={{ py: 4 }}>
                            <CircularProgress size={28} />
                            <AppText variant="muted" sx={{ mt: 1 }}>
                                Loading evaluation form...
                            </AppText>
                        </Stack>
                    ) : (
                        <Stack spacing={2} sx={{ maxHeight: "60vh", overflowY: "auto", pr: 1 }}>
                            {items.length === 0 ? (
                                <AppText variant="muted">No evaluation items configured.</AppText>
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
                                        <AppText variant="bodyStrong" sx={{ mb: 0.5 }}>
                                            {item.question}
                                        </AppText>
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
                                                    <AppText variant="caption">Very Bad</AppText>
                                                    <AppText variant="caption">Average</AppText>
                                                    <AppText variant="caption">Very Good</AppText>
                                                </Stack>
                                            </Box>
                                            <Box sx={{ width: 80, textAlign: "right" }}>
                                                <Typography
                                                    variant="h6"
                                                    color={getScoreColor(item.score)}
                                                    sx={{ fontWeight: 700, lineHeight: 1 }}
                                                >
                                                    {item.score}
                                                </Typography>
                                                <AppText variant="caption">{getScoreLabel(item.score)}</AppText>
                                            </Box>
                                        </Stack>
                                        <FormTextField
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
                                <AppText variant="bodyStrong" sx={{ mb: 1 }}>
                                    Others
                                </AppText>
                                <FormTextField
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
                                    {!hireDecision && !!error && (
                                        <FormHelperText>Please select Yes or No.</FormHelperText>
                                    )}
                                </FormControl>
                            </Box>
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                spacing={1}
                                sx={{ pt: 1 }}
                            >
                                {onLeaveWithoutEvaluating ? (
                                    <TextButton onClick={() => setEmergencyConfirmOpen(true)} disabled={submitting}>
                                        Leave without evaluating
                                    </TextButton>
                                ) : (
                                    <Box />
                                )}
                                <PrimaryButton disabled={submitting || items.length === 0} onClick={handleSubmit}>
                                    {submitting ? "Submitting..." : "Submit"}
                                </PrimaryButton>
                            </Stack>
                        </Stack>
                    )}
                </Box>
            </Modal>
            {onLeaveWithoutEvaluating && (
                <ConfirmModal
                    show={emergencyConfirmOpen}
                    title="Leave without submitting evaluation?"
                    message={
                        "This is intended for emergencies. The candidate's evaluation will not be saved or submitted, and you will exit the room immediately."
                    }
                    onConfirm={() => {
                        setEmergencyConfirmOpen(false);
                        onLeaveWithoutEvaluating();
                    }}
                    onCancel={() => setEmergencyConfirmOpen(false)}
                    confirmText="Leave anyway"
                    cancelText="Stay"
                    confirmVariant="danger"
                />
            )}
        </>
    );
}

export default CoachEvaluationModal;
