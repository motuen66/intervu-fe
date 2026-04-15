import { AlertTriangle, CheckCircle2, Lock } from "lucide-react";

export const SKILL_STATUS_CONFIG = {
    Complete: {
        key: "Complete",
        label: "Complete",
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
    Missing: {
        key: "Missing",
        label: "Missing",
        color: "#DC2626",
        bg: "#FEE2E2",
        border: "#FECACA",
        icon: Lock,
    },
};

export const getStatusConfig = (status) => SKILL_STATUS_CONFIG[status] ?? SKILL_STATUS_CONFIG.Missing;
