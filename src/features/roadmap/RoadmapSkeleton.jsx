import React from "react";
import { Box, Skeleton, Stack } from "@mui/material";

function RoadmapSkeleton() {
    return (
        <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, gap: 0 }}>
            {/* Header skeleton */}
            <Box
                sx={{
                    borderRadius: "28px",
                    p: "28px 34px",
                    background: "linear-gradient(110deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.04) 100%)",
                    border: "1px solid",
                    borderColor: "divider",
                    mb: 2,
                }}
            >
                <Skeleton variant="rounded" width={200} height={28} animation="wave" sx={{ borderRadius: "999px", mb: 2 }} />
                <Skeleton variant="text" width="55%" height={52} animation="wave" sx={{ mb: 1 }} />
                <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
                    <Skeleton variant="rounded" width={160} height={44} animation="wave" sx={{ borderRadius: "12px" }} />
                    <Skeleton variant="rounded" width={160} height={44} animation="wave" sx={{ borderRadius: "12px" }} />
                    <Skeleton variant="rounded" width={160} height={44} animation="wave" sx={{ borderRadius: "12px" }} />
                </Stack>
            </Box>

            {/* Two-column body skeleton */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 2fr) minmax(320px, 1fr)",
                    flex: 1,
                    minHeight: 0,
                    borderRadius: "18px",
                    border: "1px solid",
                    borderColor: "divider",
                    overflow: "hidden",
                }}
            >
                {/* Left panel — phase/node skeletons */}
                <Box sx={{ p: 3, borderRight: "1px solid", borderColor: "divider", display: "flex", flexDirection: "column", gap: 3 }}>
                    {[1, 2].map((phase) => (
                        <Box
                            key={phase}
                            sx={{
                                borderRadius: "16px",
                                border: "1px solid",
                                borderColor: "divider",
                                p: "16px 20px",
                                background: "background.paper",
                            }}
                        >
                            <Skeleton variant="text" width={80} height={16} animation="wave" sx={{ mb: 0.5 }} />
                            <Skeleton variant="text" width={200} height={24} animation="wave" sx={{ mb: 2 }} />
                            <Stack direction="row" spacing={2}>
                                {[1, 2, 3].map((node) => (
                                    <Skeleton
                                        key={node}
                                        variant="rounded"
                                        width={200}
                                        height={120}
                                        animation="wave"
                                        sx={{ borderRadius: "12px", flexShrink: 0 }}
                                    />
                                ))}
                            </Stack>
                        </Box>
                    ))}
                </Box>

                {/* Right panel — detail skeleton */}
                <Box sx={{ p: 3, background: "background.paper", display: "flex", flexDirection: "column", gap: 2 }}>
                    <Skeleton variant="text" width={80} height={14} animation="wave" />
                    <Skeleton variant="text" width="70%" height={36} animation="wave" />
                    <Stack direction="row" spacing={0} sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 0 }}>
                        <Skeleton variant="text" width={120} height={40} animation="wave" />
                        <Skeleton variant="text" width={120} height={40} animation="wave" />
                    </Stack>
                    <Stack spacing={1.5} sx={{ mt: 1 }}>
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} variant="rounded" width="100%" height={72} animation="wave" sx={{ borderRadius: "14px" }} />
                        ))}
                    </Stack>
                    <Box sx={{ mt: "auto", pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
                        <Skeleton variant="text" width={80} height={14} animation="wave" sx={{ mb: 1 }} />
                        <Skeleton variant="text" width="60%" height={28} animation="wave" />
                        <Skeleton variant="rounded" width={80} height={24} animation="wave" sx={{ borderRadius: "999px", mt: 1 }} />
                        <Skeleton variant="rounded" width="100%" height={8} animation="wave" sx={{ borderRadius: "999px", mt: 1.5 }} />
                        <Skeleton variant="text" width="90%" animation="wave" sx={{ mt: 1.5 }} />
                        <Skeleton variant="text" width="75%" animation="wave" />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

export default RoadmapSkeleton;
