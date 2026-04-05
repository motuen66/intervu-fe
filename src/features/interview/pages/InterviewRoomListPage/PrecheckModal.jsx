import { useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Avatar,
    Box,
    CircularProgress,
    Dialog,
    DialogContent,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";
import {
    Close,
    FiberManualRecord,
    Mic,
    MicOff,
    Videocam,
    VideocamOff,
    VolumeUp,
    Wifi,
    CheckCircle,
    Warning,
    PlayArrow,
    ArrowForward,
    Settings,
} from "@mui/icons-material";
import usePrecheckDevices from "./usePrecheckDevices";

function PrecheckModal({ open, onClose, room }) {
    const navigate = useNavigate();
    const hasRunRef = useRef(false);

    const {
        videoRef,
        cameraStatus,
        isCameraPreviewOn,
        toggleCameraPreview,
        micStatus,
        isMicOn,
        toggleMic,
        speakerStatus,
        testSpeaker,
        networkStatus,
        devices,
        isTesting,
        runAllChecks,
        stopAll,
        reset,
    } = usePrecheckDevices();

    // Auto-run checks when modal opens
    useEffect(() => {
        if (open && room && !hasRunRef.current) {
            hasRunRef.current = true;
            runAllChecks();
        }
        if (!open) {
            hasRunRef.current = false;
        }
    }, [open, room, runAllChecks]);

    // Cleanup streams on close
    useEffect(() => {
        if (!open) {
            stopAll();
            reset();
        }
    }, [open, stopAll, reset]);

    const allChecksReady = cameraStatus.ok && micStatus.ok && networkStatus.ok;

    const handleJoinRoom = () => {
        stopAll();
        navigate(`/interview/room/${room.id}`, {
            state: { initialCameraOn: isCameraPreviewOn, initialMicOn: isMicOn },
        });
        onClose();
    };

    const coachName = room?.coachName || "Coach";
    const coachInitial = coachName.charAt(0).toUpperCase();

    const scheduledDate = useMemo(() => {
        if (!room?.scheduledTime) return null;
        try {
            return new Date(room.scheduledTime);
        } catch {
            return null;
        }
    }, [room?.scheduledTime]);

    const dateLabel = scheduledDate
        ? scheduledDate.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
        : "—";
    const timeLabel = scheduledDate
        ? scheduledDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
        : "—";
    const durationLabel = `${room?.durationMinutes || 60}m`;

    const selectedCamLabel = devices.cameras.find((d) => d.deviceId === (devices.cameras[0]?.deviceId || ""))?.label || "Camera";
    const selectedMicLabel = devices.microphones.find((d) => d.deviceId === (devices.microphones[0]?.deviceId || ""))?.label || "Microphone";

    const StatusRow = ({ icon: Icon, label, status, action }) => (
        <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ py: 1.25, px: 0.5 }}
        >
            <Stack direction="row" alignItems="center" spacing={1.25}>
                <Icon sx={{ fontSize: 20, color: "text.secondary" }} />
                <Typography variant="body2" fontWeight={600}>
                    {label}
                </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
                {action}
                {status.message === "Checking..." || status.message === "Not tested" ? (
                    <CircularProgress size={18} sx={{ color: "text.disabled" }} />
                ) : status.ok ? (
                    <CheckCircle sx={{ fontSize: 20, color: "success.main" }} />
                ) : (
                    <Warning sx={{ fontSize: 20, color: "warning.main" }} />
                )}
            </Stack>
        </Stack>
    );

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            disableEscapeKeyDown={false}
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    overflow: "hidden",
                    maxHeight: "90vh",
                },
            }}
        >
            {/* Header */}
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ px: 3, pt: 2.5, pb: 1 }}
            >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Videocam sx={{ fontSize: 22, color: "text.primary" }} />
                    <Box>
                        <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                            Pre-check Session
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Ensure your devices are ready
                        </Typography>
                    </Box>
                </Stack>
                <IconButton onClick={onClose} size="small">
                    <Close />
                </IconButton>
            </Stack>

            <DialogContent sx={{ px: 3, pb: 3, pt: 1.5 }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
                    {/* LEFT COLUMN — Camera Preview */}
                    <Box sx={{ flex: 1.2 }}>
                        <Box
                            sx={{
                                position: "relative",
                                width: "100%",
                                aspectRatio: "16 / 9",
                                bgcolor: "#020617",
                                borderRadius: 3,
                                overflow: "hidden",
                            }}
                        >
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    transform: "scaleX(-1)",
                                }}
                            />

                            {!cameraStatus.ok && (
                                <Stack
                                    spacing={0.5}
                                    alignItems="center"
                                    justifyContent="center"
                                    sx={{
                                        position: "absolute",
                                        inset: 0,
                                        color: "#94a3b8",
                                    }}
                                >
                                    <VideocamOff sx={{ fontSize: 36 }} />
                                    <Typography variant="caption">Camera preview unavailable</Typography>
                                </Stack>
                            )}

                            {/* LIVE badge */}
                            <Box
                                sx={{
                                    position: "absolute",
                                    left: 12,
                                    top: 12,
                                    px: 1,
                                    py: 0.3,
                                    borderRadius: 999,
                                    bgcolor: "rgba(15,23,42,0.6)",
                                    border: "1px solid rgba(255,255,255,0.15)",
                                    backdropFilter: "blur(6px)",
                                }}
                            >
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                    <FiberManualRecord sx={{ color: "#a3e635", fontSize: 10 }} />
                                    <Typography variant="caption" sx={{ color: "#f8fafc", fontWeight: 700, fontSize: 11 }}>
                                        LIVE
                                    </Typography>
                                </Stack>
                            </Box>

                            {/* Camera / Mic toggle pill */}
                            <Stack
                                direction="row"
                                spacing={0.75}
                                sx={{
                                    position: "absolute",
                                    left: "50%",
                                    bottom: 12,
                                    transform: "translateX(-50%)",
                                    p: 0.5,
                                    borderRadius: 999,
                                    bgcolor: "rgba(15,23,42,0.6)",
                                    border: "1px solid rgba(255,255,255,0.15)",
                                    backdropFilter: "blur(6px)",
                                }}
                            >
                                <IconButton
                                    size="small"
                                    onClick={toggleCameraPreview}
                                    sx={{
                                        width: 44,
                                        height: 34,
                                        borderRadius: 1.8,
                                        color: "#f8fafc",
                                        bgcolor: isCameraPreviewOn ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)",
                                        "&:hover": {
                                            bgcolor: isCameraPreviewOn ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)",
                                        },
                                    }}
                                >
                                    {isCameraPreviewOn ? <Videocam fontSize="small" /> : <VideocamOff fontSize="small" />}
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={toggleMic}
                                    sx={{
                                        width: 44,
                                        height: 34,
                                        borderRadius: 1.8,
                                        color: "#f8fafc",
                                        bgcolor: isMicOn ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)",
                                        "&:hover": {
                                            bgcolor: isMicOn ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)",
                                        },
                                    }}
                                >
                                    {isMicOn ? <Mic fontSize="small" /> : <MicOff fontSize="small" />}
                                </IconButton>
                            </Stack>
                        </Box>

                        {/* Device name chips */}
                        <Stack direction="row" spacing={1.5} sx={{ mt: 1.5 }}>
                            <Box
                                sx={{
                                    flex: 1,
                                    px: 1.5,
                                    py: 1,
                                    borderRadius: 2,
                                    border: "1px solid",
                                    borderColor: "divider",
                                    bgcolor: "background.paper",
                                }}
                            >
                                <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "text.disabled", mb: 0.25 }}>
                                    CAMERA
                                </Typography>
                                <Typography variant="body2" fontWeight={600} noWrap>
                                    {selectedCamLabel}
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    flex: 1,
                                    px: 1.5,
                                    py: 1,
                                    borderRadius: 2,
                                    border: "1px solid",
                                    borderColor: "divider",
                                    bgcolor: "background.paper",
                                }}
                            >
                                <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "text.disabled", mb: 0.25 }}>
                                    MIC
                                </Typography>
                                <Typography variant="body2" fontWeight={600} noWrap>
                                    {selectedMicLabel}
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>

                    {/* RIGHT COLUMN — Status + Room Info + Join */}
                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                        {/* STATUS section */}
                        <Box
                            sx={{
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 2.5,
                                px: 2,
                                py: 0.5,
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    letterSpacing: "0.12em",
                                    color: "text.disabled",
                                    pt: 1,
                                    pb: 0.25,
                                }}
                            >
                                STATUS
                            </Typography>

                            <StatusRow icon={Videocam} label="Camera" status={cameraStatus} />
                            <Box sx={{ borderTop: "1px solid", borderColor: "divider" }} />
                            <StatusRow icon={Mic} label="Microphone" status={micStatus} />
                            <Box sx={{ borderTop: "1px solid", borderColor: "divider" }} />
                            <StatusRow
                                icon={VolumeUp}
                                label="Speaker"
                                status={speakerStatus}
                                action={
                                    <Typography
                                        component="button"
                                        onClick={testSpeaker}
                                        sx={{
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.25,
                                            color: "#a3e635",
                                            fontWeight: 700,
                                            fontSize: 12,
                                            p: 0,
                                            "&:hover": { textDecoration: "underline" },
                                        }}
                                    >
                                        <PlayArrow sx={{ fontSize: 14 }} />
                                        TEST
                                    </Typography>
                                }
                            />
                            <Box sx={{ borderTop: "1px solid", borderColor: "divider" }} />
                            <StatusRow icon={Wifi} label="Network" status={networkStatus} />
                        </Box>

                        {/* Room info card */}
                        <Box
                            sx={{
                                mt: 2,
                                bgcolor: "#0f172a",
                                borderRadius: 2.5,
                                px: 2.25,
                                py: 2,
                            }}
                        >
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <Avatar
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        bgcolor: "#334155",
                                        color: "#f8fafc",
                                        fontWeight: 700,
                                        fontSize: 16,
                                    }}
                                >
                                    {coachInitial}
                                </Avatar>
                                <Box>
                                    <Typography sx={{ color: "#f8fafc", fontWeight: 700, fontSize: 14 }}>
                                        {coachName}
                                    </Typography>
                                    <Typography sx={{ color: "#a3e635", fontWeight: 700, fontSize: 10, letterSpacing: "0.08em" }}>
                                        INTERVIEW COACH
                                    </Typography>
                                </Box>
                            </Stack>

                            <Stack direction="row" spacing={2} sx={{ mt: 1.75 }}>
                                <Box>
                                    <Typography sx={{ fontSize: 9, fontWeight: 600, color: "#64748b", letterSpacing: "0.08em" }}>
                                        DATE
                                    </Typography>
                                    <Typography sx={{ color: "#f8fafc", fontSize: 13, fontWeight: 600 }}>
                                        {dateLabel}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography sx={{ fontSize: 9, fontWeight: 600, color: "#64748b", letterSpacing: "0.08em" }}>
                                        TIME
                                    </Typography>
                                    <Typography sx={{ color: "#f8fafc", fontSize: 13, fontWeight: 600 }}>
                                        {timeLabel}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography sx={{ fontSize: 9, fontWeight: 600, color: "#64748b", letterSpacing: "0.08em" }}>
                                        DUR
                                    </Typography>
                                    <Typography sx={{ color: "#f8fafc", fontSize: 13, fontWeight: 600 }}>
                                        {durationLabel}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>

                        {/* Join Room button */}
                        <Box
                            component="button"
                            onClick={handleJoinRoom}
                            disabled={isTesting}
                            sx={{
                                mt: 2,
                                width: "100%",
                                py: 1.5,
                                border: "none",
                                borderRadius: 2,
                                bgcolor: "#a3e635",
                                color: "#0f172a",
                                fontWeight: 800,
                                fontSize: 16,
                                cursor: isTesting ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 1,
                                opacity: isTesting ? 0.6 : 1,
                                transition: "opacity 150ms, background-color 150ms",
                                "&:hover:not(:disabled)": {
                                    bgcolor: "#bef264",
                                },
                            }}
                        >
                            Join Room
                            <ArrowForward sx={{ fontSize: 20 }} />
                        </Box>

                        {/* Caption */}
                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="center"
                            spacing={0.5}
                            sx={{ mt: 1.25 }}
                        >
                            <Settings sx={{ fontSize: 13, color: "text.disabled" }} />
                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: 11 }}>
                                Settings can be adjusted inside
                            </Typography>
                        </Stack>
                    </Box>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}

export default PrecheckModal;
