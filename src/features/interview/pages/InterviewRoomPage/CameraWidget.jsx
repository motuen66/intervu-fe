import { useState, useRef, useCallback, useEffect } from "react";
import {
    Box,
    Typography,
    Avatar,
    IconButton,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import PersonIcon from "@mui/icons-material/Person";
import ViewHeadlineIcon from "@mui/icons-material/ViewHeadline";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import CloseIcon from "@mui/icons-material/Close";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";

// Camera view modes
const MODE_BOTH = "both";
const MODE_OPPONENT = "opponent";
const MODE_COMPACT = "compact";

// Widget dimensions per mode
const MODE_DIMENSIONS = {
    [MODE_BOTH]: { width: 176, height: 240 },
    [MODE_OPPONENT]: { width: 176, height: 126 },
    [MODE_COMPACT]: { width: 176, height: 44 },
};

// Spring physics constants
const SPRING_STIFFNESS = 200;
const SPRING_DAMPING = 25;
const SPRING_MASS = 1;
const SPRING_THRESHOLD = 0.5;
const CORNER_MARGIN = 16;
const TOOLBAR_HEIGHT = 48; // space above widget for hover toolbar

export function CameraWidget({
    localVideoRef,
    remoteVideoRef,
    isCameraOn,
    isMicOn,
    isLocalSpeaking,
    isRemoteSpeaking,
    remoteCameraOn,
    remoteMicOn,
    localPeerName,
    remotePeerName,
    localAvatar,
    remoteAvatar,
    panelARef,
    isVisible,
    localStream,
    remoteStream,
    recentlyJoinedRemote = false,
}) {
    const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const showJoinGlow = recentlyJoinedRemote && !prefersReducedMotion;
    const [mode, setMode] = useState(MODE_BOTH);
    const [hovered, setHovered] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);

    // Position state (bottom-right default, computed on mount)
    const [pos, setPos] = useState(null);
    const posRef = useRef(pos);
    useEffect(() => { posRef.current = pos; }, [pos]);

    const draggingRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
    const springAnimRef = useRef(null);

    const dims = MODE_DIMENSIONS[mode];

    // Compute initial position (bottom-right corner) — only on first valid mount
    useEffect(() => {
        if (!panelARef?.current || !isVisible) return;
        if (posRef.current !== null) return; // already initialized
        const rect = panelARef.current.getBoundingClientRect();
        setPos({
            x: rect.width - dims.width - CORNER_MARGIN,
            y: rect.height - dims.height - CORNER_MARGIN,
        });
    }, [panelARef, isVisible]);

    // Get four corner positions
    const getCorners = useCallback(() => {
        if (!panelARef?.current) return [];
        const rect = panelARef.current.getBoundingClientRect();
        const w = dims.width;
        const h = dims.height;
        return [
            { x: CORNER_MARGIN, y: CORNER_MARGIN },
            { x: rect.width - w - CORNER_MARGIN, y: CORNER_MARGIN },
            { x: CORNER_MARGIN, y: rect.height - h - CORNER_MARGIN },
            { x: rect.width - w - CORNER_MARGIN, y: rect.height - h - CORNER_MARGIN },
        ];
    }, [panelARef, dims.width, dims.height]);

    // Spring animation to snap to nearest corner — reads posRef to avoid stale closure
    const springTo = useCallback(
        (targetX, targetY) => {
            if (springAnimRef.current) cancelAnimationFrame(springAnimRef.current);

            let velX = 0;
            let velY = 0;
            let curX = posRef.current?.x ?? targetX;
            let curY = posRef.current?.y ?? targetY;
            let lastTime = performance.now();

            const step = (now) => {
                const dt = Math.min((now - lastTime) / 1000, 0.032);
                lastTime = now;

                const accX = ((targetX - curX) * SPRING_STIFFNESS) / SPRING_MASS - (velX * SPRING_DAMPING) / SPRING_MASS;
                const accY = ((targetY - curY) * SPRING_STIFFNESS) / SPRING_MASS - (velY * SPRING_DAMPING) / SPRING_MASS;

                velX += accX * dt;
                velY += accY * dt;
                curX += velX * dt;
                curY += velY * dt;

                setPos({ x: curX, y: curY });

                const settled =
                    Math.abs(velX) < SPRING_THRESHOLD &&
                    Math.abs(velY) < SPRING_THRESHOLD &&
                    Math.abs(targetX - curX) < SPRING_THRESHOLD &&
                    Math.abs(targetY - curY) < SPRING_THRESHOLD;

                if (settled) {
                    setPos({ x: targetX, y: targetY });
                    springAnimRef.current = null;
                } else {
                    springAnimRef.current = requestAnimationFrame(step);
                }
            };

            springAnimRef.current = requestAnimationFrame(step);
        },
        [], // no pos dependency — uses posRef
    );

    // Find nearest corner and spring to it — reads posRef to avoid stale closure
    const snapToNearestCorner = useCallback(() => {
        const corners = getCorners();
        const cur = posRef.current;
        if (!corners.length || !cur) return;

        const cx = cur.x + dims.width / 2;
        const cy = cur.y + dims.height / 2;

        let nearest = corners[0];
        let minDist = Infinity;
        for (const c of corners) {
            const dx = c.x + dims.width / 2 - cx;
            const dy = c.y + dims.height / 2 - cy;
            const dist = dx * dx + dy * dy;
            if (dist < minDist) {
                minDist = dist;
                nearest = c;
            }
        }
        springTo(nearest.x, nearest.y);
    }, [getCorners, dims.width, dims.height, springTo]);

    // Re-snap when mode changes
    useEffect(() => {
        if (posRef.current === null || !panelARef?.current) return;
        const id = setTimeout(() => snapToNearestCorner(), 50);
        return () => clearTimeout(id);
    }, [mode]);

    // Re-snap when Panel A resizes (e.g. horizontal splitter dragged)
    useEffect(() => {
        if (!panelARef?.current) return;
        const observer = new ResizeObserver(() => snapToNearestCorner());
        observer.observe(panelARef.current);
        return () => observer.disconnect();
    }, [panelARef, snapToNearestCorner]);

    // Drag handlers — bound to the inner widget body, not the outer hover wrapper
    const handleMouseDown = useCallback(
        (e) => {
            if (e.target.closest("button")) return;
            e.preventDefault();
            draggingRef.current = true;
            const cur = posRef.current;
            dragStartRef.current = { x: e.clientX, y: e.clientY, posX: cur?.x ?? 0, posY: cur?.y ?? 0 };

            const onMove = (me) => {
                if (!draggingRef.current || !panelARef?.current) return;
                const rect = panelARef.current.getBoundingClientRect();
                const dx = me.clientX - dragStartRef.current.x;
                const dy = me.clientY - dragStartRef.current.y;
                let newX = dragStartRef.current.posX + dx;
                let newY = dragStartRef.current.posY + dy;
                newX = Math.max(0, Math.min(newX, rect.width - dims.width));
                newY = Math.max(0, Math.min(newY, rect.height - dims.height));
                setPos({ x: newX, y: newY });
            };

            const onUp = () => {
                draggingRef.current = false;
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
                requestAnimationFrame(() => snapToNearestCorner());
            };

            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
        },
        [panelARef, dims.width, dims.height, snapToNearestCorner],
    );

    // Cleanup spring animation on unmount
    useEffect(() => {
        return () => {
            if (springAnimRef.current) cancelAnimationFrame(springAnimRef.current);
        };
    }, []);

    if (pos === null) return null;

    // If widget is near top edge, show toolbar below instead of above
    const toolbarBelow = pos.y < TOOLBAR_HEIGHT + 8;

    return (
        <>
            {/* Outer hover wrapper — encompasses toolbar + widget body */}
            <Box
                role="region"
                aria-label="Camera View"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                sx={{
                    position: "absolute",
                    top: toolbarBelow ? pos.y : pos.y - TOOLBAR_HEIGHT,
                    left: pos.x,
                    width: dims.width,
                    paddingTop: toolbarBelow ? 0 : `${TOOLBAR_HEIGHT}px`,
                    paddingBottom: toolbarBelow ? `${TOOLBAR_HEIGHT}px` : 0,
                    zIndex: 100,
                    cursor: "default",
                }}
            >
                {/* Hover toolbar — inside the outer wrapper, adapts position */}
                <Box
                    sx={{
                        position: "absolute",
                        ...(toolbarBelow
                            ? { bottom: TOOLBAR_HEIGHT - 40, left: "50%", transform: "translateX(-50%)" }
                            : { top: TOOLBAR_HEIGHT - 40, left: "50%", transform: "translateX(-50%)" }),
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        bgcolor: "rgba(0,0,0,0.7)",
                        borderRadius: "20px",
                        px: 1,
                        py: 0.5,
                        opacity: hovered ? 1 : 0,
                        pointerEvents: hovered ? "auto" : "none",
                        transition: "opacity 0.2s",
                    }}
                >
                    <IconButton
                        id="camera-mode-both"
                        size="small"
                        onClick={() => setMode(MODE_BOTH)}
                        aria-label="Both cameras"
                        sx={{
                            color: "#FFF",
                            bgcolor: mode === MODE_BOTH ? "rgba(255,255,255,0.25)" : "transparent",
                            "&:hover": { bgcolor: "rgba(255,255,255,0.15)" },
                            p: 0.5,
                        }}
                    >
                        <PeopleIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton
                        id="camera-mode-opponent"
                        size="small"
                        onClick={() => setMode(MODE_OPPONENT)}
                        aria-label="Opponent camera only"
                        sx={{
                            color: "#FFF",
                            bgcolor: mode === MODE_OPPONENT ? "rgba(255,255,255,0.25)" : "transparent",
                            "&:hover": { bgcolor: "rgba(255,255,255,0.15)" },
                            p: 0.5,
                        }}
                    >
                        <PersonIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton
                        id="camera-mode-compact"
                        size="small"
                        onClick={() => setMode(MODE_COMPACT)}
                        aria-label="Compact view"
                        sx={{
                            color: "#FFF",
                            bgcolor: mode === MODE_COMPACT ? "rgba(255,255,255,0.25)" : "transparent",
                            "&:hover": { bgcolor: "rgba(255,255,255,0.15)" },
                            p: 0.5,
                        }}
                    >
                        <ViewHeadlineIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                </Box>

                {/* Draggable widget body */}
                <Box
                    onMouseDown={handleMouseDown}
                    sx={{
                        width: dims.width,
                        height: dims.height,
                        position: "relative",
                        cursor: "grab",
                        userSelect: "none",
                        bgcolor: mode === MODE_BOTH || mode === MODE_OPPONENT ? "#111827" : "transparent",
                        borderRadius: mode === MODE_COMPACT ? "26px" : "12px",
                        overflow: "hidden",
                        transition: draggingRef.current ? "none" : "height 0.25s ease, width 0.25s ease",
                        "&:active": { cursor: "grabbing" },
                    }}
                >
                    {/* Fullscreen button */}
                    <IconButton
                        id="camera-btn-fullscreen"
                        size="small"
                        onClick={() => setFullscreen(true)}
                        aria-label="Fullscreen video"
                        sx={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            zIndex: 10,
                            color: "#FFF",
                            bgcolor: "rgba(0,0,0,0.5)",
                            opacity: hovered ? 1 : 0,
                            pointerEvents: hovered ? "auto" : "none",
                            transition: "opacity 0.2s",
                            "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                            p: 0.5,
                            display: mode === MODE_COMPACT ? "none" : "inline-flex",
                        }}
                    >
                        <FullscreenIcon sx={{ fontSize: 16 }} />
                    </IconButton>

                    {/*
                     * Remote video — rendered ONCE, layout adapts to mode via CSS.
                     * In MODE_BOTH: top half.  In MODE_OPPONENT: full.  In MODE_COMPACT: hidden.
                     */}
                    <Box
                        sx={{
                            position: mode === MODE_COMPACT ? "absolute" : "relative",
                            width: "100%",
                            height: mode === MODE_BOTH ? "50%" : "100%",
                            p: mode === MODE_BOTH ? 0.75 : 0,
                            pb: mode === MODE_BOTH ? 0.375 : 0,
                            display: mode === MODE_COMPACT ? "none" : "block",
                        }}
                    >
                        <Box
                            sx={{
                                position: "relative",
                                width: "100%",
                                height: "100%",
                                borderRadius: "10px",
                                overflow: "hidden",
                                bgcolor: "#1F2937",
                                border: showJoinGlow
                                    ? (theme) => `2px solid ${theme.palette.success.main}`
                                    : isRemoteSpeaking
                                    ? "2px solid #A3E635"
                                    : "2px solid transparent",
                                boxShadow: showJoinGlow
                                    ? (theme) => `0 0 0 4px ${theme.palette.success.main}33`
                                    : "none",
                                transition: "border-color 0.2s, box-shadow 0.2s",
                            }}
                        >
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: remoteCameraOn ? "block" : "none",
                                }}
                            />
                            {!remoteCameraOn && (
                                <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#1F2937" }}>
                                    <Avatar src={remoteAvatar} sx={{ width: 40, height: 40, fontSize: 18 }}>
                                        {remotePeerName?.[0] || "?"}
                                    </Avatar>
                                </Box>
                            )}
                            <Box sx={{ position: "absolute", bottom: 4, left: 4, bgcolor: "rgba(0,0,0,0.6)", px: 0.75, py: 0.25, borderRadius: 1 }}>
                                <Typography variant="caption" sx={{ color: "#FFF", fontSize: "0.72rem", fontWeight: 700 }}>
                                    {remotePeerName || "Peer"}
                                </Typography>
                            </Box>
                            <Box sx={{ position: "absolute", top: 4, right: 4 }}>
                                {remoteMicOn ? <MicIcon sx={{ color: "#10B981", fontSize: 14 }} /> : <MicOffIcon sx={{ color: "#EF4444", fontSize: 14 }} />}
                            </Box>
                        </Box>
                    </Box>

                    {/*
                     * Local video — rendered ONCE.
                     * In MODE_BOTH: bottom half.  In MODE_OPPONENT / MODE_COMPACT: hidden.
                     */}
                    <Box
                        sx={{
                            position: "relative",
                            width: "100%",
                            height: "50%",
                            p: 0.75,
                            pt: 0.375,
                            display: mode === MODE_BOTH ? "block" : "none",
                        }}
                    >
                        <Box
                            sx={{
                                position: "relative",
                                width: "100%",
                                height: "100%",
                                borderRadius: "10px",
                                overflow: "hidden",
                                bgcolor: "#1F2937",
                                border: isLocalSpeaking ? "2px solid #A3E635" : "2px solid transparent",
                                transition: "border-color 0.2s",
                            }}
                        >
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: isCameraOn ? "block" : "none",
                                }}
                            />
                            {!isCameraOn && (
                                <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#1F2937" }}>
                                    <Avatar src={localAvatar} sx={{ width: 40, height: 40, fontSize: 18 }}>
                                        {localPeerName?.[0] || "?"}
                                    </Avatar>
                                </Box>
                            )}
                            <Box sx={{ position: "absolute", bottom: 4, left: 4, bgcolor: "rgba(0,0,0,0.6)", px: 0.75, py: 0.25, borderRadius: 1 }}>
                                <Typography variant="caption" sx={{ color: "#FFF", fontSize: "0.72rem", fontWeight: 700 }}>
                                    {localPeerName && localPeerName !== "You" ? `${localPeerName} (You)` : "You"}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* Mode: Compact — status bar (no video elements, just info) */}
                    <Box
                        sx={{
                            display: mode === MODE_COMPACT ? "flex" : "none",
                            alignItems: "center",
                            gap: 1,
                            height: "100%",
                            bgcolor: "rgba(0,0,0,0.75)",
                            borderRadius: "26px",
                            px: 1.5,
                        }}
                    >
                        <Avatar src={remoteAvatar} sx={{ width: 32, height: 32, fontSize: 14 }}>
                            {remotePeerName?.[0] || "?"}
                        </Avatar>
                        <Typography
                            variant="caption"
                            sx={{
                                color: "#FFF",
                                fontWeight: 600,
                                flex: 1,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                fontSize: "0.7rem",
                            }}
                        >
                            {remotePeerName || "Peer"}
                        </Typography>
                        {remoteMicOn ? (
                            <MicIcon sx={{ color: "#10B981", fontSize: 16 }} />
                        ) : (
                            <MicOffIcon sx={{ color: "#EF4444", fontSize: 16 }} />
                        )}
                        {remoteCameraOn ? (
                            <VideocamIcon sx={{ color: "#10B981", fontSize: 16 }} />
                        ) : (
                            <VideocamOffIcon sx={{ color: "#EF4444", fontSize: 16 }} />
                        )}
                    </Box>
                </Box>
            </Box>

            {/* Fullscreen overlay — wide peer + small user PiP bottom-right */}
            {fullscreen && (
                <Box
                    sx={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 9999,
                        bgcolor: "#111827",
                        p: 2,
                        display: "flex",
                    }}
                >
                    {/* Remote — padded with rounded border */}
                    <Box
                        sx={{
                            flex: 1,
                            position: "relative",
                            borderRadius: "16px",
                            overflow: "hidden",
                            border: showJoinGlow
                                ? (theme) => `2px solid ${theme.palette.success.main}`
                                : "2px solid #374151",
                            boxShadow: showJoinGlow
                                ? (theme) => `0 0 0 6px ${theme.palette.success.main}33`
                                : "none",
                            bgcolor: "#1F2937",
                            transition: "border-color 0.2s, box-shadow 0.2s",
                        }}
                    >
                        <video
                            autoPlay
                            playsInline
                            ref={(el) => { if (el && remoteStream) el.srcObject = remoteStream; }}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        {!remoteCameraOn && (
                            <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#1F2937" }}>
                                <Avatar src={remoteAvatar} sx={{ width: 96, height: 96, fontSize: 40 }}>
                                    {remotePeerName?.[0]}
                                </Avatar>
                            </Box>
                        )}
                        <Box sx={{ position: "absolute", bottom: 12, left: 12, bgcolor: "rgba(0,0,0,0.6)", px: 1.5, py: 0.5, borderRadius: 2 }}>
                            <Typography sx={{ color: "#FFF", fontWeight: 700, fontSize: "0.85rem" }}>{remotePeerName || "Peer"}</Typography>
                        </Box>
                    </Box>

                    {/* Local — PiP bottom-right */}
                    <Box
                        sx={{
                            position: "absolute",
                            bottom: 24,
                            right: 24,
                            width: 200,
                            borderRadius: "12px",
                            overflow: "hidden",
                            aspectRatio: "16/9",
                            border: isLocalSpeaking ? "2px solid #A3E635" : "2px solid rgba(255,255,255,0.3)",
                            bgcolor: "#374151",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                        }}
                    >
                        <video
                            autoPlay
                            playsInline
                            muted
                            ref={(el) => { if (el && localStream) el.srcObject = localStream; }}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: isCameraOn ? "block" : "none" }}
                        />
                        {!isCameraOn && (
                            <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Avatar src={localAvatar} sx={{ width: 48, height: 48, fontSize: 20 }}>
                                    {localPeerName?.[0]}
                                </Avatar>
                            </Box>
                        )}
                    </Box>

                    <IconButton
                        onClick={() => setFullscreen(false)}
                        aria-label="Close fullscreen"
                        sx={{
                            position: "absolute",
                            top: 24,
                            right: 24,
                            color: "#FFF",
                            bgcolor: "rgba(255,255,255,0.15)",
                            "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
            )}
        </>
    );
}
