import { useState } from "react";
import { Avatar, Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { timeAgo } from "../../../../common/utils/dateFormatter";

export default function QuestionCard({ item }) {
    const [expanded, setExpanded] = useState(false);
    const navigate = useNavigate();

    /* ── Normalized fields from QuestionListItemDto ── */
    const companyNames = item.companyNames ?? [];
    const companyLabel = companyNames.length ? `Asked at ${companyNames.join(", ")}` : "Community question";

    const roles = item.roles ?? [];
    const tags = item.tags ?? [];
    const topAnswer = item.topAnswer ?? null;
    const answerCount = (item.answerCount ?? 0) + (topAnswer ? 1 : 0);
    const viewCount = item.viewCount ?? 0;
    const saveCount = item.saveCount ?? 0;
    const isHot = item.isHot ?? false;

    const answerText = topAnswer?.content || "";

    // console.log("topAnswer:", topAnswer, typeof topAnswer);
    const actionBtns = [
        {
            icon: <BookmarkBorderIcon sx={{ fontSize: 16 }} />,
            label: saveCount > 0 ? `Save (${saveCount})` : "Save",
        },
        {
            icon: <ChatBubbleOutlineIcon sx={{ fontSize: 16 }} />,
            label: `${answerCount} answer${answerCount !== 1 ? "s" : ""}`,
        },
        {
            icon: <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />,
            label: `${viewCount}`,
        },
        { icon: <AddCircleOutlineIcon sx={{ fontSize: 16 }} />, label: "I was asked this" },
    ];

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2.5,
                borderRadius: 2,
                transition: "box-shadow 0.15s",
                "&:hover": { boxShadow: 3 },
            }}
        >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                <Box flex={1} minWidth={0}>
                    {/* Meta */}
                    <Stack direction="row" alignItems="center" spacing={0.75} mb={1}>
                        {isHot && <WhatshotIcon sx={{ fontSize: 16, color: "error.main" }} />}
                        <Typography variant="caption" color="text.secondary">
                            {companyLabel}
                        </Typography>
                        {item.authorName && (
                            <>
                                <Typography variant="caption" color="text.disabled">
                                    &bull;
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                        cursor: item.authorSlug ? "pointer" : "default",
                                        "&:hover": item.authorSlug ? { color: "primary.main" } : {},
                                    }}
                                    onClick={() => item.authorSlug && navigate(`/profile/${item.authorSlug}`)}
                                >
                                    {item.authorName}
                                </Typography>
                            </>
                        )}
                        {item.createdAt && (
                            <>
                                <Typography variant="caption" color="text.disabled">
                                    &bull;
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {timeAgo(item.createdAt)}
                                </Typography>
                            </>
                        )}
                    </Stack>

                    {/* Title */}
                    <Typography
                        variant="h6"
                        sx={{
                            mb: 1.5,
                            cursor: "pointer",
                            lineHeight: 1.45,
                            "&:hover": { color: "primary.main" },
                        }}
                        onClick={() => item.id && navigate(`/questions/${item.id}`)}
                    >
                        {item.content}
                    </Typography>

                    {/* Company chips */}
                    {companyNames.length > 0 && (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
                            {companyNames.map((c) => (
                                <Chip
                                    key={c}
                                    label={c}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ fontSize: 11, height: 22 }}
                                />
                            ))}
                        </Box>
                    )}

                    {/* Role & tag chips */}
                    {(roles.length > 0 || tags.length > 0) && (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
                            {roles.map((role, i) => {
                                const isObj = typeof role === "object";
                                return (
                                    <Chip
                                        key={isObj ? `role-${role.id}` : `role-${i}`}
                                        label={isObj ? role.name : role}
                                        size="small"
                                        color="secondary"
                                        variant="outlined"
                                    />
                                );
                            })}

                            {tags.map((tag, i) => {
                                const isObj = typeof tag === "object";
                                return (
                                    <Chip
                                        key={isObj ? `tag-${tag.id}` : `tag-${i}`}
                                        label={isObj ? tag.name : tag}
                                        size="small"
                                    />
                                );
                            })}
                        </Box>
                    )}

                    {/* Actions */}
                    <Stack direction="row" spacing={2}>
                        {actionBtns.map(({ icon, label }) => (
                            <Button
                                key={label}
                                size="small"
                                startIcon={icon}
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
                                {label}
                            </Button>
                        ))}
                    </Stack>
                </Box>
            </Box>

            {/* Answer preview */}
            {topAnswer && (
                <Box
                    onClick={() => setExpanded((v) => !v)}
                    sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1,
                        bgcolor: "grey.50",
                        borderRadius: 2,
                        px: 1.75,
                        py: 1.25,
                        mt: 1.5,
                        cursor: "pointer",
                    }}
                >
                    {(item.authorAvatar ?? item.authorProfilePicture) && (
                        <Avatar
                            src={item.authorAvatar ?? item.authorProfilePicture}
                            sx={{ width: 22, height: 22, fontSize: 10, flexShrink: 0 }}
                        >
                            {item.authorName?.[0] ?? "U"}
                        </Avatar>
                    )}
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                            flex: 1,
                            fontStyle: "italic",
                            overflow: "hidden",
                            whiteSpace: expanded ? "pre-wrap" : "nowrap",
                            textOverflow: expanded ? "unset" : "ellipsis",
                        }}
                    >
                        {expanded
                            ? answerText
                            : `"${answerText.slice(0, 120)}${answerText.length > 120 ? " ..." : ""}"`}
                    </Typography>
                    <KeyboardArrowDownIcon
                        sx={{
                            fontSize: 18,
                            flexShrink: 0,
                            transform: expanded ? "rotate(180deg)" : "none",
                            transition: "transform 0.2s",
                        }}
                    />
                </Box>
            )}
        </Paper>
    );
}
