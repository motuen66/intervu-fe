import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Chip,
    LinearProgress,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import { alpha } from "@mui/material/styles";
import { useAssessment } from "../context/AssessmentContext";
import { PrimaryButton } from "../../../../../common/components/buttons";
import {
    getAssessmentData,
    mapAssessmentPayloadToResult,
    normalizeEvaluateResponse,
    setAssessmentForceRequired,
} from "../helpers/assessmentHelper";

const statusVisualMap = {
    good: {
        label: "Ready",
        main: "#16a34a",
        soft: alpha("#16a34a", 0.12),
        border: alpha("#16a34a", 0.28),
        text: "#166534",
    },
    medium: {
        label: "On Track",
        main: "#eab308",
        soft: alpha("#eab308", 0.16),
        border: alpha("#eab308", 0.36),
        text: "#854d0e",
    },
    weak: {
        label: "Needs Work",
        main: "#f97316",
        soft: alpha("#f97316", 0.12),
        border: alpha("#f97316", 0.28),
        text: "#9a3412",
    },
    missing: {
        label: "Missing",
        main: "#ef4444",
        soft: alpha("#ef4444", 0.1),
        border: alpha("#ef4444", 0.24),
        text: "#991b1b",
    },
};

const TECHSTACK_GROUP_HINTS = {
    react: { categories: ["Frontend"], keywords: ["react", "frontend", "ui", "component"] },
    typescript: { categories: ["Frontend"], keywords: ["typescript", "javascript", "ts", "js"] },
    "node.js": { categories: ["Backend"], keywords: ["node", "backend", "api", "server"] },
    net: { categories: ["Backend"], keywords: [".net", "asp.net", "dotnet", "c#"] },
    ".net": { categories: ["Backend"], keywords: [".net", "asp.net", "dotnet", "c#"] },
    java: { categories: ["Backend"], keywords: ["java", "spring", "backend"] },
    "spring boot": { categories: ["Backend"], keywords: ["spring", "java", "api"] },
    go: { categories: ["Backend"], keywords: ["go", "golang", "backend"] },
    python: { categories: ["Backend"], keywords: ["python", "django", "flask", "fastapi"] },
    sql: { categories: ["Backend"], keywords: ["sql", "database", "query", "schema", "table", "join"] },
    postgresql: { categories: ["Backend"], keywords: ["postgresql", "postgres", "sql", "database", "query"] },
    aws: { categories: ["Backend"], keywords: ["aws", "cloud", "deployment"] },
    graphql: { categories: ["Backend", "Frontend"], keywords: ["graphql", "schema", "resolver"] },
};

const GENERIC_BACKEND_KEYWORDS = [
    "backend",
    "api",
    "service",
    "microservice",
    "endpoint",
    "authorize",
    "authorization",
    "auth",
    "authentication",
    "jwt",
    "oauth",
    "deployment",
    "deploy",
    "docker",
    "kubernetes",
    "ci/cd",
    "pipeline",
    "monitoring",
    "logging",
    "queue",
    "cache",
    "caching",
    "security",
    "identity",
    "token",
    "session",
    "permissions",
    "rbac",
    "authz",
];

const levelLabel = {
    0: "Missing",
    1: "Basic",
    2: "Intermediate",
    3: "Advanced",
    4: "Expert",
};

const normalizeText = (value) =>
    String(value || "")
        .trim()
        .toLowerCase();

const toArray = (value) => {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === "string") {
        return value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return [];
};

const inferSkillCategory = (skillName) => {
    const normalized = normalizeText(skillName);
    if (!normalized) {
        return "General";
    }

    const hints = Object.values(TECHSTACK_GROUP_HINTS);
    const matched = hints.find((hint) => (hint.keywords || []).some((keyword) => normalized.includes(keyword)));
    if (matched?.categories?.length) {
        return matched.categories[0];
    }

    if (GENERIC_BACKEND_KEYWORDS.some((keyword) => keyword && normalized.includes(keyword))) {
        return "Backend";
    }

    return "General";
};

const toNumericLevelCode = (value) => {
    const normalized = normalizeText(value);
    if (["0", "missing", "none"].includes(normalized)) return "0";
    if (["1", "basic", "beginner", "junior", "entry"].includes(normalized)) return "1";
    if (["2", "intermediate", "mid"].includes(normalized)) return "2";
    if (["3", "advanced", "senior"].includes(normalized)) return "3";
    if (["4", "expert", "lead", "principal", "staff"].includes(normalized)) return "4";
    return "0";
};

const toPercentScore = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return 0;
    return Math.max(0, Math.min(100, num));
};

const toOverallPercentScore = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return null;
    const asPercent = num <= 4 ? num * 25 : num;
    return Math.max(0, Math.min(100, asPercent));
};

const toStatusByScore = (score, isMissing) => {
    if (isMissing || score <= 0) return "missing";
    if (score < 50) return "weak";
    if (score < 75) return "medium";
    return "good";
};

const buildLevelBreakdown = (skills = []) => {
    const initial = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    skills.forEach((item) => {
        const levelCode = Number(toNumericLevelCode(item?.levelCode ?? item?.selectedLevel));
        if (Number.isInteger(levelCode) && levelCode >= 0 && levelCode <= 4) {
            initial[levelCode] += 1;
        }
    });
    return initial;
};

const ResultDashboard = () => {
    const navigate = useNavigate();
    const {
        answers,
        surveyResult,
        lastMatchPercentage,
        saveAssessmentSnapshot,
        roadmap,
        setAnswers,
        setSkillScores,
        updateMatchPercentage,
    } = useAssessment();
    const [isSaving, setIsSaving] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState({});
    const [expandedSkills, setExpandedSkills] = useState({});
    const profile = answers?.profile || {};
    const refreshedUserRef = useRef(null);

    useEffect(() => {
        try {
            const reloadState = sessionStorage.getItem("assessment_result_hard_reload");
            if (reloadState === "ready") {
                sessionStorage.setItem("assessment_result_hard_reload", "done");
                window.location.reload();
                return;
            }
            if (reloadState === "done") {
                sessionStorage.removeItem("assessment_result_hard_reload");
            }
        } catch {
            // ignore storage access issues
        }
    }, []);

    const { summaryText, calculatedSkillScores, overallScorePercent, overallLevelText, resolvedProfile } = useMemo(() => {
        const rawPayload = surveyResult?.data || surveyResult || answers?.evaluateResponse || null;
        const normalized = rawPayload ? normalizeEvaluateResponse(rawPayload) : null;

        if (normalized?.answer) {
            const answerBlock = normalized.answer;
            const apiProfile = answerBlock?.profile && typeof answerBlock.profile === "object" ? answerBlock.profile : {};
            const mergedProfile = {
                ...(profile || {}),
                ...(apiProfile || {}),
                techstack: toArray(apiProfile?.techstack ?? profile?.techstack),
                domain: toArray(apiProfile?.domain ?? profile?.domain),
            };
            const responseSkillsList = Array.isArray(answerBlock?.responses) ? answerBlock.responses : [];
            const calculatedFromResponses = Array.from(
                responseSkillsList.reduce((acc, item) => {
                    const skillKey = String(item?.skill || "").trim();
                    if (!skillKey) return acc;
                    const responseScore = toPercentScore(item?.score);
                    const levelCode = toNumericLevelCode(item?.selectedLevel);
                    const numericLevel = Number(levelCode);
                    const bucket = acc.get(skillKey) || { scoreTotal: 0, count: 0, levelTotal: 0, missingCount: 0 };
                    bucket.scoreTotal +=
                        responseScore > 0
                            ? responseScore
                            : Math.max(0, Math.min(100, Math.round((numericLevel / 4) * 100)));
                    bucket.levelTotal += numericLevel;
                    bucket.count += 1;
                    if (Boolean(item?.isMissing)) {
                        bucket.missingCount += 1;
                    }
                    acc.set(skillKey, bucket);
                    return acc;
                }, new Map()),
            )
                .map(([skillKey, aggregated]) => {
                    const avgScore = aggregated.count ? Math.round(aggregated.scoreTotal / aggregated.count) : 0;
                    const avgLevel = aggregated.count ? Math.round(aggregated.levelTotal / aggregated.count) : 0;
                    const levelCode = String(avgLevel);
                    const isMissing = levelCode === "0" || avgScore <= 0 || aggregated.missingCount > 0;
                    return {
                        skillKey,
                        status: toStatusByScore(avgScore, isMissing),
                        score: avgScore,
                        levelCode,
                        sfiaLevel: 0,
                        selectedLevel: levelLabel[levelCode] || levelLabel["0"],
                        category: inferSkillCategory(skillKey),
                    };
                })
                .sort((a, b) => b.score - a.score);

            const overallPercent = toOverallPercentScore(answerBlock?.overallScore);

            return {
                summaryText: String(normalized?.summaryText || ""),
                calculatedSkillScores: calculatedFromResponses,
                overallScorePercent: overallPercent,
                overallLevelText: String(answerBlock?.overallLevel || "None"),
                resolvedProfile: mergedProfile,
            };
        }

        return {
            summaryText: "",
            calculatedSkillScores: [],
            overallScorePercent: null,
            overallLevelText: "None",
            resolvedProfile: {
                ...(profile || {}),
                techstack: toArray(profile?.techstack),
                domain: toArray(profile?.domain),
            },
        };
    }, [answers?.evaluateResponse, profile, surveyResult]);

    // Refresh once per user only when result data is missing/incomplete.
    useEffect(() => {
        let cancelled = false;

        const tryRefresh = async () => {
            const userId = answers?.userId;
            if (!userId) return;

            const normalizedExisting = normalizeEvaluateResponse(
                surveyResult?.data || surveyResult || answers?.evaluateResponse || null,
            );
            const hasResponseData =
                Array.isArray(normalizedExisting?.answer?.responses) && normalizedExisting.answer.responses.length > 0;

            if (hasResponseData || refreshedUserRef.current === userId) return;
            refreshedUserRef.current = userId;

            try {
                const data = await getAssessmentData(userId);
                if (!data || cancelled) return;
                const mapped = mapAssessmentPayloadToResult(data, userId);
                if (mapped && !cancelled) {
                    setAnswers(mapped.answers);
                    setSkillScores(mapped.skillScores || []);
                    updateMatchPercentage(mapped.matchPercentage || 0);
                }
            } catch (err) {
                // ignore - keep showing whatever we have
            }
        };

        tryRefresh();

        return () => {
            cancelled = true;
        };
    }, [answers?.evaluateResponse, answers?.userId, setAnswers, setSkillScores, surveyResult, updateMatchPercentage]);

    const displaySkillScores = calculatedSkillScores;
    const groupedSkillCards = useMemo(() => {
        const levelBreakdown = buildLevelBreakdown(displaySkillScores);
        return [
            {
                id: "assessment-skills",
                title: "Skills from API",
                score: displaySkillScores.length
                    ? Math.round(
                          displaySkillScores.reduce((sum, item) => sum + (Number(item?.score) || 0), 0) /
                              displaySkillScores.length,
                      )
                    : 0,
                count: displaySkillScores.length,
                missingCount: displaySkillScores.filter((item) => item?.status === "missing").length,
                weakCount: displaySkillScores.filter((item) => item?.status === "weak").length,
                levelBreakdown,
                skills: displaySkillScores,
            },
        ];
    }, [displaySkillScores]);

    const effectiveMatchPercentage = useMemo(() => {
        if (overallScorePercent != null && Number.isFinite(Number(overallScorePercent))) {
            return Number(overallScorePercent);
        }
        if (!displaySkillScores.length) return 0;
        return Math.round(
            displaySkillScores.reduce((sum, item) => sum + (item.score || 0), 0) / displaySkillScores.length,
        );
    }, [displaySkillScores, overallScorePercent]);

    const strongestSkills = useMemo(
        () =>
            displaySkillScores
                .slice()
                .sort((a, b) => b.score - a.score)
                .slice(0, 3),
        [displaySkillScores],
    );
    const blockingSkills = useMemo(
        () => displaySkillScores.filter((skill) => skill.status === "weak" || skill.status === "missing"),
        [displaySkillScores],
    );
    const interviewReady = displaySkillScores.length > 0 && blockingSkills.length === 0;
    const focusSkills = useMemo(() => blockingSkills.slice(0, 3), [blockingSkills]);
    const mediumSkills = useMemo(
        () => displaySkillScores.filter((skill) => skill.status === "medium"),
        [displaySkillScores],
    );
    const summaryTone = interviewReady
        ? statusVisualMap.good
        : effectiveMatchPercentage >= 70
          ? statusVisualMap.medium
          : statusVisualMap.weak;
    const readinessHeadline = interviewReady
        ? `You can start ${resolvedProfile.role || "interview"} practice directly.`
        : focusSkills.length
          ? `Focus next on ${focusSkills.map((skill) => skill.skillKey).join(", ")}.`
          : `Keep strengthening ${resolvedProfile.role || "your interview"} momentum.`;
    const readinessBody = interviewReady
        ? `Benchmarked against ${resolvedProfile.level || "your target"} expectations, your current tech stack is ready for mock interviews and real interview reps.`
        : mediumSkills.length
          ? `${mediumSkills.map((skill) => skill.skillKey).join(", ")} is already on track for ${resolvedProfile.level || "your target level"}, but you still have a few core gaps to close first.`
          : `Your score is based on your submitted answers from the assessment.`;
    const overallCaption = `Overall level: ${overallLevelText || "None"}`;
    const hasRoadmap = Boolean(
        (Array.isArray(roadmap?.today) && roadmap.today.length > 0) ||
            (Array.isArray(roadmap?.weeks) && roadmap.weeks.length > 0) ||
            (Array.isArray(roadmap?.phases) && roadmap.phases.length > 0),
    );

    const renderSkillRow = (skill, groupId) => {
        const skillId = `${groupId}-${normalizeText(skill.skillKey)}`;
        const isExpanded = expandedSkills[skillId] ?? false;
        const levelCode = toNumericLevelCode(skill.levelCode ?? skill.selectedLevel);
        const resolvedLevelLabel = levelLabel[levelCode] || skill.selectedLevel || "Missing";

        return (
            <Accordion
                key={skill.skillKey}
                expanded={isExpanded}
                onChange={() =>
                    setExpandedSkills((prev) => ({
                        ...prev,
                        [skillId]: !isExpanded,
                    }))
                }
                disableGutters
                elevation={0}
                sx={{
                    border: "1px solid",
                    borderColor: alpha("#cbd5e1", 0.8),
                    borderRadius: 2,
                    overflow: "hidden",
                    "&:before": { display: "none" },
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreRoundedIcon />}
                    sx={{
                        px: 2,
                        py: 1,
                        bgcolor: alpha("#f8fafc", 0.78),
                    }}
                >
                    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1} width="100%">
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                            <Typography fontWeight={700}>{skill.skillKey}</Typography>
                            <Chip
                                label={(statusVisualMap[skill.status?.toLowerCase()] || statusVisualMap.medium).label}
                                size="small"
                                variant="outlined"
                                sx={{
                                    bgcolor: (statusVisualMap[skill.status?.toLowerCase()] || statusVisualMap.medium).soft,
                                    borderColor: (statusVisualMap[skill.status?.toLowerCase()] || statusVisualMap.medium)
                                        .border,
                                    color: (statusVisualMap[skill.status?.toLowerCase()] || statusVisualMap.medium).text,
                                    fontWeight: 700,
                                }}
                            />
                        </Stack>
                        <Typography variant="body2" color="text.secondary" fontWeight={700}>
                            {skill.score}% - Level {levelCode}
                        </Typography>
                    </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 2, py: 1.75 }}>
                    <LinearProgress
                        variant="determinate"
                        value={skill.score}
                        sx={{
                            height: 10,
                            borderRadius: 999,
                            bgcolor: (statusVisualMap[skill.status?.toLowerCase()] || statusVisualMap.medium).soft,
                            "& .MuiLinearProgress-bar": {
                                borderRadius: 999,
                                bgcolor: (statusVisualMap[skill.status?.toLowerCase()] || statusVisualMap.medium).main,
                            },
                        }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block" }}>
                        Level detail: {resolvedLevelLabel} (Level {levelCode})
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: "block" }}>
                        {skill.score}% ready for {resolvedProfile.level || "your chosen"} benchmark
                    </Typography>
                </AccordionDetails>
            </Accordion>
        );
    };

    const handleViewRoadmap = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            await saveAssessmentSnapshot();
            navigate("/roadmap");
        } finally {
            setIsSaving(false);
        }
    };

    const handleGoHome = () => {
        if (answers?.userId) {
            setAssessmentForceRequired(answers.userId, false);
        }
        navigate("/home");
    };

    return (
        <Box sx={{ maxWidth: 1120, mx: "auto", px: 3, p: 8 }}>
            <Stack spacing={4}>
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "320px 1fr" },
                        gap: 3,
                    }}
                >
                    <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: "1px solid", borderColor: "divider" }}>
                        <Typography variant="overline" color="text.secondary" fontWeight={700}>
                            Job Match Score
                        </Typography>
                        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
                            <Box
                                sx={{
                                    width: 180,
                                    height: 180,
                                    borderRadius: "50%",
                                    background: `conic-gradient(${summaryTone.main} ${effectiveMatchPercentage * 3.6}deg, #e5e7eb 0deg)`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 132,
                                        height: 132,
                                        borderRadius: "50%",
                                        bgcolor: "background.paper",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <Typography variant="h3" fontWeight={800}>
                                        {effectiveMatchPercentage}%
                                    </Typography>
                                    {effectiveMatchPercentage > lastMatchPercentage ? (
                                        <Chip
                                            icon={<TrendingUpRoundedIcon />}
                                            label={`+${effectiveMatchPercentage - lastMatchPercentage}%`}
                                            color="success"
                                            size="small"
                                            sx={{ mt: 1 }}
                                        />
                                    ) : null}
                                </Box>
                            </Box>
                        </Box>
                        <Typography color="text.secondary" textAlign="center">
                            Calibrated for a {resolvedProfile.level || "target"} {resolvedProfile.role || "role"} using your real tech
                            stack answers, not just a generic average.
                        </Typography>
                        <Typography color="text.secondary" textAlign="center" sx={{ mt: 0.75 }}>
                            {overallCaption}
                        </Typography>
                        {summaryText ? (
                            <Typography color="text.secondary" textAlign="center" sx={{ mt: 1.5, whiteSpace: "pre-line" }}>
                                {summaryText}
                            </Typography>
                        ) : null}
                    </Paper>

                    <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: "1px solid", borderColor: "divider" }}>
                        <Typography variant="overline" color="text.secondary" fontWeight={700}>
                            Skill Breakdown
                        </Typography>
                        <Stack spacing={1.5} sx={{ mt: 3 }}>
                            {groupedSkillCards.map((group) => {
                                const isExpanded = expandedGroups[group.id] ?? true;
                                return (
                                    <Accordion
                                        key={group.id}
                                        expanded={isExpanded}
                                        onChange={() =>
                                            setExpandedGroups((prev) => ({
                                                ...prev,
                                                [group.id]: !isExpanded,
                                            }))
                                        }
                                        disableGutters
                                        elevation={0}
                                        sx={{
                                            border: "1px solid",
                                            borderColor: alpha("#cbd5e1", 0.8),
                                            borderRadius: 2,
                                            overflow: "hidden",
                                            "&:before": { display: "none" },
                                        }}
                                    >
                                        <AccordionSummary
                                            expandIcon={<ExpandMoreRoundedIcon />}
                                            sx={{
                                                px: 2,
                                                py: 1,
                                                bgcolor: alpha("#f8fafc", 0.85),
                                            }}
                                        >
                                            <Stack width="100%" spacing={1}>
                                                <Stack
                                                    direction={{ xs: "column", sm: "row" }}
                                                    justifyContent="space-between"
                                                    spacing={1}
                                                >
                                                    <Typography fontWeight={800}>{group.title}</Typography>
                                                    <Typography variant="body2" color="text.secondary" fontWeight={700}>
                                                        {group.score}% - {group.count} skills
                                                    </Typography>
                                                </Stack>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={group.score}
                                                    sx={{
                                                        height: 8,
                                                        borderRadius: 999,
                                                        bgcolor: alpha("#64748b", 0.16),
                                                        "& .MuiLinearProgress-bar": {
                                                            borderRadius: 999,
                                                            bgcolor:
                                                                group.score >= 75
                                                                    ? "#16a34a"
                                                                    : group.score >= 45
                                                                      ? "#eab308"
                                                                      : "#ef4444",
                                                        },
                                                    }}
                                                />
                                                {group.missingCount > 0 || group.weakCount > 0 ? (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {group.missingCount} missing - {group.weakCount} weak
                                                    </Typography>
                                                ) : null}
                                                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                                    {[0, 1, 2, 3, 4].map((code) => {
                                                        const count = Number(group?.levelBreakdown?.[code]) || 0;
                                                        if (count <= 0) return null;
                                                        return (
                                                            <Chip
                                                                key={`${group.id}-level-${code}`}
                                                                size="small"
                                                                variant="outlined"
                                                                label={`L${code} ${levelLabel[code]}: ${count}`}
                                                                sx={{
                                                                    bgcolor: alpha("#ffffff", 0.72),
                                                                    borderColor: alpha("#94a3b8", 0.5),
                                                                }}
                                                            />
                                                        );
                                                    })}
                                                </Stack>
                                            </Stack>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ px: 2, py: 2 }}>
                                            {group.skills.length > 0 ? (
                                                <Stack spacing={2.5}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                                        Child skills in {group.title}:
                                                    </Typography>
                                                    {group.skills.map((skill) => renderSkillRow(skill, group.id))}
                                                </Stack>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    No detailed child skills matched in this group yet.
                                                </Typography>
                                            )}
                                        </AccordionDetails>
                                    </Accordion>
                                );
                            })}
                        </Stack>
                        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="flex-end" spacing={1.25} sx={{ mt: 3 }}>
                            <PrimaryButton
                                size="small"
                                loading={isSaving}
                                onClick={handleViewRoadmap}
                                sx={{
                                    minWidth: 132,
                                    minHeight: 38,
                                    py: 0.55,
                                    textTransform: "none",
                                    fontWeight: 800,
                                    bgcolor: "#b7ef4e",
                                    color: "#1f2937",
                                    "&:hover": { bgcolor: "#a6dd41" },
                                }}
                            >
                                {hasRoadmap ? "View Roadmap" : "Generate Roadmap"}
                            </PrimaryButton>
                        </Stack>
                    </Paper>
                </Box>
            </Stack>
        </Box>
    );
};

export default ResultDashboard;
