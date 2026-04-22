import { useState, useEffect, useRef } from "react";
import {
    Dialog,
    Box,
    Typography,
    IconButton,
    CircularProgress,
    Button,
    Alert,
    Chip,
    Autocomplete,
    TextField,
} from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import {
    X,
    MessageSquare,
    Database,
    CheckCircle,
    Trash2,
    ChevronRight,
    Check,
    Plus,
    Sparkles,
    Tag as TagIcon,
} from "lucide-react";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { interviewEndPoints } from "../../services/interviewRoomApi";
import { PrimaryButton, SecondaryButton } from "../../../../common/components/buttons";
import toast from "react-hot-toast";

const springTransition = { type: "spring", damping: 25, stiffness: 200 };

function GeneratedQuestionsModal({ open, onClose, roomId }) {
    const [questions, setQuestions] = useState([]);
    const [availableTags, setAvailableTags] = useState([]);
    const [deletedExistingIds, setDeletedExistingIds] = useState([]);
    const [modalPhase, setModalPhase] = useState("review");
    const [loading, setLoading] = useState(false);
    const [tagsLoading, setTagsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [contributing, setContributing] = useState(false);
    const newCardRef = useRef(null);

    const fetchTags = async () => {
        setTagsLoading(true);
        try {
            const res = await callApi({
                method: METHOD.GET,
                endpoint: "/Tags",
                arg: { page: 1, pageSize: 100 }
            });
            if (res?.success) {
                setAvailableTags(res.data.items || []);
            }
        } catch (err) {
            console.error("Failed to fetch tags:", err);
        } finally {
            setTagsLoading(false);
        }
    };

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
                
                if (pending.length === 0) {
                    onClose();
                    toast("No pending questions to review for this session.", {
                        icon: "ℹ️",
                        duration: 4000,
                    });
                    return;
                }

                setQuestions(
                    pending.map((q) => ({
                        ...q,
                        localContent: q.content,
                        localTitle: q.title,
                        localTags: q.tags || [],
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
            fetchTags();
        }
    }, [open, roomId]);

    const handleContentChange = (id, value) => {
        setQuestions((prev) =>
            prev.map((q) => (q.id === id ? { ...q, localContent: value } : q))
        );
    };

    const handleTitleChange = (id, value) => {
        setQuestions((prev) =>
            prev.map((q) => (q.id === id ? { ...q, localTitle: value } : q))
        );
    };

    const handleTagsChange = (id, newTags) => {
        setQuestions((prev) =>
            prev.map((q) => (q.id === id ? { ...q, localTags: newTags } : q))
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
            localTitle: "",
            localContent: "",
            localTags: [],
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
                    const tagIds = q.localTags
                        .map(name => availableTags.find(t => t.name === name)?.id)
                        .filter(id => !!id);

                    if (q.isNew) {
                        const createRes = await callApi({
                            method: METHOD.POST,
                            endpoint: interviewEndPoints.CREATE_GENERATED_QUESTION,
                            arg: {
                                interviewRoomId: roomId,
                                content: q.localContent,
                                title: q.localTitle || "",
                                tags: q.localTags,
                            },
                        });
                        const newId = createRes.data.id;
                        await callApi({
                            method: METHOD.PUT,
                            endpoint: interviewEndPoints.APPROVE_GENERATED_QUESTION(newId),
                            arg: { 
                                content: q.localContent, 
                                title: q.localTitle || "",
                                tagIds: tagIds
                            },
                        });
                    } else {
                        await callApi({
                            method: METHOD.PUT,
                            endpoint: interviewEndPoints.APPROVE_GENERATED_QUESTION(q.id),
                            arg: { 
                                content: q.localContent, 
                                title: q.localTitle || "",
                                tagIds: tagIds
                            },
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

    const hasValidQuestions = questions.length > 0 && questions.every((q) => q.localContent.trim().length >= 5);

    const handleDialogClose = (_, reason) => {
        if (modalPhase !== "review") return;
        if (reason === "backdropClick") return;
        onClose();
    };

    const PulsingSparkles = () => (
        <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            style={{ display: "inline-flex" }}
        >
            <Sparkles size={14} color="var(--mui-palette-secondary-main)" />
        </motion.div>
    );

    const SidebarStep = ({ number, label, icon: Icon, active, done }) => (
        <motion.div
            animate={active ? { x: [0, 4, 0] } : { x: 0 }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        >
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    py: 1.25,
                    px: 1.5,
                    borderRadius: "12px",
                    bgcolor: active ? "rgba(190, 242, 100, 0.1)" : "transparent",
                    transition: "all 0.4s ease",
                }}
            >
                <Box
                    sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: active
                            ? "secondary.main"
                            : done
                                ? "transparent"
                                : "rgba(255,255,255,0.08)",
                        border: done ? "1px solid" : "none",
                        borderColor: done ? "secondary.dark" : "transparent",
                        transition: "all 0.4s ease",
                        boxShadow: active ? "0 0 16px rgba(190, 242, 100, 0.4)" : "none",
                    }}
                >
                    {done ? (
                        <Check size={18} color="var(--mui-palette-secondary-main)" />
                    ) : (
                        <Icon
                            size={20}
                            color={
                                active
                                    ? "var(--mui-palette-primary-main)"
                                    : "rgba(255,255,255,0.35)"
                            }
                        />
                    )}
                </Box>
                <Box>
                    <Typography
                        variant="overline"
                        sx={{
                            color: active ? "secondary.main" : "rgba(255,255,255,0.35)",
                            fontSize: "0.6rem",
                            fontWeight: 700,
                        }}
                    >
                        Step {number}
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            color: active || done ? "primary.contrastText" : "rgba(255,255,255,0.35)",
                            fontWeight: active ? 800 : 700,
                        }}
                    >
                        {label}
                    </Typography>
                </Box>
            </Box>
        </motion.div>
    );

    // --- Question Card Renderer ---
    const renderQuestionCard = (question, index, isLast) => (
        <Box
            key={question.id}
            sx={{
                position: "relative",
                bgcolor: "#F9FAFB",
                borderRadius: 2.5,
                p: 2.25,
                mb: isLast ? 0 : 2,
                border: "1px solid #E5E7EB",
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
                    top: 10,
                    right: 10,
                    opacity: 0,
                    transition: "opacity 0.2s ease",
                    color: "#EF4444",
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
                        bgcolor: "var(--mui-palette-primary-main)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Typography sx={{ color: "var(--mui-palette-secondary-main)", fontSize: "0.7rem", fontWeight: 700 }}>
                        {index + 1}
                    </Typography>
                </Box>
                <Typography
                    variant="caption"
                    sx={{ fontWeight: 800, color: "var(--mui-palette-primary-main)", textTransform: "uppercase", letterSpacing: "0.05em" }}
                >
                    Question {index + 1}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem", fontWeight: 600 }}>
                    {question.isCustom ? "• CUSTOM QUESTION" : "• EXTRACTED FROM TRANSCRIPT"}
                </Typography>
            </Box>

            {/* Title Input */}
            <TextField
                fullWidth
                size="small"
                value={question.localTitle}
                onChange={(e) => handleTitleChange(question.id, e.target.value)}
                placeholder="Question Title (e.g., React Hooks, SQL Joins)"
                variant="outlined"
                sx={{
                    mb: 1.5,
                    "& .MuiOutlinedInput-root": {
                        bgcolor: "white",
                        borderRadius: "8px",
                    }
                }}
            />

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
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    p: 1.5,
                    fontSize: "0.875rem",
                    fontFamily: "inherit",
                    resize: "vertical",
                    bgcolor: "#fff",
                    color: "text.primary",
                    outline: "none",
                    mb: 1.5,
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                    "&:focus": {
                        borderColor: "var(--mui-palette-secondary-main)",
                        boxShadow: "0 0 0 2px rgba(190, 242, 100, 0.35)",
                    },
                }}
            />

            {/* Tags Autocomplete */}
            <Autocomplete
                multiple
                id={`tags-${question.id}`}
                options={availableTags.map(t => t.name)}
                value={question.localTags}
                onChange={(_, newValue) => handleTagsChange(question.id, newValue)}
                renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                        <Chip
                            variant="outlined"
                            label={option}
                            size="small"
                            {...getTagProps({ index })}
                            sx={{
                                bgcolor: "rgba(190, 242, 100, 0.1)",
                                borderColor: "secondary.light",
                                color: "primary.main",
                                fontWeight: 700,
                            }}
                        />
                    ))
                }
                renderInput={(params) => (
                    <TextField
                        {...params}
                        variant="outlined"
                        size="small"
                        placeholder="Add tags..."
                        InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                                <>
                                    <TagIcon size={14} style={{ marginRight: 8, color: "var(--mui-palette-text-secondary)" }} />
                                    {params.InputProps.startAdornment}
                                </>
                            ),
                        }}
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                bgcolor: "white",
                                borderRadius: "8px",
                            }
                        }}
                    />
                )}
            />
        </Box>
    );

    return (
        <Dialog
            open={open}
            onClose={handleDialogClose}
            maxWidth={false}
            disableEscapeKeyDown={modalPhase !== "review"}
            PaperProps={{
                sx: {
                    borderRadius: "20px",
                    overflow: "hidden",
                    width: "min(1060px, 94vw)",
                    height: "min(680px, 88vh)",
                    display: "flex",
                    flexDirection: "row",
                    bgcolor: "background.paper",
                    border: "none",
                    outline: "none",
                    boxShadow: "0 28px 70px -20px rgba(2, 6, 23, 0.55), 0 12px 28px rgba(15, 23, 42, 0.22)",
                },
            }}
        >
                {/* ===== SIDEBAR ===== */}
                <Box
                    sx={{
                        width: 280,
                        minWidth: 280,
                        minHeight: "100%",
                        background: "linear-gradient(180deg, var(--mui-palette-primary-main) 0%, var(--mui-palette-primary-light) 100%)",
                        borderRadius: "20px 0 0 20px",
                        p: 3.5,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                    }}
                >
                    {/* Badge */}
                    <Box
                        sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.75,
                            bgcolor: "rgba(190, 242, 100, 0.15)",
                            border: "1px solid rgba(190, 242, 100, 0.3)",
                            borderRadius: "20px",
                            px: 1.5,
                            py: 0.5,
                            mb: 1,
                            alignSelf: "flex-start",
                        }}
                    >
                        <PulsingSparkles />
                        <Typography
                            variant="overline"
                            sx={{ color: "secondary.main", fontSize: "0.625rem", letterSpacing: "0.12em", fontWeight: 800 }}
                        >
                            AI EXTRACTED QUESTIONS
                        </Typography>
                    </Box>

                    {/* Title */}
                    <Box>
                        <Typography variant="h4" sx={{ color: "primary.contrastText", fontWeight: 800, lineHeight: 1.2 }}>
                            Question
                        </Typography>
                        <motion.div
                            animate={{
                                textShadow: [
                                    "0 0 8px rgba(190, 242, 100, 0.2)",
                                    "0 0 20px rgba(190, 242, 100, 0.45)",
                                    "0 0 8px rgba(190, 242, 100, 0.2)",
                                ],
                            }}
                            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                            style={{ display: "inline-block" }}
                        >
                            <Typography
                                variant="h3"
                                component="span"
                                sx={{
                                    color: "secondary.main",
                                    fontWeight: 800,
                                    lineHeight: 1.2,
                                    display: "block",
                                }}
                            >
                                Contribution
                            </Typography>
                        </motion.div>
                    </Box>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.55)", mb: 2, lineHeight: 1.6 }}>
                        Review and refine questions extracted from your interview session.
                    </Typography>

                    {/* Steps */}
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: "auto" }}>
                        <SidebarStep
                            number="01"
                            label="Review Questions"
                            icon={MessageSquare}
                            active={modalPhase === "review"}
                            done={modalPhase === "contributing" || modalPhase === "success"}
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
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            alignItems: "center",
                            px: 2,
                            pt: 1.5,
                            pb: 0,
                            flexShrink: 0,
                        }}
                    >
                        <IconButton onClick={onClose} size="small" sx={{ color: "text.secondary" }}>
                            <X size={20} />
                        </IconButton>
                    </Box>

                    {/* Header */}
                    <Box sx={{ px: 4, pt: 1, pb: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary" }}>
                            Review Extracted Questions
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                            Verify and edit the questions before adding them to the bank.
                        </Typography>
                    </Box>

                    {/* Main content area */}
                    <Box
                        sx={{
                            flex: 1,
                            px: 4,
                            pb: modalPhase === "review" ? 2 : 4,
                            overflowY: modalPhase === "review" ? "auto" : "hidden",
                            display: modalPhase === "review" ? "block" : "flex",
                            alignItems: modalPhase === "review" ? "stretch" : "center",
                            justifyContent: modalPhase === "review" ? "flex-start" : "center",
                        }}
                    >
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                                {error}
                            </Alert>
                        )}

                        {loading ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={springTransition}>
                                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                                    <CircularProgress size={32} />
                                </Box>
                            </motion.div>
                        ) : (
                            <AnimatePresence mode="wait">
                                {modalPhase === "review" && (
                                    <motion.div
                                        key="review"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={springTransition}
                                    >
                                        {questions.map((q, index) =>
                                            renderQuestionCard(q, index, index === questions.length - 1)
                                        )}

                                        {/* Add custom question button */}
                                        <Button
                                            onClick={handleAddCustom}
                                            startIcon={<Plus size={16} />}
                                            sx={{
                                                width: "100%",
                                                mt: questions.length > 0 ? 2 : 0,
                                                py: 1.5,
                                                border: "2px dashed #D1D5DB",
                                                borderRadius: "14px",
                                                color: "text.secondary",
                                                textTransform: "none",
                                                fontWeight: 700,
                                                "&:hover": {
                                                    border: "2px dashed var(--mui-palette-secondary-main)",
                                                    color: "primary.main",
                                                    bgcolor: "rgba(163,230,53,0.04)",
                                                },
                                            }}
                                        >
                                            Add custom question
                                        </Button>
                                    </motion.div>
                                )}

                                {modalPhase === "contributing" && (
                                    <motion.div
                                        key="contributing"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={springTransition}
                                        style={{ width: "100%", display: "flex", justifyContent: "center" }}
                                    >
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: 2,
                                            }}
                                        >
                                            <Box
                                                component={motion.div}
                                                animate={{ scale: [1, 1.08, 1] }}
                                                transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
                                                sx={{
                                                    width: 80,
                                                    height: 80,
                                                    borderRadius: "50%",
                                                    bgcolor: "var(--mui-palette-primary-main)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    boxShadow: "0 0 28px rgba(190, 242, 100, 0.25)",
                                                }}
                                            >
                                                <Database size={36} color="var(--mui-palette-secondary-main)" />
                                            </Box>
                                            <Typography variant="h6" fontWeight={800}>
                                                Contributing to Bank
                                            </Typography>
                                            <Typography color="text.secondary" textAlign="center">
                                                Syncing your verified questions with the global question bank...
                                            </Typography>
                                            <CircularProgress size={24} sx={{ color: "secondary.main", mt: 1 }} />
                                        </Box>
                                    </motion.div>
                                )}

                                {modalPhase === "success" && (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={springTransition}
                                        style={{ width: "100%", display: "flex", justifyContent: "center" }}
                                    >
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: 2,
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: 80,
                                                    height: 80,
                                                    borderRadius: "50%",
                                                    bgcolor: "#22C55E",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    boxShadow: "0 0 24px rgba(34,197,94,0.35)",
                                                }}
                                            >
                                                <CheckCircle size={40} color="white" />
                                            </Box>
                                            <Typography variant="h6" fontWeight={800}>
                                                Successfully Contributed!
                                            </Typography>
                                            <Typography color="text.secondary" textAlign="center">
                                                Thank you for helping the community grow.
                                                <br />
                                                Your questions are now live.
                                            </Typography>
                                        </Box>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}
                    </Box>

                    {/* Footer */}
                    {modalPhase === "review" && (
                        <Box
                            sx={{
                                px: 4,
                                py: 2,
                                borderTop: "1px solid #E5E7EB",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                {questions.length} question{questions.length === 1 ? "" : "s"} ready to contribute
                            </Typography>

                            {/* Actions */}
                            <Box sx={{ display: "flex", gap: 1.5 }}>
                                <Box sx={{ minWidth: 120 }}>
                                    <SecondaryButton fullWidth onClick={onClose}>
                                        Discard
                                    </SecondaryButton>
                                </Box>
                                <PrimaryButton
                                    onClick={handleContribute}
                                    disabled={!hasValidQuestions || contributing}
                                    loading={contributing}
                                >
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                        Confirm & Contribute
                                        <ChevronRight size={16} />
                                    </Box>
                                </PrimaryButton>
                            </Box>
                        </Box>
                    )}
                </Box>
        </Dialog>
    );
}

export default GeneratedQuestionsModal;
