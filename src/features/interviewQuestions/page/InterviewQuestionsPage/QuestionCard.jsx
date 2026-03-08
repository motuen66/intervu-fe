import { useEffect, useState } from "react";
import { Avatar, Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import { timeAgo } from "../../../../common/utils/dateFormatter";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { commentEndPoints } from "../../service/commentApi";
import { interactionEndPoints } from "../../service/interactionApi";
import { ROLES, QUESTION_TYPES, LEVELS, ROUNDS } from "../../../../common/constants/types";
import { CompanyLogo } from "../../../../common/utils/logoImageGenerator";

export default function QuestionCard({ item, isHot: isHotProp }) {
    const [expanded, setExpanded] = useState(false);
    const navigate = useNavigate();
    const currentUser = useSelector((state) => state.auth.userData);

    const [likeCount, setLikeCount] = useState(item.likeCount ?? item.vote ?? 0);
    const [liked, setLiked] = useState(item.isLikedByUser ?? false);
    const [saved, setSaved] = useState(item.isSavedByUser ?? false);
    const [saveCount, setSaveCount] = useState(item.saveCount ?? 0);
    const [commentCount, setCommentCount] = useState(null);

    /* ── Normalized fields from QuestionListItemDto ── */
    const companyNames = item.companyNames ?? [];
    const companyLabel = companyNames.length ? `Asked at ${companyNames.join(", ")}` : "Community question";

    const roles = item.roles ?? [];

    const previewAnswer = (() => {
        if (Array.isArray(item.answers) && item.answers.length > 0) {
            return [...item.answers].sort((a, b) => {
                const aV = a?.voteCount ?? a?.vote ?? 0;
                const bV = b?.voteCount ?? b?.vote ?? 0;
                return bV - aV;
            })[0];
        }
        return item.hottestAnswer ?? item.topAnswer ?? null;
    })();
    const answerCount = commentCount ?? item.answerCount ?? 0;
    const viewCount = item.viewCount ?? 0;
    const isHot = isHotProp ?? item.isHot ?? false;

    /* ── Metadata chips ── */
    const roleLabel =
        typeof item.role === "number"
            ? ROLES.find((r) => r.value === item.role)?.label
            : roles[0] && (typeof roles[0] === "string" ? roles[0] : roles[0]?.name);
    const categoryLabel =
        item.category != null
            ? QUESTION_TYPES.find((t) => t.value === item.category)?.label
            : item.questionType != null
              ? QUESTION_TYPES.find((t) => t.value === item.questionType)?.label
              : null;
    const levelLabel = item.level != null ? LEVELS.find((l) => l.value === item.level)?.label : null;
    const roundLabel = item.round != null ? ROUNDS.find((r) => r.value === item.round)?.label : null;

    const metaChips = [
        roleLabel && { label: roleLabel, color: "secondary" },
        categoryLabel && { label: categoryLabel, color: "default" },
        levelLabel && { label: levelLabel, color: "info" },
        roundLabel && { label: roundLabel, color: "warning" },
    ].filter(Boolean);

    const answerText = previewAnswer?.content || "";

    useEffect(() => {
        setLikeCount(item?.likeCount ?? item?.vote ?? 0);
        setLiked(item?.isLikedByUser ?? false);
        setSaved(item?.isSavedByUser ?? false);
        setSaveCount(item?.saveCount ?? 0);
    }, []);

    useEffect(() => {
        if (!item.id) return;
        callApi({
            method: METHOD.GET,
            endpoint: commentEndPoints.GET_LIST(item.id),
            arg: { page: 1, pageSize: 1 },
        })
            .then(({ data }) => {
                const count = data?.totalCount ?? data?.total ?? null;
                if (count != null) setCommentCount(count);
            })
            .catch(() => {});
    }, [item.id]);

    const handleLike = async () => {
        if (!currentUser) {
            navigate("/login");
            return;
        }
        const prevLiked = liked;
        const prevCount = likeCount;
        setLiked(!prevLiked);
        setLikeCount((c) => c + (!prevLiked ? 1 : -1));
        try {
            const { data: res } = await callApi({
                method: METHOD.POST,
                endpoint: interactionEndPoints.LIKE_QUESTION(item.id),
            });
            const serverLiked = typeof res === "boolean" ? res : (res?.isLiked ?? !prevLiked);
            setLiked(serverLiked);
            setLikeCount(prevCount + (serverLiked ? 1 : 0) - (prevLiked ? 1 : 0));
        } catch {
            setLiked(prevLiked);
            setLikeCount(prevCount);
        }
    };

    const handleSave = async () => {
        if (!currentUser) {
            navigate("/login");
            return;
        }

        const prevSaved = saved;
        const prevCount = saveCount;

        const nextSaved = !prevSaved;

        setSaved(nextSaved);
        setSaveCount((c) => c + (nextSaved ? 1 : -1));

        try {
            const { data: res } = await callApi({
                method: METHOD.POST,
                endpoint: interactionEndPoints.SAVE_QUESTION(item.id),
                arg: nextSaved,
            });

            const serverSaved = res?.data?.isSaveQuestion ?? nextSaved;

            setSaved(serverSaved);
            setSaveCount(prevCount + (serverSaved ? 1 : 0) - (prevSaved ? 1 : 0));
        } catch {
            setSaved(prevSaved);
            setSaveCount(prevCount);
        }
    };

    const actionBtns = [
        {
            icon: saved ? (
                <BookmarkIcon sx={{ fontSize: 16, color: "primary.main" }} />
            ) : (
                <BookmarkBorderIcon sx={{ fontSize: 16 }} />
            ),
            label: saveCount > 0 ? `Save (${saveCount})` : "Save",
            onClick: handleSave,
            active: saved,
        },
        {
            icon: <ChatBubbleOutlineIcon sx={{ fontSize: 16 }} />,
            label: `${answerCount} answer${answerCount !== 1 ? "s" : ""}`,
        },
        {
            icon: <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />,
            label: `${viewCount}`,
        },
        {
            icon: <AddCircleOutlineIcon sx={{ fontSize: 16 }} />,
            label: "I was asked this",
            onClick: () =>
                navigate("/questions/share", {
                    state: {
                        linkedQuestion: {
                            id: item.id,
                            content: item.title,
                            title: item.title,
                            companyNames: item.companyNames,
                            roles: item.roles,
                            tags: item.tags,
                            category: item.category ?? item.questionType,
                            answerCount: item.answerCount,
                        },
                    },
                }),
        },
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
                        {companyNames[0] && <CompanyLogo name={companyNames[0]} size={16} />}
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

                    {/* Metadata chips: role / category / level / round */}
                    {metaChips.length > 0 && (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6, mb: 1.5 }}>
                            {metaChips.map(({ label, color }) => (
                                <Chip
                                    key={label}
                                    label={label}
                                    size="small"
                                    color={color}
                                    variant="outlined"
                                    sx={{ fontSize: 11, height: 22 }}
                                />
                            ))}
                        </Box>
                    )}

                    {/* Vote + Actions */}
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Button
                            size="small"
                            startIcon={
                                liked ? (
                                    <ThumbUpIcon sx={{ fontSize: 16, color: "primary.main" }} />
                                ) : (
                                    <ThumbUpOutlinedIcon sx={{ fontSize: 16 }} />
                                )
                            }
                            onClick={handleLike}
                            sx={{
                                color: liked ? "primary.main" : "text.secondary",
                                p: 0,
                                minWidth: 0,
                                "&:hover": { color: "primary.main", background: "none" },
                            }}
                        >
                            {likeCount}
                        </Button>
                        {actionBtns.map(({ icon, label, onClick, active }) => (
                            <Button
                                key={label}
                                size="small"
                                startIcon={icon}
                                onClick={onClick}
                                sx={{
                                    color: active ? "primary.main" : "text.secondary",
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
            {previewAnswer && (
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
                    {(previewAnswer?.authorAvatar ??
                        previewAnswer?.authorProfilePicture ??
                        item.authorAvatar ??
                        item.authorProfilePicture) && (
                        <Avatar
                            src={
                                previewAnswer?.authorAvatar ??
                                previewAnswer?.authorProfilePicture ??
                                item.authorAvatar ??
                                item.authorProfilePicture
                            }
                            sx={{ width: 22, height: 22, fontSize: 10, flexShrink: 0 }}
                        >
                            {(previewAnswer?.authorName ?? item.authorName)?.[0] ?? "U"}
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
