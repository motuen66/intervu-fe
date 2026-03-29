import React, { useMemo } from "react";
import { Box, Button, Chip, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import { alpha } from "@mui/material/styles";
import { useAssessment } from "../context/AssessmentContext";

const statusColorMap = {
    good: "success",
    medium: "warning",
    weak: "warning",
    missing: "error",
};

const ResultDashboard = () => {
    const { answers, skillScores, matchPercentage, lastMatchPercentage, nextStep } = useAssessment();
    const profile = answers?.profile || {};
    const strongestSkills = useMemo(() => skillScores.slice().sort((a, b) => b.score - a.score).slice(0, 3), [skillScores]);
    const focusSkills = useMemo(() => skillScores.filter((skill) => skill.status !== "good").slice(0, 3), [skillScores]);

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
                        <Typography variant="overline" sx={{ color: "#64748b", fontWeight: 800, letterSpacing: "0.08em" }}>
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
                            <Typography color="text.secondary">
                                Goal: {profile.freeText}
                            </Typography>
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
                                    background: `conic-gradient(#84cc16 ${matchPercentage * 3.6}deg, #e5e7eb 0deg)`,
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
                            Calibrated for {profile.role || "your target role"} using your real chat answers.
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
                                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                            <Typography fontWeight={700}>{skill.skillKey}</Typography>
                                            <Chip
                                                label={skill.status}
                                                size="small"
                                                color={statusColorMap[skill.status?.toLowerCase()] || "default"}
                                                variant="outlined"
                                            />
                                        </Stack>
                                        <Typography variant="body2" color="text.secondary" fontWeight={700}>
                                            Level {skill.sfiaLevel}
                                        </Typography>
                                    </Stack>
                                    <LinearProgress
                                        variant="determinate"
                                        value={skill.score}
                                        color={statusColorMap[skill.status?.toLowerCase()] || "primary"}
                                        sx={{ height: 10, borderRadius: 999 }}
                                    />
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block" }}>
                                        {skill.score}% readiness
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
                                {focusSkills.length
                                    ? `Focus next on ${focusSkills.map((skill) => skill.skillKey).join(", ")}.`
                                    : `Keep strengthening ${profile.role || "your interview"} momentum.`}
                            </Typography>
                            <Typography sx={{ color: "rgba(255,255,255,0.78)" }}>
                                Strongest areas:{" "}
                                {strongestSkills.length
                                    ? strongestSkills.map((skill) => skill.skillKey).join(", ")
                                    : "Your assessment data is ready for roadmap generation."}
                            </Typography>
                        </Box>
                        <Button variant="contained" size="large" onClick={nextStep}>
                            View Roadmap
                        </Button>
                    </Stack>
                </Paper>
            </Stack>
        </Box>
    );
};

export default ResultDashboard;
