import {
    Box,
    Typography,
    Avatar,
    Stack,
    Divider,
    IconButton,
    Menu,
    MenuItem,
} from "@mui/material";
import { Calendar, Clock, Star, Video, CheckCircle2, CircleDot, Circle } from "lucide-react";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { formattedDateTime } from "../../../../../common/utils/dateFormatter";
import { INTERVIEW_ROOM_STATUS } from "../../../../../common/constants/status";
import { ROLES } from "../../../../../common/constants/common";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import StatusChip from "../../../../../common/components/StatusChip";
import BaseCard from "../../../../../common/components/cards/BaseCard";
import { SecondaryButton, SuccessButton, DangerButton } from "../../../../../common/components/buttons";
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
    showActions = true,
    hasPendingReschedule = false
}) {
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
    const isRescheduled = room.rescheduleAttemptCount >= 1;
    const canReschedule = !isRescheduled && !hasPendingReschedule;

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
            return room.coachName || "Coach";
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

    const getActionButton = () => {
        if (!showActions) return null;

        // SCHEDULED: Show Reschedule + Cancel buttons (future interviews)
        if (room.status === INTERVIEW_ROOM_STATUS.SCHEDULED) {
            return (
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: "100%" }}>
                    {/* Cancel Button */}
                    <DangerButton
                        onClick={(e) => {
                            e.stopPropagation();
                            onCancel?.(room);
                        }}
                    >
                        Cancel
                    </DangerButton>

                    {/* Reschedule Button */}
                    {user?.role === ROLES.CANDIDATE && (
                        canReschedule ? (
                            <SecondaryButton
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRequestReschedule?.(room);
                                }}
                            >
                                Reschedule
                            </SecondaryButton>
                        ) : (
                            <SecondaryButton disabled>
                                Reschedule
                            </SecondaryButton>
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
                            navigate(`/interview/precheck/${room.id}`);
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

    return (
        <BaseCard
            onClick={() => {
                // Only allow navigation for SCHEDULED interviews
                // ONGOING: Only Join button should work
                // COMPLETED/CANCELLED/NO_SHOW: Should not navigate (past interviews)
                if (room.status === INTERVIEW_ROOM_STATUS.SCHEDULED) {
                    onClick?.(room);
                }
            }}
            sx={{
                p: { xs: 1, md: 1.25 },
                borderRadius: "18px",
                border: "1px solid var(--mui-palette-divider)",
                minHeight: 260,
                height: "100%",
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
                    <Typography
                        variant="subtitle1"
                        fontWeight={700}
                        sx={{
                            fontSize: { xs: "1.2rem", md: "1.35rem" },
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {getParticipantName()}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 0.15, fontWeight: 500 }}>
                        {getParticipantHeadline()}
                    </Typography>

                    {typeof getParticipantRating() === "number" && (
                        <Stack direction="row" spacing={0.7} alignItems="center" sx={{ mt: 0.45 }}>
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
                <Stack spacing={0.75} alignItems="flex-end" sx={{ minWidth: 0, pr: 4.5 }}>
                    <Box
                        sx={{
                            px: 1.5,
                            py: 0.5,
                            borderRadius: '16px',
                            bgcolor: 'secondary.main',
                            color: 'secondary.contrastText',
                            fontWeight: 800,
                            fontSize: '0.65rem',
                            letterSpacing: 0.5,
                            textTransform: 'uppercase',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {room.interviewTypeName || "INTERVIEW SESSION"}
                    </Box>
                </Stack>
            </Stack>

            <Divider sx={{ my: 1, borderColor: "var(--mui-palette-divider)" }} />

            {/* Session Type + Join State */}
            <Stack spacing={1.5} sx={{ mb: 1.75 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography
                        variant="body2"
                        sx={{
                            textTransform: "uppercase",
                            letterSpacing: 1.2,
                            fontWeight: 800,
                            fontSize: "0.75rem",
                            color: "var(--mui-palette-text-secondary)",
                        }}
                    >
                        {room.rounds && room.rounds.length > 1 ? "Interview Progress" : "Individual Session"}
                    </Typography>
                    {room.rounds && room.rounds.length > 1 && (
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--mui-palette-text-secondary)" }}>
                                Round {room.currentRound || 1} of {room.rounds.length}
                            </Typography>
                        </Stack>
                    )}
                </Stack>
                {room.rounds && room.rounds.length > 1 ? (
                        <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
                            {room.rounds.map((round, index) => {
                                const isCurrent = index + 1 === (room.currentRound || 1);
                                const isCompleted = index + 1 < (room.currentRound || 1) || round.status === 'COMPLETED';
                                const isUpcoming = !isCurrent && !isCompleted;
                                
                                return (
                                    <Box key={index} sx={{ flex: 1 }}>
                                        {/* Progress Bar Segment */}
                                        <Box
                                            sx={{
                                                height: 6,
                                                borderRadius: "999px",
                                                bgcolor: isCompleted || isCurrent ? "secondary.main" : "action.disabledBackground",
                                                mb: 1
                                            }}
                                        />
                                        
                                        {/* Icon & Label */}
                                        <Stack direction="row" spacing={0.75} alignItems="center">
                                            {isCompleted && (
                                                <CheckCircle2 size={16} color="var(--mui-palette-success-main)" fill="var(--mui-palette-success-main)" strokeWidth={1.5} style={{ flexShrink: 0, color: "white" }} />
                                            )}
                                            {isCurrent && (
                                                <CircleDot size={16} color="var(--mui-palette-secondary-dark)" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                                            )}
                                            {isUpcoming && (
                                                <Circle size={16} fill="var(--mui-palette-action-disabledBackground)" color="var(--mui-palette-action-disabledBackground)" strokeWidth={0} style={{ flexShrink: 0 }} />
                                            )}
                                            
                                            <Typography 
                                                variant="caption" 
                                                sx={{ 
                                                    fontSize: '0.75rem', 
                                                    fontWeight: isCurrent || isCompleted ? 700 : 600, 
                                                    color: isUpcoming ? "text.disabled" : "text.primary", 
                                                    whiteSpace: 'nowrap', 
                                                    overflow: 'hidden', 
                                                    textOverflow: 'ellipsis' 
                                                }}
                                            >
                                                {round.interviewTypeName || round.name || `Round ${index + 1}`}
                                            </Typography>
                                        </Stack>
                                    </Box>
                                );
                            })}
                        </Stack>
                ) : (
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                            sx={{
                                flex: 1,
                                height: 6,
                                borderRadius: "999px",
                                bgcolor: "secondary.main",
                            }}
                        />
                        {getStatusChip()}
                    </Stack>
                )}
            </Stack>

            {/* Date-Time Panel */}
            <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ xs: "flex-start", sm: "stretch" }}
                spacing={0}
                sx={{
                    p: 1.5,
                    borderRadius: "12px",
                    bgcolor: "var(--mui-palette-action-hover)",
                    mb: 3,
                }}
            >
                <Stack direction="row" spacing={0.85} alignItems="center" sx={{ flex: 1, minHeight: 38 }}>
                    <Calendar size={18} strokeWidth={1.8} color="var(--mui-palette-text-secondary)" />
                    <Box>
                        <Typography
                            variant="caption"
                            sx={{
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                letterSpacing: 0.9,
                                textTransform: "uppercase",
                                color: "var(--mui-palette-text-secondary)",
                            }}
                        >
                            Date
                        </Typography>
                        <Typography variant="subtitle1" sx={{ lineHeight: 1.2, fontWeight: 700 }}>
                            {getDisplayDate(room.scheduledTime)}
                        </Typography>
                    </Box>
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
                    <Box>
                        <Typography
                            variant="caption"
                            sx={{
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                letterSpacing: 0.9,
                                textTransform: "uppercase",
                                color: "var(--mui-palette-text-secondary)",
                            }}
                        >
                            Time
                        </Typography>
                        <Typography variant="subtitle1" sx={{ lineHeight: 1.2, fontWeight: 700 }}>
                            {getDisplayTime(room.scheduledTime)}
                        </Typography>
                    </Box>
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
