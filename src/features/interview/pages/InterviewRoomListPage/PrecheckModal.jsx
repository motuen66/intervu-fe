import { useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Avatar,
    Box,
    CircularProgress,
    Dialog,
    DialogContent,
    FormControl,
    IconButton,
    LinearProgress,
    MenuItem,
    Stack,
    Typography,
    useTheme,
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
    ErrorOutline,
} from "@mui/icons-material";
import usePrecheckDevices from "./usePrecheckDevices";
import { STATUS_MSG } from "../../constants/mediaConfig";
import FormSelect from "../../../../common/components/form/FormSelect";

// ─── Volume Meter Bar ────────────────────────────────────────────────────────
function VolumeMeter({ level, isActive }) {
    const theme = useTheme();
    return (
        <Box sx={{ width: "100%", mt: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
                <Mic sx={{ fontSize: 16, color: isActive ? "success.main" : "text.disabled" }} />
                <Box sx={{ flex: 1 }}>
                    <LinearProgress
                        variant="determinate"
                        value={isActive ? level : 0}
                        sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: theme.palette.action.disabledBackground,
                            "& .MuiLinearProgress-bar": {
                                borderRadius: 4,
                                bgcolor:
                                    level > 70
                                        ? theme.palette.success.main
                                        : level > 30
                                          ? theme.palette.secondary.dark
                                          : theme.palette.text.disabled,
                                transition: "transform 0.08s linear",
                            },
                        }}
                    />
                </Box>
                <Typography variant="caption" sx={{ minWidth: 28, textAlign: "right", color: "text.secondary" }}>
                    {isActive ? `${level}%` : "—"}
                </Typography>
            </Stack>
        </Box>
    );
}

// ─── Device Selector Dropdown ────────────────────────────────────────────────
function DeviceSelector({ label, devices, value, onChange, disabled }) {
    const theme = useTheme();
    if (!devices.length) return null;

    return (
        <FormControl size="small" fullWidth>
            <Typography
                sx={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    color: "text.disabled",
                    mb: 0.5,
                }}
            >
                {label}
            </Typography>
            <FormSelect
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                displayEmpty
                sx={{
                    fontSize: 13,
                    fontWeight: 600,
                    bgcolor: theme.palette.background.paper,
                    "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.divider,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.text.secondary,
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.primary.main,
                    },
                }}
            >
                {devices.map((d) => (
                    <MenuItem key={d.deviceId} value={d.deviceId} sx={{ fontSize: 13 }}>
                        {d.label || `Device ${d.deviceId.slice(0, 8)}…`}
                    </MenuItem>
                ))}
            </FormSelect>
        </FormControl>
    );
}

// ─── Permission Denied Banner ────────────────────────────────────────────────
function PermissionBanner({ type }) {
    const theme = useTheme();
    const label = type === "camera" ? "Camera" : "Microphone";
    return (
        <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{
                px: 1.5,
                py: 1,
                borderRadius: 2,
                bgcolor: `${theme.palette.error.main}10`,
                border: `1px solid ${theme.palette.error.light}`,
                mt: 1,
            }}
        >
            <ErrorOutline sx={{ fontSize: 18, color: "error.main" }} />
            <Typography variant="caption" sx={{ color: "error.main", fontWeight: 600 }}>
                {label} permission denied. Allow access in your browser settings and reload.
            </Typography>
        </Stack>
    );
}

// ─── Status Row ──────────────────────────────────────────────────────────────
function StatusRow({ icon: Icon, label, status, action }) {
    return (
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
                {status.message === STATUS_MSG.CHECKING || status.message === STATUS_MSG.NOT_TESTED ? (
                    <CircularProgress size={18} sx={{ color: "text.disabled" }} />
                ) : status.ok ? (
                    <CheckCircle sx={{ fontSize: 20, color: "success.main" }} />
                ) : (
                    <Warning sx={{ fontSize: 20, color: "warning.main" }} />
                )}
            </Stack>
        </Stack>
    );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────
function PrecheckModal({ open, onClose, room }) {
    const navigate = useNavigate();
    const theme = useTheme();
    const hasRunRef = useRef(false);

    const {
        videoRef,
        cameraStatus,
        isCameraPreviewOn,
        selectedCam,
        setSelectedCam,
        toggleCameraPreview,
        micStatus,
        isMicOn,
        selectedMic,
        setSelectedMic,
        toggleMic,
        volumeLevel,
        speakerStatus,
        testSpeaker,
        networkStatus,
        devices,
        isTesting,
        runAllChecks,
        stopAll,
        reset,
        permissionDenied,
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
                    {/* LEFT COLUMN — Camera Preview + Device Selectors */}
                    <Box sx={{ flex: 1.2 }}>
                        {/* Video preview */}
                        <Box
                            sx={{
                                position: "relative",
                                width: "100%",
                                aspectRatio: "16 / 9",
                                bgcolor: theme.palette.primary.dark,
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

                            {/* Camera-off / Permission-denied overlay */}
                            {!cameraStatus.ok && (
                                <Stack
                                    spacing={0.5}
                                    alignItems="center"
                                    justifyContent="center"
                                    sx={{
                                        position: "absolute",
                                        inset: 0,
                                        color: theme.palette.text.disabled,
                                    }}
                                >
                                    {permissionDenied.camera ? (
                                        <>
                                            <ErrorOutline sx={{ fontSize: 36 }} />
                                            <Typography variant="caption" sx={{ color: theme.palette.error.light }}>
                                                Camera access denied
                                            </Typography>
                                        </>
                                    ) : (
                                        <>
                                            <VideocamOff sx={{ fontSize: 36 }} />
                                            <Typography variant="caption">Camera preview unavailable</Typography>
                                        </>
                                    )}
                                </Stack>
                            )}

                            {/* LIVE badge */}
                            {cameraStatus.ok && (
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
                                        <FiberManualRecord
                                            sx={{ color: theme.palette.secondary.dark, fontSize: 10 }}
                                        />
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: theme.palette.primary.contrastText,
                                                fontWeight: 700,
                                                fontSize: 11,
                                            }}
                                        >
                                            LIVE
                                        </Typography>
                                    </Stack>
                                </Box>
                            )}

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
                                    disabled={permissionDenied.camera}
                                    sx={{
                                        width: 44,
                                        height: 34,
                                        borderRadius: 1.8,
                                        color: theme.palette.primary.contrastText,
                                        bgcolor: isCameraPreviewOn
                                            ? "rgba(16,185,129,0.25)"
                                            : `${theme.palette.error.main}40`,
                                        "&:hover": {
                                            bgcolor: isCameraPreviewOn
                                                ? "rgba(16,185,129,0.4)"
                                                : `${theme.palette.error.main}66`,
                                        },
                                    }}
                                >
                                    {isCameraPreviewOn ? (
                                        <Videocam fontSize="small" />
                                    ) : (
                                        <VideocamOff fontSize="small" />
                                    )}
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={toggleMic}
                                    disabled={permissionDenied.mic}
                                    sx={{
                                        width: 44,
                                        height: 34,
                                        borderRadius: 1.8,
                                        color: theme.palette.primary.contrastText,
                                        bgcolor: isMicOn
                                            ? "rgba(16,185,129,0.25)"
                                            : `${theme.palette.error.main}40`,
                                        "&:hover": {
                                            bgcolor: isMicOn
                                                ? "rgba(16,185,129,0.4)"
                                                : `${theme.palette.error.main}66`,
                                        },
                                    }}
                                >
                                    {isMicOn ? <Mic fontSize="small" /> : <MicOff fontSize="small" />}
                                </IconButton>
                            </Stack>
                        </Box>

                        {/* Volume Meter */}
                        <VolumeMeter level={volumeLevel} isActive={isMicOn} />

                        {/* Permission Denied Banners */}
                        {permissionDenied.camera && <PermissionBanner type="camera" />}
                        {permissionDenied.mic && <PermissionBanner type="mic" />}

                        {/* Device Selection Dropdowns */}
                        <Stack direction="row" spacing={1.5} sx={{ mt: 1.5 }}>
                            <Box sx={{ flex: 1 }}>
                                <DeviceSelector
                                    label="CAMERA"
                                    devices={devices.cameras}
                                    value={selectedCam}
                                    onChange={setSelectedCam}
                                    disabled={permissionDenied.camera}
                                />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <DeviceSelector
                                    label="MICROPHONE"
                                    devices={devices.microphones}
                                    value={selectedMic}
                                    onChange={setSelectedMic}
                                    disabled={permissionDenied.mic}
                                />
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
                                            color: theme.palette.secondary.dark,
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
                                bgcolor: theme.palette.primary.main,
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
                                        bgcolor: theme.palette.primary.light,
                                        color: theme.palette.primary.contrastText,
                                        fontWeight: 700,
                                        fontSize: 16,
                                    }}
                                >
                                    {coachInitial}
                                </Avatar>
                                <Box>
                                    <Typography
                                        sx={{
                                            color: theme.palette.primary.contrastText,
                                            fontWeight: 700,
                                            fontSize: 14,
                                        }}
                                    >
                                        {coachName}
                                    </Typography>
                                    <Typography
                                        sx={{
                                            color: theme.palette.secondary.dark,
                                            fontWeight: 700,
                                            fontSize: 10,
                                            letterSpacing: "0.08em",
                                        }}
                                    >
                                        INTERVIEW COACH
                                    </Typography>
                                </Box>
                            </Stack>

                            <Stack direction="row" spacing={2} sx={{ mt: 1.75 }}>
                                {[
                                    { title: "DATE", value: dateLabel },
                                    { title: "TIME", value: timeLabel },
                                    { title: "DUR", value: durationLabel },
                                ].map(({ title, value }) => (
                                    <Box key={title}>
                                        <Typography
                                            sx={{
                                                fontSize: 9,
                                                fontWeight: 600,
                                                color: theme.palette.text.secondary,
                                                letterSpacing: "0.08em",
                                            }}
                                        >
                                            {title}
                                        </Typography>
                                        <Typography
                                            sx={{
                                                color: theme.palette.primary.contrastText,
                                                fontSize: 13,
                                                fontWeight: 600,
                                            }}
                                        >
                                            {value}
                                        </Typography>
                                    </Box>
                                ))}
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
                                bgcolor: theme.palette.secondary.dark,
                                color: theme.palette.secondary.contrastText,
                                fontFamily: "inherit",
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
                                    bgcolor: theme.palette.secondary.main,
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
