import React from "react";
import { Box, Skeleton, Stack } from "@mui/material";

const RecentInterviewItemSkeleton = () => {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: { xs: "flex-start", md: "center" },
                justifyContent: "space-between",
                p: { xs: 2.5, md: 2 },
                mb: 1.5,
                borderRadius: "16px",
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                gap: { xs: 2, md: 0 },
            }}
        >
            <Stack direction="row" spacing={2.5} alignItems="center" sx={{ width: { xs: "100%", md: "25%" } }}>
                <Skeleton variant="circular" width={44} height={44} animation="wave" />
                <Skeleton variant="text" width="60%" height={24} animation="wave" />
            </Stack>

            <Skeleton variant="text" width={{ xs: "100%", md: "20%" }} height={20} animation="wave" />

            <Skeleton variant="text" width={{ xs: "100%", md: "15%" }} height={20} animation="wave" />

            <Stack direction="row" spacing={1} alignItems="center" sx={{ width: { xs: "100%", md: "15%" } }}>
                <Skeleton variant="circular" width={8} height={8} animation="wave" />
                <Skeleton variant="text" width="60%" height={20} animation="wave" />
            </Stack>

            <Box sx={{ width: { xs: "100%", md: "15%" }, display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" } }}>
                <Skeleton variant="rectangular" width={100} height={32} sx={{ borderRadius: "10px" }} animation="wave" />
            </Box>
        </Box>
    );
};

export default RecentInterviewItemSkeleton;
