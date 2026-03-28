import React, { useMemo, useState } from "react";
import Roadmap from "./Roadmap";
import NodeDetail from "./NodeDetail";
import { roadmapData } from "./data";

function RoadmapDashboard() {
    const nodeDetailsById = useMemo(() => {
        const map = {};

        roadmapData.phases.forEach((phase) => {
            phase.nodes.forEach((node) => {
                map[node.skill_id] = {
                    ...node,
                    phase_id: phase.phase_id,
                    phase_name: phase.phase_name,
                };
            });
        });

        return map;
    }, []);

    const [selectedNode, setSelectedNode] = useState(() => {
        const firstNodeId = roadmapData.phases[0]?.nodes[0]?.skill_id;
        return firstNodeId ? nodeDetailsById[firstNodeId] : null;
    });

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 2fr) minmax(320px, 1fr)",
                width: "100%",
                height: "100vh",
                background: "#f3f4f6",
            }}
        >
            <div style={{ borderRight: "1px solid #e5e7eb", minWidth: 0 }}>
                <Roadmap onSelectNode={setSelectedNode} showHeader={false} height="100%" />
            </div>

            <div style={{ background: "#ffffff", minWidth: 0 }}>
                <NodeDetail node={selectedNode} />
            </div>
        </div>
    );
}

export default RoadmapDashboard;
