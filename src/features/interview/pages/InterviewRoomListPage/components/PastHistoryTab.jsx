import { useState, useMemo } from "react";
import {
    Box,
    Typography,
    Stack,
    Pagination,
} from "@mui/material";
import CommonLoader from "../../../../../common/components/loaders/CommonLoader";
import RecentInterviewItem from "./RecentInterviewItem";
import { INTERVIEW_ROOM_STATUS } from "../../../../../common/constants/status";

const ITEMS_PER_PAGE = 5;

function PastHistoryTab({ rooms, user, loading, onViewFeedback, onReviewQuestions }) {
    const [page, setPage] = useState(1);

    // Simplified list: removed internal search/filter bars
    const filteredRooms = useMemo(() => {
        return [...rooms];
    }, [rooms]);

    // Pagination logic
    const totalPages = Math.ceil(filteredRooms.length / ITEMS_PER_PAGE);
    const paginatedRooms = filteredRooms.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    const handleCardClick = (room) => {
        // Handle viewing feedback
        if (onViewFeedback) {
            onViewFeedback(room);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CommonLoader />
            </Box>
        );
    }

    return (
        <Box>
            {paginatedRooms.length === 0 ? (
                <Box
                    sx={{
                        py: 8,
                        textAlign: "center",
                        bgcolor: "background.paper",
                        borderRadius: 2,
                        border: "1px dashed",
                        borderColor: "divider",
                    }}
                >
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No past interviews
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Completed interviews will appear here
                    </Typography>
                </Box>
            ) : (
                <Stack spacing={2} sx={{ width: "100%" }}>
                    {paginatedRooms.map((room) => (
                        <RecentInterviewItem
                            key={room.id}
                            room={room}
                            user={user}
                            onClick={handleCardClick}
                            onReviewQuestions={onReviewQuestions}
                        />
                    ))}
                </Stack>
            )}

            {/* Pagination */}
            {filteredRooms.length > 0 && (
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mt: 3, pt: 3, borderTop: "1px solid", borderColor: "divider" }}
                >
                    <Typography variant="body2" color="text.secondary">
                        Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{" "}
                        {Math.min(page * ITEMS_PER_PAGE, filteredRooms.length)} of{" "}
                        {filteredRooms.length} results
                    </Typography>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
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

export default PastHistoryTab;
