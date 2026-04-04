import { useState } from "react";
import {
    Box,
    Typography,
    Stack,
    Pagination,
} from "@mui/material";
import CommonLoader from "../../../../../common/components/loaders/CommonLoader";
import toast from "react-hot-toast";
import InterviewCard from "./InterviewCard";
import RecentInterviewItem from "./RecentInterviewItem";
import { INTERVIEW_ROOM_STATUS } from "../../../../../common/constants/status";

function UpcomingTab({ 
    rooms, 
    recentRooms = [],
    user,
    loading,
    onRequestReschedule,
    onCancelInterview,
    onJoin,
    onReviewQuestions,
    onViewFeedback,
    rescheduleRequests = [],
    page,
    totalItems,
    pageSize,
    onPageChange
}) {
    // Helper to check if room has pending reschedule request
    const hasPendingRescheduleRequest = (room) => {
        if (room?.rounds?.length > 1) {
            const roundIds = new Set(room.rounds.map((round) => round.id));
            return rescheduleRequests.some((req) => roundIds.has(req.interviewRoomId) && req.status === 0);
        }

        return rescheduleRequests.some((req) => req.interviewRoomId === room?.id && req.status === 0);
    };

    const totalPages = Math.ceil(totalItems / pageSize);

    const handleCardClick = (room) => {
        if (room.status === INTERVIEW_ROOM_STATUS.ON_GOING) {
            return;
        }

        if (room.status === INTERVIEW_ROOM_STATUS.COMPLETED) {
            if (onViewFeedback) {
                onViewFeedback(room);
                return;
            }
            if (!room.score) {
                toast("No feedback available yet.", {
                    style: {
                        borderRadius: "10px",
                        background: "#333",
                        color: "#fff",
                    },
                });
                return;
            }
        }
    };

    if (loading && rooms.length === 0) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CommonLoader />
            </Box>
        );
    }

    return (
        <Box>
            {rooms.length === 0 ? (
                <Box
                    sx={{
                        py: 6,
                        textAlign: "center",
                        bgcolor: "background.paper",
                        borderRadius: 2.5,
                        border: "1px dashed",
                        borderColor: "divider",
                    }}
                >
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No upcoming interviews
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Your scheduled interviews will appear here
                    </Typography>
                </Box>
            ) : (
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            sm: "repeat(2, minmax(0, 1fr))",
                            md: "repeat(3, minmax(0, 1fr))",
                        },
                        gap: 1.75,
                        width: "100%",
                    }}
                >
                    {rooms.map((room) => (
                        <Box key={room.id} sx={{ display: "flex", width: "100%" }}>
                            <InterviewCard
                                room={room}
                                user={user}
                                onClick={handleCardClick}
                                onRequestReschedule={onRequestReschedule}
                                onCancel={onCancelInterview}
                                onJoin={onJoin}
                                onReviewQuestions={onReviewQuestions}
                                showActions={true}
                                hasPendingReschedule={hasPendingRescheduleRequest(room)}
                            />
                        </Box>
                    ))}
                </Box>
            )}

            {/* Pagination */}
            {totalItems > 0 && (
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mt: 2.25, pt: 2, borderTop: "1px solid", borderColor: "divider" }}
                >
                    <Typography variant="body2" color="text.secondary">
                        Showing {(page - 1) * pageSize + 1} to{" "}
                        {Math.min(page * pageSize, totalItems)} of{" "}
                        {totalItems} results
                    </Typography>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={onPageChange}
                        color="primary"
                        shape="rounded"
                        showFirstButton
                        showLastButton
                    />
                </Stack>
            )}

            {/* Recent Section */}
            {recentRooms && recentRooms.length > 0 && (
                <Box sx={{ mt: 6 }}>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                        Recent History
                    </Typography>
                    <Box sx={{ width: "100%" }}>
                        {recentRooms.slice(0, 3).map((room) => (
                            <RecentInterviewItem
                                key={room.id}
                                room={room}
                                user={user}
                                onClick={handleCardClick}
                            />
                        ))}
                    </Box>
                </Box>
            )}
        </Box>
    );
}

export default UpcomingTab;
