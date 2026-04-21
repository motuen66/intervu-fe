import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import CollectQuestionProcessingTray from "../../features/interviewQuestions/components/CollectQuestionProcessingTray";
import GeneratedQuestionsModal from "../../features/interview/pages/InterviewRoomListPage/GeneratedQuestionsModal";

const AI_ANALYSIS_COMPLETED_TYPE = "AiAnalysisCompleted";

function extractRoomIdFromActionUrl(actionUrl) {
    if (!actionUrl || typeof actionUrl !== "string") return null;
    try {
        const query = actionUrl.includes("?") ? actionUrl.slice(actionUrl.indexOf("?")) : "";
        return new URLSearchParams(query).get("roomId");
    } catch {
        return null;
    }
}

const CollectQuestionTrayContext = createContext(null);

const MOCK_CAP = 95;
const TICK_MS = 15;
const TICK_STEP = 9;
const STORAGE_KEY = "intervu:collectTray";
const MAX_RESUME_AGE_MS = 15 * 60 * 1000; // 15 min window after which we give up

function readPersisted() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.roomId || !parsed?.startedAt) return null;
        if (Date.now() - parsed.startedAt > MAX_RESUME_AGE_MS) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

function writePersisted(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        /* storage full / disabled — ignore */
    }
}

function clearPersisted() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        /* ignore */
    }
}

function getStatus(progress) {
    if (progress >= 100) return "Analysis Complete!";
    if (progress >= 75) return "Finalizing";
    if (progress >= 50) return "Formatting results";
    if (progress >= 25) return "Extracting keywords";
    return "Checking duplicates";
}

export function CollectQuestionTrayProvider({ children }) {
    const [visible, setVisible] = useState(false);
    const [expanded, setExpanded] = useState(true);
    const [progress, setProgress] = useState(0);
    const [roomId, setRoomId] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    const intervalRef = useRef(null);
    const audioCtxRef = useRef(null);

    const clearTicker = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const playTing = useCallback(() => {
        try {
            if (!audioCtxRef.current) {
                const Ctx = window.AudioContext || window.webkitAudioContext;
                if (!Ctx) return;
                audioCtxRef.current = new Ctx();
            }
            const ctx = audioCtxRef.current;
            if (ctx.state === "suspended") ctx.resume().catch(() => {});
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.0001, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
            osc.connect(gain).connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
        } catch {
            /* ignore autoplay / unsupported */
        }
    }, []);

    const startTicker = useCallback(() => {
        intervalRef.current = setInterval(() => {
            setProgress((prev) => {
                const next = prev + TICK_STEP;
                return next >= MOCK_CAP ? MOCK_CAP : next;
            });
        }, TICK_MS);
    }, []);

    const startCollecting = useCallback(
        ({ roomId: rid } = {}) => {
            clearTicker();
            if (rid !== undefined) setRoomId(rid);
            setProgress(0);
            setVisible(true);
            setExpanded(true);
            setModalOpen(false);
            if (rid) writePersisted({ roomId: rid, startedAt: Date.now() });
            startTicker();
        },
        [clearTicker, startTicker],
    );

    const completeCollecting = useCallback(
        ({ roomId: rid } = {}) => {
            clearTicker();
            clearPersisted();
            if (rid !== undefined) setRoomId(rid);
            setProgress((prev) => {
                if (prev >= 100) return prev;
                playTing();
                return 100;
            });
            setVisible(true);
        },
        [clearTicker, playTing],
    );

    const hideTray = useCallback(() => {
        clearTicker();
        clearPersisted();
        setVisible(false);
    }, [clearTicker]);

    useEffect(() => () => clearTicker(), [clearTicker]);

    // Resume on mount if a collection was in-flight before a reload/navigation.
    // Runs once — the provider lives at the MainLayout level.
    const resumedRef = useRef(false);
    useEffect(() => {
        if (resumedRef.current) return;
        resumedRef.current = true;
        const persisted = readPersisted();
        if (!persisted) return;
        setRoomId(persisted.roomId);
        setProgress(0);
        setVisible(true);
        setExpanded(true);
        startTicker();
    }, [startTicker]);

    // Subscribe to SignalR notifications (live + fetched-on-reload). When an
    // "AiAnalysisCompleted" for the currently-tracked room is present, snap to 100%.
    // Matching by roomId avoids firing on unrelated notifications that happen to
    // arrive or get hydrated from the server after a page reload.
    const notifications = useSelector((s) => s.notification?.items);
    const handledNotifIdRef = useRef(null);

    useEffect(() => {
        if (!visible || progress >= 100 || !roomId || !notifications?.length) return;
        const match = notifications.find((n) => {
            if (n.type !== AI_ANALYSIS_COMPLETED_TYPE) return false;
            const rid = n.referenceId ?? extractRoomIdFromActionUrl(n.actionUrl);
            return rid && String(rid) === String(roomId);
        });
        if (!match || match.id === handledNotifIdRef.current) return;
        handledNotifIdRef.current = match.id;
        completeCollecting({ roomId });
    }, [notifications, visible, progress, roomId, completeCollecting]);

    useEffect(() => {
        if (import.meta.env?.DEV) {
            window.__startTray = startCollecting;
            window.__completeTray = completeCollecting;
        }
    }, [startCollecting, completeCollecting]);

    const handleReview = () => {
        setModalOpen(true);
        setVisible(false);
    };

    const value = { startCollecting, completeCollecting, hideTray };

    return (
        <CollectQuestionTrayContext.Provider value={value}>
            {children}
            {visible && (
                <CollectQuestionProcessingTray
                    progress={progress}
                    status={getStatus(progress)}
                    isComplete={progress >= 100}
                    expanded={expanded}
                    onToggle={() => setExpanded((v) => !v)}
                    onReview={handleReview}
                    onClose={hideTray}
                />
            )}
            <GeneratedQuestionsModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                roomId={roomId}
            />
        </CollectQuestionTrayContext.Provider>
    );
}

export function useCollectQuestionTray() {
    const ctx = useContext(CollectQuestionTrayContext);
    if (!ctx) throw new Error("useCollectQuestionTray must be used within CollectQuestionTrayProvider");
    return ctx;
}
