import React, { useState } from "react";
import { Box, Button, Chip, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import { useAssessment } from "../context/AssessmentContext";

const PracticeView = () => {
    const { matchPercentage, updateMatchPercentage } = useAssessment();
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answered, setAnswered] = useState(false);
    const [selected, setSelected] = useState(null);

    const practiceQuestions = [
        {
            id: 1,
            q: "Which database indexing structure is most commonly used for range queries?",
            options: ["B-Tree", "Hash Index", "LSM Tree", "GiST"],
            correct: "B-Tree",
            exp: "B-Trees maintain sorted order, making them ideal for range-based lookups and sorting.",
        },
        {
            id: 2,
            q: "When using JWT for authentication, where is the most secure place to store it in a browser?",
            options: ["LocalStorage", "SessionStorage", "HttpOnly Cookie", "Redux Store"],
            correct: "HttpOnly Cookie",
            exp: "HttpOnly cookies cannot be accessed by JavaScript, which helps prevent XSS-based token theft.",
        },
    ];

    const handleSelect = (opt) => {
        if (answered) return;
        setSelected(opt);
        setAnswered(true);
        if (opt === practiceQuestions[currentIdx].correct) {
            updateMatchPercentage(Math.min(100, matchPercentage + 3));
        }
    };

    const handleNext = () => {
        if (currentIdx < practiceQuestions.length - 1) {
            setCurrentIdx(currentIdx + 1);
            setAnswered(false);
            setSelected(null);
        }
    };

    const currentQ = practiceQuestions[currentIdx];
    const isUnlocked = matchPercentage >= 60;

    return (
        <Box sx={{ maxWidth: 1120, mx: "auto", px: 3, pb: 10 }}>
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 320px" },
                    gap: 3,
                }}
            >
                <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, border: "1px solid", borderColor: "divider" }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 4 }}>
                        <Chip label="Practice Mode" color="primary" size="small" />
                        <Typography variant="body2" color="text.secondary" fontWeight={700}>
                            Question {currentIdx + 1}/{practiceQuestions.length}
                        </Typography>
                    </Stack>

                    <Typography variant="h5" fontWeight={800} sx={{ mb: 4 }}>
                        {currentQ.q}
                    </Typography>

                    <Stack spacing={2}>
                        {currentQ.options.map((opt) => {
                            const isCorrect = opt === currentQ.correct;
                            const isSelected = opt === selected;

                            let borderColor = "divider";
                            let bgcolor = "background.paper";

                            if (answered && isCorrect) {
                                borderColor = "success.main";
                                bgcolor = "success.light";
                            } else if (answered && isSelected) {
                                borderColor = "error.main";
                                bgcolor = "error.light";
                            }

                            return (
                                <Button
                                    key={opt}
                                    variant="outlined"
                                    onClick={() => handleSelect(opt)}
                                    sx={{
                                        justifyContent: "space-between",
                                        textAlign: "left",
                                        px: 3,
                                        py: 2,
                                        borderRadius: 3,
                                        borderWidth: 2,
                                        borderColor,
                                        bgcolor,
                                        color: "text.primary",
                                    }}
                                >
                                    <Box sx={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <Typography fontWeight={700}>{opt}</Typography>
                                        {answered && isCorrect ? <CheckCircleRoundedIcon color="success" /> : null}
                                    </Box>
                                </Button>
                            );
                        })}
                    </Stack>

                    {answered && (
                        <Paper
                            elevation={0}
                            sx={{ mt: 4, p: 3, borderRadius: 3, bgcolor: "#eff6ff", border: "1px solid", borderColor: "#bfdbfe" }}
                        >
                            <Typography variant="overline" color="primary" fontWeight={800}>
                                Expert Explanation
                            </Typography>
                            <Typography sx={{ mt: 1, color: "text.secondary" }}>{currentQ.exp}</Typography>
                            {currentIdx < practiceQuestions.length - 1 && (
                                <Button variant="contained" sx={{ mt: 3 }} onClick={handleNext}>
                                    Next Question
                                </Button>
                            )}
                        </Paper>
                    )}
                </Paper>

                <Stack spacing={3}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 4,
                            borderRadius: 4,
                            border: "1px solid",
                            borderColor: "divider",
                            background: isUnlocked
                                ? "linear-gradient(135deg, #16a34a 0%, #15803d 100%)"
                                : "background.paper",
                            color: isUnlocked ? "common.white" : "text.primary",
                        }}
                    >
                        <Box
                            sx={{
                                width: 56,
                                height: 56,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: isUnlocked ? "rgba(255,255,255,0.18)" : "grey.100",
                                mb: 3,
                            }}
                        >
                            {isUnlocked ? <RocketLaunchRoundedIcon /> : <LockRoundedIcon color="action" />}
                        </Box>

                        <Typography variant="h6" fontWeight={800} gutterBottom>
                            Mock Interview
                        </Typography>

                        {!isUnlocked ? (
                            <Stack spacing={2}>
                                <Typography color="text.secondary">
                                    Reach <strong>60%</strong> match score to unlock your first simulation.
                                </Typography>
                                <LinearProgress variant="determinate" value={matchPercentage} sx={{ height: 10, borderRadius: 999 }} />
                                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                    Currently {matchPercentage}%
                                </Typography>
                            </Stack>
                        ) : (
                            <Stack spacing={3}>
                                <Typography sx={{ color: "rgba(255,255,255,0.88)" }}>
                                    You are ready. The AI interviewer is waiting.
                                </Typography>
                                <Button variant="contained" color="inherit">
                                    Start Simulation
                                </Button>
                            </Stack>
                        )}
                    </Paper>

                    <Paper
                        elevation={0}
                        sx={{
                            p: 4,
                            borderRadius: 4,
                            color: "common.white",
                            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                        }}
                    >
                        <Typography variant="h6" fontWeight={800}>
                            Impact Tracker
                        </Typography>
                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.76)", mb: 2 }}>
                            Real-time improvement data
                        </Typography>
                        <Typography variant="h3" fontWeight={800}>
                            {matchPercentage}%
                        </Typography>
                        <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.76)" }}>
                            Current match score
                        </Typography>
                    </Paper>
                </Stack>
            </Box>
        </Box>
    );
};

export default PracticeView;
