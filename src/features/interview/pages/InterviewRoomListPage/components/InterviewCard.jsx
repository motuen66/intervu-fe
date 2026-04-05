import {
    Box,
    Typography,
    Avatar,
    Stack,
    Chip,
    Divider,
    Tooltip,
    IconButton,
    Menu,
    MenuItem,
} from "@mui/material";
import { Calendar, Clock, Star, Video, CheckCircle2, CircleDot, Circle, XCircle, Code, ClipboardList } from "lucide-react";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { formattedDateTime } from "../../../../../common/utils/dateFormatter";
import { INTERVIEW_ROOM_STATUS } from "../../../../../common/constants/status";
import { INTERVIEW_ROOM_TYPE } from "../../../../../common/constants/types";
import { ROLES } from "../../../../../common/constants/common";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import StatusChip from "../../../../../common/components/StatusChip";
import BaseCard from "../../../../../common/components/cards/BaseCard";
import { PrimaryButton, SecondaryButton, SuccessButton, DangerButton } from "../../../../../common/components/buttons";
import { getInterviewRoomStatusConfig } from "../../../../../common/constants/statusConfig";
import { alpha } from "@mui/material/styles";
import { callApi } from "../../../../../common/utils/apiConnector";
import { METHOD } from "../../../../../common/constants/api";

function InterviewCard({
    room,
    user,
    onRequestReschedule,
    onCancel,
    onClick,
    onJoin,
    onReviewQuestions,
    showActions = true,
    hasPendingReschedule = false
}) {
    const FIXED_CARD_HEIGHT = 380;

    const navigate = useNavigate();
    const isOngoing = room.status === INTERVIEW_ROOM_STATUS.ON_GOING;
    const isScheduled = room.status === INTERVIEW_ROOM_STATUS.SCHEDULED;
    const [participantAvatarUrl, setParticipantAvatarUrl] = useState(null);
    const [participantProfile, setParticipantProfile] = useState(null);
    const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState(null);

    // Determine which participant to show (opposite role)
    const participantId = user?.role === ROLES.CANDIDATE
        ? room.coachId
        : room.candidateId;

    useEffect(() => {
        if (!participantId) return;
        let cancelled = false;
        callApi({ method: METHOD.GET, endpoint: `/userprofile/${participantId}` })
            .then((res) => {
                if (!cancelled) {
                    const profile = res?.data;
                    const url =
                        profile?.profilePicture ||
                        profile?.avatarUrl ||
                        profile?.imageUrl ||
                        profile?.avatar ||
                        null;
                    setParticipantAvatarUrl(url);
                    setParticipantProfile(profile || null);
                }
            })
            .catch(() => { /* silently ignore */ });
        return () => { cancelled = true; };
    }, [participantId]);


    // Check if reschedule is available
    const hasMultipleRounds = Array.isArray(room.rounds) && room.rounds.length > 1;
    const multiRoundEligibleCount = hasMultipleRounds
        ? room.rounds.filter(
            (round) =>
                round.status === INTERVIEW_ROOM_STATUS.SCHEDULED &&
                round.canReschedule &&
                !round.hasPendingReschedule,
        ).length
        : 0;
    const isRescheduled = room.rescheduleAttemptCount >= 1;
    const canReschedule = hasMultipleRounds
        ? multiRoundEligibleCount > 0
        : (room.canReschedule ?? (!isRescheduled && !hasPendingReschedule));

    const getDisplayDate = (dateTime) => {
        const date = new Date(dateTime);
        if (Number.isNaN(date.getTime())) return formattedDateTime(dateTime);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
        });
    };

    const getDisplayTime = (dateTime) => {
        const date = new Date(dateTime);
        if (Number.isNaN(date.getTime())) return "";
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getParticipantName = () => {
        if (user?.role === ROLES.CANDIDATE) {
            return room.coachName || "AI Coach";
        }
        if (user?.role === ROLES.INTERVIEWER) {
            return room.candidateName || "Candidate";
        }
        return "Participant";
    };

    const getParticipantAvatar = () => {
        if (user?.role === ROLES.CANDIDATE) {
            return (
                room.coachAvatar ||
                room.coachProfilePicture ||
                room.coach?.profilePicture ||
                room.coach?.avatar ||
                room.coach?.avatarUrl ||
                room.coach?.imageUrl ||
                room.interviewer?.profilePicture ||
                room.interviewer?.avatar ||
                room.interviewer?.avatarUrl
            );
        }
        if (user?.role === ROLES.INTERVIEWER) {
            return (
                room.candidateAvatar ||
                room.candidateProfilePicture ||
                room.candidate?.profilePicture ||
                room.candidate?.avatar ||
                room.candidate?.avatarUrl ||
                room.candidate?.imageUrl
            );
        }
        return undefined;
    };

    const getParticipantHeadline = () => {
        if (user?.role === ROLES.CANDIDATE) {
            const title = room.coachTitle || room.coachPosition || room.coachJobTitle || room.coachRole;
            const company = room.coachCompanyName || room.coachCompany || room.companyName;
            if (title && company) return `${title} at ${company}`;
            return title || company || "Interview Coach";
        }

        if (user?.role === ROLES.INTERVIEWER) {
            const title = room.candidateTitle || room.candidatePosition || room.candidateJobTitle;
            const company = room.candidateCompanyName || room.candidateCompany;
            if (title && company) return `${title} at ${company}`;
            return title || company || "Interview Candidate";
        }

        return "Interview Participant";
    };

    const getParticipantRating = () => {
        return room.coachRating ?? room.rating ?? room.averageRating ?? null;
    };

    const getParticipantReviewCount = () => {
        return room.coachReviewCount ?? room.reviewCount ?? null;
    };

    const getInterviewTypeBadgeStyle = (typeName) => {
        const normalizedType = String(typeName || "").toLowerCase();

        if (normalizedType.includes("technical")) {
            return {
                textColor: "#0A2A66",
                bg: "linear-gradient(135deg, rgba(78, 165, 255, 0.28) 0%, rgba(124, 92, 255, 0.26) 48%, rgba(82, 228, 255, 0.24) 100%)",
                borderColor: "rgba(92, 155, 255, 0.45)",
                glowColor: "#6BA8FF",
                dotColor: "#3F8CFF",
            };
        }

        if (normalizedType.includes("cv") || normalizedType.includes("resume")) {
            return {
                textColor: "#2C3E05",
                bg: "linear-gradient(135deg, rgba(162, 243, 87, 0.3) 0%, rgba(88, 222, 125, 0.26) 46%, rgba(255, 232, 121, 0.22) 100%)",
                borderColor: "rgba(123, 214, 102, 0.45)",
                glowColor: "#91D562",
                dotColor: "#62B63E",
            };
        }

        if (normalizedType.includes("soft")) {
            return {
                textColor: "#044C58",
                bg: "linear-gradient(135deg, rgba(87, 231, 205, 0.3) 0%, rgba(72, 181, 255, 0.25) 55%, rgba(158, 128, 255, 0.22) 100%)",
                borderColor: "rgba(95, 206, 222, 0.45)",
                glowColor: "#5CC9D6",
                dotColor: "#1EB0AA",
            };
        }

        const formatTypeName = (name) => {
            if (!name) return "";
            // Remove "INTERVIEW" or "SESSION" from the end, case-insensitively
            const formatted = name.replace(/\s*(INTERVIEW|SESSION)\s*$/i, "").trim();
            return formatted || name;
        };

        return {
            textColor: "#26374A",
            bg: "linear-gradient(135deg, rgba(163, 232, 255, 0.3) 0%, rgba(181, 200, 255, 0.25) 52%, rgba(182, 244, 203, 0.22) 100%)",
            borderColor: "rgba(132, 184, 233, 0.45)",
            glowColor: "#7FB3DF",
            dotColor: "#4F88BC",
        };
    };

    const getParticipantSlug = () => {
        if (user?.role === ROLES.CANDIDATE) {
            return (
                room.coachSlugProfileUrl ||
                room.coachSlug ||
                room.coach?.slugProfileUrl ||
                room.interviewer?.slugProfileUrl ||
                participantProfile?.slugProfileUrl ||
                participantProfile?.profileUrl ||
                null
            );
        }

        if (user?.role === ROLES.INTERVIEWER) {
            return (
                room.candidateSlugProfileUrl ||
                room.candidateSlug ||
                room.candidate?.slugProfileUrl ||
                participantProfile?.slugProfileUrl ||
                participantProfile?.profileUrl ||
                null
            );
        }

        return null;
    };

    const handleOpenActionMenu = (event) => {
        event.stopPropagation();
        setActionMenuAnchorEl(event.currentTarget);
    };

    const handleCloseActionMenu = (event) => {
        event?.stopPropagation?.();
        setActionMenuAnchorEl(null);
    };

    const handleViewProfile = (event) => {
        event.stopPropagation();
        const slug = getParticipantSlug();
        if (!slug) {
            handleCloseActionMenu();
            return;
        }

        if (user?.role === ROLES.CANDIDATE) {
            navigate(`/profile/${slug}`);
        } else if (user?.role === ROLES.INTERVIEWER) {
            navigate(`/candidate/${slug}`);
        }

        handleCloseActionMenu();
    };

    const getStatusChip = () => {
        const config = getInterviewRoomStatusConfig(room.status, {
            isRescheduled,
            hasPendingReschedule,
        });

        return <StatusChip label={config.label} color={config.color} />;
    };

    const getTypeChip = () => {
        const typeConfig = {
            [INTERVIEW_ROOM_TYPE.NORMAL]: {
                label: "Normal",
                color: "default",
                sx: { bgcolor: "rgba(0, 0, 0, 0.08)", color: "#616161" }
            },
            [INTERVIEW_ROOM_TYPE.WITH_AI]: {
                label: "With AI",
                color: "secondary",
                sx: { bgcolor: "rgba(156, 39, 176, 0.12)", color: "#7b1fa2" }
            },
            [INTERVIEW_ROOM_TYPE.PEER]: {
                label: "Peer",
                color: "info",
                sx: { bgcolor: "rgba(2, 136, 209, 0.12)", color: "#0277bd" }
            },
        };

        const config = typeConfig[room.type] || typeConfig[INTERVIEW_ROOM_TYPE.NORMAL];

        return (
            <Chip
                label={config.label}
                size="small"
                sx={{
                    ...config.sx,
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    height: 24,
                    borderRadius: 1.5,
                }}
            />
        );
    };

    const getActionButton = () => {
        // Questions button should only be visible for COMPLETED interviews
        // (as they are generated after the interview ends)
        const isCompleted = room.status === INTERVIEW_ROOM_STATUS.COMPLETED;
        const showQuestions = user?.role === ROLES.INTERVIEWER && isCompleted;

        if (!showActions && !showQuestions) return null;

        // For non-actions (like Past History Tab), we still might show the Questions button
        if (!showActions) {
            return showQuestions ? (
                <SecondaryButton
                    size="small"
                    startIcon={<ClipboardList size={14} />}
                    onClick={(e) => {
                        e.stopPropagation();
                        onReviewQuestions?.(room);
                    }}
                    sx={{ fontSize: "0.8rem", px: 2 }}
                >
                    Questions
                </SecondaryButton>
            ) : null;
        }

        // SCHEDULED: Show Reschedule + Cancel buttons (future interviews)
        if (room.status === INTERVIEW_ROOM_STATUS.SCHEDULED) {
            const now = new Date();
            const scheduledTime = new Date(room.scheduledTime);
            const hoursUntil = (scheduledTime - now) / (1000 * 60 * 60);
            const isPast = hoursUntil <= 0;
            const canCancel = room.canCancel ?? !isPast;

            return (
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: "100%" }}>
                    {/* Cancel Button - hidden if scheduled time has passed */}
                    {canCancel && (
                        <SecondaryButton
                            onClick={(e) => {
                                e.stopPropagation();
                                onCancel?.(room);
                            }}
                        >
                            Cancel
                        </SecondaryButton>
                    )}

                    {/* Reschedule Button - only for candidates, hidden entirely if past */}
                    {user?.role === ROLES.CANDIDATE && !isPast && (
                        canReschedule ? (
                            <PrimaryButton
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRequestReschedule?.(room);
                                }}
                            >
                                Reschedule
                            </PrimaryButton>
                        ) : (
                            <PrimaryButton disabled>
                                Reschedule
                            </PrimaryButton>
                        )
                    )}
                </Stack>
            );
        }

        // ONGOING: Show Join button (interview is happening NOW)
        if (room.status === INTERVIEW_ROOM_STATUS.ON_GOING) {
            return (
                <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ width: "100%" }}>

                    {/* Join Session on the RIGHT */}
                    <SuccessButton
                        startIcon={<Video size={16} strokeWidth={2} />}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onJoin) {
                                onJoin(room);
                            } else {
                                navigate(`/interview/room/${room.id}`);
                            }
                        }}
                    >
                        Join Session
                    </SuccessButton>
                </Stack>
            );
        }

        // COMPLETED
        if (room.status === INTERVIEW_ROOM_STATUS.COMPLETED) {
            return (
                <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ width: "100%" }}>
                    <SecondaryButton
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick?.(room);
                        }}
                    >
                        View Feedback
                    </SecondaryButton>
                </Stack>
            );
        }

        // CANCELLED
        if (room.status === INTERVIEW_ROOM_STATUS.CANCELLED) {
            return (
                <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ width: "100%" }}>
                    <DangerButton
                        disabled
                        sx={{
                            "&.Mui-disabled": {
                                bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                                color: "error.main",
                                border: "1px solid",
                                borderColor: (theme) => alpha(theme.palette.error.main, 0.5),
                                opacity: 1,
                            }
                        }}
                    >
                        Cancelled
                    </DangerButton>
                </Stack>
            );
        }

        // For COMPLETED (when showActions is true, though typically false in Past History Tab)
        if (showQuestions) {
            return (
                <SecondaryButton
                    size="small"
                    startIcon={<ClipboardList size={14} />}
                    onClick={(e) => {
                        e.stopPropagation();
                        onReviewQuestions?.(room);
                    }}
                    sx={{ fontSize: "0.8rem", px: 2 }}
                >
                    Questions
                </SecondaryButton>
            );
        }

        return null;
    };

    const getInitials = (name) => {
        if (!name) return "?";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const formatTypeName = (name) => {
        if (!name) return "";
        return name.replace(/\s*(INTERVIEW|SESSION)\s*$/i, "").trim() || name;
    };

    return (
        <BaseCard
            onClick={() => {
                if (room.status === INTERVIEW_ROOM_STATUS.SCHEDULED) {
                    onClick?.(room);
                }
            }}
            sx={{
                p: { xs: 2.5, md: 3 },
                borderRadius: "18px",
                border: "1px solid var(--mui-palette-divider)",
                width: "100%",
                minWidth: 0,
                maxWidth: "100%",
                height: `${FIXED_CARD_HEIGHT}px`,
                minHeight: `${FIXED_CARD_HEIGHT}px`,
                maxHeight: `${FIXED_CARD_HEIGHT}px`,
                display: "flex",
                flexDirection: "column",
                position: "relative",
                overflow: "hidden",
                isolation: "isolate",
                transition: "transform 260ms ease, box-shadow 260ms ease, border-color 260ms ease",
                "&::after": {
                    content: '""',
                    position: "absolute",
                    width: 148,
                    height: 148,
                    left: -74,
                    bottom: -82,
                    borderRadius: "50%",
                    background: (theme) =>
                        `radial-gradient(circle, ${alpha(theme.palette.info.main, 0.18)} 0%, ${alpha(theme.palette.info.main, 0)} 70%)`,
                    transform: "scale(0.8)",
                    opacity: 0,
                    transition: "transform 340ms ease, opacity 340ms ease",
                    zIndex: -1,
                    pointerEvents: "none",
                },
                "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: (theme) => `0 14px 34px ${alpha(theme.palette.text.primary, 0.09)}`,
                    borderColor: (theme) => alpha(theme.palette.text.primary, 0.18),
                },
                "&:hover::after": {
                    transform: "scale(1)",
                    opacity: 1,
                },
            }}
        >
            <Box sx={{ position: "absolute", top: 6, right: 6, zIndex: 2 }}>
                <IconButton
                    size="small"
                    onClick={handleOpenActionMenu}
                    aria-label="more actions"
                    sx={{
                        color: "text.secondary",
                    }}
                >
                    <MoreVertIcon fontSize="small" />
                </IconButton>

                <Menu
                    anchorEl={actionMenuAnchorEl}
                    open={Boolean(actionMenuAnchorEl)}
                    onClose={handleCloseActionMenu}
                    onClick={(event) => event.stopPropagation()}
                >
                    <MenuItem onClick={handleViewProfile} disabled={!getParticipantSlug()}>
                        View profile
                    </MenuItem>
                </Menu>
            </Box>

            {/* Header */}
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Avatar
                    src={participantAvatarUrl || getParticipantAvatar() || ""}
                    sx={{
                        width: 72,
                        height: 72,
                        fontSize: "0.95rem",
                        fontWeight: 600,
                        bgcolor: (participantAvatarUrl || getParticipantAvatar()) ? "transparent" : "var(--mui-palette-secondary-main)",
                        color: (participantAvatarUrl || getParticipantAvatar()) ? "inherit" : "var(--mui-palette-primary-main)",
                    }}
                >
                    {!(participantAvatarUrl || getParticipantAvatar()) ? getInitials(getParticipantName()) : null}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/* Modern Interview Type Badge - "Overline" Style */}
                    <Typography
                        variant="subtitle1"
                        fontWeight={700}
                        sx={{
                            fontSize: { xs: "1.2rem", md: "1.35rem" },
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            lineHeight: 1.2,
                        }}
                    >
                        {getParticipantName()}
                    </Typography>
                    <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{
                            mt: 0.25,
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {getParticipantHeadline()}
                    </Typography>

                    {typeof getParticipantRating() === "number" && (
                        <Stack direction="row" spacing={0.7} alignItems="center" sx={{ mt: 0.6 }}>
                            <Star size={16} strokeWidth={1.9} color="var(--mui-palette-primary-main)" fill="var(--mui-palette-primary-main)" />
                            <Typography variant="body1" sx={{ fontWeight: 700 }}>
                                {Number(getParticipantRating()).toFixed(1)}
                            </Typography>
                            {getParticipantReviewCount() ? (
                                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                                    ({getParticipantReviewCount()} reviews)
                                </Typography>
                            ) : null}
                        </Stack>
                    )}
                </Box>

                <Stack spacing={0.5} alignItems="flex-end" sx={{ ml: 1, pr: 4.5 }}>
                    {(() => {
                        const originalName = room.interviewTypeName || "INTERVIEW SESSION";
                        const displayTypeName = formatTypeName(originalName);
                        const badgeStyle = getInterviewTypeBadgeStyle(originalName);

                        return (
                            <Box
                                sx={{
                                    px: 1,
                                    py: 0.35,
                                    borderRadius: "6px",
                                    background: alpha(badgeStyle.dotColor, 0.08),
                                    color: badgeStyle.textColor,
                                    fontWeight: 800,
                                    fontSize: "0.62rem",
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                    whiteSpace: "nowrap",
                                    border: "1px solid",
                                    borderColor: alpha(badgeStyle.dotColor, 0.15),
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 0.8,
                                    position: "relative",
                                    transition: "all 200ms ease",
                                    "&:hover": {
                                        background: alpha(badgeStyle.dotColor, 0.12),
                                        borderColor: alpha(badgeStyle.dotColor, 0.25),
                                        transform: "translateY(-1px)",
                                    },
                                }}
                            >
                                <Box
                                    component="span"
                                    sx={{
                                        width: 5,
                                        height: 5,
                                        borderRadius: "50%",
                                        bgcolor: badgeStyle.dotColor,
                                        boxShadow: `0 0 8px ${badgeStyle.dotColor}`,
                                        flexShrink: 0,
                                        animation: "pulse-dot 2s infinite ease-in-out",
                                        "@keyframes pulse-dot": {
                                            "0%": { opacity: 1, transform: "scale(1)" },
                                            "50%": { opacity: 0.5, transform: "scale(0.85)" },
                                            "100%": { opacity: 1, transform: "scale(1)" },
                                        },
                                    }}
                                />
                                {displayTypeName}
                            </Box>
                        );
                    })()}
                </Stack>
            </Stack>

            <Divider sx={{ my: 1, borderColor: "var(--mui-palette-divider)" }} />

            {/* Session Type + Join State */}
            <Stack spacing={1} sx={{ mb: 1.5, height: 86, width: '100%', minHeight: 86 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography
                        variant="body2"
                        sx={{
                            textTransform: "uppercase",
                            letterSpacing: 1.2,
                            fontWeight: 800,
                            fontSize: "0.75rem",
                            color: "var(--mui-palette-text-secondary)",
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {hasMultipleRounds ? "Interview Progress" : formatTypeName(room.interviewTypeName || "Interview Session")}
                    </Typography>
                    <Box sx={{ height: 24, display: 'flex', alignItems: 'center' }}>
                        {hasMultipleRounds ? (
                            <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--mui-palette-text-secondary)" }}>
                                Round {room.currentRound || 1} of {room.rounds.length}
                            </Typography>
                        ) : (
                            getStatusChip()
                        )}
                    </Box>
                </Stack>
                {hasMultipleRounds ? (
                    <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{
                            width: "100%",
                        }}
                    >
                        {room.rounds.map((round, index) => {
                            const isEntirelyCompleted = room.status === INTERVIEW_ROOM_STATUS.COMPLETED;
                            const isCompleted = isEntirelyCompleted || index + 1 < (room.currentRound || 1) || round.status === 'COMPLETED';
                            const isCurrent = !isEntirelyCompleted && index + 1 === (room.currentRound || 1);
                            const isUpcoming = !isCurrent && !isCompleted;
                            const roundDisplayName = formatTypeName(round.interviewTypeName || round.name || `Round ${index + 1}`);

                            return (
                                <Box key={index} sx={{ flex: 1, minWidth: 0 }}>
                                    <Tooltip
                                        title={
                                            <Box sx={{ p: 0.5 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75, color: '#1E293B' }}>{roundDisplayName}</Typography>
                                                <Stack spacing={0.5}>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Calendar size={14} color="#4F46E5" strokeWidth={2} />
                                                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569' }}>
                                                            {getDisplayDate(round.scheduledTime)}
                                                        </Typography>
                                                    </Stack>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Clock size={14} color="#4F46E5" strokeWidth={2} />
                                                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569' }}>
                                                            {getDisplayTime(round.scheduledTime)}
                                                        </Typography>
                                                    </Stack>
                                                </Stack>
                                            </Box>
                                        }
                                        arrow
                                        placement="top"
                                        slotProps={{
                                            tooltip: {
                                                sx: {
                                                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                                                    backdropFilter: 'blur(8px)',
                                                    color: 'text.primary',
                                                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                                                    border: '1px solid rgba(0, 0, 0, 0.04)',
                                                    borderRadius: '12px',
                                                    p: 1.25,
                                                    '& .MuiTooltip-arrow': {
                                                        color: 'rgba(255, 255, 255, 0.95)',
                                                    }
                                                }
                                            }
                                        }}
                                    >
                                        <Box sx={{ width: '100%', cursor: 'pointer', transition: 'opacity 0.2s', '&:hover': { opacity: 0.85 } }}>
                                            {/* Progress Bar Segment */}
                                            <Box
                                                sx={{
                                                    height: 8,
                                                    borderRadius: index === 0
                                                        ? "999px 0 0 999px"
                                                        : (index === room.rounds.length - 1 ? "0 999px 999px 0" : "0"),
                                                    bgcolor: room.status === INTERVIEW_ROOM_STATUS.CANCELLED
                                                        ? "error.main"
                                                        : isCompleted
                                                            ? "success.main"
                                                            : isCurrent
                                                                ? "secondary.main"
                                                                : "action.disabledBackground",
                                                    mb: 1.25,
                                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    position: 'relative',
                                                    ...(isCurrent && room.status !== INTERVIEW_ROOM_STATUS.CANCELLED && {
                                                        boxShadow: (theme) => `0 0 10px ${alpha(theme.palette.secondary.main, 0.5)}`,
                                                        animation: 'pulse-lime 2s infinite ease-in-out',
                                                        '@keyframes pulse-lime': {
                                                            '0%': { opacity: 1 },
                                                            '50%': { opacity: 0.75 },
                                                            '100%': { opacity: 1 },
                                                        }
                                                    })
                                                }}
                                            />

                                            {/* Icon & Label */}
                                            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ px: 0.2, overflow: 'hidden' }}>
                                                {room.status === INTERVIEW_ROOM_STATUS.CANCELLED ? (
                                                    <XCircle
                                                        size={14}
                                                        color="var(--mui-palette-error-main)"
                                                        strokeWidth={2.5}
                                                        style={{ flexShrink: 0 }}
                                                    />
                                                ) : isCompleted && (
                                                    <CheckCircle2
                                                        size={14}
                                                        color="var(--mui-palette-success-main)"
                                                        fill={isEntirelyCompleted ? "var(--mui-palette-success-main)" : "none"}
                                                        strokeWidth={2.5}
                                                        style={{ flexShrink: 0 }}
                                                    />
                                                )}
                                                {isCurrent && room.status !== INTERVIEW_ROOM_STATUS.CANCELLED && (
                                                    <CircleDot
                                                        size={14}
                                                        color="var(--mui-palette-secondary-dark)"
                                                        strokeWidth={3}
                                                        style={{ flexShrink: 0 }}
                                                    />
                                                )}
                                                {isUpcoming && (
                                                    <Circle
                                                        size={14}
                                                        color="var(--mui-palette-text-disabled)"
                                                        strokeWidth={2}
                                                        style={{ flexShrink: 0 }}
                                                    />
                                                )}

                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        fontSize: '0.7rem',
                                                        fontWeight: isCurrent || isCompleted || room.status === INTERVIEW_ROOM_STATUS.CANCELLED ? 750 : 600,
                                                        color: room.status === INTERVIEW_ROOM_STATUS.CANCELLED ? "error.dark" : (isCompleted ? "success.dark" : (isUpcoming ? "text.disabled" : "text.primary")),
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        letterSpacing: 0.1,
                                                        minWidth: 0
                                                    }}
                                                >
                                                    {roundDisplayName}
                                                </Typography>
                                            </Stack>
                                        </Box>
                                    </Tooltip>
                                </Box>
                            );
                        })}
                    </Stack>
                ) : (
                    <Stack spacing={1.25} sx={{ width: "100%" }}>
                        <Stack direction="row" spacing={0} alignItems="center" sx={{ width: "100%" }}>
                            <Box
                                sx={{
                                    flex: 1,
                                    height: 8,
                                    borderRadius: "999px",
                                    bgcolor: room.status === INTERVIEW_ROOM_STATUS.CANCELLED
                                        ? "error.main"
                                        : room.status === INTERVIEW_ROOM_STATUS.COMPLETED
                                            ? "success.main"
                                            : "secondary.main",
                                    transition: 'all 0.3s ease',
                                    ...(room.status === INTERVIEW_ROOM_STATUS.ON_GOING && {
                                        animation: 'pulse-lime 2s infinite ease-in-out',
                                        boxShadow: (theme) => `0 0 10px ${alpha(theme.palette.secondary.main, 0.4)}`,
                                    })
                                }}
                            />
                        </Stack>
                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ px: 0.2 }}>
                            {room.status === INTERVIEW_ROOM_STATUS.CANCELLED && (
                                <XCircle
                                    size={14}
                                    color="var(--mui-palette-error-main)"
                                    fill="none"
                                    strokeWidth={2.5}
                                />
                            )}
                            {room.status === INTERVIEW_ROOM_STATUS.COMPLETED && (
                                <CheckCircle2
                                    size={14}
                                    color="var(--mui-palette-success-main)"
                                    fill="var(--mui-palette-success-main)"
                                    strokeWidth={2.5}
                                />
                            )}
                            {room.status === INTERVIEW_ROOM_STATUS.ON_GOING && (
                                <CircleDot
                                    size={14}
                                    color="var(--mui-palette-secondary-dark)"
                                    strokeWidth={3}
                                />
                            )}
                            {room.status === INTERVIEW_ROOM_STATUS.SCHEDULED && (
                                <Circle
                                    size={14}
                                    color="var(--mui-palette-text-disabled)"
                                    strokeWidth={2}
                                />
                            )}
                            <Typography
                                variant="caption"
                                sx={{
                                    fontSize: '0.7rem',
                                    fontWeight: 750,
                                    color: room.status === INTERVIEW_ROOM_STATUS.CANCELLED ? "error.dark" : (room.status === INTERVIEW_ROOM_STATUS.COMPLETED ? "success.dark" : "text.primary"),
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    letterSpacing: 0.1,
                                }}
                            >
                                {formatTypeName(room.interviewTypeName || room.problemShortName || "Interview Session")}
                            </Typography>
                        </Stack>
                    </Stack>
                )}
            </Stack>

            {/* Date-Time Panel */}
            <Box sx={{ minHeight: 22, display: "flex", alignItems: "center", mb: 0.5 }}>
                <Typography
                    variant="caption"
                    sx={{
                        color: '#475569',
                        fontWeight: 800,
                        fontSize: '0.68rem',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        opacity: 0.8
                    }}
                >
                    <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'currentColor' }} />
                    {hasMultipleRounds ? "Time shown for upcoming session" : "One-time interview session"}
                </Typography>
            </Box>
            <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ xs: "flex-start", sm: "stretch" }}
                spacing={0}
                sx={{
                    p: 1.25,
                    borderRadius: "12px",
                    bgcolor: "var(--mui-palette-action-hover)",
                    mb: 2.25,
                }}
            >
                <Stack direction="row" spacing={0.85} alignItems="center" sx={{ flex: 1, minHeight: 38 }}>
                    <Calendar size={18} strokeWidth={1.8} color="var(--mui-palette-text-secondary)" />
                    <Typography variant="subtitle1" sx={{ lineHeight: 1.2, fontWeight: 700 }}>
                        {getDisplayDate(room.scheduledTime)}
                    </Typography>
                </Stack>

                <Divider
                    orientation="vertical"
                    flexItem
                    sx={{
                        mx: 1.5,
                        display: { xs: "none", sm: "block" },
                        borderColor: "var(--mui-palette-divider)",
                    }}
                />

                <Divider sx={{ my: 1.25, width: "100%", display: { xs: "block", sm: "none" } }} />

                <Stack direction="row" spacing={0.85} alignItems="center" sx={{ flex: 1, minHeight: 38 }}>
                    <Clock size={18} strokeWidth={1.8} color="var(--mui-palette-text-secondary)" />
                    <Typography variant="subtitle1" sx={{ lineHeight: 1.2, fontWeight: 700 }}>
                        {getDisplayTime(room.scheduledTime)}
                    </Typography>
                </Stack>
            </Stack>

            {/* Footer */}
            <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent={{ xs: "flex-start", sm: "flex-start" }}
                alignItems={{ xs: "stretch", sm: "center" }}
                spacing={1}
                sx={{ width: "100%", mt: "auto", pt: 1 }}
            >
                {getActionButton()}
            </Stack>
        </BaseCard>
    );
}

export default InterviewCard;
