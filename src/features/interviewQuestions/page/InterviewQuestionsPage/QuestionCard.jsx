import { useState } from "react";
import { Avatar, Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { timeAgo } from "../../../../common/utils/dateFormatter";

export default function QuestionCard({ item }) {
    const [expanded, setExpanded] = useState(false);
    const navigate = useNavigate();

    const companies = item.companies || (item.company ? [item.company] : []);
    const companyLabel = companies.length
        ? `Asked at ${companies.join(", ")}`
        : item.companyName
          ? `Asked at ${item.companyName}`
          : "Community question";

    const tags = [item.role, item.questionType || item.category, item.level].filter(Boolean);
    const firstAnswer = item.answers?.[0]?.content || item.topAnswer || null;

    const actionBtns = [
        { icon: <BookmarkBorderIcon sx={{ fontSize: 16 }} />, label: "Save" },
        {
            icon: <ChatBubbleOutlineIcon sx={{ fontSize: 16 }} />,
            label: `${item.answerCount ?? item.answers?.length ?? 0} answers`,
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
                        {item.companyLogoUrl && (
                            <Box
                                component="img"
                                src={item.companyLogoUrl}
                                alt=""
                                sx={{ width: 18, height: 18, borderRadius: "3px", objectFit: "cover" }}
                            />
                        )}
                        <Typography variant="caption" color="text.secondary">
                            {companyLabel}
                        </Typography>
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
                        {item.content || item.question || item.title}
                    </Typography>

                    {/* Tags */}
                    {tags.length > 0 && (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
                            {tags.map((t) => (
                                <Chip
                                    key={t}
                                    label={t}
                                    size="small"
                                    sx={{ bgcolor: "grey.100", fontSize: 12, height: 24 }}
                                />
                            ))}
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

                {/* Thumbnail */}
                {/* {item.thumbnailUrl ? (
                    <Box component="img" src={item.thumbnailUrl} alt="" sx={{ width: 100, height: 70, borderRadius: 2, objectFit: "cover", flexShrink: 0 }} />
                ) : (
                    <Box sx={{ width: 100, height: 70, borderRadius: 2, background: "linear-gradient(135deg, #e0e7ff, #c7d2fe)", flexShrink: 0 }} />
                )} */}
            </Box>

            {/* Answer preview */}
            {firstAnswer && (
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
                    <Box sx={{ display: "flex", flexShrink: 0 }}>
                        {(item.answers || []).slice(0, 3).map((a, i) => (
                            <Avatar
                                key={i}
                                src={a.avatarUrl}
                                sx={{
                                    width: 22,
                                    height: 22,
                                    fontSize: 10,
                                    border: "2px solid #fff",
                                    ml: i === 0 ? 0 : "-6px",
                                }}
                            >
                                {a.authorName?.[0] ?? "U"}
                            </Avatar>
                        ))}
                        {!item.answers && <Avatar sx={{ width: 22, height: 22, fontSize: 10 }}>U</Avatar>}
                    </Box>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                            flex: 1,
                            fontStyle: "italic",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {expanded
                            ? firstAnswer
                            : `"${firstAnswer.slice(0, 120)}${firstAnswer.length > 120 ? " ..." : '"'}`}
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
