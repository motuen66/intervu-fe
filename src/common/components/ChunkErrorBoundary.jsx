import { Component } from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";

class ChunkErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error) {
        console.error("ChunkErrorBoundary caught an error:", error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", px: 2 }}>
                    <Paper elevation={0} sx={{ p: 3, maxWidth: 520, width: "100%", border: "1px solid #E5E7EB" }}>
                        <Stack spacing={1.5}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Couldn&apos;t load the latest app bundle
                            </Typography>
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                A new version may have been deployed. Please reload to continue.
                            </Typography>
                            <Button variant="contained" onClick={() => window.location.reload()}>
                                Reload
                            </Button>
                        </Stack>
                    </Paper>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ChunkErrorBoundary;
