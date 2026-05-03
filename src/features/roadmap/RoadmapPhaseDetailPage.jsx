import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Alert, Box, Button, Chip, CircularProgress, LinearProgress, Stack, Typography, alpha } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ArrowLeft, ArrowRight, BookOpen, Check, Clock, PlayCircle, RadioTower } from "lucide-react";
import { METHOD } from "../../common/constants/api";
import { callApi } from "../../common/utils/apiConnector";
import { assessmentEndPoints } from "../profiles/candidate/candidate-assessment/services/assessmentApi";
import { extractRoadmapFromResponse, getPhaseProgress, normalizeRoadmapPayload } from "./utils/roadmapPayload";
import { getLinearProgressSxForPercent, getProgressPercentCaptionSxColor } from "./utils/roadmapProgressColors";
import RubricRadarChart from "./components/RubricRadarChart";
import { PrimaryButton, SecondaryButton } from "../../common/components";

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

const PILLAR_LABELS = {
    HARD_SKILL: "Hard Skills",
    SOFT_SKILL: "Soft Skills",
    LIVE_CHECKPOINT: "Live Checkpoint",
};

const isDone = (node) => ["Complete", "Passed"].includes(node?.assessment?.status);
const isNeedsImprovement = (node) => node?.assessment?.status === "Needs Improvement";
const isCheckpoint = (node) => node?.pillar_type === "LIVE_CHECKPOINT";

function getNodeProgress(node) {
    return Math.max(0, Math.min(100, Number(node?.assessment?.progress) || 0));
}

function getCurrentNodeIndex(nodes) {
    const activeIndex = nodes.findIndex((node) => !isDone(node));
    return activeIndex >= 0 ? activeIndex : Math.max(nodes.length - 1, 0);
}

const questionBankIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isQuestionBankId(id) {
    return typeof id === "string" && questionBankIdPattern.test(id.trim());
}

function buildPracticeItems(node) {
    const drills = Array.isArray(node?.interview_drills) ? node.interview_drills : [];
    const childQuestions = (node?.child_skills ?? [])
        .flatMap((child) => {
            if (typeof child === "string") return [];
            return (child.questions ?? []).map((question) => ({
                title: question.title,
                tags: [child.name, question.difficulty].filter(Boolean),
                questionId: isQuestionBankId(question.id) ? question.id.trim() : null,
            }));
        })
        .filter((item) => item.title);

    const drillItems = drills.map((drill) => ({ title: drill, tags: [node?.skill_name].filter(Boolean) }));
    return [...childQuestions, ...drillItems].slice(0, 3);
}

function PhaseSkillSidebar({ phase, nodes, progress }) {
    const theme = useTheme();
    const phaseBarSx = getLinearProgressSxForPercent(theme, progress);

    return (
        <Box
            component="aside"
            sx={{
                width: { xs: "100%", lg: 330 },
                flexShrink: 0,
                borderRight: { xs: "none", lg: 1 },
                borderColor: "divider",
                bgcolor: "background.paper",
                p: { xs: 2.5, md: 3 },
            }}
        >
            <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.15, mb: 2 }}>
                {phase.phase_name}
            </Typography>
            <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                    height: 7,
                    borderRadius: 999,
                    mb: 0.75,
                    ...phaseBarSx,
                    "& .MuiLinearProgress-bar": {
                        borderRadius: 999,
                        ...phaseBarSx["& .MuiLinearProgress-bar"],
                    },
                }}
            />
            <Typography
                variant="caption"
                sx={{ fontWeight: 800, color: getProgressPercentCaptionSxColor(progress) }}
            >
                {progress}% complete
            </Typography>

            <Typography
                variant="overline"
                color="text.secondary"
                sx={{ display: "block", mt: 3, mb: 1.25, fontWeight: 900 }}
            >
                Your Skills
            </Typography>

            <Stack spacing={1.25}>
                {nodes.map((node) => {
                    const nodeProgress = getNodeProgress(node);
                    const skillBarSx = getLinearProgressSxForPercent(theme, nodeProgress);
                    return (
                        <Box
                            key={node.skill_id}
                            sx={{
                                border: 1,
                                borderColor: "divider",
                                borderRadius: 2,
                                p: 1.5,
                                bgcolor: "background.default",
                            }}
                        >
                            <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ mb: 0.75 }}>
                                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                    {node.skill_name}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{ fontWeight: 800, color: getProgressPercentCaptionSxColor(nodeProgress) }}
                                >
                                    {nodeProgress}%
                                </Typography>
                            </Stack>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
                                {PILLAR_LABELS[node.pillar_type] ?? "Hard Skills"}
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={nodeProgress}
                                sx={{
                                    height: 5,
                                    borderRadius: 999,
                                    ...skillBarSx,
                                    "& .MuiLinearProgress-bar": {
                                        borderRadius: 999,
                                        ...skillBarSx["& .MuiLinearProgress-bar"],
                                    },
                                }}
                            />
                        </Box>
                    );
                })}
            </Stack>
        </Box>
    );
}

function TimelineMarker({ state }) {
    const theme = useTheme();
    const icon = state === "done" ? <Check size={16} /> : <PlayCircle size={17} />;

    return (
        <Box
            sx={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                border: 1,
                borderColor:
                    state === "done" ? "success.light" : alpha(theme.palette.primary.main, 0.4),
                bgcolor:
                    state === "done"
                        ? alpha(theme.palette.success.main, 0.14)
                        : alpha(theme.palette.primary.main, 0.12),
                color: state === "done" ? "success.main" : "primary.main",
                zIndex: 1,
            }}
        >
            {icon}
        </Box>
    );
}

function RecommendedPracticeList({ items }) {
    if (!items.length) return null;

    return (
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 900 }}>
                Recommended Practice
            </Typography>
            <Stack spacing={1.25} sx={{ mt: 1 }}>
                {items.map((item, index) => {
                    const row = (
                        <>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                    {item.title}
                                </Typography>
                                <Stack direction="row" spacing={0.75} sx={{ mt: 0.75, flexWrap: "wrap", rowGap: 0.75 }}>
                                    {(item.tags ?? []).slice(0, 2).map((tag) => (
                                        <Chip key={tag} label={tag} size="small" sx={{ height: 20, fontSize: 11 }} />
                                    ))}
                                </Stack>
                            </Box>
                            <ArrowRight size={16} />
                        </>
                    );
                    const key = `${item.title}-${index}`;
                    if (item.questionId) {
                        return (
                            <Box
                                key={key}
                                component={RouterLink}
                                to={`/questions/${encodeURIComponent(item.questionId)}`}
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 2,
                                    border: 1,
                                    borderColor: "divider",
                                    borderRadius: 2,
                                    p: 1.5,
                                    bgcolor: "background.default",
                                    textDecoration: "none",
                                    color: "inherit",
                                    "&:hover": { bgcolor: "action.hover" },
                                }}
                            >
                                {row}
                            </Box>
                        );
                    }
                    return (
                        <Box
                            key={key}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 2,
                                border: 1,
                                borderColor: "divider",
                                borderRadius: 2,
                                p: 1.5,
                                bgcolor: "background.default",
                            }}
                        >
                            {row}
                        </Box>
                    );
                })}
            </Stack>
        </Box>
    );
}

function PhaseStepCard({ node, index, currentIndex, onPractice, onSchedule }) {
    const theme = useTheme();
    const done = isDone(node);
    const current = index === currentIndex && !done;
    const state = done ? "done" : "current";
    const practices = buildPracticeItems(node);
    const duration = isCheckpoint(node) ? "60m" : "45m";

    return (
        <Box sx={{ display: "grid", gridTemplateColumns: "48px minmax(0, 1fr)", gap: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "center", position: "relative" }}>
                <TimelineMarker state={state} />
                <Box
                    sx={{
                        position: "absolute",
                        top: 42,
                        bottom: -28,
                        width: "max(2px, 0.05rem)",
                        bgcolor: (t) => alpha(t.palette.divider, 0.55),
                    }}
                />
            </Box>

            <Box
                sx={{
                    border: 1,
                    borderColor: current
                        ? alpha(theme.palette.primary.main, 0.5)
                        : isNeedsImprovement(node)
                          ? "warning.light"
                          : "divider",
                    borderRadius: 3,
                    p: { xs: 2, md: 2.5 },
                    bgcolor: "background.paper",
                    boxShadow: current ? `0 14px 34px ${alpha(theme.palette.primary.main, 0.14)}` : "none",
                }}
            >
                <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ mb: 1 }}>
                    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 900 }}>
                        Step {index + 1}
                    </Typography>
                    <Chip icon={<Clock size={13} />} label={duration} size="small" />
                </Stack>

                <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.75 }}>
                    {isCheckpoint(node) ? `Mock: ${node.skill_name}` : node.skill_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {node.mentor_note ||
                        node.checkpoint?.objective ||
                        "Work through this step to prepare for the phase checkpoint."}
                </Typography>

                {isCheckpoint(node) && node.checkpoint?.rubric_evaluation ? (
                    <Box sx={{ mt: 2 }}>
                        <RubricRadarChart evaluation={node.checkpoint.rubric_evaluation} />
                    </Box>
                ) : null}

                <RecommendedPracticeList items={practices} />

                <Stack direction="row" spacing={1.25} sx={{ mt: 2, flexWrap: "wrap", rowGap: 1 }}>
                    {isCheckpoint(node) ? (
                        <PrimaryButton
                            startIcon={<RadioTower size={16} />}
                            onClick={() => onSchedule(node)}
                        >
                            Schedule Mock
                        </PrimaryButton>
                    ) : (
                        <>
                            <PrimaryButton variant="contained" onClick={() => onPractice(node)}>
                                Continue Task
                            </PrimaryButton>
                            <SecondaryButton variant="text" startIcon={<BookOpen size={16} />} onClick={() => onPractice(node)}>
                                Review Materials
                            </SecondaryButton>
                        </>
                    )}
                </Stack>
            </Box>
        </Box>
    );
}

export default function RoadmapPhaseDetailPage() {
    const { phaseId } = useParams();
    const navigate = useNavigate();
    const authenticatedUserId = useSelector((state) => state.auth?.userData?.id);
    const [roadmap, setRoadmap] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const decodedPhaseId = phaseId ? decodeURIComponent(phaseId) : "";

    useEffect(() => {
        let cancelled = false;

        const loadRoadmap = async () => {
            if (!authenticatedUserId || authenticatedUserId === EMPTY_GUID) {
                setError("Please sign in to view your roadmap.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError("");
            try {
                const response = await callApi({
                    method: METHOD.GET,
                    endpoint: assessmentEndPoints.GET_ROADMAP(authenticatedUserId),
                    alertErrorMessage: false,
                    useGlobalLoading: false,
                });
                const normalized = normalizeRoadmapPayload(extractRoadmapFromResponse(response));
                if (!cancelled) {
                    setRoadmap(normalized);
                }
            } catch {
                if (!cancelled) {
                    setError("Could not load this roadmap phase.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadRoadmap();

        return () => {
            cancelled = true;
        };
    }, [authenticatedUserId]);

    const phase = useMemo(
        () => roadmap?.phases?.find((item) => item.phase_id === decodedPhaseId) ?? null,
        [decodedPhaseId, roadmap],
    );
    const nodes = phase?.nodes ?? [];
    const progress = getPhaseProgress(phase);
    const currentIndex = getCurrentNodeIndex(nodes);

    const handlePractice = (node) => {
        if (!node?.skill_name) return;
        navigate(`/questions?skill=${encodeURIComponent(node.skill_name)}`);
    };

    const handleSchedule = (node) => {
        const coach = node?.recommended_coach ?? phase?.recommended_coach ?? phase?.recommended_coaches?.[0];
        const slug = coach?.slug_profile_url ?? coach?.slugProfileUrl ?? coach?.id;
        const params = new URLSearchParams({ from: "roadmap" });
        if (node?.skill_id) params.set("roadmapNodeId", node.skill_id);
        if (slug) {
            navigate(`/profile/${encodeURIComponent(slug)}?${params.toString()}`);
            return;
        }
        params.set("smartMatch", "1");
        params.set("skill", node?.skill_name ?? "Live Mock Interview");
        navigate(`/home?${params.toString()}`);
    };

    if (loading) {
        return (
            <Stack alignItems="center" justifyContent="center" sx={{ minHeight: "70vh" }} spacing={1.5}>
                <CircularProgress />
                <Typography color="text.secondary">Loading phase...</Typography>
            </Stack>
        );
    }

    if (error || !roadmap || !phase) {
        return (
            <Stack alignItems="center" justifyContent="center" sx={{ minHeight: "70vh", p: 3 }} spacing={2}>
                <Alert severity={error ? "error" : "warning"} sx={{ maxWidth: 520 }}>
                    {error || "This roadmap phase was not found."}
                </Alert>
                <PrimaryButton onClick={() => navigate("/roadmap")}>
                    Back to Roadmap
                </PrimaryButton>
            </Stack>
        );
    }

    return (
        <Box
            sx={{
                minHeight: "calc(100vh - 80px)",
                bgcolor: "background.default",
                display: { xs: "block", lg: "flex" },
                borderTop: 1,
                borderColor: "divider",
            }}
        >
            <PhaseSkillSidebar phase={phase} nodes={nodes} progress={progress} />

            <Box component="main" sx={{ flex: 1, minWidth: 0, p: { xs: 2.5, md: 4 } }}>
                <SecondaryButton
                    startIcon={<ArrowLeft size={16} />}
                    onClick={() => navigate("/roadmap")}
                    sx={{ mb: 2 }}
                >
                    Back to roadmap
                </SecondaryButton>

                <Box
                    sx={{
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 3,
                        bgcolor: "background.paper",
                        p: { xs: 2.25, md: 3 },
                        mb: 3,
                    }}
                >
                    <Typography variant="overline" color="primary.main" sx={{ fontWeight: 900 }}>
                        Next Action
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5 }}>
                        {nodes[currentIndex]?.skill_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                        {nodes[currentIndex]?.mentor_note ||
                            nodes[currentIndex]?.checkpoint?.objective ||
                            "Continue the highlighted step to keep your phase moving."}
                    </Typography>
                </Box>

                <Stack spacing={3}>
                    {nodes.map((node, index) => (
                        <PhaseStepCard
                            key={node.skill_id}
                            node={node}
                            index={index}
                            currentIndex={currentIndex}
                            onPractice={handlePractice}
                            onSchedule={handleSchedule}
                        />
                    ))}
                </Stack>
            </Box>
        </Box>
    );
}
