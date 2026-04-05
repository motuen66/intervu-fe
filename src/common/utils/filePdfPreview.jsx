import { Box } from "@mui/material";

export function CvPreview({ url, width = 80, height = 110 }) {
    if (!url) return null;

    const A4_W = 800;
    const A4_H = 1100;
    const scale = Math.min(width / A4_W, height / A4_H);

    return (
        <Box
            sx={{
                width,
                height,
                overflow: "hidden",
                borderRadius: "8px",
                border: "1px solid #e0e0e0",
                position: "relative",
                bgcolor: "white",
                flexShrink: 0,
            }}
        >
            <iframe
                src={`${url}#toolbar=0&navpanes=0&scrollbar=0&page=1`}
                style={{
                    width: A4_W,
                    height: A4_H,
                    border: "none",
                    transformOrigin: "top left",
                    transform: `scale(${scale})`,
                    pointerEvents: "none",
                    position: "absolute",
                    top: 0,
                    left: 0,
                }}
            />
        </Box>
    );
}
