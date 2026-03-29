import { useState, useEffect } from "react";
import {
    Modal,
    Box,
    Typography,
    Stack,
    IconButton,
    CircularProgress,
    Divider,
    List,
    ListItem,
    ListItemText,
    Chip,
    Alert,
} from "@mui/material";
import { Check, X, Info } from "lucide-react";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { interviewEndPoints } from "../../services/interviewRoomApi";
import { buttonStyles, dialogStyles } from "../../../../common/constants/uiStyles";
import { PrimaryButton, SecondaryButton } from "../../../../common/components/buttons";

const GENERATED_QUESTION_STATUS = {
    PENDING: 0,
    APPROVED: 1,
    REJECTED: 2,
};

function GeneratedQuestionsModal({ open, onClose, roomId }) {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState({}); // { [id]: true/false }
    const [error, setError] = useState(null);

    const fetchQuestions = async () => {
        if (!roomId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await callApi({
                method: METHOD.GET,
                endpoint: interviewEndPoints.GET_GENERATED_QUESTIONS_BY_ROOM(roomId),
            });
            if (res?.success) {
                setQuestions(res.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch generated questions:", err);
            setError("Failed to load questions. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open && roomId) {
            fetchQuestions();
        }
    }, [open, roomId]);

    const handleApprove = async (qId, index) => {
        setActionLoading((prev) => ({ ...prev, [qId]: "approve" }));
        try {
            await callApi({
                method: METHOD.PUT,
                endpoint: interviewEndPoints.APPROVE_GENERATED_QUESTION(qId),
                arg: {}, // ApproveGeneratedQuestionRequest
                displaySuccessMessage: true,
                successMessage: `Added Question ${index + 1} to the interview session`,
            });
            // Update local state
            setQuestions((prev) =>
                prev.map((q) =>
                    q.id === qId ? { ...q, status: GENERATED_QUESTION_STATUS.APPROVED } : q
                )
            );
        } catch (err) {
            console.error("Failed to approve question:", err);
        } finally {
            setActionLoading((prev) => ({ ...prev, [qId]: null }));
        }
    };

    const handleReject = async (qId, index) => {
        setActionLoading((prev) => ({ ...prev, [qId]: "reject" }));
        try {
            await callApi({
                method: METHOD.PUT,
                endpoint: interviewEndPoints.REJECT_GENERATED_QUESTION(qId),
                displaySuccessMessage: true,
                successMessage: `Reject Question ${index + 1}`,
            });
            // Update local state
            setQuestions((prev) =>
                prev.map((q) =>
                    q.id === qId ? { ...q, status: GENERATED_QUESTION_STATUS.REJECTED } : q
                )
            );
        } catch (err) {
            console.error("Failed to reject question:", err);
        } finally {
            setActionLoading((prev) => ({ ...prev, [qId]: null }));
        }
    };

    const getStatusChip = (status) => {
        switch (status) {
            case GENERATED_QUESTION_STATUS.APPROVED:
                return <Chip label="Approved" size="small" color="success" variant="outlined" />;
            case GENERATED_QUESTION_STATUS.REJECTED:
                return <Chip label="Rejected" size="small" color="error" variant="outlined" />;
            default:
                return <Chip label="Pending" size="small" color="warning" variant="outlined" />;
        }
    };

    return (
        <Modal open={open} onClose={onClose} aria-labelledby="generated-questions-title">
            <Box
                sx={(theme) => ({
                    ...dialogStyles.paper(theme),
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 600,
                    maxWidth: "95vw",
                    maxHeight: "80vh",
                    display: "flex",
                    flexDirection: "column",
                    p: 0,
                    overflow: "hidden",
                })}
            >
                {/* Header */}
                <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider" }}>
                    <Typography id="generated-questions-title" variant="h6" fontWeight={700}>
                        Generated Interview Questions
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Review and approve the AI-generated questions for this session.
                    </Typography>
                </Box>

                {/* Content */}
                <Box sx={{ p: 0, overflowY: "auto", flexGrow: 1 }}>
                    {loading ? (
                        <Box sx={{ display: "center", justifyContent: "center", p: 4 }}>
                            <CircularProgress size={32} />
                        </Box>
                    ) : error ? (
                        <Box sx={{ p: 3 }}>
                            <Alert severity="error">{error}</Alert>
                        </Box>
                    ) : questions.length === 0 ? (
                        <Box sx={{ p: 4, textAlign: "center" }}>
                            <Info size={40} style={{ opacity: 0.2, marginBottom: 16 }} />
                            <Typography color="text.secondary">No questions generated yet.</Typography>
                        </Box>
                    ) : (
                        <List sx={{ p: 0 }}>
                            {questions.map((q, index) => (
                                <Box key={q.id}>
                                    <ListItem
                                        sx={{
                                            p: 3,
                                            flexDirection: "column",
                                            alignItems: "flex-start",
                                            bgcolor: q.status === GENERATED_QUESTION_STATUS.PENDING ? "rgba(234, 179, 8, 0.03)" : "transparent"
                                        }}
                                    >
                                        <Stack direction="row" justifyContent="space-between" width="100%" sx={{ mb: 1.5 }}>
                                            <Typography variant="caption" fontWeight={700} color="primary" sx={{ textTransform: "uppercase" }}>
                                                Question {index + 1}
                                            </Typography>
                                            {getStatusChip(q.status)}
                                        </Stack>
                                        
                                        <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                                            {q.content}
                                        </Typography>

                                        {q.status === GENERATED_QUESTION_STATUS.PENDING && (
                                            <Stack direction="row" spacing={1} alignSelf="flex-end">
                                                <SecondaryButton
                                                    size="small"
                                                    startIcon={actionLoading[q.id] === "reject" ? <CircularProgress size={16} /> : <X size={16} />}
                                                    onClick={() => handleReject(q.id, index)}
                                                    disabled={!!actionLoading[q.id]}
                                                    sx={{ borderRadius: 1.5 }}
                                                >
                                                    Reject
                                                </SecondaryButton>
                                                <PrimaryButton
                                                    size="small"
                                                    startIcon={actionLoading[q.id] === "approve" ? <CircularProgress size={16} /> : <Check size={16} />}
                                                    onClick={() => handleApprove(q.id, index)}
                                                    disabled={!!actionLoading[q.id]}
                                                    sx={{ borderRadius: 1.5 }}
                                                >
                                                    Approve
                                                </PrimaryButton>
                                            </Stack>
                                        )}
                                    </ListItem>
                                    <Divider />
                                </Box>
                            ))}
                        </List>
                    )}
                </Box>

                {/* Footer */}
                <Box sx={{ p: 2, bgcolor: "grey.50", display: "flex", justifyContent: "flex-end" }}>
                    <SecondaryButton onClick={onClose} sx={{ px: 4 }}>
                        Close
                    </SecondaryButton>
                </Box>
            </Box>
        </Modal>
    );
}

export default GeneratedQuestionsModal;
