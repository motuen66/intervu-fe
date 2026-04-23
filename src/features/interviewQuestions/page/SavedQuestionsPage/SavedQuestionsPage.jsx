import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Box, CircularProgress, Pagination, Stack } from "@mui/material";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import PageHeader from "../../../../common/components/PageHeader";
import AppText from "../../../../common/components/AppText";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { interactionEndPoints } from "../../service/interactionApi";
import QuestionCard from "../InterviewQuestionsPage/QuestionCard";
import { PrimaryButton } from "../../../../common/components/buttons";

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
        <>
            <PageHeader
                title="Saved Questions"
                subtitle="Review and manage the questions you've bookmarked for later practice."
                actions={
                    totalCount != null ? (
                        <AppText variant="muted">({totalCount} questions)</AppText>
                    ) : null
                }
            />

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
                    <AppText variant="bodyStrong" sx={{ color: "text.secondary", mb: 0.5 }}>
                        No saved questions yet
                    </AppText>
                    <AppText variant="muted" sx={{ mb: 2.5 }}>
                        Save questions while browsing and they will appear here.
                    </AppText>
                    <PrimaryButton onClick={() => navigate("/questions")} size="md">
                        Browse Questions
                    </PrimaryButton>
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
        </>
    );
}
