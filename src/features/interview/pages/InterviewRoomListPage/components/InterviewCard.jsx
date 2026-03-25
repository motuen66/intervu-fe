import {
    Box,
    Typography,
    Avatar,
    Stack,
} from "@mui/material";
import { Calendar, Clock, Code } from "lucide-react";
import { formattedDateTime } from "../../../../../common/utils/dateFormatter";
import { INTERVIEW_ROOM_STATUS } from "../../../../../common/constants/status";
import { ROLES } from "../../../../../common/constants/common";
import { useNavigate } from "react-router-dom";
import StatusChip from "../../../../../common/components/StatusChip";
import BaseCard from "../../../../../common/components/cards/BaseCard";
import { PrimaryButton, SecondaryButton, SuccessButton, DangerButton } from "../../../../../common/components/buttons";
import { getInterviewRoomStatusConfig } from "../../../../../common/constants/statusConfig";

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
    // Check if reschedule is available
    const isRescheduled = room.rescheduleAttemptCount >= 1;
    const canReschedule = !isRescheduled && !hasPendingReschedule;

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
            return room.coachAvatar;
        }
        if (user?.role === ROLES.INTERVIEWER) {
            return room.candidateAvatar;
        }
        return undefined;
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
                <Stack direction="row" spacing={1} alignItems="center">
                    {/* Reschedule Button */}
                    {canReschedule ? (
                        <SecondaryButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRequestReschedule?.(room);
                            }}
                            sx={{ fontSize: "0.8rem", px: 2 }}
                        >
                            Reschedule
                        </SecondaryButton>
                    ) : (
                        <SecondaryButton
                            size="small"
                            disabled
                            sx={{ fontSize: "0.8rem", px: 2 }}
                        >
                            Reschedule
                        </SecondaryButton>
                    )}

                    {/* Cancel Button - Always visible */}
                    <DangerButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            onCancel?.(room);
                        }}
                        sx={{ fontSize: "0.8rem", px: 2 }}
                    >
                        Cancel
                    </DangerButton>
                </Stack>
            );
        }

        // ONGOING: Show Join button (interview is happening NOW)
        if (room.status === INTERVIEW_ROOM_STATUS.ON_GOING) {
            return (
                <SuccessButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/interview/precheck/${room.id}`);
                    }}
                    sx={{ fontSize: "0.875rem", boxShadow: "none" }}
                >
                    Join Now
                </SuccessButton>
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
                p: 2.5,
            }}
        >
            {/* Top Row: Avatar, Title, Status */}
            <Stack direction="row" spacing={2} alignItems="flex-start">
                <Avatar
                    src={getParticipantAvatar() || ""}
                    sx={{
                        width: 44,
                        height: 44,
                        fontSize: "1rem",
                        fontWeight: 600,
                        bgcolor: getParticipantAvatar() ? "transparent" : "var(--mui-palette-secondary-main)",
                        color: getParticipantAvatar() ? "inherit" : "var(--mui-palette-primary-main)",
                    }}
                >
                    {!getParticipantAvatar() ? getInitials(getParticipantName()) : null}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {room.problemShortName || room.title || "Interview Session"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Interview with: <strong>{getParticipantName()}</strong>
                    </Typography>
                </Box>
                {getStatusChip()}
            </Stack>

            {/* Bottom Row: Details & Action */}
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mt: 2, minHeight: 40 }}
            >
                <Stack direction="row" spacing={2.5} alignItems="center">
                    <Stack direction="row" spacing={0.75} alignItems="center">
                        <Calendar size={16} strokeWidth={1.5} color="var(--mui-palette-text-secondary)" />
                        <Typography variant="body2" color="text.secondary">
                            {formattedDateTime(room.scheduledTime)}
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                        <Clock size={16} strokeWidth={1.5} color="var(--mui-palette-text-secondary)" />
                        <Typography variant="body2" color="text.secondary">
                            {room.durationMinutes || 60} min
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                        <Code size={16} strokeWidth={1.5} color="var(--mui-palette-text-secondary)" />
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ textTransform: "uppercase", fontSize: "0.75rem" }}
                        >
                            {room.interviewType || room.currentLanguage || "SYSTEM DESIGN"}
                        </Typography>
                    </Stack>
                </Stack>

                {getActionButton()}
            </Stack>
        </BaseCard>
    );
}

export default InterviewCard;
