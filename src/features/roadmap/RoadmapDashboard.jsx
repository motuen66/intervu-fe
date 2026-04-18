import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Alert, Box, Chip, Stack, Typography, alpha } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Check, Layers3, Link2, RefreshCw, Sparkles, Target, TrendingUp, UserRound } from "lucide-react";
import Roadmap from "./Roadmap";
import NodeDetail from "./NodeDetail";
import RoadmapSkeleton from "./RoadmapSkeleton";
import { METHOD } from "../../common/constants/api";
import { callApi } from "../../common/utils/apiConnector";
import { assessmentEndPoints } from "../profiles/candidate/candidate-assessment/services/assessmentApi.js";
import { PrimaryButton, SecondaryButton } from "../../common/components/buttons";
import useGlobalLoading from "../../common/hooks/useGlobalLoading";
import { getMonthlyWins, recordRoadmapSnapshot } from "./utils/roadmapSnapshots";

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

const getChildSkillNames = (childSkills = []) => {
    return childSkills
        .map((childSkill) => {
            if (typeof childSkill === "string") {
                return childSkill;
            }

            if (childSkill && typeof childSkill === "object") {
                return childSkill.name ?? childSkill.Name ?? "";
            }

            return "";
        })
        .filter(Boolean);
};

const normalizeRoadmapPayload = (rawRoadmap) => {
    if (!rawRoadmap) {
        return null;
    }

    const metadataSource =
        rawRoadmap.roadmap_metadata ?? rawRoadmap.roadmapMetadata ?? rawRoadmap.RoadmapMetadata ?? {};
    const phasesSource = rawRoadmap.phases ?? rawRoadmap.Phases ?? [];

    if (!Array.isArray(phasesSource) || phasesSource.length === 0) {
        return null;
    }

    const normalizedPhases = phasesSource.map((phase, phaseIndex) => {
        const nodesSource = phase.nodes ?? phase.Nodes ?? [];
        const coachesSource = phase.recommended_coaches ?? phase.recommendedCoaches ?? phase.RecommendedCoaches ?? [];
        const mockHistorySource = phase.mock_history ?? phase.mockHistory ?? phase.MockHistory ?? [];

        return {
            phase_id: phase.phase_id ?? phase.phaseId ?? phase.PhaseId ?? `phase_${phaseIndex + 1}`,
            phase_name: phase.phase_name ?? phase.phaseName ?? phase.PhaseName ?? `Phase ${phaseIndex + 1}`,
            recommended_coaches: coachesSource.map((coach, coachIndex) => ({
                id: coach.id ?? coach.Id ?? `coach_${phaseIndex}_${coachIndex}`,
                name: coach.name ?? coach.Name ?? "Unknown Coach",
                role: coach.role ?? coach.Role ?? "",
                rating: coach.rating ?? coach.Rating ?? 0,
                avatar: coach.avatar ?? coach.Avatar ?? "",
                profileUrl: coach.profileUrl ?? coach.ProfileUrl ?? coach.slugProfileUrl ?? coach.SlugProfileUrl ?? null,
            })),
            mock_history: mockHistorySource.map((mock, mockIndex) => ({
                mock_id: mock.mock_id ?? mock.mockId ?? mock.MockId ?? `mock_${phaseIndex}_${mockIndex}`,
                mock_title: mock.mock_title ?? mock.mockTitle ?? mock.MockTitle ?? "Mock Session",
                interview_type: mock.interview_type ?? mock.interviewType ?? mock.InterviewType ?? "",
                coach_name: mock.coach_name ?? mock.coachName ?? mock.CoachName ?? "",
                interviewed_at: mock.interviewed_at ?? mock.interviewedAt ?? mock.InterviewedAt ?? "",
                evaluation: mock.evaluation ?? mock.Evaluation ?? [],
            })),
            nodes: Array.isArray(nodesSource)
                ? nodesSource.map((node, nodeIndex) => {
                      const assessment = node.assessment ?? node.Assessment ?? {};
                      const childSkills = node.child_skills ?? node.childSkills ?? node.ChildSkills ?? [];

                      return {
                          skill_id: node.skill_id ?? node.skillId ?? node.SkillId ?? `skill_${phaseIndex}_${nodeIndex}`,
                          skill_name: node.skill_name ?? node.skillName ?? node.SkillName ?? "Skill",
                          assessment: {
                              current_level:
                                  assessment.current_level ?? assessment.currentLevel ?? assessment.CurrentLevel ?? "",
                              target_level:
                                  assessment.target_level ?? assessment.targetLevel ?? assessment.TargetLevel ?? "",
                              sfia_level: assessment.sfia_level ?? assessment.sfiaLevel ?? assessment.SfiaLevel ?? 0,
                              status: assessment.status ?? assessment.Status ?? "Missing",
                              progress: assessment.progress ?? assessment.Progress ?? 0,
                          },
                          child_skills: Array.isArray(childSkills)
                              ? childSkills.map((childSkill) => {
                                    if (typeof childSkill === "string") {
                                        return childSkill;
                                    }

                                    const questions = childSkill.questions ?? childSkill.Questions ?? [];
                                    return {
                                        name: childSkill.name ?? childSkill.Name ?? "",
                                        questions: Array.isArray(questions)
                                            ? questions.map((question, questionIndex) => ({
                                                  id: question.id ?? question.Id ?? `${questionIndex}`,
                                                  title: question.title ?? question.Title ?? "",
                                                  difficulty: question.difficulty ?? question.Difficulty ?? "",
                                              }))
                                            : [],
                                    };
                                })
                              : [],
                      };
                  })
                : [],
        };
    });

    return {
        roadmap_metadata: {
            target_role: metadataSource.target_role ?? metadataSource.targetRole ?? metadataSource.TargetRole ?? "",
            target_level: metadataSource.target_level ?? metadataSource.targetLevel ?? metadataSource.TargetLevel ?? "",
            total_phases:
                metadataSource.total_phases ??
                metadataSource.totalPhases ??
                metadataSource.TotalPhases ??
                normalizedPhases.length,
        },
        phases: normalizedPhases,
    };
};

const extractRoadmapFromResponse = (response) => response?.data?.roadmap ?? response?.data?.Roadmap ?? null;

const hasRoadmapContent = (value) => {
    const normalized = normalizeRoadmapPayload(value);
    return Boolean(normalized?.phases?.length);
};

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
    }, [effectiveUserId, isLoadingRoadmap, regenerateBlocked, runGenerate]);

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

    // B3: record a snapshot whenever the roadmap changes so we can show wins later
    useEffect(() => {
        if (!readOnly && effectiveUserId && sourceRoadmap) {
            recordRoadmapSnapshot(effectiveUserId, sourceRoadmap);
        }
    }, [readOnly, effectiveUserId, sourceRoadmap]);

    const monthlyWins = useMemo(() => {
        if (readOnly) return null;
        return getMonthlyWins(effectiveUserId, sourceRoadmap);
    }, [readOnly, effectiveUserId, sourceRoadmap]);

    // B4: copy a public link to the clipboard
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

    const { phaseDetailsById, nodeDetailsById } = useMemo(() => {
        const phaseMap = {};
        const nodeMap = {};

        (sourceRoadmap?.phases ?? []).forEach((phase) => {
            const normalizedNodes = phase.nodes.map((node) => {
                const rawChildSkills = node.child_skills ?? [];
                return {
                    ...node,
                    // X6: keep the structured form so NodeDetail can surface per-skill questions
                    child_skills: rawChildSkills,
                    child_skill_names: getChildSkillNames(rawChildSkills),
                    phase_id: phase.phase_id,
                    phase_name: phase.phase_name,
                };
            });

            phaseMap[phase.phase_id] = {
                ...phase,
                nodes: normalizedNodes,
            };

            normalizedNodes.forEach((node) => {
                nodeMap[node.skill_id] = node;
            });
        });

        return {
            phaseDetailsById: phaseMap,
            nodeDetailsById: nodeMap,
        };
    }, [sourceRoadmap]);

    const [selection, setSelection] = useState(() => {
        const firstPhase = sourceRoadmap?.phases?.[0];
        return {
            phase_id: firstPhase?.phase_id ?? null,
            skill_id: firstPhase?.nodes?.[0]?.skill_id ?? null,
        };
    });

    // X4: Preserve selection across roadmap refetches when the IDs still exist
    useEffect(() => {
        if (!sourceRoadmap) {
            return;
        }
        setSelection((prev) => {
            const phaseStillExists = prev.phase_id && phaseDetailsById[prev.phase_id];
            const skillStillExists = prev.skill_id && nodeDetailsById[prev.skill_id];
            if (phaseStillExists && skillStillExists) {
                return prev;
            }
            const firstPhase = sourceRoadmap.phases?.[0];
            return {
                phase_id: firstPhase?.phase_id ?? null,
                skill_id: firstPhase?.nodes?.[0]?.skill_id ?? null,
            };
        });
    }, [sourceRoadmap, phaseDetailsById, nodeDetailsById]);

    const handleRoadmapSelect = useCallback(
        (nextSelection) => {
            if (!nextSelection) {
                return;
            }

            setSelection((prevSelection) => {
                const phaseId = nextSelection.phase_id ?? prevSelection.phase_id;
                const fallbackSkillId = phaseDetailsById[phaseId]?.nodes?.[0]?.skill_id ?? null;
                const requestedSkillId = nextSelection.skill_id ?? prevSelection.skill_id;

                const skillBelongsToPhase =
                    requestedSkillId && nodeDetailsById[requestedSkillId]?.phase_id === phaseId;
                const skillId = skillBelongsToPhase ? requestedSkillId : fallbackSkillId;

                return {
                    phase_id: phaseId,
                    skill_id: skillId,
                };
            });
        },
        [nodeDetailsById, phaseDetailsById],
    );

    const selectedPhase = selection.phase_id ? (phaseDetailsById[selection.phase_id] ?? null) : null;
    const selectedSkill = selection.skill_id ? (nodeDetailsById[selection.skill_id] ?? null) : null;

    const heroGradient = `linear-gradient(110deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 56%, ${alpha(
        theme.palette.primary.light,
        0.85,
    )} 100%)`;
    const regenerateTitle = regenerateBlocked
        ? `Available again in ${formatRemaining(cooldownRemainingMs)}`
        : "Regenerate your roadmap from scratch";

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100vh",
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
                    <HeroStat
                        icon={Layers3}
                        label="PHASES"
                        value={`${roadmapMetadata.total_phases ?? 0} phases`}
                    />

                    <Box sx={{ flex: 1 }} />

                    <Stack spacing={0.5} alignItems={{ xs: "flex-start", md: "flex-end" }} direction={{ xs: "column", sm: "row" }}>
                        {/* B4: Share button — copies a public read-only link */}
                        {!readOnly && effectiveUserId ? (
                            <SecondaryButton
                                size="small"
                                onClick={handleShare}
                                aria-label="Copy public roadmap link"
                                startIcon={shareCopied ? <Check size={14} /> : <Link2 size={14} />}
                                sx={{
                                    bgcolor: "rgba(255,255,255,0.14)",
                                    color: "primary.contrastText",
                                    borderColor: "rgba(255,255,255,0.3)",
                                    "&:hover": {
                                        bgcolor: "rgba(255,255,255,0.22)",
                                        borderColor: "rgba(255,255,255,0.5)",
                                    },
                                }}
                            >
                                {shareCopied ? "Copied" : "Share"}
                            </SecondaryButton>
                        ) : null}
                        {readOnly ? (
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
                        ) : (
                        <>
                        <SecondaryButton
                            size="small"
                            onClick={handleRegenerate}
                            // disabled={isLoadingRoadmap || regenerateBlocked}
                            disabled={isLoadingRoadmap}
                            title={regenerateTitle}
                            aria-label={
                                regenerateBlocked
                                    ? `Regenerate unavailable, next available in ${formatRemaining(cooldownRemainingMs)}`
                                    : "Regenerate roadmap from scratch"
                            }
                            startIcon={
                                <RefreshCw
                                    size={14}
                                    style={{ animation: isLoadingRoadmap ? "spin 1s linear infinite" : "none" }}
                                />
                            }
                            sx={{
                                bgcolor: "rgba(255,255,255,0.14)",
                                color: "primary.contrastText",
                                borderColor: "rgba(255,255,255,0.3)",
                                "&:hover": {
                                    bgcolor: "rgba(255,255,255,0.22)",
                                    borderColor: "rgba(255,255,255,0.5)",
                                },
                                "&.Mui-disabled": {
                                    bgcolor: "rgba(255,255,255,0.08)",
                                    color: "rgba(255,255,255,0.6)",
                                    borderColor: "rgba(255,255,255,0.15)",
                                },
                            }}
                        >
                            {isLoadingRoadmap ? "Regenerating…" : "Regenerate"}
                        </SecondaryButton>
                        {regenerateBlocked && !isLoadingRoadmap ? (
                            <Typography
                                variant="caption"
                                sx={{ opacity: 0.85, fontSize: "0.7rem", letterSpacing: "0.02em" }}
                            >
                                Next available in {formatRemaining(cooldownRemainingMs)}
                            </Typography>
                        ) : null}
                        </>
                        )}
                    </Stack>
                </Stack>
            </Box>

            {/* B3: progress wins banner */}
            {!readOnly && monthlyWins && (monthlyWins.completedThisMonth > 0 || monthlyWins.improvedThisMonth > 0) ? (
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
            ) : null}

            {isLoadingRoadmap && !resolvedRoadmap ? (
                <Stack spacing={1.5} sx={{ flex: 1, minHeight: 0 }}>
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
                    <Box sx={{ flex: 1, minHeight: 0 }}>
                        <RoadmapSkeleton />
                    </Box>
                </Stack>
            ) : error && !resolvedRoadmap ? (
                <Stack
                    alignItems="center"
                    justifyContent="center"
                    spacing={2}
                    sx={{ flex: 1, p: { xs: 3, md: 5 } }}
                >
                    <Alert
                        severity="error"
                        onClose={() => setError(null)}
                        sx={{ width: "100%", maxWidth: 520, borderRadius: "12px" }}
                    >
                        {error}
                    </Alert>
                    <PrimaryButton size="small" onClick={handleRegenerate} loading={isLoadingRoadmap}>
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
                        flex: 1,
                        p: { xs: 3, md: 5 },
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
                        <PrimaryButton size="small" onClick={handleGenerateFirstTime} loading={isLoadingRoadmap}>
                            Generate roadmap
                        </PrimaryButton>
                        <SecondaryButton size="small" onClick={() => navigate("/assessment")}>
                            Go to assessment
                        </SecondaryButton>
                    </Stack>
                </Stack>
            ) : (
                <Box
                    sx={{
                        display: "grid",
                        // U5: Stack graph above detail panel on narrow screens
                        gridTemplateColumns: { xs: "1fr", md: "minmax(0, 2fr) minmax(380px, 1fr)" },
                        gridTemplateRows: { xs: "minmax(320px, 55vh) minmax(0, 1fr)", md: "1fr" },
                        flex: 1,
                        minHeight: 0,
                        overflow: "hidden",
                        bgcolor: "background.default",
                        borderRadius: "18px",
                        border: `1px solid ${theme.palette.divider}`,
                    }}
                >
                    <Box
                        sx={{
                            borderRight: { xs: "none", md: `1px solid ${theme.palette.divider}` },
                            borderBottom: { xs: `1px solid ${theme.palette.divider}`, md: "none" },
                            minWidth: 0,
                            minHeight: 0,
                        }}
                    >
                        <Roadmap
                            roadmapData={sourceRoadmap}
                            onSelectNode={handleRoadmapSelect}
                            showHeader={false}
                            height="100%"
                        />
                    </Box>

                    <Box sx={{ bgcolor: "background.paper", minWidth: 0, minHeight: 0, overflow: "auto" }}>
                        <NodeDetail phase={selectedPhase} node={selectedSkill} readOnly={readOnly} />
                    </Box>
                </Box>
            )}
        </Box>
    );
}

export default RoadmapDashboard;
