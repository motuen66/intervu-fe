import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, CircularProgress, Pagination, Typography } from "@mui/material";
import ShareIcon from "@mui/icons-material/Share";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { interviewQuestionEndPoints } from "../../service/interviewQuestionApi";
import QuestionCard from "./QuestionCard";
import QuestionFilters from "./QuestionFilters";
import FeaturedTopics from "./FeaturedTopics";
import QuestionSidebar from "./QuestionSidebar";

const PAGE_SIZE = 10;

export default function InterviewQuestionsPage() {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(null);
    const [page, setPage] = useState(1);
    const [sidebarSearch, setSidebarSearch] = useState("");

    const [filters, setFilters] = useState({ role: "", category: "", level: "", sort: "hot" });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page,
                pageSize: PAGE_SIZE,
                ...(filters.role && { role: filters.role }),
                ...(filters.category && { questionType: filters.category }),
                ...(filters.level !== "" &&
                    filters.level !== null &&
                    filters.level !== undefined && { level: filters.level }),
            };
            const { data } = await callApi({
                method: METHOD.GET,
                endpoint: interviewQuestionEndPoints.GET_LIST,
                arg: params,
            });
            const payload = data ?? {};
            const items = payload.items ?? payload.data ?? (Array.isArray(payload) ? payload : []);
            setQuestions(items);
            setTotalPages(payload.totalPages ?? Math.ceil((payload.totalCount ?? items.length) / PAGE_SIZE));
            setTotalCount(payload.totalCount ?? null);
        } catch (err) {
            console.error(err);
            setQuestions([]);
        } finally {
            setLoading(false);
        }
    }, [page, filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFilterChange = (key, value) => {
        setPage(1);
        setFilters((p) => ({ ...p, [key]: value }));
    };
    const handleRoleChipClick = (role) => {
        setPage(1);
        setFilters((p) => ({ ...p, role: p.role === role ? "" : role }));
    };
    // const handleTopicClick = (topic) => {
    //     setPage(1);
    //     setFilters((p) => ({ ...p, category: topic.label }));
    // };

    return (
        <Box sx={{ maxWidth: 1200, mx: "auto", px: 3, pt: 4, pb: 8 }}>
            {/* Header */}
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 3.5, gap: 2 }}>
                <Box>
                    <Typography variant="h4" mb={0.75}>
                        Interview Questions
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520 }}>
                        {totalCount != null
                            ? `Review this list of ${totalCount.toLocaleString()} interview questions and answers verified by hiring managers and candidates.`
                            : "Browse real interview questions shared by candidates and hiring managers."}
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<ShareIcon />}
                    onClick={() => navigate("/questions/share")}
                    sx={{ whiteSpace: "nowrap", borderRadius: 999, px: 2.5 }}
                >
                    Share interview
                </Button>
            </Box>

            <QuestionFilters filters={filters} onChange={handleFilterChange} />
            {/* <FeaturedTopics onTopicClick={handleTopicClick} /> */}

            {/* Body */}
            <Box sx={{ display: "flex", gap: 3.5, alignItems: "flex-start", flexWrap: { xs: "wrap", md: "nowrap" } }}>
                {/* Question list */}
                <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                    {loading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 7.5 }}>
                            <CircularProgress />
                        </Box>
                    ) : questions.length === 0 ? (
                        <Typography align="center" color="text.secondary" py={7.5}>
                            No questions found. Try changing filters.
                        </Typography>
                    ) : (
                        <>
                            {questions.map((q, idx) => (
                                <QuestionCard key={q.id ?? idx} item={q} />
                            ))}
                            {totalPages > 1 && (
                                <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
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

                <QuestionSidebar
                    activeRole={filters.role}
                    onRoleClick={handleRoleChipClick}
                    searchValue={sidebarSearch}
                    onSearchChange={setSidebarSearch}
                />
            </Box>
        </Box>
    );
}
