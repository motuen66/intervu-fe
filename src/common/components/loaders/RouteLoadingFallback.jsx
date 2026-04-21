import { Box, CircularProgress } from "@mui/material";

function RouteLoadingFallback() {
    return (
        <Box sx={{ minHeight: 180, display: "grid", placeItems: "center" }}>
            <CircularProgress size={26} />
        </Box>
    );
}

export default RouteLoadingFallback;
