import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Button, Checkbox, FormControlLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { callApi } from "../../../../common/utils/apiConnector";
import { htmlToPlainText, isQuillEmpty } from "../../../../common/utils/richTextHelper";
import { METHOD } from "../../../../common/constants/api";
import { interviewExperienceEndPoints } from "../../service/interviewExperienceApi";
import { commentEndPoints } from "../../service/commentApi";
import { homeEndPoints } from "../../../home/services/homeApi";
import toast from "react-hot-toast";
import "./ShareExperiencePage.css";
import { LEVELS, ROLES, ROUNDS } from "../../../../common/constants/types";
import QuestionRow from "./QuestionRow";

const emptyQuestion = () => ({ type: "", question: "", answer: "", linkedQuestion: null });

const labelSx = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "text.secondary",
    display: "block",
    mb: 0.75,
};

export default function ShareExperiencePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [companyId, setCompanyId] = useState("");
    const [companies, setCompanies] = useState([]);
    const [loadingCompanies, setLoadingCompanies] = useState(false);
    const [role, setRole] = useState("");
    const [level, setLevel] = useState("");
    const [lastRound, setLastRound] = useState("");
    const [process, setProcess] = useState("");
    const [allowContact, setAllowContact] = useState(true);
    const [questions, setQuestions] = useState(() => {
        const linked = location.state?.linkedQuestion ?? null;
        if (linked) {
            return [
                {
                    type: linked.category ?? "",
                    question: linked.content ?? linked.title ?? "",
                    answer: "",
                    linkedQuestion: linked,
                    preLinked: true,
                },
            ];
        }
        return [emptyQuestion()];
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setLoadingCompanies(true);
        callApi({
            method: METHOD.GET,
            endpoint: homeEndPoints.GET_ALL_COMPANIES,
            arg: { page: 1, pageSize: 200 },
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
            .catch(() => setCompanies([]))
            .finally(() => setLoadingCompanies(false));
    }, []);

    const companyLabelById = useMemo(() => {
        const map = new Map();
        companies.forEach((c) => map.set(String(c.id), c.name));
        return map;
    }, [companies]);

    const updateQuestionField = (idx, field, value) =>
        setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q)));

    const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);

    const removeQuestion = (idx) => setQuestions((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

    const handleSubmit = async () => {
        if (!companyId) {
            toast.error("Please select a company");
            return;
        }

        if (!role) {
            toast.error("Please select a role");
            return;
        }

        if (!lastRound) {
            toast.error("Please select last round completed");
            return;
        }

        const filledQuestions = questions.filter(
            (q) => q.question?.trim() || q.linkedQuestion || !isQuillEmpty(q.answer),
        );

        if (filledQuestions.length === 0) {
            toast.error("Please add at least one question");
            return;
        }

        const payloadQuestions = filledQuestions.map((q) => ({
            linkedQuestionId: q.linkedQuestion?.id ?? null,
            title: (q.linkedQuestion?.content ?? q.question?.trim()) || undefined,
            content: (q.linkedQuestion?.content ?? q.question?.trim()) || undefined,
            level: level || undefined,
            round: lastRound || undefined,
            category: q.type || undefined,
            answer: isQuillEmpty(q.answer) ? "" : htmlToPlainText(q.answer),
            companyIds: q.linkedQuestion ? [] : companyId ? [companyId] : [],
            roles: q.linkedQuestion ? [] : role ? [role] : [],
            tagIds: [],
        }));

        try {
            setSubmitting(true);

            await callApi({
                method: METHOD.POST,
                endpoint: interviewExperienceEndPoints.CREATE,
                arg: {
                    companyId,
                    role,
                    level: level || null,
                    lastRoundCompleted: lastRound,
                    interviewProcess: htmlToPlainText(process),
                    isInterestedInContact: allowContact,
                    questions: payloadQuestions,
                },
            });

            toast.success("Experience shared successfully!");
            navigate("/questions");
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong!");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 680, mx: "auto", px: 3, py: 6 }}>
            {/* Header */}
            <Box textAlign="center" mb={4.5}>
                <Typography variant="h4" mb={1}>
                    Share your interview experience
                </Typography>
                <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
                    Help improve the Intervu community by sharing your recent interview experience! Interview questions
                    that are detailed and clearly written will be added to the question database.{" "}
                    <Box
                        component="span"
                        sx={{ color: "primary.main", textDecoration: "underline", cursor: "pointer" }}
                    >
                        Review Community Guidelines.
                    </Box>
                </Typography>
            </Box>

            {/* Company */}
            <Box mb={2.75}>
                <Typography sx={labelSx}>Company *</Typography>
                <Select
                    displayEmpty
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    size="small"
                    fullWidth
                    disabled={loadingCompanies}
                    renderValue={(v) =>
                        v ? (
                            (companyLabelById.get(String(v)) ?? "Selected company")
                        ) : (
                            <Box component="span" sx={{ color: "text.disabled" }}>
                                {loadingCompanies ? "Loading companies..." : "Select Company"}
                            </Box>
                        )
                    }
                >
                    {companies.map((c) => (
                        <MenuItem key={String(c.id)} value={String(c.id)}>
                            {c.name}
                        </MenuItem>
                    ))}
                </Select>
            </Box>

            {/* Role / Level / Last Round */}
            <Stack direction={{ xs: "column", sm: "row" }} gap={1.75} mb={2.75}>
                <Box flex={1}>
                    <Typography sx={labelSx}>Role *</Typography>
                    <Select
                        displayEmpty
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        size="small"
                        fullWidth
                        renderValue={(v) =>
                            v !== "" ? (
                                ROLES.find((r) => r.value === v)?.label
                            ) : (
                                <Box component="span" sx={{ color: "text.disabled" }}>
                                    Select Role
                                </Box>
                            )
                        }
                    >
                        {ROLES.filter((r) => r.value !== "").map((r) => (
                            <MenuItem key={r.value} value={r.value}>
                                {r.label}
                            </MenuItem>
                        ))}
                    </Select>
                </Box>
                <Box flex={1}>
                    <Typography sx={labelSx}>
                        Level{" "}
                        <Box
                            component="span"
                            sx={{ fontWeight: 400, textTransform: "none", color: "text.disabled", fontSize: 11 }}
                        >
                            (optional)
                        </Box>
                    </Typography>
                    <Select
                        displayEmpty
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        size="small"
                        fullWidth
                        renderValue={(v) =>
                            v !== "" && v !== null && v !== undefined ? (
                                LEVELS.find((l) => l.value === v)?.label
                            ) : (
                                <Box component="span" sx={{ color: "text.disabled" }}>
                                    Select Level
                                </Box>
                            )
                        }
                    >
                        {LEVELS.filter((l) => l.value !== "").map((l) => (
                            <MenuItem key={l.value} value={l.value}>
                                {l.label}
                            </MenuItem>
                        ))}
                    </Select>
                </Box>
                <Box flex={1}>
                    <Typography sx={labelSx}>Last Round Completed *</Typography>
                    <Select
                        displayEmpty
                        value={lastRound}
                        onChange={(e) => setLastRound(e.target.value)}
                        size="small"
                        fullWidth
                        renderValue={(v) =>
                            v !== "" ? (
                                ROUNDS.find((r) => r.value === v)?.label
                            ) : (
                                <Box component="span" sx={{ color: "text.disabled" }}>
                                    Select Round
                                </Box>
                            )
                        }
                    >
                        {ROUNDS.map((r) => (
                            <MenuItem key={r.value} value={r.value}>
                                {r.label}
                            </MenuItem>
                        ))}
                    </Select>
                </Box>
            </Stack>

            {/* Interview Process */}
            <Box mb={2.75}>
                <Typography sx={labelSx}>Interview Process *</Typography>
                <Typography variant="caption" color="text.disabled" display="block" mb={0.75}>
                    Share your interview experience include details about the process, format, and any advice
                </Typography>
                <div className="se-editor-wrap">
                    <ReactQuill
                        theme="snow"
                        value={process}
                        onChange={setProcess}
                        placeholder={"1. Recruiter screen (30 min)\n2. Online coding assessment (1 hr)\n..."}
                    />
                </div>
            </Box>

            {/* Allow contact */}
            <FormControlLabel
                control={
                    <Checkbox
                        checked={allowContact}
                        onChange={(e) => setAllowContact(e.target.checked)}
                        size="small"
                        sx={{ color: "primary.main" }}
                    />
                }
                label={
                    <Typography variant="body2" color="text.secondary">
                        I&apos;m interested in getting contacted by the Intervu team to share more about my interview
                        experience
                    </Typography>
                }
                sx={{ mb: 3.5, alignItems: "flex-start" }}
            />

            {/* Interview Questions */}
            <Box mb={3.5}>
                <Typography sx={labelSx}>
                    Interview Questions{" "}
                    <Box component="span" sx={{ fontWeight: 400, textTransform: "none", color: "text.disabled" }}>
                        {/* (optional) */}
                    </Box>
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={1.75}>
                    Add the specific questions you were asked to build our interview question database
                </Typography>

                {questions.map((q, idx) => (
                    <QuestionRow
                        key={idx}
                        idx={idx}
                        q={q}
                        onUpdateField={updateQuestionField}
                        onRemove={removeQuestion}
                        showRemove={questions.length > 1}
                        isPreLinked={q.preLinked ?? false}
                    />
                ))}

                <Button
                    startIcon={<AddIcon />}
                    onClick={addQuestion}
                    sx={{
                        color: "primary.main",
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: 13,
                        p: 0,
                        "&:hover": { textDecoration: "underline", background: "none" },
                    }}
                >
                    ADD ANOTHER QUESTION
                </Button>
            </Box>

            {/* Footer */}
            <Stack alignItems="center" gap={1.5} mt={4.5}>
                <Button
                    variant="contained"
                    fullWidth
                    onClick={handleSubmit}
                    disabled={submitting}
                    sx={{ maxWidth: 340, py: 1.5, fontSize: 15 }}
                >
                    {submitting ? "Submitting..." : "Submit Experience"}
                </Button>
                <Button
                    variant="text"
                    onClick={() => navigate("/questions")}
                    sx={{
                        color: "text.secondary",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontSize: 13,
                        fontWeight: 600,
                        "&:hover": { color: "text.primary", background: "none" },
                    }}
                >
                    Discard and go back
                </Button>
            </Stack>
        </Box>
    );
}
