import React from "react";
import { getStatusConfig } from "./statusConfig";

export default function SkillProgressBar({ progress = 0, status, height = 6, showLabel = false, label = "Progress" }) {
    const config = getStatusConfig(status);
    const clamped = Math.max(0, Math.min(100, Number(progress) || 0));

    return (
        <div>
            {showLabel ? (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "13px",
                        color: "#334155",
                        marginBottom: "6px",
                    }}
                >
                    <span>{label}</span>
                    <span>{clamped}%</span>
                </div>
            ) : null}
            <div
                role="progressbar"
                aria-valuenow={clamped}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${label}: ${clamped}% — ${config.label}`}
                style={{
                    height,
                    background: "#E2E8F0",
                    borderRadius: "9999px",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        height: "100%",
                        width: `${clamped}%`,
                        background: config.color,
                        transition: "width 1s ease-in-out",
                    }}
                />
            </div>
        </div>
    );
}
