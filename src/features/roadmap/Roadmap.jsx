import React, { useCallback, useMemo } from "react";
import { Background, Controls, MarkerType, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import RoadmapNode from "./RoadmapNode";
import { roadmapData } from "./data";

const NODE_WIDTH = 280;
const NODE_HEIGHT = 165;
const NODE_GAP_X = 36;
const PHASE_PADDING_X = 24;
const PHASE_HEADER_HEIGHT = 85;
const PHASE_BOTTOM_PADDING = 0;
const PHASE_HEIGHT = PHASE_HEADER_HEIGHT + NODE_HEIGHT + PHASE_BOTTOM_PADDING;
const PHASE_GAP_Y = 84;
const MIN_PHASE_WIDTH = 520;

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
        </div>
    );
}

const getEdgeVisual = (status) => {
    if (status === "Complete") {
        return { stroke: "#52c41a", strokeDasharray: "0", animated: false };
    }

    if (status === "Weak") {
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
    const { nodes, edges, nodeDetailsById } = useMemo(() => {
        const nodes = [];
        const edges = [];
        const nodeDetailsById = {};
        const sourceRoadmap = roadmapInput?.phases?.length ? roadmapInput : roadmapData;

        const maxNodesPerPhase = sourceRoadmap.phases.reduce((maxCount, phase) => {
            return Math.max(maxCount, phase.nodes.length);
        }, 1);
        const roadmapWidth = Math.max(
            MIN_PHASE_WIDTH,
            maxNodesPerPhase * NODE_WIDTH + Math.max(0, maxNodesPerPhase - 1) * NODE_GAP_X + PHASE_PADDING_X * 2,
        );
        const phaseX = -roadmapWidth / 2;

        let currentY = 0;

        sourceRoadmap.phases.forEach((phase, pIndex) => {
            const totalNodeWidth = phase.nodes.length * NODE_WIDTH + Math.max(0, phase.nodes.length - 1) * NODE_GAP_X;
            const nodeStartX = (roadmapWidth - totalNodeWidth) / 2;

            nodes.push({
                id: phase.phase_id,
                type: "phaseNode",
                position: { x: phaseX, y: currentY },
                style: { width: roadmapWidth, height: PHASE_HEIGHT },
                draggable: false,
                data: {
                    label: phase.phase_name,
                    phaseNumber: pIndex + 1,
                    totalSkills: phase.nodes.length,
                },
            });

            phase.nodes.forEach((skill, sIndex) => {
                const skillId = skill.skill_id;
                const childSkillNames = getChildSkillNames(skill.child_skills ?? []);

                nodes.push({
                    id: skillId,
                    type: "roadmapNode",
                    parentId: phase.phase_id,
                    extent: "parent",
                    data: {
                        label: skill.skill_name,
                        progress: skill.assessment.progress || 0,
                        status: skill.assessment.status,
                        childSkills: childSkillNames,
                    },
                    position: { x: nodeStartX + sIndex * (NODE_WIDTH + NODE_GAP_X), y: PHASE_HEADER_HEIGHT },
                });

                nodeDetailsById[skillId] = {
                    ...skill,
                    child_skills: childSkillNames,
                    phase_id: phase.phase_id,
                    phase_name: phase.phase_name,
                };
            });

            currentY += PHASE_HEIGHT + PHASE_GAP_Y;
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
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.18 }}
                    onNodeClick={handleNodeClick}
                    proOptions={{ hideAttribution: true }}
                >
                    <Background color="#e2e2e2" gap={20} />
                    <Controls />
                </ReactFlow>
            </div>
        </div>
    );
}

export default Roadmap;
