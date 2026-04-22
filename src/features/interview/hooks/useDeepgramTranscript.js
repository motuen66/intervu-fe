import { useState, useRef, useCallback, useEffect } from "react";
import { DeepgramClient, logging } from "@deepgram/sdk";
import { ROLES } from "../../../common/constants/common.js";
import { callApi } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";
import { interviewEndPoints } from "../services/interviewRoomApi";

function getDisplayRole(role) {
    const roleNum = Number(role);
    if (roleNum === ROLES.INTERVIEWER) return "Coach";
    if (roleNum === ROLES.CANDIDATE) return "Candidate";
    return String(role ?? "");
}

function getCombinedTranscriptStorageKey(roomId) {
    return `transcript_combined_${roomId}`;
}

function getRoleTranscriptStorageKey(roomId, role) {
    return `transcript_role_${roomId}_${getDisplayRole(role)}`;
}

function getPreferredMediaRecorderOptions() {
    const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
    if (typeof MediaRecorder === "undefined") return undefined;

    for (const mimeType of candidates) {
        if (typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported(mimeType)) {
            return { mimeType };
        }
    }

    return undefined;
}

function hasLiveAudioTrack(stream) {
    return stream?.getAudioTracks?.().some((track) => track.readyState === "live" && track.enabled);
}

function stopMediaRecorder(recorder, timeoutMs = 2000) {
    if (!recorder || recorder.state === "inactive") {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        let settled = false;
        let timeoutId = null;

        const finish = () => {
            if (settled) return;
            settled = true;
            recorder.removeEventListener("stop", handleStop);
            recorder.removeEventListener("error", handleError);
            if (timeoutId) clearTimeout(timeoutId);
            resolve();
        };

        const handleStop = () => finish();
        const handleError = () => finish();

        recorder.addEventListener("stop", handleStop);
        recorder.addEventListener("error", handleError);
        timeoutId = setTimeout(finish, timeoutMs);

        try {
            recorder.stop();
        } catch (_) {
            finish();
        }
    });
}

/**
 * Deepgram transcript hook.
 * - Storage path: uploads mixed audio in 15s combined chunks (interviewer only).
 * - Transcript path: sends local mic audio to Deepgram every 1s chunk.
 */
export function useDeepgramTranscript({
    roomId,
    isEnabled = false,
    isMicOn = false,
    audioStream = null, // Mixed stream for storage
    transcriptionStream = null, // Local mic stream for transcription
    isTranscriptionEnabled = false,
    deepgramApiKey = import.meta.env.VITE_DEEPGRAM_API_KEY,
    onTranscriptUpdate = null,
    user,
}) {
    const storageRecorderRef = useRef(null);
    const transcriptRecorderRef = useRef(null);
    const deepgramConnectionRef = useRef(null);
    const deepgramSessionIdRef = useRef(0);
    const deepgramKeepAliveRef = useRef(null);
    const isStartingRef = useRef(false);
    const recorderSessionIdRef = useRef(0);
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
                localStorage.setItem(
                    getRoleTranscriptStorageKey(roomId, role),
                    JSON.stringify(newHistory.filter((i) => i.role === displayRole)),
                );
            }
            return newHistory;
        });
    }, [roomId]);

    // --- API Upload ---
    const uploadChunk = useCallback(
        async (blob, sequence) => {
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
                        sequenceNumber: sequence,
                    },
                    useGlobalLoading: false,
                });
                console.log(`[AudioRecorder] Uploaded combined chunk ${sequence} (${blob.size} bytes)`);
            } catch (error) {
                console.error("[AudioRecorder] Upload error:", error);
            }
        },
        [roomId],
    );

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
            try {
                deepgramConnectionRef.current.sendCloseStream({ type: "CloseStream" });
            } catch (_) { }
            try {
                deepgramConnectionRef.current.close();
            } catch (_) { }
            deepgramConnectionRef.current = null;
        }
        setIsTranscribing(false);
        setInterimTranscript("");
    }, []);

    const startDeepgram = useCallback(async () => {
        if (!deepgramApiKey || !transcriptionStream || !isTranscriptionEnabled) return false;
        if (!hasLiveAudioTrack(transcriptionStream)) return false;

        // Single active Deepgram socket per tab.
        const existing = deepgramConnectionRef.current;
        if (existing && (existing.readyState === 0 || existing.readyState === 1)) {
            return true;
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
                punctuate: true,
            });

            if (deepgramSessionIdRef.current !== sessionId) {
                try {
                    connection.close();
                } catch (_) { }
                return false;
            }

            connection.on("open", () => {
                if (deepgramSessionIdRef.current !== sessionId) return;
                setIsTranscribing(true);
            });
            connection.on("message", (data) => {
                if (deepgramSessionIdRef.current !== sessionId) return;

                if (!data?.type) return;

                if (data.type === "Metadata") {
                    return;
                }

                if (data.type === "Error") {
                    console.error("[Deepgram] Stream error:", data);
                    return;
                }

                if (data.type !== "Results") return;

                const channel = data.channel || data.results?.channels?.[0];
                const text = channel?.alternatives?.[0]?.transcript;
                if (!text || !text.trim()) return;

                if (data.is_final) {
                    addTranscriptItem(text, user?.role);
                    setInterimTranscript("");
                    if (onTranscriptUpdate) onTranscriptUpdate(text, true, user?.role);
                } else {
                    setInterimTranscript(text);
                    if (onTranscriptUpdate) onTranscriptUpdate(text, false, user?.role);
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
            }
            await connection.waitForOpen();

            if (deepgramSessionIdRef.current !== sessionId) {
                return false;
            }

            if (deepgramKeepAliveRef.current) {
                clearInterval(deepgramKeepAliveRef.current);
            }
            deepgramKeepAliveRef.current = setInterval(() => {
                const activeConnection = deepgramConnectionRef.current;
                if (!activeConnection || activeConnection.readyState !== 1) return;
                try {
                    activeConnection.sendKeepAlive({ type: "KeepAlive" });
                } catch (err) {
                    console.warn("[Deepgram] KeepAlive failed:", err);
                }
            }, 5000);

            return true;
        } catch (err) {
            console.error("[Deepgram] Setup failed:", err);
            stopDeepgram();
            return false;
        }
    }, [
        deepgramApiKey,
        transcriptionStream,
        isTranscriptionEnabled,
        onTranscriptUpdate,
        addTranscriptItem,
        user?.role,
        stopDeepgram,
    ]);

    const sendBlobToDeepgram = useCallback(async (blob) => {
        if (!blob || blob.size === 0 || !isTranscriptionEnabled) return;
        const connection = deepgramConnectionRef.current;
        if (!connection || connection.readyState !== 1) return;

        try {
            const arrayBuffer = await blob.arrayBuffer();
            if (arrayBuffer.byteLength === 0) return;
            connection.sendMedia(arrayBuffer);
        } catch (err) {
            console.error("[Deepgram] sendMedia failed:", err);
        }
    }, [isTranscriptionEnabled]);

    // --- Recorder Lifecycle ---
    const stopStorageRecorder = useCallback(async () => {
        const recorder = storageRecorderRef.current;
        storageRecorderRef.current = null;

        if (recorder && recorder.state !== "inactive") {
            await stopMediaRecorder(recorder);
        }

        // Flush after recorder stop so the final dataavailable chunk is included.
        if (Number(user?.role) === ROLES.INTERVIEWER) {
            await flushAndUpload();
        }
    }, [flushAndUpload, user?.role]);

    const stopTranscriptRecorder = useCallback(async () => {
        const recorder = transcriptRecorderRef.current;
        transcriptRecorderRef.current = null;

        if (recorder && recorder.state !== "inactive") {
            await stopMediaRecorder(recorder);
        }
    }, []);

    const startStorageRecorder = useCallback(() => {
        if (Number(user?.role) !== ROLES.INTERVIEWER) return;
        if (!audioStream || !hasLiveAudioTrack(audioStream)) return;
        if (storageRecorderRef.current) return;

        try {
            const recorder = new MediaRecorder(audioStream, getPreferredMediaRecorderOptions());
            storageRecorderRef.current = recorder;

            recorder.ondataavailable = (event) => {
                if (!(event.data && event.data.size > 0)) return;

                accumulatedBlobs.current.push(event.data);
                if (Date.now() - lastUploadTime.current >= 15000) {
                    void flushAndUpload();
                }
            };

            recorder.start(1000);
        } catch (error) {
            console.error("[AudioRecorder] Storage start failed:", error);
        }
    }, [audioStream, user?.role, flushAndUpload]);

    const startTranscriptRecorder = useCallback(() => {
        if (!transcriptionStream || !hasLiveAudioTrack(transcriptionStream)) return;
        if (!isTranscriptionEnabled) return;
        if (transcriptRecorderRef.current) return;

        try {
            const recorder = new MediaRecorder(transcriptionStream, getPreferredMediaRecorderOptions());
            transcriptRecorderRef.current = recorder;

            recorder.ondataavailable = (event) => {
                if (!(event.data && event.data.size > 0)) return;
                void sendBlobToDeepgram(event.data);
            };

            recorder.start(1000);
        } catch (error) {
            console.error("[DeepgramRecorder] Transcript start failed:", error);
        }
    }, [transcriptionStream, isTranscriptionEnabled, sendBlobToDeepgram]);

    const stopRecording = useCallback(async () => {
        recorderSessionIdRef.current += 1;
        isStartingRef.current = false;
        await stopStorageRecorder();
        await stopTranscriptRecorder();
        stopDeepgram();
    }, [stopStorageRecorder, stopTranscriptRecorder, stopDeepgram]);

    const startRecording = useCallback(async () => {
        if (!isEnabled || !roomId || !isMicOn) return;
        if (isStartingRef.current) return;
        isStartingRef.current = true;

        const sessionId = recorderSessionIdRef.current + 1;
        recorderSessionIdRef.current = sessionId;

        try {
            if (Number(user?.role) === ROLES.INTERVIEWER && hasLiveAudioTrack(audioStream)) {
                startStorageRecorder();
            } else {
                await stopStorageRecorder();
            }

            if (!isTranscriptionEnabled || !hasLiveAudioTrack(transcriptionStream)) {
                await stopTranscriptRecorder();
                stopDeepgram();
                return;
            }

            const isSocketReady = await startDeepgram();
            if (recorderSessionIdRef.current !== sessionId) return;
            if (isSocketReady) {
                startTranscriptRecorder();
            }
        } catch (error) {
            console.error("[Recorder] Start failed:", error);
        } finally {
            isStartingRef.current = false;
        }
    }, [
        isEnabled,
        roomId,
        isMicOn,
        isTranscriptionEnabled,
        user?.role,
        audioStream,
        transcriptionStream,
        startStorageRecorder,
        stopStorageRecorder,
        stopTranscriptRecorder,
        stopDeepgram,
        startDeepgram,
        startTranscriptRecorder,
    ]);

    useEffect(() => {
        if (isEnabled && roomId && isMicOn) {
            void startRecording();
        } else {
            void stopRecording();
        }
    }, [isEnabled, roomId, isMicOn, audioStream, transcriptionStream, startRecording, stopRecording]);

    useEffect(() => {
        return () => {
            void stopRecording();
        };
    }, [stopRecording]);

    return {
        transcriptHistory,
        interimTranscript,
        addRemoteTranscript: (text, role) => addTranscriptItem(text, role),
        isTranscribing,
        clearTranscriptHistory: () => {
            setTranscriptHistory([]);
            if (roomId) localStorage.removeItem(getCombinedTranscriptStorageKey(roomId));
        },
    };
}
