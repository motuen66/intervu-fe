import { useRef, useState, useEffect, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import { BE_BASE_URL } from "../../../common/constants/env";

// ---------------------------------------------------------------------------
// useInterviewSignalR
//
// Manages the SignalR hub connection for the interview room and acts as the
// "signaling bridge" between the server and the WebRTC / code-sync layers.
//
// Design principle: this hook owns NO WebRTC or code state.  It receives
// all external handlers via a single `callbacks` ref bag so the hook never
// needs to be recreated when handlers change.
//
// Inputs
//   roomId            – string
//   userId            – string | undefined
//   role              – string | undefined
//   callbacks         – React.MutableRefObject<{
//       // WebRTC bridge
//       onOffer:           (fromId, sdp) => void
//       onAnswer:          (fromId, sdp) => void
//       onIce:             (fromId, candidateStr) => void
//       onPeerJoin:        (targetId) => void
//       onPeerLeave:       (targetId) => void
//       // Code sync bridge
//       onReceiveCode:          (code, lang) => void
//       onReceiveLanguage:      (lang, code) => void
//       onReceiveFullState:     (state) => void
//       onReceiveProblem:       (desc, shortName, testCases) => void
//       onReceiveExecutionResult: (result) => void
//       onReceiveTestResults:   (results) => void
//   }>
//
// Outputs
//   connectionId  – string | null   (own SignalR connectionId)
//   peers         – string[]        (remote peer connectionIds)
//   roomState     – object | null   (last received ReceiveFullState payload)
//   sendSignal    – async (method, ...args) => void
//   leaveRoom     – () => void
// ---------------------------------------------------------------------------
export function useInterviewSignalR({ roomId, userId, role, callbacks }) {
  const [connectionId, setConnectionId] = useState(null);
  const [peers, setPeers] = useState([]);
  const [roomState, setRoomState] = useState(null);

  const connRef = useRef(null);

  // sendSignal is stable across re-renders because it reads connRef.current.
  const sendSignal = useCallback(async (method, ...args) => {
    const conn = connRef.current;
    if (!conn || conn.state !== signalR.HubConnectionState.Connected) {
      console.warn(`[SignalR] Cannot invoke "${method}": not connected.`);
      return;
    }
    return conn.invoke(method, ...args);
  }, []);

  const leaveRoom = useCallback(() => {
    const conn = connRef.current;
    if (!conn) return;
    conn.invoke("LeaveRoom", roomId).catch(() => {});
    conn.stop();
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !userId) return;

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(
        `${BE_BASE_URL}/hubs/interviewroom?userId=${userId}&role=${role ?? ""}`,
        { withCredentials: false }
      )
      .withAutomaticReconnect([0, 1000, 2000, 5000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connRef.current = conn;

    // ── Connection lifecycle ───────────────────────────────────────────────

    conn.onreconnected((newId) => {
      console.log("[SignalR] Reconnected, new id:", newId);
      setConnectionId(newId ?? null);
      conn.invoke("JoinRoom", roomId).catch(console.error);
    });

    conn.onclose(() => {
      console.log("[SignalR] Connection closed.");
      setConnectionId(null);
    });

    // ── Peer presence ──────────────────────────────────────────────────────

    conn.on("UserJoined", (id) => {
      console.log("[SignalR] UserJoined:", id);
      setPeers((prev) => {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      });
      callbacks.current?.onPeerJoin?.(id);
    });

    conn.on("UserLeft", (id) => {
      console.log("[SignalR] UserLeft:", id);
      setPeers((prev) => prev.filter((x) => x !== id));
      callbacks.current?.onPeerLeave?.(id);
    });

    conn.on("ExistingPeers", (existing) => {
      console.log("[SignalR] ExistingPeers:", existing);
      setPeers(existing);
      // Initiate a WebRTC connection to every peer already in the room
      for (const peerId of existing) {
        callbacks.current?.onPeerJoin?.(peerId);
      }
    });

    // ── Room state ─────────────────────────────────────────────────────────

    conn.on("ReceiveFullState", (state) => {
      console.log("[SignalR] ReceiveFullState:", state);
      setRoomState(state);
      callbacks.current?.onReceiveFullState?.(state);
    });

    // ── WebRTC signaling ───────────────────────────────────────────────────

    conn.on("ReceiveOffer", (fromId, sdp) => {
      console.log("[SignalR] ReceiveOffer from:", fromId);
      callbacks.current?.onOffer?.(fromId, sdp);
    });

    conn.on("ReceiveAnswer", (fromId, sdp) => {
      console.log("[SignalR] ReceiveAnswer from:", fromId);
      callbacks.current?.onAnswer?.(fromId, sdp);
    });

    conn.on("ReceiveIceCandidate", (fromId, candidate) => {
      callbacks.current?.onIce?.(fromId, candidate);
    });

    // ── Code sync ──────────────────────────────────────────────────────────

    conn.on("ReceiveCode", (code, lang) => {
      callbacks.current?.onReceiveCode?.(code, lang);
    });

    conn.on("ReceiveLanguage", (lang, codeForLang) => {
      callbacks.current?.onReceiveLanguage?.(lang, codeForLang);
    });

    conn.on("ReceiveProblem", (description, shortName, testCases) => {
      callbacks.current?.onReceiveProblem?.(description, shortName, testCases);
    });

    conn.on("ReceiveExecutionResult", (result) => {
      callbacks.current?.onReceiveExecutionResult?.(result);
    });

    conn.on("ReceiveTestResults", (results) => {
      callbacks.current?.onReceiveTestResults?.(results);
    });

    // ── Camera / mic state from peers ─────────────────────────────────────
    conn.on("ReceiveCameraState", (fromId, isOn) => {
      callbacks.current?.onReceiveCameraState?.(fromId, isOn);
    });

    conn.on("ReceiveMicState", (fromId, isOn) => {
      callbacks.current?.onReceiveMicState?.(fromId, isOn);
    });

    // ── Start the connection ───────────────────────────────────────────────
    conn
      .start()
      .then(() => {
        const id = conn.connectionId;
        console.log("[SignalR] Connected, id:", id);
        setConnectionId(id ?? null);
        return conn.invoke("JoinRoom", roomId);
      })
      .catch(console.error);

    return () => {
      conn.off("UserJoined");
      conn.off("UserLeft");
      conn.off("ExistingPeers");
      conn.off("ReceiveFullState");
      conn.off("ReceiveOffer");
      conn.off("ReceiveAnswer");
      conn.off("ReceiveIceCandidate");
      conn.off("ReceiveCode");
      conn.off("ReceiveLanguage");
      conn.off("ReceiveProblem");
      conn.off("ReceiveExecutionResult");
      conn.off("ReceiveTestResults");
      conn.off("ReceiveCameraState");
      conn.off("ReceiveMicState");

      conn.invoke("LeaveRoom", roomId).catch(() => {});
      conn.stop();
      connRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userId, role]); // callbacks ref is stable; not needed in deps

  return {
    connectionId,
    peers,
    roomState,
    sendSignal,
    leaveRoom,
  };
}
