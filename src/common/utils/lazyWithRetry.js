import { lazy } from "react";

const CHUNK_ERROR_MARKER = "chunk-reload-marker";

const isChunkLoadError = (error) => {
    const message = String(error?.message || "");
    return (
        message.includes("Failed to fetch dynamically imported module") ||
        message.includes("Importing a module script failed") ||
        message.includes("ChunkLoadError")
    );
};

export function lazyWithRetry(importer, key = "default") {
    const markerKey = `${CHUNK_ERROR_MARKER}:${key}`;
    return lazy(async () => {
        try {
            const module = await importer();
            sessionStorage.removeItem(markerKey);
            return module;
        } catch (error) {
            const hasRefreshed = sessionStorage.getItem(markerKey) === "1";
            if (!hasRefreshed && isChunkLoadError(error)) {
                sessionStorage.setItem(markerKey, "1");
                window.location.reload();
                return new Promise(() => {});
            }

            sessionStorage.removeItem(markerKey);
            throw error;
        }
    });
}
