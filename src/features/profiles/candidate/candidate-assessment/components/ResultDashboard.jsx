import React, { useMemo, useState } from "react";
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
import { useNavigate } from "react-router-dom";
import { useAssessment } from "../context/AssessmentContext";
import { PrimaryButton } from "../../../../../common/components/buttons";
import { assessmentApi, setAssessmentForceRequired } from "../services/assessmentApi";
import { roadmapData as fallbackRoadmap } from "../../../../roadmap/data";
import skillReferences from "../../../../../utils/skill-references.json";

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

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

const LEVEL_TO_SFIA_FALLBACK = {
    0: 0,
    1: 2,
    2: 3,
    3: 5,
};

const mapLevel = (lvl) => {
    const normalized = String(lvl || "").toLowerCase();
    switch (normalized) {
        case "none":
        case "beginner":
            return 0;
        case "basic":
        case "comfortable":
            return 1;
        case "intermediate":
        case "confident":
            return 2;
        case "advanced":
        case "expert":
            return 3;
        default:
            return 0;
    }
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

const normalizeSkillKey = (value) =>
    String(value || "")
        .trim()
        .toLowerCase();

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

const toDisplayLevel = (avgMapLevel) => {
    if (avgMapLevel <= 0.5) return "None";
    if (avgMapLevel <= 1.5) return "Basic";
    if (avgMapLevel <= 2.5) return "Intermediate";
    return "Advanced";
};

const toStatus = (avgMapLevel) => {
    if (avgMapLevel <= 0.5) return "missing";
    if (avgMapLevel <= 1.5) return "weak";
    if (avgMapLevel <= 2.5) return "medium";
    return "good";
};

const buildSkillReferenceIndex = () => {
    const index = new Map();
    (skillReferences || []).forEach((item) => {
        const skillName = String(item?.name || "").trim();
        if (!skillName) return;

        const levelToSfia = new Map();
        (item?.levels || []).forEach((levelItem) => {
            const levelLabel = String(levelItem?.level || "")
                .trim()
                .toLowerCase();
            if (!levelLabel) return;
            levelToSfia.set(levelLabel, Number(levelItem?.sfia) || 0);
        });

        index.set(skillName.toLowerCase(), {
            category: item?.category || "General",
            levelToSfia,
        });
    });

    return index;
};

const skillReferenceIndex = buildSkillReferenceIndex();

const resolveSfiaLevel = (skillName, levelLabel, mappedLevel) => {
    const reference = skillReferenceIndex.get(normalizeSkillKey(skillName));
    if (!reference) {
        return LEVEL_TO_SFIA_FALLBACK[mappedLevel] ?? 0;
    }

    const explicitSfia = reference.levelToSfia.get(
        String(levelLabel || "")
            .toLowerCase()
            .trim(),
    );
    if (Number.isFinite(explicitSfia)) {
        return explicitSfia;
    }

    return LEVEL_TO_SFIA_FALLBACK[mappedLevel] ?? 0;
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

const ResultDashboard = () => {
    const navigate = useNavigate();
    const {
        answers,
        skillScores,
        matchPercentage,
        lastMatchPercentage,
        nextStep,
        saveAssessmentSnapshot,
        setRoadmap,
        roadmap,
    } = useAssessment();
    const [isSaving, setIsSaving] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState({});
    const profile = answers?.profile || {};

    const { summaryText, calculatedSkillScores } = useMemo(() => {
        const responses = answers?.responses || answers?.answerJson?.responses || [];
        const targetLevel = mapProfileLevelToTargetSfia(profile.level);

        if (!Array.isArray(responses) || responses.length === 0) {
            const fallbackGroups = (skillScores || []).reduce((acc, skill) => {
                const key = "General";
                if (!acc[key]) {
                    acc[key] = {
                        category: key,
                        scoreTotal: 0,
                        count: 0,
                        missingCount: 0,
                        weakCount: 0,
                    };
                }
                acc[key].scoreTotal += Number(skill?.score) || 0;
                acc[key].count += 1;
                if (skill?.status === "missing") acc[key].missingCount += 1;
                if (skill?.status === "weak") acc[key].weakCount += 1;
                return acc;
            }, {});

            return {
                summaryText: "",
                calculatedSkillScores: skillScores || [],
                groupedAbilities: Object.values(fallbackGroups).map((item) => ({
                    category: item.category,
                    score: item.count ? Math.round(item.scoreTotal / item.count) : 0,
                    count: item.count,
                    missingCount: item.missingCount,
                    weakCount: item.weakCount,
                })),
            };
        }

        const byPhase = responses.reduce((acc, item) => {
            const phase = item?.phase || "general";
            if (!acc[phase]) {
                acc[phase] = [];
            }
            acc[phase].push(item);
            return acc;
        }, {});

        const lines = Object.entries(byPhase).map(([phase, items]) => {
            const scores = items.map((item) => mapLevel(item?.selectedLevel));
            const avg = scores.length
                ? Math.round((scores.reduce((sum, val) => sum + val, 0) / scores.length) * 100) / 100
                : 0;
            const needs = items
                .filter((item) => mapLevel(item?.selectedLevel) <= 1)
                .map((item) => item?.skill)
                .filter(Boolean);
            return `${phase}: average level ${toDisplayLevel(avg)}. Consider improving: ${needs.join(", ")}`;
        });

        const skillMap = new Map();
        responses.forEach((item) => {
            const skillKey = String(item?.skill || "").trim();
            if (!skillKey) return;

            const key = normalizeSkillKey(skillKey);
            const mapped = mapLevel(item?.selectedLevel);
            const sfia = resolveSfiaLevel(skillKey, item?.selectedLevel, mapped);
            const category = skillReferenceIndex.get(key)?.category || "General";

            if (!skillMap.has(key)) {
                skillMap.set(key, {
                    skillKey,
                    category,
                    mapLevels: [],
                    sfiaLevels: [],
                });
            }

            const current = skillMap.get(key);
            current.mapLevels.push(mapped);
            current.sfiaLevels.push(sfia);
        });

        const calculated = Array.from(skillMap.values())
            .map((item) => {
                const mapAvg = item.mapLevels.length
                    ? item.mapLevels.reduce((sum, value) => sum + value, 0) / item.mapLevels.length
                    : 0;
                const sfiaAvg = item.sfiaLevels.length
                    ? item.sfiaLevels.reduce((sum, value) => sum + value, 0) / item.sfiaLevels.length
                    : 0;
                const score = Math.max(0, Math.min(100, Math.round((sfiaAvg / 5) * 100)));

                return {
                    skillKey: item.skillKey,
                    status: toStatus(mapAvg),
                    score,
                    sfiaLevel: Math.round(sfiaAvg),
                    targetLevel,
                    selectedLevel: toDisplayLevel(mapAvg),
                    category: item.category,
                };
            })
            .sort((a, b) => b.score - a.score);

        const abilityGroupsMap = calculated.reduce((acc, item) => {
            const key = item.category || "General";
            if (!acc[key]) {
                acc[key] = {
                    category: key,
                    scoreTotal: 0,
                    count: 0,
                    missingCount: 0,
                    weakCount: 0,
                };
            }

            acc[key].scoreTotal += item.score;
            acc[key].count += 1;
            if (item.status === "missing") acc[key].missingCount += 1;
            if (item.status === "weak") acc[key].weakCount += 1;
            return acc;
        }, {});

        return {
            summaryText: lines.join("\n"),
            calculatedSkillScores: calculated,
            groupedAbilities: Object.values(abilityGroupsMap)
                .map((item) => ({
                    category: item.category,
                    score: item.count ? Math.round(item.scoreTotal / item.count) : 0,
                    count: item.count,
                    missingCount: item.missingCount,
                    weakCount: item.weakCount,
                }))
                .sort((a, b) => b.score - a.score),
        };
    }, [answers, profile.level, skillScores]);

    const displaySkillScores = calculatedSkillScores.length > 0 ? calculatedSkillScores : skillScores;
    const groupedSkillCards = useMemo(() => {
        const selectedStacks = Array.isArray(profile?.techstack) ? profile.techstack.filter(Boolean) : [];
        const derivedSkills = Array.isArray(answers?.derivedSkills) ? answers.derivedSkills : [];

        if (!selectedStacks.length) {
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

            return {
                id: `stack-${normalizeText(stack)}`,
                title: ["postgresql", "postgres", "sql", "mysql", "mssql", "sql server"].includes(normalizeText(stack))
                    ? "SQL"
                    : stack,
                score,
                count: skillsInGroup.length,
                missingCount: skillsInGroup.filter((item) => item?.status === "missing").length,
                weakCount: skillsInGroup.filter((item) => item?.status === "weak").length,
                skills: skillsInGroup,
            };
        });

        if (unmatched.length > 0) {
            techGroups.push({
                id: "other-skills",
                title: "Other Skills",
                score: Math.round(
                    unmatched.reduce((sum, item) => sum + (Number(item?.score) || 0), 0) / unmatched.length,
                ),
                count: unmatched.length,
                missingCount: unmatched.filter((item) => item?.status === "missing").length,
                weakCount: unmatched.filter((item) => item?.status === "weak").length,
                skills: unmatched,
            });
        }

        return techGroups;
    }, [answers?.derivedSkills, displaySkillScores, profile?.techstack]);

    const effectiveMatchPercentage = useMemo(() => {
        if (!displaySkillScores.length) return matchPercentage;
        return Math.round(
            displaySkillScores.reduce((sum, item) => sum + (item.score || 0), 0) / displaySkillScores.length,
        );
    }, [displaySkillScores, matchPercentage]);

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
    const hasRoadmap = Boolean(
        (Array.isArray(roadmap?.today) && roadmap.today.length > 0) ||
            (Array.isArray(roadmap?.weeks) && roadmap.weeks.length > 0) ||
            (Array.isArray(roadmap?.phases) && roadmap.phases.length > 0),
    );

    const renderSkillRow = (skill) => (
        <Box key={skill.skillKey}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1} sx={{ mb: 1 }}>
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
                    Current L{skill.sfiaLevel} / Target L{skill.targetLevel || 4}
                </Typography>
            </Stack>
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
                {skill.score}% ready for {profile.level || "your chosen"} benchmark
            </Typography>
        </Box>
    );

    const handleViewRoadmap = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            await saveAssessmentSnapshot();

            if (hasRoadmap) {
                nextStep();
                return;
            }

            const userId = answers?.userId;
            let resolvedRoadmap = null;

            if (userId && userId !== EMPTY_GUID) {
                try {
                    const generateResponse = await assessmentApi.generateRoadmapFromSurvey({
                        userId,
                        forceRegenerate: true,
                    });
                    resolvedRoadmap = generateResponse?.data?.roadmap ?? generateResponse?.data?.Roadmap ?? null;
                } catch (error) {
                    console.error("Generate roadmap failed:", error);
                }

                if (!resolvedRoadmap) {
                    try {
                        const fetchResponse = await assessmentApi.getRoadmapByUserId(userId);
                        resolvedRoadmap = fetchResponse?.data?.roadmap ?? fetchResponse?.data?.Roadmap ?? null;
                    } catch (error) {
                        console.error("Fetch roadmap fallback failed:", error);
                    }
                }
            }

            const finalRoadmap = resolvedRoadmap ?? fallbackRoadmap;
            setRoadmap(finalRoadmap);

            nextStep();
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
                        {/* {summaryText ? (
                            <Typography
                                color="text.secondary"
                                textAlign="center"
                                sx={{ mt: 1.5, whiteSpace: "pre-line" }}
                            >
                                {summaryText}
                            </Typography>
                        ) : null} */}
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
                                            </Stack>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ px: 2, py: 2 }}>
                                            {group.skills.length > 0 ? (
                                                <Stack spacing={2.5}>
                                                    {group.skills.map((skill) => renderSkillRow(skill))}
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
