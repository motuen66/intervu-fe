import React from "react";
import { Handle, Position } from "@xyflow/react";
import { CheckCircle2, PlayCircle, Lock } from "lucide-react";

const RoadmapNode = ({ data }) => {
    const status = data.status ?? "Missing";
    const isComplete = status === "Complete";
    const isLocked = status === "Missing";
    const childSkillPreview = (data.childSkills ?? []).slice(0, 2);
    const hiddenSkillCount = Math.max((data.childSkills ?? []).length - childSkillPreview.length, 0);

    const themeColor = isComplete ? "#52c41a" : isLocked ? "#d9d9d9" : "#1677ff";

    return (
        <div
            style={{
                padding: "16px",
                borderRadius: "12px",
                background: "#fff",
                border: `1px solid ${isLocked ? "#f0f0f0" : "#e6e6e6"}`,
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                width: "280px",
                fontFamily: "sans-serif",
            }}
        >
            <Handle type="target" position={Position.Top} style={{ background: "#555" }} />

            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                {/* Icon logic */}
                <div
                    style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: `${themeColor}15`,
                        color: themeColor,
                    }}
                >
                    {isComplete ? <CheckCircle2 size={18} /> : isLocked ? <Lock size={18} /> : <PlayCircle size={18} />}
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "600", fontSize: "14px", color: isLocked ? "#8c8c8c" : "#1f1f1f" }}>
                        {data.label}
                    </div>
                    <div style={{ fontSize: "11px", color: "#8c8c8c", marginTop: "2px" }}>
                        {data.progress}% Complete
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div style={{ height: "6px", background: "#f0f0f0", borderRadius: "3px", overflow: "hidden" }}>
                <div
                    style={{
                        height: "100%",
                        width: `${data.progress}%`,
                        background: themeColor,
                        transition: "width 1s ease-in-out",
                    }}
                />
            </div>

            {childSkillPreview.length > 0 ? (
                <div style={{ marginTop: "10px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {childSkillPreview.map((skill) => (
                        <span
                            key={skill}
                            style={{
                                fontSize: "10px",
                                borderRadius: "999px",
                                padding: "2px 8px",
                                background: "#f8fafc",
                                color: "#475569",
                                border: "1px solid #e2e8f0",
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
                                background: "#f8fafc",
                                color: "#475569",
                                border: "1px solid #e2e8f0",
                            }}
                        >
                            +{hiddenSkillCount} more
                        </span>
                    ) : null}
                </div>
            ) : null}

            <Handle type="source" position={Position.Bottom} style={{ background: "#555" }} />
        </div>
    );
};

export default RoadmapNode;
