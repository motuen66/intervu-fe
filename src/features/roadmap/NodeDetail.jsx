import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import {
    BookOpen,
    CalendarClock,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    History,
    NotebookPen,
    Sparkles,
    Star,
    ThumbsDown,
    ThumbsUp,
    Users,
} from "lucide-react";
import SkillStatusBadge from "./components/SkillStatusBadge";
import SkillProgressBar from "./components/SkillProgressBar";
import { formatVndCurrency } from "./utils/formatCurrency";

const PHASE_TABS = {
    RECOMMENDATIONS: "recommendations",
    MOCK_HISTORY: "mockHistory",
};

const MAX_EVALUATION_SCORE = 10;
const RECENT_MOCKS_EXPANDED = 3;
const FEEDBACK_STORAGE_KEY = "intervu.roadmap.skillFeedback";

// LocalStorage-backed feedback helpers (scoped per skill)
const readFeedbackStore = () => {
    try {
        const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

const writeFeedbackStore = (store) => {
    try {
        localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(store));
    } catch {
        // ignore quota / privacy-mode errors
    }
};

const DIFFICULTY_STYLES = {
    easy: { color: "#16A34A", bg: "#DCFCE7", border: "#BBF7D0" },
    medium: { color: "#CA8A04", bg: "#FEF9C3", border: "#FDE68A" },
    hard: { color: "#DC2626", bg: "#FEE2E2", border: "#FECACA" },
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

const parseDate = (dateValue) => {
    const parsed = new Date(dateValue);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

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
        return { color: "#16A34A", background: "#DCFCE7", bar: "#22C55E" };
    }

    if (score >= 6) {
        return { color: "#CA8A04", background: "#FEF9C3", bar: "#EAB308" };
    }

    if (score > 0) {
        return { color: "#DC2626", background: "#FEE2E2", bar: "#EF4444" };
    }

    return { color: "#64748B", background: "#E2E8F0", bar: "#CBD5E1" };
};

const computeMockAverage = (evaluationItems) => {
    const scored = evaluationItems.filter((item) => item.score > 0);
    if (scored.length === 0) return null;
    return scored.reduce((sum, item) => sum + item.score, 0) / scored.length;
};

// X6: normalize child_skills that may be strings or {name, questions} objects
const extractChildSkillDetails = (childSkills = []) =>
    childSkills
        .map((item, index) => {
            if (typeof item === "string") {
                return { name: item, questions: [], key: `${item}-${index}` };
            }
            if (item && typeof item === "object") {
                const name = item.name ?? item.Name ?? "";
                const questions = item.questions ?? item.Questions ?? [];
                return {
                    name,
                    questions: Array.isArray(questions) ? questions : [],
                    key: `${name || "skill"}-${index}`,
                };
            }
            return null;
        })
        .filter((entry) => entry && entry.name);

function EvaluationRow({ item }) {
    const scoreStyle = getScoreStyle(item.score);
    const scorePercent = Math.max(0, Math.min(100, (item.score / MAX_EVALUATION_SCORE) * 100));

    return (
        <div
            style={{
                border: "1px solid #E2E8F0",
                borderRadius: "12px",
                padding: "10px",
                background: "#F8FAFC",
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
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>{item.type}</div>
                <div
                    style={{
                        fontSize: "11px",
                        borderRadius: "999px",
                        padding: "3px 8px",
                        fontWeight: 700,
                        color: scoreStyle.color,
                        background: scoreStyle.background,
                    }}
                >
                    {item.score > 0 ? `${item.score}/${MAX_EVALUATION_SCORE}` : "Not scored"}
                </div>
            </div>

            <div
                role="progressbar"
                aria-valuenow={item.score}
                aria-valuemin={0}
                aria-valuemax={MAX_EVALUATION_SCORE}
                aria-label={`${item.type} score ${item.score} of ${MAX_EVALUATION_SCORE}`}
                style={{
                    height: "6px",
                    background: "#E2E8F0",
                    borderRadius: "999px",
                    overflow: "hidden",
                    marginBottom: "8px",
                }}
            >
                <div style={{ width: `${scorePercent}%`, height: "100%", background: scoreStyle.bar }} />
            </div>

            {item.question ? (
                <p style={{ margin: "0 0 6px", color: "#475569", fontSize: "12px", lineHeight: 1.45 }}>
                    {item.question}
                </p>
            ) : null}

            <p style={{ margin: 0, color: "#334155", fontSize: "12px", lineHeight: 1.45 }}>
                {item.answer?.trim() ? item.answer : "No evaluator note yet."}
            </p>
        </div>
    );
}

function MockCard({ mock, initiallyOpen }) {
    const [isOpen, setIsOpen] = useState(initiallyOpen);
    const evaluationItems = useMemo(() => normalizeEvaluationItems(mock.evaluation), [mock.evaluation]);
    const reviewedItems = evaluationItems.filter((item) => item.score > 0 || item.answer.trim() !== "");
    const averageScore = useMemo(() => computeMockAverage(evaluationItems), [evaluationItems]);

    useEffect(() => {
        setIsOpen(initiallyOpen);
    }, [initiallyOpen]);

    return (
        <div
            style={{
                border: "1px solid #E2E8F0",
                borderRadius: "14px",
                padding: "12px",
                background: "#FFFFFF",
            }}
        >
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-expanded={isOpen}
                aria-label={`${isOpen ? "Collapse" : "Expand"} ${mock.mock_title} details`}
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "8px",
                    alignItems: "start",
                    width: "100%",
                    textAlign: "left",
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    color: "inherit",
                }}
            >
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, marginBottom: "4px" }}>{mock.mock_title}</div>
                    <div style={{ color: "#64748B", fontSize: "13px" }}>
                        {mock.interview_type} • {mock.coach_name} • {formatDate(mock.interviewed_at)}
                    </div>
                </div>
                <div
                    style={{
                        fontSize: "12px",
                        borderRadius: "999px",
                        padding: "4px 10px",
                        background: averageScore != null ? "#DCFCE7" : "#E2E8F0",
                        color: averageScore != null ? "#16A34A" : "#64748B",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                    }}
                >
                    {averageScore != null ? `Avg ${averageScore.toFixed(1)}/${MAX_EVALUATION_SCORE}` : "Pending"}
                </div>
                {isOpen ? (
                    <ChevronUp size={16} color="#94A3B8" style={{ marginTop: "2px" }} />
                ) : (
                    <ChevronDown size={16} color="#94A3B8" style={{ marginTop: "2px" }} />
                )}
            </button>

            {isOpen ? (
                <>
                    <div style={{ marginTop: "10px", marginBottom: "10px", color: "#64748B", fontSize: "12px" }}>
                        Reviewed: {reviewedItems.length}/{evaluationItems.length || 0}
                    </div>
                    <div style={{ display: "grid", gap: "8px" }}>
                        {evaluationItems.map((item) => (
                            <EvaluationRow key={`${mock.mock_id}-${item.id}`} item={item} />
                        ))}
                    </div>
                </>
            ) : null}
        </div>
    );
}

// X8: thumbs up/down per skill — persisted client-side until backend endpoint exists
function SkillFeedback({ skillId, skillName }) {
    const [vote, setVote] = useState(null);

    useEffect(() => {
        if (!skillId) {
            setVote(null);
            return;
        }
        const store = readFeedbackStore();
        setVote(store[skillId]?.vote ?? null);
    }, [skillId]);

    const castVote = (nextVote) => {
        if (!skillId) return;
        const store = readFeedbackStore();
        const resolved = vote === nextVote ? null : nextVote;
        if (resolved == null) {
            delete store[skillId];
        } else {
            store[skillId] = { vote: resolved, at: new Date().toISOString(), skillName };
        }
        writeFeedbackStore(store);
        setVote(resolved);
    };

    const buttonStyle = (isActive, accent) => ({
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 10px",
        borderRadius: "999px",
        border: `1px solid ${isActive ? accent : "#E2E8F0"}`,
        background: isActive ? accent : "#FFFFFF",
        color: isActive ? "#FFFFFF" : "#475569",
        fontSize: "12px",
        fontWeight: 700,
        cursor: "pointer",
    });

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "14px",
                padding: "10px 12px",
                borderRadius: "12px",
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
            }}
        >
            <span style={{ fontSize: "12px", color: "#475569", fontWeight: 600 }}>
                Was this recommendation helpful?
            </span>
            <div style={{ flex: 1 }} />
            <button
                type="button"
                onClick={() => castVote("up")}
                aria-pressed={vote === "up"}
                aria-label="Mark this skill recommendation as helpful"
                style={buttonStyle(vote === "up", "#16A34A")}
            >
                <ThumbsUp size={13} /> Helpful
            </button>
            <button
                type="button"
                onClick={() => castVote("down")}
                aria-pressed={vote === "down"}
                aria-label="Mark this skill recommendation as unhelpful"
                style={buttonStyle(vote === "down", "#DC2626")}
            >
                <ThumbsDown size={13} /> Not useful
            </button>
        </div>
    );
}

function NodeDetail({ phase, node, readOnly = false }) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(PHASE_TABS.RECOMMENDATIONS);
    const [showAllMocks, setShowAllMocks] = useState(false);

    // Funnel into the public coach profile (same entry point CoachCard uses for booking)
    const handleOpenCoach = (coach) => {
        const slug = coach?.profileUrl ?? coach?.slugProfileUrl ?? coach?.id;
        if (!slug) {
            navigate("/home?smartMatch=1");
            return;
        }
        const params = new URLSearchParams({ from: "roadmap" });
        if (phase?.phase_name) params.set("phase", phase.phase_name);
        navigate(`/profile/${encodeURIComponent(slug)}?${params.toString()}`);
    };

    const handlePracticeSkill = (skillName) => {
        if (!skillName) return;
        navigate(`/questions?skill=${encodeURIComponent(skillName)}`);
    };

    const handleScheduleMock = (skillName) => {
        // B2: open SmartMatch so the user lands directly in coach discovery
        const params = new URLSearchParams({ smartMatch: "1" });
        if (skillName) params.set("skill", skillName);
        navigate(`/home?${params.toString()}`);
    };

    // Roadmap-driven booking: jump into the recommended coach's public profile with
    // the node id + pre-selected service pre-filled in the query string so the booking
    // payload can propagate RoadmapNodeId through to the InterviewRoom.
    const handleScheduleWithRecommended = (nodeSkillId) => {
        const coach = selectedSkill?.recommended_coach;
        const service = selectedSkill?.recommended_service;
        const slug = coach?.slug_profile_url ?? coach?.slugProfileUrl ?? coach?.id;
        if (!slug) return;

        const params = new URLSearchParams({ from: "roadmap" });
        if (nodeSkillId) params.set("roadmapNodeId", nodeSkillId);
        if (service?.id) params.set("serviceId", service.id);
        if (service?.interview_type_name) params.set("serviceName", service.interview_type_name);
        navigate(`/profile/${encodeURIComponent(slug)}?${params.toString()}`);
    };

    // X6: jump straight to a specific interview question
    const handleOpenQuestion = (question, childSkillName) => {
        if (question?.id) {
            navigate(`/questions/${encodeURIComponent(question.id)}`);
            return;
        }
        const query = childSkillName ? `?skill=${encodeURIComponent(childSkillName)}` : "";
        navigate(`/questions${query}`);
    };

    // X6: discover curated learning resources for a sub-skill
    const handleExploreResources = (skillName) => {
        const query = skillName ? `?q=${encodeURIComponent(skillName)}` : "";
        navigate(`/home${query}&smartMatch=1`.replace("?&", "?"));
    };

    useEffect(() => {
        setActiveTab(PHASE_TABS.RECOMMENDATIONS);
        setShowAllMocks(false);
    }, [phase?.phase_id]);

    const selectedSkill = useMemo(() => {
        if (!phase) return null;
        if (node?.phase_id === phase.phase_id) return node;
        return phase.nodes?.[0] ?? null;
    }, [node, phase]);

    // X5: sort mocks by date desc once
    const sortedMockHistory = useMemo(() => {
        const history = phase?.mock_history ?? [];
        return [...history].sort((a, b) => parseDate(b.interviewed_at) - parseDate(a.interviewed_at));
    }, [phase?.mock_history]);

    // X5: overall avg across all mocks for a quick read
    const overallMockAverage = useMemo(() => {
        if (sortedMockHistory.length === 0) return null;
        const perMockAverages = sortedMockHistory
            .map((mock) => computeMockAverage(normalizeEvaluationItems(mock.evaluation)))
            .filter((value) => value != null);
        if (perMockAverages.length === 0) return null;
        return perMockAverages.reduce((sum, value) => sum + value, 0) / perMockAverages.length;
    }, [sortedMockHistory]);

    const childSkillDetails = useMemo(
        () => extractChildSkillDetails(selectedSkill?.child_skills ?? []),
        [selectedSkill?.child_skills],
    );
    const hasChildQuestions = childSkillDetails.some((child) => child.questions.length > 0);

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
                    color: "#64748B",
                }}
            >
                <div style={{ fontSize: "36px", lineHeight: 1 }}>🗂️</div>
                <div style={{ fontWeight: 700, fontSize: "16px", color: "#0F172A" }}>Nothing selected</div>
                <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.6, maxWidth: "220px" }}>
                    Click a phase or skill in the roadmap to view detailed guidance here.
                </p>
            </div>
        );
    }

    const status = selectedSkill?.assessment?.status ?? "Missing";
    const progress = selectedSkill?.assessment?.progress ?? 0;
    const recommendedCoaches = phase.recommended_coaches ?? [];
    const nodeCoach = selectedSkill?.recommended_coach ?? null;
    const nodeService = selectedSkill?.recommended_service ?? null;
    const visibleMocks = showAllMocks ? sortedMockHistory : sortedMockHistory.slice(0, RECENT_MOCKS_EXPANDED);
    const hiddenMockCount = Math.max(0, sortedMockHistory.length - RECENT_MOCKS_EXPANDED);
    const overallScoreStyle = overallMockAverage != null ? getScoreStyle(overallMockAverage) : null;

    return (
        <div
            style={{
                padding: "24px",
                height: "100%",
                minHeight: 0,
                boxSizing: "border-box",
                overflowY: "auto",
                overflowX: "hidden",
                color: "#0F172A",
            }}
        >
            <p
                style={{
                    marginTop: 0,
                    marginBottom: "6px",
                    color: "#64748B",
                    fontSize: "12px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                }}
            >
                Phase Overview
            </p>
            <h2
                style={{
                    marginTop: 0,
                    marginBottom: phase.phase_description ? "10px" : "14px",
                    fontSize: "30px",
                    lineHeight: 1.12,
                }}
            >
                {phase.phase_name}
            </h2>

            {/* X7: phase-level narrative so users understand the "why" of sequencing */}
            {phase.phase_description ? (
                <p style={{ marginTop: 0, marginBottom: "18px", color: "#475569", fontSize: "14px", lineHeight: 1.6 }}>
                    {phase.phase_description}
                </p>
            ) : null}

            <div
                role="tablist"
                aria-label="Phase detail sections"
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    marginBottom: "16px",
                    borderBottom: "1px solid #E2E8F0",
                }}
            >
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === PHASE_TABS.RECOMMENDATIONS}
                    onClick={() => setActiveTab(PHASE_TABS.RECOMMENDATIONS)}
                    style={{
                        border: "none",
                        borderBottom:
                            activeTab === PHASE_TABS.RECOMMENDATIONS ? "2px solid #0F172A" : "2px solid transparent",
                        background: "transparent",
                        padding: "10px 8px",
                        fontWeight: 700,
                        color: activeTab === PHASE_TABS.RECOMMENDATIONS ? "#0F172A" : "#64748B",
                        cursor: "pointer",
                    }}
                >
                    Recommendations
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === PHASE_TABS.MOCK_HISTORY}
                    onClick={() => setActiveTab(PHASE_TABS.MOCK_HISTORY)}
                    style={{
                        border: "none",
                        borderBottom:
                            activeTab === PHASE_TABS.MOCK_HISTORY ? "2px solid #0F172A" : "2px solid transparent",
                        background: "transparent",
                        padding: "10px 8px",
                        fontWeight: 700,
                        color: activeTab === PHASE_TABS.MOCK_HISTORY ? "#0F172A" : "#64748B",
                        cursor: "pointer",
                    }}
                >
                    Mock History
                </button>
            </div>

            {activeTab === PHASE_TABS.RECOMMENDATIONS ? (
                <div style={{ marginBottom: "24px" }}>
                    {/* Per-node recommendation: one coach + one service the candidate can book
                        directly to work on this specific skill. */}
                    {nodeCoach ? (
                        <div
                            style={{
                                marginBottom: "16px",
                                borderRadius: "14px",
                                border: "1px solid #BFDBFE",
                                background: "linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%)",
                                padding: "14px",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                    color: "#1D4ED8",
                                    marginBottom: "8px",
                                }}
                            >
                                Recommended for this skill
                            </div>
                            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                <Avatar
                                    src={nodeCoach.avatarUrl || ""}
                                    alt={nodeCoach.name}
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        bgcolor: "#E2E8F0",
                                    }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: "15px" }}>{nodeCoach.name}</div>
                                    {nodeService ? (
                                        <div style={{ color: "#475569", fontSize: "13px", marginTop: "2px" }}>
                                            {nodeService.interview_type_name}
                                            {nodeService.price != null
                                                ? ` · ${formatVndCurrency(nodeService.price)}`
                                                : ""}
                                            {nodeService.duration_minutes != null
                                                ? ` · ${nodeService.duration_minutes}min`
                                                : ""}
                                        </div>
                                    ) : null}
                                </div>
                                {!readOnly ? (
                                    <button
                                        type="button"
                                        onClick={() => handleScheduleWithRecommended(selectedSkill?.skill_id)}
                                        style={{
                                            border: "none",
                                            borderRadius: "10px",
                                            background: "#0F172A",
                                            color: "#FFFFFF",
                                            padding: "8px 14px",
                                            fontWeight: 700,
                                            fontSize: "13px",
                                            cursor: "pointer",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "6px",
                                        }}
                                    >
                                        <CalendarClock size={14} /> Schedule mock
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    ) : null}

                    {/* <h3
                        style={{
                            marginTop: 0,
                            marginBottom: "12px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "20px",
                        }}
                    >
                        <Users size={18} /> {nodeCoach ? "Other coaches in this phase" : "Recommended Coaches"}
                    </h3> */}
                    {/* {recommendedCoaches.length === 0 ? (
                        <div
                            style={{
                                padding: "20px",
                                borderRadius: "14px",
                                border: "1px solid #E2E8F0",
                                background: "#F8FAFC",
                                textAlign: "center",
                                color: "#64748B",
                            }}
                        >
                            <div style={{ fontSize: "24px", lineHeight: 1, marginBottom: "8px" }}>👥</div>
                            <div style={{ fontWeight: 600, fontSize: "14px", color: "#0F172A", marginBottom: "4px" }}>
                                No coaches assigned
                            </div>
                            <p style={{ margin: 0, fontSize: "12px", lineHeight: 1.5 }}>
                                Coach recommendations will appear here once assigned for this phase.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gap: "10px" }}>
                            {recommendedCoaches.map((coach) => (
                                <button
                                    type="button"
                                    key={coach.id}
                                    onClick={() => handleOpenCoach(coach)}
                                    title={`View ${coach.name}'s profile`}
                                    style={{
                                        border: "1px solid #E2E8F0",
                                        borderRadius: "14px",
                                        padding: "12px",
                                        background: "#FFFFFF",
                                        textAlign: "left",
                                        cursor: "pointer",
                                        width: "100%",
                                        transition: "background 0.15s, border-color 0.15s",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = "#F8FAFC";
                                        e.currentTarget.style.borderColor = "#CBD5E1";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "#FFFFFF";
                                        e.currentTarget.style.borderColor = "#E2E8F0";
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
                                                background: "#E2E8F0",
                                            }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700 }}>{coach.name}</div>
                                            <div style={{ color: "#64748B", fontSize: "13px", marginTop: "2px" }}>
                                                {coach.role}
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                display: "inline-flex",
                                                gap: "4px",
                                                alignItems: "center",
                                                color: "#EAB308",
                                                fontWeight: 700,
                                            }}
                                        >
                                            <Star size={14} fill="#EAB308" />
                                            {coach.rating}
                                        </div>
                                        <ChevronRight size={16} color="#94A3B8" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )} */}
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

                    {/* X5: summary score band at top */}
                    {sortedMockHistory.length > 0 ? (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "12px",
                                borderRadius: "12px",
                                background: overallScoreStyle?.background ?? "#F1F5F9",
                                border: `1px solid ${overallScoreStyle ? overallScoreStyle.background : "#E2E8F0"}`,
                                marginBottom: "12px",
                            }}
                        >
                            <div
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: "50%",
                                    background: "#FFFFFF",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 800,
                                    color: overallScoreStyle?.color ?? "#64748B",
                                }}
                            >
                                {overallMockAverage != null ? overallMockAverage.toFixed(1) : "—"}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        fontWeight: 700,
                                        fontSize: "14px",
                                        color: overallScoreStyle?.color ?? "#0F172A",
                                    }}
                                >
                                    Overall phase average
                                </div>
                                <div style={{ color: "#475569", fontSize: "12px", marginTop: "2px" }}>
                                    {sortedMockHistory.length} mock{sortedMockHistory.length === 1 ? "" : "s"} across
                                    this phase
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {sortedMockHistory.length === 0 ? (
                        <div
                            style={{
                                padding: "20px",
                                borderRadius: "14px",
                                border: "1px solid #E2E8F0",
                                background: "#F8FAFC",
                                textAlign: "center",
                                color: "#64748B",
                            }}
                        >
                            <div style={{ fontSize: "24px", lineHeight: 1, marginBottom: "8px" }}>🕐</div>
                            <div style={{ fontWeight: 600, fontSize: "14px", color: "#0F172A", marginBottom: "4px" }}>
                                No mock interviews yet
                            </div>
                            <p style={{ margin: 0, fontSize: "12px", lineHeight: 1.5 }}>
                                Complete a mock interview for this phase to see your history and scores here.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gap: "10px" }}>
                            {visibleMocks.map((mock, index) => (
                                <MockCard key={mock.mock_id} mock={mock} initiallyOpen={index === 0} />
                            ))}
                            {hiddenMockCount > 0 ? (
                                <button
                                    type="button"
                                    onClick={() => setShowAllMocks((prev) => !prev)}
                                    style={{
                                        border: "1px dashed #CBD5E1",
                                        background: "#FFFFFF",
                                        borderRadius: "12px",
                                        padding: "10px",
                                        cursor: "pointer",
                                        color: "#0F172A",
                                        fontWeight: 700,
                                        fontSize: "13px",
                                    }}
                                >
                                    {showAllMocks
                                        ? "Show fewer"
                                        : `Show ${hiddenMockCount} older mock${hiddenMockCount === 1 ? "" : "s"}`}
                                </button>
                            ) : null}
                        </div>
                    )}
                </div>
            )}

            <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "18px" }}>
                {selectedSkill ? (
                    <div>
                        <p
                            style={{
                                marginTop: 0,
                                marginBottom: "6px",
                                color: "#64748B",
                                fontSize: "12px",
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                fontWeight: 700,
                            }}
                        >
                            Skill Detail
                        </p>
                        <h3 style={{ marginTop: 0, marginBottom: "10px", fontSize: "22px" }}>
                            {selectedSkill.skill_name}
                        </h3>

                        <div style={{ marginBottom: "14px" }}>
                            <SkillStatusBadge status={status} />
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <SkillProgressBar progress={progress} status={status} height={8} showLabel />
                        </div>

                        {/* X8: feedback loop — capture sentiment to tune future LLM output */}
                        {!readOnly ? (
                            <SkillFeedback skillId={selectedSkill.skill_id} skillName={selectedSkill.skill_name} />
                        ) : null}

                        <div style={{ marginBottom: "8px", color: "#334155", fontSize: "14px" }}>
                            <strong>Current:</strong> {selectedSkill.assessment?.current_level ?? "N/A"}
                        </div>
                        <div style={{ marginBottom: "14px", color: "#334155", fontSize: "14px" }}>
                            <strong>Target:</strong> {selectedSkill.assessment?.target_level ?? "N/A"}
                        </div>

                        {/* X6: onboarding nudge for Missing skills */}
                        {status === "Missing" && childSkillDetails.length > 0 ? (
                            <div
                                style={{
                                    borderRadius: "12px",
                                    padding: "12px",
                                    background: "#FEF9C3",
                                    border: "1px solid #FDE68A",
                                    color: "#78350F",
                                    marginBottom: "14px",
                                    display: "flex",
                                    gap: "10px",
                                    alignItems: "flex-start",
                                }}
                            >
                                <Sparkles size={16} style={{ marginTop: "2px", flexShrink: 0 }} />
                                <div style={{ fontSize: "13px", lineHeight: 1.5 }}>
                                    New to this skill? Start with <strong>{childSkillDetails[0].name}</strong> —
                                    practice the fundamentals first before booking a mock.
                                </div>
                            </div>
                        ) : null}

                        {/* B2: Action CTAs */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "18px" }}>
                            <button
                                type="button"
                                onClick={() => handlePracticeSkill(selectedSkill.skill_name)}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "8px 14px",
                                    borderRadius: "999px",
                                    border: "1px solid #0F172A",
                                    background: "#0F172A",
                                    color: "#FFFFFF",
                                    fontSize: "13px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                }}
                            >
                                <NotebookPen size={14} /> Practice this skill
                            </button>
                            <button
                                type="button"
                                onClick={() => handleScheduleMock(selectedSkill.skill_name)}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "8px 14px",
                                    borderRadius: "999px",
                                    border: "1px solid #CBD5E1",
                                    background: "#FFFFFF",
                                    color: "#0F172A",
                                    fontSize: "13px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                }}
                            >
                                <CalendarClock size={14} /> Schedule a mock
                            </button>
                        </div>

                        {/* X6: Child skills with clickable practice questions */}
                        <h4 style={{ marginTop: 0, marginBottom: "10px", color: "#0F172A", fontSize: "15px" }}>
                            Sub-skills {hasChildQuestions ? "& practice" : ""}
                        </h4>
                        {childSkillDetails.length === 0 ? (
                            <p style={{ margin: "0 0 14px", color: "#64748B", fontSize: "13px" }}>
                                No sub-skills listed for this skill yet.
                            </p>
                        ) : (
                            <div style={{ display: "grid", gap: "10px", marginBottom: "18px" }}>
                                {childSkillDetails.map((child) => (
                                    <div
                                        key={child.key}
                                        style={{
                                            border: "1px solid #E2E8F0",
                                            borderRadius: "12px",
                                            padding: "12px",
                                            background: "#FFFFFF",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                gap: "8px",
                                                marginBottom: child.questions.length > 0 ? "10px" : 0,
                                            }}
                                        >
                                            <div style={{ fontWeight: 700, fontSize: "13px", color: "#0F172A" }}>
                                                {child.name}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleExploreResources(child.name)}
                                                title={`Find learning resources for ${child.name}`}
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                    background: "transparent",
                                                    border: "none",
                                                    color: "#0F172A",
                                                    fontSize: "12px",
                                                    fontWeight: 700,
                                                    cursor: "pointer",
                                                    padding: "4px 6px",
                                                    borderRadius: "6px",
                                                }}
                                            >
                                                <BookOpen size={12} /> Resources
                                            </button>
                                        </div>
                                        {child.questions.length > 0 ? (
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                                {child.questions.slice(0, 6).map((question) => {
                                                    const difficultyKey = (question.difficulty ?? "").toLowerCase();
                                                    const difficultyStyle = DIFFICULTY_STYLES[difficultyKey] ?? {
                                                        color: "#475569",
                                                        bg: "#F1F5F9",
                                                        border: "#E2E8F0",
                                                    };
                                                    return (
                                                        <button
                                                            key={question.id}
                                                            type="button"
                                                            onClick={() => handleOpenQuestion(question, child.name)}
                                                            title={question.title}
                                                            style={{
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                gap: "6px",
                                                                padding: "4px 10px",
                                                                borderRadius: "999px",
                                                                border: `1px solid ${difficultyStyle.border}`,
                                                                background: difficultyStyle.bg,
                                                                color: difficultyStyle.color,
                                                                fontSize: "11px",
                                                                fontWeight: 700,
                                                                cursor: "pointer",
                                                                maxWidth: "100%",
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    overflow: "hidden",
                                                                    textOverflow: "ellipsis",
                                                                    whiteSpace: "nowrap",
                                                                    maxWidth: "160px",
                                                                }}
                                                            >
                                                                {question.title}
                                                            </span>
                                                            {question.difficulty ? (
                                                                <span
                                                                    style={{
                                                                        opacity: 0.7,
                                                                        textTransform: "capitalize",
                                                                    }}
                                                                >
                                                                    · {question.difficulty}
                                                                </span>
                                                            ) : null}
                                                        </button>
                                                    );
                                                })}
                                                {child.questions.length > 6 ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePracticeSkill(child.name)}
                                                        style={{
                                                            padding: "4px 10px",
                                                            borderRadius: "999px",
                                                            border: "1px dashed #CBD5E1",
                                                            background: "transparent",
                                                            color: "#475569",
                                                            fontSize: "11px",
                                                            fontWeight: 700,
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        +{child.questions.length - 6} more
                                                    </button>
                                                ) : null}
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handlePracticeSkill(child.name)}
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                    padding: "4px 10px",
                                                    borderRadius: "999px",
                                                    border: "1px dashed #CBD5E1",
                                                    background: "transparent",
                                                    color: "#475569",
                                                    fontSize: "11px",
                                                    fontWeight: 700,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Find questions
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <h4 style={{ marginTop: 0, marginBottom: "8px", color: "#0F172A", fontSize: "15px" }}>
                            Mentor Note
                        </h4>
                        <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                            {selectedSkill.mentor_note ?? "No mentor note available."}
                        </p>

                        {Array.isArray(selectedSkill.interview_drills) && selectedSkill.interview_drills.length > 0 ? (
                            <div style={{ marginTop: "16px" }}>
                                <h4
                                    style={{
                                        marginTop: 0,
                                        marginBottom: "8px",
                                        color: "#0F172A",
                                        fontSize: "15px",
                                    }}
                                >
                                    Interview Drills
                                </h4>
                                <ul
                                    style={{
                                        margin: 0,
                                        paddingLeft: "18px",
                                        color: "#475569",
                                        lineHeight: 1.6,
                                    }}
                                >
                                    {selectedSkill.interview_drills.map((drill, idx) => (
                                        <li key={idx}>{drill}</li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}
                    </div>
                ) : (
                    <p style={{ margin: 0, color: "#64748B" }}>Select a skill in this phase to view detail.</p>
                )}
            </div>
        </div>
    );
}

export default NodeDetail;
