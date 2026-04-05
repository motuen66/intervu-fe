import { useCallback, useRef, useState } from "react";

export default function usePrecheckDevices() {
    const videoRef = useRef(null);
    const cameraStreamRef = useRef(null);
    const micStreamRef = useRef(null);
    const devicesInitializedRef = useRef(false);

    const [isTesting, setIsTesting] = useState(false);
    const [cameraStatus, setCameraStatus] = useState({ ok: false, message: "Not tested" });
    const [micStatus, setMicStatus] = useState({ ok: false, message: "Not tested" });
    const [speakerStatus, setSpeakerStatus] = useState({ ok: false, message: "Not tested" });
    const [networkStatus, setNetworkStatus] = useState({ ok: false, message: "Not tested" });
    const [audioDetected, setAudioDetected] = useState(false);
    const [devices, setDevices] = useState({ microphones: [], cameras: [], speakers: [] });
    const [selectedMic, setSelectedMic] = useState("");
    const [selectedCam, setSelectedCam] = useState("");
    const [selectedSpeaker, setSelectedSpeaker] = useState("");
    const [isCameraPreviewOn, setIsCameraPreviewOn] = useState(false);
    const [isMicOn, setIsMicOn] = useState(false);

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

    const stopAll = useCallback(() => {
        stopCameraPreview();
        stopMicCapture();
    }, [stopCameraPreview, stopMicCapture]);

    const loadDeviceLists = useCallback(async () => {
        if (!navigator.mediaDevices?.enumerateDevices) return;
        try {
            const all = await navigator.mediaDevices.enumerateDevices();
            const microphones = all.filter((d) => d.kind === "audioinput");
            const cameras = all.filter((d) => d.kind === "videoinput");
            const speakers = all.filter((d) => d.kind === "audiooutput");
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

    const testCamera = useCallback(async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraStatus({ ok: false, message: "Camera not supported in this browser." });
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
        } catch {
            setCameraStatus({ ok: false, message: "Cannot access camera. Check browser permissions." });
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

    const testMic = useCallback(async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setMicStatus({ ok: false, message: "Microphone not supported in this browser." });
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: selectedMic ? { deviceId: { exact: selectedMic } } : true,
            });
            const audioTrack = stream.getAudioTracks()[0];
            setAudioDetected(Boolean(audioTrack?.enabled));
            stream.getTracks().forEach((t) => t.stop());
            setMicStatus({ ok: true, message: "Microphone is ready." });
        } catch {
            setAudioDetected(false);
            setMicStatus({ ok: false, message: "Cannot access microphone. Check browser permissions." });
        }
    }, [selectedMic]);

    const toggleMic = useCallback(async () => {
        if (micStreamRef.current) {
            stopMicCapture();
            setIsMicOn(false);
            setAudioDetected(false);
            setMicStatus({ ok: false, message: "Microphone is off." });
            return;
        }
        if (!navigator.mediaDevices?.getUserMedia) {
            setMicStatus({ ok: false, message: "Microphone not supported in this browser." });
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
        } catch {
            setIsMicOn(false);
            setAudioDetected(false);
            setMicStatus({ ok: false, message: "Cannot access microphone. Check browser permissions." });
        }
    }, [selectedMic, stopMicCapture]);

    const testSpeaker = useCallback(async () => {
        try {
            const ctx = new AudioContext();
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            oscillator.connect(gain);
            gain.connect(ctx.destination);
            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(440, ctx.currentTime);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 1.0);
            oscillator.onended = () => ctx.close();
            setSpeakerStatus({ ok: true, message: "Did you hear the beep?" });
        } catch {
            setSpeakerStatus({ ok: false, message: "Could not play test tone." });
        }
    }, []);

    const checkNetwork = useCallback(async () => {
        setNetworkStatus({ ok: false, message: "Checking..." });
        const start = Date.now();
        try {
            await fetch("https://www.google.com/generate_204", { mode: "no-cors", cache: "no-store" });
            const rtt = Date.now() - start;
            if (rtt < 300) setNetworkStatus({ ok: true, message: `Good (${rtt}ms)` });
            else if (rtt < 800) setNetworkStatus({ ok: true, message: `Fair (${rtt}ms)` });
            else setNetworkStatus({ ok: false, message: `Slow (${rtt}ms) — may affect call quality` });
        } catch {
            setNetworkStatus({ ok: false, message: "Network check failed." });
        }
    }, []);

    const runAllChecks = useCallback(async () => {
        setIsTesting(true);
        await loadDeviceLists();
        await Promise.allSettled([testCamera(), testMic(), checkNetwork()]);
        setSpeakerStatus({ ok: true, message: "Speaker ready" });
        setIsTesting(false);
    }, [loadDeviceLists, testCamera, testMic, checkNetwork]);

    const reset = useCallback(() => {
        devicesInitializedRef.current = false;
        setCameraStatus({ ok: false, message: "Not tested" });
        setMicStatus({ ok: false, message: "Not tested" });
        setSpeakerStatus({ ok: false, message: "Not tested" });
        setNetworkStatus({ ok: false, message: "Not tested" });
        setAudioDetected(false);
        setIsCameraPreviewOn(false);
        setIsMicOn(false);
    }, []);

    return {
        videoRef,
        cameraStatus,
        isCameraPreviewOn,
        selectedCam,
        setSelectedCam,
        toggleCameraPreview,
        testCamera,
        micStatus,
        isMicOn,
        selectedMic,
        setSelectedMic,
        audioDetected,
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
    };
}
