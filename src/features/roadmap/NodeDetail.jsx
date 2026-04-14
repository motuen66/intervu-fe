import React, { useEffect, useMemo, useState } from "react";
import { History, Star, Users } from "lucide-react";

const PHASE_TABS = {
    RECOMMENDATIONS: "recommendations",
    MOCK_HISTORY: "mockHistory",
};

const getStatusStyle = (status) => {
    if (status === "Complete") {
        return { color: "#166534", background: "#dcfce7" };
    }

    if (status === "Weak") {
        return { color: "#92400e", background: "#fef3c7" };
    }

    return { color: "#991b1b", background: "#fee2e2" };
};

const formatDate = (dateValue) => {
    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) {
        return dateValue ?? "N/A";
    }

    return parsedDate.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const MAX_EVALUATION_SCORE = 10;

const normalizeEvaluationItems = (evaluation) => {
    if (Array.isArray(evaluation)) {
        return evaluation.map((item, index) => {
            const parsedScore = Number(item?.Score ?? item?.score ?? 0);
            return {
                id: `${item?.Type ?? item?.type ?? "criterion"}-${index}`,
                type: item?.Type ?? item?.type ?? "Criterion",
                score: Number.isFinite(parsedScore) ? parsedScore : 0,
                answer: item?.Answer ?? item?.answer ?? "",
                question: item?.Question ?? item?.question ?? "",
            };
        });
    }

    if (evaluation && typeof evaluation === "object") {
        return [
            {
                id: "communication",
                type: "Communication",
                score: Number(evaluation.communication ?? 0) || 0,
                answer: evaluation.summary ?? "",
                question: "",
            },
            {
                id: "problem_solving",
                type: "Problem Solving",
                score: Number(evaluation.problem_solving ?? 0) || 0,
                answer: evaluation.summary ?? "",
                question: "",
            },
            {
                id: "technical_depth",
                type: "Technical Depth",
                score: Number(evaluation.technical_depth ?? 0) || 0,
                answer: evaluation.summary ?? "",
                question: "",
            },
        ];
    }

    return [];
};

const getScoreStyle = (score) => {
    if (score >= 8) {
        return { color: "#166534", background: "#dcfce7", bar: "#22c55e" };
    }

    if (score >= 6) {
        return { color: "#92400e", background: "#fef3c7", bar: "#f59e0b" };
    }

    if (score > 0) {
        return { color: "#991b1b", background: "#fee2e2", bar: "#ef4444" };
    }

    return { color: "#64748b", background: "#e2e8f0", bar: "#cbd5e1" };
};

function NodeDetail({ phase, node }) {
    const [activeTab, setActiveTab] = useState(PHASE_TABS.RECOMMENDATIONS);

    useEffect(() => {
        setActiveTab(PHASE_TABS.RECOMMENDATIONS);
    }, [phase?.phase_id]);

    const selectedSkill = useMemo(() => {
        if (!phase) {
            return null;
        }

        if (node?.phase_id === phase.phase_id) {
            return node;
        }

        return phase.nodes?.[0] ?? null;
    }, [node, phase]);

    if (!phase) {
        return (
            <div
                style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    padding: "28px",
                    textAlign: "center",
                    color: "#64748b",
                }}
            >
                <div style={{ fontSize: "36px", lineHeight: 1 }}>🗂️</div>
                <div style={{ fontWeight: 700, fontSize: "16px", color: "#0f172a" }}>Nothing selected</div>
                <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.6, maxWidth: "220px" }}>
                    Click a phase or skill in the roadmap to view detailed guidance here.
                </p>
            </div>
        );
    }

    const status = selectedSkill?.assessment?.status ?? "Missing";
    const statusStyle = getStatusStyle(status);
    const progress = selectedSkill?.assessment?.progress ?? 0;
    const recommendedCoaches = phase.recommended_coaches ?? [];
    const mockHistory = phase.mock_history ?? [];

    return (
        <div
            style={{
                padding: "24px",
                height: "100%",
                minHeight: 0,
                boxSizing: "border-box",
                overflowY: "auto",
                overflowX: "hidden",
                color: "#0f172a",
            }}
        >
            <p
                style={{
                    marginTop: 0,
                    marginBottom: "6px",
                    color: "#64748b",
                    fontSize: "12px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                }}
            >
                Phase Overview
            </p>
            <h2 style={{ marginTop: 0, marginBottom: "14px", fontSize: "30px", lineHeight: 1.12 }}>{phase.phase_name}</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", marginBottom: "16px", borderBottom: "1px solid #e2e8f0" }}>
                <button
                    type="button"
                    onClick={() => setActiveTab(PHASE_TABS.RECOMMENDATIONS)}
                    style={{
                        border: "none",
                        borderBottom: activeTab === PHASE_TABS.RECOMMENDATIONS ? "2px solid #0f172a" : "2px solid transparent",
                        background: "transparent",
                        padding: "10px 8px",
                        fontWeight: 700,
                        color: activeTab === PHASE_TABS.RECOMMENDATIONS ? "#0f172a" : "#64748b",
                        cursor: "pointer",
                    }}
                >
                    Recommendations
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab(PHASE_TABS.MOCK_HISTORY)}
                    style={{
                        border: "none",
                        borderBottom: activeTab === PHASE_TABS.MOCK_HISTORY ? "2px solid #0f172a" : "2px solid transparent",
                        background: "transparent",
                        padding: "10px 8px",
                        fontWeight: 700,
                        color: activeTab === PHASE_TABS.MOCK_HISTORY ? "#0f172a" : "#64748b",
                        cursor: "pointer",
                    }}
                >
                    Mock History
                </button>
            </div>

            {activeTab === PHASE_TABS.RECOMMENDATIONS ? (
                <div style={{ marginBottom: "24px" }}>
                    <h3
                        style={{
                            marginTop: 0,
                            marginBottom: "12px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "20px",
                        }}
                    >
                        <Users size={18} /> Recommended Coaches
                    </h3>
                    {recommendedCoaches.length === 0 ? (
                        <div
                            style={{
                                padding: "20px",
                                borderRadius: "14px",
                                border: "1px solid #e2e8f0",
                                background: "#f8fafc",
                                textAlign: "center",
                                color: "#64748b",
                            }}
                        >
                            <div style={{ fontSize: "24px", lineHeight: 1, marginBottom: "8px" }}>👥</div>
                            <div style={{ fontWeight: 600, fontSize: "14px", color: "#0f172a", marginBottom: "4px" }}>
                                No coaches assigned
                            </div>
                            <p style={{ margin: 0, fontSize: "12px", lineHeight: 1.5 }}>
                                Coach recommendations will appear here once assigned for this phase.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gap: "10px" }}>
                            {recommendedCoaches.map((coach) => (
                                <div
                                    key={coach.id}
                                    style={{
                                        border: "1px solid #e2e8f0",
                                        borderRadius: "14px",
                                        padding: "12px",
                                        background: "#ffffff",
                                    }}
                                >
                                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                        <img
                                            src={coach.avatar}
                                            alt={coach.name}
                                            style={{
                                                width: "44px",
                                                height: "44px",
                                                borderRadius: "999px",
                                                objectFit: "cover",
                                                background: "#e2e8f0",
                                            }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700 }}>{coach.name}</div>
                                            <div style={{ color: "#64748b", fontSize: "13px", marginTop: "2px" }}>{coach.role}</div>
                                        </div>
                                        <div style={{ display: "inline-flex", gap: "4px", alignItems: "center", color: "#f59e0b", fontWeight: 700 }}>
                                            <Star size={14} fill="#f59e0b" />
                                            {coach.rating}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ marginBottom: "24px" }}>
                    <h3
                        style={{
                            marginTop: 0,
                            marginBottom: "12px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "20px",
                        }}
                    >
                        <History size={18} /> Mock History
                    </h3>
                    {mockHistory.length === 0 ? (
                        <div
                            style={{
                                padding: "20px",
                                borderRadius: "14px",
                                border: "1px solid #e2e8f0",
                                background: "#f8fafc",
                                textAlign: "center",
                                color: "#64748b",
                            }}
                        >
                            <div style={{ fontSize: "24px", lineHeight: 1, marginBottom: "8px" }}>🕐</div>
                            <div style={{ fontWeight: 600, fontSize: "14px", color: "#0f172a", marginBottom: "4px" }}>
                                No mock interviews yet
                            </div>
                            <p style={{ margin: 0, fontSize: "12px", lineHeight: 1.5 }}>
                                Complete a mock interview for this phase to see your history and scores here.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gap: "10px" }}>
                            {mockHistory.map((mock) => (
                                (() => {
                                    const evaluationItems = normalizeEvaluationItems(mock.evaluation);
                                    const reviewedItems = evaluationItems.filter((item) => item.score > 0 || item.answer.trim() !== "");
                                    const scoredItems = evaluationItems.filter((item) => item.score > 0);
                                    const averageScore =
                                        scoredItems.length > 0
                                            ? scoredItems.reduce((sum, item) => sum + item.score, 0) / scoredItems.length
                                            : null;

                                    return (
                                        <div
                                            key={mock.mock_id}
                                            style={{
                                                border: "1px solid #e2e8f0",
                                                borderRadius: "14px",
                                                padding: "12px",
                                                background: "#ffffff",
                                            }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "start" }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, marginBottom: "4px" }}>{mock.mock_title}</div>
                                                    <div style={{ color: "#64748b", fontSize: "13px" }}>
                                                        {mock.interview_type} • {mock.coach_name} • {formatDate(mock.interviewed_at)}
                                                    </div>
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "12px",
                                                        borderRadius: "999px",
                                                        padding: "4px 10px",
                                                        background: averageScore ? "#dcfce7" : "#e2e8f0",
                                                        color: averageScore ? "#166534" : "#64748b",
                                                        fontWeight: 700,
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {averageScore ? `Avg ${averageScore.toFixed(1)}/${MAX_EVALUATION_SCORE}` : "Pending"}
                                                </div>
                                            </div>

                                            <div style={{ marginTop: "10px", marginBottom: "10px", color: "#64748b", fontSize: "12px" }}>
                                                Reviewed: {reviewedItems.length}/{evaluationItems.length || 0}
                                            </div>

                                            <div style={{ display: "grid", gap: "8px" }}>
                                                {evaluationItems.map((item) => {
                                                    const scoreStyle = getScoreStyle(item.score);
                                                    const scorePercent = Math.max(
                                                        0,
                                                        Math.min(100, (item.score / MAX_EVALUATION_SCORE) * 100),
                                                    );

                                                    return (
                                                        <div
                                                            key={`${mock.mock_id}-${item.id}`}
                                                            style={{
                                                                border: "1px solid #e2e8f0",
                                                                borderRadius: "12px",
                                                                padding: "10px",
                                                                background: "#f8fafc",
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    display: "flex",
                                                                    justifyContent: "space-between",
                                                                    gap: "8px",
                                                                    alignItems: "center",
                                                                    marginBottom: "8px",
                                                                }}
                                                            >
                                                                <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{item.type}</div>
                                                                <div
                                                                    style={{
                                                                        fontSize: "11px",
                                                                        borderRadius: "999px",
                                                                        padding: "3px 8px",
                                                                        fontWeight: 700,
                                                                        ...{
                                                                            color: scoreStyle.color,
                                                                            background: scoreStyle.background,
                                                                        },
                                                                    }}
                                                                >
                                                                    {item.score > 0 ? `${item.score}/${MAX_EVALUATION_SCORE}` : "Not scored"}
                                                                </div>
                                                            </div>

                                                            <div
                                                                style={{
                                                                    height: "6px",
                                                                    background: "#e2e8f0",
                                                                    borderRadius: "999px",
                                                                    overflow: "hidden",
                                                                    marginBottom: "8px",
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        width: `${scorePercent}%`,
                                                                        height: "100%",
                                                                        background: scoreStyle.bar,
                                                                    }}
                                                                />
                                                            </div>

                                                            {item.question ? (
                                                                <p
                                                                    style={{
                                                                        margin: "0 0 6px",
                                                                        color: "#475569",
                                                                        fontSize: "12px",
                                                                        lineHeight: 1.45,
                                                                    }}
                                                                >
                                                                    {item.question}
                                                                </p>
                                                            ) : null}

                                                            <p style={{ margin: 0, color: "#334155", fontSize: "12px", lineHeight: 1.45 }}>
                                                                {item.answer?.trim() ? item.answer : "No evaluator note yet."}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "18px" }}>
                {selectedSkill ? (
                    <div>
                        <p
                            style={{
                                marginTop: 0,
                                marginBottom: "6px",
                                color: "#64748b",
                                fontSize: "12px",
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                fontWeight: 700,
                            }}
                        >
                            Skill Detail
                        </p>
                        <h3 style={{ marginTop: 0, marginBottom: "10px", fontSize: "22px" }}>{selectedSkill.skill_name}</h3>

                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                borderRadius: "9999px",
                                padding: "5px 10px",
                                fontSize: "12px",
                                fontWeight: 700,
                                marginBottom: "14px",
                                ...statusStyle,
                            }}
                        >
                            {status}
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: "13px",
                                    color: "#334155",
                                    marginBottom: "6px",
                                }}
                            >
                                <span>Progress</span>
                                <span>{progress}%</span>
                            </div>
                            <div style={{ height: "8px", background: "#e5e7eb", borderRadius: "9999px", overflow: "hidden" }}>
                                <div style={{ width: `${progress}%`, height: "100%", background: "#2563eb" }} />
                            </div>
                        </div>

                        <div style={{ marginBottom: "8px", color: "#334155", fontSize: "14px" }}>
                            <strong>Current:</strong> {selectedSkill.assessment?.current_level ?? "N/A"}
                        </div>
                        <div style={{ marginBottom: "14px", color: "#334155", fontSize: "14px" }}>
                            <strong>Target:</strong> {selectedSkill.assessment?.target_level ?? "N/A"}
                        </div>

                        <h4 style={{ marginTop: 0, marginBottom: "8px", color: "#0f172a", fontSize: "15px" }}>Child Skills</h4>
                        <ul style={{ marginTop: 0, marginBottom: "14px", paddingLeft: "20px", color: "#334155", lineHeight: 1.5 }}>
                            {(selectedSkill.child_skills ?? []).map((childSkill) => (
                                <li key={childSkill}>{childSkill}</li>
                            ))}
                        </ul>

                        <h4 style={{ marginTop: 0, marginBottom: "8px", color: "#0f172a", fontSize: "15px" }}>Mentor Note</h4>
                        <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                            {selectedSkill.mentor_note ?? "No mentor note available."}
                        </p>
                    </div>
                ) : (
                    <p style={{ margin: 0, color: "#64748b" }}>Select a skill in this phase to view detail.</p>
                )}
            </div>
        </div>
    );
}

export default NodeDetail;
