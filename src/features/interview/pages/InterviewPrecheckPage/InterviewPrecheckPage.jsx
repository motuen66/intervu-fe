import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Alert,
    Avatar,
    Box,
    Button,
    CircularProgress,
    FormControl,
    IconButton,
    MenuItem,
    Select,
    Stack,
    Typography,
} from "@mui/material";
import {
    AccessTime,
    Assignment,
    FiberManualRecord,
    KeyboardArrowDown,
    Mic,
    MicOff,
    VideocamOff,
    Videocam,
} from "@mui/icons-material";
import BaseCard from "../../../../common/components/cards/BaseCard";
import { SecondaryButton } from "../../../../common/components/buttons";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { INTERVIEW_ROOM_STATUS } from "../../../../common/constants/status";
import { formattedDateTime } from "../../../../common/utils/dateFormatter";

function InterviewPrecheckPage() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const cameraStreamRef = useRef(null);
    const micStreamRef = useRef(null);
    const hasAutoTestedRef = useRef(false);

    const [room, setRoom] = useState(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [pageError, setPageError] = useState("");
    const [isTesting, setIsTesting] = useState(false);
    const [cameraStatus, setCameraStatus] = useState({ ok: false, message: "Not tested" });
    const [micStatus, setMicStatus] = useState({ ok: false, message: "Not tested" });
    const [speakerStatus, setSpeakerStatus] = useState({ ok: true, message: "Speaker looks ready." });
    const [audioDetected, setAudioDetected] = useState(false);
    const [devices, setDevices] = useState({
        microphones: [],
        cameras: [],
        speakers: [],
    });
    const [selectedMic, setSelectedMic] = useState("");
    const [selectedCam, setSelectedCam] = useState("");
    const [selectedSpeaker, setSelectedSpeaker] = useState("");
    const [isCameraPreviewOn, setIsCameraPreviewOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(false);

    const interviewTitle = useMemo(() => {
        return room?.problemShortName || room?.title || room?.interviewTypeName || "Interview Session";
    }, [room]);

    const interviewTimeFromDb = useMemo(() => {
        const dbTime =
            room?.actualStartTime ||
            room?.startTime ||
            room?.scheduledTime ||
            room?.updatedAt ||
            room?.createdAt ||
            null;

        return dbTime ? formattedDateTime(dbTime) : "Schedule not available";
    }, [room]);

    const stopCameraPreview = useCallback(() => {
        if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach((track) => track.stop());
            cameraStreamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    const stopMicCapture = useCallback(() => {
        if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach((track) => track.stop());
            micStreamRef.current = null;
        }
    }, []);

    const loadDeviceLists = useCallback(async () => {
        if (!navigator.mediaDevices?.enumerateDevices) {
            return;
        }

        try {
            const all = await navigator.mediaDevices.enumerateDevices();
            const microphones = all.filter((item) => item.kind === "audioinput");
            const cameras = all.filter((item) => item.kind === "videoinput");
            const speakers = all.filter((item) => item.kind === "audiooutput");

            setDevices({ microphones, cameras, speakers });

            if (!selectedMic && microphones[0]?.deviceId) {
                setSelectedMic(microphones[0].deviceId);
            }
            if (!selectedCam && cameras[0]?.deviceId) {
                setSelectedCam(cameras[0].deviceId);
            }
            if (!selectedSpeaker && speakers[0]?.deviceId) {
                setSelectedSpeaker(speakers[0].deviceId);
            }
        } catch (err) {
            // Ignore enumerate errors because getUserMedia result is still enough for this pre-check flow.
        }
    }, [selectedCam, selectedMic, selectedSpeaker]);

    const testCamera = useCallback(async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraStatus({ ok: false, message: "Camera test is not supported on this browser." });
            return;
        }

        try {
            stopCameraPreview();
            const stream = await navigator.mediaDevices.getUserMedia({
                video: selectedCam ? { deviceId: { exact: selectedCam } } : true,
            });
            cameraStreamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play().catch(() => undefined);
            }

            setCameraStatus({ ok: true, message: "Camera is ready." });
            setIsCameraPreviewOn(true);
        } catch (err) {
            setCameraStatus({ ok: false, message: "Cannot access camera. Please check browser/device permissions." });
            setIsCameraPreviewOn(false);
        }
    }, [selectedCam, stopCameraPreview]);

    const toggleCameraPreview = useCallback(async () => {
        if (cameraStreamRef.current) {
            stopCameraPreview();
            setIsCameraPreviewOn(false);
            setCameraStatus({ ok: false, message: "Camera preview is off." });
            return;
        }

        await testCamera();
    }, [stopCameraPreview, testCamera]);

    const toggleMic = useCallback(async () => {
        if (micStreamRef.current) {
            stopMicCapture();
            setIsMicOn(false);
            setAudioDetected(false);
            setMicStatus({ ok: false, message: "Microphone is off." });
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            setMicStatus({ ok: false, message: "Microphone test is not supported on this browser." });
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: selectedMic ? { deviceId: { exact: selectedMic } } : true,
            });
            micStreamRef.current = stream;
            setIsMicOn(true);
            setAudioDetected(true);
            setMicStatus({ ok: true, message: "Microphone is on." });
        } catch (err) {
            setIsMicOn(false);
            setAudioDetected(false);
            setMicStatus({ ok: false, message: "Cannot access microphone. Please check browser/device permissions." });
        }
    }, [selectedMic, stopMicCapture]);

    const testMic = useCallback(async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setMicStatus({ ok: false, message: "Microphone test is not supported on this browser." });
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: selectedMic ? { deviceId: { exact: selectedMic } } : true,
            });
            const audioTrack = stream.getAudioTracks()[0];
            setAudioDetected(Boolean(audioTrack?.enabled));
            stream.getTracks().forEach((track) => track.stop());
            setMicStatus({ ok: true, message: "Microphone is ready." });
        } catch (err) {
            setAudioDetected(false);
            setMicStatus({ ok: false, message: "Cannot access microphone. Please check browser/device permissions." });
        }
    }, [selectedMic]);

    const testSpeaker = useCallback(async () => {
        setSpeakerStatus({
            ok: true,
            message: selectedSpeaker
                ? "Speaker selected and ready."
                : "Default speaker selected.",
        });
    }, [selectedSpeaker]);

    const runDeviceChecks = useCallback(async () => {
        setIsTesting(true);
        await Promise.allSettled([testCamera(), testMic(), testSpeaker()]);
        await loadDeviceLists();
        setIsTesting(false);
    }, [loadDeviceLists, testCamera, testMic, testSpeaker]);

    const fetchRoomAndValidate = useCallback(async ({ showPageLoading = true } = {}) => {
        if (showPageLoading) {
            setPageLoading(true);
        }
        setPageError("");

        try {
            const res = await callApi({
                method: METHOD.GET,
                endpoint: "/interviewroom",
            });

            const foundRoom = res.data?.find((item) => item.id === roomId);
            if (!foundRoom) {
                setPageError("Interview room was not found. Redirecting...");
                setTimeout(() => navigate("/interview"), 1800);
                return;
            }

            if (
                foundRoom.status !== INTERVIEW_ROOM_STATUS.ON_GOING &&
                foundRoom.status !== INTERVIEW_ROOM_STATUS.COMPLETED
            ) {
                setPageError("This interview is not in progress. Redirecting...");
                setTimeout(() => navigate("/interview"), 1800);
                return;
            }

            setRoom(foundRoom);
            if (showPageLoading) {
                await loadDeviceLists();
            }
        } catch (err) {
            if (!showPageLoading) {
                return;
            }
            setPageError("Failed to load interview pre-check information. Redirecting...");
            setTimeout(() => navigate("/interview"), 1800);
        } finally {
            if (showPageLoading) {
                setPageLoading(false);
            }
        }
    }, [loadDeviceLists, navigate, roomId]);

    const handleJoinRoom = useCallback(() => {
        stopCameraPreview();
        stopMicCapture();
        navigate(`/interview/room/${roomId}`);
    }, [navigate, roomId, stopCameraPreview, stopMicCapture]);

    useEffect(() => {
        fetchRoomAndValidate({ showPageLoading: true });

        return () => {
            stopCameraPreview();
            stopMicCapture();
        };
    }, [fetchRoomAndValidate, stopCameraPreview, stopMicCapture]);

    useEffect(() => {
        if (!roomId) {
            return undefined;
        }

        const intervalId = setInterval(() => {
            fetchRoomAndValidate({ showPageLoading: false });
        }, 15000);

        return () => clearInterval(intervalId);
    }, [fetchRoomAndValidate, roomId]);

    useEffect(() => {
        if (pageLoading || !room || hasAutoTestedRef.current) {
            return;
        }

        hasAutoTestedRef.current = true;
        runDeviceChecks();
    }, [pageLoading, room, runDeviceChecks]);

    useEffect(() => {
        if (videoRef.current && cameraStreamRef.current && videoRef.current.srcObject !== cameraStreamRef.current) {
            videoRef.current.srcObject = cameraStreamRef.current;
            videoRef.current.play().catch(() => undefined);
        }
    }, [pageLoading, cameraStatus.ok]);

    return (
        <Box
            sx={{
                minHeight: "100vh",
                px: { xs: 1.25, md: 2.5 },
                py: { xs: 1.25, md: 1.75 },
                bgcolor: "#f2f4f8",
            }}
        >
            <Box sx={{ width: "100%", maxWidth: 1260, mx: "auto" }}>
                {pageLoading ? (
                    <Stack spacing={2} alignItems="center" py={6}>
                        <CircularProgress />
                        <Typography variant="body1" color="text.secondary">
                            Preparing your interview pre-check...
                        </Typography>
                    </Stack>
                ) : (
                    <Stack direction={{ xs: "column", lg: "row" }} spacing={2.5} sx={{ pt: 2.25 }}>
                        <Box sx={{ flex: 1.6 }}>
                            <BaseCard sx={{ p: 1.2, borderRadius: 2.25 }}>
                                <Box
                                    sx={{
                                        borderRadius: 2,
                                        overflow: "hidden",
                                        position: "relative",
                                        width: "100%",
                                        aspectRatio: { xs: "16 / 10", md: "16 / 9" },
                                        maxHeight: { xs: 320, md: "min(50vh, 420px)" },
                                        bgcolor: "#020617",
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
                                            objectFit: "contain",
                                            transform: "scaleX(-1)",
                                        }}
                                    />

                                    {!cameraStatus.ok ? (
                                        <Stack
                                            spacing={0.75}
                                            alignItems="center"
                                            sx={{
                                                position: "absolute",
                                                inset: 0,
                                                justifyContent: "center",
                                                color: "#d1d5db",
                                            }}
                                        >
                                            <VideocamOff />
                                            <Typography variant="caption">Camera preview unavailable</Typography>
                                        </Stack>
                                    ) : null}

                                    <Box
                                        sx={{
                                            position: "absolute",
                                            left: 12,
                                            top: 12,
                                            px: 1,
                                            py: 0.3,
                                            borderRadius: 999,
                                            bgcolor: "rgba(15,23,42,0.58)",
                                            border: "1px solid rgba(255,255,255,0.2)",
                                        }}
                                    >
                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                            <FiberManualRecord sx={{ color: "#a3e635", fontSize: 10 }} />
                                            <Typography variant="caption" sx={{ color: "#f8fafc", fontWeight: 700 }}>
                                                LIVE PREVIEW
                                            </Typography>
                                        </Stack>
                                    </Box>

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
                                            bgcolor: "rgba(15,23,42,0.58)",
                                            border: "1px solid rgba(255,255,255,0.2)",
                                        }}
                                    >
                                        <IconButton
                                            size="small"
                                            onClick={toggleCameraPreview}
                                            sx={{
                                                width: 52,
                                                height: 38,
                                                borderRadius: 1.8,
                                                color: "#f8fafc",
                                                bgcolor: isCameraPreviewOn ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
                                                "&:hover": {
                                                    bgcolor: isCameraPreviewOn ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.35)",
                                                },
                                            }}
                                        >
                                            {isCameraPreviewOn ? <Videocam fontSize="small" /> : <VideocamOff fontSize="small" />}
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={toggleMic}
                                            sx={{
                                                width: 52,
                                                height: 38,
                                                borderRadius: 1.8,
                                                color: "#f8fafc",
                                                bgcolor: isMicOn ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
                                                "&:hover": {
                                                    bgcolor: isMicOn ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.35)",
                                                },
                                            }}
                                        >
                                            {isMicOn ? <Mic fontSize="small" /> : <MicOff fontSize="small" />}
                                        </IconButton>
                                    </Stack>

                                </Box>
                            </BaseCard>

                            <BaseCard sx={{ mt: 1.6, p: 2, borderRadius: 2.25 }}>
                                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "#64748b" }}>
                                            MICROPHONE
                                        </Typography>
                                        <FormControl fullWidth size="small" sx={{ mt: 0.8 }}>
                                            <Select
                                                value={selectedMic}
                                                onChange={(e) => setSelectedMic(e.target.value)}
                                                IconComponent={KeyboardArrowDown}
                                            >
                                                {(devices.microphones.length > 0 ? devices.microphones : [{ deviceId: "", label: "Default microphone" }]).map((item) => (
                                                    <MenuItem key={item.deviceId || "default-mic"} value={item.deviceId || ""}>
                                                        {item.label || "Microphone"}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        <Stack direction="row" spacing={0.35} alignItems="center" sx={{ mt: 1.2 }}>
                                            {[1, 2, 3, 4, 5, 6].map((idx) => (
                                                <Box
                                                    key={idx}
                                                    sx={{
                                                        width: 4,
                                                        borderRadius: 999,
                                                        height: idx <= 4 ? 6 + idx * 2 : 4,
                                                        bgcolor: audioDetected && idx <= 4 ? "#84cc16" : "#cbd5e1",
                                                    }}
                                                />
                                            ))}
                                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                                {audioDetected ? "Audio input detected" : "Audio input not detected"}
                                            </Typography>
                                        </Stack>
                                    </Box>

                                    <Box sx={{ flex: 1 }}>
                                        <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "#64748b" }}>
                                            CAMERA
                                        </Typography>
                                        <FormControl fullWidth size="small" sx={{ mt: 0.8 }}>
                                            <Select
                                                value={selectedCam}
                                                onChange={(e) => setSelectedCam(e.target.value)}
                                                IconComponent={KeyboardArrowDown}
                                            >
                                                {(devices.cameras.length > 0 ? devices.cameras : [{ deviceId: "", label: "Default camera" }]).map((item) => (
                                                    <MenuItem key={item.deviceId || "default-cam"} value={item.deviceId || ""}>
                                                        {item.label || "Camera"}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        <Typography sx={{ mt: 1.35, fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "#64748b" }}>
                                            SPEAKERS
                                        </Typography>
                                        <FormControl fullWidth size="small" sx={{ mt: 0.8 }}>
                                            <Select
                                                value={selectedSpeaker}
                                                onChange={(e) => setSelectedSpeaker(e.target.value)}
                                                IconComponent={KeyboardArrowDown}
                                            >
                                                {(devices.speakers.length > 0 ? devices.speakers : [{ deviceId: "", label: "Default speakers" }]).map((item) => (
                                                    <MenuItem key={item.deviceId || "default-spk"} value={item.deviceId || ""}>
                                                        {item.label || "Speakers"}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>
                                </Stack>

                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    justifyContent="space-between"
                                    sx={{ mt: 1.5 }}
                                >
                                    <SecondaryButton onClick={() => navigate("/interview")} sx={{ minWidth: 100 }}>
                                        Back
                                    </SecondaryButton>
                                    <SecondaryButton loading={isTesting} onClick={runDeviceChecks} sx={{ minWidth: 150 }}>
                                        Re-test devices
                                    </SecondaryButton>
                                </Stack>
                            </BaseCard>
                        </Box>

                        <Box sx={{ width: { xs: "100%", lg: 360 }, flexShrink: 0 }}>
                            <BaseCard sx={{ p: 2.2, borderRadius: 3 }}>
                                <Typography variant="h4" sx={{ fontSize: 38, fontWeight: 800, lineHeight: 1.04 }}>
                                    Ready to join?
                                </Typography>

                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.7 }}>
                                    Your interviewers are waiting for you.
                                </Typography>

                                <Box sx={{ mt: 2, borderRadius: 2, bgcolor: "#f5f7fb", p: 1.4, border: "1px solid #e2e8f0" }}>
                                    <Stack direction="row" spacing={1.2} alignItems="center">
                                        <Avatar sx={{ width: 34, height: 34, bgcolor: "#dbe7c5", color: "#0f172a", fontWeight: 700 }}>
                                            {(room?.coachName || "C").charAt(0).toUpperCase()}
                                        </Avatar>
                                        <Box>
                                            <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "#94a3b8" }}>
                                                LEAD COACH
                                            </Typography>
                                            <Typography variant="body2" fontWeight={700}>
                                                {room?.coachName || "Your Interviewer"}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Interview Session
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    <Stack spacing={0.75} sx={{ mt: 1.5 }}>
                                        <Stack direction="row" spacing={0.8} alignItems="center">
                                            <Assignment sx={{ fontSize: 15, color: "#475569" }} />
                                            <Typography variant="caption" color="text.secondary">
                                                {interviewTitle}
                                            </Typography>
                                        </Stack>
                                        <Stack direction="row" spacing={0.8} alignItems="center">
                                            <AccessTime sx={{ fontSize: 15, color: "#475569" }} />
                                            <Typography variant="caption" color="text.secondary">
                                                {room?.durationMinutes || 60} Minutes Session
                                            </Typography>
                                        </Stack>
                                        <Typography variant="caption" color="text.secondary">
                                            {interviewTimeFromDb}
                                        </Typography>
                                    </Stack>
                                </Box>

                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={handleJoinRoom}
                                    disabled={Boolean(pageError)}
                                    sx={{
                                        mt: 2,
                                        py: 1.15,
                                        borderRadius: 2,
                                        bgcolor: "#020617",
                                        color: "#fff",
                                        textTransform: "none",
                                        fontWeight: 700,
                                        "&:hover": {
                                            bgcolor: "#111827",
                                        },
                                    }}
                                >
                                    Join Now
                                </Button>

                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1.2, display: "block" }}>
                                    {room?.coachName || "Interviewer"} and others may already be in this call.
                                </Typography>
                            </BaseCard>

                            {(!cameraStatus.ok || !micStatus.ok || !speakerStatus.ok) && !pageError ? (
                                <Alert severity="warning" sx={{ mt: 1.2 }}>
                                    You can still join now, but camera or microphone quality may be affected.
                                </Alert>
                            ) : null}
                            {pageError ? <Alert severity="warning" sx={{ mt: 1.2 }}>{pageError}</Alert> : null}
                        </Box>
                    </Stack>
                )}
            </Box>
        </Box>
    );
}

export default InterviewPrecheckPage;
