import React, { useCallback, useMemo, useState } from "react";
import { Layers3, Sparkles, Target, UserRound } from "lucide-react";
import Roadmap from "./Roadmap";
import NodeDetail from "./NodeDetail";
import { roadmapData } from "./data";
import { theme } from "../../common/constants/theme";

const getChildSkillNames = (childSkills = []) => {
    return childSkills
        .map((childSkill) => {
            if (typeof childSkill === "string") {
                return childSkill;
            }

            if (childSkill && typeof childSkill === "object") {
                return childSkill.name ?? "";
            }

            return "";
        })
        .filter(Boolean);
};

function RoadmapDashboard() {
    const roadmapMetadata = roadmapData.roadmap_metadata ?? {};

    const { phaseDetailsById, nodeDetailsById } = useMemo(() => {
        const phaseMap = {};
        const nodeMap = {};

        roadmapData.phases.forEach((phase) => {
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
    }, []);

    const [selection, setSelection] = useState(() => {
        const firstPhase = roadmapData.phases[0];
        return {
            phase_id: firstPhase?.phase_id ?? null,
            skill_id: firstPhase?.nodes?.[0]?.skill_id ?? null,
        };
    });

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

    const selectedPhase = selection.phase_id ? phaseDetailsById[selection.phase_id] ?? null : null;
    const selectedSkill = selection.skill_id ? nodeDetailsById[selection.skill_id] ?? null : null;

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
                    YOUR PERSONALIZED ROADMAP
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
                            <div style={{ fontSize: "24px", fontWeight: 700 }}>{roadmapMetadata.target_role ?? "N/A"}</div>
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
                            <div style={{ fontSize: "24px", fontWeight: 700 }}>{roadmapMetadata.target_level ?? "N/A"}</div>
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
                            <div style={{ fontSize: "24px", fontWeight: 700 }}>{roadmapMetadata.total_phases ?? 0} Phases</div>
                        </div>
                    </div>
                </div>
            </div>

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
                    <Roadmap onSelectNode={handleRoadmapSelect} showHeader={false} height="100%" />
                </div>

                <div style={{ background: theme.palette.background.paper, minWidth: 0, minHeight: 0 }}>
                    <NodeDetail phase={selectedPhase} node={selectedSkill} />
                </div>
            </div>
        </div>
    );
}

export default RoadmapDashboard;
