import React from "react";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

const StepperHeader = ({ currentStep = 1, steps = [] }) => {
    return (
        <Box
            sx={{
                px: { xs: 2, md: 4 },
                pt: 2,
                background: "linear-gradient(135deg, #eef2ff 0%, #f8fafc 40%, #eef2ff 100%)",
            }}
        >
            <Box
                sx={{
                    maxWidth: 1180,
                    mx: "auto",
                    p: { xs: 2.5, md: 3.25 },
                    bgcolor: "white",
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: alpha("#cbd5e1", 0.7),
                    boxShadow: "0 20px 44px rgba(15,23,42,0.08)",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                <Box
                    sx={{
                        position: "absolute",
                        inset: { xs: 14, md: 20 },
                        background: "radial-gradient(circle at 20% 20%, rgba(132,204,22,0.12), transparent 50%)",
                        opacity: 0.85,
                        pointerEvents: "none",
                    }}
                />
                <Box
                    sx={{
                        position: "absolute",
                        inset: { xs: 10, md: 16 },
                        borderRadius: 3,
                        background: "linear-gradient(90deg, rgba(148,163,184,0.12), rgba(79,70,229,0.08))",
                        pointerEvents: "none",
                    }}
                />

                <Box
                    sx={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: { xs: 2, md: 3.5 },
                    }}
                >
                    <Box
                        sx={{
                            position: "absolute",
                            top: "50%",
                            left: 0,
                            right: 0,
                            height: 2,
                            transform: "translateY(-50%)",
                            background: alpha("#cbd5e1", 0.8),
                        }}
                    />

                    {steps.map((step, index) => {
                        const stepNumber = index + 1;
                        const isActive = stepNumber === currentStep;
                        const isCompleted = stepNumber < currentStep;

                        return (
                            <Box key={step} sx={{ position: "relative", zIndex: 2, textAlign: "center", minWidth: 0 }}>
                                <Box
                                    sx={{
                                        width: 38,
                                        height: 38,
                                        borderRadius: "50%",
                                        mx: "auto",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: 800,
                                        fontSize: 15,
                                        bgcolor: isActive ? "#0f172a" : isCompleted ? "#84cc16" : "#94a3b8",
                                        color: isActive || isCompleted ? "#fff" : "#f8fafc",
                                        boxShadow: isActive
                                            ? "0 12px 32px rgba(15,23,42,0.18)"
                                            : "0 8px 24px rgba(148,163,184,0.28)",
                                        border: `2px solid ${isActive ? alpha("#0f172a", 0.7) : alpha("#cbd5e1", 0.8)}`,
                                    }}
                                >
                                    {stepNumber}
                                </Box>
                                <Typography
                                    sx={{
                                        mt: 1.5,
                                        fontWeight: isActive ? 800 : 700,
                                        color: isActive ? "#0f172a" : isCompleted ? "#0f172a" : "#6b7280",
                                        letterSpacing: "0.01em",
                                    }}
                                >
                                    {step}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        </Box>
    );
};

export default StepperHeader;
