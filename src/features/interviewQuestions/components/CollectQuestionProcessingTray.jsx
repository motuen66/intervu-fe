import { Paper, Box, Typography, IconButton, LinearProgress, Collapse } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, CheckCircle, X, ChevronDown } from "lucide-react";
import PrimaryButton from "../../../common/components/buttons/PrimaryButton";
import "./CollectQuestionProcessingTray.css";

export default function CollectQuestionProcessingTray({
    progress = 0,
    status = "",
    isComplete = false,
    expanded = true,
    onToggle,
    onReview,
    onClose,
}) {
    const headerBg = isComplete ? "success.main" : "secondary.main";
    const Icon = isComplete ? CheckCircle : Bot;
    const title = isComplete ? "Analysis Complete!" : "Analyzing questions…";

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
                onClick={onToggle}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    px: 2,
                    py: 1.25,
                    cursor: "pointer",
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
                <Box
                    component={motion.div}
                    animate={{ rotate: expanded ? 0 : 180 }}
                    transition={{ duration: 0.2 }}
                    sx={{ display: "inline-flex", opacity: 0.85 }}
                >
                    <ChevronDown size={18} />
                </Box>
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

            <Collapse in={expanded} timeout="auto">
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
                                    Your questions have been analyzed and are ready to review.
                                </Typography>
                                <PrimaryButton fullWidth onClick={onReview}>
                                    Review Now
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
            </Collapse>
        </Paper>
    );
}
