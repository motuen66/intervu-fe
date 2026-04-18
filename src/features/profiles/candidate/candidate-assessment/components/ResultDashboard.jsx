import React, { useMemo, useState } from "react";
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
import { setAssessmentForceRequired } from "../helpers/assessmentHelper";

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

const DATABASE_KEYWORDS = ["sql", "database", "query", "schema", "table", "join", "postgres", "mysql", "mssql"];
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

const BACKEND_STACK_FALLBACK_KEYWORDS = [
    "backend",
    "api",
    "server",
    "service",
    "node",
    "express",
    ".net",
    "dotnet",
    "asp.net",
    "c#",
    "java",
    "spring",
    "go",
    "golang",
    "python",
    "django",
    "flask",
    "fastapi",
    "graphql",
    "sql",
    "postgres",
    "mysql",
    "mssql",
    "aws",
    "cloud",
    "deployment",
];

const levelLabel = {
    0: "Missing",
    1: "Basic",
    2: "Intermediate",
    3: "Advanced",
    4: "Expert",
};

const mapProfileLevelToTargetSfia = (level) => {
    const normalized = String(level || "").toLowerCase();
    if (["staff", "lead", "principal", "senior", "advanced", "expert"].some((item) => normalized.includes(item))) {
        return 5;
    }
    if (["mid", "intermediate", "confident"].some((item) => normalized.includes(item))) {
        return 3;
    }
    if (["junior", "entry", "basic", "comfortable", "beginner"].some((item) => normalized.includes(item))) {
        return 2;
    }
    return 3;
};

const normalizeText = (value) =>
    String(value || "")
        .trim()
        .toLowerCase();

const getStackHint = (stack) => {
    const normalizedStack = normalizeText(stack);
    const directHint = TECHSTACK_GROUP_HINTS[normalizedStack];
    if (directHint) {
        return directHint;
    }

    const matchedHintKey = Object.keys(TECHSTACK_GROUP_HINTS).find(
        (key) => normalizedStack.includes(key) || key.includes(normalizedStack),
    );

    return matchedHintKey ? TECHSTACK_GROUP_HINTS[matchedHintKey] : null;
};

const isLikelyBackendStack = (stack) => {
    const normalizedStack = normalizeText(stack);
    const hint = getStackHint(stack) || {};
    const categories = (hint.categories || []).map((item) => normalizeText(item));
    if (categories.includes("backend")) {
        return true;
    }

    return BACKEND_STACK_FALLBACK_KEYWORDS.some((keyword) => keyword && normalizedStack.includes(keyword));
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

const mapDerivedSkillToScore = (derivedSkill) => {
    if (!derivedSkill) return 0;
    const score = Number(derivedSkill?.score);
    if (Number.isFinite(score)) {
        return Math.max(0, Math.min(100, Math.round(score)));
    }

    const scoreValue = Number(derivedSkill?.scoreValue);
    if (Number.isFinite(scoreValue)) {
        return Math.max(0, Math.min(100, Math.round((scoreValue / 7) * 100)));
    }

    return 0;
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
    return Math.max(0, Math.min(100, Math.round(asPercent)));
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
        skillScores,
        matchPercentage,
        lastMatchPercentage,
        saveAssessmentSnapshot,
        roadmap,
    } = useAssessment();
    const [isSaving, setIsSaving] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState({});
    const [expandedSkills, setExpandedSkills] = useState({});
    const profile = answers?.profile || {};

    const { summaryText, calculatedSkillScores, overallScorePercent, overallLevelText } = useMemo(() => {
        const evaluateResult =
            surveyResult?.answer || surveyResult?.responses || surveyResult?.current?.skills
                ? surveyResult
                : answers?.evaluateResponse
                  ? answers.evaluateResponse
                  : null;

        if (evaluateResult) {
            const answerBlock = evaluateResult?.answer?.responses ? evaluateResult.answer : evaluateResult;
            const currentSkillsList = Array.isArray(evaluateResult?.current?.skills) ? evaluateResult.current.skills : [];
            const responseSkillsList = Array.isArray(answerBlock?.responses) ? answerBlock.responses : [];
            const gapMissing = Array.isArray(evaluateResult?.gapJson?.missing)
                ? evaluateResult.gapJson.missing
                : evaluateResult?.missing || [];
            const gapWeak = Array.isArray(evaluateResult?.gapJson?.weak) ? evaluateResult.gapJson.weak : [];
            const missingSet = new Set(gapMissing.map((item) => String(item || "").toLowerCase()));
            const weakSet = new Set(gapWeak.map((item) => String(item || "").toLowerCase()));
            const targetLevel = mapProfileLevelToTargetSfia(
                answerBlock?.overallLevel || answerBlock?.profile?.level || profile.level,
            );
            const calculatedFromCurrent = currentSkillsList
                .map((item) => {
                    const levelCode = toNumericLevelCode(item?.level);
                    const score = toPercentScore(item?.score);
                    const skillKey = String(item?.skill || "Unknown Skill");
                    const normalizedSkill = normalizeText(skillKey);
                    const isMissing = missingSet.has(normalizedSkill) || levelCode === "0" || score <= 0;
                    const isWeak = weakSet.has(normalizedSkill);
                    return {
                        skillKey,
                        status: isMissing ? "missing" : isWeak ? "weak" : toStatusByScore(score, false),
                        score,
                        levelCode,
                        sfiaLevel: Number.isFinite(Number(item?.sfiaLevel)) ? Math.max(0, Math.round(Number(item.sfiaLevel))) : 0,
                        targetLevel,
                        selectedLevel: levelLabel[levelCode] || levelLabel["0"],
                        category: inferSkillCategory(skillKey),
                    };
                })
                .sort((a, b) => b.score - a.score);
            const calculatedFromResponses = Array.from(
                responseSkillsList.reduce((acc, item) => {
                    const skillKey = String(item?.skill || "").trim();
                    if (!skillKey) return acc;
                    const levelCode = toNumericLevelCode(item?.selectedLevel);
                    const numericLevel = Number(levelCode);
                    const bucket = acc.get(skillKey) || { scoreTotal: 0, count: 0, levelTotal: 0 };
                    bucket.scoreTotal += Math.max(0, Math.min(100, Math.round((numericLevel / 4) * 100)));
                    bucket.levelTotal += numericLevel;
                    bucket.count += 1;
                    acc.set(skillKey, bucket);
                    return acc;
                }, new Map()),
            )
                .map(([skillKey, aggregated]) => {
                    const avgScore = aggregated.count ? Math.round(aggregated.scoreTotal / aggregated.count) : 0;
                    const avgLevel = aggregated.count ? Math.round(aggregated.levelTotal / aggregated.count) : 0;
                    const levelCode = String(avgLevel);
                    const normalizedSkill = normalizeText(skillKey);
                    const isMissing = missingSet.has(normalizedSkill) || levelCode === "0" || avgScore <= 0;
                    const isWeak = weakSet.has(normalizedSkill);
                    return {
                        skillKey,
                        status: isMissing ? "missing" : isWeak ? "weak" : toStatusByScore(avgScore, false),
                        score: avgScore,
                        levelCode,
                        sfiaLevel: 0,
                        targetLevel,
                        selectedLevel: levelLabel[levelCode] || levelLabel["0"],
                        category: inferSkillCategory(skillKey),
                    };
                })
                .sort((a, b) => b.score - a.score);

            const overallPercent = toOverallPercentScore(answerBlock?.overallScore ?? evaluateResult?.overallScore);

            return {
                summaryText: String(evaluateResult?.summaryText || ""),
                calculatedSkillScores:
                    calculatedFromCurrent.length > 0
                        ? calculatedFromCurrent
                        : calculatedFromResponses.length > 0
                          ? calculatedFromResponses
                          : skillScores || [],
                overallScorePercent: overallPercent,
                overallLevelText: String(answerBlock?.overallLevel || evaluateResult?.overallLevel || "None"),
            };
        }

        return {
            summaryText: "",
            calculatedSkillScores: skillScores || [],
            overallScorePercent: null,
            overallLevelText: "None",
        };
    }, [answers?.evaluateResponse, profile.level, skillScores, surveyResult]);

    const displaySkillScores = calculatedSkillScores.length > 0 ? calculatedSkillScores : skillScores;
    const groupedSkillCards = useMemo(() => {
        const selectedStacks = Array.isArray(profile?.techstack) ? profile.techstack.filter(Boolean) : [];
        const derivedSkills = Array.isArray(answers?.derivedSkills) ? answers.derivedSkills : [];

        if (!selectedStacks.length) {
            const fallbackLevelBreakdown = buildLevelBreakdown(displaySkillScores);
            return [
                {
                    id: "other-skills",
                    title: "Other Skills",
                    score: displaySkillScores.length
                        ? Math.round(
                              displaySkillScores.reduce((sum, item) => sum + (Number(item?.score) || 0), 0) /
                                  displaySkillScores.length,
                          )
                        : 0,
                    count: displaySkillScores.length,
                    missingCount: displaySkillScores.filter((item) => item?.status === "missing").length,
                    weakCount: displaySkillScores.filter((item) => item?.status === "weak").length,
                    levelBreakdown: fallbackLevelBreakdown,
                    skills: displaySkillScores,
                },
            ];
        }

        const bucketMap = new Map(selectedStacks.map((stack) => [stack, []]));
        const unmatched = [];
        const backendStacks = selectedStacks.filter((stack) => isLikelyBackendStack(stack));
        let backendRoundRobinIndex = 0;
        const sqlStack = selectedStacks.find((stack) => {
            const normalized = normalizeText(stack);
            return ["sql", "postgresql", "postgres", "mysql", "mssql", "sql server"].includes(normalized);
        });

        displaySkillScores.forEach((skill) => {
            const skillName = normalizeText(skill?.skillKey);
            const skillCategory = normalizeText(skill?.category);
            const isDatabaseSkill = DATABASE_KEYWORDS.some((keyword) => skillName.includes(keyword));

            if (sqlStack && isDatabaseSkill) {
                bucketMap.get(sqlStack)?.push(skill);
                return;
            }

            const keywordMatches = selectedStacks.filter((stack) => {
                const hint = getStackHint(stack) || {};
                const keywords = hint.keywords || [normalizeText(stack)];
                return keywords.some((keyword) => keyword && skillName.includes(keyword));
            });

            if (keywordMatches.length === 1) {
                bucketMap.get(keywordMatches[0]).push(skill);
                return;
            }

            if (keywordMatches.length > 1) {
                bucketMap.get(keywordMatches[0]).push(skill);
                return;
            }

            const categoryMatches = selectedStacks.filter((stack) => {
                const hint = getStackHint(stack) || {};
                const categories = (hint.categories || []).map((item) => normalizeText(item));
                return categories.includes(skillCategory);
            });

            if (categoryMatches.length > 0) {
                bucketMap.get(categoryMatches[0]).push(skill);
                return;
            }

            const isGenericBackendSkill =
                skillCategory === "backend" ||
                GENERIC_BACKEND_KEYWORDS.some((keyword) => keyword && skillName.includes(keyword));
            if (isGenericBackendSkill && backendStacks.length > 0) {
                const assignedStack = backendStacks[backendRoundRobinIndex % backendStacks.length];
                backendRoundRobinIndex += 1;
                bucketMap.get(assignedStack)?.push(skill);
                return;
            }

            unmatched.push(skill);
        });

        const techGroups = selectedStacks.map((stack) => {
            const skillsInGroup = bucketMap.get(stack) || [];
            const derived = derivedSkills.find((item) => normalizeText(item?.skillKey) === normalizeText(stack));
            const fallbackScore = mapDerivedSkillToScore(derived);
            const score = skillsInGroup.length
                ? Math.round(
                      skillsInGroup.reduce((sum, item) => sum + (Number(item?.score) || 0), 0) / skillsInGroup.length,
                  )
                : fallbackScore;
            const levelBreakdown = buildLevelBreakdown(skillsInGroup);

            return {
                id: `stack-${normalizeText(stack)}`,
                title: ["postgresql", "postgres", "sql", "mysql", "mssql", "sql server"].includes(normalizeText(stack))
                    ? "SQL"
                    : stack,
                score,
                count: skillsInGroup.length,
                missingCount: skillsInGroup.filter((item) => item?.status === "missing").length,
                weakCount: skillsInGroup.filter((item) => item?.status === "weak").length,
                levelBreakdown,
                skills: skillsInGroup,
            };
        });

        if (unmatched.length > 0) {
            const unmatchedLevelBreakdown = buildLevelBreakdown(unmatched);
            techGroups.push({
                id: "other-skills",
                title: "Other Skills",
                score: Math.round(
                    unmatched.reduce((sum, item) => sum + (Number(item?.score) || 0), 0) / unmatched.length,
                ),
                count: unmatched.length,
                missingCount: unmatched.filter((item) => item?.status === "missing").length,
                weakCount: unmatched.filter((item) => item?.status === "weak").length,
                levelBreakdown: unmatchedLevelBreakdown,
                skills: unmatched,
            });
        }

        return techGroups;
    }, [answers?.derivedSkills, displaySkillScores, profile?.techstack]);

    const effectiveMatchPercentage = useMemo(() => {
        if (overallScorePercent != null && Number.isFinite(Number(overallScorePercent))) {
            return Number(overallScorePercent);
        }
        if (!displaySkillScores.length) return matchPercentage;
        return Math.round(
            displaySkillScores.reduce((sum, item) => sum + (item.score || 0), 0) / displaySkillScores.length,
        );
    }, [displaySkillScores, matchPercentage, overallScorePercent]);

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
        ? `You can start ${profile.role || "interview"} practice directly.`
        : focusSkills.length
          ? `Focus next on ${focusSkills.map((skill) => skill.skillKey).join(", ")}.`
          : `Keep strengthening ${profile.role || "your interview"} momentum.`;
    const readinessBody = interviewReady
        ? `Benchmarked against ${profile.level || "your target"} expectations, your current tech stack is ready for mock interviews and real interview reps.`
        : mediumSkills.length
          ? `${mediumSkills.map((skill) => skill.skillKey).join(", ")} is already on track for ${profile.level || "your target level"}, but you still have a few core gaps to close first.`
          : `Your score reflects both your chosen level and the stack-specific answers you gave in the assessment.`;
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
                        {skill.score}% ready for {profile.level || "your chosen"} benchmark
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
        <Box sx={{ maxWidth: 1120, mx: "auto", px: 3, pb: 8 }}>
            <Stack spacing={4}>
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 3, md: 4 },
                        borderRadius: 4,
                        border: "1px solid",
                        borderColor: alpha("#cbd5e1", 0.9),
                        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                    }}
                >
                    <Stack spacing={2}>
                        <Typography
                            variant="overline"
                            sx={{ color: "#64748b", fontWeight: 800, letterSpacing: "0.08em" }}
                        >
                            Assessment Summary
                        </Typography>
                        <Typography variant="h4" fontWeight={800}>
                            {profile.role || "Candidate"} readiness snapshot
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {profile.level ? <Chip label={profile.level} /> : null}
                            {(profile.techstack || []).map((item) => (
                                <Chip key={item} label={item} variant="outlined" />
                            ))}
                            {(profile.domain || []).map((item) => (
                                <Chip key={item} label={item} variant="outlined" color="secondary" />
                            ))}
                        </Stack>
                        {profile.freeText ? (
                            <Typography color="text.secondary">Goal: {profile.freeText}</Typography>
                        ) : null}
                    </Stack>
                </Paper>

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
                            Calibrated for a {profile.level || "target"} {profile.role || "role"} using your real tech
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
                    </Paper>
                </Box>

                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 3, md: 5 },
                        borderRadius: 4,
                        color: "common.white",
                        background: "linear-gradient(135deg, #111827 0%, #1d4ed8 100%)",
                    }}
                >
                    <Stack
                        direction={{ xs: "column", md: "row" }}
                        justifyContent="space-between"
                        alignItems={{ xs: "flex-start", md: "center" }}
                        spacing={3}
                    >
                        <Box>
                            <Typography variant="h4" fontWeight={800} gutterBottom>
                                {readinessHeadline}
                            </Typography>
                            <Typography sx={{ color: "rgba(255,255,255,0.78)" }}>
                                {readinessBody} Strongest areas:{" "}
                                {strongestSkills.length
                                    ? strongestSkills.map((skill) => skill.skillKey).join(", ")
                                    : "Assessment ready."}
                            </Typography>
                        </Box>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                            <PrimaryButton
                                size="small"
                                onClick={handleGoHome}
                                sx={{
                                    minWidth: 120,
                                    minHeight: 38,
                                    py: 0.55,
                                    textTransform: "none",
                                    fontWeight: 800,
                                    bgcolor: alpha("#ffffff", 0.12),
                                    color: "#ffffff",
                                    border: "1px solid",
                                    borderColor: alpha("#ffffff", 0.32),
                                    "&:hover": { bgcolor: alpha("#ffffff", 0.2) },
                                }}
                            >
                                Go Home
                            </PrimaryButton>
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
                    </Stack>
                </Paper>
            </Stack>
        </Box>
    );
};

export default ResultDashboard;
