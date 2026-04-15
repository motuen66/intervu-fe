import React from "react";
import { Handle, Position } from "@xyflow/react";
import SkillStatusBadge from "./components/SkillStatusBadge";
import SkillProgressBar from "./components/SkillProgressBar";
import { getStatusConfig } from "./components/statusConfig";

const RoadmapNode = ({ data }) => {
    const status = data.status ?? "Missing";
    const config = getStatusConfig(status);
    const isLocked = status === "Missing";
    const childSkillPreview = (data.childSkills ?? []).slice(0, 2);
    const hiddenSkillCount = Math.max((data.childSkills ?? []).length - childSkillPreview.length, 0);
    const progress = Number(data.progress) || 0;

    return (
        <div
            role="group"
            aria-label={`${data.label}, status ${config.label}, ${progress}% complete`}
            style={{
                padding: "16px",
                borderRadius: "12px",
                background: "#fff",
                border: `1px solid ${isLocked ? "#F1F5F9" : "#E2E8F0"}`,
                boxShadow: "0 4px 12px rgba(15,23,42,0.05)",
                width: "280px",
                fontFamily: "sans-serif",
            }}
        >
            <Handle type="target" position={Position.Top} style={{ background: "#64748B" }} />

            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <SkillStatusBadge status={status} iconOnly />

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            fontWeight: 600,
                            fontSize: "14px",
                            color: isLocked ? "#64748B" : "#0F172A",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                        title={data.label}
                    >
                        {data.label}
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
                        <span style={{ fontWeight: 600, color: config.color }}>{config.label}</span>
                        <span aria-hidden="true"> • {progress}% complete</span>
                    </div>
                </div>
            </div>

            <SkillProgressBar progress={progress} status={status} />

            {childSkillPreview.length > 0 ? (
                <div style={{ marginTop: "10px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {childSkillPreview.map((skill) => (
                        <span
                            key={skill}
                            style={{
                                fontSize: "10px",
                                borderRadius: "999px",
                                padding: "2px 8px",
                                background: "#F8FAFC",
                                color: "#475569",
                                border: "1px solid #E2E8F0",
                            }}
                        >
                            {skill}
                        </span>
                    ))}
                    {hiddenSkillCount > 0 ? (
                        <span
                            style={{
                                fontSize: "10px",
                                borderRadius: "999px",
                                padding: "2px 8px",
                                background: "#F8FAFC",
                                color: "#475569",
                                border: "1px solid #E2E8F0",
                            }}
                        >
                            +{hiddenSkillCount} more
                        </span>
                    ) : null}
                </div>
            ) : null}

            <Handle type="source" position={Position.Bottom} style={{ background: "#64748B" }} />
        </div>
    );
};

export default RoadmapNode;
