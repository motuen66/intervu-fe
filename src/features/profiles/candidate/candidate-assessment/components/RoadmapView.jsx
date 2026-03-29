import React, { useEffect, useMemo, useState } from "react";
import { Background, Controls, Handle, MarkerType, Position, ReactFlow, ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useAssessment } from "../context/AssessmentContext";

const nodeTypes = {
    roadmap: RoadmapNode,
};

const RoadmapView = () => {
    const navigate = useNavigate();
    const { roadmap, answers, skillScores, resetAssessment, saveAssessmentSnapshot } = useAssessment();

    const profile = answers?.profile || {};
    const roadmapMeta = roadmap?.meta || {};
    const interviewReady = Boolean(roadmapMeta.interviewReady);
    const graphData = useMemo(() => buildRoadmapTree(roadmap, profile), [roadmap, profile]);
    const [selectedNodeId, setSelectedNodeId] = useState(graphData.initialSelectedId);
    const selectedDetail = graphData.detailMap[selectedNodeId] || graphData.detailMap[graphData.initialSelectedId];
    const strongestSkills = (skillScores || [])
        .slice()
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);

    useEffect(() => {
        setSelectedNodeId(graphData.initialSelectedId);
    }, [graphData.initialSelectedId]);

    const [isSaving, setIsSaving] = useState(false);

    const handleSaveAndGoHome = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            if (saveAssessmentSnapshot) await saveAssessmentSnapshot();
            navigate("/home");
        } finally {
            setIsSaving(false);
        }
    };

    const nodes = graphData.nodes.map((node) => ({
        ...node,
        data: { ...node.data, selected: node.id === selectedNodeId },
    }));

    return (
        <ReactFlowProvider>
            <Box sx={{ maxWidth: 1380, mx: "auto", px: 3, py: 4 }}>
                <Stack spacing={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 3, md: 4 },
                            borderRadius: 4,
                            border: "1px solid",
                            borderColor: alpha("#cbd5e1", 0.9),
                            background:
                                "radial-gradient(circle at top left, rgba(183,239,78,0.18), transparent 25%), linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                        }}
                    >
                        <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" spacing={3}>
                            <Box>
                                <Typography variant="h3" fontWeight={800} gutterBottom>
                                    {interviewReady ? "Interview Practice Plan" : "Your Personalized Roadmap"}
                                </Typography>
                                <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 820 }}>
                                    {interviewReady
                                        ? roadmapMeta.description
                                        : "Follow the skill tree from your target role into the exact practice path you need next."}
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
                                    {profile.role ? <Chip label={profile.role} /> : null}
                                    {interviewReady ? <Chip label="Interview Ready" color="success" /> : null}
                                    {(profile.techstack || []).slice(0, 4).map((item) => (
                                        <Chip key={item} label={item} variant="outlined" />
                                    ))}
                                    {strongestSkills.map((skill) => (
                                        <Chip
                                            key={skill.skillKey}
                                            label={`Strong: ${skill.skillKey}`}
                                            color="success"
                                            variant="outlined"
                                        />
                                    ))}
                                </Stack>
                            </Box>

                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                                <Button
                                    variant="text"
                                    size="small"
                                    onClick={handleSaveAndGoHome}
                                    startIcon={<HomeRoundedIcon />}
                                    disabled={isSaving}
                                    sx={{ minWidth: 156, py: 0.9, color: "#64748b" }}
                                >
                                    {isSaving ? "Saving..." : "Save And Go Home"}
                                </Button>
                            </Stack>
                        </Stack>
                    </Paper>

                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            borderRadius: 4,
                            border: "1px solid",
                            borderColor: alpha("#cbd5e1", 0.9),
                            height: { xs: 580, lg: 640 },
                            overflow: "hidden",
                        }}
                    >
                        <ReactFlow
                            nodes={nodes}
                            edges={graphData.edges}
                            nodeTypes={nodeTypes}
                            fitView
                            fitViewOptions={{ padding: 0.16 }}
                            nodesDraggable={false}
                            nodesConnectable={false}
                            elementsSelectable={false}
                            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                            proOptions={{ hideAttribution: true }}
                        >
                            <Controls showInteractive={false} />
                            <Background gap={18} color="#e2e8f0" />
                        </ReactFlow>
                    </Paper>

                    {selectedDetail ? (
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                                gap: 3,
                            }}
                        >
                            <Paper
                                elevation={0}
                                sx={{ p: 3, borderRadius: 4, border: "1px solid", borderColor: "divider" }}
                            >
                                <Typography
                                    variant="overline"
                                    sx={{ color: "#64748b", fontWeight: 800, letterSpacing: "0.08em" }}
                                >
                                    Skill Overview
                                </Typography>
                                <Typography variant="h5" fontWeight={800} sx={{ mt: 1 }}>
                                    {selectedDetail.title}
                                </Typography>
                                <Typography color="text.secondary" sx={{ mt: 1 }}>
                                    {selectedDetail.description}
                                </Typography>
                                <Box sx={{ mt: 3 }}>
                                    <RadarChart attributes={selectedDetail.attributes || []} />
                                </Box>
                            </Paper>

                            <Paper
                                elevation={0}
                                sx={{ p: 3, borderRadius: 4, border: "1px solid", borderColor: "divider" }}
                            >
                                <Stack
                                    direction={{ xs: "column", md: "row" }}
                                    justifyContent="space-between"
                                    spacing={2}
                                    sx={{ mb: 3 }}
                                >
                                    <Box>
                                        <Typography
                                            variant="overline"
                                            sx={{ color: "#64748b", fontWeight: 800, letterSpacing: "0.08em" }}
                                        >
                                            Study Plan
                                        </Typography>
                                        <Typography variant="h5" fontWeight={800}>
                                            {interviewReady ? "Interview Actions" : "Practice Tasks"}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        icon={<AutoAwesomeRoundedIcon />}
                                        label={`${selectedDetail.tasks?.length || 0} actions`}
                                    />
                                </Stack>

                                <Stack spacing={2}>
                                    {(selectedDetail.tasks || []).map((task, index) => (
                                        <Paper
                                            key={task.id || index}
                                            elevation={0}
                                            sx={{
                                                p: 2.25,
                                                borderRadius: 3,
                                                border: "1px solid",
                                                borderColor:
                                                    selectedDetail.activeTaskId === task.id
                                                        ? alpha("#84cc16", 0.8)
                                                        : alpha("#cbd5e1", 0.9),
                                                bgcolor:
                                                    selectedDetail.activeTaskId === task.id
                                                        ? alpha("#b7ef4e", 0.18)
                                                        : alpha("#f8fafc", 0.92),
                                            }}
                                        >
                                            <Stack direction="row" spacing={2} alignItems="flex-start">
                                                <Box
                                                    sx={{
                                                        width: 34,
                                                        height: 34,
                                                        borderRadius: "50%",
                                                        bgcolor:
                                                            selectedDetail.activeTaskId === task.id
                                                                ? "#84cc16"
                                                                : "#e2e8f0",
                                                        color:
                                                            selectedDetail.activeTaskId === task.id
                                                                ? "#1f2937"
                                                                : "#475569",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontWeight: 800,
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {index + 1}
                                                </Box>
                                                <Box>
                                                    <Typography fontWeight={800}>{task.title}</Typography>
                                                    <Chip
                                                        label={task.type}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ mt: 0.75, mb: 1 }}
                                                    />
                                                    <Typography variant="body2" color="text.secondary">
                                                        {task.detail}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </Paper>
                                    ))}
                                </Stack>
                            </Paper>
                        </Box>
                    ) : null}
                </Stack>
            </Box>
        </ReactFlowProvider>
    );
};

function RoadmapNode({ data }) {
    return (
        <Box
            sx={{
                width: 216,
                minHeight: 96,
                px: 1.75,
                py: 1.45,
                borderRadius: 3,
                border: "1px solid",
                borderColor: data.selected ? "#84cc16" : data.borderColor,
                bgcolor: data.selected ? alpha("#b7ef4e", 0.18) : data.background,
                boxShadow: `0 14px 28px ${alpha("#0f172a", data.selected ? 0.12 : 0.08)}`,
                cursor: "pointer",
            }}
        >
            <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
            <Typography variant="overline" sx={{ color: data.accentText, fontWeight: 800, letterSpacing: "0.08em" }}>
                {data.label}
            </Typography>
            <Typography fontWeight={800} sx={{ color: data.titleColor, mt: 0.35, lineHeight: 1.3 }}>
                {data.title}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.65, color: data.bodyColor, lineHeight: 1.45 }}>
                {data.description}
            </Typography>
            <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
        </Box>
    );
}

function RadarChart({ attributes }) {
    const center = 110;
    const radius = 82;
    const points = attributes.map((attribute, index) => {
        const angle = (Math.PI * 2 * index) / attributes.length - Math.PI / 2;
        const scaledRadius = (radius * attribute.value) / 100;
        return {
            x: center + Math.cos(angle) * scaledRadius,
            y: center + Math.sin(angle) * scaledRadius,
            labelX: center + Math.cos(angle) * (radius + 24),
            labelY: center + Math.sin(angle) * (radius + 24),
            label: attribute.label,
        };
    });

    const polygonPoints = points.map((point) => `${point.x},${point.y}`).join(" ");

    return (
        <svg viewBox="0 0 220 220" width="100%" height="280">
            {[0.25, 0.5, 0.75, 1].map((ratio) => (
                <polygon
                    key={ratio}
                    points={attributes
                        .map((_, index) => {
                            const angle = (Math.PI * 2 * index) / attributes.length - Math.PI / 2;
                            return `${center + Math.cos(angle) * radius * ratio},${center + Math.sin(angle) * radius * ratio}`;
                        })
                        .join(" ")}
                    fill="none"
                    stroke="#dbe4ea"
                    strokeWidth="1"
                />
            ))}
            {attributes.map((attribute, index) => {
                const angle = (Math.PI * 2 * index) / attributes.length - Math.PI / 2;
                return (
                    <line
                        key={attribute.label}
                        x1={center}
                        y1={center}
                        x2={center + Math.cos(angle) * radius}
                        y2={center + Math.sin(angle) * radius}
                        stroke="#dbe4ea"
                        strokeWidth="1"
                    />
                );
            })}
            <polygon points={polygonPoints} fill="rgba(132, 204, 22, 0.22)" stroke="#84cc16" strokeWidth="2" />
            {points.map((point) => (
                <g key={point.label}>
                    <circle cx={point.x} cy={point.y} r="4" fill="#84cc16" />
                    <text
                        x={point.labelX}
                        y={point.labelY}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#475569"
                        fontWeight="700"
                    >
                        {point.label}
                    </text>
                </g>
            ))}
        </svg>
    );
}

function buildRoadmapTree(roadmap, profile) {
    const detailMap = {};
    const weekItems = roadmap.weeks || [];
    const todayItems = roadmap.today || [];
    const roadmapMeta = roadmap?.meta || {};
    const rootId = "roadmap-root";
    const baseX = 220;

    const nodes = [
        {
            id: rootId,
            type: "roadmap",
            position: { x: 420, y: 0 },
            data: {
                label: roadmapMeta.interviewReady ? "Ready" : "Target",
                title: roadmapMeta.title || profile.role || "Assessment Goal",
                description:
                    roadmapMeta.description ||
                    profile.freeText ||
                    "Your roadmap starts from the role you want to reach.",
                background: roadmapMeta.interviewReady ? "#ecfdf5" : "#f0fdf4",
                borderColor: roadmapMeta.interviewReady ? alpha("#10b981", 0.72) : alpha("#84cc16", 0.75),
                accentText: roadmapMeta.interviewReady ? "#047857" : "#4d7c0f",
                titleColor: roadmapMeta.interviewReady ? "#065f46" : "#14532d",
                bodyColor: "#4b5563",
            },
        },
    ];

    const edges = [];
    let initialSelectedId = rootId;

    weekItems.forEach((week, weekIndex) => {
        const weekId = `week-${week.id || weekIndex + 1}`;
        const x = baseX + weekIndex * 250;
        const y = 180;
        const weekTasks = week.tasks || [];

        nodes.push({
            id: weekId,
            type: "roadmap",
            position: { x, y },
            data: {
                label: week.title || `Week ${weekIndex + 1}`,
                title: week.focus || week.title,
                description: week.description || "Skill growth sprint",
                background: "#ffffff",
                borderColor: alpha("#cbd5e1", 0.95),
                accentText: "#0f766e",
                titleColor: "#0f172a",
                bodyColor: "#64748b",
            },
        });

        detailMap[weekId] = {
            title: week.focus || week.title,
            description: week.description,
            attributes: week.attributes || [],
            tasks: weekTasks,
            activeTaskId: weekTasks[0]?.id || null,
        };

        edges.push({
            id: `edge-root-${weekId}`,
            source: rootId,
            target: weekId,
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed, color: "#84cc16" },
            style: { stroke: "#84cc16", strokeWidth: 2.2 },
        });

        weekTasks.slice(0, 3).forEach((task, taskIndex) => {
            const taskId = `${weekId}-task-${taskIndex + 1}`;
            nodes.push({
                id: taskId,
                type: "roadmap",
                position: { x: x + (taskIndex - 1) * 138, y: 360 },
                data: {
                    label: task.type,
                    title: task.title,
                    description: task.detail,
                    background: "#f8fafc",
                    borderColor: alpha("#d6e0e6", 0.95),
                    accentText: "#475569",
                    titleColor: "#0f172a",
                    bodyColor: "#64748b",
                    compact: true,
                },
            });

            detailMap[taskId] = {
                title: task.title,
                description: task.detail,
                attributes: week.attributes || [],
                tasks: weekTasks,
                activeTaskId: task.id,
            };

            edges.push({
                id: `edge-${weekId}-${taskId}`,
                source: weekId,
                target: taskId,
                animated: taskIndex === 0,
                markerEnd: { type: MarkerType.ArrowClosed, color: "#38bdf8" },
                style: { stroke: taskIndex === 0 ? "#38bdf8" : "#94a3b8", strokeWidth: 2 },
            });
        });

        if (weekIndex === 0 && !roadmapMeta.interviewReady) {
            initialSelectedId = weekId;
        }
    });

    detailMap[rootId] = {
        title: roadmapMeta.title || profile.role || "Assessment Goal",
        description:
            roadmapMeta.description ||
            profile.freeText ||
            "Your roadmap starts here and branches into the skills you need most.",
        attributes: todayItems[0]?.attributes ||
            weekItems[0]?.attributes || [
                { label: "Knowledge", value: 52 },
                { label: "Execution", value: 48 },
                { label: "Speed", value: 45 },
                { label: "Communication", value: 54 },
                { label: "Confidence", value: 50 },
            ],
        tasks: todayItems.flatMap((task) => task.tasks || []),
        activeTaskId: todayItems[0]?.tasks?.[0]?.id || null,
    };

    return { nodes, edges, detailMap, initialSelectedId };
}

export default RoadmapView;
