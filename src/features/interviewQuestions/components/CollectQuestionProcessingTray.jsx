import { Paper, Box, Typography, IconButton, LinearProgress } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, CheckCircle, X } from "lucide-react";
import PrimaryButton from "../../../common/components/buttons/PrimaryButton";
import "./CollectQuestionProcessingTray.css";

export default function CollectQuestionProcessingTray({
    progress = 0,
    status = "",
    runningTitle = "Analyzing questions…",
    completeTitle = "Analysis Complete!",
    completeCtaLabel = "Review Now",
    isComplete = false,
    onReview,
    onClose,
}) {
    const headerBg = isComplete ? "success.main" : "secondary.main";
    const Icon = isComplete ? CheckCircle : Bot;
    const title = isComplete ? completeTitle : runningTitle;

    return (
        <Paper
            elevation={4}
            sx={{
                position: "fixed",
                bottom: 16,
                right: 16,
                width: 340,
                borderRadius: 2,
                overflow: "hidden",
                zIndex: 1300,
                bgcolor: "background.paper",
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    px: 2,
                    py: 1.25,
                    bgcolor: headerBg,
                    color: "primary.main",
                    transition: "background-color .4s ease",
                    userSelect: "none",
                }}
            >
                <Box className={isComplete ? "" : "collect-tray-pulse"} sx={{ display: "inline-flex" }}>
                    <Icon size={20} />
                </Box>
                <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 600 }}>
                    {title}
                </Typography>
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose?.();
                    }}
                    sx={{ color: "inherit", p: 0.25 }}
                    aria-label="Close"
                >
                    <X size={16} />
                </IconButton>
            </Box>

            <Box sx={{ px: 2, py: 1.75 }}>
                <AnimatePresence mode="wait">
                    {isComplete ? (
                        <motion.div
                            key="complete"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.25 }}
                        >
                            <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>
                                {completeTitle}
                            </Typography>
                            <PrimaryButton fullWidth onClick={onReview}>
                                {completeCtaLabel}
                            </PrimaryButton>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="running"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.25 }}
                        >
                            <LinearProgress
                                variant="determinate"
                                value={progress}
                                sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    mb: 1,
                                    "& .MuiLinearProgress-bar": { bgcolor: "primary.main" },
                                }}
                            />
                            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                    {status}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                                    {Math.round(progress)}%
                                </Typography>
                            </Box>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Box>
        </Paper>
    );
}
