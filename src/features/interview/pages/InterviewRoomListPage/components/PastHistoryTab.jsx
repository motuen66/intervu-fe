import {
    Box,
    Stack,
    Pagination,
    CircularProgress,
} from "@mui/material";
import RecentInterviewItem from "./RecentInterviewItem";
import AppText from "../../../../../common/components/AppText";

function PastHistoryTab({
    rooms,
    user,
    loading,
    page = 1,
    totalPages = 0,
    totalItems = 0,
    pageSize = 5,
    onPageChange,
    onViewFeedback,
    onReviewQuestions,
}) {
    const handleCardClick = (room) => {
        if (onViewFeedback) {
            onViewFeedback(room);
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
                        py: 8,
                        textAlign: "center",
                        bgcolor: "background.paper",
                        borderRadius: 2,
                        border: "1px dashed",
                        borderColor: "divider",
                    }}
                >
                    <AppText variant="bodyStrong" sx={{ color: "text.secondary", mb: 0.5 }}>
                        No past interviews
                    </AppText>
                    <AppText variant="muted">
                        Completed interviews will appear here
                    </AppText>
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

            {totalItems > 0 && totalPages > 1 && (
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mt: 3, pt: 3, borderTop: "1px solid", borderColor: "divider" }}
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

export default PastHistoryTab;
