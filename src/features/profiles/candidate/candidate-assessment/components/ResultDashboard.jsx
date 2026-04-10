import React, { useMemo, useState } from "react";
import { Box, Chip, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import { alpha } from "@mui/material/styles";
import { useAssessment } from "../context/AssessmentContext";
import { PrimaryButton } from "../../../../../common/components/buttons";
import { assessmentApi } from "../services/assessmentApi";
import { roadmapData as fallbackRoadmap } from "../../../../roadmap/data";

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

const ResultDashboard = () => {
    const { answers, skillScores, matchPercentage, lastMatchPercentage, nextStep, saveAssessmentSnapshot, setRoadmap } =
        useAssessment();
    const [isSaving, setIsSaving] = useState(false);
    const profile = answers?.profile || {};
    const strongestSkills = useMemo(
        () =>
            skillScores
                .slice()
                .sort((a, b) => b.score - a.score)
                .slice(0, 3),
        [skillScores],
    );
    const blockingSkills = useMemo(
        () => skillScores.filter((skill) => skill.status === "weak" || skill.status === "missing"),
        [skillScores],
    );
    const interviewReady = skillScores.length > 0 && blockingSkills.length === 0;
    const focusSkills = useMemo(() => blockingSkills.slice(0, 3), [blockingSkills]);
    const mediumSkills = useMemo(() => skillScores.filter((skill) => skill.status === "medium"), [skillScores]);
    const summaryTone = interviewReady
        ? statusVisualMap.good
        : matchPercentage >= 70
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

    const handleViewRoadmap = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            await saveAssessmentSnapshot();
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

            setRoadmap(resolvedRoadmap ?? fallbackRoadmap);
            nextStep();
        } finally {
            setIsSaving(false);
        }
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
                                    background: `conic-gradient(${summaryTone.main} ${matchPercentage * 3.6}deg, #e5e7eb 0deg)`,
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
                                        {matchPercentage}%
                                    </Typography>
                                    {matchPercentage > lastMatchPercentage ? (
                                        <Chip
                                            icon={<TrendingUpRoundedIcon />}
                                            label={`+${matchPercentage - lastMatchPercentage}%`}
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
                    </Paper>

                    <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: "1px solid", borderColor: "divider" }}>
                        <Typography variant="overline" color="text.secondary" fontWeight={700}>
                            Skill Breakdown
                        </Typography>
                        <Stack spacing={3} sx={{ mt: 3 }}>
                            {skillScores.map((skill) => (
                                <Box key={skill.skillKey}>
                                    <Stack
                                        direction={{ xs: "column", sm: "row" }}
                                        justifyContent="space-between"
                                        spacing={1}
                                        sx={{ mb: 1 }}
                                    >
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            alignItems="center"
                                            flexWrap="wrap"
                                            useFlexGap
                                        >
                                            <Typography fontWeight={700}>{skill.skillKey}</Typography>
                                            <Chip
                                                label={
                                                    (
                                                        statusVisualMap[skill.status?.toLowerCase()] ||
                                                        statusVisualMap.medium
                                                    ).label
                                                }
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    bgcolor: (
                                                        statusVisualMap[skill.status?.toLowerCase()] ||
                                                        statusVisualMap.medium
                                                    ).soft,
                                                    borderColor: (
                                                        statusVisualMap[skill.status?.toLowerCase()] ||
                                                        statusVisualMap.medium
                                                    ).border,
                                                    color: (
                                                        statusVisualMap[skill.status?.toLowerCase()] ||
                                                        statusVisualMap.medium
                                                    ).text,
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
                                            bgcolor: (
                                                statusVisualMap[skill.status?.toLowerCase()] || statusVisualMap.medium
                                            ).soft,
                                            "& .MuiLinearProgress-bar": {
                                                borderRadius: 999,
                                                bgcolor: (
                                                    statusVisualMap[skill.status?.toLowerCase()] ||
                                                    statusVisualMap.medium
                                                ).main,
                                            },
                                        }}
                                    />
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ mt: 0.75, display: "block" }}
                                    >
                                        {skill.score}% ready for {profile.level || "your chosen"} benchmark
                                    </Typography>
                                </Box>
                            ))}
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
                                View Roadmap
                            </PrimaryButton>
                        </Stack>
                    </Stack>
                </Paper>
            </Stack>
        </Box>
    );
};

export default ResultDashboard;
