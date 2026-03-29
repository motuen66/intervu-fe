import React, { useEffect, useMemo, useState } from "react";
import { Box, CircularProgress, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import { alpha } from "@mui/material/styles";
import { useAssessment } from "../context/AssessmentContext";

const levelMap = {
    none: 0,
    beginner: 1,
    basic: 2,
    comfortable: 2,
    entry: 2,
    junior: 3,
    intermediate: 4,
    mid: 4,
    confident: 4,
    advanced: 6,
    senior: 6,
    expert: 7,
};

const stackKeywordMap = {
    react: ["react", "jsx", "component", "hook", "state", "redux", "context", "frontend", "ui"],
    typescript: ["typescript", "type", "typing", "generic", "interface", "ts"],
    "node.js": ["node", "express", "api", "backend", "server", "rest", "middleware"],
    python: ["python", "django", "flask", "fastapi"],
    go: ["go", "golang", "goroutine", "concurrency"],
    graphql: ["graphql", "resolver", "schema", "apollo"],
    postgresql: ["postgresql", "postgres", "sql", "query", "join", "index", "database", "schema"],
    aws: ["aws", "cloud", "lambda", "s3", "ec2", "deployment"],
    java: ["java", "jvm", "spring"],
    "spring boot": ["spring", "spring boot", "java"],
};

const targetLevelMap = [
    { keywords: ["staff", "lead", "principal"], level: 7 },
    { keywords: ["senior"], level: 6 },
    { keywords: ["mid", "intermediate"], level: 5 },
    { keywords: ["junior", "associate"], level: 4 },
    { keywords: ["fresher", "entry", "intern", "graduate"], level: 3 },
];

const ProcessingState = () => {
    const { answers, surveyResult, setSkillScores, updateMatchPercentage, setRoadmap, nextStep } = useAssessment();
    const [progress, setProgress] = useState(0);
    const [statusIndex, setStatusIndex] = useState(0);

    const profile = answers?.profile || {};
    const processedSkills = useMemo(() => buildSkillScores(surveyResult, answers), [surveyResult, answers]);
    const roadmap = useMemo(() => buildRoadmap(processedSkills, profile), [processedSkills, profile]);
    const matchPercentage = useMemo(() => calculateMatchPercentage(processedSkills), [processedSkills]);
    const statuses = useMemo(
        () => [
            `Analyzing ${profile.role || "your"} assessment answers...`,
            `Mapping ${profile.techstack?.slice(0, 2).join(" / ") || "your stack"} confidence levels...`,
            `Building your personalized roadmap...`,
        ],
        [profile.role, profile.techstack],
    );

    useEffect(() => {
        const progressInterval = window.setInterval(() => {
            setProgress((prev) => (prev >= 94 ? 94 : Math.min(94, prev + Math.random() * 14)));
        }, 320);

        const statusTimeouts = [
            window.setTimeout(() => setStatusIndex(1), 950),
            window.setTimeout(() => setStatusIndex(2), 1900),
            window.setTimeout(() => {
                setSkillScores(processedSkills);
                updateMatchPercentage(matchPercentage);
                setRoadmap(roadmap);
                setProgress(100);
                window.setTimeout(() => nextStep(), 420);
            }, 2850),
        ];

        return () => {
            window.clearInterval(progressInterval);
            statusTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
        };
    }, [matchPercentage, nextStep, processedSkills, roadmap, setRoadmap, setSkillScores, updateMatchPercentage]);

    return (
        <Box sx={{ maxWidth: 760, mx: "auto", px: 3, py: 10 }}>
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 4, md: 6 },
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "divider",
                    textAlign: "center",
                    background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
                }}
            >
                <Stack spacing={4} alignItems="center">
                    <Box sx={{ position: "relative", display: "inline-flex" }}>
                        <CircularProgress size={120} thickness={4} value={100} variant="determinate" sx={{ color: alpha("#cbd5e1", 0.8) }} />
                        <CircularProgress
                            size={120}
                            thickness={4}
                            value={Math.min(progress, 100)}
                            variant="determinate"
                            sx={{ position: "absolute", left: 0, color: "#84cc16" }}
                        />
                        <Box
                            sx={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <AutoAwesomeRoundedIcon sx={{ fontSize: 36, color: "#365314" }} />
                        </Box>
                    </Box>

                    <Box>
                        <Typography variant="h4" fontWeight={800} gutterBottom>
                            {statuses[statusIndex]}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {profile.freeText
                                ? `Goal focus: ${profile.freeText}`
                                : "We are translating your answers into a role-specific interview readiness summary."}
                        </Typography>
                    </Box>

                    <Box sx={{ width: "100%" }}>
                        <LinearProgress
                            variant="determinate"
                            value={Math.min(progress, 100)}
                            sx={{
                                height: 12,
                                borderRadius: 999,
                                bgcolor: alpha("#cbd5e1", 0.45),
                                "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: "#84cc16" },
                            }}
                        />
                        <Typography sx={{ mt: 2, fontWeight: 700, color: "#3f6212" }}>
                            {Math.round(progress)}% complete
                        </Typography>
                    </Box>
                </Stack>
            </Paper>
        </Box>
    );
};

function buildSkillScores(surveyResult, answers) {
    const targetLevel = getTargetLevel(answers?.profile?.level);

    if (Array.isArray(answers?.derivedSkills) && answers.derivedSkills.length > 0) {
        return answers.derivedSkills.map((skill) => ({
            ...evaluateSkillReadiness(skill.scoreValue || 0, targetLevel),
            skillKey: skill.skillKey,
            sfiaLevel: Math.max(0, Math.round(skill.scoreValue || 0)),
            baseScore: Math.min(100, Math.round(((skill.scoreValue || 0) / 7) * 100)),
            selectedLevel: skill.selectedLevel,
        }));
    }

    const stackSkills = buildStackDrivenSkills(answers?.profile?.techstack || [], answers?.responses || [], targetLevel);
    if (stackSkills.length > 0) {
        return stackSkills;
    }

    const responseMap = new Map();

    (answers?.responses || []).forEach((item) => {
        responseMap.set((item.skill || "").toLowerCase(), item);
    });

    const surveyQuestions = Object.values(surveyResult?.summaryObject || {}).flatMap((group) => group?.Questions || []);
    const skillSource = surveyQuestions.length
        ? surveyQuestions.map((question) => ({
              skill: question?.Skill,
              selectedLevel: question?.SelectedLevel,
          }))
        : answers?.responses || [];

    const normalizedSkills = skillSource
        .map((item) => {
            const answerSkill = responseMap.get((item.skill || item.Skill || "").toLowerCase());
            const rawLevel = item.selectedLevel || item.SelectedLevel || answerSkill?.selectedLevel || answerSkill?.answer || "";
            const sfiaLevel = mapToLevel(rawLevel);
            return {
                ...evaluateSkillReadiness(sfiaLevel, targetLevel),
                skillKey: item.skill || item.Skill || answerSkill?.skill || "Unknown Skill",
                sfiaLevel,
                baseScore: Math.min(100, Math.round((sfiaLevel / 7) * 100)),
                selectedLevel: rawLevel,
            };
        })
        .filter((skill) => skill.skillKey);

    return dedupeSkills(normalizedSkills);
}

function buildStackDrivenSkills(techstack = [], responses = [], targetLevel = 4) {
    return techstack.map((stack) => {
        const normalizedStack = String(stack || "").trim().toLowerCase();
        const keywords = Array.from(new Set([normalizedStack, ...(stackKeywordMap[normalizedStack] || [])])).filter(Boolean);
        const relatedResponses = responses.filter((response) => {
            const haystack = `${response.skill || ""} ${response.question || ""}`.toLowerCase();
            return keywords.some((keyword) => haystack.includes(keyword));
        });

        if (!relatedResponses.length) {
            return {
                ...evaluateSkillReadiness(0, targetLevel),
                skillKey: stack,
                sfiaLevel: 0,
                baseScore: 0,
                selectedLevel: "Missing",
            };
        }

        const averageLevel =
            relatedResponses.reduce((sum, response) => sum + mapToLevel(response.selectedLevel || response.answer), 0) /
            relatedResponses.length;
        const roundedLevel = Math.round(averageLevel * 10) / 10;

        return {
            ...evaluateSkillReadiness(roundedLevel, targetLevel),
            skillKey: stack,
            sfiaLevel: Math.max(0, Math.round(roundedLevel)),
            baseScore: Math.min(100, Math.round((roundedLevel / 7) * 100)),
            selectedLevel: roundedLevel <= 1 ? "Missing" : roundedLevel <= 3 ? "Weak" : roundedLevel <= 5 ? "Intermediate" : "Advanced",
        };
    });
}

function dedupeSkills(skills) {
    const uniqueMap = new Map();

    skills.forEach((skill) => {
        const current = uniqueMap.get(skill.skillKey);
        if (!current || current.score < skill.score) {
            uniqueMap.set(skill.skillKey, skill);
        }
    });

    return Array.from(uniqueMap.values()).sort((a, b) => a.score - b.score);
}

function getTargetLevel(level) {
    const normalized = String(level || "").toLowerCase();

    for (const target of targetLevelMap) {
        if (target.keywords.some((keyword) => normalized.includes(keyword))) {
            return target.level;
        }
    }

    return 4;
}

function evaluateSkillReadiness(skillLevel, targetLevel) {
    if (skillLevel <= 1) {
        return {
            status: "missing",
            score: 0,
            targetLevel,
        };
    }

    const readinessRatio = targetLevel ? skillLevel / targetLevel : 0;

    if (readinessRatio >= 1) {
        return {
            status: "good",
            score: 100,
            targetLevel,
        };
    }

    if (readinessRatio >= 0.75) {
        return {
            status: "medium",
            score: Math.round(readinessRatio * 100),
            targetLevel,
        };
    }

    if (readinessRatio >= 0.45) {
        return {
            status: "weak",
            score: Math.round(readinessRatio * 100),
            targetLevel,
        };
    }

    return {
        status: "missing",
        score: Math.round(readinessRatio * 100),
        targetLevel,
    };
}

function mapToLevel(value) {
    const normalized = String(value || "").toLowerCase();

    for (const [label, mappedLevel] of Object.entries(levelMap)) {
        if (normalized.includes(label)) {
            return mappedLevel;
        }
    }

    return 2;
}

function calculateMatchPercentage(skills) {
    if (!skills.length) {
        return 35;
    }

    const statusFloor = {
        missing: 15,
        weak: 45,
        medium: 70,
        good: 90,
    };

    const totalScore = skills.reduce((sum, skill) => {
        const floor = statusFloor[skill.status] ?? 50;
        const blended = Math.max(floor, skill.score || 0, skill.baseScore || 0);
        return sum + blended;
    }, 0);

    return Math.max(25, Math.min(100, Math.round(totalScore / skills.length)));
}

function buildRoadmap(skills, profile) {
    const focusSkills = skills.filter((skill) => skill.status !== "good").slice(0, 4);
    const stackLabel = profile.techstack?.[0] || profile.role || "your target role";
    const hasBlockingGap = skills.some((skill) => skill.status === "weak" || skill.status === "missing");
    const interviewReady = skills.length > 0 && !hasBlockingGap;

    if (interviewReady) {
        const readinessTasks = buildInterviewReadyTasks(profile, stackLabel, skills);
        const readinessAttributes = buildInterviewReadyAttributes(skills);

        return {
            meta: {
                interviewReady: true,
                title: "You can start interview practice directly",
                description: `No weak or missing gaps were found for your ${profile.level || "current"} target, so mock interviews and feedback loops will help more than extra study.`,
            },
            today: [
                {
                    id: "today-ready",
                    title: "Start live interview reps",
                    type: "mock-cycle",
                    duration: "45 min",
                    focus: stackLabel,
                    attributes: readinessAttributes,
                    tasks: readinessTasks,
                },
            ],
            weeks: [
                {
                    id: "week-ready",
                    title: "Interview Sprint",
                    focus: profile.role || stackLabel,
                    description: `Use ${stackLabel} interview reps, self-review, and targeted feedback instead of more study sessions.`,
                    gapLabel: "Interview Ready",
                    progress: 100,
                    locked: false,
                    attributes: readinessAttributes,
                    tasks: readinessTasks,
                },
            ],
        };
    }

    return {
        today: (focusSkills.length ? focusSkills : skills.slice(0, 3)).map((skill, index) => ({
            id: index + 1,
            title: `${skill.status === "missing" ? "Build foundation in" : "Practice"} ${skill.skillKey}`,
            type: skill.status === "missing" ? "foundation" : "review",
            duration: index === 0 ? "20 min" : index === 1 ? "35 min" : "45 min",
            focus: skill.skillKey,
            attributes: buildAttributes(skill),
            tasks: buildSkillTasks(skill, stackLabel),
        })),
        weeks: (focusSkills.length ? focusSkills : skills.slice(0, 4)).map((skill, index) => ({
            id: index + 1,
            title: `Week ${index + 1}`,
            focus: skill.skillKey,
            description: `Strengthen ${skill.skillKey} for ${stackLabel} interview scenarios.`,
            gapLabel: skill.status === "missing" ? "Priority Gap" : skill.status === "weak" ? "Core Gap" : "Growth Track",
            progress: Math.max(10, skill.score),
            locked: false,
            attributes: buildAttributes(skill),
            tasks: buildSkillTasks(skill, stackLabel),
        })),
    };
}

function buildAttributes(skill) {
    const base = skill.score || 0;
    return [
        { label: "Knowledge", value: Math.max(18, Math.min(95, base + 12)) },
        { label: "Execution", value: Math.max(16, Math.min(95, base - 6)) },
        { label: "Speed", value: Math.max(20, Math.min(95, base - 10)) },
        { label: "Communication", value: Math.max(22, Math.min(95, base + 4)) },
        { label: "Confidence", value: Math.max(18, Math.min(95, base - 2)) },
    ];
}

function buildInterviewReadyAttributes(skills) {
    const averageScore = skills.length
        ? Math.round(skills.reduce((sum, skill) => sum + (skill.score || 0), 0) / skills.length)
        : 80;

    return [
        { label: "Knowledge", value: Math.max(70, Math.min(98, averageScore + 6)) },
        { label: "Execution", value: Math.max(66, Math.min(96, averageScore - 2)) },
        { label: "Speed", value: Math.max(64, Math.min(94, averageScore - 4)) },
        { label: "Communication", value: Math.max(72, Math.min(98, averageScore + 4)) },
        { label: "Confidence", value: Math.max(70, Math.min(96, averageScore + 2)) },
    ];
}

function buildSkillTasks(skill, stackLabel) {
    return [
        {
            id: `${skill.skillKey}-study-1`,
            type: "Study",
            title: `Review the core concepts behind ${skill.skillKey}`,
            detail: `Write short notes explaining the most important patterns and trade-offs for ${stackLabel}.`,
        },
        {
            id: `${skill.skillKey}-study-2`,
            type: "Question",
            title: `Answer two interview questions on ${skill.skillKey}`,
            detail: `Practice concise spoken answers and include one real example from your own work or study.`,
        },
        {
            id: `${skill.skillKey}-mock-1`,
            type: "Mock",
            title: `Run a mock scenario focused on ${skill.skillKey}`,
            detail: `Simulate a timed interview prompt, then review where your explanation became unclear or incomplete.`,
        },
    ];
}

function buildInterviewReadyTasks(profile, stackLabel, skills) {
    const topSkills = skills
        .slice()
        .sort((a, b) => b.score - a.score)
        .slice(0, 2)
        .map((skill) => skill.skillKey)
        .join(" and ");

    return [
        {
            id: "ready-mock-1",
            type: "Mock",
            title: `Run a timed ${profile.role || stackLabel} interview`,
            detail: `Practice a full interview round and answer out loud using your strongest examples in ${topSkills || stackLabel}.`,
        },
        {
            id: "ready-review-2",
            type: "Feedback",
            title: "Review your delivery after each mock",
            detail: "Focus on clarity, structure, and confidence instead of spending more time studying new topics.",
        },
        {
            id: "ready-apply-3",
            type: "Practice",
            title: "Apply to interviews and iterate from real feedback",
            detail: `Use each live interview to sharpen your ${stackLabel} storytelling, examples, and problem-solving pace.`,
        },
    ];
}

export default ProcessingState;
