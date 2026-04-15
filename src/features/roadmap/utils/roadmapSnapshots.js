// B3: client-side progress telemetry — captures a status-per-skill snapshot on
// each roadmap load and derives monthly "wins" from the earliest snapshot in
// the 30-day window. Backend history endpoint is not yet implemented; this
// gives users the retention signal without waiting for it.

const STORAGE_KEY = "intervu.roadmap.snapshots";
const MAX_SNAPSHOTS_PER_USER = 12;
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

const readStore = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

const writeStore = (store) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
        // ignore quota / privacy-mode errors
    }
};

const buildStatusMap = (roadmap) => {
    const map = {};
    (roadmap?.phases ?? []).forEach((phase) => {
        (phase.nodes ?? []).forEach((node) => {
            if (node?.skill_id) {
                map[node.skill_id] = {
                    status: node.assessment?.status ?? "Missing",
                    progress: Number(node.assessment?.progress) || 0,
                    name: node.skill_name ?? "",
                };
            }
        });
    });
    return map;
};

export const recordRoadmapSnapshot = (userId, roadmap) => {
    if (!userId || !roadmap) return;
    const store = readStore();
    const snapshots = Array.isArray(store[userId]) ? store[userId] : [];
    const latest = snapshots[snapshots.length - 1];
    const statusMap = buildStatusMap(roadmap);

    // skip if identical to latest snapshot to avoid log spam
    if (latest && JSON.stringify(latest.statusMap) === JSON.stringify(statusMap)) {
        return;
    }

    snapshots.push({ at: Date.now(), statusMap });
    store[userId] = snapshots.slice(-MAX_SNAPSHOTS_PER_USER);
    writeStore(store);
};

export const getMonthlyWins = (userId, roadmap) => {
    if (!userId || !roadmap) return null;
    const store = readStore();
    const snapshots = Array.isArray(store[userId]) ? store[userId] : [];
    const cutoff = Date.now() - WINDOW_MS;
    const baseline = snapshots.find((snap) => snap.at >= cutoff) ?? snapshots[0];
    if (!baseline) return null;

    const current = buildStatusMap(roadmap);
    let completedThisMonth = 0;
    let improvedThisMonth = 0;
    Object.entries(current).forEach(([skillId, currentEntry]) => {
        const previousEntry = baseline.statusMap?.[skillId];
        if (!previousEntry) return;
        if (previousEntry.status !== "Complete" && currentEntry.status === "Complete") {
            completedThisMonth += 1;
        } else if (previousEntry.status === "Missing" && currentEntry.status === "Weak") {
            improvedThisMonth += 1;
        }
    });

    return {
        completedThisMonth,
        improvedThisMonth,
        since: baseline.at,
    };
};
