import React from "react";

const getStatusStyle = (status) => {
    if (status === "Complete") {
        return { color: "#166534", background: "#dcfce7" };
    }

    if (status === "Weak") {
        return { color: "#92400e", background: "#fef3c7" };
    }

    return { color: "#991b1b", background: "#fee2e2" };
};

function NodeDetail({ node }) {
    if (!node) {
        return (
            <div style={{ padding: "28px" }}>
                <h2 style={{ marginTop: 0, marginBottom: "8px", color: "#111827" }}>Node Detail</h2>
                <p style={{ margin: 0, color: "#6b7280" }}>Select a roadmap node to view detailed guidance.</p>
            </div>
        );
    }

    const status = node.assessment?.status ?? "Missing";
    const statusStyle = getStatusStyle(status);
    const progress = node.assessment?.progress ?? 0;

    return (
        <div style={{ padding: "28px", overflowY: "auto", height: "100%" }}>
            <p
                style={{
                    marginTop: 0,
                    marginBottom: "6px",
                    color: "#6b7280",
                    fontSize: "12px",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                }}
            >
                {node.phase_name}
            </p>
            <h2 style={{ marginTop: 0, marginBottom: "12px", color: "#111827" }}>{node.skill_name}</h2>

            <div
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    borderRadius: "9999px",
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: 700,
                    marginBottom: "18px",
                    ...statusStyle,
                }}
            >
                {status}
            </div>

            <div style={{ marginBottom: "20px" }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "13px",
                        color: "#374151",
                        marginBottom: "8px",
                    }}
                >
                    <span>Progress</span>
                    <span>{progress}%</span>
                </div>
                <div style={{ height: "8px", background: "#e5e7eb", borderRadius: "9999px", overflow: "hidden" }}>
                    <div style={{ width: `${progress}%`, height: "100%", background: "#2563eb" }} />
                </div>
            </div>

            <div style={{ marginBottom: "14px", color: "#374151", fontSize: "14px" }}>
                <strong>Current:</strong> {node.assessment?.current_level ?? "N/A"}
            </div>
            <div style={{ marginBottom: "20px", color: "#374151", fontSize: "14px" }}>
                <strong>Target:</strong> {node.assessment?.target_level ?? "N/A"}
            </div>

            <h3 style={{ marginTop: 0, marginBottom: "10px", color: "#111827", fontSize: "16px" }}>Learning Tasks</h3>
            <ul style={{ marginTop: 0, marginBottom: "20px", paddingLeft: "20px", color: "#374151", lineHeight: 1.6 }}>
                {(node.child_skills ?? []).map((childSkill) => (
                    <li key={childSkill}>{childSkill}</li>
                ))}
            </ul>

            <h3 style={{ marginTop: 0, marginBottom: "10px", color: "#111827", fontSize: "16px" }}>Mentor Note</h3>
            <p style={{ margin: 0, color: "#4b5563", lineHeight: 1.6 }}>
                {node.mentor_note ?? "No mentor note available."}
            </p>
        </div>
    );
}

export default NodeDetail;
