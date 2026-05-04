import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Alert, Avatar, Box, CardActionArea, Chip, LinearProgress, Stack, Typography, alpha } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Check, Layers3, PlayCircle, RefreshCw, Sparkles, Star, Target, TrendingUp, UserRound } from "lucide-react";
import RoadmapSkeleton from "./RoadmapSkeleton";
import { METHOD } from "../../common/constants/api";
import { callApi } from "../../common/utils/apiConnector";
import { assessmentEndPoints } from "../profiles/candidate/candidate-assessment/services/assessmentApi.js";
import { PrimaryButton, SecondaryButton } from "../../common/components/buttons";
import useGlobalLoading from "../../common/hooks/useGlobalLoading";
import { getMonthlyWins, recordRoadmapSnapshot } from "./utils/roadmapSnapshots";
import {
    countNodesByPillar,
    extractRoadmapFromResponse,
    getPhaseProgress,
    hasRoadmapContent,
    normalizeRoadmapPayload,
} from "./utils/roadmapPayload";
import { getLinearProgressSxForPercent, getProgressPercentCaptionSxColor } from "./utils/roadmapProgressColors";

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";
const REGENERATE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const REGENERATE_STORAGE_PREFIX = "roadmap:lastRegenerate:";
const PROGRESS_STEPS = [
    "Analyzing your skills…",
    "Identifying gaps and strengths…",
    "Drafting phase structure…",
    "Matching recommended coaches…",
    "Finalizing your roadmap…",
];
const PROGRESS_STEP_INTERVAL_MS = 2800;
const CHECKPOINT_TOAST_PREFIX = "roadmap:checkpointToast:";

const getCooldownKey = (userId) => `${REGENERATE_STORAGE_PREFIX}${userId}`;

const readLastRegenerate = (userId) => {
    if (!userId) return 0;
    try {
        const stored = window.localStorage.getItem(getCooldownKey(userId));
        const parsed = Number(stored);
        return Number.isFinite(parsed) ? parsed : 0;
    } catch {
        return 0;
    }
};

const writeLastRegenerate = (userId, timestamp) => {
    if (!userId) return;
    try {
        window.localStorage.setItem(getCooldownKey(userId), String(timestamp));
    } catch {
        // localStorage may be unavailable; cooldown simply won't persist
    }
};

const formatRemaining = (ms) => {
    if (ms <= 0) return "now";
    const totalMinutes = Math.ceil(ms / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return `${totalMinutes}m`;
};

function HeroStat({ icon: Icon, label, value }) {
    return (
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
            <Box
                sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "999px",
                    bgcolor: "rgba(255,255,255,0.14)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
            >
                <Icon size={16} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" sx={{ opacity: 0.75, display: "block", lineHeight: 1.2 }}>
                    {label}
                </Typography>
                <Typography
                    sx={{
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        lineHeight: 1.2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    {value}
                </Typography>
            </Box>
        </Stack>
    );
}

/** Matches timeline markers on RoadmapPhaseDetailPage (phase steps). */
function PhaseTimelineMarker({ state }) {
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

function PhaseOverviewCard({ phase, index, onOpen, isLast, currentPhaseIndex }) {
    const theme = useTheme();
    const progress = getPhaseProgress(phase);
    const phaseProgressBarSx = getLinearProgressSxForPercent(theme, progress);
    const counts = countNodesByPillar(phase);
    const passed = phase.status === "Passed";
    const needsImprovement = phase.status === "Needs Improvement";
    const checkpointScore = phase.checkpoint_evaluation?.total_percentage;
    const isCurrent = index === currentPhaseIndex && !passed;
    const markerState = passed ? "done" : "current";

    let borderColor = "primary.light";
    if (isCurrent) borderColor = alpha(theme.palette.primary.main, 0.5);
    else if (passed) borderColor = "success.light";
    else if (needsImprovement) borderColor = "warning.light";

    return (
        <Box sx={{ display: "grid", gridTemplateColumns: "48px minmax(0, 1fr)", gap: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "center", position: "relative" }}>
                <PhaseTimelineMarker state={markerState} />
                {!isLast ? (
                    <Box
                        sx={{
                            position: "absolute",
                            top: 42,
                            bottom: -28,
                            width: "max(2px, 0.05rem)",
                            bgcolor: (t) => alpha(t.palette.divider, 0.55),
                        }}
                    />
                ) : null}
            </Box>

            <CardActionArea
                component="button"
                type="button"
                onClick={() => onOpen(phase.phase_id)}
                sx={{
                    textAlign: "left",
                    borderRadius: 3,
                    border: 1,
                    borderColor,
                    bgcolor: "background.paper",
                    p: 2.25,
                    boxShadow: isCurrent
                        ? `0 14px 34px ${alpha(theme.palette.primary.main, 0.14)}`
                        : `0 12px 32px ${alpha(theme.palette.primary.main, 0.08)}`,
                }}
            >
                <Stack spacing={1.5}>
                    <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 800 }}>
                                Phase {index + 1}
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.15 }}>
                                {phase.phase_name}
                            </Typography>
                            {phase.phase_description ? (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        mt: 0.75,
                                        display: "-webkit-box",
                                        WebkitBoxOrient: "vertical",
                                        WebkitLineClamp: 2,
                                        overflow: "hidden",
                                    }}
                                >
                                    {phase.phase_description}
                                </Typography>
                            ) : null}
                        </Box>
                        {phase.status ? (
                            <Chip
                                size="small"
                                label={phase.status}
                                color={passed ? "success" : needsImprovement ? "warning" : "primary"}
                                variant="filled"
                                sx={{ fontWeight: 700 }}
                            />
                        ) : null}
                    </Stack>

                    <Box>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                                Phase Progress
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{ fontWeight: 700, color: getProgressPercentCaptionSxColor(progress) }}
                            >
                                {progress}%
                            </Typography>
                        </Stack>
                        <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{
                                height: 8,
                                borderRadius: 999,
                                ...phaseProgressBarSx,
                                "& .MuiLinearProgress-bar": {
                                    borderRadius: 999,
                                    ...phaseProgressBarSx["& .MuiLinearProgress-bar"],
                                },
                            }}
                        />
                    </Box>

                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                        <Chip size="small" label={`${counts.HARD_SKILL} hard`} />
                        <Chip size="small" label={`${counts.SOFT_SKILL} soft`} />
                        <Chip size="small" label={`${counts.LIVE_CHECKPOINT} checkpoint`} />
                        {checkpointScore != null ? <Chip size="small" label={`Checkpoint ${checkpointScore}%`} /> : null}
                    </Stack>
                </Stack>
            </CardActionArea>
        </Box>
    );
}

function mergePhaseCoachesForAside(phase) {
    if (!phase) return [];
    const out = [];
    const seen = new Set();
    const push = (raw) => {
        if (!raw) return;
        const id = String(raw.id ?? raw.Id ?? "").trim();
        const slug =
            raw.slug_profile_url ?? raw.slugProfileUrl ?? raw.SlugProfileUrl ?? raw.profileUrl ?? id ?? "";
        const key = id || slug;
        if (!key || seen.has(key)) return;
        seen.add(key);
        out.push({
            id: id || key,
            name: raw.name ?? raw.Name ?? "Coach",
            role: raw.role ?? raw.Role ?? "",
            rating: Number(raw.rating ?? raw.Rating ?? 0) || 0,
            photo: raw.avatar_url ?? raw.avatarUrl ?? raw.AvatarUrl ?? raw.avatar ?? raw.Avatar ?? "",
            slug: slug || id,
        });
    };
    push(phase.recommended_coach);
    (phase.recommended_coaches ?? []).forEach(push);
    return out;
}

function RoadmapOverviewAside({
    focusPhase,
    focusPhaseIndex,
    totalPhases,
    roadmapMetadata,
    totalProgress,
    onOpenPhase,
    onOpenCoachProfile,
}) {
    const theme = useTheme();
    if (!focusPhase) return null;

    const progress = getPhaseProgress(focusPhase);
    const phaseBarSx = getLinearProgressSxForPercent(theme, progress);
    const passed = focusPhase.status === "Passed";
    const needsImprovement = focusPhase.status === "Needs Improvement";
    const coaches = mergePhaseCoachesForAside(focusPhase);

    return (
        <Box
            component="aside"
            sx={{
                width: { xs: "100%", lg: 320 },
                flexShrink: 0,
                bgcolor: "background.paper",
                border: 1,
                borderColor: "divider",
                borderRadius: 3,
                p: { xs: 2.25, md: 2.5 },
                alignSelf: { lg: "stretch" },
            }}
        >
            <Stack spacing={2.25}>
                <Box>
                    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 900, display: "block" }}>
                        Current phase
                    </Typography>
                    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1} sx={{ mt: 0.75 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.3 }}>
                            {focusPhase.phase_name}
                        </Typography>
                        {focusPhase.status ? (
                            <Chip
                                size="small"
                                label={focusPhase.status}
                                color={passed ? "success" : needsImprovement ? "warning" : "primary"}
                                variant="filled"
                                sx={{ fontWeight: 700, flexShrink: 0 }}
                            />
                        ) : null}
                    </Stack>
                    {focusPhase.phase_description ? (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                mt: 1,
                                display: "-webkit-box",
                                WebkitBoxOrient: "vertical",
                                WebkitLineClamp: 3,
                                overflow: "hidden",
                                lineHeight: 1.55,
                            }}
                        >
                            {focusPhase.phase_description}
                        </Typography>
                    ) : null}
                    <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.25, mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                            Progress
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{ fontWeight: 800, color: getProgressPercentCaptionSxColor(progress) }}
                        >
                            {progress}%
                        </Typography>
                    </Stack>
                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                            height: 7,
                            borderRadius: 999,
                            ...phaseBarSx,
                            "& .MuiLinearProgress-bar": {
                                borderRadius: 999,
                                ...phaseBarSx["& .MuiLinearProgress-bar"],
                            },
                        }}
                    />
                    <PrimaryButton size="sm" fullWidth sx={{ mt: 1.5 }} onClick={() => onOpenPhase(focusPhase.phase_id)}>
                        View phase
                    </PrimaryButton>
                </Box>

                <Box sx={{ borderTop: 1, borderColor: "divider", pt: 2 }}>
                    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 900, display: "block", mb: 1 }}>
                        Recommended coaches
                    </Typography>
                    {coaches.length === 0 ? (
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                            No coaches linked for this phase yet.
                        </Typography>
                    ) : (
                        <Stack spacing={1}>
                            {coaches.map((coach) => (
                                <CardActionArea
                                    key={coach.id}
                                    component="button"
                                    type="button"
                                    disabled={!coach.slug}
                                    onClick={() => coach.slug && onOpenCoachProfile(coach.slug)}
                                    sx={{
                                        borderRadius: 2,
                                        border: 1,
                                        borderColor: "divider",
                                        bgcolor: "background.default",
                                        p: 1.25,
                                        textAlign: "left",
                                        "&.Mui-disabled": { opacity: 0.55 },
                                    }}
                                >
                                    <Stack direction="row" spacing={1.25} alignItems="center">
                                        <Avatar
                                            src={coach.photo || undefined}
                                            alt=""
                                            sx={{ width: 40, height: 40, bgcolor: "action.hover" }}
                                        >
                                            {coach.name?.charAt(0) ?? "?"}
                                        </Avatar>
                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 800 }} noWrap>
                                                {coach.name}
                                            </Typography>
                                            {coach.role ? (
                                                <Typography variant="caption" color="text.secondary" noWrap>
                                                    {coach.role}
                                                </Typography>
                                            ) : null}
                                            {coach.rating > 0 ? (
                                                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.25 }}>
                                                    <Star size={12} color={theme.palette.warning.main} fill={theme.palette.warning.main} />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {coach.rating.toFixed(1)}
                                                    </Typography>
                                                </Stack>
                                            ) : null}
                                        </Box>
                                    </Stack>
                                </CardActionArea>
                            ))}
                        </Stack>
                    )}
                </Box>

                <Box sx={{ borderTop: 1, borderColor: "divider", pt: 2 }}>
                    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 900, display: "block", mb: 1 }}>
                        Roadmap
                    </Typography>
                    <Stack spacing={0.75}>
                        <Typography variant="body2" color="text.secondary">
                            <Typography component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
                                Role:
                            </Typography>{" "}
                            {roadmapMetadata.target_role || "—"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <Typography component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
                                Level:
                            </Typography>{" "}
                            {roadmapMetadata.target_level || "—"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <Typography component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
                                Focus:
                            </Typography>{" "}
                            Phase {focusPhaseIndex + 1} of {totalPhases}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <Typography component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
                                Overall:
                            </Typography>{" "}
                            <Typography component="span" sx={{ color: getProgressPercentCaptionSxColor(totalProgress) }}>
                                {totalProgress}%
                            </Typography>
                        </Typography>
                    </Stack>
                </Box>
            </Stack>
        </Box>
    );
}

function RoadmapDashboard({ roadmap = null, userId: userIdProp = null, readOnly = false }) {
    const navigate = useNavigate();
    const theme = useTheme();
    const authenticatedUserId = useSelector((state) => state.auth?.userData?.id);
    const effectiveUserId = userIdProp ?? authenticatedUserId ?? null;
    const { withLoading } = useGlobalLoading();
    const [resolvedRoadmap, setResolvedRoadmap] = useState(() => (hasRoadmapContent(roadmap) ? roadmap : null));
    const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(false);
    const [error, setError] = useState(null);
    const [progressStepIndex, setProgressStepIndex] = useState(0);
    const [cooldownTick, setCooldownTick] = useState(0);
    // eslint-disable-next-line no-unused-vars
    const [shareCopied, setShareCopied] = useState(false);
    const progressTimerRef = useRef(null);

    // X3: Rotate through step messages while the LLM call is in flight
    useEffect(() => {
        if (isLoadingRoadmap) {
            setProgressStepIndex(0);
            progressTimerRef.current = window.setInterval(() => {
                setProgressStepIndex((prev) => Math.min(prev + 1, PROGRESS_STEPS.length - 1));
            }, PROGRESS_STEP_INTERVAL_MS);
            return () => {
                if (progressTimerRef.current) {
                    window.clearInterval(progressTimerRef.current);
                    progressTimerRef.current = null;
                }
            };
        }
        return undefined;
    }, [isLoadingRoadmap]);

    // Tick once a minute so the cooldown countdown stays fresh
    useEffect(() => {
        const id = window.setInterval(() => setCooldownTick((t) => t + 1), 60_000);
        return () => window.clearInterval(id);
    }, []);

    const lastRegenerateAt = readLastRegenerate(effectiveUserId);
    const cooldownRemainingMs = Math.max(0, lastRegenerateAt + REGENERATE_COOLDOWN_MS - Date.now());
    const regenerateBlocked = cooldownRemainingMs > 0;
    void cooldownTick;

    const runGenerate = useCallback(
        async ({ forceRegenerate }) => {
            if (!effectiveUserId || effectiveUserId === EMPTY_GUID) return null;
            const generateResponse = await callApi({
                method: METHOD.POST,
                endpoint: assessmentEndPoints.GENERATE_ROADMAP(),
                arg: {
                    userId: effectiveUserId,
                    forceRegenerate,
                },
                alertErrorMessage: false,
                useGlobalLoading: false,
            });
            return extractRoadmapFromResponse(generateResponse);
        },
        [effectiveUserId],
    );

    const handleRegenerate = useCallback(async () => {
        if (!effectiveUserId || effectiveUserId === EMPTY_GUID || isLoadingRoadmap) return;
        // if (regenerateBlocked) return;

        setIsLoadingRoadmap(true);
        setError(null);
        try {
            const nextRoadmap = await runGenerate({ forceRegenerate: true });
            if (hasRoadmapContent(nextRoadmap)) {
                setResolvedRoadmap(nextRoadmap);
                writeLastRegenerate(effectiveUserId, Date.now());
                setCooldownTick((t) => t + 1);
            } else {
                setError("Regeneration returned no content. Please try again.");
            }
        } catch {
            setError("Regeneration failed. Please try again.");
        } finally {
            setIsLoadingRoadmap(false);
        }
    }, [effectiveUserId, isLoadingRoadmap, runGenerate]);

    const handleGenerateFirstTime = useCallback(async () => {
        if (!effectiveUserId || effectiveUserId === EMPTY_GUID || isLoadingRoadmap) return;
        setIsLoadingRoadmap(true);
        setError(null);
        try {
            const nextRoadmap = await runGenerate({ forceRegenerate: false });
            if (hasRoadmapContent(nextRoadmap)) {
                setResolvedRoadmap(nextRoadmap);
            } else {
                setError("Could not generate your roadmap. Please complete your assessment first.");
            }
        } catch {
            setError("Could not generate your roadmap. Please try again later.");
        } finally {
            setIsLoadingRoadmap(false);
        }
    }, [effectiveUserId, isLoadingRoadmap, runGenerate]);

    useEffect(() => {
        if (hasRoadmapContent(roadmap)) {
            setResolvedRoadmap(roadmap);
        }
    }, [roadmap]);

    useEffect(() => {
        let cancelled = false;

        if (!effectiveUserId || effectiveUserId === EMPTY_GUID) {
            return () => {
                cancelled = true;
            };
        }

        const syncRoadmap = async () => {
            setIsLoadingRoadmap(true);
            setError(null);

            let nextRoadmap = null;
            let shouldGenerateRoadmap = false;
            let syncError = null;

            try {
                const fetchResponse = await callApi({
                    method: METHOD.GET,
                    endpoint: assessmentEndPoints.GET_ROADMAP(effectiveUserId),
                    alertErrorMessage: false,
                    useGlobalLoading: false,
                });
                nextRoadmap = extractRoadmapFromResponse(fetchResponse);
                shouldGenerateRoadmap = !hasRoadmapContent(nextRoadmap);
            } catch (err) {
                if (err?.response?.status === 404) {
                    shouldGenerateRoadmap = true;
                } else {
                    syncError = "Failed to load your roadmap. Please try again.";
                }
            }

            if (!syncError && shouldGenerateRoadmap) {
                try {
                    nextRoadmap = await runGenerate({ forceRegenerate: false });
                    if (!hasRoadmapContent(nextRoadmap)) {
                        syncError = "Could not generate your roadmap. Please complete your assessment first.";
                    }
                } catch {
                    syncError = "Could not generate your roadmap. Please try again later.";
                }
            }

            if (!cancelled) {
                if (!syncError && hasRoadmapContent(nextRoadmap)) {
                    setResolvedRoadmap(nextRoadmap);
                } else if (syncError) {
                    setError(syncError);
                }
                setIsLoadingRoadmap(false);
            }
        };

        syncRoadmap();

        return () => {
            cancelled = true;
        };
    }, [effectiveUserId, withLoading, runGenerate]);

    const sourceRoadmap = useMemo(
        () => normalizeRoadmapPayload(resolvedRoadmap ?? roadmap) ?? null,
        [resolvedRoadmap, roadmap],
    );
    const roadmapMetadata = sourceRoadmap?.roadmap_metadata ?? {};
    const masteredSummary = sourceRoadmap?.mastered_summary ?? [];

    // B3: record a snapshot whenever the roadmap changes so we can show wins later
    useEffect(() => {
        if (!readOnly && effectiveUserId && sourceRoadmap) {
            recordRoadmapSnapshot(effectiveUserId, sourceRoadmap);
        }
    }, [readOnly, effectiveUserId, sourceRoadmap]);

    useEffect(() => {
        if (readOnly || !sourceRoadmap) return;

        const latestEvaluation = sourceRoadmap.phases
            ?.map((phase) => ({
                phaseName: phase.phase_name,
                evaluation: phase.checkpoint_evaluation,
            }))
            .filter((entry) => entry.evaluation?.interview_room_id)
            .sort((a, b) => new Date(b.evaluation.submitted_at || 0) - new Date(a.evaluation.submitted_at || 0))[0];

        if (!latestEvaluation) return;

        const key = `${CHECKPOINT_TOAST_PREFIX}${latestEvaluation.evaluation.interview_room_id}`;
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, "1");

        if (latestEvaluation.evaluation.status === "Passed") {
            toast.success(`Phase passed: ${latestEvaluation.phaseName}`);
        } else if (latestEvaluation.evaluation.status === "Needs Improvement") {
            toast.error("Checkpoint needs improvement. Review your focus areas.");
        }
    }, [readOnly, sourceRoadmap]);

    const monthlyWins = useMemo(() => {
        if (readOnly) return null;
        return getMonthlyWins(effectiveUserId, sourceRoadmap);
    }, [readOnly, effectiveUserId, sourceRoadmap]);

    // B4: copy a public link to the clipboard
    // eslint-disable-next-line no-unused-vars
    const handleShare = useCallback(async () => {
        if (!effectiveUserId) return;
        const shareUrl = `${window.location.origin}/roadmap/public/${effectiveUserId}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setShareCopied(true);
            window.setTimeout(() => setShareCopied(false), 2000);
        } catch {
            window.prompt("Copy this link to share your roadmap:", shareUrl);
        }
    }, [effectiveUserId]);

    const totalProgress = useMemo(() => {
        const phases = sourceRoadmap?.phases ?? [];
        if (!phases.length) return 0;
        return Math.round(phases.reduce((sum, phase) => sum + getPhaseProgress(phase), 0) / phases.length);
    }, [sourceRoadmap]);

    const overallProgressBarSx = useMemo(
        () => getLinearProgressSxForPercent(theme, totalProgress),
        [theme, totalProgress],
    );

    const currentPhaseIndex = useMemo(() => {
        const phases = sourceRoadmap?.phases ?? [];
        const active = phases.findIndex((p) => p.status !== "Passed");
        return active >= 0 ? active : Math.max(phases.length - 1, 0);
    }, [sourceRoadmap]);

    const handleOpenPhase = useCallback(
        (phaseId) => {
            if (phaseId) {
                navigate(`/roadmap/phase/${encodeURIComponent(phaseId)}`);
            }
        },
        [navigate],
    );

    const handleOpenCoachProfile = useCallback(
        (slug) => {
            if (slug) {
                navigate(`/profile/${encodeURIComponent(slug)}`);
            }
        },
        [navigate],
    );

    const heroGradient = `linear-gradient(110deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 56%, ${alpha(
        theme.palette.primary.light,
        0.85,
    )} 100%)`;
    // eslint-disable-next-line no-unused-vars
    const regenerateTitle = regenerateBlocked
        ? `Available again in ${formatRemaining(cooldownRemainingMs)}`
        : "Regenerate your roadmap from scratch";

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                minHeight: "100vh",
                p: 2.5,
                boxSizing: "border-box",
                gap: 2,
                bgcolor: "background.default",
            }}
        >
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

            {/* U4: Compact hero header */}
            <Box
                sx={{
                    borderRadius: "20px",
                    px: { xs: 2.5, md: 3.5 },
                    py: { xs: 2, md: 2.25 },
                    background: heroGradient,
                    color: "primary.contrastText",
                    boxShadow: (t) => `0 10px 30px ${alpha(t.palette.primary.main, 0.25)}`,
                }}
            >
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    alignItems={{ xs: "flex-start", md: "center" }}
                    spacing={{ xs: 1.5, md: 3 }}
                    divider={
                        <Box
                            sx={{
                                display: { xs: "none", md: "block" },
                                width: "1px",
                                alignSelf: "stretch",
                                bgcolor: "rgba(255,255,255,0.2)",
                            }}
                        />
                    }
                >
                    <Stack spacing={0.75} sx={{ minWidth: 0, flexShrink: 0 }}>
                        <Chip
                            icon={<Sparkles size={13} color={theme.palette.secondary.main} />}
                            label={isLoadingRoadmap ? "Syncing roadmap…" : "Your personalized roadmap"}
                            size="small"
                            sx={{
                                bgcolor: "rgba(255,255,255,0.1)",
                                color: "inherit",
                                border: "1px solid rgba(255,255,255,0.2)",
                                fontWeight: 700,
                                letterSpacing: "0.04em",
                                "& .MuiChip-icon": { color: theme.palette.secondary.main, ml: 0.75 },
                                alignSelf: "flex-start",
                            }}
                        />
                        <Typography
                            sx={{
                                fontFamily: theme.typography.h2.fontFamily,
                                fontWeight: 800,
                                fontSize: { xs: "1.4rem", md: "1.65rem" },
                                lineHeight: 1.15,
                                letterSpacing: "-0.01em",
                            }}
                        >
                            {roadmapMetadata.target_role || "Personalized Learning Path"}
                        </Typography>
                    </Stack>

                    <HeroStat icon={UserRound} label="TARGET ROLE" value={roadmapMetadata.target_role || "N/A"} />
                    <HeroStat icon={Target} label="TARGET LEVEL" value={roadmapMetadata.target_level || "N/A"} />
                    <HeroStat icon={Layers3} label="PHASES" value={`${roadmapMetadata.total_phases ?? 0} phases`} />

                    {readOnly && (
                        <>
                            <Box sx={{ flex: 1 }} />
                            <Stack
                                spacing={0.5}
                                alignItems={{ xs: "flex-start", md: "flex-end" }}
                                direction={{ xs: "column", sm: "row" }}
                            >
                                <Chip
                                    size="small"
                                    label="Read-only view"
                                    sx={{
                                        bgcolor: "rgba(255,255,255,0.14)",
                                        color: "inherit",
                                        border: "1px solid rgba(255,255,255,0.3)",
                                        fontWeight: 700,
                                    }}
                                />
                            </Stack>
                        </>
                    )}
                </Stack>
            </Box>

            {/* B3: progress wins banner */}
            {/* {!readOnly && monthlyWins && (monthlyWins.completedThisMonth > 0 || monthlyWins.improvedThisMonth > 0) ? (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        px: 2,
                        py: 1.25,
                        borderRadius: "12px",
                        bgcolor: alpha(theme.palette.success.main, 0.08),
                        border: `1px solid ${alpha(theme.palette.success.main, 0.25)}`,
                        color: "text.primary",
                    }}
                >
                    <TrendingUp size={16} color={theme.palette.success.main} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {monthlyWins.completedThisMonth > 0
                            ? `You moved ${monthlyWins.completedThisMonth} skill${monthlyWins.completedThisMonth === 1 ? "" : "s"} to Complete this month`
                            : `You improved ${monthlyWins.improvedThisMonth} skill${monthlyWins.improvedThisMonth === 1 ? "" : "s"} from Missing to Weak this month`}
                        {monthlyWins.completedThisMonth > 0 && monthlyWins.improvedThisMonth > 0
                            ? ` · and improved ${monthlyWins.improvedThisMonth} more`
                            : ""}
                    </Typography>
                </Box>
            ) : null} */}

            {/* Phase 5.3: skills the candidate already meets target on. Backend
                surfaces these via mastered_summary so the FE can show "credit
                where it's due" without polluting the roadmap with completed nodes. */}
            {masteredSummary.length > 0 ? (
                <Box
                    sx={{
                        px: 2,
                        py: 1.25,
                        borderRadius: "12px",
                        bgcolor: alpha(theme.palette.success.main, 0.06),
                        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                    }}
                >
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems={{ sm: "center" }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                            <Check size={16} color={theme.palette.success.main} />
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
                                Skills you already have
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                ({masteredSummary.length})
                            </Typography>
                        </Stack>
                        <Stack
                            direction="row"
                            spacing={0.75}
                            sx={{ flexWrap: "wrap", rowGap: 0.75, flex: 1, minWidth: 0 }}
                        >
                            {masteredSummary.map((item) => (
                                <Chip
                                    key={item.skill_id || item.skill_name}
                                    size="small"
                                    label={item.skill_name}
                                    title={`Current ${item.current_level} ≥ target ${item.target_level}`}
                                    sx={{
                                        bgcolor: alpha(theme.palette.success.main, 0.12),
                                        color: theme.palette.success.dark,
                                        fontWeight: 600,
                                        border: `1px solid ${alpha(theme.palette.success.main, 0.25)}`,
                                    }}
                                />
                            ))}
                        </Stack>
                    </Stack>
                </Box>
            ) : null}

            {isLoadingRoadmap && !resolvedRoadmap ? (
                <Stack spacing={1.5} sx={{ py: 1 }}>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            px: 2,
                            py: 1.25,
                            borderRadius: "12px",
                            bgcolor: "background.paper",
                            border: `1px solid ${theme.palette.divider}`,
                        }}
                    >
                        <RefreshCw
                            size={16}
                            color={theme.palette.primary.main}
                            style={{ animation: "spin 1.2s linear infinite" }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                            {PROGRESS_STEPS[progressStepIndex]}
                        </Typography>
                        <Box sx={{ flex: 1 }} />
                        <Typography variant="caption" color="text.secondary">
                            Step {progressStepIndex + 1} of {PROGRESS_STEPS.length}
                        </Typography>
                    </Box>
                    <Box>
                        <RoadmapSkeleton />
                    </Box>
                </Stack>
            ) : error && !resolvedRoadmap ? (
                <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ py: { xs: 5, md: 8 }, px: { xs: 3, md: 5 } }}>
                    <Alert
                        severity="error"
                        onClose={() => setError(null)}
                        sx={{ width: "100%", maxWidth: 520, borderRadius: "12px" }}
                    >
                        {error}
                    </Alert>
                    <PrimaryButton size="sm" onClick={handleRegenerate} loading={isLoadingRoadmap}>
                        Retry
                    </PrimaryButton>
                </Stack>
            ) : !sourceRoadmap ? (
                // X2: Offer inline generation in addition to the assessment link
                <Stack
                    alignItems="center"
                    justifyContent="center"
                    spacing={1.25}
                    sx={{
                        py: { xs: 5, md: 8 },
                        px: { xs: 3, md: 5 },
                        color: "text.secondary",
                        textAlign: "center",
                    }}
                >
                    <Typography sx={{ fontSize: "48px", lineHeight: 1 }}>🗺️</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
                        No roadmap yet
                    </Typography>
                    <Typography variant="body2" sx={{ maxWidth: 400, lineHeight: 1.6 }}>
                        Generate your personalized learning path now. If you haven&apos;t finished your skills
                        assessment, we&apos;ll ask you to complete it first.
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 1 }}>
                        <PrimaryButton size="sm" onClick={handleGenerateFirstTime} loading={isLoadingRoadmap}>
                            Generate roadmap
                        </PrimaryButton>
                        <SecondaryButton size="sm" onClick={() => navigate("/assessment")}>
                            Go to assessment
                        </SecondaryButton>
                    </Stack>
                </Stack>
            ) : (
                <Box
                    sx={{
                        bgcolor: "background.default",
                        borderRadius: "18px",
                        border: `1px solid ${theme.palette.divider}`,
                        p: { xs: 2, md: 3 },
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: { xs: "column", lg: "row" },
                            alignItems: "flex-start",
                            gap: { xs: 2.5, lg: 3 },
                        }}
                    >
                        <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
                            <Stack spacing={2.5}>
                                <Box>
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
                                                Roadmap phases
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Review each phase at a glance. Open a phase to work through its hard skills,
                                                soft skills, and live checkpoint.
                                            </Typography>
                                        </Box>
                                        <Box sx={{ minWidth: { xs: "100%", md: 220 } }}>
                                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                                                    Overall progress
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        fontWeight: 800,
                                                        color: getProgressPercentCaptionSxColor(totalProgress),
                                                    }}
                                                >
                                                    {totalProgress}%
                                                </Typography>
                                            </Stack>
                                            <LinearProgress
                                                variant="determinate"
                                                value={totalProgress}
                                                sx={{
                                                    height: 10,
                                                    borderRadius: 999,
                                                    ...overallProgressBarSx,
                                                    "& .MuiLinearProgress-bar": {
                                                        borderRadius: 999,
                                                        ...overallProgressBarSx["& .MuiLinearProgress-bar"],
                                                    },
                                                }}
                                            />
                                        </Box>
                                    </Stack>
                                </Box>

                                <Stack spacing={3}>
                                    {sourceRoadmap.phases.map((phase, index) => (
                                        <PhaseOverviewCard
                                            key={phase.phase_id}
                                            phase={phase}
                                            index={index}
                                            isLast={index === sourceRoadmap.phases.length - 1}
                                            currentPhaseIndex={currentPhaseIndex}
                                            onOpen={handleOpenPhase}
                                        />
                                    ))}
                                </Stack>
                            </Stack>
                        </Box>

                        <RoadmapOverviewAside
                            focusPhase={
                                sourceRoadmap.phases[currentPhaseIndex] ?? sourceRoadmap.phases[0] ?? null
                            }
                            focusPhaseIndex={currentPhaseIndex}
                            totalPhases={sourceRoadmap.phases.length}
                            roadmapMetadata={roadmapMetadata}
                            totalProgress={totalProgress}
                            onOpenPhase={handleOpenPhase}
                            onOpenCoachProfile={handleOpenCoachProfile}
                        />
                    </Box>
                </Box>
            )}
        </Box>
    );
}

export default RoadmapDashboard;
