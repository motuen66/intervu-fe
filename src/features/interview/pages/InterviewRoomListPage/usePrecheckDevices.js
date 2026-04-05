import { useCallback, useEffect, useRef, useState } from "react";
import {
    DEVICE_KIND,
    SPEAKER_TEST,
    NETWORK_THRESHOLDS,
    VOLUME_METER,
    STATUS_MSG,
} from "../../constants/mediaConfig";

// ─── Helpers ────────────────────────────────────────────────────────────────
function isPermissionDenied(err) {
    return (
        err?.name === "NotAllowedError" ||
        err?.name === "PermissionDeniedError"
    );
}

export default function usePrecheckDevices() {
    const videoRef = useRef(null);
    const cameraStreamRef = useRef(null);
    const micStreamRef = useRef(null);
    const devicesInitializedRef = useRef(false);

    // Volume meter refs (kept out of state to avoid re-render churn)
    const audioCtxRef = useRef(null);
    const analyserRef = useRef(null);
    const volumeRafRef = useRef(null);

    const [isTesting, setIsTesting] = useState(false);
    const [cameraStatus, setCameraStatus] = useState({ ok: false, message: STATUS_MSG.NOT_TESTED });
    const [micStatus, setMicStatus] = useState({ ok: false, message: STATUS_MSG.NOT_TESTED });
    const [speakerStatus, setSpeakerStatus] = useState({ ok: false, message: STATUS_MSG.NOT_TESTED });
    const [networkStatus, setNetworkStatus] = useState({ ok: false, message: STATUS_MSG.NOT_TESTED });
    const [audioDetected, setAudioDetected] = useState(false);
    const [volumeLevel, setVolumeLevel] = useState(0); // 0–100 normalised
    const [devices, setDevices] = useState({ microphones: [], cameras: [], speakers: [] });
    const [selectedMic, setSelectedMic] = useState("");
    const [selectedCam, setSelectedCam] = useState("");
    const [selectedSpeaker, setSelectedSpeaker] = useState("");
    const [isCameraPreviewOn, setIsCameraPreviewOn] = useState(false);
    const [isMicOn, setIsMicOn] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState({ camera: false, mic: false });

    // ─── Volume Meter Analyser ──────────────────────────────────────────────
    const startVolumeMeter = useCallback((stream) => {
        stopVolumeMeter();
        try {
            const ctx = new AudioContext();
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = VOLUME_METER.FFT_SIZE;
            analyser.smoothingTimeConstant = VOLUME_METER.SMOOTHING;
            source.connect(analyser);
            audioCtxRef.current = ctx;
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const poll = () => {
                analyser.getByteFrequencyData(dataArray);
                // Compute RMS-like average of frequency bins
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                const avg = sum / dataArray.length; // 0–255
                const normalised = Math.min(100, Math.round((avg / 255) * 100 * 2.5)); // amplify for visual
                setVolumeLevel(normalised);
                setAudioDetected(avg > VOLUME_METER.SILENCE_THRESHOLD);
                volumeRafRef.current = requestAnimationFrame(poll);
            };
            poll();
        } catch {
            // AudioContext may not be available — degrade silently
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const stopVolumeMeter = useCallback(() => {
        if (volumeRafRef.current) {
            cancelAnimationFrame(volumeRafRef.current);
            volumeRafRef.current = null;
        }
        if (audioCtxRef.current) {
            audioCtxRef.current.close().catch(() => {});
            audioCtxRef.current = null;
        }
        analyserRef.current = null;
        setVolumeLevel(0);
    }, []);

    // ─── Stream Cleanup ─────────────────────────────────────────────────────
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
        stopVolumeMeter();
    }, [stopVolumeMeter]);

    const stopAll = useCallback(() => {
        stopCameraPreview();
        stopMicCapture();
    }, [stopCameraPreview, stopMicCapture]);

    // ─── Device Enumeration ─────────────────────────────────────────────────
    const loadDeviceLists = useCallback(async () => {
        if (!navigator.mediaDevices?.enumerateDevices) return;
        try {
            const all = await navigator.mediaDevices.enumerateDevices();
            const microphones = all.filter((d) => d.kind === DEVICE_KIND.AUDIO_INPUT);
            const cameras = all.filter((d) => d.kind === DEVICE_KIND.VIDEO_INPUT);
            const speakers = all.filter((d) => d.kind === DEVICE_KIND.AUDIO_OUTPUT);
            setDevices({ microphones, cameras, speakers });

            if (!devicesInitializedRef.current) {
                devicesInitializedRef.current = true;
                if (microphones[0]?.deviceId) setSelectedMic(microphones[0].deviceId);
                if (cameras[0]?.deviceId) setSelectedCam(cameras[0].deviceId);
                if (speakers[0]?.deviceId) setSelectedSpeaker(speakers[0].deviceId);
            }
        } catch {
            // enumerateDevices may fail but getUserMedia results are still usable
        }
    }, []);

    // ─── Camera ─────────────────────────────────────────────────────────────
    const testCamera = useCallback(async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraStatus({ ok: false, message: STATUS_MSG.CAMERA_NOT_SUPPORTED });
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
            setCameraStatus({ ok: true, message: STATUS_MSG.CAMERA_READY });
            setIsCameraPreviewOn(true);
            setPermissionDenied((prev) => ({ ...prev, camera: false }));
        } catch (err) {
            if (isPermissionDenied(err)) {
                setCameraStatus({ ok: false, message: STATUS_MSG.CAMERA_DENIED });
                setPermissionDenied((prev) => ({ ...prev, camera: true }));
            } else {
                setCameraStatus({ ok: false, message: "Cannot access camera. Check browser permissions." });
            }
            setIsCameraPreviewOn(false);
        }
    }, [selectedCam, stopCameraPreview]);

    const toggleCameraPreview = useCallback(async () => {
        if (cameraStreamRef.current) {
            stopCameraPreview();
            setIsCameraPreviewOn(false);
            setCameraStatus({ ok: false, message: STATUS_MSG.CAMERA_OFF });
            return;
        }
        await testCamera();
    }, [stopCameraPreview, testCamera]);

    // ─── Microphone ─────────────────────────────────────────────────────────
    const testMic = useCallback(async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setMicStatus({ ok: false, message: STATUS_MSG.MIC_NOT_SUPPORTED });
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: selectedMic ? { deviceId: { exact: selectedMic } } : true,
            });
            const audioTrack = stream.getAudioTracks()[0];
            setAudioDetected(Boolean(audioTrack?.enabled));
            stream.getTracks().forEach((t) => t.stop());
            setMicStatus({ ok: true, message: STATUS_MSG.MIC_READY });
            setPermissionDenied((prev) => ({ ...prev, mic: false }));
        } catch (err) {
            setAudioDetected(false);
            if (isPermissionDenied(err)) {
                setMicStatus({ ok: false, message: STATUS_MSG.MIC_DENIED });
                setPermissionDenied((prev) => ({ ...prev, mic: true }));
            } else {
                setMicStatus({ ok: false, message: "Cannot access microphone. Check browser permissions." });
            }
        }
    }, [selectedMic]);

    const toggleMic = useCallback(async () => {
        if (micStreamRef.current) {
            stopMicCapture();
            setIsMicOn(false);
            setAudioDetected(false);
            setMicStatus({ ok: false, message: STATUS_MSG.MIC_OFF });
            return;
        }
        if (!navigator.mediaDevices?.getUserMedia) {
            setMicStatus({ ok: false, message: STATUS_MSG.MIC_NOT_SUPPORTED });
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: selectedMic ? { deviceId: { exact: selectedMic } } : true,
            });
            micStreamRef.current = stream;
            setIsMicOn(true);
            setAudioDetected(true);
            setMicStatus({ ok: true, message: STATUS_MSG.MIC_ON });
            setPermissionDenied((prev) => ({ ...prev, mic: false }));
            startVolumeMeter(stream);
        } catch (err) {
            setIsMicOn(false);
            setAudioDetected(false);
            if (isPermissionDenied(err)) {
                setMicStatus({ ok: false, message: STATUS_MSG.MIC_DENIED });
                setPermissionDenied((prev) => ({ ...prev, mic: true }));
            } else {
                setMicStatus({ ok: false, message: "Cannot access microphone. Check browser permissions." });
            }
        }
    }, [selectedMic, stopMicCapture, startVolumeMeter]);

    // ─── Speaker ────────────────────────────────────────────────────────────
    const testSpeaker = useCallback(async () => {
        try {
            const ctx = new AudioContext();
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            oscillator.connect(gain);
            gain.connect(ctx.destination);
            oscillator.type = SPEAKER_TEST.TYPE;
            oscillator.frequency.setValueAtTime(SPEAKER_TEST.FREQUENCY_HZ, ctx.currentTime);
            gain.gain.setValueAtTime(SPEAKER_TEST.INITIAL_GAIN, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(
                SPEAKER_TEST.FADE_END_GAIN,
                ctx.currentTime + SPEAKER_TEST.DURATION_SEC,
            );
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + SPEAKER_TEST.DURATION_SEC);
            oscillator.onended = () => ctx.close();
            setSpeakerStatus({ ok: true, message: STATUS_MSG.SPEAKER_HEARD });
        } catch {
            setSpeakerStatus({ ok: false, message: STATUS_MSG.SPEAKER_FAILED });
        }
    }, []);

    // ─── Network ────────────────────────────────────────────────────────────
    const checkNetwork = useCallback(async () => {
        setNetworkStatus({ ok: false, message: STATUS_MSG.CHECKING });
        const start = Date.now();
        try {
            await fetch(NETWORK_THRESHOLDS.PING_URL, { mode: "no-cors", cache: "no-store" });
            const rtt = Date.now() - start;
            if (rtt < NETWORK_THRESHOLDS.GOOD_MAX_MS) {
                setNetworkStatus({ ok: true, message: STATUS_MSG.NETWORK_GOOD(rtt) });
            } else if (rtt < NETWORK_THRESHOLDS.FAIR_MAX_MS) {
                setNetworkStatus({ ok: true, message: STATUS_MSG.NETWORK_FAIR(rtt) });
            } else {
                setNetworkStatus({ ok: false, message: STATUS_MSG.NETWORK_SLOW(rtt) });
            }
        } catch {
            setNetworkStatus({ ok: false, message: STATUS_MSG.NETWORK_FAILED });
        }
    }, []);

    // ─── Run All ────────────────────────────────────────────────────────────
    const runAllChecks = useCallback(async () => {
        setIsTesting(true);
        await loadDeviceLists();
        await Promise.allSettled([testCamera(), testMic(), checkNetwork()]);
        setSpeakerStatus({ ok: true, message: STATUS_MSG.SPEAKER_READY });
        setIsTesting(false);
    }, [loadDeviceLists, testCamera, testMic, checkNetwork]);

    // ─── Device Switch Handlers ─────────────────────────────────────────────
    const handleCamChange = useCallback(
        async (deviceId) => {
            setSelectedCam(deviceId);
            // Re-init camera stream if preview is currently on
            if (cameraStreamRef.current) {
                stopCameraPreview();
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: { deviceId: { exact: deviceId } },
                    });
                    cameraStreamRef.current = stream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        await videoRef.current.play().catch(() => undefined);
                    }
                    setCameraStatus({ ok: true, message: STATUS_MSG.CAMERA_READY });
                    setIsCameraPreviewOn(true);
                } catch (err) {
                    if (isPermissionDenied(err)) {
                        setCameraStatus({ ok: false, message: STATUS_MSG.CAMERA_DENIED });
                        setPermissionDenied((prev) => ({ ...prev, camera: true }));
                    } else {
                        setCameraStatus({ ok: false, message: "Cannot access camera." });
                    }
                    setIsCameraPreviewOn(false);
                }
            }
        },
        [stopCameraPreview],
    );

    const handleMicChange = useCallback(
        async (deviceId) => {
            setSelectedMic(deviceId);
            // Re-init mic stream if mic is currently on
            if (micStreamRef.current) {
                stopMicCapture();
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        audio: { deviceId: { exact: deviceId } },
                    });
                    micStreamRef.current = stream;
                    setIsMicOn(true);
                    setMicStatus({ ok: true, message: STATUS_MSG.MIC_ON });
                    startVolumeMeter(stream);
                } catch (err) {
                    setIsMicOn(false);
                    setAudioDetected(false);
                    if (isPermissionDenied(err)) {
                        setMicStatus({ ok: false, message: STATUS_MSG.MIC_DENIED });
                        setPermissionDenied((prev) => ({ ...prev, mic: true }));
                    } else {
                        setMicStatus({ ok: false, message: "Cannot access microphone." });
                    }
                }
            }
        },
        [stopMicCapture, startVolumeMeter],
    );

    // ─── Reset ──────────────────────────────────────────────────────────────
    const reset = useCallback(() => {
        devicesInitializedRef.current = false;
        setCameraStatus({ ok: false, message: STATUS_MSG.NOT_TESTED });
        setMicStatus({ ok: false, message: STATUS_MSG.NOT_TESTED });
        setSpeakerStatus({ ok: false, message: STATUS_MSG.NOT_TESTED });
        setNetworkStatus({ ok: false, message: STATUS_MSG.NOT_TESTED });
        setAudioDetected(false);
        setVolumeLevel(0);
        setIsCameraPreviewOn(false);
        setIsMicOn(false);
        setPermissionDenied({ camera: false, mic: false });
    }, []);

    // Cleanup volume meter on unmount
    useEffect(() => {
        return () => stopVolumeMeter();
    }, [stopVolumeMeter]);

    return {
        videoRef,
        cameraStatus,
        isCameraPreviewOn,
        selectedCam,
        setSelectedCam: handleCamChange,
        toggleCameraPreview,
        testCamera,
        micStatus,
        isMicOn,
        selectedMic,
        setSelectedMic: handleMicChange,
        audioDetected,
        volumeLevel,
        toggleMic,
        testMic,
        speakerStatus,
        selectedSpeaker,
        setSelectedSpeaker,
        testSpeaker,
        networkStatus,
        devices,
        isTesting,
        runAllChecks,
        stopAll,
        reset,
        permissionDenied,
    };
}
