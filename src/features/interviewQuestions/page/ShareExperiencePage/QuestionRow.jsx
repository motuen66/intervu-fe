import { useRef, useState } from "react";
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    IconButton,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LinkIcon from "@mui/icons-material/Link";
import EditIcon from "@mui/icons-material/Edit";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { interviewQuestionEndPoints } from "../../service/interviewQuestionApi";
import { QUESTION_TYPES, ROLES } from "../../../../common/constants/types";

const labelSx = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "text.secondary",
    display: "block",
    mb: 0.75,
};

export default function QuestionRow({ idx, q, onUpdateField, onRemove, showRemove, isPreLinked }) {
    const [suggestions, setSuggestions] = useState([]);
    const [suggestionsOpen, setSuggestionsOpen] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);
    const timerRef = useRef(null);

    /* ── search ─────────────────────────────────────────────── */
    const doSearch = async (kw) => {
        if (!kw.trim()) {
            setSuggestions([]);
            setSuggestionsOpen(false);
            return;
        }
        setSearchLoading(true);
        try {
            const { data } = await callApi({
                method: METHOD.GET,
                endpoint: interviewQuestionEndPoints.SEARCH,
                arg: { keyword: kw, limit: 10 },
            });
            const items = Array.isArray(data) ? data : (data?.items ?? data?.data ?? []);
            setSuggestions(items);
            setSuggestionsOpen(items.length > 0);
            setActiveIdx(-1);
        } catch {
            setSuggestions([]);
            setSuggestionsOpen(false);
        } finally {
            setSearchLoading(false);
        }
    };

    const WORD_LIMIT = 60;

    const handleInputChange = (e) => {
        let val = e.target.value || "";

        // Enforce word limit (100 words)
        const words = val.trim().split(/\s+/).filter(Boolean);
        if (words.length > WORD_LIMIT) {
            val = words.slice(0, WORD_LIMIT).join(" ");
        }

        if (q.linkedQuestion) {
            onUpdateField(idx, "linkedQuestion", null);
            onUpdateField(idx, "type", "");
        }

        onUpdateField(idx, "question", val);
        clearTimeout(timerRef.current);
        if (val.trim()) {
            timerRef.current = setTimeout(() => doSearch(val), 300);
        } else {
            setSuggestions([]);
            setSuggestionsOpen(false);
        }
    };

    /* ── select / clear ─────────────────────────────────────── */
    const selectSuggestion = (s) => {
        onUpdateField(idx, "linkedQuestion", s);
        onUpdateField(idx, "question", s.title);
        onUpdateField(idx, "type", s.category ?? s.questionType ?? "");
        setSuggestions([]);
        setSuggestionsOpen(false);
        setActiveIdx(-1);
    };

    const clearLinked = () => {
        onUpdateField(idx, "linkedQuestion", null);
        onUpdateField(idx, "question", "");
        onUpdateField(idx, "type", "");
        setSuggestions([]);
        setSuggestionsOpen(false);
    };

    const editLinked = () => {
        onUpdateField(idx, "linkedQuestion", null);
        if (isPreLinked) {
            onUpdateField(idx, "question", "");
            onUpdateField(idx, "type", "");
            onUpdateField(idx, "preLinked", false);
        }
        setSuggestions([]);
        setSuggestionsOpen(false);
    };

    const handleKeyDown = (e) => {
        if (!suggestionsOpen || !suggestions.length) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter" && activeIdx >= 0) {
            e.preventDefault();
            selectSuggestion(suggestions[activeIdx]);
        } else if (e.key === "Escape") {
            setSuggestionsOpen(false);
            setActiveIdx(-1);
        }
    };

    const roleLabel = q.linkedQuestion?.roles?.[0] ?? ROLES.find((r) => r.value === q.linkedQuestion?.role)?.label;
    const qtLabel = QUESTION_TYPES.find(
        (t) => t.value === (q.linkedQuestion?.category ?? q.linkedQuestion?.questionType),
    )?.label;

    return (
        <Paper variant="outlined" sx={{ p: 2, mb: 1.75, bgcolor: "grey.50", borderRadius: 2 }}>
            {/* Remove button */}
            {showRemove && (
                <Box textAlign="right" mb={0.5}>
                    <Button
                        size="small"
                        onClick={() => onRemove(idx)}
                        sx={{
                            color: "text.disabled",
                            textTransform: "none",
                            fontSize: 12,
                            p: 0,
                            minWidth: 0,
                            "&:hover": { color: "error.main" },
                        }}
                    >
                        Remove
                    </Button>
                </Box>
            )}

            {/* Question Type — only shown in free-text mode */}
            {!q.linkedQuestion && (
                <Box mb={1.75}>
                    <Typography sx={labelSx}>Question Type</Typography>
                    <Select
                        displayEmpty
                        value={q.type}
                        onChange={(e) => onUpdateField(idx, "type", e.target.value)}
                        size="small"
                        fullWidth
                        renderValue={(v) =>
                            v !== "" ? (
                                QUESTION_TYPES.find((t) => t.value === v)?.label
                            ) : (
                                <Box component="span" sx={{ color: "text.disabled" }}>
                                    Select Type
                                </Box>
                            )
                        }
                    >
                        {QUESTION_TYPES.map((t) => (
                            <MenuItem key={t.value} value={t.value}>
                                {t.label}
                            </MenuItem>
                        ))}
                    </Select>
                </Box>
            )}

            {/* Interview Question — typeahead or locked chip */}
            <Box mb={1.75}>
                <Typography sx={labelSx}>Interview Question</Typography>

                {/* Search input — hidden when question is pre-linked from navigation */}
                {!isPreLinked && (
                    <Box sx={{ position: "relative" }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="What were you asked? (type to search existing questions)"
                            value={q.question}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            onBlur={() => setTimeout(() => setSuggestionsOpen(false), 150)}
                            onFocus={() => {
                                if (suggestions.length > 0) setSuggestionsOpen(true);
                            }}
                            aria-autocomplete="list"
                            aria-haspopup="listbox"
                            aria-expanded={suggestionsOpen}
                            inputProps={{ "aria-label": "Interview question" }}
                            helperText={`${(q.question || "").trim().split(/\s+/).filter(Boolean).length} / ${WORD_LIMIT} words`}
                            InputProps={{
                                endAdornment: searchLoading ? (
                                    <CircularProgress size={14} sx={{ mr: 0.5 }} />
                                ) : undefined,
                            }}
                        />

                        {suggestionsOpen && suggestions.length > 0 && (
                            <Paper
                                elevation={4}
                                role="listbox"
                                aria-label="Question suggestions"
                                sx={{
                                    position: "absolute",
                                    left: 0,
                                    right: 0,
                                    top: "100%",
                                    mt: 0.5,
                                    zIndex: 1300,
                                    maxHeight: 280,
                                    overflowY: "auto",
                                    borderRadius: 1.5,
                                }}
                            >
                                {suggestions.map((s, i) => {
                                    const sRoleLabel = s.roles?.[0] ?? ROLES.find((r) => r.value === s.role)?.label;
                                    const sQtLabel = QUESTION_TYPES.find(
                                        (t) => t.value === (s.category ?? s.questionType),
                                    )?.label;
                                    const sCompany = s.companyNames?.[0] ?? s.companyName;
                                    return (
                                        <Box
                                            key={s.id}
                                            role="option"
                                            aria-selected={i === activeIdx}
                                            onClick={() => selectSuggestion(s)}
                                            onMouseEnter={() => setActiveIdx(i)}
                                            sx={{
                                                px: 2,
                                                py: 1.25,
                                                cursor: "pointer",
                                                bgcolor: i === activeIdx ? "action.hover" : "transparent",
                                                borderBottom: i < suggestions.length - 1 ? "1px solid" : "none",
                                                borderColor: "divider",
                                                "&:hover": { bgcolor: "action.hover" },
                                            }}
                                        >
                                            <Typography
                                                variant="body2"
                                                fontWeight={500}
                                                mb={0.25}
                                                sx={{
                                                    display: "-webkit-box",
                                                    WebkitBoxOrient: "vertical",
                                                    WebkitLineClamp: 2,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "normal",
                                                }}
                                            >
                                                {s.content}
                                            </Typography>
                                            <Stack direction="row" gap={0.5} flexWrap="wrap">
                                                {sCompany && (
                                                    <Typography variant="caption" color="text.disabled">
                                                        {sCompany}
                                                    </Typography>
                                                )}
                                                {sQtLabel && (
                                                    <Typography variant="caption" color="text.disabled">
                                                        &middot; {sQtLabel}
                                                    </Typography>
                                                )}
                                                {sRoleLabel && (
                                                    <Typography variant="caption" color="text.disabled">
                                                        &middot; {sRoleLabel}
                                                    </Typography>
                                                )}
                                                {(s.answerCount ?? s.commentCount) != null && (
                                                    <Typography variant="caption" color="text.disabled">
                                                        &middot; {s.answerCount ?? s.commentCount} answer
                                                        {(s.answerCount ?? s.commentCount) !== 1 ? "s" : ""}
                                                    </Typography>
                                                )}
                                            </Stack>
                                        </Box>
                                    );
                                })}
                            </Paper>
                        )}
                    </Box>
                )}

                {/* Linked question indicator — shown when a question is linked */}
                {q.linkedQuestion && (
                    <Box
                        sx={{
                            mt: isPreLinked ? 0 : 1,
                            border: "1px solid",
                            borderColor: "primary.main",
                            borderRadius: 1.5,
                            p: 1.25,
                            bgcolor: "primary.50",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 1,
                        }}
                    >
                        <LinkIcon sx={{ fontSize: 16, color: "primary.main", mt: "3px", flexShrink: 0 }} />
                        <Box flex={1} minWidth={0}>
                            <Typography variant="body2" fontWeight={600} color="primary.main" mb={0.25}>
                                Linked to existing question
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    lineHeight: 1.55,
                                    color: "text.primary",
                                    display: "-webkit-box",
                                    WebkitBoxOrient: "vertical",
                                    WebkitLineClamp: 2,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "normal",
                                }}
                            >
                                {q.linkedQuestion.content}
                            </Typography>
                            <Stack direction="row" gap={0.75} mt={0.75} flexWrap="wrap">
                                {(q.linkedQuestion.companyNames?.[0] ?? q.linkedQuestion.companyName) && (
                                    <Chip
                                        label={q.linkedQuestion.companyNames?.[0] ?? q.linkedQuestion.companyName}
                                        size="small"
                                        sx={{ fontSize: 11, bgcolor: "grey.100" }}
                                    />
                                )}
                                {qtLabel && (
                                    <Chip label={qtLabel} size="small" sx={{ fontSize: 11, bgcolor: "grey.100" }} />
                                )}
                                {roleLabel && (
                                    <Chip label={roleLabel} size="small" sx={{ fontSize: 11, bgcolor: "grey.100" }} />
                                )}
                                {q.linkedQuestion.commentCount != null && (
                                    <Chip
                                        label={`${q.linkedQuestion.answerCount ?? q.linkedQuestion.commentCount} answer${(q.linkedQuestion.answerCount ?? q.linkedQuestion.commentCount) !== 1 ? "s" : ""}`}
                                        size="small"
                                        sx={{ fontSize: 11, bgcolor: "grey.100" }}
                                    />
                                )}
                            </Stack>
                        </Box>
                        <Tooltip title="Edit / choose another question">
                            <IconButton
                                size="small"
                                onClick={editLinked}
                                aria-label="Edit linked question"
                                sx={{
                                    flexShrink: 0,
                                    color: "text.disabled",
                                    "&:hover": { color: "primary.main" },
                                }}
                            >
                                <EditIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Clear selection">
                            <IconButton
                                size="small"
                                onClick={clearLinked}
                                aria-label="Clear linked question"
                                sx={{
                                    flexShrink: 0,
                                    color: "text.disabled",
                                    "&:hover": { color: "error.main" },
                                }}
                            >
                                <CloseIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                )}
            </Box>

            {/* Answer */}
            <Box>
                <Typography sx={labelSx}>
                    {q.linkedQuestion ? (
                        <>
                            Your Answer{" "}
                            <Box
                                component="span"
                                sx={{
                                    fontWeight: 400,
                                    textTransform: "none",
                                    color: "primary.main",
                                    fontSize: 11,
                                }}
                            >
                                (will be posted as an answer on the linked question)
                            </Box>
                        </>
                    ) : (
                        <>
                            Answer{" "}
                            <Box
                                component="span"
                                sx={{ fontWeight: 400, textTransform: "none", color: "text.disabled" }}
                            >
                                (optional)
                            </Box>
                        </>
                    )}
                </Typography>
                <div className="se-editor-wrap">
                    <ReactQuill
                        theme="snow"
                        value={q.answer}
                        onChange={(val) => onUpdateField(idx, "answer", val)}
                        placeholder="How did you respond? The more detailed, the better."
                    />
                </div>
            </Box>
        </Paper>
    );
}
