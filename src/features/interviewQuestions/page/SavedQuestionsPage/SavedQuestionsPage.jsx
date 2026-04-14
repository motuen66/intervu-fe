import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Box, Button, CircularProgress, Pagination, Stack, Typography } from "@mui/material";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { interactionEndPoints } from "../../service/interactionApi";
import QuestionCard from "../InterviewQuestionsPage/QuestionCard";

const PAGE_SIZE = 10;

export default function SavedQuestionsPage() {
    const navigate = useNavigate();
    const currentUser = useSelector((state) => state.auth.userData);

    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(null);

    useEffect(() => {
        if (!currentUser) {
            navigate("/login");
            return;
        }
        setLoading(true);
        callApi({
            method: METHOD.GET,
            endpoint: interactionEndPoints.GET_SAVED_QUESTIONS,
            arg: { page, pageSize: PAGE_SIZE },
            useGlobalLoading: false,
        })
            .then(({ data }) => {
                const payload = data ?? {};
                const items = Array.isArray(payload) ? payload : (payload.items ?? payload.data ?? []);
                setQuestions(items);
                setTotalPages(
                    Array.isArray(payload)
                        ? 1
                        : (payload.totalPages ?? Math.ceil((payload.totalCount ?? items.length) / PAGE_SIZE)),
                );
                setTotalCount(Array.isArray(payload) ? payload.length : (payload.totalCount ?? null));
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [page, currentUser]);

    return (
        <Box sx={{ maxWidth: 900, mx: "auto", px: 3, pt: 4, pb: 8 }}>
            {/* Header */}
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(-1)}
                sx={{
                    color: "text.secondary",
                    textTransform: "none",
                    fontSize: 13,
                    p: 0,
                    mb: 2.5,
                    "&:hover": { color: "primary.main", background: "none" },
                }}
            >
                Back
            </Button>

            <Stack direction="row" alignItems="center" gap={1.25} mb={3}>
                <BookmarkIcon color="primary" />
                <Typography variant="h5" fontWeight={700}>
                    Saved Questions
                </Typography>
                {totalCount != null && (
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                        ({totalCount})
                    </Typography>
                )}
            </Stack>

            {/* Content */}
            {loading ? (
                <Box display="flex" justifyContent="center" py={8}>
                    <CircularProgress />
                </Box>
            ) : questions.length === 0 ? (
                <Box
                    sx={{
                        textAlign: "center",
                        py: 10,
                        border: "1px dashed",
                        borderColor: "divider",
                        borderRadius: 2,
                    }}
                >
                    <BookmarkIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1.5 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No saved questions yet
                    </Typography>
                    <Typography variant="body2" color="text.disabled" mb={2.5}>
                        Save questions while browsing and they will appear here.
                    </Typography>
                    <Button variant="contained" onClick={() => navigate("/questions")} sx={{ textTransform: "none" }}>
                        Browse Questions
                    </Button>
                </Box>
            ) : (
                <>
                    <Stack spacing={1.5}>
                        {questions.map((item) => (
                            <QuestionCard key={item.id} item={item} />
                        ))}
                    </Stack>

                    {totalPages > 1 && (
                        <Box display="flex" justifyContent="center" mt={4}>
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={(_, v) => setPage(v)}
                                color="primary"
                                shape="rounded"
                            />
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
}
