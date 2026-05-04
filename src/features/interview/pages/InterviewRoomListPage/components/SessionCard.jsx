import { useEffect, useState } from "react";
import { Box, Typography, Avatar, Stack, Tooltip, IconButton, Collapse, Divider, Button } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    Calendar,
    Clock,
    Code,
    Video,
    ChevronDown,
    ChevronUp,
    BriefcaseBusiness,
    FileText,
    CircleCheck,
    Users,
    ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import BaseCard from "../../../../../common/components/cards/BaseCard";
import StatusChip from "../../../../../common/components/StatusChip";
import { PrimaryButton, SecondaryButton, SuccessButton, DangerButton } from "../../../../../common/components/buttons";
import { CvDialog } from "../../../../profiles/components/CvDialog";
import { INTERVIEW_ROOM_STATUS } from "../../../../../common/constants/status";
import { ROLES } from "../../../../../common/constants/common";
import { getInterviewRoomStatusConfig } from "../../../../../common/constants/statusConfig";
import { callApi } from "../../../../../common/utils/apiConnector";
import { METHOD } from "../../../../../common/constants/api";
import PreparedQuestionsModal from "../../../components/preparedQuestions/PreparedQuestionsModal";

/**
 * @typedef {Object} SessionCardProps
 * @property {Object} room                         Interview room. If room.rounds.length > 1, rendered as multi-round.
 * @property {Object} user                         Current user ({ role, id }) — drives participant resolution.
 * @property {(room) => void} [onClick]            Booking/details — only wired to the explicit external-link icon when provided.
 * @property {(target) => void} [onJoin]           Receives room (single) or round (multi).
 * @property {(target) => void} [onCancel]
 * @property {(target) => void} [onReschedule]    Alias for onRequestReschedule.
 * @property {(target) => void} [onRequestReschedule]
 * @property {boolean} [showActions=true]
 * @property {boolean} [hasPendingReschedule=false]
 */

const formatDate = (dt) => {
    const d = new Date(dt);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
};

const formatTime = (dt) => {
    const d = new Date(dt);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
};

const formatStartingIn = (dt, nowMs) => {
    const target = new Date(dt);
    if (Number.isNaN(target.getTime())) return "";

    const diffMs = target.getTime() - nowMs;
    if (diffMs <= 0) return "now";

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return "<1m";
};

const computeTotalDurationMinutes = (rounds) => {
    if (!Array.isArray(rounds) || rounds.length === 0) return 0;
    return rounds.reduce((sum, r) => sum + (Number(r.durationMinutes ?? r.duration ?? 0) || 0), 0);
};

function ActionButtonGroup({
    target,
    status,
    canReschedule,
    hasPendingReschedule,
    isRescheduled,
    role,
    onJoin,
    onCancel,
    onReschedule,
    compact = false,
    hideJoin = false,
}) {
    const navigate = useNavigate();
    const stop = (fn) => (e) => {
        e.stopPropagation();
        fn?.(target);
    };

    if (status === INTERVIEW_ROOM_STATUS.ON_GOING) {
        return (
            <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                justifyContent="flex-end"
                sx={{ width: { xs: "100%", sm: "auto" } }}
            >
                <SuccessButton
                    size={compact ? "sm" : "md"}
                    startIcon={<Video size={16} strokeWidth={2} />}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onJoin) onJoin(target);
                        else navigate(`/interview/room/${target.id}`);
                    }}
                >
                    Join
                </SuccessButton>
            </Stack>
        );
    }

    if (status === INTERVIEW_ROOM_STATUS.COMPLETED) {
        return null;
    }

    if (status === INTERVIEW_ROOM_STATUS.CANCELLED) {
        return (
            <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                justifyContent="flex-end"
                sx={{ width: { xs: "100%", sm: "auto" } }}
            >
                <StatusChip label="Cancelled" color="error" />
            </Stack>
        );
    }

    const now = new Date();
    const scheduledTime = new Date(target.scheduledTime);
    const hoursUntil = (scheduledTime - now) / (1000 * 60 * 60);
    const isPast = hoursUntil <= 0;
    const canCancel = target.canCancel ?? !isPast;

    const getRescheduleDisabledReason = () => {
        if (isPast) return "Cannot reschedule because the interview time has passed.";
        if (hasPendingReschedule) return "A pending reschedule request already exists.";
        if (isRescheduled) return "This interview has already been rescheduled once.";
        if (!canReschedule) return "This interview cannot be rescheduled.";
        return "";
    };

    const rescheduleDisabledReason = getRescheduleDisabledReason();
    const disableReschedule = Boolean(rescheduleDisabledReason) || !canReschedule;
    const isCandidate = role === ROLES.CANDIDATE;

    return (
        <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            justifyContent="flex-end"
            sx={{ width: { xs: "100%", sm: "auto" } }}
        >
            {isCandidate && canCancel && (
                <DangerButton size={compact ? "sm" : "md"} onClick={stop(onCancel)}>
                    Cancel
                </DangerButton>
            )}
            {isCandidate && (
                <Tooltip title={rescheduleDisabledReason} arrow disableHoverListener={!disableReschedule}>
                    <span style={{ display: "inline-flex" }}>
                        <SecondaryButton
                            size={compact ? "sm" : "md"}
                            disabled={disableReschedule}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!disableReschedule) onReschedule?.(target);
                            }}
                        >
                            Reschedule
                        </SecondaryButton>
                    </span>
                </Tooltip>
            )}
        </Stack>
    );
}

function SessionSummary({
    room,
    user,
    participantAvatarUrl,
    totalDurationMinutes,
    isRescheduled,
    hasPendingReschedule,
    jdUrl,
    cvUrl,
    nowTs,
    onPreviewDocument,
}) {
    const navigate = useNavigate();
    const roundCount = Array.isArray(room?.rounds) ? room.rounds.length : 0;
    const hasMultipleRounds = roundCount > 1;

    const participantName =
        user?.role === ROLES.CANDIDATE
            ? room.coachName || "AI Coach"
            : user?.role === ROLES.INTERVIEWER
              ? room.candidateName || "Candidate"
              : "Participant";

    const participantInitial = participantName?.charAt(0)?.toUpperCase() || "?";

    const typeLabel =
        room.interviewTypeName ||
        (Array.isArray(room.rounds) && room.rounds.length > 1 ? "FULL PROCESS" : "INTERVIEW SESSION");

    const durationLabel = totalDurationMinutes > 0 ? `(${totalDurationMinutes}m)` : null;
    const startingIn = formatStartingIn(room?.scheduledTime, nowTs);

    const statusConfig = getInterviewRoomStatusConfig(room.status, { isRescheduled, hasPendingReschedule });

    const getParticipantSlug = () => {
        if (user?.role === ROLES.CANDIDATE) {
            return (
                room.coachSlugProfileUrl ||
                room.coachSlug ||
                room.coach?.slugProfileUrl ||
                room.interviewer?.slugProfileUrl ||
                null
            );
        }

        if (user?.role === ROLES.INTERVIEWER) {
            return room.candidateSlugProfileUrl || room.candidateSlug || room.candidate?.slugProfileUrl || null;
        }

        return room.candidateSlugProfileUrl || room.coachSlugProfileUrl || room.slugProfileUrl || null;
    };

    const handleOpenParticipantProfile = (event) => {
        event.stopPropagation();
        const slug = getParticipantSlug();
        if (!slug) return;

        if (user?.role === ROLES.INTERVIEWER) {
            navigate(`/candidate/${slug}`);
            return;
        }

        navigate(`/profile/${slug}`);
    };

    const renderDocPill = (label, url, icon, accent = "primary") => (
        <Box
            component={url ? "button" : "span"}
            type={url ? "button" : undefined}
            onClick={
                url
                    ? (e) => {
                          e.stopPropagation();
                          onPreviewDocument?.(url, label);
                      }
                    : undefined
            }
            sx={(theme) => {
                const tone = theme.palette[accent]?.main || theme.palette.primary.main;
                return {
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 999,
                    border: `1px solid ${alpha(tone, 0.35)}`,
                    backgroundColor: alpha(tone, 0.1),
                    color: tone,
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    lineHeight: 1,
                    cursor: url ? "pointer" : "default",
                    fontFamily: "inherit",
                    "&:hover": url
                        ? {
                              backgroundColor: alpha(tone, 0.16),
                          }
                        : undefined,
                };
            }}
        >
            {icon}
            {label}
        </Box>
    );

    return (
        <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", sm: "center" }}
            sx={{ width: "100%" }}
        >
            <Avatar
                src={participantAvatarUrl || undefined}
                sx={(theme) => ({
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    bgcolor: theme.palette.primary.secondary,
                    color: theme.palette.primary.main,
                    fontWeight: 700,
                })}
                variant="rounded"
            >
                {participantInitial}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography
                        component="button"
                        type="button"
                        onClick={handleOpenParticipantProfile}
                        variant="subtitle1"
                        fontWeight={700}
                        color="text.primary"
                        noWrap
                        sx={{
                            p: 0,
                            border: 0,
                            background: "none",
                            cursor: getParticipantSlug() ? "pointer" : "default",
                            textDecoration: "underline",
                            textDecorationColor: "transparent",
                            textUnderlineOffset: "3px",
                            transition: "text-decoration-color 0.2s ease",
                            "&:hover": {
                                textDecorationColor: "currentColor",
                            },
                        }}
                    >
                        {participantName}
                    </Typography>
                    {!hasMultipleRounds && room?.status !== INTERVIEW_ROOM_STATUS.CANCELLED && startingIn && (
                        <Stack direction="row" spacing={0.75} alignItems="center">
                            <StatusChip
                                icon={<Clock size={12} />}
                                label={
                                    room?.status === INTERVIEW_ROOM_STATUS.ON_GOING
                                        ? "Live now"
                                        : startingIn === "now"
                                          ? "Starting now"
                                          : `Starting in ${startingIn}`
                                }
                                color={room?.status === INTERVIEW_ROOM_STATUS.ON_GOING ? "success" : "warning"}
                            />
                        </Stack>
                    )}
                </Stack>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={{ xs: 0.5, sm: 2 }}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    sx={{ color: "text.secondary" }}
                >
                    {!hasMultipleRounds && (
                        <Stack direction="row" spacing={0.75} alignItems="center">
                            <Calendar size={14} />
                            <Typography variant="caption" fontWeight={600}>
                                {formatDate(room.scheduledTime)}, {formatTime(room.scheduledTime)} {durationLabel || ""}
                            </Typography>
                        </Stack>
                    )}
                    <Stack direction="row" spacing={0.75} alignItems="center">
                        <Code size={14} />
                        <Typography variant="caption" fontWeight={700} sx={{ letterSpacing: 0.3 }}>
                            {roundCount} Round{roundCount > 1 ? "s" : ""}
                        </Typography>
                    </Stack>
                    {hasMultipleRounds && (
                        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                            {renderDocPill("Job Description", jdUrl, <BriefcaseBusiness size={12} />, "info")}
                            {renderDocPill("Resume", cvUrl, <FileText size={12} />, "info")}
                        </Stack>
                    )}
                </Stack>
            </Box>

            {statusConfig && room?.status !== INTERVIEW_ROOM_STATUS.ON_GOING && (
                <StatusChip label={statusConfig.label} color={statusConfig.color} />
            )}
        </Stack>
    );
}

function RoundRow({
    round,
    index,
    user,
    onJoin,
    onCancel,
    onReschedule,
    onPrepareQuestions,
    showActions,
    nowTs,
    isHighlighted = false,
}) {
    const title = `Round ${index + 1}: ${round.interviewTypeName || "Interview"}`;
    const duration = Number(round.durationMinutes ?? 0) || 0;
    const isInterviewer = user?.role === ROLES.INTERVIEWER;
    const canPrepareQuestions =
        isInterviewer
        && typeof onPrepareQuestions === "function"
        && (round?.status === INTERVIEW_ROOM_STATUS.SCHEDULED
            || round?.status === INTERVIEW_ROOM_STATUS.ON_GOING);
    const isQuestionsReady = Boolean(
        round?.isQuestionsReady ??
            round?.questionsReady ??
            round?.hasGeneratedQuestions ??
            (typeof round?.generatedQuestionCount === "number" && round.generatedQuestionCount > 0),
    );
    const canJoin = round?.status === INTERVIEW_ROOM_STATUS.ON_GOING;
    const roundHasPendingReschedule = Boolean(round?.hasPendingReschedule);
    const roundIsRescheduled = (round?.rescheduleAttemptCount ?? 0) >= 1;
    const roundCanReschedule = round?.canReschedule ?? (!roundIsRescheduled && !roundHasPendingReschedule);
    const startingIn = formatStartingIn(round?.scheduledTime, nowTs);

    const interviewerLabel =
        round?.coachName ||
        round?.interviewerName ||
        [round?.coachFirstName, round?.coachLastName].filter(Boolean).join(" ") ||
        "Coach assigned";

    return (
        <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", md: "center" }}
            sx={(theme) => ({
                py: 2.25,
                px: { xs: 1.5, md: 2.5 },
                width: "100%",
                bgcolor: isHighlighted ? alpha(theme.palette.success.main, 0.2) : "transparent",
            })}
        >
            <Stack
                sx={(theme) => ({
                    width: 44,
                    height: 44,
                    borderRadius: 1.5,
                    bgcolor: theme.palette.grey[100],
                    color: theme.palette.text.secondary,
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                })}
            >
                <Users size={20} />
            </Stack>

            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                        {title}
                    </Typography>
                    {isHighlighted && <StatusChip label="Nearest" color="success" />}
                    {round?.status !== INTERVIEW_ROOM_STATUS.CANCELLED && startingIn && (
                        <StatusChip
                            icon={<Clock size={12} />}
                            label={
                                round?.status === INTERVIEW_ROOM_STATUS.ON_GOING
                                    ? "Live now"
                                    : startingIn === "now"
                                      ? "Starting now"
                                      : `Starting in ${startingIn}`
                            }
                            color={round?.status === INTERVIEW_ROOM_STATUS.ON_GOING ? "success" : "warning"}
                        />
                    )}
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ color: "text.secondary", mt: 0.25 }}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <Calendar size={13} />
                        <Typography variant="caption" fontWeight={600}>
                            {formatDate(round.scheduledTime)}, {formatTime(round.scheduledTime)}
                            {duration > 0 ? ` (${duration}m)` : ""}
                        </Typography>
                    </Stack>
                    {/* TODO: Uncomment this block later when coach/interviewer name should be shown again for multi-round rows.
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <Users size={13} />
                        <Typography variant="caption" fontWeight={600}>
                            {interviewerLabel}
                        </Typography>
                    </Stack>
                    */}
                </Stack>
            </Box>

            {showActions && (
                <Stack direction="row" spacing={1.25} sx={{ ml: { md: "auto" }, width: { xs: "100%", md: "auto" } }}>
                    {canPrepareQuestions && (
                        <Button
                            variant="contained"
                            size="small"
                            type="button"
                            onClick={() => onPrepareQuestions(round)}
                            startIcon={isQuestionsReady ? <CircleCheck size={14} /> : undefined}
                            sx={() => ({
                                textTransform: "none",
                                borderRadius: 1.25,
                                minHeight: 36,
                                px: 2,
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                                bgcolor: isQuestionsReady ? "#E7F7EE" : "#ECEFFD",
                                color: isQuestionsReady ? "#2C8D60" : "#3A47D5",
                                boxShadow: "none",
                                border: `1px solid ${isQuestionsReady ? "#C8EAD7" : "#D4D9FA"}`,
                                "&:hover": {
                                    bgcolor: isQuestionsReady ? "#D9F1E5" : "#E2E7FC",
                                    boxShadow: "none",
                                },
                                width: { xs: "100%", md: "auto" },
                            })}
                        >
                            {isQuestionsReady ? "Questions Ready" : "Prepare Questions"}
                        </Button>
                    )}

                    {(canJoin || user?.role === ROLES.CANDIDATE) && (
                        <ActionButtonGroup
                            target={round}
                            status={round.status}
                            canReschedule={roundCanReschedule}
                            hasPendingReschedule={roundHasPendingReschedule}
                            isRescheduled={roundIsRescheduled}
                            role={user?.role}
                            onJoin={onJoin}
                            onCancel={onCancel}
                            onReschedule={onReschedule}
                            compact
                        />
                    )}
                </Stack>
            )}
        </Stack>
    );
}

export default function SessionCard({
    room,
    user,
    onClick,
    onJoin,
    onCancel,
    onReschedule,
    onRequestReschedule,
    onReviewQuestions,
    showActions = true,
    hasPendingReschedule = false,
    isHighlighted = false,
    highlightedRoundId = null,
    highlightedRoundIndex = null,
}) {
    const [expanded, setExpanded] = useState(false);
    const [participantAvatarUrl, setParticipantAvatarUrl] = useState(null);
    const [nowTs, setNowTs] = useState(() => Date.now());
    const [preview, setPreview] = useState({ open: false, url: null, title: "CV View" });
    const [prepareTarget, setPrepareTarget] = useState(null);

    const handleOpenPrepare = (round) => {
        if (!round) return;
        setPrepareTarget(round);
    };
    const handleClosePrepare = () => setPrepareTarget(null);

    const rescheduleHandler = onReschedule ?? onRequestReschedule;
    const hasMultipleRounds = Array.isArray(room?.rounds) && room.rounds.length > 1;
    const hasHighlightedRound = hasMultipleRounds && (highlightedRoundId != null || highlightedRoundIndex != null);

    const participantId = user?.role === ROLES.CANDIDATE ? room?.coachId : room?.candidateId;

    useEffect(() => {
        if (!participantId) return undefined;
        let cancelled = false;
        callApi({ method: METHOD.GET, endpoint: `/userprofile/${participantId}` })
            .then((res) => {
                if (cancelled) return;
                const profile = res?.data;
                const url =
                    profile?.profilePicture || profile?.avatarUrl || profile?.imageUrl || profile?.avatar || null;
                setParticipantAvatarUrl(url);
            })
            .catch(() => {
                /* silently ignore */
            });
        return () => {
            cancelled = true;
        };
    }, [participantId]);

    useEffect(() => {
        const timerId = setInterval(() => setNowTs(Date.now()), 30000);
        return () => clearInterval(timerId);
    }, []);

    useEffect(() => {
        if (isHighlighted && hasHighlightedRound) {
            setExpanded(true);
        }
    }, [isHighlighted, hasHighlightedRound]);

    const isRescheduled = (room?.rescheduleAttemptCount ?? 0) >= 1;
    const multiRoundEligibleCount = hasMultipleRounds
        ? room.rounds.filter(
              (r) => r.status === INTERVIEW_ROOM_STATUS.SCHEDULED && r.canReschedule && !r.hasPendingReschedule,
          ).length
        : 0;
    const canReschedule = hasMultipleRounds
        ? multiRoundEligibleCount > 0
        : (room?.canReschedule ?? (!isRescheduled && !hasPendingReschedule));

    const totalDurationMinutes = hasMultipleRounds
        ? computeTotalDurationMinutes(room.rounds)
        : Number(room?.durationMinutes ?? 0) || 0;

    const jdUrl = room?.jobDescriptionUrl || room?.jdUrl || null;
    const cvUrl = room?.cvUrl || room?.candidateCvUrl || null;
    const bookingDetailId = room?.bookingRequestId || room?.sessionId || null;

    // Prepare-questions affordance for single-round cards (multi-round handled in RoundRow).
    const isInterviewer = user?.role === ROLES.INTERVIEWER;
    const singleRoundCanPrepare =
        !hasMultipleRounds
        && isInterviewer
        && (room?.status === INTERVIEW_ROOM_STATUS.SCHEDULED
            || room?.status === INTERVIEW_ROOM_STATUS.ON_GOING);
    const singleRoundIsQuestionsReady = Boolean(
        room?.isQuestionsReady
            ?? room?.questionsReady
            ?? room?.hasGeneratedQuestions
            ?? (typeof room?.generatedQuestionCount === "number" && room.generatedQuestionCount > 0),
    );

    const bookingIconButtonSx = (theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 99,
        alignSelf: { xs: "flex-end", md: "center" },
        color: "text.secondary",
        "&:hover": { color: "primary.main", borderColor: "primary.main", bgcolor: "action.hover" },
    });

    if (!hasMultipleRounds) {
        return (
            <BaseCard
                sx={(theme) => ({
                    width: "100%",
                    border: isHighlighted ? `2px solid ${theme.palette.success.main}` : undefined,
                    boxShadow: isHighlighted ? `0 0 0 3px ${alpha(theme.palette.success.main, 0.2)}` : undefined,
                    ...(isHighlighted && {
                        "&:hover": {
                            border: `2px solid ${theme.palette.success.main}`,
                            boxShadow: `0 0 0 3px ${alpha(theme.palette.success.main, 0.2)}`,
                        },
                    }),
                })}
            >
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    alignItems={{ xs: "stretch", md: "center" }}
                    sx={{ p: 2, width: "100%" }}
                >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <SessionSummary
                            room={room}
                            user={user}
                            participantAvatarUrl={participantAvatarUrl}
                            totalDurationMinutes={totalDurationMinutes}
                            isRescheduled={isRescheduled}
                            hasPendingReschedule={hasPendingReschedule}
                            jdUrl={jdUrl}
                            cvUrl={cvUrl}
                            nowTs={nowTs}
                            onPreviewDocument={(url, title) =>
                                setPreview({ open: true, url, title: title || "CV View" })
                            }
                        />
                    </Box>
                    {showActions && (
                        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ width: { xs: "100%", md: "auto" } }}>
                            {bookingDetailId && onClick && (
                                <Tooltip title="Booking details" arrow>
                                    <IconButton
                                        aria-label="Booking details"
                                        size="small"
                                        onClick={() => onClick(room)}
                                        sx={bookingIconButtonSx}
                                    >
                                        <ExternalLink size={16} />
                                    </IconButton>
                                </Tooltip>
                            )}
                            {singleRoundCanPrepare && (
                                <Button
                                    variant="contained"
                                    size="small"
                                    type="button"
                                    onClick={() => handleOpenPrepare(room)}
                                    startIcon={
                                        singleRoundIsQuestionsReady ? <CircleCheck size={14} /> : undefined
                                    }
                                    sx={() => ({
                                        textTransform: "none",
                                        borderRadius: 1.25,
                                        minHeight: 36,
                                        px: 2,
                                        fontWeight: 700,
                                        whiteSpace: "nowrap",
                                        bgcolor: singleRoundIsQuestionsReady ? "#E7F7EE" : "#ECEFFD",
                                        color: singleRoundIsQuestionsReady ? "#2C8D60" : "#3A47D5",
                                        boxShadow: "none",
                                        border: `1px solid ${
                                            singleRoundIsQuestionsReady ? "#C8EAD7" : "#D4D9FA"
                                        }`,
                                        "&:hover": {
                                            bgcolor: singleRoundIsQuestionsReady ? "#D9F1E5" : "#E2E7FC",
                                            boxShadow: "none",
                                        },
                                        width: { xs: "100%", md: "auto" },
                                    })}
                                >
                                    {singleRoundIsQuestionsReady ? "Questions Ready" : "Prepare Questions"}
                                </Button>
                            )}
                            <ActionButtonGroup
                                target={room}
                                status={room.status}
                                canReschedule={canReschedule}
                                hasPendingReschedule={hasPendingReschedule}
                                isRescheduled={isRescheduled}
                                role={user?.role}
                                onJoin={onJoin}
                                onCancel={onCancel}
                                onReschedule={rescheduleHandler}
                            />
                        </Stack>
                    )}
                </Stack>
                <CvDialog
                    open={preview.open}
                    onClose={() => setPreview({ open: false, url: null, title: "CV View" })}
                    url={preview.url}
                    title={preview.title}
                />
                <PreparedQuestionsModal
                    open={Boolean(prepareTarget)}
                    onClose={handleClosePrepare}
                    roomId={prepareTarget?.id ?? null}
                    roomTitle={prepareTarget?.interviewTypeName || room?.title}
                />
            </BaseCard>
        );
    }

    return (
        <BaseCard
            sx={(theme) => ({
                width: "100%",
                border: isHighlighted ? `2px solid ${theme.palette.success.main}` : undefined,
                boxShadow: isHighlighted ? `0 0 0 3px ${alpha(theme.palette.success.main, 0.2)}` : undefined,
                ...(isHighlighted && {
                    "&:hover": {
                        border: `2px solid ${theme.palette.success.main}`,
                        boxShadow: `0 0 0 3px ${alpha(theme.palette.success.main, 0.2)}`,
                    },
                }),
            })}
        >
            <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", md: "center" }}
                sx={{ p: 2.25, width: "100%" }}
            >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <SessionSummary
                        room={room}
                        user={user}
                        participantAvatarUrl={participantAvatarUrl}
                        totalDurationMinutes={totalDurationMinutes}
                        isRescheduled={isRescheduled}
                        hasPendingReschedule={hasPendingReschedule}
                        jdUrl={jdUrl}
                        cvUrl={cvUrl}
                        nowTs={nowTs}
                        onPreviewDocument={(url, title) => setPreview({ open: true, url, title: title || "CV View" })}
                    />
                </Box>

                <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    justifyContent="flex-end"
                    sx={{ width: { xs: "100%", md: "auto" } }}
                >
                    {bookingDetailId && onClick && (
                        <Tooltip title="Booking details" arrow>
                            <IconButton
                                aria-label="Booking details"
                                size="small"
                                onClick={() => onClick(room)}
                                sx={bookingIconButtonSx}
                            >
                                <ExternalLink size={16} />
                            </IconButton>
                        </Tooltip>
                    )}
                    <Tooltip title={expanded ? "Hide rounds" : "Show rounds"} arrow>
                        <IconButton
                            aria-label={expanded ? "Collapse rounds" : "Expand rounds"}
                            onClick={() => setExpanded((v) => !v)}
                            sx={(theme) => ({
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 99,
                                alignSelf: { xs: "flex-end", md: "center" },
                            })}
                            size="small"
                        >
                            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Stack>

            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <Divider />
                <Box sx={{ p: { xs: 1.5, md: 2 }, bgcolor: "background.default" }}>
                    <Box
                        sx={(theme) => ({
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            bgcolor: "background.paper",
                            overflow: "hidden",
                        })}
                    >
                        {room.rounds.map((round, index) => (
                            <Box
                                key={round.id ?? index}
                                sx={(theme) => ({
                                    borderBottom:
                                        index < room.rounds.length - 1 ? `1px solid ${theme.palette.divider}` : "none",
                                })}
                            >
                                <RoundRow
                                    round={round}
                                    index={index}
                                    user={user}
                                    onJoin={onJoin}
                                    onCancel={onCancel}
                                    onReschedule={rescheduleHandler}
                                    onPrepareQuestions={handleOpenPrepare}
                                    showActions={showActions}
                                    nowTs={nowTs}
                                    isHighlighted={
                                        (highlightedRoundId != null && round?.id === highlightedRoundId) ||
                                        (highlightedRoundId == null &&
                                            highlightedRoundIndex != null &&
                                            index === highlightedRoundIndex)
                                    }
                                />
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Collapse>
            <CvDialog
                open={preview.open}
                onClose={() => setPreview({ open: false, url: null, title: "CV View" })}
                url={preview.url}
                title={preview.title}
            />
            <PreparedQuestionsModal
                open={Boolean(prepareTarget)}
                onClose={handleClosePrepare}
                roomId={prepareTarget?.id ?? null}
                roomTitle={prepareTarget?.interviewTypeName || room?.title}
            />
        </BaseCard>
    );
}
