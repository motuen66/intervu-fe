import React from "react";
import { Box, CardContent, Typography, Stack, CircularProgress, Avatar } from "@mui/material";
import BaseCard from "../../../../common/components/cards/BaseCard";
import StatusChip from "../../../../common/components/StatusChip";
import SectionHeading from "../../../../common/components/SectionHeading";
import { CheckCircle } from "lucide-react";
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

const UpcomingSessionBlog = ({ availabilities, loading, parseLocalDate, parseLocalTime }) => {
    const upcomingSlots = availabilities.filter(
        (a) =>
            (a.isBooked === true || a.status === AVAILABILITY_SLOTS_STATUS.BOOKED) && new Date(a.endTime) >= new Date(),
    );

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
                    <SectionHeading title="Upcoming Interview Times" size="sm" disableGutters />
                </Box>

                <Stack spacing={1.5}>
                    {loading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : upcomingSlots.length === 0 ? (
                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", textAlign: "center", py: 3, fontStyle: "italic" }}
                        >
                            No upcoming booked slots
                        </Typography>
                    ) : (
                        upcomingSlots
                            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                            .slice(0, 5)
                            .map((avail, index) => {
                                const candidateName = getCandidateName(avail);
                                const candidateAvatar = normalizeImageUrl(getCandidateAvatar(avail));
                                const sessionName = getSessionName(avail);
                                const fallbackAvatarText = candidateName.charAt(0).toUpperCase();

                                return (
                                    <Box
                                        key={`${avail.id || "booked"}-${avail.startTime || index}`}
                                        sx={{
                                            border: "1px solid",
                                            borderColor: "divider",
                                            borderRadius: "8px",
                                            p: 1.5,
                                            transition: "all 0.2s ease-in-out",
                                            cursor:
                                                avail.status === AVAILABILITY_SLOTS_STATUS.BOOKED ? "default" : "pointer",
                                            "&:hover": {
                                                borderColor: "primary.main",
                                                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.1)",
                                            },
                                        }}
                                    >
                                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                                            <Avatar
                                                src={candidateAvatar}
                                                alt={candidateName}
                                                sx={{
                                                    width: 36,
                                                    height: 36,
                                                    bgcolor:
                                                        avail.status === AVAILABILITY_SLOTS_STATUS.BOOKED
                                                            ? "primary.light"
                                                            : "grey.100",
                                                }}
                                            >
                                                {fallbackAvatarText}
                                            </Avatar>

                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: 600,
                                                        color:
                                                            avail.status === AVAILABILITY_SLOTS_STATUS.BOOKED
                                                                ? "text.primary"
                                                                : "text.secondary",
                                                    }}
                                                    noWrap
                                                >
                                                    {candidateName}
                                                </Typography>

                                                <Typography
                                                    variant="caption"
                                                    sx={{ color: "text.secondary", display: "block", fontWeight: 500 }}
                                                    noWrap
                                                >
                                                    {sessionName}
                                                </Typography>
                                            </Box>

                                            <StatusChip
                                                label={
                                                    avail.status === AVAILABILITY_SLOTS_STATUS.BOOKED
                                                        ? "BOOKED"
                                                        : avail.status === AVAILABILITY_SLOTS_STATUS.RESERVED
                                                          ? "RESERVED"
                                                          : "AVAILABLE"
                                                }
                                                color={
                                                    avail.status === AVAILABILITY_SLOTS_STATUS.BOOKED
                                                        ? "primary"
                                                        : avail.status === AVAILABILITY_SLOTS_STATUS.RESERVED
                                                          ? "warning"
                                                          : "secondary"
                                                }
                                                variant="filled"
                                                icon={<CheckCircle size={14} />}
                                            />
                                        </Stack>

                                        <Typography
                                            variant="caption"
                                            sx={{ color: "text.secondary", display: "block", mb: 0.5, fontWeight: 500 }}
                                        >
                                            {parseLocalDate(avail.startTime)}
                                        </Typography>

                                        <Typography variant="body2" sx={{ color: "primary.main", fontWeight: 600, mb: 1 }}>
                                            {parseLocalTime(avail.startTime)} - {parseLocalTime(avail.endTime)}
                                        </Typography>
                                    </Box>
                                );
                            })
                    )}
                </Stack>
            </CardContent>
        </BaseCard>
    );
};

export default UpcomingSessionBlog;
