import React from "react";
import { Box, CardContent, Typography, Stack, CircularProgress, Avatar } from "@mui/material";
import { useNavigate } from "react-router-dom";
import BaseCard from "../../../../common/components/cards/BaseCard";
import SectionHeading from "../../../../common/components/SectionHeading";
import { Clock } from "lucide-react";
import { AVAILABILITY_SLOTS_STATUS } from "../../../../common/constants/status";
import { BE_BASE_URL } from "../../../../common/constants/env";

const BE_ORIGIN = (() => {
    try {
        return new URL(BE_BASE_URL).origin;
    } catch (_) {
        return "";
    }
})();

const pickFirstString = (...values) => {
    const found = values.find((val) => typeof val === "string" && val.trim().length > 0);
    return found ? found.trim() : "";
};

const getCandidateName = (avail) =>
    pickFirstString(
        avail.candidateName,
        avail.candidate?.fullName,
        avail.candidate?.name,
        avail.candidate?.username,
        avail.bookingRequest?.candidateName,
        avail.interviewRoom?.candidateName,
    ) || "Candidate";

const getCandidateAvatar = (avail) =>
    pickFirstString(
        avail.candidateAvatar,
        avail.candidateProfilePicture,
        avail.candidateProfileImage,
        avail.candidate?.avatarUrl,
        avail.candidate?.profilePicture,
        avail.candidate?.profilePictureUrl,
        avail.candidate?.profileImage,
        avail.candidate?.avatar,
        avail.candidate?.imageUrl,
        avail.candidate?.user?.profilePicture,
        avail.candidate?.user?.avatarUrl,
        avail.bookingRequest?.candidateAvatar,
        avail.bookingRequest?.candidateProfilePicture,
        avail.bookingRequest?.candidateProfileImage,
        avail.interviewRoom?.candidateAvatar,
        avail.interviewRoom?.candidateProfilePicture,
        avail.interviewRoom?.candidateProfileImage,
        avail.interviewRoom?.candidate?.avatarUrl,
        avail.interviewRoom?.candidate?.profilePicture,
        avail.interviewRoom?.candidate?.profilePictureUrl,
        avail.interviewRoom?.candidate?.profileImage,
        avail.interviewRoom?.candidate?.user?.profilePicture,
        avail.interviewRoom?.candidate?.user?.avatarUrl,
    );

const normalizeImageUrl = (value) => {
    if (!value || typeof value !== "string") return "";
    const raw = value.trim();
    if (!raw) return "";
    if (/^(https?:)?\/\//i.test(raw) || /^data:/i.test(raw) || /^blob:/i.test(raw)) return raw;
    if (!BE_ORIGIN) return raw;
    return raw.startsWith("/") ? `${BE_ORIGIN}${raw}` : `${BE_ORIGIN}/${raw}`;
};

const getSessionName = (avail) => {
    const sessionName = pickFirstString(
        avail.sessionName,
        avail.serviceName,
        avail.interviewTypeName,
        avail.problemShortName,
        avail.typeName,
        avail.interviewType,
        avail.type?.name,
        avail.bookingRequest?.serviceName,
        avail.bookingRequest?.interviewTypeName,
        avail.interviewRoom?.interviewTypeName,
        avail.interviewRoom?.problemShortName,
        avail.interviewRoom?.title,
    );
    return sessionName || "Interview Session";
};

const getRoomId = (avail) =>
    avail.interviewRoom?.id || avail.interviewRoomId || avail.bookingRequest?.interviewRoomId || null;

const UpcomingSessionBlog = ({ availabilities, loading, parseLocalDate, parseLocalTime }) => {
    const navigate = useNavigate();

    const upcomingSlots = availabilities.filter(
        (a) =>
            (a.isBooked === true || a.status === AVAILABILITY_SLOTS_STATUS.BOOKED) && new Date(a.endTime) >= new Date(),
    );

    const sortedUpcoming = upcomingSlots.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    const visibleSlots = sortedUpcoming.slice(0, 3);
    const remaining = sortedUpcoming.length - visibleSlots.length;

    return (
        <BaseCard
            variant="outlined"
            sx={{
                borderColor: "divider",
                borderRadius: "12px",
                height: "fit-content",
            }}
        >
            <CardContent sx={{ p: 2 }}>
                <Box sx={{ mb: 1.5 }}>
                    <SectionHeading title="Upcoming Sessions" size="sm" disableGutters />
                </Box>

                <Stack spacing={1}>
                    {loading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : visibleSlots.length === 0 ? (
                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", textAlign: "center", py: 3, fontStyle: "italic" }}
                        >
                            No upcoming booked slots
                        </Typography>
                    ) : (
                        <>
                            {visibleSlots.map((avail, index) => {
                                const candidateName = getCandidateName(avail);
                                const candidateAvatar = normalizeImageUrl(getCandidateAvatar(avail));
                                const sessionName = getSessionName(avail);
                                const fallbackAvatarText = candidateName.charAt(0).toUpperCase();
                                const roomId = getRoomId(avail);
                                const target = roomId ? `/interview/room/${roomId}` : "/interview";

                                return (
                                    <Box
                                        key={`${avail.id || "booked"}-${avail.startTime || index}`}
                                        onClick={() => navigate(target)}
                                        sx={{
                                            border: "1px solid",
                                            borderColor: "divider",
                                            borderRadius: "8px",
                                            p: 1.25,
                                            cursor: "pointer",
                                            transition: "all 0.2s ease-in-out",
                                            "&:hover": {
                                                borderColor: "primary.main",
                                                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.1)",
                                            },
                                        }}
                                    >
                                        <Stack direction="row" spacing={1.25} alignItems="center">
                                            <Avatar
                                                src={candidateAvatar}
                                                alt={candidateName}
                                                sx={{
                                                    width: 32,
                                                    height: 32,
                                                    bgcolor: "primary.light",
                                                    fontSize: 14,
                                                }}
                                            >
                                                {fallbackAvatarText}
                                            </Avatar>

                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: "text.primary",
                                                        lineHeight: 1.3,
                                                    }}
                                                    noWrap
                                                >
                                                    {candidateName}
                                                </Typography>

                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: "text.secondary",
                                                        display: "block",
                                                        fontWeight: 500,
                                                        lineHeight: 1.3,
                                                    }}
                                                    noWrap
                                                >
                                                    {sessionName}
                                                </Typography>
                                            </Box>
                                        </Stack>

                                        <Stack
                                            direction="row"
                                            spacing={0.75}
                                            alignItems="center"
                                            sx={{ mt: 0.75, color: "primary.main" }}
                                        >
                                            <Clock size={13} />
                                            <Typography variant="caption" sx={{ fontWeight: 600 }} noWrap>
                                                {parseLocalDate(avail.startTime)}
                                                <Box component="span" sx={{ mx: 0.75, color: "text.disabled" }}>
                                                    •
                                                </Box>
                                                {parseLocalTime(avail.startTime)} - {parseLocalTime(avail.endTime)}
                                            </Typography>
                                        </Stack>
                                    </Box>
                                );
                            })}

                            {remaining > 0 && (
                                <Typography
                                    variant="caption"
                                    onClick={() => navigate("/interview")}
                                    sx={{
                                        color: "primary.main",
                                        fontWeight: 600,
                                        textAlign: "center",
                                        cursor: "pointer",
                                        py: 0.5,
                                        "&:hover": { textDecoration: "underline" },
                                    }}
                                >
                                    + {remaining} more
                                </Typography>
                            )}
                        </>
                    )}
                </Stack>
            </CardContent>
        </BaseCard>
    );
};

export default UpcomingSessionBlog;
