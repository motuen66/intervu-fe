import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, Box, Button, Chip, IconButton, Paper, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { keyframes } from "@mui/system";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import StarIcon from "@mui/icons-material/Star";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import { formattedDateTime } from "../../../../common/utils/dateFormatter";

const glowPulse = keyframes`
    0%, 100% { box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.25); }
    50%       { box-shadow: 0 0 0 5px rgba(255, 152, 0, 0.45); }
`;

export default function AnswerCard({
    answer: comment,
    currentUserId,
    isQuestionAuthor,
    isHottest,
    onEdit,
    onDelete,
    onVote,
    onReport,
}) {
    const [editing, setEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content ?? "");
    const [saving, setSaving] = useState(false);
    const [voteCount, setVoteCount] = useState(comment.vote);
    const [voted, setVoted] = useState(comment.isLikedByUser ?? false);
    const [expandedPreview, setExpandedPreview] = useState(false);

    const navigate = useNavigate();
    const commentId = comment?.id;
    const isAuthor = !!currentUserId && String(currentUserId) === String(comment.createdBy);

    const textRef = useRef(null);
    const [needsTruncate, setNeedsTruncate] = useState(false);

    useEffect(() => {
        let t = null;
        t = setTimeout(() => {
            if (textRef.current) {
                setNeedsTruncate(textRef.current.scrollHeight > textRef.current.clientHeight);
            }
        }, 0);

        return () => clearTimeout(t);
    }, [comment.content, expandedPreview]);

    const handleVote = async () => {
        if (!currentUserId) {
            navigate("/login");
            return;
        }
        const prevVoted = voted;
        const prevCount = voteCount;
        const newVoted = !voted;
        setVoted(newVoted);
        setVoteCount(prevCount + (newVoted ? 1 : -1));
        try {
            if (onVote) {
                const serverLiked = await onVote(commentId);
                if (serverLiked !== undefined) {
                    setVoted(serverLiked);
                    setVoteCount(prevCount + (serverLiked ? 1 : 0) - (prevVoted ? 1 : 0));
                }
            }
        } catch {
            setVoted(prevVoted);
            setVoteCount(prevCount);
        }
    };

    const handleSave = async () => {
        const trimmed = editContent.trim();
        if (!trimmed || trimmed === comment.content) {
            setEditing(false);
            return;
        }
        setSaving(true);
        try {
            await onEdit(commentId, trimmed);
            setEditing(false);
        } finally {
            setSaving(false);
        }
    };

    const avatarSrc = comment.authorProfilePicture ?? comment.profilePicture ?? comment.avatar ?? "";

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2.5,
                mb: 1.75,
                borderRadius: 2,
                ...(isHottest && {
                    borderColor: "warning.main",
                    animation: `${glowPulse} 2.4s ease-in-out infinite`,
                }),
            }}
        >
            {/* Top Answer badge */}
            {isHottest && (
                <Stack direction="row" alignItems="center" gap={0.5} mb={1.25}>
                    <WhatshotIcon sx={{ fontSize: 15, color: "warning.main" }} />
                    <Typography
                        variant="caption"
                        fontWeight={700}
                        sx={{ color: "warning.dark", letterSpacing: "0.04em" }}
                    >
                        TOP ANSWER
                    </Typography>
                </Stack>
            )}
            {/* Author header */}
            <Stack direction="row" alignItems="center" gap={1.5} mb={1.5}>
                <Avatar src={avatarSrc} sx={{ width: 40, height: 40, bgcolor: "primary.main" }}>
                    {comment.authorName?.[0]?.toUpperCase() ?? "?"}
                </Avatar>
                <Box flex={1}>
                    <Stack direction="row" alignItems="center" gap={0.75}>
                        <Typography variant="body2" fontWeight={600}>
                            {comment.authorName ?? "User"}
                        </Typography>
                        {isQuestionAuthor && (
                            <Chip
                                icon={<StarIcon sx={{ fontSize: 13, color: "#7c3aed !important" }} />}
                                label="Author"
                                size="small"
                                variant="outlined"
                                sx={{
                                    height: 20,
                                    fontSize: 11,
                                    color: "#7c3aed",
                                    borderColor: "#7c3aed",
                                    bgcolor: "#ede9fe",
                                }}
                            />
                        )}
                    </Stack>
                    <Typography variant="caption" color="text.disabled">
                        {formattedDateTime(comment.createdAt)}
                    </Typography>
                </Box>
                <Stack direction="row" alignItems="center" gap={0.5}>
                    {isAuthor && onEdit && !editing && (
                        <Tooltip title="Edit" placement="top">
                            <IconButton
                                size="small"
                                onClick={() => {
                                    setEditContent(comment.content ?? "");
                                    setEditing(true);
                                }}
                                sx={{ color: "text.disabled", "&:hover": { color: "primary.main" } }}
                            >
                                <EditIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                        </Tooltip>
                    )}
                    {onDelete && (
                        <Button
                            size="small"
                            onClick={onDelete}
                            sx={{
                                color: "text.disabled",
                                textTransform: "none",
                                fontSize: 12,
                                p: 0,
                                minWidth: 0,
                                "&:hover": { color: "error.main", background: "none" },
                            }}
                        >
                            Delete
                        </Button>
                    )}
                </Stack>
            </Stack>
            {/* Body */}
            {editing ? (
                <Box mb={1.75}>
                    <TextField
                        fullWidth
                        multiline
                        size="small"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        autoFocus
                        inputProps={{ maxLength: 300 }}
                        sx={{ mb: 1 }}
                    />
                    <Stack direction="row" gap={1}>
                        <Button
                            size="small"
                            variant="contained"
                            startIcon={<CheckIcon sx={{ fontSize: 13 }} />}
                            disabled={saving}
                            onClick={handleSave}
                            sx={{ textTransform: "none", borderRadius: 999 }}
                        >
                            {saving ? "Saving..." : "Save"}
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<CloseIcon sx={{ fontSize: 13 }} />}
                            onClick={() => setEditing(false)}
                            sx={{ textTransform: "none", borderRadius: 999 }}
                        >
                            Cancel
                        </Button>
                    </Stack>
                </Box>
            ) : (
                <>
                    <Box sx={{ position: "relative", mb: 1.25 }}>
                        <Typography
                            variant="body2"
                            sx={{
                                lineHeight: 1.65,
                                color: "text.primary",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                overflowWrap: "anywhere",
                                display: "-webkit-box",
                                WebkitLineClamp: expandedPreview ? "unset" : 5,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                            }}
                            ref={textRef}
                        >
                            {comment.content}
                        </Typography>

                        {/* gradient overlay when collapsed and content is long */}
                        {needsTruncate && !expandedPreview && (
                            <Box
                                sx={{
                                    position: "absolute",
                                    transition: "all 0.25s ease",
                                    left: 16,
                                    right: 16,
                                    bottom: 0,
                                    height: 40,
                                    background: "linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.95))",
                                    pointerEvents: "none",
                                }}
                            />
                        )}
                    </Box>

                    {needsTruncate && (
                        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1.25 }}>
                            <Button
                                size="small"
                                onClick={() => setExpandedPreview((v) => !v)}
                                sx={{ textTransform: "none", p: 0, minWidth: 0 }}
                            >
                                {expandedPreview ? "View less" : "View more"}
                            </Button>
                        </Box>
                    )}
                </>
            )}
            {/* Actions */}
            <Stack direction="row" gap={2}>
                <Tooltip title={voted ? "Unlike" : "Like"} placement="top">
                    <Button
                        size="small"
                        startIcon={
                            voted ? (
                                <ThumbUpIcon sx={{ fontSize: 15, color: "primary.main" }} />
                            ) : (
                                <ThumbUpOutlinedIcon sx={{ fontSize: 15 }} />
                            )
                        }
                        onClick={handleVote}
                        sx={{
                            textTransform: "none",
                            fontSize: 13,
                            color: voted ? "primary.main" : "text.secondary",
                            bgcolor: voted ? "primary.50" : "transparent",
                            p: 0,
                            minWidth: 0,
                            "&:hover": { bgcolor: "action.hover" },
                        }}
                    >
                        Like {voteCount != null ? ` ${voteCount}` : ""}
                    </Button>
                </Tooltip>
                <Button
                    size="small"
                    startIcon={<FlagOutlinedIcon sx={{ fontSize: 15 }} />}
                    onClick={onReport}
                    sx={{
                        color: "text.secondary",
                        textTransform: "none",
                        fontWeight: 400,
                        fontSize: 13,
                        p: 0,
                        minWidth: 0,
                        "&:hover": { color: "error.main", background: "none" },
                    }}
                >
                    Report
                </Button>
            </Stack>
        </Paper>
    );
}
