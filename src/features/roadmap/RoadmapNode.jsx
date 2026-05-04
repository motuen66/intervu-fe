import React from "react";
import { useTheme } from "@mui/material/styles";
import { Handle, Position } from "@xyflow/react";
import { RadioTower, ShieldCheck } from "lucide-react";
import SkillStatusBadge from "./components/SkillStatusBadge";
import SkillProgressBar from "./components/SkillProgressBar";
import { getStatusConfig } from "./components/statusConfig";

const PILLAR_LABELS = {
    HARD_SKILL: "Hard Skill",
    SOFT_SKILL: "Soft Skill",
    LIVE_CHECKPOINT: "Live Checkpoint",
};

const RoadmapNode = ({ data, selected }) => {
    const theme = useTheme();
    const status = data.status ?? "Missing";
    const config = getStatusConfig(status);
    const pillarType = data.pillarType ?? "HARD_SKILL";
    const childSkillPreview = (data.childSkills ?? []).slice(0, 2);
    const hiddenSkillCount = Math.max((data.childSkills ?? []).length - childSkillPreview.length, 0);
    const progress = Number(data.progress) || 0;
    // Phase 5.1 — surface the audit trail (current/target/score) on the card
    // itself, not just in the detail panel. Empty values are gracefully hidden.
    const currentLevel = data.currentLevel != null ? String(data.currentLevel) : "";
    const targetLevel = data.targetLevel != null ? String(data.targetLevel) : "";
    const score = Number(data.score);
    const hasLevelTrio = currentLevel !== "" && targetLevel !== "";
    const hasScore = Number.isFinite(score) && score > 0;

    return (
        <div
            role="group"
            aria-label={`${data.label}, status ${config.label}, ${progress}% complete`}
            style={{
                padding: "16px",
                borderRadius: "12px",
                background: "#fff",
                border: selected
                    ? `2px solid ${theme.palette.secondary.main}`
                    : `1px solid #E2E8F0`,
                boxShadow: "0 4px 12px rgba(15,23,42,0.05)",
                width: "280px",
                fontFamily: "sans-serif",
                transition: "border-color 140ms ease",
            }}
        >
            <Handle type="target" position={Position.Top} style={{ background: "#64748B" }} />

            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                {pillarType === "LIVE_CHECKPOINT" ? (
                    <RadioTower size={18} color={theme.palette.warning.main} />
                ) : pillarType === "SOFT_SKILL" ? (
                    <ShieldCheck size={18} color={theme.palette.info.main} />
                ) : (
                    <SkillStatusBadge status={status} iconOnly />
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            fontWeight: 600,
                            fontSize: "14px",
                            color: "#0F172A",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                        title={data.label}
                    >
                        {data.label}
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
                        <span style={{ fontWeight: 600, color: config.color }}>
                            {PILLAR_LABELS[pillarType] ?? "Hard Skill"}
                        </span>
                        <span aria-hidden="true"> • </span>
                        <span>{config.label}</span>
                        <span aria-hidden="true"> • {progress}% complete</span>
                    </div>
                </div>
            </div>

            <SkillProgressBar progress={progress} status={status} />

            {hasLevelTrio || hasScore ? (
                <div
                    style={{
                        marginTop: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "10.5px",
                        color: "#475569",
                        fontWeight: 600,
                    }}
                    aria-label="Assessment summary"
                >
                    {hasLevelTrio ? (
                        <span title="Your current level / target level">
                            Lv {currentLevel}/{targetLevel}
                        </span>
                    ) : null}
                    {hasLevelTrio && hasScore ? (
                        <span aria-hidden="true" style={{ color: "#CBD5E1" }}>
                            ·
                        </span>
                    ) : null}
                    {hasScore ? <span title="Assessment score">Score {Math.round(score)}/100</span> : null}
                </div>
            ) : null}

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
