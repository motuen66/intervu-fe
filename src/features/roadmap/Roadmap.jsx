import React, { useCallback, useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import { Background, Controls, MarkerType, MiniMap, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import RoadmapNode from "./RoadmapNode";

const NODE_WIDTH = 280;
const NODE_HEIGHT = 165;
const NODE_GAP_X = 36;
const NODE_GAP_Y = 18;
const PHASE_PADDING_X = 24;
const PHASE_HEADER_HEIGHT = 85;
const PHASE_HEADER_HEIGHT_WITH_DESC = 124;
const PHASE_BOTTOM_PADDING = 24;
const PHASE_GAP_Y = 84;
const PILLAR_COLUMNS = ["HARD_SKILL", "SOFT_SKILL", "LIVE_CHECKPOINT"];
const PILLAR_LABELS = {
    HARD_SKILL: "Hard Skills",
    SOFT_SKILL: "Soft Skills",
    LIVE_CHECKPOINT: "Live Checkpoint",
};
const MIN_PHASE_WIDTH =
    PILLAR_COLUMNS.length * NODE_WIDTH + (PILLAR_COLUMNS.length - 1) * NODE_GAP_X + PHASE_PADDING_X * 2;

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

function PhaseNode({ data }) {
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                borderRadius: "16px",
                border: "1px solid #d0d7de",
                background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
                boxShadow: "0 10px 24px rgba(2, 6, 23, 0.05)",
                padding: "16px 20px",
            }}
        >
            <div style={{ fontSize: "12px", color: "#475569", marginBottom: "6px", textTransform: "uppercase" }}>
                Phase {data.phaseNumber}
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>{data.label}</div>
            {data.description ? (
                <div
                    style={{
                        fontSize: "12px",
                        color: "#475569",
                        marginTop: "4px",
                        lineHeight: 1.45,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                    }}
                    title={data.description}
                >
                    {data.description}
                </div>
            ) : null}
            <div style={{ display: "flex", gap: "8px", marginTop: "10px", fontSize: "11px", color: "#64748b" }}>
                {PILLAR_COLUMNS.map((pillar) => (
                    <span key={pillar}>{PILLAR_LABELS[pillar]}</span>
                ))}
            </div>
        </div>
    );
}

const getEdgeVisual = (status) => {
    if (status === "Complete" || status === "Passed") {
        return { stroke: "#52c41a", strokeDasharray: "0", animated: false };
    }

    if (status === "Weak" || status === "Needs Improvement") {
        return { stroke: "#1677ff", strokeDasharray: "0", animated: true };
    }

    return { stroke: "#cbd5e1", strokeDasharray: "6,5", animated: false };
};

const buildPhaseConnections = (previousNodes, currentNodes) => {
    if (!previousNodes?.length || !currentNodes?.length) {
        return [];
    }

    if (previousNodes.length === 1) {
        return currentNodes.map((node) => [previousNodes[0], node]);
    }

    if (currentNodes.length === 1) {
        return previousNodes.map((node) => [node, currentNodes[0]]);
    }

    return currentNodes.map((node, index) => {
        const ratio = index / (currentNodes.length - 1);
        const sourceIndex = Math.round(ratio * (previousNodes.length - 1));
        return [previousNodes[sourceIndex], node];
    });
};

const nodeTypes = {
    roadmapNode: RoadmapNode,
    phaseNode: PhaseNode,
};

function Roadmap({ roadmapData: roadmapInput, onSelectNode, showHeader = true, height = "100vh" }) {
    const theme = useTheme();
    const { nodes, edges, nodeDetailsById } = useMemo(() => {
        const nodes = [];
        const edges = [];
        const nodeDetailsById = {};
        const phases = roadmapInput?.phases ?? [];

        if (!phases.length) {
            return { nodes, edges, nodeDetailsById };
        }

        const sourceRoadmap = roadmapInput;

        const roadmapWidth = MIN_PHASE_WIDTH;
        const phaseX = -roadmapWidth / 2;

        let currentY = 0;

        sourceRoadmap.phases.forEach((phase, pIndex) => {
            const phaseDescription = phase.phase_description ?? phase.description ?? "";
            const headerHeight = phaseDescription ? PHASE_HEADER_HEIGHT_WITH_DESC : PHASE_HEADER_HEIGHT;
            const grouped = PILLAR_COLUMNS.reduce((acc, pillar) => {
                acc[pillar] = phase.nodes.filter((node) => (node.pillar_type ?? "HARD_SKILL") === pillar);
                return acc;
            }, {});
            const maxRows = Math.max(1, ...PILLAR_COLUMNS.map((pillar) => grouped[pillar].length));
            const phaseHeight =
                headerHeight + maxRows * NODE_HEIGHT + Math.max(0, maxRows - 1) * NODE_GAP_Y + PHASE_BOTTOM_PADDING;
            const isPhaseLocked = false;

            nodes.push({
                id: phase.phase_id,
                type: "phaseNode",
                position: { x: phaseX, y: currentY },
                style: { width: roadmapWidth, height: phaseHeight },
                draggable: false,
                data: {
                    label: phase.phase_name,
                    phaseNumber: pIndex + 1,
                    totalSkills: phase.nodes.length,
                    description: phaseDescription,
                    status: phase.status,
                },
            });

            phase.nodes.forEach((skill) => {
                const skillId = skill.skill_id;
                const childSkillNames = getChildSkillNames(skill.child_skills ?? []);
                const pillarType = skill.pillar_type ?? "HARD_SKILL";
                const columnIndex = Math.max(0, PILLAR_COLUMNS.indexOf(pillarType));
                const rowIndex = grouped[pillarType]?.findIndex((node) => node.skill_id === skill.skill_id) ?? 0;

                nodes.push({
                    id: skillId,
                    type: "roadmapNode",
                    parentId: phase.phase_id,
                    extent: "parent",
                    data: {
                        label: skill.skill_name,
                        progress: skill.assessment.progress || 0,
                        status: skill.assessment.status,
                        currentLevel: skill.assessment.current_level ?? "",
                        targetLevel: skill.assessment.target_level ?? "",
                        score: Number(skill.assessment.score ?? 0),
                        childSkills: childSkillNames,
                        pillarType,
                        checkpoint: skill.checkpoint ?? null,
                        locked: false,
                    },
                    position: {
                        x: PHASE_PADDING_X + columnIndex * (NODE_WIDTH + NODE_GAP_X),
                        y: headerHeight + rowIndex * (NODE_HEIGHT + NODE_GAP_Y),
                    },
                });

                nodeDetailsById[skillId] = {
                    ...skill,
                    child_skills: childSkillNames,
                    phase_id: phase.phase_id,
                    phase_name: phase.phase_name,
                };
            });

            currentY += phaseHeight + PHASE_GAP_Y;
        });

        for (let phaseIndex = 1; phaseIndex < sourceRoadmap.phases.length; phaseIndex += 1) {
            const previousPhase = sourceRoadmap.phases[phaseIndex - 1];
            const currentPhase = sourceRoadmap.phases[phaseIndex];
            const connections = buildPhaseConnections(previousPhase.nodes, currentPhase.nodes);

            connections.forEach(([sourceSkill, targetSkill], connectionIndex) => {
                const edgeVisual = getEdgeVisual(targetSkill.assessment.status);

                edges.push({
                    id: `e-${phaseIndex}-${connectionIndex}-${sourceSkill.skill_id}-${targetSkill.skill_id}`,
                    source: sourceSkill.skill_id,
                    target: targetSkill.skill_id,
                    type: "smoothstep",
                    animated: edgeVisual.animated,
                    style: {
                        stroke: edgeVisual.stroke,
                        strokeWidth: 2,
                        strokeDasharray: edgeVisual.strokeDasharray,
                    },
                    markerEnd: { type: MarkerType.ArrowClosed, color: edgeVisual.stroke },
                });
            });
        }

        return { nodes, edges, nodeDetailsById };
    }, [roadmapInput]);

    const handleNodeClick = useCallback(
        (_, node) => {
            if (!onSelectNode) {
                return;
            }

            if (node.type === "phaseNode") {
                onSelectNode({
                    phase_id: node.id,
                    skill_id: null,
                });
                return;
            }

            if (node.type === "roadmapNode") {
                const selectedSkill = nodeDetailsById[node.id];
                if (!selectedSkill) {
                    return;
                }

                onSelectNode({
                    phase_id: selectedSkill.phase_id,
                    skill_id: selectedSkill.skill_id,
                });
            }
        },
        [nodeDetailsById, onSelectNode],
    );

    return (
        <div style={{ width: "100%", height, background: "#fafafa" }}>
            {showHeader ? (
                <div style={{ padding: "20px" }}>
                    <h2 style={{ margin: 0 }}>My Learning Path</h2>
                    <p style={{ color: "#8c8c8c" }}>Track your progress and bridge the skill gaps.</p>
                </div>
            ) : null}

            <div style={{ height: showHeader ? "85%" : "100%" }}>
                {nodes.length === 0 ? (
                    <div
                        style={{
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#64748b",
                            fontSize: "14px",
                        }}
                    >
                        No phases to display.
                    </div>
                ) : (
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        fitView
                        fitViewOptions={{ padding: 0.18 }}
                        onNodeClick={handleNodeClick}
                        proOptions={{ hideAttribution: true }}
                        aria-label="Skills roadmap graph"
                    >
                        <Background color="#E2E8F0" gap={20} />
                        <Controls aria-label="Roadmap zoom and fit controls" />
                        <MiniMap
                            pannable
                            zoomable
                            ariaLabel="Roadmap minimap"
                            nodeStrokeWidth={3}
                            nodeColor={(node) => {
                                if (node.type === "phaseNode") return theme.palette.divider;
                                const status = node.data?.status;
                                if (status === "Complete" || status === "Passed") return theme.palette.success.main;
                                if (status === "Weak" || status === "Needs Improvement")
                                    return theme.palette.warning.main;
                                return theme.palette.text.disabled;
                            }}
                            maskColor="rgba(15, 23, 42, 0.08)"
                            style={{ borderRadius: "8px", border: "1px solid #E2E8F0" }}
                        />
                    </ReactFlow>
                )}
            </div>
        </div>
    );
}

export default Roadmap;
