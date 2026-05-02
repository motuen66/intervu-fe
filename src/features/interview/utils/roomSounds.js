const MUTE_KEY = "intervu.roomSounds.muted";

let sharedCtx = null;

const getCtx = () => {
    if (sharedCtx) return sharedCtx;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    sharedCtx = new Ctx();
    return sharedCtx;
};

export function isRoomSoundsMuted() {
    try {
        return localStorage.getItem(MUTE_KEY) === "1";
    } catch {
        return false;
    }
}

export function setRoomSoundsMuted(muted) {
    try {
        localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    } catch {
        /* ignore */
    }
}

// Soft 2-tone chime, ~200ms total, target loudness ≈ -16 LUFS.
// Synth-generated so we ship no audio assets.
export function playJoinChime() {
    if (isRoomSoundsMuted()) return;
    try {
        const ctx = getCtx();
        if (!ctx) return;
        if (ctx.state === "suspended") ctx.resume().catch(() => {});

        const now = ctx.currentTime;
        const master = ctx.createGain();
        master.gain.value = 0.18;
        master.connect(ctx.destination);

        const playTone = (freq, start, duration) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now + start);
            // Gentle attack/release to avoid clicks
            gain.gain.setValueAtTime(0, now + start);
            gain.gain.linearRampToValueAtTime(1, now + start + 0.015);
            gain.gain.linearRampToValueAtTime(0, now + start + duration);
            osc.connect(gain);
            gain.connect(master);
            osc.start(now + start);
            osc.stop(now + start + duration + 0.02);
        };

        // Two-tone: E5 → A5
        playTone(659.25, 0, 0.09);
        playTone(880.0, 0.09, 0.11);
    } catch {
        /* autoplay blocked or unsupported — silent fail is acceptable */
    }
}
