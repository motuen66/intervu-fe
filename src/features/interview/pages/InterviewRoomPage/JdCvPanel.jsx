import { useState } from "react";
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Stack,
    Chip,
    Avatar,
} from "@mui/material";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import PersonIcon from "@mui/icons-material/Person";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockIcon from "@mui/icons-material/Lock";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import { ROLES } from "../../../../common/constants/common.js";
import EvaluationForm from "./EvaluationForm";

// Mock data for demo
const MOCK_JD = {
    title: "Senior Frontend Developer",
    company: "TechCorp Vietnam",
    location: "Ho Chi Minh City (Remote-friendly)",
    salaryRange: "$2,000 – $3,500 / month",
    requirements: [
        "3+ years React / Next.js experience",
        "Proficiency in TypeScript",
        "Experience with REST APIs and WebSocket",
        "Strong UI/UX sensibility",
    ],
    niceToHave: [
        "Experience with WebRTC",
        "Knowledge of code interview platforms",
    ],
    description:
        "We are looking for a skilled Frontend Developer to join our growing product team. You will work on building real-time collaboration features and polished user interfaces for our interview platform.",
};

const MOCK_CV = {
    name: "Nguyen Van A",
    title: "Frontend Developer",
    experience: "3 years",
    skills: ["React", "TypeScript", "Node.js", "TailwindCSS", "MongoDB"],
    education: "Bachelor's in Computer Science — HCMUT (2021)",
    summary:
        "Passionate frontend developer with experience building scalable SaaS products and real-time applications.",
};

export function JdCvPanel({ roomId, user, roomInfo }) {
    const [tab, setTab] = useState(0);

    return (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                    borderBottom: "1px solid #E5E7EB",
                    minHeight: 40,
                    flexShrink: 0,
                    "& .MuiTab-root": {
                        minWidth: "auto",
                        px: 1.5,
                        py: 0,
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        minHeight: 40,
                    },
                }}
            >
                <Tab label="Job Description" />
                <Tab label="Candidate CV" />
                <Tab label="Evaluate" />
            </Tabs>

            <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
                {/* Tab 0: Job Description */}
                {tab === 0 && <JobDescriptionTab />}

                {/* Tab 1: Candidate CV */}
                {tab === 1 && <CandidateCvTab />}

                {/* Tab 2: Evaluate */}
                {tab === 2 && <EvaluateTab roomId={roomId} user={user} />}
            </Box>
        </Box>
    );
}

function JobDescriptionTab() {
    const jd = MOCK_JD;

    return (
        <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827" }}>
                {jd.title}
            </Typography>
            <Typography variant="body2" sx={{ color: "#6B7280" }}>
                {jd.company}
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                    icon={<LocationOnIcon sx={{ fontSize: 14 }} />}
                    label={jd.location}
                    size="small"
                    sx={{ bgcolor: "#F0F4F8", fontWeight: 500 }}
                />
                <Chip
                    icon={<AttachMoneyIcon sx={{ fontSize: 14 }} />}
                    label={jd.salaryRange}
                    size="small"
                    sx={{ bgcolor: "#F0FFF4", color: "#166534", fontWeight: 500 }}
                />
            </Stack>

            <Typography variant="body2" sx={{ color: "#374151", lineHeight: 1.6 }}>
                {jd.description}
            </Typography>

            <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "#111827" }}>
                    Requirements
                </Typography>
                {jd.requirements.map((req, i) => (
                    <Stack key={i} direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 0.5 }}>
                        <CheckCircleIcon sx={{ fontSize: 16, color: "#10B981", mt: 0.25 }} />
                        <Typography variant="body2" sx={{ color: "#374151" }}>
                            {req}
                        </Typography>
                    </Stack>
                ))}
            </Box>

            <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "#111827" }}>
                    Nice to Have
                </Typography>
                {jd.niceToHave.map((item, i) => (
                    <Stack key={i} direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 0.5 }}>
                        <CheckCircleIcon sx={{ fontSize: 16, color: "#6B7280", mt: 0.25 }} />
                        <Typography variant="body2" sx={{ color: "#6B7280" }}>
                            {item}
                        </Typography>
                    </Stack>
                ))}
            </Box>
        </Stack>
    );
}

function CandidateCvTab() {
    const cv = MOCK_CV;

    return (
        <Stack spacing={2} alignItems="center">
            <Avatar sx={{ width: 64, height: 64, bgcolor: "#A3E635", color: "#166534", fontWeight: 700, fontSize: 24 }}>
                {cv.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)}
            </Avatar>

            <Box sx={{ textAlign: "center" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827" }}>
                    {cv.name}
                </Typography>
                <Typography variant="body2" sx={{ color: "#6B7280" }}>
                    {cv.title}
                </Typography>
            </Box>

            <Chip
                label={`${cv.experience} experience`}
                size="small"
                sx={{ bgcolor: "#EFF6FF", color: "#1D4ED8", fontWeight: 600 }}
            />

            <Box sx={{ width: "100%" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "#111827" }}>
                    Skills
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {cv.skills.map((skill) => (
                        <Chip
                            key={skill}
                            label={skill}
                            size="small"
                            sx={{ bgcolor: "#F0F4F8", fontWeight: 500, mb: 0.5 }}
                        />
                    ))}
                </Stack>
            </Box>

            <Box sx={{ width: "100%" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: "#111827" }}>
                    Education
                </Typography>
                <Typography variant="body2" sx={{ color: "#374151" }}>
                    {cv.education}
                </Typography>
            </Box>

            <Box sx={{ width: "100%" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: "#111827" }}>
                    Summary
                </Typography>
                <Typography variant="body2" sx={{ color: "#374151", lineHeight: 1.6 }}>
                    {cv.summary}
                </Typography>
            </Box>
        </Stack>
    );
}

function EvaluateTab({ roomId, user }) {
    if (user?.role === ROLES.CANDIDATE) {
        return (
            <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ py: 6 }}>
                <LockIcon sx={{ fontSize: 48, color: "#9CA3AF" }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827" }}>
                    Evaluation Panel
                </Typography>
                <Typography variant="body2" sx={{ color: "#6B7280", textAlign: "center" }}>
                    This panel is only available to the interviewer.
                </Typography>
            </Stack>
        );
    }

    return <EvaluationForm roomId={roomId} />;
}
