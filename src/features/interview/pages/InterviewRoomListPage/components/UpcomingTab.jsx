import { useState, useMemo } from "react";
import {
    Box,
    Typography,
    Stack,
    Pagination,
    CircularProgress,
} from "@mui/material";
import toast from "react-hot-toast";
import InterviewCard from "./InterviewCard";
import RecentInterviewItem from "./RecentInterviewItem";
import InterviewFilterBar from "./InterviewFilterBar";
import { INTERVIEW_ROOM_STATUS } from "../../../../../common/constants/status";

const ITEMS_PER_PAGE = 6;

function UpcomingTab({ 
    rooms, 
    recentRooms = [],
    user, 
    loading,
    onRequestReschedule,
    onCancelInterview,
    rescheduleRequests = []
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterValue, setFilterValue] = useState("");
    const [page, setPage] = useState(1);

    const filterOptions = [
        { value: "scheduled", label: "Scheduled" },
        { value: "ongoing", label: "Ongoing" },
    ];

    // Helper to check if room has pending reschedule request
    const hasPendingRescheduleRequest = (roomId) => {
        return rescheduleRequests.some(
            (req) => req.interviewRoomId === roomId && req.status === 0
        );
    };

    // Filter and search logic
    const filteredRooms = useMemo(() => {
        let result = [...rooms];

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (room) =>
                    room.problemShortName?.toLowerCase().includes(query) ||
                    room.coachName?.toLowerCase().includes(query) ||
                    room.candidateName?.toLowerCase().includes(query)
            );
        }

        // Apply status filter
        if (filterValue) {
            if (filterValue === "scheduled") {
                result = result.filter((room) => room.status === INTERVIEW_ROOM_STATUS.SCHEDULED);
            } else if (filterValue === "ongoing") {
                result = result.filter((room) => room.status === INTERVIEW_ROOM_STATUS.ON_GOING);
            }
        }

        return result;
    }, [rooms, searchQuery, filterValue]);

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
        // For ONGOING interviews, only Join button should navigate
        // Card click does nothing for ONGOING status
        if (room.status === INTERVIEW_ROOM_STATUS.ON_GOING) {
            return;
        }
        
        if (room.status === INTERVIEW_ROOM_STATUS.COMPLETED) {
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
        // For other statuses, can add navigation logic if needed
    };

    const handleExport = () => {
        // TODO: Implement export functionality
        console.log("Export upcoming interviews");
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <InterviewFilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filterValue={filterValue}
                onFilterChange={setFilterValue}
                onExport={handleExport}
                filterOptions={filterOptions}
            />

            {paginatedRooms.length === 0 ? (
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
                    {paginatedRooms.map((room) => (
                        <Box key={room.id} sx={{ display: "flex", width: "100%" }}>
                            <InterviewCard
                                room={room}
                                user={user}
                                onClick={handleCardClick}
                                onRequestReschedule={onRequestReschedule}
                                onCancel={onCancelInterview}
                                showActions={true}
                                hasPendingReschedule={hasPendingRescheduleRequest(room.id)}
                            />
                        </Box>
                    ))}
                </Box>
            )}

            {/* Pagination */}
            {filteredRooms.length > 0 && (
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mt: 2.25, pt: 2, borderTop: "1px solid", borderColor: "divider" }}
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
