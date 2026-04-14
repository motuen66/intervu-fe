import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Alert } from "@mui/material";
import { Layers3, RefreshCw, Sparkles, Target, UserRound } from "lucide-react";
import Roadmap from "./Roadmap";
import NodeDetail from "./NodeDetail";
import RoadmapSkeleton from "./RoadmapSkeleton";
import { theme } from "../../common/constants/theme";
import { assessmentApi } from "../profiles/candidate/candidate-assessment/services/assessmentApi";
import { PrimaryButton } from "../../common/components/buttons";
import useGlobalLoading from "../../common/hooks/useGlobalLoading";

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

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

function RoadmapDashboard({ roadmap = null, userId: userIdProp = null }) {
    const navigate = useNavigate();
    const authenticatedUserId = useSelector((state) => state.auth?.userData?.id);
    const effectiveUserId = userIdProp ?? authenticatedUserId ?? null;
    const { withLoading } = useGlobalLoading();
    const [resolvedRoadmap, setResolvedRoadmap] = useState(() => (hasRoadmapContent(roadmap) ? roadmap : null));
    const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(false);
    const [error, setError] = useState(null);

    const handleRegenerate = useCallback(async () => {
        if (!effectiveUserId || effectiveUserId === EMPTY_GUID || isLoadingRoadmap) return;
        setIsLoadingRoadmap(true);
        setError(null);
        try {
            const generateResponse = await assessmentApi.generateRoadmapFromSurvey({
                userId: effectiveUserId,
                forceRegenerate: true,
            });
            const nextRoadmap = extractRoadmapFromResponse(generateResponse);
            if (hasRoadmapContent(nextRoadmap)) {
                setResolvedRoadmap(nextRoadmap);
            } else {
                setError("Regeneration returned no content. Please try again.");
            }
        } catch (err) {
            setError("Regeneration failed. Please try again.");
        } finally {
            setIsLoadingRoadmap(false);
        }
    }, [effectiveUserId, isLoadingRoadmap]);

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
                const fetchResponse = await assessmentApi.getRoadmapByUserId(effectiveUserId);
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
                    const generateResponse = await assessmentApi.generateRoadmapFromSurvey({
                        userId: effectiveUserId,
                        forceRegenerate: false,
                    });
                    nextRoadmap = extractRoadmapFromResponse(generateResponse);
                    if (!hasRoadmapContent(nextRoadmap)) {
                        syncError = "Could not generate your roadmap. Please complete your assessment first.";
                    }
                } catch (err) {
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
    }, [effectiveUserId, withLoading]);

    const sourceRoadmap = useMemo(() => normalizeRoadmapPayload(resolvedRoadmap ?? roadmap) ?? null, [resolvedRoadmap, roadmap]);
    const roadmapMetadata = sourceRoadmap?.roadmap_metadata ?? {};

    const { phaseDetailsById, nodeDetailsById } = useMemo(() => {
        const phaseMap = {};
        const nodeMap = {};

        (sourceRoadmap?.phases ?? []).forEach((phase) => {
            const normalizedNodes = phase.nodes.map((node) => ({
                ...node,
                child_skills: getChildSkillNames(node.child_skills ?? []),
                phase_id: phase.phase_id,
                phase_name: phase.phase_name,
            }));

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

    useEffect(() => {
        const firstPhase = sourceRoadmap?.phases?.[0];
        setSelection({
            phase_id: firstPhase?.phase_id ?? null,
            skill_id: firstPhase?.nodes?.[0]?.skill_id ?? null,
        });
    }, [sourceRoadmap]);

    const handleRoadmapSelect = useCallback(
        (nextSelection) => {
            if (!nextSelection) {
                return;
            }

            setSelection((prevSelection) => {
                const phaseId = nextSelection.phase_id ?? prevSelection.phase_id;
                const fallbackSkillId = phaseDetailsById[phaseId]?.nodes?.[0]?.skill_id ?? null;
                const requestedSkillId = nextSelection.skill_id ?? prevSelection.skill_id;

                const skillBelongsToPhase = requestedSkillId && nodeDetailsById[requestedSkillId]?.phase_id === phaseId;
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

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100vh",
                padding: "20px",
                boxSizing: "border-box",
                gap: "16px",
                background: theme.palette.background.default,
            }}
        >
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            <div
                style={{
                    borderRadius: "28px",
                    padding: "28px 34px",
                    background: `linear-gradient(110deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 56%, #3f4f46 100%)`,
                    color: theme.palette.primary.contrastText,
                    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.25)",
                }}
            >
                <div
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        borderRadius: "999px",
                        padding: "6px 14px",
                        border: `1px solid rgba(255, 255, 255, 0.2)`,
                        background: "rgba(255, 255, 255, 0.08)",
                        marginBottom: "18px",
                        fontSize: "13px",
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                    }}
                >
                    <Sparkles size={14} color={theme.palette.secondary.main} />
                    {isLoadingRoadmap ? "SYNCING ROADMAP..." : "YOUR PERSONALIZED ROADMAP"}
                </div>

                <h1
                    style={{
                        margin: 0,
                        fontSize: "clamp(30px, 4vw, 56px)",
                        lineHeight: 1.06,
                        fontWeight: 800,
                        letterSpacing: "-0.02em",
                        maxWidth: "900px",
                    }}
                >
                    {roadmapMetadata.target_role ?? "Personalized Learning Path"}
                </h1>

                <div
                    style={{
                        marginTop: "22px",
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: "20px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            minWidth: "170px",
                            paddingRight: "20px",
                            borderRight: "1px solid rgba(255,255,255,0.2)",
                        }}
                    >
                        <div
                            style={{
                                width: "44px",
                                height: "44px",
                                borderRadius: "999px",
                                background: "rgba(255,255,255,0.12)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <UserRound size={18} />
                        </div>
                        <div>
                            <div style={{ fontSize: "12px", opacity: 0.8, letterSpacing: "0.08em" }}>TARGET ROLE</div>
                            <div style={{ fontSize: "24px", fontWeight: 700 }}>
                                {roadmapMetadata.target_role ?? "N/A"}
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            minWidth: "170px",
                            paddingRight: "20px",
                            borderRight: "1px solid rgba(255,255,255,0.2)",
                        }}
                    >
                        <div
                            style={{
                                width: "44px",
                                height: "44px",
                                borderRadius: "999px",
                                background: "rgba(255,255,255,0.12)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Target size={18} />
                        </div>
                        <div>
                            <div style={{ fontSize: "12px", opacity: 0.8, letterSpacing: "0.08em" }}>TARGET LEVEL</div>
                            <div style={{ fontSize: "24px", fontWeight: 700 }}>
                                {roadmapMetadata.target_level ?? "N/A"}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "170px" }}>
                        <div
                            style={{
                                width: "44px",
                                height: "44px",
                                borderRadius: "999px",
                                background: "rgba(255,255,255,0.12)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Layers3 size={18} />
                        </div>
                        <div>
                            <div style={{ fontSize: "12px", opacity: 0.8, letterSpacing: "0.08em" }}>TOTAL PHASES</div>
                            <div style={{ fontSize: "24px", fontWeight: 700 }}>
                                {roadmapMetadata.total_phases ?? 0} Phases
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleRegenerate}
                        disabled={isLoadingRoadmap}
                        style={{
                            marginLeft: "auto",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px 20px",
                            borderRadius: "999px",
                            border: "1px solid rgba(255,255,255,0.3)",
                            background: "rgba(255,255,255,0.12)",
                            color: "inherit",
                            fontSize: "14px",
                            fontWeight: 700,
                            cursor: isLoadingRoadmap ? "not-allowed" : "pointer",
                            opacity: isLoadingRoadmap ? 0.6 : 1,
                            transition: "background 0.2s",
                        }}
                    >
                        <RefreshCw size={15} style={{ animation: isLoadingRoadmap ? "spin 1s linear infinite" : "none" }} />
                        {isLoadingRoadmap ? "Regenerating..." : "Regenerate"}
                    </button>
                </div>
            </div>

            {isLoadingRoadmap && !resolvedRoadmap ? (
                <RoadmapSkeleton />
            ) : error && !resolvedRoadmap ? (
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "16px",
                        padding: "40px 24px",
                    }}
                >
                    <Alert
                        severity="error"
                        onClose={() => setError(null)}
                        sx={{ width: "100%", maxWidth: 520, borderRadius: "12px" }}
                    >
                        {error}
                    </Alert>
                    <PrimaryButton
                        size="small"
                        onClick={handleRegenerate}
                        loading={isLoadingRoadmap}
                        sx={{ textTransform: "none", fontWeight: 700 }}
                    >
                        Retry
                    </PrimaryButton>
                </div>
            ) : !sourceRoadmap ? (
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "12px",
                        padding: "40px 24px",
                        color: theme.palette.text.secondary,
                        textAlign: "center",
                    }}
                >
                    <div style={{ fontSize: "48px", lineHeight: 1 }}>🗺️</div>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: theme.palette.text.primary }}>
                        No roadmap yet
                    </div>
                    <div style={{ fontSize: "14px", maxWidth: "360px", lineHeight: 1.6 }}>
                        Complete your skills assessment to generate a personalized learning roadmap.
                    </div>
                    <PrimaryButton
                        size="small"
                        onClick={() => navigate("/assessment")}
                        sx={{ mt: 1, textTransform: "none", fontWeight: 700 }}
                    >
                        Go to Assessment
                    </PrimaryButton>
                </div>
            ) : (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 2fr) minmax(380px, 1fr)",
                        flex: 1,
                        minHeight: 0,
                        overflow: "hidden",
                        background: theme.palette.background.default,
                        borderRadius: "18px",
                        border: `1px solid ${theme.palette.divider}`,
                    }}
                >
                    <div style={{ borderRight: `1px solid ${theme.palette.divider}`, minWidth: 0, minHeight: 0 }}>
                        <Roadmap
                            roadmapData={sourceRoadmap}
                            onSelectNode={handleRoadmapSelect}
                            showHeader={false}
                            height="100%"
                        />
                    </div>

                    <div style={{ background: theme.palette.background.paper, minWidth: 0, minHeight: 0 }}>
                        <NodeDetail phase={selectedPhase} node={selectedSkill} />
                    </div>
                </div>
            )}
        </div>
    );
}

export default RoadmapDashboard;
