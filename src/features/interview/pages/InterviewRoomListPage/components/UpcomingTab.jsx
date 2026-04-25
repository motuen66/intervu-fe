import { Box, Stack, Pagination, CircularProgress } from "@mui/material";
import toast from "react-hot-toast";
import SessionCard from "./SessionCard";
import { INTERVIEW_ROOM_STATUS } from "../../../../../common/constants/status";
import AppText from "../../../../../common/components/AppText";

function UpcomingTab({
    rooms,
    user,
    loading,
    page = 1,
    totalPages = 0,
    totalItems = 0,
    pageSize = 6,
    onPageChange,
    onRequestReschedule,
    onCancelInterview,
    onJoin,
    onViewFeedback,
    onReviewQuestions,
    rescheduleRequests = [],
    highlightedSessionKey = null,
    highlightedRoundId = null,
    highlightedRoundIndex = null,
}) {
    const getSessionKey = (room) => room?.sessionId || room?.bookingRequestId || room?.id || null;

    const hasPendingRescheduleRequest = (room) => {
        if (room?.rounds?.length > 1) {
            const roundIds = new Set(room.rounds.map((round) => round.id));
            return rescheduleRequests.some((req) => roundIds.has(req.interviewRoomId) && req.status === 0);
        }

        return rescheduleRequests.some((req) => req.interviewRoomId === room?.id && req.status === 0);
    };

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

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress size={30} />
            </Box>
        );
    }

    const startIdx = totalItems > 0 ? (page - 1) * pageSize + 1 : 0;
    const endIdx = Math.min(page * pageSize, totalItems);

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
                    <AppText variant="bodyStrong" sx={{ color: "text.secondary", mb: 0.5 }}>
                        No upcoming interviews
                    </AppText>
                    <AppText variant="muted">
                        Your scheduled interviews will appear here
                    </AppText>
                </Box>
            ) : (
                <Stack spacing={1.75} sx={{ width: "100%" }}>
                    {rooms.map((room) => {
                        const isHighlighted = getSessionKey(room) === highlightedSessionKey;

                        return (
                            <Box key={room.id} sx={{ width: "100%" }}>
                                <SessionCard
                                    room={room}
                                    user={user}
                                    onClick={handleCardClick}
                                    onRequestReschedule={onRequestReschedule}
                                    onCancel={onCancelInterview}
                                    onJoin={onJoin}
                                    onReviewQuestions={onReviewQuestions}
                                    showActions={true}
                                    hasPendingReschedule={hasPendingRescheduleRequest(room)}
                                    isHighlighted={isHighlighted}
                                    highlightedRoundId={isHighlighted ? highlightedRoundId : null}
                                    highlightedRoundIndex={isHighlighted ? highlightedRoundIndex : null}
                                />
                            </Box>
                        );
                    })}
                </Stack>
            )}

            {totalItems > 0 && totalPages > 1 && (
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mt: 2.25, pt: 2, borderTop: "1px solid", borderColor: "divider" }}
                >
                    <AppText variant="muted">
                        Showing {startIdx} to {endIdx} of {totalItems} results
                    </AppText>
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
        </Box>
    );
}

export default UpcomingTab;
