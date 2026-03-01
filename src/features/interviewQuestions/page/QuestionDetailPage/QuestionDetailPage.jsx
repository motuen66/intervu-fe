import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    IconButton,
    Paper,
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
import { useUserAvatarCache } from "../../../../common/hooks/useUserAvatarCache";
import toast from "react-hot-toast";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { interviewQuestionEndPoints } from "../../service/interviewQuestionApi";
import { commentEndPoints } from "../../service/commentApi";
import CommentCard from "./CommentCard";
import { timeAgo } from "../../../../common/utils/dateFormatter";
import { QUESTION_TYPES } from "../../../../common/constants/types";
import ConfirmModal from "../../../../common/components/ConfirmModal";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

/* ─── Main Page ───────────────────────────────────────────────── */
export default function QuestionDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const currentUser = useSelector((state) => state.auth.userData);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState(false);
    const [copied, setCopied] = useState(false);

    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [commentInput, setCommentInput] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editContent, setEditContent] = useState("");
    const [savingEdit, setSavingEdit] = useState(false);

    const [confirm, setConfirm] = useState({
        open: false,
        title: "",
        message: "",
        confirmText: "Confirm",
        cancelText: "Cancel",
        onConfirm: null,
    });

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

    const getUserId = (obj) =>
        obj?.authorId ??
        obj?.userId ??
        obj?.createdById ??
        obj?.createdBy ??
        obj?.user?.id ??
        obj?.user?.userId ??
        obj?.author?.id ??
        obj?.createdBy?.id ??
        obj?.user;

    const getCommentId = (c) => c?.id ?? c?.commentId ?? c?._id;

    const fetchComments = async () => {
        if (!id) return;
        setLoadingComments(true);
        try {
            const { data } = await callApi({
                method: METHOD.GET,
                endpoint: commentEndPoints.GET_LIST(id),
                arg: { page: 1, pageSize: 10 },
            });
            const raw = data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
            setComments([...raw].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingComments(false);
        }
    };

    const allUserIds = useMemo(() => {
        const ids = [getUserId(data), ...comments.map((c) => getUserId(c))];
        return [...new Set(ids.filter(Boolean))];
    }, [data, comments]);

    const avatars = useUserAvatarCache(allUserIds);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        callApi({ method: METHOD.GET, endpoint: interviewQuestionEndPoints.GET_DETAIL(id) })
            .then(({ data }) => setData(data ?? null))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        fetchComments();
    }, [id]);

    const handleAddComment = async () => {
        if (!commentInput.trim()) return;
        setSubmittingComment(true);
        try {
            const { data: newComment } = await callApi({
                method: METHOD.POST,
                endpoint: commentEndPoints.ADD_COMMENT(id),
                arg: { content: commentInput.trim() },
            });
            const optimistic = newComment ?? {
                content: commentInput.trim(),
                createdAt: new Date().toISOString(),
                authorId: currentUser?.id,
                authorName: currentUser?.fullName ?? currentUser?.name ?? "You",
                authorAvatar: currentUser?.profilePicture ?? "",
            };
            setComments((prev) => [optimistic, ...prev]);
            setCommentInput("");

            await fetchComments();
        } catch (err) {
            toast.error(err?.response?.data?.message ?? "Failed to add comment");
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleUpdateComment = async (commentId, newContent) => {
        try {
            await callApi({
                method: METHOD.PUT,
                endpoint: commentEndPoints.UPDATE_COMMENT(id, commentId),
                arg: { content: newContent },
            });
            setComments((prev) => prev.map((c) => (getCommentId(c) === commentId ? { ...c, content: newContent } : c)));
        } catch (err) {
            toast.error(err?.response?.data?.message ?? "Failed to update comment");
            throw err;
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await callApi({ method: METHOD.DELETE, endpoint: commentEndPoints.DELETE_COMMENT(id, commentId) });
            setComments((prev) => prev.filter((c) => getCommentId(c) !== commentId));
        } catch (err) {
            toast.error(err?.response?.data?.message ?? "Failed to delete comment");
        }
    };

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
        if (!editContent.trim() || editContent.trim() === data.content) {
            setEditing(false);
            return;
        }
        setSavingEdit(true);
        try {
            await callApi({
                method: METHOD.PUT,
                endpoint: interviewQuestionEndPoints.UPDATE_QUESTION(id),
                arg: { questionType: data.questionType, content: editContent.trim() },
                displaySuccessMessage: true,
            });
            setData((prev) => ({ ...prev, content: editContent.trim() }));
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

    const companies = data.companies ?? (data.companyName ? [data.companyName] : []);
    const companyLabel = companies.length ? `Asked at ${companies.join(", ")}` : "Community question";
    const roles = data.roles ?? (data.role ? [data.role] : []);
    const categories = data.categories ?? (data.questionType ? [data.questionType] : []);
    const questionAuthorId = getUserId(data);
    const isOwner = !!currentUser?.id && currentUser.id === questionAuthorId;

    const actionBtns = [
        {
            icon: saved ? <BookmarkIcon sx={{ fontSize: 15 }} /> : <BookmarkBorderIcon sx={{ fontSize: 15 }} />,
            label: `Save${data.saveCount != null ? ` ${data.saveCount}` : ""}`,
            onClick: () => setSaved((v) => !v),
            active: saved,
            tooltip: "",
        },
        { icon: <AddCircleOutlineIcon sx={{ fontSize: 15 }} />, label: "I was asked this", tooltip: "" },
        {
            icon: <ShareIcon sx={{ fontSize: 15 }} />,
            label: "Share",
            onClick: handleShare,
            tooltip: copied ? "Link copied!" : "Copy link",
        },
        { icon: <FlagOutlinedIcon sx={{ fontSize: 15 }} />, label: "Flag", tooltip: "" },
    ];

    const detailRows = [
        { label: "Roles", items: roles },
        { label: "Companies", items: companies },
        { label: "Categories", items: categories },
    ].filter(({ items }) => items.length > 0);

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
                                onChange={(e) => setEditContent(e.target.value)}
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
                            {data.content || data.question || data.title}
                        </Typography>
                    )}
                    {isOwner && !editing && (
                        <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 0.25 }}>
                            <Tooltip title="Edit question" placement="top">
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        setEditContent(data.content || data.question || data.title || "");
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
                <Typography variant="body2" color="text.secondary" mb={2}>
                    {companyLabel}
                    {data.createdAt && ` \u2022 ${timeAgo(data.createdAt)}`}
                </Typography>

                {/* Actions */}
                <Stack direction="row" flexWrap="wrap" gap={0.75} mb={2.75}>
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

                {/* Add comment */}
                <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                    <Stack direction="row" alignItems="flex-start" gap={1.5}>
                        <Avatar
                            src={currentUser?.profilePicture ?? ""}
                            sx={{ width: 36, height: 36, bgcolor: "primary.main", mt: 0.5 }}
                        />
                        <Box flex={1}>
                            <TextField
                                fullWidth
                                size="small"
                                multiline
                                minRows={2}
                                placeholder="Add your own answer to this question..."
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                sx={{ mb: 1 }}
                            />
                            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                <Button
                                    size="small"
                                    variant="contained"
                                    endIcon={<SendIcon sx={{ fontSize: 14 }} />}
                                    disabled={!commentInput.trim() || submittingComment}
                                    onClick={handleAddComment}
                                    sx={{ textTransform: "none", borderRadius: 999 }}
                                >
                                    {submittingComment ? "Posting..." : "Post"}
                                </Button>
                            </Box>
                        </Box>
                    </Stack>
                </Paper>

                {/* Comments */}
                {loadingComments ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : (
                    comments.length > 0 && (
                        <>
                            <Stack direction="row" alignItems="center" gap={0.75} mb={1.75}>
                                <ForumOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                                <Typography variant="body1" fontWeight={600}>
                                    {comments.length}
                                </Typography>
                            </Stack>
                            {comments.map((c, idx) => {
                                const commentId = getCommentId(c);
                                const commentUserId = getUserId(c);
                                const isCommentAuthor =
                                    !!currentUser?.id && String(currentUser.id) === String(commentUserId);
                                return (
                                    <CommentCard
                                        key={commentId ?? idx}
                                        comment={c}
                                        avatarUrl={avatars[String(commentUserId)] ?? c.authorAvatar}
                                        currentUserId={currentUser?.id}
                                        onEdit={commentId ? handleUpdateComment : undefined}
                                        onDelete={
                                            commentId && isCommentAuthor
                                                ? () =>
                                                      openConfirm({
                                                          title: "Delete comment?",
                                                          message: "This action cannot be undone.",
                                                          confirmText: "Delete",
                                                          cancelText: "Cancel",
                                                          onConfirm: async () => {
                                                              await handleDeleteComment(commentId);
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
                        <Stack key={label} direction="row" alignItems="flex-start" gap={2} mb={1.5}>
                            <Typography variant="body2" fontWeight={600} sx={{ width: 90, flexShrink: 0, pt: "3px" }}>
                                {label}
                            </Typography>
                            <Box display="flex" flexWrap="wrap" gap={0.75}>
                                {items.map((item) => (
                                    <Chip
                                        key={item}
                                        label={item}
                                        size="small"
                                        sx={{ bgcolor: "grey.100", fontSize: 13 }}
                                    />
                                ))}
                            </Box>
                        </Stack>
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
                                <Typography variant="caption" color="text.disabled" display="block" mb={0.5}>
                                    {q.companyName && `Asked at ${q.companyName}`}
                                    {q.createdAt && ` \u2022 ${timeAgo(q.createdAt)}`}
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    {q.content || q.question || q.title}
                                </Typography>
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
        </Box>
    );
}
