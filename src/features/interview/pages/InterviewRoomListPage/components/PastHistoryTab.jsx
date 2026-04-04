import {
    Box,
    Typography,
    Stack,
    Pagination,
} from "@mui/material";
import CommonLoader from "../../../../../common/components/loaders/CommonLoader";
import RecentInterviewItem from "./RecentInterviewItem";

function PastHistoryTab({ rooms, user, loading, onViewFeedback, onReviewQuestions, page, totalItems, pageSize, onPageChange }) {
    const totalPages = Math.ceil(totalItems / pageSize);

    const handleCardClick = (room) => {
        if (onViewFeedback) {
            onViewFeedback(room);
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
                    {rooms.map((room) => (
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
            {totalItems > 0 && (
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mt: 3, pt: 3, borderTop: "1px solid", borderColor: "divider" }}
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
        </Box>
    );
}

export default PastHistoryTab;
