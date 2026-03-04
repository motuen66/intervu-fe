import { useState } from "react";
import { Avatar, Box, Button, Chip, IconButton, Paper, Stack, TextField, Tooltip, Typography } from "@mui/material";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import VerifiedIcon from "@mui/icons-material/Verified";
import { formattedDateTime } from "../../../../common/utils/dateFormatter";

export default function AnswerCard({ answer: comment, currentUserId, onEdit, onDelete }) {
    const [editing, setEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content ?? "");
    const [saving, setSaving] = useState(false);

    const commentId = comment?.id;
    const isAuthor = !!currentUserId && String(currentUserId) === String(comment.createdBy);

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
        <Paper variant="outlined" sx={{ p: 2.5, mb: 1.75, borderRadius: 2 }}>
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
                        {comment.isAnswer && (
                            <Chip
                                icon={<VerifiedIcon sx={{ fontSize: 13 }} />}
                                label="Verified Answer"
                                size="small"
                                color="success"
                                variant="outlined"
                                sx={{ height: 20, fontSize: 11 }}
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
                <Typography
                    variant="body2"
                    sx={{ lineHeight: 1.65, color: "text.primary", mb: 1.75, whiteSpace: "pre-wrap" }}
                >
                    {comment.content}
                </Typography>
            )}

            {/* Actions */}
            <Stack direction="row" gap={2}>
                <Button
                    size="small"
                    startIcon={<ThumbUpOutlinedIcon sx={{ fontSize: 15 }} />}
                    sx={{
                        color: "text.secondary",
                        textTransform: "none",
                        fontWeight: 400,
                        fontSize: 13,
                        p: 0,
                        minWidth: 0,
                        "&:hover": { color: "primary.main", background: "none" },
                    }}
                >
                    {comment.vote ?? 0} {(comment.vote ?? 0) === 1 ? "vote" : "votes"}
                </Button>
                <Button
                    size="small"
                    startIcon={<FlagOutlinedIcon sx={{ fontSize: 15 }} />}
                    sx={{
                        color: "text.secondary",
                        textTransform: "none",
                        fontWeight: 400,
                        fontSize: 13,
                        p: 0,
                        minWidth: 0,
                        "&:hover": { color: "primary.main", background: "none" },
                    }}
                >
                    Report
                </Button>
            </Stack>
        </Paper>
    );
}
