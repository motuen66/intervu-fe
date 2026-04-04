import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    FormControl,
    IconButton,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ShareIcon from "@mui/icons-material/Share";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import SendIcon from "@mui/icons-material/Send";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ListAltIcon from "@mui/icons-material/ListAlt";
import toast from "react-hot-toast";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { interviewQuestionEndPoints } from "../../service/interviewQuestionApi";
import { commentEndPoints } from "../../service/commentApi";
import { interactionEndPoints } from "../../service/interactionApi";
import { homeEndPoints } from "../../../home/services/homeApi";
import AnswerCard from "./AnswerCard";
import ReportDialog from "./ReportDialog";
import { timeAgo } from "../../../../common/utils/dateFormatter";
import { SORT_OPTIONS } from "../../../../common/constants/types";
import ConfirmModal from "../../../../common/components/ConfirmModal";
import { CompanyLogo } from "../../../../common/utils/logoImageGenerator";

/* ─── Main Page ───────────────────────────────────────────────── */
export default function QuestionDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const currentUser = useSelector((state) => state.auth.userData);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState(false);
    const [saveCount, setSaveCount] = useState(0);
    const [questionLiked, setQuestionLiked] = useState(false);
    const [copied, setCopied] = useState(false);
    /* ── Answers (replaces old comments) ── */
    const [answers, setAnswers] = useState([]);
    const [loadingAnswers, setLoadingAnswers] = useState(false);
    const [answerInput, setAnswerInput] = useState("");
    const [submittingAnswer, setSubmittingAnswer] = useState(false);
    const [answerSort, setAnswerSort] = useState(1); // 1 = Hot (most voted first)
    const [commentPage, setCommentPage] = useState(1);
    const [totalCommentPages, setTotalCommentPages] = useState(1);
    const [totalComments, setTotalComments] = useState(0);

    /* ── Question editing ── */
    const [editing, setEditing] = useState(false);
    const [editContent, setEditContent] = useState("");
    const [savingEdit, setSavingEdit] = useState(false);
    const [allCompanies, setAllCompanies] = useState([]);
    const [editCompanies, setEditCompanies] = useState([]);

    useEffect(() => {
        callApi({ method: METHOD.GET, endpoint: homeEndPoints.GET_ALL_COMPANIES, arg: { page: 1, pageSize: 200 } })
            .then(({ data: d }) => {
                const items = d?.items ?? d?.data ?? (Array.isArray(d) ? d : []);
                const mapped = items
                    .map((c) => ({ id: c.id ?? c.companyId, name: c.name ?? c.companyName }))
                    .filter((c) => c.id);
                setAllCompanies(items);
                setEditCompanies(mapped);
            })
            .catch(() => {});
    }, []);

    /* ── Confirm dialog ── */
    const [confirm, setConfirm] = useState({
        open: false,
        title: "",
        message: "",
        confirmText: "Confirm",
        cancelText: "Cancel",
        onConfirm: null,
    });

    /* ── Report dialog ── */
    const [reportTarget, setReportTarget] = useState(null);

    const closeConfirm = () => setConfirm((p) => ({ ...p, open: false, onConfirm: null }));

    const openConfirm = ({ title, message, confirmText, cancelText, onConfirm }) =>
        setConfirm({
            open: true,
            title,
            message,
            confirmText: confirmText ?? "Confirm",
            cancelText: cancelText ?? "Cancel",
            onConfirm,
        });

    /* ── Fetch comments ── */
    const fetchComments = async (page = commentPage) => {
        if (!id) return;
        setLoadingAnswers(true);
        try {
            const { data } = await callApi({
                method: METHOD.GET,
                endpoint: commentEndPoints.GET_LIST(id),
                arg: { page, pageSize: 10, sortBy: answerSort },
            });
            const raw = data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
            setAnswers(raw);
            setTotalCommentPages(data?.totalPages ?? 1);
            setTotalComments(data?.totalCount ?? raw.length);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingAnswers(false);
        }
    };

    /* ── Fetch question detail ── */
    useEffect(() => {
        if (!id) return;
        setLoading(true);
        callApi({ method: METHOD.GET, endpoint: interviewQuestionEndPoints.GET_DETAIL(id) })
            .then(({ data }) => {
                setData(data ?? null);
                setSaved(data?.isSavedByUser ?? false);
                setSaveCount(data?.saveCount ?? 0);
                setQuestionLiked(data?.isLikedByUser ?? false);
                // If the detail response already includes comments, use them
                if (data?.comments) {
                    setAnswers(data.comments);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        fetchComments(commentPage);
    }, [id, answerSort, commentPage]);

    /* ── Like question ── */
    const handleLikeQuestion = async () => {
        if (!currentUser) {
            navigate("/login");
            return;
        }

        const prev = questionLiked;
        const prevVote = data?.vote ?? 0;

        // optimistic update
        setQuestionLiked(!prev);
        setData((d) => ({ ...(d ?? {}), vote: prevVote + (!prev ? 1 : -1) }));

        try {
            const { data: res } = await callApi({
                method: METHOD.POST,
                endpoint: interactionEndPoints.LIKE_QUESTION(id),
            });
            const serverLiked = typeof res === "boolean" ? res : (res?.isLiked ?? !prev);
            setQuestionLiked(serverLiked);
            // reconcile vote count with server response
            setData((d) => ({ ...(d ?? {}), vote: d?.vote ?? prevVote }));
        } catch {
            // revert
            setQuestionLiked(prev);
            setData((d) => ({ ...(d ?? {}), vote: prevVote }));
        }
    };

    /* ── Save question ── */
    const handleSaveQuestion = async () => {
        if (!currentUser) {
            navigate("/login");
            return;
        }
        const prevSaved = saved;
        const prevCount = saveCount;
        const nextSaved = !prevSaved;
        setSaved(nextSaved);
        setSaveCount(prevCount + (nextSaved ? 1 : -1));
        try {
            const { data: res } = await callApi({
                method: METHOD.POST,
                endpoint: interactionEndPoints.SAVE_QUESTION(id),
                arg: nextSaved,
                headers: { "Content-Type": "application/json" },
            });
            const serverSaved = res?.isSaved ?? (typeof res === "boolean" ? res : nextSaved);
            setSaved(serverSaved);
            setSaveCount(prevCount + (serverSaved ? 1 : 0) - (prevSaved ? 1 : 0));
        } catch {
            setSaved(prevSaved);
            setSaveCount(prevCount);
        }
    };

    /* ── Like comment (optimistic + update local answers) ── */
    const handleVoteComment = async (commentId) => {
        const current = answers.find((a) => String(a.id) === String(commentId));
        if (!current) {
            const { data: res } = await callApi({
                method: METHOD.POST,
                endpoint: interactionEndPoints.LIKE_COMMENT(id, commentId),
            });
            return typeof res === "boolean" ? res : (res?.isLiked ?? undefined);
        }

        const prevLiked = current.isLikedByUser ?? false;
        const prevVote = current.vote ?? 0;

        setAnswers((prev) =>
            prev.map((a) =>
                String(a.id) === String(commentId)
                    ? { ...a, isLikedByUser: !prevLiked, vote: prevVote + (!prevLiked ? 1 : -1) }
                    : a,
            ),
        );

        try {
            const { data: res } = await callApi({
                method: METHOD.POST,
                endpoint: interactionEndPoints.LIKE_COMMENT(id, commentId),
            });
            const serverLiked = typeof res === "boolean" ? res : (res?.isLiked ?? undefined);

            if (serverLiked !== undefined) {
                setAnswers((prev) =>
                    prev.map((a) =>
                        String(a.id) === String(commentId)
                            ? {
                                  ...a,
                                  isLikedByUser: serverLiked,
                                  vote: serverLiked
                                      ? Math.max(a.vote ?? 0, prevVote + 1)
                                      : Math.max((a.vote ?? 0) - 1, 0),
                              }
                            : a,
                    ),
                );
            }

            return serverLiked;
        } catch (err) {
            setAnswers((prev) =>
                prev.map((a) =>
                    String(a.id) === String(commentId) ? { ...a, isLikedByUser: prevLiked, vote: prevVote } : a,
                ),
            );
            throw err;
        }
    };

    /* ── Add comment ── */
    const handleAddComment = async () => {
        if (!answerInput.trim()) return;
        setSubmittingAnswer(true);
        try {
            await callApi({
                method: METHOD.POST,
                endpoint: commentEndPoints.ADD_COMMENT(id),
                arg: { content: answerInput.trim() },
            });
            setAnswerInput("");
            setCommentPage(1);
            await fetchComments(1);
        } catch (err) {
            toast.error(err?.response?.data?.message ?? "Failed to add comment");
        } finally {
            setSubmittingAnswer(false);
        }
    };

    /* ── Update comment ── */
    const handleUpdateComment = async (commentId, newContent) => {
        try {
            await callApi({
                method: METHOD.PUT,
                endpoint: commentEndPoints.UPDATE_COMMENT(id, commentId),
                arg: { content: newContent },
            });
            setAnswers((prev) => prev.map((a) => (a.id === commentId ? { ...a, content: newContent } : a)));
        } catch (err) {
            toast.error(err?.response?.data?.message ?? "Failed to update comment");
            throw err;
        }
    };

    /* ── Delete comment ── */
    const handleDeleteComment = async (commentId) => {
        try {
            await callApi({ method: METHOD.DELETE, endpoint: commentEndPoints.DELETE_COMMENT(id, commentId) });
            setAnswers((prev) => prev.filter((a) => a.id !== commentId));
        } catch (err) {
            toast.error(err?.response?.data?.message ?? "Failed to delete comment");
        }
    };

    /* ── Delete question ── */
    const handleDeleteQuestion = async () => {
        try {
            await callApi({
                method: METHOD.DELETE,
                endpoint: interviewQuestionEndPoints.DELETE_QUESTION(id),
                displaySuccessMessage: true,
            });
            navigate("/questions");
        } catch (err) {
            toast.error(err?.response?.data?.message ?? "Failed to delete question");
        }
    };

    /* ── Edit question ── */
    const requestSaveEdit = () => {
        if (!editContent.trim() || editContent.trim() === data.content) {
            setEditing(false);
            return;
        }
        openConfirm({
            title: "Save changes?",
            message: "Do you want to update this question?",
            confirmText: "Save",
            cancelText: "Cancel",
            onConfirm: async () => {
                await handleSaveEdit();
                closeConfirm();
            },
        });
    };

    const handleSaveEdit = async () => {
        setSavingEdit(true);

        try {
            await callApi({
                method: METHOD.PUT,
                endpoint: interviewQuestionEndPoints.UPDATE_QUESTION(id),
                arg: {
                    title: editContent.trim(),
                    content: editContent.trim(),
                    level: data.level,
                    round: data.round,
                    category: data.category ?? data.questionType,
                    companyIds: (data.companyNames ?? [])
                        .map((name) => companies.find((c) => c.name === name)?.id)
                        .filter(Boolean),
                    roles: data.roles ?? [],
                    tagIds: data.tagIds ?? [],
                },
            });

            setData((prev) => ({
                ...prev,
                title: editContent.trim(),
                content: editContent.trim(),
            }));

            toast.success("Question updated");
            setEditing(false);
        } catch (err) {
            toast.error(err?.response?.data?.message ?? "Failed to update question");
        } finally {
            setSavingEdit(false);
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    /* ── Loading / not-found guards ── */
    if (loading) {
        return (
            <Box display="flex" justifyContent="center" py={10}>
                <CircularProgress />
            </Box>
        );
    }

    if (!data) {
        return (
            <Typography align="center" color="text.secondary" py={8}>
                Question not found.
            </Typography>
        );
    }

    /* ── Normalized fields from QuestionDetailDto ── */
    const companyNames = data.companyNames ?? [];
    console.log("Data:", data);
    const companyLabel = companyNames.length ? `Asked at ${companyNames.join(", ")}` : "Community question";
    const roles = data.roles ?? [];
    const tags = data.tags ?? [];
    const isOwner = !!currentUser?.id && String(currentUser.id) === String(data.createdBy ?? data.authorId);

    const actionBtns = [
        {
            icon: saved ? <BookmarkIcon sx={{ fontSize: 15 }} /> : <BookmarkBorderIcon sx={{ fontSize: 15 }} />,
            label: `Save${saveCount > 0 ? ` ${saveCount}` : ""}`,

            onClick: handleSaveQuestion,
            active: saved,
            tooltip: "",
        },
        {
            icon: <AddCircleOutlineIcon sx={{ fontSize: 15 }} />,
            label: "I was asked this",
            tooltip: "",
            onClick: () =>
                navigate("/questions/share", {
                    state: {
                        linkedQuestion: {
                            id: data.id,
                            content: data.content,
                            companyIds: data.companyIds?.[0] ?? data.companyId ?? null,
                            roles: data.roles ?? [],
                            tags: data.tags ?? [],
                            category: data.category ?? data.questionType,
                            answerCount: data.answerCount,
                        },
                    },
                }),
        },
        {
            icon: <ShareIcon sx={{ fontSize: 15 }} />,
            label: "Share",
            onClick: handleShare,
            tooltip: copied ? "Link copied!" : "Copy link",
        },
        {
            icon: <FlagOutlinedIcon sx={{ fontSize: 15 }} />,
            label: "Report",
            tooltip: "",
            onClick: () =>
                setReportTarget({
                    questionId: id ?? data?.id,
                    questionTitle: data.title,
                    questionAuthor: data.authorName,
                }),
        },
    ];

    const detailRows = [
        { label: "Companies", items: companyNames },
        { label: "Roles", items: roles },
        { label: "Tags", items: tags },
    ].filter(({ items }) => items.length > 0);

    const hottestAnswer = [...answers].sort((a, b) => {
        const aVotes = a?.voteCount ?? a?.vote ?? 0;
        const bVotes = b?.voteCount ?? b?.vote ?? 0;
        return bVotes - aVotes;
    })[0];

    const hottestAnswerId = hottestAnswer?.id;

    const sortedAnswers = (() => {
        if (answerSort === 3) {
            return [...answers].sort((a, b) => {
                const aVotes = a?.voteCount ?? a?.vote ?? 0;
                const bVotes = b?.voteCount ?? b?.vote ?? 0;
                return bVotes - aVotes;
            });
        }
        if (answerSort === 2) {
            return [...answers].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        return [...answers].sort((a, b) => {
            const aVotes = a?.voteCount ?? a?.vote ?? 0;
            const bVotes = b?.voteCount ?? b?.vote ?? 0;
            return bVotes - aVotes;
        });
    })();

    return (
        <Box
            sx={{
                display: "flex",
                gap: 3.5,
                maxWidth: 1100,
                mx: "auto",
                px: 2.5,
                py: 3.5,
                alignItems: "flex-start",
                flexWrap: { xs: "wrap", md: "nowrap" },
            }}
        >
            {/* Main column */}
            <Box flex={1} minWidth={0}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate("/questions")}
                    sx={{
                        color: "text.secondary",
                        textTransform: "none",
                        fontSize: 13,
                        p: 0,
                        mb: 2.25,
                        "&:hover": { color: "primary.main", background: "none" },
                    }}
                >
                    All Questions
                </Button>

                <Stack direction="row" alignItems="flex-start" gap={1} mb={0.75}>
                    {editing ? (
                        <Box flex={1}>
                            <TextField
                                fullWidth
                                multiline
                                size="small"
                                value={editContent}
                                onChange={(e) => {
                                    const WORD_LIMIT = 60;
                                    let val = e.target.value || "";
                                    const words = val.trim().split(/\s+/).filter(Boolean);
                                    if (words.length > WORD_LIMIT) {
                                        val = words.slice(0, WORD_LIMIT).join(" ");
                                    }
                                    setEditContent(val);
                                }}
                                helperText={`${
                                    (editContent || "").trim().split(/\s+/).filter(Boolean).length
                                } / 60 words`}
                                autoFocus
                                sx={{ mb: 1 }}
                            />
                            <Stack direction="row" gap={1}>
                                <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={<CheckIcon sx={{ fontSize: 14 }} />}
                                    disabled={savingEdit}
                                    onClick={requestSaveEdit}
                                    sx={{ textTransform: "none", borderRadius: 999 }}
                                >
                                    {savingEdit ? "Saving..." : "Save"}
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<CloseIcon sx={{ fontSize: 14 }} />}
                                    onClick={() => setEditing(false)}
                                    sx={{ textTransform: "none", borderRadius: 999 }}
                                >
                                    Cancel
                                </Button>
                            </Stack>
                        </Box>
                    ) : (
                        <Typography variant="h4" flex={1}>
                            {data.content}
                        </Typography>
                    )}
                    {isOwner && !editing && (
                        <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 0.25 }}>
                            <Tooltip title="Edit question" placement="top">
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        setEditContent(data.content ?? "");
                                        setEditing(true);
                                    }}
                                    sx={{ color: "text.disabled", "&:hover": { color: "primary.main" } }}
                                >
                                    <EditIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete question" placement="top">
                                <IconButton
                                    size="small"
                                    onClick={() =>
                                        openConfirm({
                                            title: "Delete question?",
                                            message: "This action cannot be undone.",
                                            confirmText: "Delete",
                                            cancelText: "Cancel",
                                            onConfirm: async () => {
                                                await handleDeleteQuestion();
                                                closeConfirm();
                                            },
                                        })
                                    }
                                    sx={{ color: "text.disabled", "&:hover": { color: "error.main" } }}
                                >
                                    <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    )}
                </Stack>

                {/* Author + meta */}
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    {(data.authorAvatar ?? data.authorProfilePicture) && (
                        <Avatar
                            src={data.authorAvatar ?? data.authorProfilePicture}
                            sx={{ width: 24, height: 24, cursor: data.authorSlug ? "pointer" : "default" }}
                            onClick={() => data.authorSlug && navigate(`/profile/${data.authorSlug}`)}
                        >
                            {data.authorName?.charAt(0) ?? "?"}
                        </Avatar>
                    )}
                    {data.authorName && (
                        <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{
                                cursor: data.authorSlug ? "pointer" : "default",
                                "&:hover": data.authorSlug ? { color: "primary.main" } : {},
                            }}
                            onClick={() => data.authorSlug && navigate(`/profile/${data.authorSlug}`)}
                        >
                            {data.authorName}
                        </Typography>
                    )}
                    <Stack direction="row" alignItems="center" gap={0.75}>
                        {companyNames.length > 0 && <CompanyLogo name={companyNames[0]} size={16} />}
                        <Typography variant="body2" color="text.secondary">
                            {companyLabel}
                            {data.createdAt && ` \u2022 ${timeAgo(data.createdAt)}`}
                        </Typography>
                    </Stack>
                </Stack>

                {/* Actions */}
                <Stack direction="row" flexWrap="wrap" gap={0.75} mb={2.75}>
                    <Tooltip title={questionLiked ? "Unlike" : "Like"} placement="top">
                        <Button
                            size="small"
                            startIcon={
                                questionLiked ? (
                                    <ThumbUpIcon sx={{ fontSize: 15, color: "primary.main" }} />
                                ) : (
                                    <ThumbUpOutlinedIcon sx={{ fontSize: 15 }} />
                                )
                            }
                            onClick={handleLikeQuestion}
                            variant="outlined"
                            sx={{
                                borderRadius: 999,
                                textTransform: "none",
                                fontSize: 13,
                                color: questionLiked ? "primary.main" : "text.primary",
                                borderColor: questionLiked ? "primary.main" : "divider",
                                bgcolor: questionLiked ? "primary.50" : "transparent",
                                "&:hover": { bgcolor: "action.hover" },
                            }}
                        >
                            Like {data.vote != null ? ` ${data.vote}` : ""}
                        </Button>
                    </Tooltip>
                    {actionBtns.map(({ icon, label, onClick, active, tooltip }) => (
                        <Tooltip key={label} title={tooltip} placement="top">
                            <Button
                                size="small"
                                startIcon={icon}
                                onClick={onClick}
                                variant="outlined"
                                sx={{
                                    borderRadius: 999,
                                    textTransform: "none",
                                    fontSize: 13,
                                    color: active ? "primary.main" : "text.primary",
                                    borderColor: active ? "primary.main" : "divider",
                                    bgcolor: active ? "primary.50" : "transparent",
                                    "&:hover": { bgcolor: "action.hover" },
                                }}
                            >
                                {label}
                            </Button>
                        </Tooltip>
                    ))}
                </Stack>

                {/* Interview Process */}
                {data.interviewProcess && (
                    <Paper variant="outlined" sx={{ p: 2, mb: 2.25, borderRadius: 2 }}>
                        <Stack direction="row" alignItems="center" gap={0.75} mb={1}>
                            <ListAltIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                            <Typography variant="body2" fontWeight={600}>
                                Interview Process
                            </Typography>
                        </Stack>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}
                        >
                            {data.interviewProcess}
                        </Typography>
                    </Paper>
                )}

                {/* Community guidelines */}
                <Paper variant="outlined" sx={{ p: 2, mb: 2.25, bgcolor: "grey.50", borderRadius: 2 }}>
                    <Stack direction="row" alignItems="center" gap={0.75} mb={1}>
                        <ChatBubbleOutlineIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                        <Typography variant="body2" fontWeight={600}>
                            Community guidelines
                        </Typography>
                    </Stack>
                    <Box component="ul" sx={{ m: 0, pl: 2.5, "& li": { mb: 0.5 } }}>
                        <Typography component="li" variant="body2" color="text.secondary">
                            <Box component="strong" sx={{ color: "text.primary" }}>
                                Stay on topic.
                            </Box>{" "}
                            Use this section for submitting solutions and providing feedback to others.
                        </Typography>
                        <Typography component="li" variant="body2" color="text.secondary">
                            <Box component="strong" sx={{ color: "text.primary" }}>
                                Be inclusive.
                            </Box>{" "}
                            Intervu is a diverse community. Please respect others&apos; opinions and beliefs.
                        </Typography>
                    </Box>
                </Paper>

                {/* Add answer */}
                <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                    <Stack direction="row" alignItems="flex-start" gap={1.5}>
                        <Avatar
                            src={currentUser?.profilePicture ?? ""}
                            sx={{ width: 36, height: 36, bgcolor: "primary.main", mt: 0.5 }}
                        >
                            {!currentUser?.profilePicture &&
                                (currentUser?.fullName?.[0] ?? currentUser?.name?.[0] ?? "?")}
                        </Avatar>
                        <Box flex={1}>
                            <TextField
                                fullWidth
                                size="small"
                                multiline
                                minRows={2}
                                placeholder="Add your own answer to this question..."
                                value={answerInput}
                                onChange={(e) => setAnswerInput(e.target.value)}
                                sx={{ mb: 1 }}
                            />
                            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                <Button
                                    size="small"
                                    variant="contained"
                                    endIcon={<SendIcon sx={{ fontSize: 14 }} />}
                                    disabled={!answerInput.trim() || submittingAnswer}
                                    onClick={handleAddComment}
                                    sx={{ textTransform: "none", borderRadius: 999 }}
                                >
                                    {submittingAnswer ? "Posting..." : "Post Answer"}
                                </Button>
                            </Box>
                        </Box>
                    </Stack>
                </Paper>

                {/* Answers list */}
                {loadingAnswers ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : (
                    answers.length > 0 && (
                        <>
                            <Stack direction="row" alignItems="center" gap={0.75} mb={1.75}>
                                <ForumOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                                <Typography variant="body1" fontWeight={600}>
                                    {totalComments} {totalComments === 1 ? "Answer" : "Answers"}
                                </Typography>
                                <Box flex={1} />
                                <FormControl size="small">
                                    <Select
                                        value={answerSort}
                                        onChange={(e) => {
                                            setAnswerSort(e.target.value);
                                            setCommentPage(1);
                                        }}
                                        sx={{
                                            fontSize: 13,
                                            borderRadius: 999,
                                            ".MuiSelect-select": { py: 0.5, px: 1.5 },
                                        }}
                                    >
                                        {SORT_OPTIONS.map((s) => (
                                            <MenuItem key={s.value} value={s.value}>
                                                {s.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                            {sortedAnswers.map((a, idx) => {
                                const isCommentAuthor =
                                    !!currentUser?.id && String(currentUser.id) === String(a.createdBy);

                                const isQuestionAuthor =
                                    !!(a.createdBy ?? a.authorId) &&
                                    String(a.createdBy ?? a.authorId) === String(data.createdBy ?? data.authorId);

                                return (
                                    <AnswerCard
                                        key={a.id ?? idx}
                                        answer={a}
                                        currentUserId={currentUser?.id}
                                        isQuestionAuthor={isQuestionAuthor}
                                        isHottest={!!a.id && a.id === hottestAnswerId}
                                        onEdit={a.id ? handleUpdateComment : undefined}
                                        onVote={a.id ? handleVoteComment : undefined}
                                        onReport={() =>
                                            setReportTarget({
                                                questionId: id ?? data?.id,
                                                questionTitle: data.content,
                                                questionAuthor: a.authorName,
                                            })
                                        }
                                        onDelete={
                                            a.id && isCommentAuthor
                                                ? () =>
                                                      openConfirm({
                                                          title: "Delete comment?",
                                                          message: "This action cannot be undone.",
                                                          confirmText: "Delete",
                                                          cancelText: "Cancel",
                                                          onConfirm: async () => {
                                                              await handleDeleteComment(a.id);
                                                              closeConfirm();
                                                          },
                                                      })
                                                : undefined
                                        }
                                    />
                                );
                            })}
                        </>
                    )
                )}
            </Box>

            {/* Sidebar */}
            <Box
                sx={{
                    width: { xs: "100%", md: 270 },
                    flexShrink: 0,
                    position: { md: "sticky" },
                    top: 80,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2.5,
                }}
            >
                <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 2 }}>
                    <Typography variant="h6" mb={1.75}>
                        Interview Details
                    </Typography>

                    {detailRows.map(({ label, items }) => (
                        <Box key={label} mb={1.5}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
                                {label}
                            </Typography>

                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                                {items.map((item) => {
                                    const isObject = typeof item === "object";
                                    const itemName = isObject ? item.name : item;
                                    const matchedCompany =
                                        label === "Companies" &&
                                        allCompanies?.find((c) => (c.name || c.companyName) === itemName);

                                    return (
                                        <Chip
                                            key={isObject ? item.id : item}
                                            icon={<CompanyLogo name={matchedCompany?.domain || itemName} size={14} />}
                                            label={itemName}
                                            size="small"
                                            sx={{
                                                bgcolor: "grey.100",
                                                fontSize: 13,
                                                px: 0.5,
                                                "& .MuiChip-icon": { ml: 0.5 },
                                            }}
                                        />
                                    );
                                })}
                            </Box>
                        </Box>
                    ))}
                </Paper>

                {data.relatedQuestions?.length > 0 && (
                    <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 2 }}>
                        <Typography variant="h6" mb={1.75}>
                            Related Questions
                        </Typography>
                        {data.relatedQuestions.map((q) => (
                            <Paper
                                key={q.id}
                                variant="outlined"
                                onClick={() => navigate(`/questions/${q.id}`)}
                                sx={{
                                    p: 1.5,
                                    mb: 1,
                                    cursor: "pointer",
                                    borderRadius: 1.5,
                                    transition: "box-shadow 0.15s",
                                    "&:hover": { boxShadow: 3 },
                                    "&:last-child": { mb: 0 },
                                }}
                            >
                                <Stack direction="row" alignItems="center" gap={0.75} mb={0.5}>
                                    {(q.companyName || (q.companyNames && q.companyNames[0])) && (
                                        <CompanyLogo name={q.companyName || q.companyNames[0]} size={14} />
                                    )}
                                    <Typography variant="caption" color="text.disabled">
                                        {(q.companyName || (q.companyNames && q.companyNames[0])) &&
                                            `Asked at ${q.companyName || q.companyNames[0]}`}
                                        {q.answerCount != null && ` \u2022 ${q.answerCount} answers`}
                                        {q.createdAt && ` \u2022 ${timeAgo(q.createdAt)}`}
                                    </Typography>
                                </Stack>
                                <Typography
                                    variant="body2"
                                    fontWeight={600}
                                    sx={{
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        lineHeight: 1.5,
                                        mb: 1.5,
                                        height: "3em", // Exactly 2 lines height
                                    }}
                                >
                                    {q.title ?? q.content}
                                </Typography>

                                {((q.tags && q.tags.length > 0) ||
                                    (q.roles && q.roles.length > 0) ||
                                    q.companyName ||
                                    (q.companyNames && q.companyNames.length > 0)) && (
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                        {[...(q.roles || []), ...(q.tags || [])].slice(0, 2).map((tag, i) => (
                                            <Chip
                                                key={i}
                                                icon={
                                                    <CompanyLogo
                                                        name={typeof tag === "object" ? tag.name : tag}
                                                        size={12}
                                                    />
                                                }
                                                label={typeof tag === "object" ? tag.name : tag}
                                                size="small"
                                                sx={{
                                                    height: 20,
                                                    fontSize: 11,
                                                    bgcolor: "grey.50",
                                                    border: "1px solid",
                                                    borderColor: "grey.200",
                                                    "& .MuiChip-label": { px: 1 },
                                                    "& .MuiChip-icon": { ml: 0.5, mr: -0.5 },
                                                }}
                                            />
                                        ))}
                                    </Box>
                                )}
                            </Paper>
                        ))}
                    </Paper>
                )}
            </Box>

            <ConfirmModal
                show={confirm.open}
                title={confirm.title}
                message={confirm.message}
                confirmText={confirm.confirmText}
                cancelText={confirm.cancelText}
                onCancel={closeConfirm}
                onConfirm={confirm.onConfirm ?? closeConfirm}
            />

            <ReportDialog
                open={!!reportTarget}
                onClose={() => setReportTarget(null)}
                questionId={reportTarget?.questionId}
                questionTitle={reportTarget?.questionTitle}
                questionAuthor={reportTarget?.questionAuthor}
                currentUserName={currentUser?.fullName ?? currentUser?.name ?? ""}
            />
        </Box>
    );
}
