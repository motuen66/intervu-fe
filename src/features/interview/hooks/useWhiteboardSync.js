import { useRef, useCallback } from "react";

// ---------------------------------------------------------------------------
// useWhiteboardSync
//
// Real-time Excalidraw whiteboard sync via SignalR.
// Only syncs ELEMENTS (not appState) so each peer keeps their own tool/color.
//
// Key design choices:
//   - 80ms throttle with trailing flush (not debounce) — ensures intermediate
//     states are sent during active drawing, not just the final stroke.
//   - Element version fingerprint — skips onChange calls that don't change
//     any element (tool switches, selections, etc.).
//   - Timestamp-based echo guard (150ms) — prevents remote apply from
//     echoing back as a "local change" send.
// ---------------------------------------------------------------------------
export function useWhiteboardSync({ sendSignal, roomId }) {
  const excalidrawAPIRef = useRef(null);

  // ── Throttle state ──────────────────────────────────────────────────────
  const lastSendTime = useRef(0);
  const throttleTimer = useRef(null);
  const lastFingerprint = useRef("");

  // ── Echo guard ──────────────────────────────────────────────────────────
  const lastRemoteApplyTime = useRef(0);

  // ── Build a fingerprint from element ids + versions ─────────────────────
  const buildFingerprint = (elements) =>
    elements.map((e) => e.id + ":" + e.version).join(",");

  // ── Send elements to peers ──────────────────────────────────────────────
  const sendElements = useCallback(
    (elements) => {
      if (!sendSignal) return;
      const json = JSON.stringify(elements);
      sendSignal("SendWhiteboardState", roomId, json, "").catch(console.error);
      lastSendTime.current = Date.now();
    },
    [sendSignal, roomId]
  );

  // ── Flush: force-send the latest elements NOW ──────────────────────────
  const flushWhiteboardState = useCallback(() => {
    if (!excalidrawAPIRef.current) return;
    const elements = excalidrawAPIRef.current.getSceneElements();
    if (!elements || elements.length === 0) return;

    const fp = buildFingerprint(elements);
    if (fp === lastFingerprint.current) return;
    lastFingerprint.current = fp;

    if (throttleTimer.current) {
      clearTimeout(throttleTimer.current);
      throttleTimer.current = null;
    }
    sendElements(elements);
  }, [sendElements]);

  // ── Receive handlers ────────────────────────────────────────────────────

  const applyExternalWhiteboardState = useCallback((elementsJson) => {
    if (!excalidrawAPIRef.current) return;
    try {
      const elements = JSON.parse(elementsJson);
      lastRemoteApplyTime.current = Date.now();
      excalidrawAPIRef.current.updateScene({ elements });
    } catch (err) {
      console.error("[WhiteboardSync] Failed to apply external state:", err);
    }
  }, []);

  const initFromWhiteboardState = useCallback((elementsJson) => {
    if (!excalidrawAPIRef.current) return;
    if (!elementsJson) return;
    try {
      const elements = JSON.parse(elementsJson);
      lastRemoteApplyTime.current = Date.now();
      excalidrawAPIRef.current.updateScene({ elements });
    } catch (err) {
      console.error("[WhiteboardSync] Failed to init from state:", err);
    }
  }, []);

  // ── Local change handler (80ms throttle with trailing edge) ─────────────

  const handleWhiteboardChange = useCallback(
    (elements, _appState) => {
      if (!sendSignal) return;

      // Echo guard: skip if this onChange was triggered by a remote apply
      if (Date.now() - lastRemoteApplyTime.current < 150) return;

      // Version fingerprint: skip if no element actually changed
      const fp = buildFingerprint(elements);
      if (fp === lastFingerprint.current) return;

      const now = Date.now();
      const elapsed = now - lastSendTime.current;

      if (elapsed >= 80) {
        // Enough time has passed — send immediately
        lastFingerprint.current = fp;
        if (throttleTimer.current) {
          clearTimeout(throttleTimer.current);
          throttleTimer.current = null;
        }
        sendElements(elements);
      } else {
        // Within throttle window — schedule trailing send
        if (throttleTimer.current) clearTimeout(throttleTimer.current);
        throttleTimer.current = setTimeout(() => {
          throttleTimer.current = null;
          // Re-check fingerprint at send time (elements may have changed again)
          if (!excalidrawAPIRef.current) return;
          const latestElements = excalidrawAPIRef.current.getSceneElements();
          const latestFp = buildFingerprint(latestElements);
          if (latestFp === lastFingerprint.current) return;
          lastFingerprint.current = latestFp;
          sendElements(latestElements);
        }, 80 - elapsed);
      }
    },
    [sendSignal, sendElements]
  );

  return {
    excalidrawAPIRef,
    handleWhiteboardChange,
    applyExternalWhiteboardState,
    initFromWhiteboardState,
    flushWhiteboardState,
  };
}
