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
import InterviewFilterBar from "./InterviewFilterBar";
import { useNavigate } from "react-router-dom";

const ITEMS_PER_PAGE = 6;

function PastHistoryTab({ rooms, user, loading, onViewFeedback }) {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterValue, setFilterValue] = useState("");
    const [page, setPage] = useState(1);

    const filterOptions = [
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" },
    ];

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
            if (filterValue === "completed") {
                result = result.filter((room) => room.status === 2);
            } else if (filterValue === "cancelled") {
                result = result.filter((room) => room.status === 3);
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
        // Past interviews should not navigate to room
        // Users can only view details, not enter the room
        if (room.status === 2) { // 2 = COMPLETED
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
        return;
    };

    const handleExport = () => {
        // TODO: Implement export functionality
        console.log("Export past interviews");
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
                                showActions={true}
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
