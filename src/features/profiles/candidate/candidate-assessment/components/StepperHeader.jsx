import React from "react";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

const StepperHeader = ({ currentStep = 1, steps = [] }) => {
    return (
        <Box sx={{ px: { xs: 2, md: 4 }, pt: 2 }}>
            <Box
                sx={{
                    maxWidth: 1120,
                    mx: "auto",
                    p: { xs: 2, md: 3.25 },
                    bgcolor: "background.paper",
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "divider",
                    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)",
                }}
            >
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${Math.max(steps.length, 1)}, minmax(0, 1fr))`,
                        gap: { xs: 1.5, md: 2 },
                    }}
                >
                    {steps.map((step, index) => {
                        const stepNumber = index + 1;
                        const isActive = stepNumber === currentStep;
                        const isCompleted = stepNumber < currentStep;

                        return (
                            <Box key={step} sx={{ minWidth: 0 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                                    <Box
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: "50%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontWeight: 800,
                                            fontSize: 14,
                                            bgcolor: isActive ? "#0f172a" : isCompleted ? "#84cc16" : "#94a3b8",
                                            color: isActive || isCompleted ? "#fff" : "#f8fafc",
                                            flexShrink: 0,
                                        }}
                                    >
                                        {stepNumber}
                                    </Box>
                                    <Box
                                        sx={{
                                            flex: 1,
                                            height: 2,
                                            borderRadius: 999,
                                            bgcolor: index === steps.length - 1 ? "transparent" : alpha("#94a3b8", 0.45),
                                            overflow: "hidden",
                                        }}
                                    >
                                        {index !== steps.length - 1 ? (
                                            <Box
                                                sx={{
                                                    width: isCompleted ? "100%" : "0%",
                                                    height: "100%",
                                                    bgcolor: "#84cc16",
                                                    transition: "width 220ms ease",
                                                }}
                                            />
                                        ) : null}
                                    </Box>
                                </Box>
                                <Typography
                                    sx={{
                                        mt: 2,
                                        textAlign: "center",
                                        fontWeight: isActive ? 800 : 600,
                                        color: isActive ? "#0f172a" : "#64748b",
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
