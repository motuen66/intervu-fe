import { forwardRef, useEffect, useImperativeHandle, useState, useRef } from "react";
import { Box, Typography, Stack, Slider, TextField, Button, CircularProgress, Alert } from "@mui/material";
import { callApi } from "../../../../common/utils/apiConnector.js";
import { METHOD } from "../../../../common/constants/api.js";
import { interviewEndPoints } from "../../services/interviewRoomApi";
import { buttonStyles, fieldStyles } from "../../../../common/constants/uiStyles";
import SaveIcon from "@mui/icons-material/Save";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const EvaluationForm = forwardRef(function EvaluationForm({ roomId }, ref) {
    const [evalItems, setEvalItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [savingDraft, setSavingDraft] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [error, setError] = useState(null);
    
    const hasUnsavedChanges = useRef(false);

    useEffect(() => {
        if (roomId) {
            fetchEvaluation();
        }
        return () => {
            if (hasUnsavedChanges.current) saveDraft();
        };
    }, [roomId]);

    // Auto-save logic: check every 10 seconds if there are unsaved changes
    useEffect(() => {
        const interval = setInterval(() => {
            if (hasUnsavedChanges.current && !savingDraft) {
                saveDraft();
            }
        }, 10000); 
        return () => clearInterval(interval);
    }, [evalItems, savingDraft]);

    const fetchEvaluation = async () => {
        setLoading(true);
        try {
            const res = await callApi({
                method: METHOD.GET,
                endpoint: interviewEndPoints.GET_COACH_EVALUATION(roomId),
            });
            const data = res?.data;

            // Normalize keys to ensure consistency (handles both lowercase and PascalCase from API)
            const normalizedResults = (data?.evaluationResults || []).map(item => ({
                type: item.type || item.Type || "",
                question: item.question || item.Question || "",
                score: item.score ?? item.Score ?? 0,
                answer: item.answer ?? item.Answer ?? ""
            }));

            setEvalItems(normalizedResults);
        } catch (err) {
            console.error("Failed to load evaluation form", err);
            setError("Failed to load evaluation form.");
        } finally {
            setLoading(false);
        }
    };

    const saveDraft = async () => {
        if (!roomId || evalItems.length === 0 || savingDraft || !hasUnsavedChanges.current) return false;
        
        setSavingDraft(true);
        try {
            await callApi({
                method: METHOD.PATCH,
                endpoint: interviewEndPoints.DRAFT_COACH_EVALUATION(roomId),
                arg: { results: evalItems },
                displaySuccessMessage: false,
                alertErrorMessage: false,
            });
            setLastSaved(new Date());
            hasUnsavedChanges.current = false;
            return true;
        } catch (err) {
            console.warn("Auto-save draft failed", err);
            return false;
        } finally {
            setSavingDraft(false);
        }
    };

    useImperativeHandle(ref, () => ({
        saveDraftBeforeLeave: saveDraft,
    }));

    const handleEvalChange = (index, field, value) => {
        setEvalItems((prev) =>
            prev.map((item, i) =>
                i === index
                    ? { ...item, [field]: field === "score" ? Number(value) : value }
                    : item
            )
        );
        hasUnsavedChanges.current = true;
    };

    const getScoreLabel = (score) => {
        if (score <= 2) return "Very Bad";
        if (score <= 4) return "Bad";
        if (score <= 6) return "Average";
        if (score <= 8) return "Good";
        return "Very Good";
    };

    if (loading) {
        return (
            <Stack alignItems="center" sx={{ py: 4 }}>
                <CircularProgress size={24} />
            </Stack>
        );
    }

    if (evalItems.length === 0) {
        return (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                No evaluation items found.
            </Typography>
        );
    }

    return (
        <Stack spacing={2} sx={{ mt: 1, pb: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="overline" sx={{ fontWeight: 800, color: "#9CA3AF", letterSpacing: 1 }}>
                    Interview Evaluation Draft
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                    {savingDraft ? (
                        <CircularProgress size={12} color="inherit" sx={{ opacity: 0.5 }} />
                    ) : lastSaved ? (
                        <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main', opacity: 0.7 }} />
                    ) : null}
                    <Typography variant="caption" sx={{ color: "#9CA3AF", fontSize: '0.65rem' }}>
                        {savingDraft ? "Saving..." : lastSaved ? `Last saved: ${lastSaved.toLocaleTimeString()}` : "Not saved yet"}
                    </Typography>
                </Stack>
            </Stack>

            {error && <Alert severity="error" size="small">{error}</Alert>}

            {evalItems.map((item, index) => (
                <Box key={index} sx={{ border: "1px solid #E5E7EB", p: 2, borderRadius: 2, bgcolor: '#FAFAFA' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, fontSize: '0.875rem' }}>
                        {item.question}
                    </Typography>
                    <Slider
                        size="medium"
                        value={item.score}
                        min={0}
                        max={10}
                        step={1}
                        marks
                        onChange={(_, val) => handleEvalChange(index, "score", val)}
                        sx={{ mb: 1 }}
                    />
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>Very Bad</Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>Average</Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>Very Good</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1, p: 1, bgcolor: 'white', borderRadius: 1, border: '1px solid #E5E7EB' }}>
                        <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700, lineHeight: 1 }}>{item.score}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>- {getScoreLabel(item.score)}</Typography>
                    </Stack>
                    <TextField
                        label="Detailed Feedback"
                        fullWidth
                        multiline
                        size="small"
                        rows={3}
                        value={item.answer || ""}
                        onChange={(e) => handleEvalChange(index, "answer", e.target.value)}
                        sx={(theme) => ({ ...fieldStyles.outlinedFocus(theme) })}
                    />
                </Box>
            ))}
            
            <Stack alignItems="center">
                <Button
                    variant="contained"
                    size="medium"
                    onClick={saveDraft}
                    disabled={savingDraft || !hasUnsavedChanges.current}
                    startIcon={<SaveIcon />}
                    sx={(theme) => ({
                        ...buttonStyles.primaryCta(theme),
                        px: 4,
                        py: 1,
                        textTransform: 'none',
                        width: 'fit-content'
                    })}
                >
                    {savingDraft ? "Saving..." : "Save Draft"}
                </Button>
            </Stack>
            
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', fontStyle: 'italic' }}>
                Final submission is required after leaving the room to complete the process.
            </Typography>
        </Stack>
    );
});

export default EvaluationForm;
