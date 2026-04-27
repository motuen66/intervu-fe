import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import CollectQuestionProcessingTray from "../../features/interviewQuestions/components/CollectQuestionProcessingTray";
import { QUESTION_STATUS_BUCKETS, ROADMAP_STATUS_BUCKETS, resolveStatusLabel } from "../constants/processingTrayJobs";

const ProcessingTrayContext = createContext(null);

const MOCK_CAP = 95;
const TICK_MS = 600;
const TICK_STEP = 9;
const STORAGE_KEY = "intervu:processingTray";
const HANDLED_KEY = "intervu:processingTray:handledStartIds";
const MAX_RESUME_AGE_MS = 15 * 60 * 1000;

// Derive the progress we *would* be at given elapsed wall-clock time since
// the job started. Lets us resume the bar at approximately the same place
// after a reload instead of restarting from 0.
function computeProgressFromElapsed(startedAt) {
    if (!startedAt) return 0;
    const elapsed = Date.now() - startedAt;
    if (elapsed <= 0) return 0;
    const ticks = Math.floor(elapsed / TICK_MS);
    return Math.min(MOCK_CAP, ticks * TICK_STEP);
}

// Rebuild the CTA click handler after a reload. Functions can't round-trip
// through localStorage, so we reconstruct from kind + referenceId.
function buildCtaAction(kind, referenceId, navigate) {
    if (kind === "collect-questions" && referenceId) {
        return () => navigate(`/interview?roomId=${referenceId}&action=review-questions`);
    }
    if (kind === "roadmap") {
        return () => navigate("/roadmap");
    }
    return null;
}

function extractRoomIdFromActionUrl(actionUrl) {
    if (!actionUrl || typeof actionUrl !== "string") return null;
    try {
        const query = actionUrl.includes("?") ? actionUrl.slice(actionUrl.indexOf("?")) : "";
        return new URLSearchParams(query).get("roomId");
    } catch {
        return null;
    }
}

function readPersisted() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.job || !parsed?.startedAt) return null;
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
        /* ignore */
    }
}

function clearPersisted() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        /* ignore */
    }
}

function readHandledStartIds() {
    try {
        const raw = localStorage.getItem(HANDLED_KEY);
        if (!raw) return new Set();
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? new Set(arr) : new Set();
    } catch {
        return new Set();
    }
}

function writeHandledStartIds(set) {
    try {
        const trimmed = Array.from(set).slice(-50);
        localStorage.setItem(HANDLED_KEY, JSON.stringify(trimmed));
    } catch {
        /* ignore */
    }
}

// Persist only the fields we need to resume — functions cannot be serialized.
function persistableJob(job) {
    return {
        kind: job.kind,
        runningTitle: job.runningTitle,
        completeTitle: job.completeTitle,
        statusBuckets: job.statusBuckets,
        completeCtaLabel: job.completeCtaLabel,
        completeNotificationType: job.completeNotificationType ?? null,
        referenceId: job.referenceId ?? null,
    };
}

export function ProcessingTrayProvider({ children }) {
    const navigate = useNavigate();
    const [visible, setVisible] = useState(false);
    const [expanded, setExpanded] = useState(true);
    const [progress, setProgress] = useState(0);
    const [job, setJob] = useState(null); // { kind, titles, statusBuckets, completeCta*, completeNotificationType, referenceId }

    const intervalRef = useRef(null);
    const audioCtxRef = useRef(null);
    // completeCtaAction is a function → keep in ref so it survives reloads via re-registration.
    const ctaActionRef = useRef(null);

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
            /* ignore */
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

    const startJob = useCallback(
        (nextJob) => {
            if (!nextJob?.kind) return;
            clearTicker();
            ctaActionRef.current = nextJob.completeCtaAction ?? null;
            setJob(nextJob);
            setProgress(nextJob.autoComplete ? 100 : 0);
            setVisible(true);
            setExpanded(true);
            writePersisted({ job: persistableJob(nextJob), startedAt: Date.now() });
            if (nextJob.autoComplete) {
                playTing();
            } else {
                startTicker();
            }
        },
        [clearTicker, playTing, startTicker],
    );

    const completeJob = useCallback(() => {
        clearTicker();
        clearPersisted();
        setProgress((prev) => {
            if (prev >= 100) return prev;
            playTing();
            return 100;
        });
        setVisible(true);
    }, [clearTicker, playTing]);

    const hideTray = useCallback(() => {
        clearTicker();
        clearPersisted();
        ctaActionRef.current = null;
        setJob(null);
        setVisible(false);
    }, [clearTicker]);

    useEffect(() => () => clearTicker(), [clearTicker]);

    // Resume on mount — restore the job, jump the progress bar to where the
    // elapsed wall-clock time says it should be, and rebuild the CTA handler
    // (functions don't survive localStorage round-trips).
    const resumedRef = useRef(false);
    useEffect(() => {
        if (resumedRef.current) return;
        resumedRef.current = true;
        const persisted = readPersisted();
        if (!persisted) return;
        const resumedProgress = computeProgressFromElapsed(persisted.startedAt);
        ctaActionRef.current = buildCtaAction(
            persisted.job.kind,
            persisted.job.referenceId,
            navigate,
        );
        setJob(persisted.job);
        setProgress(resumedProgress);
        setVisible(true);
        setExpanded(true);
        if (resumedProgress < MOCK_CAP) startTicker();
    }, [startTicker, navigate]);

    // Completion matcher: look for a notification that matches the active job's
    // completeNotificationType and referenceId, snap to 100% when found.
    const notifications = useSelector((s) => s.notification?.items);
    const handledNotifIdRef = useRef(null);

    useEffect(() => {
        if (!visible || progress >= 100 || !job?.completeNotificationType || !notifications?.length) return;
        const match = notifications.find((n) => {
            if (n.type !== job.completeNotificationType) return false;
            if (!job.referenceId) return true;
            const rid = n.referenceId ?? extractRoomIdFromActionUrl(n.actionUrl);
            return rid && String(rid) === String(job.referenceId);
        });
        if (!match || match.id === handledNotifIdRef.current) return;
        handledNotifIdRef.current = match.id;
        completeJob();
    }, [notifications, visible, progress, job, completeJob]);

    // Auto-start: if a "start" notification arrives and nothing is currently
    // running, the provider can inflate a job from a registered factory. The
    // page that knows how to build the job (e.g. RoadmapDashboard) registers
    // its factory via registerAutoStartFactory. Without a registered factory
    // the start notification is ignored.
    const autoFactoriesRef = useRef(new Map()); // startType → (notification) => jobConfig

    // Built-in factories: RoadmapUpdateStarted → roadmap job (candidate),
    // AiAnalysisStarted → collect-questions job (coach). Registered on mount.
    useEffect(() => {
        const roadmapFactory = (n) => ({
            kind: "roadmap",
            runningTitle: "Updating your roadmap…",
            completeTitle: "Roadmap updated!",
            completeCtaLabel: "View Roadmap",
            statusBuckets: ROADMAP_STATUS_BUCKETS,
            completeNotificationType: "RoadmapUpdated",
            referenceId: n.referenceId ?? extractRoomIdFromActionUrl(n.actionUrl),
            completeCtaAction: () => navigate(n.actionUrl ?? "/roadmap"),
        });
        const aiAnalysisFactory = (n) => {
            const referenceId = n.referenceId ?? extractRoomIdFromActionUrl(n.actionUrl);
            return {
                kind: "collect-questions",
                runningTitle: "Analyzing questions…",
                completeTitle: "Analysis Complete!",
                completeCtaLabel: "Review Now",
                statusBuckets: QUESTION_STATUS_BUCKETS,
                completeNotificationType: "AiAnalysisCompleted",
                referenceId,
                completeCtaAction: () =>
                    navigate(
                        n.actionUrl ??
                            (referenceId
                                ? `/interview?roomId=${referenceId}&action=review-questions`
                                : "/interview"),
                    ),
            };
        };
        autoFactoriesRef.current.set("RoadmapUpdateStarted", roadmapFactory);
        autoFactoriesRef.current.set("AiAnalysisStarted", aiAnalysisFactory);
        return () => {
            if (autoFactoriesRef.current.get("RoadmapUpdateStarted") === roadmapFactory) {
                autoFactoriesRef.current.delete("RoadmapUpdateStarted");
            }
            if (autoFactoriesRef.current.get("AiAnalysisStarted") === aiAnalysisFactory) {
                autoFactoriesRef.current.delete("AiAnalysisStarted");
            }
        };
    }, [navigate]);

    const registerAutoStartFactory = useCallback((startType, factory) => {
        if (!startType || typeof factory !== "function") return () => {};
        autoFactoriesRef.current.set(startType, factory);
        return () => {
            if (autoFactoriesRef.current.get(startType) === factory) {
                autoFactoriesRef.current.delete(startType);
            }
        };
    }, []);

    useEffect(() => {
        if (!notifications?.length || autoFactoriesRef.current.size === 0) return;
        if (visible) return; // already running something
        const handled = readHandledStartIds();
        // Iterate oldest-first by scanning bottom-up (items are prepended newest-first)
        for (let i = notifications.length - 1; i >= 0; i--) {
            const n = notifications[i];
            if (handled.has(n.id)) continue;
            const factory = autoFactoriesRef.current.get(n.type);
            if (!factory) continue;
            const config = factory(n);
            if (!config) continue;

            // Check if the matching "complete" notification already arrived.
            const alreadyDone = config.completeNotificationType
                ? notifications.some((c) => {
                      if (c.type !== config.completeNotificationType) return false;
                      if (!config.referenceId) return true;
                      const rid = c.referenceId ?? extractRoomIdFromActionUrl(c.actionUrl);
                      return rid && String(rid) === String(config.referenceId);
                  })
                : false;

            startJob({ ...config, autoComplete: alreadyDone });
            handled.add(n.id);
            writeHandledStartIds(handled);
            break; // only auto-start one job per effect run
        }
    }, [notifications, visible, startJob]);

    useEffect(() => {
        if (import.meta.env?.DEV) {
            window.__startTrayJob = startJob;
            window.__completeTrayJob = completeJob;
        }
    }, [startJob, completeJob]);

    const handleReview = useCallback(() => {
        const action = ctaActionRef.current;
        setVisible(false);
        clearPersisted();
        if (typeof action === "function") action();
    }, []);

    const status = useMemo(
        () => (job ? resolveStatusLabel(job.statusBuckets, progress) : ""),
        [job, progress],
    );

    const value = useMemo(
        () => ({ startJob, completeJob, hideTray, registerAutoStartFactory }),
        [startJob, completeJob, hideTray, registerAutoStartFactory],
    );

    return (
        <ProcessingTrayContext.Provider value={value}>
            {children}
            {visible && job && (
                <CollectQuestionProcessingTray
                    progress={progress}
                    status={status}
                    runningTitle={job.runningTitle}
                    completeTitle={job.completeTitle}
                    completeCtaLabel={job.completeCtaLabel}
                    isComplete={progress >= 100}
                    expanded={expanded}
                    onToggle={() => setExpanded((v) => !v)}
                    onReview={handleReview}
                    onClose={hideTray}
                />
            )}
        </ProcessingTrayContext.Provider>
    );
}

export function useProcessingTray() {
    const ctx = useContext(ProcessingTrayContext);
    if (!ctx) throw new Error("useProcessingTray must be used within ProcessingTrayProvider");
    return ctx;
}
