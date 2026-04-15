import { useState, useRef, useCallback, useEffect } from "react";
import { DeepgramClient, logging } from "@deepgram/sdk";
import { ROLES } from "../../../common/constants/common.js";
import { callApi } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";
import { interviewEndPoints } from "../services/interviewRoomApi";

function getDisplayRole(role) {
    return role === ROLES.INTERVIEWER ? "Coach" : (role === ROLES.CANDIDATE ? "Candidate" : String(role ?? ""));
}

function getCombinedTranscriptStorageKey(roomId) {
    return `transcript_combined_${roomId}`;
}

function getRoleTranscriptStorageKey(roomId, role) {
    return `transcript_role_${roomId}_${getDisplayRole(role)}`;
}

/**
 * Unified Audio Logic Hook.
 * Per-speaker transcription path: each client transcribes only its own local mic stream,
 * then broadcasts transcript updates to the peer via signaling.
 * Uses a single MediaRecorder for both transcription (1s) and upload buffering (15s, interviewer only).
 */
export function useDeepgramTranscript({
    roomId,
    isEnabled = false,
    isMicOn = false,
    audioStream = null, // Local mic stream for this participant
    isTranscriptionEnabled = false,
    deepgramApiKey = import.meta.env.VITE_DEEPGRAM_API_KEY,
    onTranscriptUpdate = null,
    user
}) {
    const mediaRecorderRef = useRef(null);
    const deepgramConnectionRef = useRef(null);
    const deepgramSessionIdRef = useRef(0);
    const deepgramKeepAliveRef = useRef(null);
    const accumulatedBlobs = useRef([]);
    const lastUploadTime = useRef(Date.now());
    const chunkSequenceRef = useRef(0);

    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcriptHistory, setTranscriptHistory] = useState([]);
    const [interimTranscript, setInterimTranscript] = useState("");

    // --- Persistence ---
    useEffect(() => {
        if (!roomId) return;
        const saved = localStorage.getItem(getCombinedTranscriptStorageKey(roomId));
        if (!saved) return;
        try {
            setTranscriptHistory(JSON.parse(saved));
        } catch (e) {
            console.error("Failed to parse saved transcript", e);
        }
    }, [roomId]);

    const addTranscriptItem = useCallback((text, role) => {
        if (!text || !text.trim()) return;
        const displayRole = getDisplayRole(role);
        setTranscriptHistory((prev) => {
            const lastItem = prev[prev.length - 1];
            let newHistory;
            if (lastItem && lastItem.role === displayRole) {
                newHistory = [...prev];
                newHistory[newHistory.length - 1] = { ...lastItem, text: `${lastItem.text} ${text}`.trim() };
            } else {
                const newIndex = lastItem ? lastItem.index + 1 : 1;
                newHistory = [...prev, { index: newIndex, role: displayRole, text: text.trim() }];
            }
            if (roomId) {
                localStorage.setItem(getCombinedTranscriptStorageKey(roomId), JSON.stringify(newHistory));
                localStorage.setItem(getRoleTranscriptStorageKey(roomId, role), JSON.stringify(newHistory.filter(i => i.role === displayRole)));
            }
            return newHistory;
        });
    }, [roomId]);

    // --- API Upload ---
    const uploadChunk = useCallback(async (blob, sequence) => {
        if (!blob || blob.size === 0 || !roomId) return;
        try {
            const arrayBuffer = await blob.arrayBuffer();
            const byteArray = Array.from(new Uint8Array(arrayBuffer));
            await callApi({
                method: METHOD.POST,
                endpoint: interviewEndPoints.STORE_AUDIO_CHUNK,
                arg: {
                    audioData: byteArray,
                    recordingSessionId: roomId,
                    sequenceNumber: sequence
                }
            });
            console.log(`[AudioRecorder] Uploaded combined chunk ${sequence} (${blob.size} bytes)`);
        } catch (error) {
            console.error("[AudioRecorder] Upload error:", error);
        }
    }, [roomId]);

    const flushAndUpload = useCallback(async () => {
        if (accumulatedBlobs.current.length === 0) return;
        const blobsToUpload = [...accumulatedBlobs.current];
        accumulatedBlobs.current = [];
        lastUploadTime.current = Date.now();
        const combinedBlob = new Blob(blobsToUpload, { type: "audio/webm;codecs=opus" });
        const currentSeq = chunkSequenceRef.current++;
        await uploadChunk(combinedBlob, currentSeq);
    }, [uploadChunk]);

    // --- Deepgram ---
    const stopDeepgram = useCallback(() => {
        deepgramSessionIdRef.current += 1;
        if (deepgramKeepAliveRef.current) {
            clearInterval(deepgramKeepAliveRef.current);
            deepgramKeepAliveRef.current = null;
        }
        if (deepgramConnectionRef.current) {
            try { deepgramConnectionRef.current.close(); } catch (e) {}
            deepgramConnectionRef.current = null;
        }
        setIsTranscribing(false);
        setInterimTranscript("");
    }, []);

    const startDeepgram = useCallback(async () => {
        if (!deepgramApiKey || !audioStream || !isTranscriptionEnabled) return;
        const hasEnabledAudioTrack = audioStream
            ?.getAudioTracks()
            ?.some((track) => track.readyState === "live" && track.enabled);
        if (!hasEnabledAudioTrack) return;

        // Single active Deepgram socket per tab.
        const existing = deepgramConnectionRef.current;
        if (existing && (existing.readyState === 0 || existing.readyState === 1)) {
            return;
        }

        const sessionId = deepgramSessionIdRef.current + 1;
        deepgramSessionIdRef.current = sessionId;
        try {
            const deepgram = new DeepgramClient({
                apiKey: deepgramApiKey,
                logging: {
                    level: logging.LogLevel.Debug,
                    logger: new logging.ConsoleLogger(),
                    silent: false,
                },
            });

            const connection = await deepgram.listen.v1.createConnection({
                model: "nova-3",
                language: "en",
                smart_format: true,
                interim_results: true,
                // multichannel: true, // Crucial: separates Local (Ch 0) from Mixed
                keepAlive: true
            });

            if (deepgramSessionIdRef.current !== sessionId) {
                try { connection.close(); } catch (e) {}
                return;
            }

            if (deepgramKeepAliveRef.current) {
                clearInterval(deepgramKeepAliveRef.current);
            }
            deepgramKeepAliveRef.current = setInterval(() => {
                if (connection.readyState === 1) {
                    connection.sendMedia({ type: "KeepAlive" });
                }
            }, 3000);

            connection.on("open", () => {
                if (deepgramSessionIdRef.current !== sessionId) return;
                setIsTranscribing(true);
            });
            connection.on("message", (data) => {
                if (deepgramSessionIdRef.current !== sessionId) return;

                if (data?.type === "Metadata") {
                    // Informational event from Deepgram; do not reconnect on metadata.
                    console.debug("[Deepgram] Metadata:", data);
                    return;
                }

                if (data.type === "Results") {
                    const channel = data.channel || data.results?.channels?.[0];
                    const text = channel?.alternatives?.[0]?.transcript;
                    if (!text) return;

                    if (data.is_final) {
                        addTranscriptItem(text, user?.role);
                        setInterimTranscript("");
                        if (onTranscriptUpdate) onTranscriptUpdate(text, true, user?.role);
                    } else {
                        setInterimTranscript(text);
                        if (onTranscriptUpdate) onTranscriptUpdate(text, false, user?.role);
                    }
                }
            });
            connection.on("error", (err) => console.error("[Deepgram] Error:", err));
            connection.on("close", () => {
                if (deepgramSessionIdRef.current !== sessionId) return;
                setIsTranscribing(false);
                if (deepgramKeepAliveRef.current) {
                    clearInterval(deepgramKeepAliveRef.current);
                    deepgramKeepAliveRef.current = null;
                }
                if (deepgramConnectionRef.current === connection) {
                    deepgramConnectionRef.current = null;
                }
            });
            deepgramConnectionRef.current = connection;

            if (typeof connection.connect === "function") {
                connection.connect();
                await connection.waitForOpen();
            }
        } catch (err) { console.error("[Deepgram] Setup failed:", err); }
    }, [deepgramApiKey, audioStream, isTranscriptionEnabled, onTranscriptUpdate, addTranscriptItem, user?.role]);

    // --- Recorder Lifecycle ---
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
            if (user?.role === ROLES.INTERVIEWER) flushAndUpload();
        }
        mediaRecorderRef.current = null;
        stopDeepgram();
    }, [stopDeepgram, user?.role, flushAndUpload]);

    const startRecording = useCallback(async () => {
        if (!isEnabled || !roomId || !audioStream || !isMicOn) return;
        try {
            const options = { mimeType: "audio/webm;codecs=opus" };
            const mediaRecorder = new MediaRecorder(audioStream, options);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (!(event.data && event.data.size > 0)) return;
                
                // 1. Send 1s chunk to Deepgram
                if (deepgramConnectionRef.current?.readyState === 1 && isTranscriptionEnabled) {
                    deepgramConnectionRef.current.sendMedia(event.data);
                }

                // 2. Buffer for 15s API Upload (Interviewer Only)
                if (user?.role === ROLES.INTERVIEWER) {
                    accumulatedBlobs.current.push(event.data);
                    if (Date.now() - lastUploadTime.current >= 15000) {
                        flushAndUpload();
                    }
                }
            };

            mediaRecorder.start(1000);
            if (isTranscriptionEnabled) await startDeepgram();
        } catch (error) { console.error("[Recorder] Start failed:", error); }
    }, [isEnabled, roomId, audioStream, isMicOn, isTranscriptionEnabled, startDeepgram, user?.role, flushAndUpload]);

    useEffect(() => {
        if (isEnabled && roomId && audioStream && isMicOn) {
            if (!mediaRecorderRef.current) startRecording();
        } else {
            stopRecording();
        }
    }, [isEnabled, roomId, audioStream, isMicOn, startRecording, stopRecording]);

    useEffect(() => {
        return () => stopRecording();
    }, [stopRecording]);

    return {
        transcriptHistory,
        interimTranscript,
        addRemoteTranscript: (text, role) => addTranscriptItem(text, role),
        isTranscribing,
        clearTranscriptHistory: () => {
            setTranscriptHistory([]);
            if (roomId) localStorage.removeItem(getCombinedTranscriptStorageKey(roomId));
        }
    };
}
