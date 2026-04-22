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
import Autocomplete from "@mui/material/Autocomplete";
import Badge from "@mui/material/Badge";
import Divider from "@mui/material/Divider";
import BaseCard from "../../../common/components/cards/BaseCard";
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
    Check,
} from "lucide-react";
import { searchCoaches, clearResults, extractDocument, updateExtractedData } from "../store/smartSearchSlice";

// ── Constants ──
const PROCESSING_STEPS = [
    "Embedding your query…",
    "Scanning neural database…",
    "Analyzing career trajectory…",
    "Ranking coach compatibility…",
    "Generating AI insights…",
];

const EXTRACTION_STEPS = [
    "Initializing neural OCR…",
    "Scanning document structure…",
    "Extracting text layers…",
    "Normalizing career entities…",
    "Mapping profile metadata…",
];

const springTransition = { type: "spring", damping: 25, stiffness: 200 };
const RAIN_CHARS = "01";

const getMeaningfulPlaceholder = (key, isLongText) => {
    const k = key.toLowerCase();
    if (k.includes("title") || k.includes("role") || k.includes("position") || k.includes("job")) return "E.g. Senior Software Engineer";
    if (k.includes("company") || k.includes("organization") || k.includes("employer")) return "E.g. Google, Inc.";
    if (k.includes("date") || k.includes("year") || k.includes("time") || k.includes("duration") || k.includes("period")) return "E.g. Sep 2020 - Present";
    if (k.includes("location") || k.includes("city") || k.includes("address")) return "E.g. San Francisco, CA";
    if (k.includes("degree") || k.includes("major") || k.includes("certification")) return "E.g. B.S. in Computer Science";
    if (k.includes("school") || k.includes("university") || k.includes("institution")) return "E.g. Stanford University";
    if (k.includes("skill") || k.includes("tech") || k.includes("language")) return "Type and press Enter...";
    if (k.includes("email")) return "E.g. john.doe@example.com";
    if (k.includes("phone")) return "E.g. +1 234 567 890";
    if (isLongText || k.includes("description") || k.includes("summary") || k.includes("responsibilities") || k.includes("achievement")) {
        return "Briefly describe the key details, responsibilities and achievements...";
    }
    return `Enter ${key.replace(/_/g, " ")}...`;
};

// ── Matrix Digital Rain Column ──
function RainColumn({ delay, duration, color = "var(--mui-palette-primary-light)" }) {
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
                                : color,
                            fontWeight: isHead ? 900 : 600,
                            textShadow: isHead
                                ? "0 0 6px var(--mui-palette-secondary-dark), 0 0 14px var(--mui-palette-secondary-dark)"
                                : `0 0 5px ${color}`,
                        }}
                    >
                        {char}
                    </Box>
                );
            })}
        </Box>
    );
}

// ── Scanning Laser Effect ──
function ScanningEffect() {
    return (
        <Box sx={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: "inherit", pointerEvents: "none" }}>
            {/* Grid Pattern */}
            <Box
                sx={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0.15,
                    backgroundImage: `
                        linear-gradient(to right, var(--mui-palette-secondary-main) 1px, transparent 1px),
                        linear-gradient(to bottom, var(--mui-palette-secondary-main) 1px, transparent 1px)
                    `,
                    backgroundSize: "20px 20px",
                }}
            />
            
            {/* Moving Laser Line */}
            <motion.div
                animate={{ top: ["-10%", "110%", "-10%"] }}
                transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    height: "1px",
                    background: "rgba(190, 242, 100, 0.6)",
                    boxShadow: "0 0 15px 1px rgba(190, 242, 100, 0.4)",
                    zIndex: 2,
                }}
            >
                {/* Gradient Trail following the laser */}
                <Box sx={{
                    position: "absolute",
                    bottom: "100%", // Kéo ngược lên trên thanh laser
                    left: 0,
                    right: 0,
                    height: "100px", // Bóng đổ vuốt ngược lên dài và mờ ảo
                    background: "linear-gradient(to top, rgba(190, 242, 100, 0.12), transparent)",
                }} />
            </motion.div>
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
function StepSidebar({ activeSidebarIndex, isTextOnly }) {
    const allSteps = [
        { label: "Define Goals", icon: Target },
        { label: "Verify Profile", icon: FileText, hideOnText: true },
        { label: "AI Analysis", icon: Cpu },
        { label: "Matched Selection", icon: CheckCircle2 },
    ];

    const steps = allSteps.filter((s) => !(isTextOnly && s.hideOnText));

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
                    bgcolor: "rgba(190, 242, 100, 0.15)", // Brand Lime Tint
                    border: "1px solid rgba(190, 242, 100, 0.3)",
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
                    sx={{ color: "secondary.main", fontSize: "0.625rem", letterSpacing: "0.12em", fontWeight: 800 }} // Brand Lime
                >
                    NEURAL MATCH ENGINE v2.0
                </Typography>
            </Box>

            {/* Title with animated glow */}
            <Box>
                <Typography variant="h4" sx={{ color: "primary.contrastText", fontWeight: 800, lineHeight: 1.2 }}>
                    Smart AI{" "}
                </Typography>
                <motion.div
                    animate={{
                        textShadow: [
                            "0 0 8px rgba(190, 242, 100, 0.2)",
                            "0 0 20px rgba(190, 242, 100, 0.45)", // Soft lime glow
                            "0 0 8px rgba(190, 242, 100, 0.2)",
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
                    const isActive = i === activeSidebarIndex;
                    const isCompleted = i < activeSidebarIndex;

                    return (
                        <motion.div
                            key={step.label}
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
                                    bgcolor: isActive ? "rgba(190, 242, 100, 0.1)" : "transparent",
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
                                                ? "transparent"
                                                : "rgba(255,255,255,0.08)",
                                        border: isCompleted ? "1px solid" : "none",
                                        borderColor: isCompleted ? "secondary.dark" : "transparent",
                                        transition: "all 0.4s ease",
                                        boxShadow: isActive
                                            ? "0 0 16px rgba(190, 242, 100, 0.4)"
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
                                            fontWeight: 700,
                                        }}
                                    >
                                        Step {String(i + 1).padStart(2, "0")}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: isActive || isCompleted ? "primary.contrastText" : "rgba(255,255,255,0.35)",
                                            fontWeight: isActive ? 800 : 700,
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
function StepInput({ query, setQuery, cvFile, setCvFile, jdFile, setJdFile, onSubmit, extracting, error }) {
    const handleFileChange = (e, type) => {
        if (e.target.files && e.target.files.length > 0) {
            if (type === "cv") setCvFile(e.target.files[0]);
            if (type === "jd") setJdFile(e.target.files[0]);
        }
    };

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
                Provide text context and optionally upload a CV or JD for precision matching.
            </Typography>

            <Typography variant="overline" sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1 }}>
                <Sparkles size={14} color="var(--mui-palette-secondary-dark)" /> What's your primary goal?
            </Typography>
            <TextField
                multiline
                minRows={3}
                maxRows={4}
                placeholder="E.g., 'I want to practice system design for a Senior role at Meta'"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                fullWidth
                sx={{ mb: 3 }}
            />

            <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                {[
                    { label: "YOUR RESUME", sub: "PDF up to 10MB", icon: FileText, type: "cv", currentFile: cvFile },
                    { label: "JOB DESCRIPTION", sub: "PDF up to 10MB", icon: Upload, type: "jd", currentFile: jdFile },
                ].map((item) => {
                    const isSelected = !!item.currentFile;
                    return (
                        <Box
                            key={item.label}
                            component="label"
                            sx={{
                                flex: 1,
                                border: "2px dashed",
                                borderColor: isSelected ? "primary.main" : "divider",
                                bgcolor: isSelected ? "rgba(15, 23, 42, 0.04)" : "transparent",
                                borderRadius: "12px",
                                p: 3,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 1,
                                cursor: "pointer",
                                position: "relative",
                                transition: "all 0.2s ease",
                                "&:hover": { borderColor: "primary.main", bgcolor: "rgba(15, 23, 42, 0.03)" }
                            }}
                        >
                            {isSelected && (
                                <IconButton
                                    size="small"
                                    aria-label={`Remove ${item.type} file`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (item.type === "cv") setCvFile(null);
                                        if (item.type === "jd") setJdFile(null);
                                    }}
                                    sx={{
                                        position: "absolute",
                                        top: 10,
                                        right: 10,
                                        width: 30,
                                        height: 30,
                                        bgcolor: "background.paper",
                                        border: "1px solid",
                                        borderColor: "divider",
                                        color: "text.secondary",
                                        "&:hover": {
                                            bgcolor: "grey.100",
                                            color: "text.primary",
                                        },
                                    }}
                                >
                                    <X size={16} />
                                </IconButton>
                            )}

                            <input
                                type="file"
                                accept=".pdf"
                                hidden
                                onClick={(e) => { e.target.value = null; }} // Force trigger onChange even for same file
                                onChange={(e) => handleFileChange(e, item.type)}
                            />
                            <Typography variant="overline" sx={{ display: "flex", alignItems: "center", gap: 0.5, color: isSelected ? "primary.main" : "text.primary", fontWeight: 800 }}>
                                {isSelected && <Check size={14} />} {item.label}
                            </Typography>
                            <Box
                                sx={{
                                    width: 72,
                                    height: 72,
                                    borderRadius: "20px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    bgcolor: isSelected ? "primary.main" : "rgba(15, 23, 42, 0.06)",
                                }}
                            >
                                <item.icon size={32} color={isSelected ? "var(--mui-palette-secondary-main)" : "var(--mui-palette-primary-main)"} />
                            </Box>
                            <Typography variant="caption" sx={{ color: isSelected ? "text.primary" : "text.disabled", textAlign: "center", fontWeight: isSelected ? 700 : 500, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {isSelected ? item.currentFile.name : item.sub}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>

            <Box sx={{ mt: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
                <Box>
                    <Typography variant="caption" sx={{ color: "text.disabled", display: 'block' }}>
                        {(cvFile || jdFile) ? "File(s) attached. Step 2 will verify data." : "No file attached. Skipping Step 2."}
                    </Typography>
                    {error && (
                        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5, maxWidth: 350, lineHeight: 1.2 }}>
                            {typeof error === 'string' ? error : "An error occurred during extraction."}
                        </Typography>
                    )}
                </Box>
                <PrimaryButton
                    disabled={(!query.trim() && !cvFile && !jdFile) || extracting}
                    loading={extracting}
                    onClick={onSubmit}
                    sx={(theme) => ({
                        background: query.trim() || cvFile || jdFile
                            ? `linear-gradient(135deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.secondary.main} 100%)`
                            : undefined,
                        color: query.trim() || cvFile || jdFile ? theme.palette.primary.main : undefined,
                        px: 4, py: 1.5, fontSize: "0.9375rem",
                    })}
                >
                    <Zap size={18} style={{ marginRight: 6 }} />
                    {(cvFile || jdFile) ? "Extract Document(s)" : "Run Neural Match"}
                </PrimaryButton>
            </Box>
        </motion.div>
    );
}

// ── Step 1.5: Extraction (Loading OCR) ──
function StepExtraction() {
    const [progress, setProgress] = useState(0);
    const [textIndex, setTextIndex] = useState(0);

    useEffect(() => {
        const textTimer = setInterval(() => {
            setTextIndex((prev) => (prev + 1) % EXTRACTION_STEPS.length);
        }, 2000);
        const progressTimer = setInterval(() => {
            setProgress((prev) => Math.min(prev + (Math.random() * 5), 98));
        }, 300);
        return () => {
            clearInterval(textTimer);
            clearInterval(progressTimer);
        };
    }, []);

    return (
        <motion.div
            key="step-extraction"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={springTransition}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                isolation: "isolate",
            }}
        >
            {/* Matrix Digital Rain background (BEHIND) */}
            <Box
                sx={{
                    position: "absolute",
                    inset: 0,
                    overflow: "hidden",
                    pointerEvents: "none",
                    display: "flex",
                    justifyContent: "space-between",
                    opacity: 0.25,
                    zIndex: 0,
                }}
            >
                <Box sx={{ width: "28%", display: "flex", justifyContent: "space-around" }}>
                    {[...Array(7)].map((_, i) => (
                        <RainColumn
                            key={`left-${i}`}
                            delay={Math.random() * 3}
                            duration={4 + Math.random() * 5}
                        />
                    ))}
                </Box>

                <Box sx={{ width: "28%", display: "flex", justifyContent: "space-around" }}>
                    {[...Array(7)].map((_, i) => (
                        <RainColumn
                            key={`right-${i}`}
                            delay={Math.random() * 3}
                            duration={4 + Math.random() * 5}
                        />
                    ))}
                </Box>
            </Box>

            {/* Foreground Content Container - Explicitly above the matrix */}
            <Box
                sx={{
                    position: "relative",
                    zIndex: 1,
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center"
                }}
            >
                {/* Document Scanner Area */}
                <Box sx={{ position: "relative", mb: 5 }}>
                    {/* Underglow glow like Reasoning */}
                    <Box
                        sx={{
                            position: "absolute",
                            bottom: -10,
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: 120,
                            height: 20,
                            borderRadius: "50%",
                            background: "radial-gradient(ellipse at center, rgba(190, 242, 100, 0.35) 0%, transparent 70%)",
                            filter: "blur(10px)",
                        }}
                    />

                    <Box
                        sx={{
                            width: 140,
                            height: 180,
                            bgcolor: "rgba(15, 23, 42, 0.4)", // Mờ và xám
                            borderRadius: "24px",
                            border: "1px solid rgba(190, 242, 100, 0.15)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                            overflow: "hidden",
                            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.3)",
                        }}
                    >
                        <ScanningEffect />
                        
                        {/* File Icon - No Background, just floating inside */}
                        <FileText 
                            size={64} 
                            color="var(--mui-palette-secondary-main)" 
                            strokeWidth={1}
                            style={{ position: 'relative', zIndex: 1, filter: 'drop-shadow(0 0 10px rgba(190, 242, 100, 0.3))', opacity: 0.8 }}
                        />
                    </Box>
                </Box>

                {/* Cycling Status Text like Reasoning */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={textIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Typography
                            variant="h6"
                            sx={{
                                color: "text.primary",
                                fontWeight: 700,
                                textAlign: "center",
                                mb: 1,
                            }}
                        >
                            {EXTRACTION_STEPS[textIndex]}
                        </Typography>
                    </motion.div>
                </AnimatePresence>
                
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 5, textAlign: 'center' }}>
                    Our neural network is parsing your career DNA...
                </Typography>

                {/* Progress Bar aligned with Reasoning style */}
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
                            },
                        }}
                    />
                    <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1.5 }}>
                        <Typography
                            variant="caption"
                            sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.5 }}
                        >
                            <RefreshCw size={12} color="var(--mui-palette-secondary-main)" style={{ animation: "spin 2s linear infinite" }} />
                            OCR Intelligence Active
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                            {Math.round(progress)}%
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </motion.div>
    );
}

// ── Dynamic Form Elements ──
function ArrayOfObjectsSection({ title, items, onUpdate }) {
    const [isAdding, setIsAdding] = useState(false);
    const [newObj, setNewObj] = useState({});

    // Infer keys from the first object
    const templateKeys = items.length > 0 ? Object.keys(items[0]) : ["title", "company", "description"];

    const handleRemove = (idx) => {
        const copy = [...items];
        copy.splice(idx, 1);
        onUpdate(copy);
    };

    const handleFieldChange = (idx, key, value) => {
        const copy = [...items];
        copy[idx] = { ...copy[idx], [key]: value };
        onUpdate(copy);
    };

    const handleSaveNew = () => {
        if (Object.keys(newObj).length > 0) {
            onUpdate([...items, newObj]);
        }
        setNewObj({});
        setIsAdding(false);
    };

    return (
        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: '16px', bgcolor: 'transparent' }}>
            <Typography variant="overline" sx={{ display: 'block', mb: 1.5, color: 'text.secondary', fontWeight: 800 }}>
                {title.replace(/_/g, " ").toUpperCase()}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {items.map((item, idx) => (
                    <BaseCard
                        key={idx}
                        sx={{
                            p: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1.5,
                            borderRadius: '12px',
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: -0.5 }}>
                            <IconButton
                                className="delete-btn"
                                size="small"
                                onClick={() => handleRemove(idx)}
                                sx={{
                                    bgcolor: 'rgba(239, 68, 68, 0.1)',
                                    color: 'error.main',
                                    "&:hover": { bgcolor: 'error.main', color: '#fff' }
                                }}
                            >
                                <X size={14} />
                            </IconButton>
                        </Box>
                        {Object.entries(item).map(([k, v]) => {
                            if (v === null || v === undefined || v === "null" || v === "undefined") return null;
                            const isDesc = k.toLowerCase().includes("description") || k.toLowerCase().includes("summary") || k.toLowerCase().includes("responsibilities");
                            return (
                                <TextField
                                    key={k}
                                    fullWidth
                                    size="small"
                                    label={k.replace(/_/g, " ").toUpperCase()}
                                    value={String(v)}
                                    onChange={(e) => handleFieldChange(idx, k, e.target.value)}
                                    multiline={isDesc}
                                    minRows={isDesc ? 2 : 1}
                                    maxRows={isDesc ? 6 : 1}
                                    inputProps={{ maxLength: isDesc ? 2000 : 150 }}
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: "10px",
                                            bgcolor: "background.paper",
                                        }
                                    }}
                                />
                            );
                        })}
                    </BaseCard>
                ))}

                {/* Inline Add Form */}
                {isAdding ? (
                    <BaseCard sx={{ p: 2, borderRadius: '12px', borderStyle: 'dashed', borderColor: 'secondary.main', bgcolor: 'rgba(190, 242, 100, 0.02)' }}>
                        <Typography variant="caption" sx={{ display: 'block', mb: 1.5, fontWeight: 700, color: 'secondary.main' }}>
                            NEW {title.replace(/_/g, " ").toUpperCase()}
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 1.5 }}>
                            {templateKeys.map(k => {
                                const isDesc = k.toLowerCase().includes("description") || k.toLowerCase().includes("summary") || k.toLowerCase().includes("responsibilities");
                                const ph = getMeaningfulPlaceholder(k, isDesc);

                                return (
                                    <Box key={k} sx={{ gridColumn: 'span 12' }}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label={k.replace(/_/g, " ").toUpperCase()}
                                            placeholder={ph}
                                            value={newObj[k] || ""}
                                            onChange={(e) => setNewObj({ ...newObj, [k]: e.target.value })}
                                            multiline={isDesc}
                                            minRows={isDesc ? 3 : 1}
                                            inputProps={{
                                                maxLength: isDesc ? 2000 : 150
                                            }}
                                        />
                                    </Box>
                                );
                            })}
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                            <SecondaryButton size="sm" onClick={() => setIsAdding(false)}>Cancel</SecondaryButton>
                            <PrimaryButton size="sm" onClick={handleSaveNew}>Save</PrimaryButton>
                        </Box>
                    </BaseCard>
                ) : (
                    <Box sx={{ mt: 0.5 }}>
                        <SecondaryButton onClick={() => setIsAdding(true)}>
                            + Add {title.replace(/_/g, " ")}
                        </SecondaryButton>
                    </Box>
                )}
            </Box>
        </Box>
    );
}

// Token/usage keys that must never reach the end-user UI even if backend forwards them.
const HIDDEN_KEYS = new Set(["usage", "prompt_tokens", "completion_tokens", "total_tokens"]);

// ── Dynamic Visual Form ──
function DynamicSection({ data, onUpdate }) {
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;

    const keys = Object.keys(data).filter((k) => !HIDDEN_KEYS.has(k));

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {keys.map((key) => {
                const val = data[key];

                // Skip ONLY if value is NULL or UNDEFINED (don't skip empty strings as they are editable)
                if (val === null || val === undefined || val === "null" || val === "undefined") return null;

                // 1. Array of Strings (e.g. Skills, Languages) -> NAVY TAGS
                if (Array.isArray(val) && (val.length === 0 || typeof val[0] === 'string')) {
                    const MAX_TAGS = 15;
                    return (
                        <Autocomplete
                            key={key}
                            multiple
                            freeSolo
                            options={[]}
                            value={val}
                            onChange={(e, newValue) => {
                                if (newValue.length <= MAX_TAGS) {
                                    onUpdate({ ...data, [key]: newValue });
                                }
                            }}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip 
                                        label={option} 
                                        {...getTagProps({ index })} 
                                        deleteIcon={<X size={14} />}
                                        sx={{ 
                                            bgcolor: "rgba(15, 23, 42, 0.08)", // Navy background
                                            border: "1px solid rgba(15, 23, 42, 0.15)", // Navy border
                                            backdropFilter: "blur(4px)",
                                            color: "primary.main", // Navy text
                                            fontWeight: 600,
                                            borderRadius: "8px",
                                            "& .MuiChip-deleteIcon": {
                                                color: "primary.main",
                                                opacity: 0.6,
                                                "&:hover": { opacity: 1, color: "error.main" }
                                            }
                                        }} 
                                    />
                                ))
                            }
                            renderInput={(params) => {
                                // Add max length to the inner input element
                                if (params.inputProps) {
                                    params.inputProps.maxLength = 50; 
                                }
                                return (
                                    <TextField 
                                        {...params} 
                                        variant="outlined" 
                                        label={key.replace(/_/g, " ").toUpperCase()} 
                                        placeholder={val.length >= 15 ? "Maximum reached" : (val.length > 0 ? `Add ${key.replace(/_/g, " ")}...` : `Type and press Enter to add ${key}...`)}
                                        disabled={val.length >= 15}
                                    />
                                );
                            }}
                            sx={{
                                "& .MuiAutocomplete-inputRoot .MuiAutocomplete-input": {
                                    minWidth: "100% !important", // Forces the input placeholder field to drop to the next line
                                    minHeight: "24px",
                                    mt: val.length > 0 ? 0.5 : 0
                                }
                            }}
                        />
                    );
                }

                // 2. String or Number (e.g. Job Title, Experience Text)
                if (typeof val === 'string' || typeof val === 'number') {
                    const isLongText = typeof val === 'string' && val.length > 60;
                    return (
                        <TextField
                            key={key}
                            label={key.replace(/_/g, " ").toUpperCase()}
                            placeholder={getMeaningfulPlaceholder(key, isLongText)}
                            value={val}
                            onChange={(e) => onUpdate({ ...data, [key]: e.target.value })}
                            fullWidth
                            multiline={isLongText}
                            minRows={1}
                            maxRows={6}
                            inputProps={{
                                maxLength: isLongText ? 3000 : 200
                            }}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: "12px",
                                    bgcolor: "background.paper",
                                }
                            }}
                        />
                    );
                }

                // 3. Array of Objects (e.g. Experiences array)
                if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
                    return (
                        <ArrayOfObjectsSection 
                            key={key} 
                            title={key} 
                            items={val} 
                            onUpdate={(newArr) => onUpdate({ ...data, [key]: newArr })} 
                        />
                    );
                }

                // 4. Object (e.g. apply_for dict)
                if (typeof val === 'object' && !Array.isArray(val)) {
                    return (
                        <Box key={key} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: '16px', bgcolor: 'rgba(15,23,42,0.02)' }}>
                            <Typography variant="overline" sx={{ display: 'block', mb: 1.5, color: 'text.secondary', fontWeight: 800 }}>
                                {key.replace(/_/g, " ").toUpperCase()}
                            </Typography>
                            <DynamicSection 
                                data={val} 
                                onUpdate={(newSubVal) => onUpdate({ ...data, [key]: newSubVal })} 
                            />
                        </Box>
                    );
                }

                return null;
            })}
        </Box>
    );
}

// ── Step 2: Verification (Visual Form) ──
function StepVerification({ extractedJsonStr, setExtractedJsonStr, onConfirm, loading }) {
    let parsed = {};
    let isParseError = false;
    try {
        parsed = JSON.parse(extractedJsonStr);
    } catch {
        isParseError = true;
    }

    return (
        <motion.div
            key="step-verification"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={springTransition}
            style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}
        >
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
                Step 2: Verify Search Profile
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                Review and edit the key details that will drive your coach matching.
            </Typography>

            <Box sx={{ flex: 1, overflowY: "auto", pr: 1.5, mb: 2, minHeight: 0, display: "flex", flexDirection: "column" }}>
                {isParseError ? (
                    <Typography color="error" sx={{ m: 'auto' }}>
                        Invalid internal data structure. Extraction could not be visualized.
                    </Typography>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pb: 2 }}>
                        {parsed.cv && (
                            <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <FileText size={18} color="var(--mui-palette-secondary-main)" /> Resume Details
                                </Typography>
                                <DynamicSection 
                                    data={parsed.cv} 
                                    onUpdate={(newCv) => setExtractedJsonStr(JSON.stringify({ ...parsed, cv: newCv }, null, 2))} 
                                />
                            </Box>
                        )}
                        {parsed.cv && parsed.jd && <Divider sx={{ my: 1 }} />}
                        {parsed.jd && (
                            <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Upload size={18} color="var(--mui-palette-secondary-main)" /> Job Description Details
                                </Typography>
                                <DynamicSection 
                                    data={parsed.jd} 
                                    onUpdate={(newJd) => setExtractedJsonStr(JSON.stringify({ ...parsed, jd: newJd }, null, 2))} 
                                />
                            </Box>
                        )}
                        {!parsed.cv && !parsed.jd && (
                            <DynamicSection 
                                data={parsed} 
                                onUpdate={(newData) => setExtractedJsonStr(JSON.stringify(newData, null, 2))} 
                            />
                        )}
                    </Box>
                )}
            </Box>

            <Box sx={{ mt: "auto", display: "flex", justifyContent: "flex-end", pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ mt: 2 }}>
                    <PrimaryButton disabled={isParseError || loading} loading={loading} onClick={onConfirm}>
                        Confirm & Find Coaches
                    </PrimaryButton>
                </Box>
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
function StepResults({ results, onRefine }) {
    const navigate = useNavigate();

    const handleBookNow = (slugProfileUrl) => {
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
                <Box sx={{ flexShrink: 0 }}>
                    <SecondaryButton onClick={onRefine} startIcon={<RefreshCw size={15} />}>
                        Refine
                    </SecondaryButton>
                </Box>
            </Box>

            <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 0.5, pb: 0.5 }}>

                {/* Coach Cards */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {topResults.map((result, i) => {
                        const displayName = result.fullName || "Coach";
                        const profilePicture = result.profilePicture;
                        const slugProfileUrl = result.slugProfileUrl;
                        const companies = result.companies || [];
                        const skills = result.topSkills || [];
                        const matchPercent = Math.round((result.rerankScore ?? result.matchScore) * 100);
                        const reasoning = result.reasoning;

                        return (
                            <motion.div
                                key={result.coachId}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ ...springTransition, delay: i * 0.1 }}
                            >
                                <BaseCard
                                    sx={{
                                        p: 2.5,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 1.5,
                                        borderRadius: "16px",
                                        transition: "border-color 0.2s ease",
                                        "&:hover": {
                                            borderColor: "secondary.main"
                                        },
                                    }}
                                >
                                        {/* Top row: avatar + info + button */}
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                            <Badge
                                                overlap="circular"
                                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                                badgeContent={
                                                    <Box sx={{
                                                        bgcolor: 'secondary.main',
                                                        color: 'primary.main',
                                                        borderRadius: '10px',
                                                        px: 0.75,
                                                        py: 0.25,
                                                        fontSize: '0.65rem',
                                                        fontWeight: 900,
                                                        boxShadow: '0 0 10px rgba(190, 242, 100, 0.5)',
                                                    }}>
                                                        {matchPercent}%
                                                    </Box>
                                                }
                                            >
                                                <Avatar
                                                    src={profilePicture || ""}
                                                    alt={displayName}
                                                    sx={{
                                                        width: 52,
                                                        height: 52,
                                                        flexShrink: 0,
                                                        bgcolor: profilePicture ? "transparent" : "rgba(15, 23, 42, 0.8)", // Navy brand dark
                                                        color: "secondary.main",
                                                        fontWeight: 700,
                                                        fontSize: "1.2rem",
                                                    }}
                                                >
                                                    {!profilePicture ? displayName.charAt(0).toUpperCase() : null}
                                                </Avatar>
                                            </Badge>

                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2, color: 'text.primary' }} noWrap>
                                                        {displayName}
                                                    </Typography>
                                                    <Chip
                                                        label="TOP MATCH"
                                                        size="small"
                                                        sx={{
                                                            height: 18,
                                                            fontSize: "0.55rem",
                                                            fontWeight: 800,
                                                            bgcolor: "secondary.main",
                                                            color: "primary.main",
                                                            border: "none",
                                                        }}
                                                    />
                                                </Box>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: "text.secondary",
                                                        mt: 0.25,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {companies.length > 0
                                                        ? companies.map((c) => c.name).join(" · ")
                                                        : "Interview Coach"}
                                                </Typography>
                                            </Box>

                                            {/* Book Now */}
                                            <Box sx={{ whiteSpace: "nowrap", flexShrink: 0 }}>
                                                <PrimaryButton
                                                    onClick={() => handleBookNow(slugProfileUrl)}
                                                    endIcon={<ArrowRight size={16} />}
                                                >
                                                    Book Now
                                                </PrimaryButton>
                                            </Box>
                                        </Box>

                                    {skills.length > 0 && (
                                        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mt: 0.5 }}>
                                            {skills.slice(0, 5).map((skill, idx) => (
                                                <Chip
                                                    key={idx}
                                                    label={typeof skill === "string" ? skill : skill.name}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontSize: "0.65rem", height: 22, borderColor: 'rgba(15, 23, 42, 0.15)', color: 'text.secondary' }}
                                                />
                                            ))}
                                            {skills.length > 5 && (
                                                <Chip label={`+${skills.length - 5}`} size="small" variant="outlined" sx={{ fontSize: "0.65rem", height: 22, borderColor: 'rgba(15, 23, 42, 0.15)' }} />
                                            )}
                                        </Box>
                                    )}

                                    {/* AI Reasoning */}
                                    {reasoning && (
                                        <Box
                                            sx={{
                                                borderLeft: "3px solid",
                                                borderColor: "secondary.main", // Lime accent
                                                bgcolor: "rgba(190, 242, 100, 0.05)", // Soft lime tint
                                                borderRadius: "0 8px 8px 0",
                                                pl: 1.5,
                                                pr: 1.5,
                                                py: 1,
                                                mt: 0.5
                                            }}
                                        >
                                            <Typography
                                                variant="overline"
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 0.5,
                                                    color: "secondary.dark", // Rich lime text
                                                    mb: 0.25,
                                                    fontSize: "0.6rem",
                                                    fontWeight: 800
                                                }}
                                            >
                                                <BrainCircuit size={14} /> AI Analysis
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: "text.primary", fontStyle: "italic", lineHeight: 1.5 }}>
                                                &ldquo;{reasoning}&rdquo;
                                            </Typography>
                                        </Box>
                                    )}
                                </BaseCard>
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
    const { results, loading, extracting, extractedData, error } = useSelector((state) => state.smartSearch);
    const [query, setQuery] = useState("");
    const [cvFile, setCvFile] = useState(null);
    const [jdFile, setJdFile] = useState(null);
    const [extractedJsonStr, setExtractedJsonStr] = useState("");
    
    // 0=Input, 1=ExtractionVisual, 2=Verify, 3=ProcessingAI, 4=Results
    const [step, setStep] = useState(0); 
    const isTextOnly = !cvFile && !jdFile;
    
    // Sidebar Map
    const activeSidebarIndex = isTextOnly
        ? (step === 0 ? 0 : step === 3 ? 1 : step === 4 ? 2 : 0) // No verify
        : (step <= 1 ? 0 : step === 2 ? 1 : step === 3 ? 2 : 3);   // With verify

    // Sync extracted data to local string for editing.
    // Show only the distilled search_profile fields — compact and user-friendly.
    useEffect(() => {
        if (extractedData) {
            const searchProfile = {};
            if (extractedData.cv?.search_profile) {
                searchProfile.cv = extractedData.cv.search_profile;
            }
            if (extractedData.jd?.search_profile) {
                searchProfile.jd = extractedData.jd.search_profile;
            }
            // Fallback: if no search_profile found, use raw data minus noise
            if (Object.keys(searchProfile).length === 0) {
                const cleanData = { ...extractedData };
                delete cleanData.error;
                setExtractedJsonStr(JSON.stringify(cleanData, null, 2));
            } else {
                setExtractedJsonStr(JSON.stringify(searchProfile, null, 2));
            }
        }
    }, [extractedData]);

    const handleInitialSubmit = useCallback(async () => {
        try {
            if (cvFile || jdFile) {
                setStep(1); // Show extraction OCR scanning screen
                let combinedExtraction = {};

                // Document Extraction Track (Process sequentially if both)
                if (cvFile) {
                    const res = await dispatch(extractDocument({ file: cvFile, docType: "cv" })).unwrap();
                    if (res?.data) combinedExtraction.cv = res.data;
                }

                if (jdFile) {
                    const res = await dispatch(extractDocument({ file: jdFile, docType: "jd" })).unwrap();
                    if (res?.data) combinedExtraction.jd = res.data;
                }

                if (Object.keys(combinedExtraction).length > 0) {
                    dispatch(updateExtractedData(combinedExtraction));
                    setStep(2); // Go to verification
                } else {
                    setStep(0); // Fallback
                }
            } else if (query.trim()) {
                // Direct Query Track (No File)
                setStep(3); // Go directly to AI Processing Rain
                dispatch(searchCoaches({ query: query.trim() }));
            }
        } catch (e) {
            console.error("Extraction failed", e);
            setStep(0);
        }
    }, [dispatch, query, cvFile, jdFile]);

    const handleVerifyConfirm = useCallback(() => {
        setStep(3); // Show processing Digital Rain screen
        dispatch(searchCoaches({
            query: query.trim(),
            extractedProfileContext: extractedJsonStr
        }));
    }, [dispatch, query, extractedJsonStr]);

    // When search results arrive → go to final step
    useEffect(() => {
        if (step === 3 && !loading && results.length > 0) {
            const timer = setTimeout(() => setStep(4), 600);
            return () => clearTimeout(timer);
        }
        if (step === 3 && !loading && error) {
            setStep(0); // Fallback on failure
        }
    }, [step, loading, results, error]);

    useEffect(() => {
        if (!open) return;

        if (results.length > 0 && !loading) {
            setStep(4);
        }
    }, [open, results, loading]);

    const handleRefine = () => {
        dispatch(clearResults());
        setCvFile(null);
        setJdFile(null);
        setStep(0);
    };

    const handleClose = () => {
        dispatch(clearResults());
        setQuery("");
        setCvFile(null);
        setJdFile(null);
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
                    border: "none",
                    outline: "none",
                    boxShadow: "0 28px 70px -20px rgba(2, 6, 23, 0.55), 0 12px 28px rgba(15, 23, 42, 0.22)",
                    "& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active": {
                        WebkitBoxShadow: "0 0 0 1000px transparent inset !important",
                        WebkitTextFillColor: "var(--mui-palette-text-primary) !important",
                        transition: "background-color 5000s ease-in-out 0s"
                    }
                },
            }}
        >
            {/* Left Sidebar */}
            <StepSidebar activeSidebarIndex={activeSidebarIndex} isTextOnly={isTextOnly} />

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
                                cvFile={cvFile}
                                setCvFile={setCvFile}
                                jdFile={jdFile}
                                setJdFile={setJdFile}
                                onSubmit={handleInitialSubmit}
                                extracting={extracting}
                                error={error}
                            />
                        )}
                        {step === 1 && <StepExtraction />}
                        {step === 2 && (
                            <StepVerification
                                extractedJsonStr={extractedJsonStr}
                                setExtractedJsonStr={setExtractedJsonStr}
                                onConfirm={handleVerifyConfirm}
                                loading={loading}
                            />
                        )}
                        {step === 3 && <StepProcessing />}
                        {step === 4 && (
                            <StepResults
                                results={results}
                                onRefine={handleRefine}
                            />
                        )}
                    </AnimatePresence>
                </Box>
            </Box>
        </Dialog>
    );
}
