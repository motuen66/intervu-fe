export const QUESTION_STATUS_BUCKETS = [
    { from: 0, label: "Checking duplicates" },
    { from: 25, label: "Extracting keywords" },
    { from: 50, label: "Formatting results" },
    { from: 75, label: "Finalizing" },
];

export const ROADMAP_STATUS_BUCKETS = [
    { from: 0, label: "Analyzing your feedback" },
    { from: 25, label: "Reviewing roadmap nodes" },
    { from: 55, label: "Recalculating progress" },
    { from: 80, label: "Saving your roadmap" },
];

export function resolveStatusLabel(buckets, progress) {
    if (!Array.isArray(buckets) || buckets.length === 0) return "";
    let current = buckets[0].label;
    for (const bucket of buckets) {
        if (progress >= bucket.from) current = bucket.label;
    }
    return current;
}
