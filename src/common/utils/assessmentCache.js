const CACHE_PREFIX = "assessment_cache:";
const EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

export const setAssessmentCache = (userId, data) => {
    if (!userId) return;
    try {
        const payload = { ts: Date.now(), data };
        localStorage.setItem(CACHE_PREFIX + userId, JSON.stringify(payload));
    } catch (e) {
        // ignore storage errors
    }
};

export const getAssessmentCache = (userId) => {
    if (!userId) return null;
    try {
        const raw = localStorage.getItem(CACHE_PREFIX + userId);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
};

export const isAssessmentCacheValid = (userId) => {
    const entry = getAssessmentCache(userId);
    if (!entry || !entry.ts) return false;
    return Date.now() - entry.ts < EXPIRY_MS;
};

export const clearAssessmentCache = (userId) => {
    if (!userId) return;
    try {
        localStorage.removeItem(CACHE_PREFIX + userId);
    } catch (e) {
        // ignore
    }
};

export const getAssessmentDataFromCache = (userId) => {
    const entry = getAssessmentCache(userId);
    return entry?.data ?? null;
};

export default {
    setAssessmentCache,
    getAssessmentCache,
    isAssessmentCacheValid,
    clearAssessmentCache,
    getAssessmentDataFromCache,
};

// --- progress cache (in-progress assessment snapshot) ---
const PROGRESS_PREFIX = "assessment_progress:";

export const setProgressCache = (userId, data) => {
    if (!userId) return;
    try {
        const payload = { ts: Date.now(), data };
        localStorage.setItem(PROGRESS_PREFIX + userId, JSON.stringify(payload));
    } catch (e) {
        // ignore
    }
};

export const getProgressCache = (userId) => {
    if (!userId) return null;
    try {
        const raw = localStorage.getItem(PROGRESS_PREFIX + userId);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
};

export const isProgressCacheValid = (userId, expiryMs = EXPIRY_MS) => {
    const entry = getProgressCache(userId);
    if (!entry || !entry.ts) return false;
    return Date.now() - entry.ts < expiryMs;
};

export const clearProgressCache = (userId) => {
    if (!userId) return;
    try {
        localStorage.removeItem(PROGRESS_PREFIX + userId);
    } catch (e) {}
};

export const getProgressDataFromCache = (userId) => {
    const entry = getProgressCache(userId);
    return entry?.data ?? null;
};
