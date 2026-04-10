import React, { useState, useRef, useEffect, useCallback } from "react";
import { Box, Typography, IconButton, Dialog, DialogContent, Tooltip, CircularProgress } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DescriptionIcon from "@mui/icons-material/Description";

export function CvDialog({ open, onClose, url, title = "CV View" }) {
    const [scale, setScale] = useState(1);
    const [loaded, setLoaded] = useState(false);
    const [iframeSrc, setIframeSrc] = useState(null);
    const dialogScrollRef = useRef(null);

    useEffect(() => {
        if (open && url && !iframeSrc) {
            setLoaded(false);
            setIframeSrc(url);
        }
        if (!open && iframeSrc) {
            const t = setTimeout(() => {
                setIframeSrc(null);
                setLoaded(false);
                setScale(1);
            }, 300);
            return () => clearTimeout(t);
        }
    }, [open, url]);

    const handleClose = () => {
        onClose();
    };

    if (!url) return null;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth={false}
            PaperProps={{
                sx: {
                    width: "min(1000px, calc(100vw - 48px))",
                    height: "calc(100vh - 64px)",
                    borderRadius: "20px",
                    overflow: "hidden",
                    bgcolor: "#1e2027",
                },
            }}
        >
            {/* Toolbar */}
            <Box
                sx={{
                    px: 2.5,
                    py: 1.5,
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    bgcolor: "#2b2f3a",
                    flexShrink: 0,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <DescriptionIcon sx={{ color: "#afe34a", fontSize: 22 }} />
                    <Typography sx={{ color: "white", fontWeight: 600, fontSize: "0.9rem" }}>{title}</Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Tooltip title="Zoom out">
                        <span>
                            <IconButton
                                onClick={() => setScale((s) => Math.max(0.5, Number((s - 0.1).toFixed(1))))}
                                size="small"
                                sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "white" } }}
                            >
                                <ZoomOutIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>

                    <Box
                        sx={{
                            px: 1.5,
                            py: 0.5,
                            bgcolor: "rgba(255,255,255,0.08)",
                            borderRadius: "8px",
                            minWidth: 56,
                            textAlign: "center",
                        }}
                    >
                        <Typography sx={{ color: "white", fontSize: "0.8rem", fontWeight: 600 }}>
                            {Math.round(scale * 100)}%
                        </Typography>
                    </Box>

                    <Tooltip title="Zoom in">
                        <span>
                            <IconButton
                                onClick={() => setScale((s) => Math.min(2, Number((s + 0.1).toFixed(1))))}
                                size="small"
                                sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "white" } }}
                            >
                                <ZoomInIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>

                    <Box sx={{ width: 1, height: 20, bgcolor: "rgba(255,255,255,0.12)", mx: 1 }} />

                    <Tooltip title="Open in new tab">
                        <IconButton
                            onClick={() => window.open(url, "_blank")}
                            size="small"
                            sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "white" } }}
                        >
                            <OpenInNewIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    <IconButton
                        onClick={handleClose}
                        size="small"
                        sx={{
                            color: "rgba(255,255,255,0.7)",
                            ml: 0.5,
                            "&:hover": { color: "white", bgcolor: "rgba(255,255,255,0.08)" },
                        }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
            </Box>

            {/* Content */}
            <DialogContent
                sx={{
                    p: 0,
                    bgcolor: "#1e2027",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                }}
            >
                {!loaded && (
                    <Box
                        sx={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 2,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: "#1e2027",
                            gap: 2,
                        }}
                    >
                        <CircularProgress sx={{ color: "rgba(255,255,255,0.5)" }} size={36} />
                        <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
                            Loading CV…
                        </Typography>
                    </Box>
                )}

                {/* Scrollable area */}
                <Box
                    ref={dialogScrollRef}
                    sx={{
                        flex: 1,
                        overflow: "auto",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "flex-start",
                        p: 3,
                    }}
                >
                    {iframeSrc && (
                        <Box
                            sx={{
                                transformOrigin: "top center",
                                transform: `scale(${scale})`,
                                transition: "transform 0.2s ease",
                                marginBottom: scale < 1 ? `${(1 - scale) * -1400}px` : 0,
                            }}
                        >
                            <iframe
                                src={`${iframeSrc}#toolbar=0&navpanes=0&scrollbar=0`}
                                title="CV Viewer"
                                onLoad={() => setLoaded(true)}
                                style={{
                                    width: "850px",
                                    height: "1100px",
                                    border: "none",
                                    borderRadius: "8px",
                                    boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
                                    background: "white",
                                    display: "block",
                                }}
                            />
                        </Box>
                    )}
                </Box>
            </DialogContent>
        </Dialog>
    );
}
