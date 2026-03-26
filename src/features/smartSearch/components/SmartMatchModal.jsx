import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Dialog from "@mui/material/Dialog";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Avatar from "@mui/material/Avatar";
import Paper from "@mui/material/Paper";
import LinearProgress from "@mui/material/LinearProgress";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import { PrimaryButton, SecondaryButton } from "../../../common/components/buttons";
import {
    BrainCircuit,
    X,
    Sparkles,
    Zap,
    ArrowRight,
    FileText,
    Target,
    CheckCircle2,
    RefreshCw,
    Upload,
    Cpu,
} from "lucide-react";
import { searchCoaches, clearResults } from "../store/smartSearchSlice";

// ── Constants ──
const PROCESSING_STEPS = [
    "Embedding your query…",
    "Scanning neural database…",
    "Analyzing career trajectory…",
    "Ranking coach compatibility…",
    "Generating AI insights…",
];

const springTransition = { type: "spring", damping: 25, stiffness: 200 };
const RAIN_CHARS = "01";

// ── Matrix Digital Rain Column ──
function RainColumn({ delay, duration }) {
    const [chars, setChars] = useState("");

    useEffect(() => {
        const interval = setInterval(() => {
            let s = "";
            for (let i = 0; i < 20; i++) {
                s += RAIN_CHARS.charAt(Math.floor(Math.random() * RAIN_CHARS.length));
            }
            setChars(s);
        }, 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <Box
            component={motion.div}
            initial={{ y: -400 }}
            animate={{ y: 800 }}
            transition={{ duration, repeat: Infinity, ease: "linear", delay }}
            sx={{
                display: "flex",
                flexDirection: "column",
                fontFamily: "monospace",
                fontSize: "13px",
                lineHeight: 1,
                whiteSpace: "pre",
                userSelect: "none",
                filter: "drop-shadow(0 0 3px var(--mui-palette-secondary-dark))",
            }}
        >
            {chars.split("").map((char, i) => {
                const isHead = i === chars.length - 1;
                return (
                    <Box
                        component="span"
                        key={i}
                        sx={{
                            opacity: isHead ? 1 : (i / chars.length) * 0.7,
                            color: isHead
                                ? "var(--mui-palette-primary-main)"
                                : "var(--mui-palette-primary-light)",
                            fontWeight: isHead ? 900 : 600,
                            textShadow: isHead
                                ? "0 0 6px var(--mui-palette-secondary-dark), 0 0 14px var(--mui-palette-secondary-dark)"
                                : "0 0 5px var(--mui-palette-secondary-main)",
                        }}
                    >
                        {char}
                    </Box>
                );
            })}
        </Box>
    );
}

// ── Animated Sparkles Icon (pulses in sidebar) ──
function PulsingSparkles() {
    return (
        <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            style={{ display: "inline-flex" }}
        >
            <Sparkles size={14} color="var(--mui-palette-secondary-main)" />
        </motion.div>
    );
}

// ── Step Sidebar ──
function StepSidebar({ currentStep }) {
    const steps = [
        { label: "Define Goals", icon: Target },
        { label: "AI Analysis", icon: Cpu },
        { label: "Matched Selection", icon: CheckCircle2 },
    ];

    return (
        <Box
            sx={{
                width: 280,
                minHeight: "100%",
                background: "linear-gradient(180deg, var(--mui-palette-primary-main) 0%, var(--mui-palette-primary-light) 100%)",
                borderRadius: "20px 0 0 20px",
                p: 3.5,
                display: "flex",
                flexDirection: "column",
                gap: 2,
            }}
        >
            {/* Brand Badge */}
            <Box
                sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.75,
                    bgcolor: "rgba(var(--mui-palette-secondary-mainChannel) / 0.15)",
                    border: "1px solid rgba(var(--mui-palette-secondary-mainChannel) / 0.3)",
                    borderRadius: "20px",
                    px: 1.5,
                    py: 0.5,
                    width: "fit-content",
                    mb: 1,
                }}
            >
                <PulsingSparkles />
                <Typography
                    variant="overline"
                    sx={{ color: "secondary.main", fontSize: "0.625rem", letterSpacing: "0.12em" }}
                >
                    Neural Match Engine v2.0
                </Typography>
            </Box>

            {/* Title with animated glow on "Coach" */}
            <Box>
                <Typography variant="h4" sx={{ color: "primary.contrastText", fontWeight: 800, lineHeight: 1.2 }}>
                    Smart AI{" "}
                </Typography>
                <motion.div
                    animate={{
                        textShadow: [
                            "0 0 8px rgba(217, 249, 157, 0.3)",
                            "0 0 20px rgba(217, 249, 157, 0.6)",
                            "0 0 8px rgba(217, 249, 157, 0.3)",
                        ],
                    }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    style={{ display: "inline-block" }}
                >
                    <Typography
                        variant="h3"
                        component="span"
                        sx={{
                            color: "secondary.main",
                            fontWeight: 800,
                            lineHeight: 1.2,
                            display: "block",
                        }}
                    >
                        Coach Matching
                    </Typography>
                </motion.div>
            </Box>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.55)", mb: 2, lineHeight: 1.6 }}>
                Our advanced neural network analyzes your career DNA to find the perfect mentor.
            </Typography>

            {/* Step Indicators */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: "auto" }}>
                {steps.map((step, i) => {
                    const StepIcon = step.icon;
                    const isActive = i === currentStep;
                    const isCompleted = i < currentStep;

                    return (
                        <motion.div
                            key={i}
                            animate={isActive ? { x: [0, 4, 0] } : {}}
                            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.5,
                                    py: 1.25,
                                    px: 1.5,
                                    borderRadius: "12px",
                                    bgcolor: isActive ? "action.selected" : "transparent",
                                    transition: "all 0.4s ease",
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: "12px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        bgcolor: isActive
                                            ? "secondary.main"
                                            : isCompleted
                                                ? "action.selected"
                                                : "rgba(255,255,255,0.08)",
                                        transition: "all 0.4s ease",
                                        boxShadow: isActive
                                            ? "0 0 16px rgba(217, 249, 157, 0.4)"
                                            : "none",
                                    }}
                                >
                                    <StepIcon
                                        size={20}
                                        color={isActive ? "var(--mui-palette-primary-main)" : isCompleted ? "var(--mui-palette-secondary-main)" : "rgba(255,255,255,0.35)"}
                                    />
                                </Box>
                                <Box>
                                    <Typography
                                        variant="overline"
                                        sx={{
                                            color: isActive ? "secondary.main" : "rgba(255,255,255,0.35)",
                                            fontSize: "0.6rem",
                                        }}
                                    >
                                        Step {String(i + 1).padStart(2, "0")}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: isActive || isCompleted ? "primary.contrastText" : "rgba(255,255,255,0.35)",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {step.label}
                                    </Typography>
                                </Box>
                            </Box>
                        </motion.div>
                    );
                })}
            </Box>
        </Box>
    );
}

// ── Step 1: Input ──
function StepInput({ query, setQuery, onSubmit, loading }) {
    return (
        <motion.div
            key="step-input"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={springTransition}
            style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
                Step 1: Input Details
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
                Provide context for the best precision match.
            </Typography>

            {/* Query Input */}
            <Typography
                variant="overline"
                sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1 }}
            >
                <Sparkles size={14} color="var(--mui-palette-secondary-dark)" /> What&apos;s your primary goal?
            </Typography>
            <TextField
                multiline
                minRows={4}
                maxRows={6}
                placeholder="Tell us about your goal in natural language (e.g., 'I want to practice system design for a Senior role at Meta')."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                fullWidth
                sx={{ mb: 3 }}
            />

            {/* CV / JD Placeholders */}
            <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                {[
                    { label: "YOUR RESUME", sub: "PDF, DOCX up to 10MB", icon: FileText },
                    { label: "JOB DESCRIPTION", sub: "Paste or Upload File", icon: Upload },
                ].map((item) => (
                    <Box
                        key={item.label}
                        sx={{
                            flex: 1,
                            border: "2px dashed",
                            borderColor: "divider",
                            borderRadius: "12px",
                            p: 3,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 1,
                            opacity: 0.45,
                            cursor: "not-allowed",
                        }}
                    >
                        <Typography
                            variant="overline"
                            sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                        >
                            <Sparkles size={12} color="var(--mui-palette-secondary-main)" /> {item.label}
                        </Typography>
                        <item.icon size={28} color="var(--mui-palette-text-disabled)" />
                        <Typography variant="caption" sx={{ color: "text.disabled" }}>
                            {item.sub}
                        </Typography>
                        <Chip
                            label="Coming soon"
                            size="small"
                            sx={{ fontSize: "0.625rem", height: 20 }}
                        />
                    </Box>
                ))}
            </Box>

            {/* Submit */}
            <Box sx={{ mt: "auto", display: "flex", justifyContent: "flex-end" }}>
                <PrimaryButton
                    disabled={!query.trim() || loading}
                    loading={loading}
                    onClick={onSubmit}
                    sx={(theme) => ({
                        background: query.trim()
                            ? `linear-gradient(135deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.secondary.main} 100%)`
                            : undefined,
                        color: query.trim() ? theme.palette.primary.main : undefined,
                        px: 4,
                        py: 1.5,
                        fontSize: "0.9375rem",
                        "&:hover": query.trim()
                            ? {
                                boxShadow: "0 0 24px rgba(217, 249, 157, 0.5)",
                            }
                            : {},
                    })}
                >
                    <Zap size={18} style={{ marginRight: 6 }} />
                    Run Neural Match
                </PrimaryButton>
            </Box>
        </motion.div>
    );
}

// ── Step 2: Processing ──
function StepProcessing() {
    const [textIndex, setTextIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const textTimer = setInterval(() => {
            setTextIndex((prev) => (prev + 1) % PROCESSING_STEPS.length);
        }, 2200);
        const progressTimer = setInterval(() => {
            setProgress((prev) => Math.min(prev + 1, 95));
        }, 120);
        return () => {
            clearInterval(textTimer);
            clearInterval(progressTimer);
        };
    }, []);

    return (
        <motion.div
            key="step-processing"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={springTransition}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Matrix Digital Rain background */}
            <Box
                sx={{
                    position: "absolute",
                    inset: 0,
                    overflow: "hidden",
                    pointerEvents: "none",
                    display: "flex",
                    justifyContent: "space-around",
                    opacity: 0.25,
                }}
            >
                {[...Array(18)].map((_, i) => (
                    <RainColumn
                        key={i}
                        delay={Math.random() * 3}
                        duration={4 + Math.random() * 5}
                    />
                ))}
            </Box>

            {/* Brain icon with LED underglow */}
            <Box sx={{ position: "relative", mb: 5 }}>
                {/* LED underglow — sits beneath the icon */}
                <Box
                    sx={{
                        position: "absolute",
                        bottom: -14,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 100,
                        height: 24,
                        borderRadius: "50%",
                        background: "radial-gradient(ellipse at center, rgba(190, 242, 100, 0.45) 0%, rgba(217, 249, 157, 0.18) 40%, transparent 70%)",
                        filter: "blur(8px)",
                        animation: "ledPulse 2s ease-in-out infinite",
                        "@keyframes ledPulse": {
                            "0%, 100%": { opacity: 0.5, transform: "translateX(-50%) scaleX(1)" },
                            "50%": { opacity: 1, transform: "translateX(-50%) scaleX(1.15)" },
                        },
                    }}
                />

                {/* Outer pulse ring */}
                <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.25, 0, 0.25] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: 120,
                        height: 120,
                        marginTop: -60,
                        marginLeft: -60,
                        borderRadius: "28px",
                        border: "2px solid rgba(217, 249, 157, 0.3)",
                    }}
                />

                {/* Brain Icon — smooth pulse */}
                <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                >
                    <Box
                        sx={{
                            width: 88,
                            height: 88,
                            borderRadius: "22px",
                            bgcolor: "primary.main",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow:
                                "0 0 30px rgba(217, 249, 157, 0.25), 0 0 60px rgba(217, 249, 157, 0.12), inset 0 0 20px rgba(217, 249, 157, 0.05)",
                        }}
                    >
                        <BrainCircuit size={44} color="var(--mui-palette-secondary-main)" />
                    </Box>
                </motion.div>
            </Box>

            {/* Cycling Text */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={textIndex}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            color: "text.disabled",
                            fontWeight: 600,
                            textAlign: "center",
                            mb: 5,
                        }}
                    >
                        {PROCESSING_STEPS[textIndex]}
                    </Typography>
                </motion.div>
            </AnimatePresence>

            {/* Progress Bar */}
            <Box sx={{ width: "65%", maxWidth: 360 }}>
                <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: "action.hover",
                        "& .MuiLinearProgress-bar": {
                            borderRadius: 3,
                            background: "linear-gradient(90deg, var(--mui-palette-secondary-dark), var(--mui-palette-secondary-main), var(--mui-palette-secondary-dark))",
                            backgroundSize: "200% 100%",
                            animation: "shimmer 1.5s ease-in-out infinite",
                            "@keyframes shimmer": {
                                "0%": { backgroundPosition: "200% 0" },
                                "100%": { backgroundPosition: "-200% 0" },
                            },
                        },
                    }}
                />
                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1.5 }}>
                    <Typography
                        variant="caption"
                        sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                        <Cpu size={12} /> Processing data
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                        {progress}%
                    </Typography>
                </Box>
            </Box>
        </motion.div>
    );
}

// ── Step 3: Results ──
function StepResults({ results, onRefine, onClose }) {
    const navigate = useNavigate();

    const handleBookNow = (slugProfileUrl) => {
        onClose();
        if (slugProfileUrl) {
            navigate(`/profile/${slugProfileUrl}`);
        }
    };

    const topResults = results.slice(0, 3);

    return (
        <motion.div
            key="step-results"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={springTransition}
            style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}
        >
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2.5 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                        Matched Selection
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        AI has identified the top experts for your profile.
                    </Typography>
                </Box>
                <SecondaryButton onClick={onRefine} sx={{ gap: 0.75, flexShrink: 0 }}>
                    <RefreshCw size={15} /> Refine
                </SecondaryButton>
            </Box>

            <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 0.5, pb: 0.5 }}>

            {/* Coach Cards */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {topResults.map((result, i) => {
                    const coach = result.coach || {};
                    const user = coach.user || {};
                    const displayName = user.fullName || user.email?.split("@")[0] || "Coach";
                    const profilePicture = user.profilePicture;
                    const slugProfileUrl = user.slugProfileUrl;
                    const companies = coach.companies || [];
                    const skills = coach.skills || [];
                    const bio = coach.bio || "";
                    const matchPercent = Math.round((result.rerankScore ?? result.matchScore) * 100);
                    const reasoning = result.reasoning;

                    return (
                        <motion.div
                            key={result.coachId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ ...springTransition, delay: i * 0.1 }}
                            style={{ borderRadius: "10px" }}
                        >
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    borderRadius: "10px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 1,
                                    transition: "all 0.2s ease",
                                    "&:hover": {
                                        borderColor: "primary.main",
                                        boxShadow: "0 4px 16px rgba(15,23,42,0.08)",
                                    },
                                }}
                            >
                                {/* Top row: avatar + info + button */}
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                    <Avatar
                                        src={profilePicture || ""}
                                        alt={displayName}
                                        sx={{
                                            width: 48,
                                            height: 48,
                                            flexShrink: 0,
                                            bgcolor: profilePicture ? "transparent" : "secondary.main",
                                            color: "primary.main",
                                            fontWeight: 700,
                                            fontSize: "1.1rem",
                                        }}
                                    >
                                        {!profilePicture ? displayName.charAt(0).toUpperCase() : null}
                                    </Avatar>

                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                            <Typography variant="body1" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
                                                {displayName}
                                            </Typography>
                                            <Chip
                                                label={`${matchPercent}%`}
                                                size="small"
                                                sx={{
                                                    height: 20,
                                                    fontSize: "0.6rem",
                                                    fontWeight: 800,
                                                    bgcolor: "primary.main",
                                                    color: "secondary.main",
                                                    border: "none",
                                                    minWidth: 38,
                                                }}
                                            />
                                            <Chip
                                                label="TOP MATCH"
                                                size="small"
                                                sx={{
                                                    height: 20,
                                                    fontSize: "0.55rem",
                                                    fontWeight: 800,
                                                    bgcolor: "secondary.main",
                                                    color: "primary.main",
                                                    border: "none",
                                                }}
                                            />
                                        </Box>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: "text.secondary",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                                fontWeight: 600,
                                            }}
                                        >
                                            {companies.length > 0
                                                ? companies.map((c) => c.name).join(" · ")
                                                : "Interview Coach"}
                                        </Typography>
                                    </Box>

                                    {/* Book Now */}
                                    <PrimaryButton
                                        onClick={() => handleBookNow(slugProfileUrl)}
                                        sx={{ whiteSpace: "nowrap", gap: 0.75, flexShrink: 0 }}
                                    >
                                        Book Now <ArrowRight size={16} />
                                    </PrimaryButton>
                                </Box>

                                {/* Skills */}
                                {skills.length > 0 && (
                                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                                        {skills.slice(0, 5).map((skill, idx) => (
                                            <Chip
                                                key={idx}
                                                label={typeof skill === "string" ? skill : skill.name}
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontSize: "0.65rem", height: 22 }}
                                            />
                                        ))}
                                        {skills.length > 5 && (
                                            <Chip label={`+${skills.length - 5}`} size="small" sx={{ fontSize: "0.65rem", height: 22 }} />
                                        )}
                                    </Box>
                                )}

                                {/* AI Reasoning */}
                                {reasoning && (
                                    <Box
                                        sx={{
                                            borderLeft: "3px solid",
                                            borderColor: "secondary.dark",
                                            bgcolor: "action.selected",
                                            borderRadius: "0 6px 6px 0",
                                            pl: 1.5,
                                            pr: 1,
                                            py: 0.75,
                                        }}
                                    >
                                        <Typography
                                            variant="overline"
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 0.5,
                                                color: "text.secondary",
                                                mb: 0.25,
                                                fontSize: "0.55rem",
                                            }}
                                        >
                                            <BrainCircuit size={12} /> AI Analysis
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic" }}>
                                            &ldquo;{reasoning}&rdquo;
                                        </Typography>
                                    </Box>
                                )}
                            </Paper>
                        </motion.div>
                    );
                })}
            </Box>

            {topResults.length === 0 && (
                <Box sx={{ textAlign: "center", py: 6, color: "text.disabled" }}>
                    <BrainCircuit size={48} strokeWidth={1.5} style={{ marginBottom: 12, opacity: 0.4 }} />
                    <Typography>No matches found. Try refining your query.</Typography>
                </Box>
            )}
            </Box>{/* end scrollable */}
        </motion.div>
    );
}



// ── Main Modal ──
export default function SmartMatchModal({ open, onClose }) {
    const dispatch = useDispatch();
    const { results, loading, error } = useSelector((state) => state.smartSearch);
    const [query, setQuery] = useState("");
    const [step, setStep] = useState(0); // 0=input, 1=processing, 2=results

    const handleSubmit = useCallback(() => {
        if (!query.trim()) return;
        setStep(1);
        dispatch(searchCoaches(query.trim()));
    }, [dispatch, query]);

    // When results arrive → go to step 2
    useEffect(() => {
        if (step === 1 && !loading && results.length > 0) {
            const timer = setTimeout(() => setStep(2), 600);
            return () => clearTimeout(timer);
        }
        if (step === 1 && !loading && error) {
            setStep(0);
        }
    }, [step, loading, results, error]);

    const handleRefine = () => {
        dispatch(clearResults());
        setStep(0);
    };

    const handleClose = () => {
        dispatch(clearResults());
        setQuery("");
        setStep(0);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth={false}
            PaperProps={{
                sx: {
                    borderRadius: "20px",
                    overflow: "hidden",
                    width: "min(1060px, 94vw)",
                    height: "min(680px, 88vh)",
                    display: "flex",
                    flexDirection: "row",
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                    boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
                },
            }}
        >
            {/* Left Sidebar */}
            <StepSidebar currentStep={step} />

            {/* Right Content Area */}
            <Box
                sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                }}
            >
                {/* Fixed top bar with close button */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        px: 2,
                        pt: 1.5,
                        pb: 0,
                        flexShrink: 0,
                    }}
                >
                    <IconButton
                        onClick={handleClose}
                        sx={{ color: "text.secondary" }}
                    >
                        <X size={20} />
                    </IconButton>
                </Box>

                {/* Step Content — takes remaining space */}
                <Box
                    sx={{
                        flex: 1,
                        minHeight: 0,
                        px: 4,
                        pb: 4,
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <AnimatePresence mode="wait">
                        {step === 0 && (
                            <StepInput
                                query={query}
                                setQuery={setQuery}
                                onSubmit={handleSubmit}
                                loading={loading}
                            />
                        )}
                        {step === 1 && <StepProcessing />}
                        {step === 2 && (
                            <StepResults
                                results={results}
                                onRefine={handleRefine}
                                onClose={handleClose}
                            />
                        )}
                    </AnimatePresence>
                </Box>
            </Box>
        </Dialog>
    );
}
