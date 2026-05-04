import { AlertTriangle, CheckCircle2, Circle } from "lucide-react";

export const SKILL_STATUS_CONFIG = {
    Complete: {
        key: "Complete",
        label: "Complete",
        color: "#16A34A",
        bg: "#DCFCE7",
        border: "#BBF7D0",
        icon: CheckCircle2,
    },
    Passed: {
        key: "Passed",
        label: "Passed",
        color: "#16A34A",
        bg: "#DCFCE7",
        border: "#BBF7D0",
        icon: CheckCircle2,
    },
    Weak: {
        key: "Weak",
        label: "Weak",
        color: "#CA8A04",
        bg: "#FEF9C3",
        border: "#FDE68A",
        icon: AlertTriangle,
    },
    "Needs Improvement": {
        key: "Needs Improvement",
        label: "Needs Improvement",
        color: "#CA8A04",
        bg: "#FEF9C3",
        border: "#FDE68A",
        icon: AlertTriangle,
    },
    "Not Started": {
        key: "Not Started",
        label: "Not Started",
        color: "#64748B",
        bg: "#F1F5F9",
        border: "#E2E8F0",
        icon: Circle,
    },
    Missing: {
        key: "Missing",
        label: "Missing",
        color: "#DC2626",
        bg: "#FEE2E2",
        border: "#FECACA",
        icon: AlertTriangle,
    },
};

export const getStatusConfig = (status) => {
    if (status === "Unlocked" || status === "Locked") {
        return SKILL_STATUS_CONFIG["Not Started"];
    }
    return SKILL_STATUS_CONFIG[status] ?? SKILL_STATUS_CONFIG.Missing;
};
