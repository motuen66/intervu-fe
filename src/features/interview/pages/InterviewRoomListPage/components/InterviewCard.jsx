import {
    Box,
    Typography,
    Avatar,
    Stack,
    Button,
} from "@mui/material";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CodeIcon from "@mui/icons-material/Code";
import { formattedDateTime } from "../../../../../common/utils/dateFormatter";
import { INTERVIEW_ROOM_STATUS } from "../../../../../common/constants/status";
import { ROLES } from "../../../../../common/constants/common";
import { useNavigate } from "react-router-dom";
import StatusChip from "../../../../../common/components/StatusChip";
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
                        <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRequestReschedule?.(room);
                            }}
                            sx={{
                                fontWeight: 600,
                                fontSize: "0.8rem",
                                textTransform: "none",
                                borderRadius: 1.5,
                                px: 2,
                                "&:hover": {
                                    bgcolor: "primary.main",
                                    color: "#fff",
                                    borderColor: "primary.main",
                                },
                            }}
                        >
                            Reschedule
                        </Button>
                    ) : (
                        <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            disabled
                            sx={{
                                fontWeight: 600,
                                fontSize: "0.8rem",
                                textTransform: "none",
                                borderRadius: 1.5,
                                px: 2,
                            }}
                        >
                            Reschedule
                        </Button>
                    )}

                    {/* Cancel Button - Always visible */}
                    <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            onCancel?.(room);
                        }}
                        sx={{
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            textTransform: "none",
                            borderRadius: 1.5,
                            px: 2,
                            "&:hover": {
                                bgcolor: "error.main",
                                color: "#fff",
                                borderColor: "error.main",
                            },
                        }}
                    >
                        Cancel
                    </Button>
                </Stack>
            );
        }

        // ONGOING: Show Join button (interview is happening NOW)
        if (room.status === INTERVIEW_ROOM_STATUS.ON_GOING) {
            return (
                <Button
                    variant="contained"
                    color="success"
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/interview/room/${room.id}`);
                    }}
                    sx={{
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        borderRadius: 1.5,
                        boxShadow: "none",
                        "&:hover": {
                            boxShadow: 1,
                        }
                    }}
                >
                    Join Now
                </Button>
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
        <Box
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
                bgcolor: "background.paper",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                cursor: onClick ? "pointer" : "default",
                transition: "all 0.2s ease-in-out",
                "&:hover": onClick ? {
                    borderColor: "primary.main",
                    boxShadow: 1,
                } : {},
            }}
        >
            {/* Top Row: Avatar, Title, Status */}
            <Stack direction="row" spacing={2} alignItems="flex-start">
                <Avatar
                    sx={{
                        bgcolor: "primary.main",
                        width: 44,
                        height: 44,
                        fontSize: "1rem",
                        fontWeight: 600,
                    }}
                >
                    {getInitials(getParticipantName())}
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
                        <CalendarTodayOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                        <Typography variant="body2" color="text.secondary">
                            {formattedDateTime(room.scheduledTime)}
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                        <AccessTimeOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                        <Typography variant="body2" color="text.secondary">
                            {room.durationMinutes || 60} min
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                        <CodeIcon sx={{ fontSize: 16, color: "text.secondary" }} />
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
        </Box>
    );
}

export default InterviewCard;
