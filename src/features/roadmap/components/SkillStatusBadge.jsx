import React from "react";
import { getStatusConfig } from "./statusConfig";

export default function SkillStatusBadge({ status, size = "md", iconOnly = false }) {
    const config = getStatusConfig(status);
    const Icon = config.icon;
    const iconSize = size === "sm" ? 12 : 14;
    const padY = size === "sm" ? 2 : 4;
    const padX = size === "sm" ? 8 : 10;
    const fontSize = size === "sm" ? "11px" : "12px";

    if (iconOnly) {
        return (
            <span
                role="img"
                aria-label={`Status: ${config.label}`}
                title={config.label}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: config.bg,
                    color: config.color,
                    border: `1px solid ${config.border}`,
                }}
            >
                <Icon size={iconSize + 2} aria-hidden="true" />
            </span>
        );
    }

    return (
        <span
            role="status"
            aria-label={`Status: ${config.label}`}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                borderRadius: "9999px",
                padding: `${padY}px ${padX}px`,
                fontSize,
                fontWeight: 700,
                color: config.color,
                background: config.bg,
                border: `1px solid ${config.border}`,
                lineHeight: 1.2,
            }}
        >
            <Icon size={iconSize} aria-hidden="true" />
            {config.label}
        </span>
    );
}
