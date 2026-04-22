import { Box, Typography, Avatar, Stack, Tooltip } from "@mui/material";
import { MessageSquare } from "lucide-react";
import { ROLES } from "../../../../../common/constants/common";
import { INTERVIEW_ROOM_STATUS } from "../../../../../common/constants/status";
import { SecondaryButton } from "../../../../../common/components/buttons";

function RecentInterviewItem({ room, user, onClick }) {

    const getParticipantName = () => {
        if (user?.role === ROLES.CANDIDATE) return room.coachName || "Coach";
        if (user?.role === ROLES.INTERVIEWER) return room.candidateName || "Candidate";
        return "Participant";
    };

    const getParticipantAvatar = () => {
        if (user?.role === ROLES.CANDIDATE) {
            return room.coachAvatar || room.coachProfilePicture || room.coach?.profilePicture || room.coach?.avatar || room.coach?.avatarUrl || room.coach?.imageUrl || room.interviewer?.profilePicture || room.interviewer?.avatar || room.interviewer?.avatarUrl;
        }
        if (user?.role === ROLES.INTERVIEWER) {
            return room.candidateAvatar || room.candidateProfilePicture || room.candidate?.profilePicture || room.candidate?.avatar || room.candidate?.avatarUrl || room.candidate?.imageUrl;
        }
        return undefined;
    };

    const getInitials = (name) => {
        if (!name) return "?";
        return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    };

    const getDisplayDate = (dateTime) => {
        const date = new Date(dateTime);
        if (Number.isNaN(date.getTime())) return "";
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const getTopic = () => {
        return room.problemShortName || room.interviewTypeName || "Interview Session";
    };

    const isCompleted = room.status === INTERVIEW_ROOM_STATUS.COMPLETED;
    const isCancelled = room.status === INTERVIEW_ROOM_STATUS.CANCELLED;

    const statusColor = isCompleted ? "success.main" : isCancelled ? "error.main" : "text.secondary";
    const statusText = isCompleted ? "Completed" : isCancelled ? "Cancelled" : "Past Session";

    const name = getParticipantName();
    const avatar = getParticipantAvatar();

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: { xs: "flex-start", md: "center" },
                justifyContent: "space-between",
                p: { xs: 2.5, md: 2 },
                mb: 1.5,
                borderRadius: "16px",
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                transition: "box-shadow 0.2s ease, transform 0.2s ease",
                gap: { xs: 2, md: 0 },
                "&:hover": {
                    boxShadow: "0px 6px 16px rgba(0,0,0,0.06)",
                    transform: "translateY(-1px)",
                },
            }}
        >
            <Stack direction="row" spacing={2.5} alignItems="center" sx={{ width: { xs: "100%", md: "25%" } }}>
                <Avatar
                    src={avatar || ""}
                    sx={{
                        width: 44,
                        height: 44,
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        bgcolor: avatar ? "transparent" : "secondary.main",
                        color: avatar ? "inherit" : "primary.main",
                    }}
                >
                    {!avatar ? getInitials(name) : null}
                </Avatar>
                <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: "0.95rem" }}>
                    {name}
                </Typography>
            </Stack>

            <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ width: { xs: "100%", md: "25%" } }}>
                {getTopic()}
            </Typography>

            <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ width: { xs: "100%", md: "20%" } }}>
                {getDisplayDate(room.scheduledTime)}
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ width: { xs: "100%", md: "15%" } }}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: statusColor }} />
                <Typography variant="body2" fontWeight={700} sx={{ color: statusColor }}>
                    {statusText}
                </Typography>
            </Stack>

            <Box sx={{ width: { xs: "100%", md: "15%" }, display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" } }}>
                {isCompleted && (
                    <Tooltip title="View Feedback" arrow>
                        <SecondaryButton
                            size="sm"
                            startIcon={<MessageSquare size={16} />}
                            sx={{
                                color: "primary.main",
                                borderColor: "rgba(15, 23, 42, 0.12)",
                                borderRadius: "10px",
                                textTransform: "none",
                                fontWeight: 700,
                                px: 1.5,
                                py: 0.6,
                                fontSize: "0.85rem",
                                whiteSpace: "nowrap",
                                "&:hover": {
                                    bgcolor: "primary.light",
                                    color: "primary.contrastText",
                                    borderColor: "primary.main",
                                },
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onClick) onClick(room);
                            }}
                        >
                            Feedback
                        </SecondaryButton>
                    </Tooltip>
                )}
            </Box>
        </Box>
    );
}

export default RecentInterviewItem;
