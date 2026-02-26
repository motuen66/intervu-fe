import React, { useEffect, useState } from "react";
import { Box, Card, CardContent, Typography, Stack, CircularProgress, Avatar } from "@mui/material";
import { IoCheckmarkCircle } from "react-icons/io5";
import { addMonths } from "date-fns";
import { AVAILABILITY_SLOTS_STATUS, getAvailabilityColors } from "../../../../common/constants/status";
import { getAvailabilitiesByMonth } from "../../services/availabilityApi";

const UpcomingSessionBlog = ({ interviewerId, availabilities = [] }) => {
    const [upcomingSlots, setUpcomingSlots] = useState([]);
    const [loading, setLoading] = useState(false);

    const focusLabel = (focus) => {
        if (focus === 0) return "General Skills";
        if (focus === 1) return "Job Description";
        return "";
    };

    const isPast = (endTime) => new Date(endTime) < new Date();

    const parseLocalDate = (isoString) => {
        const d = new Date(isoString);
        return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
    };

    const parseLocalTime = (isoString) => {
        const d = new Date(isoString);
        return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    };

    useEffect(() => {
        if (!interviewerId) return;
        const fetchAll = async () => {
            setLoading(true);
            try {
                const now = new Date();
                const results = await Promise.all(
                    [0, 1, 2].map((offset) => {
                        const target = addMonths(now, offset);
                        return getAvailabilitiesByMonth(interviewerId, target.getMonth() + 1, target.getFullYear());
                    }),
                );
                const all = results.flat().filter((a) => new Date(a.endTime) >= now);
                all.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
                setUpcomingSlots(all);
            } catch (e) {
                console.error("UpcomingSessionBlog fetch error:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [interviewerId, availabilities.length, availabilities]);

    return (
        <Card
            variant="outlined"
            sx={{
                borderColor: "divider",
                borderRadius: "12px",
            }}
        >
            <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "text.primary" }}>
                    Upcoming Interview Slots
                </Typography>

                <Stack spacing={1.5} sx={{ maxHeight: 480, overflowY: "auto", pr: 0.5 }}>
                    {loading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : upcomingSlots.length === 0 ? (
                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", textAlign: "center", py: 3, fontStyle: "italic" }}
                        >
                            No upcoming slots
                        </Typography>
                    ) : (
                        upcomingSlots.map((avail) => {
                            const colorObj = getAvailabilityColors(avail.status, isPast(avail.endTime));
                            const statusColor = colorObj?.border || colorObj?.bg || "#6366f1";

                            return (
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
                                        "&:hover, &:focus-visible": {
                                            borderColor: statusColor,
                                            bgcolor: `${statusColor}14`,
                                            boxShadow: `0 2px 8px ${statusColor}33`,
                                            outline: "none",
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
                                                    (avail.status === AVAILABILITY_SLOTS_STATUS.BOOKED
                                                        ? "Booked"
                                                        : "No Booking Yet")}
                                            </Typography>

                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: "text.secondary",
                                                    display: "block",
                                                    fontWeight: 500,
                                                }}
                                                noWrap
                                            >
                                                {focusLabel(avail.focus)}
                                                {avail.typeName || (avail.type && avail.type.name) || avail.typeId
                                                    ? ` • ${avail.typeName || avail.type?.name || `Type ${avail.typeId}`}`
                                                    : ""}
                                            </Typography>
                                        </Box>

                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                            <IoCheckmarkCircle size={14} style={{ color: statusColor }} />
                                            <Typography variant="caption" sx={{ fontWeight: 600, color: statusColor }}>
                                                {avail.status === AVAILABILITY_SLOTS_STATUS.BOOKED
                                                    ? "Booked"
                                                    : avail.status === AVAILABILITY_SLOTS_STATUS.RESERVED
                                                      ? "Reserved"
                                                      : "Available"}
                                            </Typography>
                                        </Stack>
                                    </Stack>

                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: "text.secondary",
                                            display: "block",
                                            mb: 0.5,
                                            fontWeight: 500,
                                        }}
                                    >
                                        {parseLocalDate(avail.startTime)}
                                    </Typography>

                                    <Typography variant="body2" sx={{ color: statusColor, fontWeight: 600, mb: 1 }}>
                                        {parseLocalTime(avail.startTime)} - {parseLocalTime(avail.endTime)}
                                    </Typography>
                                </Box>
                            );
                        })
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
};

export default UpcomingSessionBlog;
