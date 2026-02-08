import React from "react";
import { Box, Card, CardContent, Typography, Stack, Button, CircularProgress, Avatar } from "@mui/material";
import { IoCheckmarkCircle, IoTrash } from "react-icons/io5";
import { AVAILABILITY_SLOTS_STATUS, getAvailabilityColors } from "../../../../common/constants/status";

const UpcomingSessionBlog = ({
    availabilities,
    loading,
    nowUtc,
    parseUTCDate,
    parseUTCTime,
}) => {
    const focusLabel = (focus) => {
        if (focus === 0) return "General Skills";
        if (focus === 1) return "Job Description";
        return "";
    };

    const isPast = (endTime) => {
        return new Date(endTime) < new Date();
    }

    console.log("Filtered upcomingSlots:", availabilities.filter(a => a.endTime >= nowUtc));


    return (
        <Card
            variant="outlined"
            sx={{
                borderColor: "divider",
                borderRadius: "12px",
                height: "fit-content",
            }}
        >
            <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "text.primary" }}>
                    Upcoming Interview Slots
                    {/* ({availabilities.filter(a => a.endTime >= nowUtc).length}) */}
                </Typography>

                <Stack spacing={1.5}>
                    {loading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : availabilities.filter(a => a.endTime >= nowUtc).length === 0 ? (
                        <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", py: 3, fontStyle: "italic" }}>
                            No upcoming slots
                        </Typography>
                    ) : (
                        availabilities
                            .filter(a => new Date(a.endTime) >= new Date())
                            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                            .slice(0, 4)
                            .map((avail) => (
                                <Box
                                    key={avail.id}
                                    sx={{
                                        border: "1px solid",
                                        borderColor: "divider",
                                        borderRadius: "8px",
                                        p: 1.5,
                                        transition: "all 0.2s ease-in-out",
                                        cursor: avail.status === AVAILABILITY_SLOTS_STATUS.BOOKED ? "default" : "pointer",
                                        "&:hover": {
                                            borderColor: "primary.main",
                                            boxShadow: "0 2px 8px rgba(79, 70, 229, 0.1)",
                                        },
                                    }}
                                >
                                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                                        <Avatar
                                            src={avail.candidateAvatar || avail.candidate?.avatarUrl || ''}
                                            sx={{ width: 36, height: 36, bgcolor: avail.status === AVAILABILITY_SLOTS_STATUS.BOOKED ? 'primary.light' : 'grey.100' }}
                                        >
                                            {!avail.candidateName && !avail.candidate?.fullName && !avail.candidate?.name ? 'N' : ''}
                                        </Avatar>

                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: avail.status === AVAILABILITY_SLOTS_STATUS.BOOKED ? 'text.primary' : 'text.secondary' }} noWrap>
                                                {avail.candidateName || avail.candidate?.fullName || avail.candidate?.name || (avail.status === AVAILABILITY_SLOTS_STATUS.BOOKED ? 'Booked' : 'No Booking Yet')}
                                            </Typography>

                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 500 }} noWrap>
                                                {focusLabel(avail.focus)}{(avail.typeName || (avail.type && avail.type.name) || avail.typeId) ? ` • ${avail.typeName || avail.type?.name || `Type ${avail.typeId}`}` : ''}
                                            </Typography>
                                        </Box>

                                        <Stack direction="row" spacing={1} alignItems="center">
                                            {(() => {
                                                const colorObj = getAvailabilityColors(avail.status, isPast(avail.endTime));
                                                const color = colorObj?.border || colorObj?.bg || '#4F46E5';
                                                return (
                                                    <>
                                                        <IoCheckmarkCircle size={14} style={{ color }} />
                                                        <Typography variant="caption" sx={{ fontWeight: 600, color }}>
                                                            {avail.status === AVAILABILITY_SLOTS_STATUS.BOOKED ? "Booked" : avail.status === AVAILABILITY_SLOTS_STATUS.RESERVED ? "Reserved" : "Available"}
                                                        </Typography>
                                                    </>
                                                );
                                            })()}
                                        </Stack>

                                    </Stack>

                                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5, fontWeight: 500 }}>
                                        {parseUTCDate(avail.startTime)}
                                    </Typography>

                                    <Typography variant="body2" sx={{ color: "primary.main", fontWeight: 600, mb: 1 }}>
                                        {parseUTCTime(avail.startTime)} - {parseUTCTime(avail.endTime)}
                                    </Typography>
                                </Box>
                            ))
                    )}
                </Stack>
            </CardContent>
        </Card >
    );
};

export default UpcomingSessionBlog;