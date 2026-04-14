import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, CircularProgress, MenuItem, Pagination, Stack, Typography } from "@mui/material";
import ShareIcon from "@mui/icons-material/Share";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { interviewQuestionEndPoints } from "../../service/interviewQuestionApi";
import { homeEndPoints } from "../../../home/services/homeApi";
import QuestionCard from "./QuestionCard";
import QuestionFilters from "./QuestionFilters";
import QuestionSidebar from "./QuestionSidebar";
import FormSelect from "../../../../common/components/form/FormSelect";

export default function InterviewQuestionsPage() {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sidebarSearch, setSidebarSearch] = useState("");
    const [loading, setLoading] = useState(false);

    const [companies, setCompanies] = useState([]);

    const [filters, setFilters] = useState({ role: "", category: "", companyId: "", level: "", round: "", sortBy: 1 }); // sortBy: 1=Hot

    useEffect(() => {
        callApi({
            method: METHOD.GET,
            endpoint: homeEndPoints.GET_ALL_COMPANIES,
            arg: { page: 1, pageSize: 200 },
            useGlobalLoading: false,
        })
            .then(({ data }) => {
                const payload = data ?? {};
                const items = payload.items ?? payload.data ?? (Array.isArray(payload) ? payload : []);
                const normalized = (items ?? [])
                    .map((c) => ({
                        id: c.id ?? c.companyId ?? c._id,
                        name: c.name ?? c.companyName ?? c.title,
                    }))
                    .filter((c) => c.id != null && c.name);
                normalized.sort((a, b) =>
                    String(a.name).localeCompare(String(b.name), undefined, { sensitivity: "base" }),
                );
                setCompanies(normalized);
            })
            .catch(() => setCompanies([]));
    }, []);

    useEffect(() => {
        setPage(1);
    }, [sidebarSearch]);

    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const keyword = sidebarSearch.trim();
            const params = {
                page,
                pageSize,
                ...(filters.role !== "" && { role: filters.role }),
                ...(filters.category !== "" && { category: filters.category }),
                ...(filters.companyId && { companyId: filters.companyId }),
                ...(filters.level !== "" &&
                    filters.level !== null &&
                    filters.level !== undefined && { level: filters.level }),
                ...(filters.round !== "" &&
                    filters.round !== null &&
                    filters.round !== undefined && { round: filters.round }),
                ...(filters.sortBy && { sortBy: filters.sortBy }),
                ...(keyword && { searchTerm: keyword }),
            };
            const { data } = await callApi({
                method: METHOD.GET,
                endpoint: interviewQuestionEndPoints.GET_LIST,
                arg: params,
                useGlobalLoading: false,
            });
            const payload = data ?? {};
            const items = payload.items ?? payload.data ?? (Array.isArray(payload) ? payload : []);
            setQuestions(items);
            setTotalPages(payload.totalPages ?? Math.ceil((payload.totalCount ?? items.length) / pageSize));
            setTotalCount(payload.totalCount ?? null);
        } catch (err) {
            console.error(err);
            setQuestions([]);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, filters, sidebarSearch]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFilterChange = (key, value) => {
        setPage(1);
        // MUI Select may return string even for integer-valued MenuItems; parse back to Number
        const integerKeys = ["role", "category", "sortBy", "level", "round"];
        const parsed = integerKeys.includes(key) && value !== "" ? Number(value) : value;
        setFilters((p) => ({ ...p, [key]: parsed }));
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
                    sx={{ whiteSpace: "nowrap", px: 2.5 }}
                >
                    Share interview
                </Button>
            </Box>

            <QuestionFilters filters={filters} onChange={handleFilterChange} companies={companies} />

            {/* Body */}
            <Box sx={{ display: "flex", gap: 3.5, alignItems: "flex-start", flexWrap: { xs: "wrap", md: "nowrap" } }}>
                {/* Question list */}
                <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                    {loading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                            <CircularProgress size={30} />
                        </Box>
                    ) : questions.length === 0 ? (
                        <Typography align="center" color="text.secondary" py={7.5}>
                            No questions found. Try changing filters.
                        </Typography>
                    ) : (
                        <>
                            {(() => {
                                const isHotSort = filters.sortBy === 1;
                                const displayList = isHotSort
                                    ? [...questions].sort((a, b) => (b.vote ?? 0) - (a.vote ?? 0))
                                    : questions;
                                const hotIds = new Set(
                                    [...questions]
                                        .sort((a, b) => (b.vote ?? 0) - (a.vote ?? 0))
                                        .slice(0, 2)
                                        .filter((q) => (q.vote ?? 0) > 0)
                                        .map((q) => q.id),
                                );
                                return displayList.map((q, idx) => (
                                    <QuestionCard key={q.id ?? idx} item={q} isHot={hotIds.has(q.id)} />
                                ));
                            })()}
                            <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} mt={2}>
                                <Pagination
                                    count={totalPages}
                                    page={page}
                                    onChange={(_, v) => setPage(v)}
                                    color="primary"
                                    shape="rounded"
                                />
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Typography variant="body2" color="text.secondary" noWrap>
                                        Per page:
                                    </Typography>
                                    <FormSelect
                                        size="small"
                                        value={pageSize}
                                        onChange={(e) => setPageSize(Number(e.target.value))}
                                        sx={{ minWidth: 72 }}
                                    >
                                        {[10, 20, 50].map((n) => (
                                            <MenuItem key={n} value={n}>
                                                {n}
                                            </MenuItem>
                                        ))}
                                    </FormSelect>
                                </Stack>
                            </Stack>
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
