import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, CircularProgress, Modal, Slider, Stack, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { callApi } from "../../../../common/utils/apiConnector.js";
import { METHOD } from "../../../../common/constants/api.js";
import { interviewEndPoints } from "../../services/interviewRoomApi";
import { buttonStyles, dialogStyles, fieldStyles } from "../../../../common/constants/uiStyles";

function CoachEvaluationModal({ open, room, onClose, onSubmitted }) {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [items, setItems] = useState([]);
    const [error, setError] = useState("");
    const [isCompleted, setIsCompleted] = useState(false);

    const { t } = useTranslation();
    const interviewLabel = useMemo(() => {
        if (!room?.scheduledTime) return "";
        try {
            const start = new Date(room.scheduledTime);
            const end = room.durationMinutes ? new Date(start.getTime() + room.durationMinutes * 60000) : null;
            const startLabel = start.toLocaleString(t("common.date_locale") || "en-US", {
                dateStyle: "medium",
                timeStyle: "short",
            });
            const endLabel = end?.toLocaleTimeString(t("common.date_locale") || "en-US", { timeStyle: "short" });
            return endLabel ? `${startLabel} - ${endLabel}` : startLabel;
        } catch (err) {
            return "";
        }
    }, [room, t]);

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
                
                // Normalize keys to ensure consistency (handles both lowercase and PascalCase from API)
                const normalizedResults = (data?.evaluationResults || []).map(item => ({
                    type: item.type || item.Type || "",
                    question: item.question || item.Question || "",
                    score: item.score ?? item.Score ?? 0,
                    answer: item.answer ?? item.Answer ?? ""
                }));

                setItems(normalizedResults);
                setIsCompleted(Boolean(data?.isEvaluationCompleted));
            } catch (err) {
                setError(err?.response?.data?.message || t("interview.list.coach_evaluation.error_load"));
            } finally {
                setLoading(false);
            }
        };

        fetchEvaluation();
    }, [open, room?.id, t]);

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
        if (items.some((item) => item.score < 0 || item.score > 10)) {
            setError(t("interview.list.coach_evaluation.error_range"));
            return;
        }
        setSubmitting(true);
        try {
            await callApi({
                method: METHOD.POST,
                endpoint: interviewEndPoints.SUBMIT_COACH_EVALUATION(room.id),
                arg: { results: items },
                displaySuccessMessage: true,
                alertErrorMessage: true,
            });
            setIsCompleted(true);
            if (onSubmitted) {
                onSubmitted();
            }
            if (onClose) {
                onClose();
            }
        } catch (err) {
            setError(err?.response?.data?.message || t("interview.list.coach_evaluation.error_submit"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = (event, reason) => {
        const hasPending = !isCompleted && !error;
        if (hasPending) {
            return;
        }
        setItems([]);
        setError("");
        setIsCompleted(false);
        if (onClose) {
            onClose();
        }
    };

    const getScoreLabel = (score) => {
        if (score <= 2) return t("interview.list.coach_evaluation.score_very_bad");
        if (score <= 4) return t("interview.list.coach_evaluation.score_bad");
        if (score <= 6) return t("interview.list.coach_evaluation.score_average");
        if (score <= 8) return t("interview.list.coach_evaluation.score_good");
        return t("interview.list.coach_evaluation.score_very_good");
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
                <Typography id="coach-evaluation-modal" variant="h5" component="h2" sx={{ mb: 1 }}>
                    {t("interview.list.coach_evaluation.title")}
                </Typography>
                {room?.candidateName && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {t("interview.list.coach_evaluation.candidate")} <strong>{room.candidateName}</strong>
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
                            {t("interview.list.coach_evaluation.loading")}
                        </Typography>
                    </Stack>
                ) : (
                    <Stack spacing={2} sx={{ maxHeight: "60vh", overflowY: "auto", pr: 1 }}>
                        {items.length === 0 ? (
                            <Typography color="text.secondary">{t("interview.list.coach_evaluation.empty")}</Typography>
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
                                                <Typography variant="caption" color="text.secondary">{t("interview.list.coach_evaluation.score_very_bad")}</Typography>
                                                <Typography variant="caption" color="text.secondary">{t("interview.list.coach_evaluation.score_average")}</Typography>
                                                <Typography variant="caption" color="text.secondary">{t("interview.list.coach_evaluation.score_very_good")}</Typography>
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
                                        label={t("interview.list.coach_evaluation.label_feedback")}
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
                        <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ pt: 1 }}>
                            <Button
                                variant="contained"
                                disabled={submitting || items.length === 0}
                                onClick={handleSubmit}
                                sx={(theme) => ({ ...buttonStyles.primaryCta(theme) })}
                            >
                                {submitting ? t("interview.list.coach_evaluation.btn_submitting") : t("interview.list.coach_evaluation.btn_submit")}
                            </Button>
                        </Stack>
                    </Stack>
                )}
            </Box>
        </Modal>
    );
}

export default CoachEvaluationModal;
