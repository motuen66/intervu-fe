import { useState, useEffect, useRef } from "react";
import {
    Modal,
    Box,
    Typography,
    IconButton,
    CircularProgress,
    Button,
    Avatar,
    AvatarGroup,
    Alert,
} from "@mui/material";
import {
    X,
    MessageSquare,
    Database,
    CheckCircle,
    Trash2,
    ChevronRight,
    Check,
    FileText,
    Clock,
    Plus,
} from "lucide-react";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { interviewEndPoints } from "../../services/interviewRoomApi";

const COLORS = {
    sidebarBg: "#111827",
    lime: "#D9F99D",
    limeAccent: "#A3E635",
    limeDark: "#65A30D",
    cardBg: "#F9FAFB",
    white: "#FFFFFF",
    muted: "#6B7280",
    mutedLight: "#9CA3AF",
    border: "#E5E7EB",
    dashedBorder: "#D1D5DB",
    successGreen: "#22C55E",
    deleteRed: "#EF4444",
    tagGreen: "#DCFCE7",
    tagGreenText: "#166534",
    tagGray: "#F3F4F6",
    tagGrayText: "#374151",
};

function GeneratedQuestionsModal({ open, onClose, roomId }) {
    const [questions, setQuestions] = useState([]);
    const [deletedExistingIds, setDeletedExistingIds] = useState([]);
    const [modalPhase, setModalPhase] = useState("review");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [contributing, setContributing] = useState(false);
    const newCardRef = useRef(null);

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
                const pending = (res.data || []).filter((q) => q.status === 0);
                setQuestions(
                    pending.map((q) => ({
                        ...q,
                        localContent: q.content,
                        isCustom: false,
                        isNew: false,
                    }))
                );
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
            setModalPhase("review");
            setDeletedExistingIds([]);
            setError(null);
            setContributing(false);
            fetchQuestions();
        }
    }, [open, roomId]);

    const handleContentChange = (id, value) => {
        setQuestions((prev) =>
            prev.map((q) => (q.id === id ? { ...q, localContent: value } : q))
        );
    };

    const handleDelete = (id, isNew) => {
        if (!isNew) {
            setDeletedExistingIds((prev) => [...prev, id]);
        }
        setQuestions((prev) => prev.filter((q) => q.id !== id));
    };

    const handleAddCustom = () => {
        const newQ = {
            id: crypto.randomUUID(),
            title: "",
            localContent: "",
            isCustom: true,
            isNew: true,
        };
        setQuestions((prev) => [...prev, newQ]);
        setTimeout(() => {
            newCardRef.current?.focus();
        }, 100);
    };

    const handleContribute = async () => {
        if (contributing) return;
        setContributing(true);
        setModalPhase("contributing");
        setError(null);

        try {
            const results = await Promise.allSettled([
                // Reject deleted existing questions
                ...deletedExistingIds.map((id) =>
                    callApi({
                        method: METHOD.PUT,
                        endpoint: interviewEndPoints.REJECT_GENERATED_QUESTION(id),
                    })
                ),
                // Approve/create remaining questions
                ...questions.map(async (q) => {
                    if (q.isNew) {
                        const createRes = await callApi({
                            method: METHOD.POST,
                            endpoint: interviewEndPoints.CREATE_GENERATED_QUESTION,
                            arg: {
                                interviewRoomId: roomId,
                                content: q.localContent,
                                title: q.title || "",
                            },
                        });
                        const newId = createRes.data.id;
                        await callApi({
                            method: METHOD.PUT,
                            endpoint: interviewEndPoints.APPROVE_GENERATED_QUESTION(newId),
                            arg: { content: q.localContent, title: q.title || "" },
                        });
                    } else {
                        await callApi({
                            method: METHOD.PUT,
                            endpoint: interviewEndPoints.APPROVE_GENERATED_QUESTION(q.id),
                            arg: { content: q.localContent, title: q.title || "" },
                        });
                    }
                }),
            ]);

            const failed = results.filter((r) => r.status === "rejected");
            if (failed.length > 0) {
                console.error("Some contributions failed:", failed);
                setError(`${failed.length} question(s) failed to contribute. Please try again.`);
                setModalPhase("review");
                setContributing(false);
                return;
            }

            setModalPhase("success");
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err) {
            console.error("Contribute error:", err);
            setError("Failed to contribute questions. Please try again.");
            setModalPhase("review");
            setContributing(false);
        }
    };

    const hasValidQuestions = questions.length > 0 && questions.some((q) => q.localContent.trim().length >= 5);

    // --- Sidebar Step Component ---
    const SidebarStep = ({ number, label, icon: Icon, active, done }) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
                sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: done ? COLORS.limeAccent : active ? COLORS.limeAccent : "rgba(255,255,255,0.1)",
                    color: done || active ? COLORS.sidebarBg : COLORS.mutedLight,
                    transition: "all 0.3s ease",
                }}
            >
                {done ? <Check size={16} /> : <Icon size={16} />}
            </Box>
            <Box>
                <Typography
                    variant="caption"
                    sx={{
                        color: active || done ? COLORS.lime : COLORS.mutedLight,
                        fontWeight: 600,
                        fontSize: "0.65rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                    }}
                >
                    Step {number}
                </Typography>
                <Typography
                    variant="body2"
                    sx={{
                        color: active || done ? COLORS.white : COLORS.mutedLight,
                        fontWeight: 600,
                        fontSize: "0.8rem",
                    }}
                >
                    {label}
                </Typography>
            </Box>
        </Box>
    );

    // --- Question Card Component ---
    const QuestionCard = ({ question, index, isLast }) => (
        <Box
            sx={{
                position: "relative",
                bgcolor: COLORS.cardBg,
                borderRadius: 2,
                p: 2.5,
                mb: isLast ? 0 : 2,
                border: `1px solid ${COLORS.border}`,
                transition: "all 0.2s ease",
                "&:hover .delete-btn": { opacity: 1 },
            }}
        >
            {/* Delete button */}
            <IconButton
                className="delete-btn"
                onClick={() => handleDelete(question.id, question.isNew)}
                sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    opacity: 0,
                    transition: "opacity 0.2s ease",
                    color: COLORS.deleteRed,
                    "&:hover": { bgcolor: "rgba(239,68,68,0.1)" },
                }}
                size="small"
            >
                <Trash2 size={16} />
            </IconButton>

            {/* Header */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <Box
                    sx={{
                        width: 24,
                        height: 24,
                        borderRadius: "6px",
                        bgcolor: COLORS.sidebarBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Typography sx={{ color: COLORS.limeAccent, fontSize: "0.7rem", fontWeight: 700 }}>
                        {index + 1}
                    </Typography>
                </Box>
                <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, color: COLORS.sidebarBg, textTransform: "uppercase", letterSpacing: "0.05em" }}
                >
                    Question {index + 1}
                </Typography>
                <Typography variant="caption" sx={{ color: COLORS.muted, fontSize: "0.7rem" }}>
                    {question.isCustom ? "• CUSTOM QUESTION" : "• EXTRACTED FROM TRANSCRIPT"}
                </Typography>
            </Box>

            {/* Editable textarea */}
            <Box
                component="textarea"
                ref={question.isNew && index === questions.length - 1 ? newCardRef : null}
                value={question.localContent}
                onChange={(e) => handleContentChange(question.id, e.target.value)}
                placeholder="Type your question here..."
                rows={3}
                sx={{
                    width: "100%",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "8px",
                    p: 1.5,
                    fontSize: "0.875rem",
                    fontFamily: "inherit",
                    resize: "vertical",
                    bgcolor: COLORS.white,
                    color: COLORS.sidebarBg,
                    outline: "none",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                    "&:focus": {
                        borderColor: COLORS.limeAccent,
                        boxShadow: `0 0 0 2px ${COLORS.limeAccent}40`,
                    },
                }}
            />

            {/* Tags row */}
            <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
                <Box
                    sx={{
                        px: 1.5,
                        py: 0.25,
                        borderRadius: "12px",
                        bgcolor: COLORS.tagGreen,
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                    }}
                >
                    <Typography sx={{ fontSize: "0.65rem", fontWeight: 600, color: COLORS.tagGreenText }}>
                        HIGH RELEVANCE
                    </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: COLORS.muted }}>
                    <FileText size={12} />
                    <Typography sx={{ fontSize: "0.65rem", fontWeight: 500 }}>DATA STRUCTURES</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: COLORS.muted }}>
                    <Clock size={12} />
                    <Typography sx={{ fontSize: "0.65rem", fontWeight: 500 }}>INTERMEDIATE</Typography>
                </Box>
            </Box>
        </Box>
    );

    return (
        <Modal open={open} onClose={modalPhase === "review" ? onClose : undefined}>
            <Box
                sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 820,
                    maxWidth: "95vw",
                    height: 580,
                    maxHeight: "90vh",
                    display: "flex",
                    borderRadius: 3,
                    overflow: "hidden",
                    bgcolor: COLORS.white,
                    boxShadow: 24,
                    outline: "none",
                }}
            >
                {/* ===== SIDEBAR ===== */}
                <Box
                    sx={{
                        width: 260,
                        minWidth: 260,
                        bgcolor: COLORS.sidebarBg,
                        p: 3,
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    {/* Badge */}
                    <Box
                        sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.75,
                            bgcolor: "rgba(255,255,255,0.08)",
                            borderRadius: "6px",
                            px: 1.5,
                            py: 0.5,
                            mb: 3,
                            alignSelf: "flex-start",
                        }}
                    >
                        <Typography sx={{ fontSize: "0.65rem", fontWeight: 600, color: COLORS.lime, letterSpacing: "0.05em" }}>
                            AI EXTRACTED QUESTIONS
                        </Typography>
                    </Box>

                    {/* Title */}
                    <Typography variant="h6" sx={{ color: COLORS.white, fontWeight: 700, mb: 0.5, lineHeight: 1.3 }}>
                        Question{" "}
                        <Box component="span" sx={{ color: COLORS.lime }}>
                            Contribution
                        </Box>
                    </Typography>
                    <Typography variant="caption" sx={{ color: COLORS.mutedLight, mb: 4, display: "block", lineHeight: 1.5 }}>
                        Review and refine questions extracted from your interview session.
                    </Typography>

                    {/* Steps */}
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0, mt: "auto" }}>
                        <SidebarStep
                            number="01"
                            label="Review Questions"
                            icon={MessageSquare}
                            active={modalPhase === "review"}
                            done={modalPhase === "contributing" || modalPhase === "success"}
                        />

                        {/* Connector line */}
                        <Box
                            sx={{
                                width: 2,
                                height: 28,
                                bgcolor: modalPhase !== "review" ? COLORS.limeAccent : "rgba(255,255,255,0.1)",
                                ml: "15px",
                                my: 0.5,
                                borderRadius: 1,
                                transition: "background-color 0.3s ease",
                            }}
                        />

                        <SidebarStep
                            number="02"
                            label="Contribute"
                            icon={Database}
                            active={modalPhase === "contributing" || modalPhase === "success"}
                            done={modalPhase === "success"}
                        />
                    </Box>
                </Box>

                {/* ===== CONTENT AREA ===== */}
                <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    {/* Header */}
                    <Box sx={{ p: 3, pb: 2, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.sidebarBg }}>
                                Review Extracted Questions
                            </Typography>
                            <Typography variant="body2" sx={{ color: COLORS.muted, mt: 0.25 }}>
                                Verify and edit the questions before adding them to the bank.
                            </Typography>
                        </Box>
                        <IconButton onClick={onClose} size="small" sx={{ color: COLORS.muted }}>
                            <X size={20} />
                        </IconButton>
                    </Box>

                    {/* Scrollable content */}
                    <Box sx={{ flex: 1, overflowY: "auto", px: 3, pb: 2 }}>
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                                {error}
                            </Alert>
                        )}

                        {loading ? (
                            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                                <CircularProgress size={32} />
                            </Box>
                        ) : modalPhase === "review" ? (
                            <>
                                {questions.map((q, index) => (
                                    <QuestionCard
                                        key={q.id}
                                        question={q}
                                        index={index}
                                        isLast={index === questions.length - 1}
                                    />
                                ))}

                                {/* Add custom question button */}
                                <Button
                                    onClick={handleAddCustom}
                                    startIcon={<Plus size={16} />}
                                    sx={{
                                        width: "100%",
                                        mt: questions.length > 0 ? 2 : 0,
                                        py: 1.5,
                                        border: `2px dashed ${COLORS.dashedBorder}`,
                                        borderRadius: 2,
                                        color: COLORS.muted,
                                        textTransform: "none",
                                        fontWeight: 500,
                                        "&:hover": {
                                            border: `2px dashed ${COLORS.limeAccent}`,
                                            color: COLORS.limeDark,
                                            bgcolor: "rgba(163,230,53,0.04)",
                                        },
                                    }}
                                >
                                    Add custom question
                                </Button>
                            </>
                        ) : modalPhase === "contributing" ? (
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: "100%",
                                    gap: 2,
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: "50%",
                                        bgcolor: COLORS.sidebarBg,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <Database size={36} color={COLORS.lime} />
                                </Box>
                                <Typography variant="h6" fontWeight={700}>
                                    Contributing to Bank
                                </Typography>
                                <Typography color="text.secondary" textAlign="center">
                                    Syncing your verified questions with the global question bank...
                                </Typography>
                                <CircularProgress size={24} sx={{ color: COLORS.limeAccent, mt: 1 }} />
                            </Box>
                        ) : modalPhase === "success" ? (
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: "100%",
                                    gap: 2,
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: "50%",
                                        bgcolor: COLORS.successGreen,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <CheckCircle size={40} color="white" />
                                </Box>
                                <Typography variant="h6" fontWeight={700}>
                                    Successfully Contributed!
                                </Typography>
                                <Typography color="text.secondary" textAlign="center">
                                    Thank you for helping the community grow.
                                    <br />
                                    Your questions are now live.
                                </Typography>
                            </Box>
                        ) : null}
                    </Box>

                    {/* Footer */}
                    {modalPhase === "review" && (
                        <Box
                            sx={{
                                px: 3,
                                py: 2,
                                borderTop: `1px solid ${COLORS.border}`,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            {/* Social proof */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                <AvatarGroup
                                    max={3}
                                    sx={{
                                        "& .MuiAvatar-root": {
                                            width: 28,
                                            height: 28,
                                            fontSize: "0.75rem",
                                            border: "2px solid white",
                                        },
                                    }}
                                >
                                    <Avatar sx={{ bgcolor: "#6366F1" }}>A</Avatar>
                                    <Avatar sx={{ bgcolor: "#EC4899" }}>B</Avatar>
                                    <Avatar sx={{ bgcolor: "#F59E0B" }}>C</Avatar>
                                </AvatarGroup>
                                <Typography variant="caption" sx={{ color: COLORS.muted }}>
                                    12 coaches contributed today
                                </Typography>
                            </Box>

                            {/* Actions */}
                            <Box sx={{ display: "flex", gap: 1.5 }}>
                                <Button
                                    onClick={onClose}
                                    variant="outlined"
                                    sx={{
                                        textTransform: "none",
                                        fontWeight: 600,
                                        borderColor: COLORS.border,
                                        color: COLORS.muted,
                                        "&:hover": { borderColor: COLORS.mutedLight, bgcolor: COLORS.cardBg },
                                    }}
                                >
                                    Discard
                                </Button>
                                <Button
                                    onClick={handleContribute}
                                    disabled={!hasValidQuestions || contributing}
                                    variant="contained"
                                    endIcon={<ChevronRight size={16} />}
                                    sx={{
                                        textTransform: "none",
                                        fontWeight: 600,
                                        bgcolor: COLORS.sidebarBg,
                                        color: COLORS.white,
                                        "&:hover": { bgcolor: "#1F2937" },
                                        "&.Mui-disabled": { bgcolor: "#E5E7EB", color: "#9CA3AF" },
                                    }}
                                >
                                    Confirm & Contribute
                                </Button>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Box>
        </Modal>
    );
}

export default GeneratedQuestionsModal;
