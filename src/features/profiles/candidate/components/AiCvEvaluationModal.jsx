import React, { useState, useCallback, useEffect } from "react";
import {
    Box,
    Typography,
    Dialog,
    Paper,
    Stack,
    CircularProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip,
    IconButton,
    alpha,
    Tabs,
    Tab,
} from "@mui/material";
import toast from "react-hot-toast";
import {
    BrainCircuit,
    CheckCircle2,
    Target,
    AlertTriangle,
    MessageSquare,
    Sparkles,
    ShieldCheck,
    CloudUpload,
    FileText,
    X,
    Cpu,
    Zap,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { PrimaryButton, SecondaryButton } from "../../../../common/components/buttons";
import { useTheme } from "@mui/material/styles";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { candidateProfileEndPoints } from "../service/candidateProfileApi";

const springTransition = { type: "spring", damping: 25, stiffness: 200 };

// ── Scanning Laser Effect ──
function ScanningEffect() {
    return (
        <Box sx={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: "inherit", pointerEvents: "none" }}>
            <Box
                sx={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0.1,
                    backgroundImage: `
                        linear-gradient(to right, #888 1px, transparent 1px),
                        linear-gradient(to bottom, #888 1px, transparent 1px)
                    `,
                    backgroundSize: "24px 24px",
                }}
            />
            <motion.div
                animate={{ top: ["-10%", "110%", "-10%"] }}
                transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    height: "2px",
                    background: "rgba(106, 170, 0, 0.6)",
                    boxShadow: "0 0 15px 2px rgba(106, 170, 0, 0.4)",
                    zIndex: 2,
                }}
            />
            <motion.div
                animate={{ top: ["-10%", "110%", "-10%"] }}
                transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    height: "60px",
                    background: "linear-gradient(to top, rgba(106, 170, 0, 0.08), transparent)",
                    zIndex: 1,
                }}
            />
        </Box>
    );
}

// ── Sidebar ──
function StepSidebar({ activeIndex }) {
    const steps = [
        { label: "Select Source", icon: FileText },
        { label: "AI Assessment", icon: Cpu },
        { label: "Career Insights", icon: BrainCircuit },
    ];

    return (
        <Box
            sx={{
                width: 250,
                minHeight: "100%",
                background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
                p: 4,
                display: "flex",
                flexDirection: "column",
                gap: 4,
            }}
        >
            <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Sparkles size={16} color="#bef264" />
                    <Typography
                        variant="overline"
                        sx={{ color: "#bef264", fontWeight: 800, letterSpacing: "0.1em" }}
                    >
                        NEURAL CAREER ENGINE
                    </Typography>
                </Stack>
                <Typography variant="h5" sx={{ color: "white", fontWeight: 800, lineHeight: 1.2 }}>
                    AI Coaching <span style={{ color: "#bef264" }}>Assessment</span>
                </Typography>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 4 }}>
                {steps.map((step, i) => {
                    const Icon = step.icon;
                    const isActive = i === activeIndex;
                    const isCompleted = i < activeIndex;

                    return (
                        <Box
                            key={i}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                py: 1.5,
                                px: 2,
                                borderRadius: "12px",
                                bgcolor: isActive ? "rgba(190, 242, 100, 0.1)" : "transparent",
                                transition: "all 0.3s ease",
                            }}
                        >
                            <Box
                                sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: "8px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    bgcolor: isActive ? "#bef264" : "rgba(255,255,255,0.05)",
                                    color: isActive ? "#0f172a" : isCompleted ? "#bef264" : "rgba(255,255,255,0.3)",
                                    border: isCompleted ? "1px solid #bef264" : "none",
                                }}
                            >
                                <Icon size={18} />
                            </Box>
                            <Box>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: isActive ? "#bef264" : "rgba(255,255,255,0.3)",
                                        fontSize: "0.6rem",
                                        fontWeight: 800,
                                        display: "block",
                                    }}
                                >
                                    STEP 0{i + 1}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: isActive || isCompleted ? "white" : "rgba(255,255,255,0.4)",
                                        fontWeight: 700,
                                    }}
                                >
                                    {step.label}
                                </Typography>
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}

const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index} style={{ flex: 1, display: value === index ? "flex" : "none", flexDirection: "column" }}>
        {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
);

const AiCvEvaluationModal = ({ open, onClose, profile, onRefresh }) => {
    const theme = useTheme();
    // steps: selection, upload, processing, result
    const [step, setStep] = useState(profile?.aiEvaluation ? "result" : "selection");
    const [loading, setLoading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const [evalData, setEvalData] = useState(() => {
        try {
            return profile?.aiEvaluation ? JSON.parse(profile.aiEvaluation) : null;
        } catch (e) {
            return null;
        }
    });

    const activeSidebarIndex = step === "selection" || step === "upload" ? 0 : step === "processing" ? 1 : 2;

    const handleReset = () => {
        setStep("selection");
        setUploadedFile(null);
        setTabValue(0);
    };

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file && file.type === "application/pdf") {
            setUploadedFile(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: "application/pdf",
        multiple: false,
    });

    const handleEvaluate = async (file = null) => {
        if (!file && !profile?.cvUrl) {
            toast.error("Please upload a CV to your profile first.");
            onClose();
            return;
        }

        setLoading(true);
        setStep("processing");
        try {
            const formData = new FormData();
            if (file) formData.append("file", file);

            const res = await callApi({
                method: METHOD.POST,
                endpoint: candidateProfileEndPoints.EVALUATE_CV,
                arg: formData,
            });

            if (res.success) {
                const data = res.data?.data || res.data;
                setEvalData(data);
                setStep("result");
                if (!file && onRefresh) onRefresh();
            } else {
                toast.error(res.message || "Failed to evaluate CV");
                setStep("selection");
            }
        } catch (err) {
            setStep("selection");
        } finally {
            setLoading(false);
        }
    };

    const getVerdictColor = (verdict) => {
        const v = verdict?.toLowerCase() || "";
        if (v.includes("excellent")) return "#2e7d32";
        if (v.includes("strong")) return "#1976d2";
        if (v.includes("potential")) return "#ed6c02";
        if (v.includes("not a match")) return "#d32f2f";
        return theme.palette.primary.main;
    };

    return (
        <Dialog
            open={open}
            onClose={loading ? undefined : onClose}
            maxWidth={false}
            PaperProps={{
                sx: {
                    borderRadius: "24px",
                    overflow: "hidden",
                    width: "min(1000px, 94vw)",
                    height: "min(640px, 88vh)",
                    display: "flex",
                    flexDirection: "row",
                    bgcolor: "background.paper",
                },
            }}
        >
            {/* Left Sidebar */}
            <StepSidebar activeIndex={activeSidebarIndex} />

            {/* Right Content */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                {/* Header bar */}
                <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
                    <IconButton onClick={onClose} disabled={loading} size="small">
                        <X size={20} />
                    </IconButton>
                </Box>

                {/* Content area */}
                <Box sx={{ flex: 1, px: 6, pb: 4, overflowY: "auto", display: "flex", flexDirection: "column" }}>
                    <AnimatePresence mode="wait">
                        {step === "selection" && (
                            <motion.div
                                key="selection"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={springTransition}
                            >
                                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                                    Neural Content Source
                                </Typography>
                                <Typography variant="body2" sx={{ color: "text.secondary", mb: 4 }}>
                                    Select the CV source for your professional coaching analysis.
                                </Typography>

                                <Stack spacing={2} sx={{ maxWidth: 450 }}>
                                    <SecondaryButton
                                        onClick={() => handleEvaluate()}
                                        fullWidth
                                        startIcon={<FileText size={20} />}
                                        sx={{
                                            py: 2,
                                            borderRadius: "16px",
                                            textTransform: "none",
                                            fontWeight: 700,
                                            justifyContent: "flex-start",
                                            px: 3,
                                            borderWidth: "2px",
                                            "&:hover": { borderWidth: "2px" }
                                        }}
                                    >
                                        Use Current Profile CV
                                    </SecondaryButton>
                                    <SecondaryButton
                                        onClick={() => setStep("upload")}
                                        fullWidth
                                        startIcon={<CloudUpload size={20} />}
                                        sx={{
                                            py: 2,
                                            borderRadius: "16px",
                                            textTransform: "none",
                                            fontWeight: 700,
                                            justifyContent: "flex-start",
                                            px: 3,
                                            borderWidth: "2px",
                                            "&:hover": { borderWidth: "2px" }
                                        }}
                                    >
                                        Try with Another CV (Upload PDF)
                                    </SecondaryButton>
                                </Stack>
                            </motion.div>
                        )}

                        {step === "upload" && (
                            <motion.div
                                key="upload"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={springTransition}
                            >
                                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                                    Verify Documentation
                                </Typography>
                                <Typography variant="body2" sx={{ color: "text.secondary", mb: 4 }}>
                                    Upload a new PDF to run a specialized session assessment.
                                </Typography>

                                {!uploadedFile ? (
                                    <Box
                                        {...getRootProps()}
                                        sx={{
                                            border: "2px dashed",
                                            borderColor: isDragActive ? "primary.main" : alpha(theme.palette.divider, 0.5),
                                            borderRadius: "20px",
                                            p: 8,
                                            textAlign: "center",
                                            cursor: "pointer",
                                            bgcolor: isDragActive ? alpha(theme.palette.primary.main, 0.05) : "#f8fafc",
                                            transition: "all 0.2s",
                                            "&:hover": { borderColor: "primary.main" }
                                        }}
                                    >
                                        <input {...getInputProps()} />
                                        <CloudUpload size={48} color={theme.palette.text.disabled} style={{ marginBottom: "16px" }} />
                                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                                            <span style={{ color: theme.palette.primary.main }}>Click to upload</span> or drag and drop
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                            PDF file only, up to 10MB
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Paper variant="outlined" sx={{ p: 2, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "rgba(106, 170, 0, 0.05)", borderColor: "primary.main" }}>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <FileText size={24} color={theme.palette.primary.main} />
                                            <Typography fontWeight={700}>{uploadedFile.name}</Typography>
                                        </Stack>
                                        <IconButton onClick={() => setUploadedFile(null)} color="error" size="small">
                                            <X size={18} />
                                        </IconButton>
                                    </Paper>
                                )}

                                <Stack direction="row" spacing={2} sx={{ mt: 4 }} justifyContent="flex-end">
                                    <SecondaryButton onClick={handleReset}>Back</SecondaryButton>
                                    <PrimaryButton disabled={!uploadedFile} onClick={() => handleEvaluate(uploadedFile)}>
                                        Extract Insights <Zap size={16} style={{ marginLeft: "8px" }} />
                                    </PrimaryButton>
                                </Stack>
                            </motion.div>
                        )}

                        {step === "processing" && (
                            <motion.div
                                key="processing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={{
                                    display: "flex", flexDirection: "column",
                                    alignItems: "center", justifyContent: "center", height: "100%", width: "100%"
                                }}
                            >
                                <Box sx={{ position: "relative", width: 140, height: 180, bgcolor: "#f1f5f9", borderRadius: "16px", mb: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <ScanningEffect />
                                    <FileText size={64} color={theme.palette.primary.main} strokeWidth={1} style={{ opacity: 0.8 }} />
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                                    Neural Processing Active...
                                </Typography>
                                <Typography variant="body2" sx={{ color: "text.secondary", mb: 4, textAlign: "center" }}>
                                    Our AI is scanning your career trajectory and matching market data.
                                </Typography>
                                <CircularProgress size={24} sx={{ color: "#bef264" }} />
                            </motion.div>
                        )}

                        {step === "result" && evalData && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={springTransition}
                                style={{ display: "flex", flexDirection: "column", height: "100%" }}
                            >
                                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                                        Career Matching Insights
                                    </Typography>
                                    {evalData.final_verdict && (
                                        <Chip
                                            label={`Verdict: ${evalData.final_verdict}`}
                                            sx={{
                                                bgcolor: alpha(getVerdictColor(evalData.final_verdict), 0.1),
                                                color: getVerdictColor(evalData.final_verdict),
                                                fontWeight: 800,
                                                borderRadius: "8px",
                                                height: 32,
                                                fontSize: "0.75rem",
                                                border: "1px solid",
                                                borderColor: alpha(getVerdictColor(evalData.final_verdict), 0.2),
                                            }}
                                        />
                                    )}
                                </Stack>

                                <Tabs
                                    value={tabValue}
                                    onChange={(e, v) => setTabValue(v)}
                                    sx={{
                                        borderBottom: 1,
                                        borderColor: "divider",
                                        "& .MuiTab-root": { textTransform: "none", fontWeight: 700, fontSize: "0.9rem", minWidth: 100 }
                                    }}
                                >
                                    <Tab label="Summary" />
                                    <Tab label="Skills Strength" />
                                    <Tab label="Growth Areas" />
                                    <Tab label="AI Reasoning" />
                                </Tabs>

                                <TabPanel value={tabValue} index={0}>
                                    <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.primary" }}>
                                        {evalData.summary}
                                    </Typography>
                                </TabPanel>

                                <TabPanel value={tabValue} index={1}>
                                    <List>
                                        {(evalData.strengths || []).map((s, i) => (
                                            <ListItem key={i} sx={{ px: 0 }}>
                                                <ListItemIcon sx={{ minWidth: 36 }}><CheckCircle2 size={20} color="#2e7d32" /></ListItemIcon>
                                                <ListItemText primary={s} primaryTypographyProps={{ variant: "body2", fontWeight: 600 }} />
                                            </ListItem>
                                        ))}
                                    </List>
                                </TabPanel>

                                <TabPanel value={tabValue} index={2}>
                                    <List>
                                        {(evalData.gaps || []).map((g, i) => (
                                            <ListItem key={i} sx={{ px: 0 }}>
                                                <ListItemIcon sx={{ minWidth: 36 }}><AlertTriangle size={20} color="#ed6c02" /></ListItemIcon>
                                                <ListItemText primary={g} primaryTypographyProps={{ variant: "body2", fontWeight: 600 }} />
                                            </ListItem>
                                        ))}
                                    </List>
                                </TabPanel>

                                <TabPanel value={tabValue} index={3}>
                                    <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03), p: 3, borderRadius: "16px", border: "1px solid", borderColor: "divider" }}>
                                        <Typography variant="body2" sx={{ lineHeight: 1.8, color: "text.secondary", whiteSpace: "pre-wrap", fontStyle: "italic" }}>
                                            &ldquo;{evalData.reasoning}&rdquo;
                                        </Typography>
                                    </Box>
                                </TabPanel>

                                <Box sx={{ mt: "auto", pt: 4, display: "flex", justifyContent: "space-between" }}>
                                    <SecondaryButton onClick={handleReset}>
                                        Re-evaluate CV
                                    </SecondaryButton>
                                    <PrimaryButton onClick={onClose}>
                                        Done
                                    </PrimaryButton>
                                </Box>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Box>
            </Box>
        </Dialog>
    );
};

export default AiCvEvaluationModal;
