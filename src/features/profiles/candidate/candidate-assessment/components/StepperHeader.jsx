import React from "react";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

const StepperHeader = ({ currentStep = 1, steps = [], onStepClick }) => {
    const totalSteps = Math.max(steps.length, 1);
    const safeCurrentStep = Math.min(Math.max(currentStep, 1), totalSteps);
    const progressPercent = totalSteps > 1 ? ((safeCurrentStep - 1) / (totalSteps - 1)) * 100 : 0;

    return (
        <Box
            sx={{
                px: { xs: 1, md: 1.5 },
            }}
        >
            <Box
                sx={{
                    maxWidth: 1220,
                    mx: "auto",
                    p: { xs: 1, md: 1.1 },
                    bgcolor: "#f1f5f9",
                    borderRadius: 2.5,
                    border: "1px solid",
                    borderColor: alpha("#cbd5e1", 0.7),
                    boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                <Box sx={{ position: "relative", pt: 0.2 }}>
                    <Box
                        sx={{
                            position: "absolute",
                            top: 15,
                            left: 16,
                            right: 16,
                            height: 2,
                            borderRadius: 999,
                            backgroundColor: alpha("#94a3b8", 0.35),
                        }}
                    />
                    <Box
                        sx={{
                            position: "absolute",
                            top: 15,
                            left: 16,
                            height: 2,
                            borderRadius: 999,
                            backgroundColor: "#84cc16",
                            width: `calc((100% - 32px) * ${progressPercent / 100})`,
                            transition: "width 280ms ease",
                        }}
                    />

                    <Box sx={{ position: "relative", zIndex: 2, display: "flex", alignItems: "flex-start" }}>
                        {steps.map((step, index) => {
                            const stepNumber = index + 1;
                            const isActive = stepNumber === safeCurrentStep;
                            const isCompleted = stepNumber < safeCurrentStep;
                            const label = typeof step === "string" ? step : step?.label || `Step ${stepNumber}`;
                            const canGoBack = stepNumber <= safeCurrentStep;

                            return (
                                <Box
                                    key={`${label}-${stepNumber}`}
                                    sx={{
                                        flex: 1,
                                        textAlign: "center",
                                        minWidth: 0,
                                        display: "flex",
                                        justifyContent: "center",
                                    }}
                                >
                                    <Box
                                        component="button"
                                        type="button"
                                        onClick={() => {
                                            if (!canGoBack || typeof onStepClick !== "function") return;
                                            onStepClick(stepNumber);
                                        }}
                                        disabled={!canGoBack}
                                        sx={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            border: 0,
                                            background: "transparent",
                                            p: 0,
                                            m: 0,
                                            cursor: canGoBack ? "pointer" : "default",
                                            color: "inherit",
                                            "&:disabled": { cursor: "default" },
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: "50%",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontWeight: 800,
                                                fontSize: 12,
                                                bgcolor: isActive
                                                    ? "#84cc16"
                                                    : isCompleted
                                                      ? "#0f172a"
                                                      : "#94a3b8",
                                                color: "#fff",
                                                boxShadow: isActive ? "0 4px 10px rgba(15,23,42,0.12)" : "none",
                                                border: `1px solid ${isActive ? alpha("#65a30d", 0.8) : alpha("#cbd5e1", 0.8)}`,
                                                transition: "all 200ms ease",
                                            }}
                                        >
                                            {stepNumber}
                                        </Box>
                                        <Typography
                                            sx={{
                                                mt: 0.5,
                                                fontWeight: isActive ? 800 : 700,
                                                color: isActive ? "#4d7c0f" : isCompleted ? "#0f172a" : "#64748b",
                                                letterSpacing: "0.008em",
                                                fontSize: { xs: 10, md: 12 },
                                            }}
                                        >
                                            {label}
                                        </Typography>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default StepperHeader;
