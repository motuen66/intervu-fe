import React from "react";
import { Box, CardContent, Typography, Stack, CircularProgress, Avatar } from "@mui/material";
import BaseCard from "../../../../common/components/cards/BaseCard";
import StatusChip from "../../../../common/components/StatusChip";
import SectionHeading from "../../../../common/components/SectionHeading";
import { CheckCircle } from "lucide-react";
import { AVAILABILITY_SLOTS_STATUS } from "../../../../common/constants/status";

const UpcomingSessionBlog = ({ availabilities, loading, parseLocalDate, parseLocalTime }) => {
    const focusLabel = (focus) => {
        if (focus === 0) return "General Skills";
        if (focus === 1) return "Job Description";
        return "";
    };

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
                            .map((avail) => (
                                <Box
                                    key={avail.id}
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
                                            src={avail.candidateAvatar || avail.candidate?.avatarUrl || ""}
                                            sx={{
                                                width: 36,
                                                height: 36,
                                                bgcolor:
                                                    avail.status === AVAILABILITY_SLOTS_STATUS.BOOKED
                                                        ? "primary.light"
                                                        : "grey.100",
                                            }}
                                        >
                                            {!avail.candidateName &&
                                            !avail.candidate?.fullName &&
                                            !avail.candidate?.name
                                                ? "N"
                                                : ""}
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
                                                {avail.candidateName ||
                                                    avail.candidate?.fullName ||
                                                    avail.candidate?.name ||
                                                    (avail.status === AVAILABILITY_SLOTS_STATUS.BOOKED ? "Booked" : "")}
                                            </Typography>

                                            <Typography
                                                variant="caption"
                                                sx={{ color: "text.secondary", display: "block", fontWeight: 500 }}
                                                noWrap
                                            >
                                                {focusLabel(avail.focus)}
                                                {avail.typeName || (avail.type && avail.type.name) || avail.typeId
                                                    ? ` • ${avail.typeName || avail.type?.name || `Type ${avail.typeId}`}`
                                                    : ""}
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
                            ))
                    )}
                </Stack>
            </CardContent>
        </BaseCard>
    );
};

export default UpcomingSessionBlog;
