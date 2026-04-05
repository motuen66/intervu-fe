// Centralized media configuration for the pre-check and interview features.
// All magic numbers and device-related defaults live here.

// ─── Device Kinds ────────────────────────────────────────────────────────────
export const DEVICE_KIND = {
    AUDIO_INPUT: "audioinput",
    VIDEO_INPUT: "videoinput",
    AUDIO_OUTPUT: "audiooutput",
};

// ─── Speaker Test Tone ───────────────────────────────────────────────────────
export const SPEAKER_TEST = {
    FREQUENCY_HZ: 440,        // A4 note
    TYPE: "sine",
    INITIAL_GAIN: 0.3,
    FADE_END_GAIN: 0.001,
    DURATION_SEC: 1.0,
};

// ─── Network Latency Thresholds (ms) ────────────────────────────────────────
export const NETWORK_THRESHOLDS = {
    GOOD_MAX_MS: 300,
    FAIR_MAX_MS: 800,
    PING_URL: "https://www.google.com/generate_204",
};

// ─── Volume Meter (Web Audio API) ───────────────────────────────────────────
export const VOLUME_METER = {
    FFT_SIZE: 512,
    SMOOTHING: 0.4,
    POLL_INTERVAL_MS: 60,      // ~16 fps update rate
    SILENCE_THRESHOLD: 10,     // amplitude below this is considered silence (0–255)
};

// ─── Pre-check Status Messages ──────────────────────────────────────────────
export const STATUS_MSG = {
    NOT_TESTED: "Not tested",
    CHECKING: "Checking...",
    CAMERA_READY: "Camera is ready.",
    CAMERA_OFF: "Camera preview is off.",
    CAMERA_DENIED: "Camera access denied. Please allow camera permissions in your browser settings.",
    CAMERA_NOT_SUPPORTED: "Camera not supported in this browser.",
    MIC_READY: "Microphone is ready.",
    MIC_ON: "Microphone is on.",
    MIC_OFF: "Microphone is off.",
    MIC_DENIED: "Microphone access denied. Please allow microphone permissions in your browser settings.",
    MIC_NOT_SUPPORTED: "Microphone not supported in this browser.",
    SPEAKER_READY: "Speaker ready",
    SPEAKER_HEARD: "Did you hear the beep?",
    SPEAKER_FAILED: "Could not play test tone.",
    NETWORK_GOOD: (rtt) => `Good (${rtt}ms)`,
    NETWORK_FAIR: (rtt) => `Fair (${rtt}ms)`,
    NETWORK_SLOW: (rtt) => `Slow (${rtt}ms) — may affect call quality`,
    NETWORK_FAILED: "Network check failed.",
    PERMISSION_DENIED: "Permission denied",
};
