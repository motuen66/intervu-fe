import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    InputAdornment,
    Link as MuiLink,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import DOMPurify from "dompurify";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { CATEGORIES } from "../../../../common/constants/types";
import { QUESTION_CATEGORY } from "../../services/preparedQuestionApi";

const PAGE_SIZE = 20;
const PREVIEW_MAX_LENGTH = 180;

function stripHtml(html) {
    return (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * The Question list DTO on the backend serialises `Category` as the enum NAME
 * (e.g. "Coding", "SystemDesign", "Behavioral"), not its integer value. Our
 * local CATEGORIES lookup uses integer values, so we need to translate the
 * string back into the numeric id first — otherwise every row falls through
 * to the "General" default and gets the wrong colour/label.
 */
function resolveCategoryId(raw) {
    if (raw == null || raw === "") return null;
    if (typeof raw === "number") return raw;
    const asNum = Number(raw);
    if (!Number.isNaN(asNum) && asNum > 0) return asNum;
    return QUESTION_CATEGORY[raw] ?? null;
}

function humaniseCategoryName(name) {
    if (typeof name !== "string" || !name.trim()) return null;
    return name
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/\s+/g, " ")
        .trim();
}

function BankRow({ question, isImported, isAdding, onAdd }) {
    const [expanded, setExpanded] = useState(false);
    const categoryId = resolveCategoryId(question.category);
    const isCoding = categoryId === QUESTION_CATEGORY.Coding;
    const categoryLabel =
        CATEGORIES.find((c) => c.value === categoryId)?.label
        ?? humaniseCategoryName(question.category)
        ?? (isCoding ? "Coding" : "General");

    const plainText = useMemo(() => stripHtml(question.content), [question.content]);
    const canExpand = plainText.length > PREVIEW_MAX_LENGTH;
    const sanitizedHtml = useMemo(
        () => (expanded ? DOMPurify.sanitize(question.content || "") : null),
        [expanded, question.content],
    );

    return (
        <Box
            sx={(theme) => ({
                p: 1.5,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1.5,
                display: "flex",
                gap: 1.5,
                alignItems: "flex-start",
            })}
        >
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} sx={{ mb: 0.5, flexWrap: "wrap" }}>
                    <Chip
                        size="small"
                        label={categoryLabel}
                        sx={{
                            fontWeight: 700,
                            height: 20,
                            fontSize: "0.65rem",
                            backgroundColor: isCoding ? "#E0E7FF" : "#FEF3C7",
                            color: isCoding ? "#3730A3" : "#92400E",
                        }}
                    />
                </Stack>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {question.title}
                </Typography>

                {expanded ? (
                    <Box
                        className="ql-snow"
                        sx={{
                            color: "text.secondary",
                            fontSize: "0.875rem",
                            "& .ql-editor": { p: 0, lineHeight: 1.55 },
                            "& p": { m: 0, mb: 0.5 },
                            "& img": { maxWidth: "100%", height: "auto" },
                            "& pre": {
                                background: "#F3F4F6",
                                p: 1,
                                borderRadius: 1,
                                overflow: "auto",
                            },
                        }}
                    >
                        <Box
                            className="ql-editor"
                            dangerouslySetInnerHTML={{ __html: sanitizedHtml ?? "" }}
                        />
                    </Box>
                ) : (
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {canExpand
                            ? `${plainText.slice(0, PREVIEW_MAX_LENGTH)}…`
                            : plainText}
                    </Typography>
                )}

                {canExpand && (
                    <MuiLink
                        component="button"
                        type="button"
                        onClick={() => setExpanded((v) => !v)}
                        underline="hover"
                        sx={{
                            mt: 0.5,
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "primary.main",
                            display: "inline-block",
                        }}
                    >
                        {expanded ? "Show less" : "Show more"}
                    </MuiLink>
                )}
            </Box>
            <Button
                size="small"
                variant={isImported ? "outlined" : "contained"}
                color={isImported ? "success" : "primary"}
                startIcon={
                    isImported
                        ? <CheckRoundedIcon sx={{ fontSize: "1rem !important" }} />
                        : <AddRoundedIcon sx={{ fontSize: "1rem !important" }} />
                }
                disabled={isImported || isAdding}
                onClick={() => onAdd(question)}
                sx={{ textTransform: "none", flexShrink: 0, minWidth: 92 }}
            >
                {isImported ? "Added" : "Add"}
            </Button>
        </Box>
    );
}

function QuestionBankTab({ importedBankIds, onAddBankQuestion, addingBankId }) {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [category, setCategory] = useState("");
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const handle = setTimeout(() => setDebouncedSearch(search.trim()), 300);
        return () => clearTimeout(handle);
    }, [search]);

    const fetchBank = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: 1,
                pageSize: PAGE_SIZE,
                ...(debouncedSearch && { searchTerm: debouncedSearch }),
                ...(category !== "" && { category }),
            };
            const res = await callApi({
                method: METHOD.GET,
                endpoint: "/questions",
                arg: params,
                useGlobalLoading: false,
            });
            const payload = res?.data ?? {};
            const list = payload.items ?? payload.data ?? (Array.isArray(payload) ? payload : []);
            setItems(list);
        } catch (error) {
            console.error("Failed to load bank questions", error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, category]);

    useEffect(() => {
        fetchBank();
    }, [fetchBank]);

    const importedSet = useMemo(() => new Set((importedBankIds || []).map(String)), [importedBankIds]);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Stack direction="row" spacing={1} sx={{ p: 1.5, flexShrink: 0 }}>
                <TextField
                    size="small"
                    fullWidth
                    placeholder="Search bank questions"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />
                <TextField
                    select
                    size="small"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    sx={{ minWidth: 160 }}
                >
                    <MenuItem value="">All categories</MenuItem>
                    {CATEGORIES.filter((c) => c.value !== "").map((c) => (
                        <MenuItem key={c.value} value={c.value}>
                            {c.label}
                        </MenuItem>
                    ))}
                </TextField>
            </Stack>

            <Box sx={{ flex: 1, overflow: "auto", px: 1.5, pb: 1.5 }}>
                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : items.length === 0 ? (
                    <Stack alignItems="center" spacing={1} sx={{ py: 4, color: "text.secondary", textAlign: "center" }}>
                        <Typography variant="subtitle2" fontWeight={700}>
                            No questions match your filters
                        </Typography>
                        <Typography variant="caption">Try different keywords or clear the category filter.</Typography>
                    </Stack>
                ) : (
                    <Stack spacing={1.25}>
                        {items.map((q) => (
                            <BankRow
                                key={q.id}
                                question={q}
                                isImported={importedSet.has(String(q.id))}
                                isAdding={addingBankId === q.id}
                                onAdd={onAddBankQuestion}
                            />
                        ))}
                    </Stack>
                )}
            </Box>
        </Box>
    );
}

export default QuestionBankTab;
