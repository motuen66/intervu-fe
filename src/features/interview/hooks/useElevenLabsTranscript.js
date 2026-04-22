import { useState, useRef, useCallback, useEffect } from "react";
import { ROLES } from "../../../common/constants/common.js";
import { callApi } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";
import { interviewEndPoints } from "../services/interviewRoomApi";

const ELEVENLABS_REALTIME_WS_URL = "wss://api.elevenlabs.io/v1/speech-to-text/realtime";
const ELEVENLABS_MODEL_ID = "scribe_v2_realtime";
const ELEVENLABS_SAMPLE_RATE = 16000;
const ELEVENLABS_TOKEN_REFRESH_MS = 14 * 60 * 1000;

const scribeWorkletCode = `
class ScribeAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
    this.bufferSize = 4096;
    this.inputSampleRate = null;
    this.outputSampleRate = null;
    this.resampleRatio = 1;
    this.lastSample = 0;
    this.resampleAccumulator = 0;

    this.port.onmessage = ({ data }) => {
      if (data.type === "configure") {
        this.inputSampleRate = data.inputSampleRate;
        this.outputSampleRate = data.outputSampleRate;
        if (this.inputSampleRate && this.outputSampleRate) {
          this.resampleRatio = this.inputSampleRate / this.outputSampleRate;
        }
      }
    };
  }

  resample(inputData) {
    if (this.resampleRatio === 1 || !this.inputSampleRate) {
      return inputData;
    }

    const outputSamples = [];
    for (let i = 0; i < inputData.length; i++) {
      const currentSample = inputData[i];
      while (this.resampleAccumulator < 1) {
        const interpolated = this.lastSample + (currentSample - this.lastSample) * this.resampleAccumulator;
        outputSamples.push(interpolated);
        this.resampleAccumulator += this.resampleRatio;
      }
      this.resampleAccumulator -= 1;
      this.lastSample = currentSample;
    }

    return new Float32Array(outputSamples);
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    let channelData = input[0];
    if (!channelData) return true;

    if (this.resampleRatio !== 1) {
      channelData = this.resample(channelData);
    }

    for (let i = 0; i < channelData.length; i++) {
      this.buffer.push(channelData[i]);
    }

    if (this.buffer.length >= this.bufferSize) {
      const float32Array = new Float32Array(this.buffer);
      const int16Array = new Int16Array(float32Array.length);

      for (let i = 0; i < float32Array.length; i++) {
        const sample = Math.max(-1, Math.min(1, float32Array[i]));
        int16Array[i] = sample < 0 ? sample * 32768 : sample * 32767;
      }

      this.port.postMessage({ audioData: int16Array.buffer }, [int16Array.buffer]);
      this.buffer = [];
    }

    return true;
  }
}

registerProcessor("scribeAudioProcessor", ScribeAudioProcessor);
`;

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

function arrayBufferToBase64(arrayBuffer) {
    if (!arrayBuffer || arrayBuffer.byteLength === 0) return "";

    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function buildRealtimeSocketUrl(token) {
    const params = new URLSearchParams({
        model_id: ELEVENLABS_MODEL_ID,
        token,
        commit_strategy: "vad",
        audio_format: "pcm_16000",
        language_code: "en",
    });
    return `${ELEVENLABS_REALTIME_WS_URL}?${params.toString()}`;
}

async function waitForWebSocketOpen(ws, timeoutMs = 10000) {
    if (ws.readyState === WebSocket.OPEN) return;

    await new Promise((resolve, reject) => {
        let settled = false;
        let timeoutId = null;

        const cleanup = () => {
            ws.removeEventListener("open", handleOpen);
            ws.removeEventListener("error", handleError);
            ws.removeEventListener("close", handleClose);
            if (timeoutId) clearTimeout(timeoutId);
        };

        const finish = (fn, value) => {
            if (settled) return;
            settled = true;
            cleanup();
            fn(value);
        };

        const handleOpen = () => finish(resolve);
        const handleError = () => finish(reject, new Error("ElevenLabs WebSocket connection failed"));
        const handleClose = (event) =>
            finish(
                reject,
                new Error(`ElevenLabs WebSocket closed before open (${event.code}: ${event.reason || "no reason"})`),
            );

        ws.addEventListener("open", handleOpen);
        ws.addEventListener("error", handleError);
        ws.addEventListener("close", handleClose);
        timeoutId = setTimeout(() => finish(reject, new Error("Timed out waiting for ElevenLabs WebSocket open")), timeoutMs);
    });
}

function closeWebSocket(ws, code = 1000, reason = "normal_closure") {
    if (!ws) return;
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        try {
            ws.close(code, reason);
        } catch (_) {
            // no-op
        }
    }
}

async function fetchFrontendSingleUseToken(elevenLabsApiKey) {
    if (!elevenLabsApiKey) {
        throw new Error("Missing ElevenLabs API key");
    }

    const response = await fetch("https://api.elevenlabs.io/v1/single-use-token/realtime_scribe", {
        method: "POST",
        headers: {
            "xi-api-key": elevenLabsApiKey,
        },
    });

    if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        throw new Error(
            `Failed to create ElevenLabs single-use token (${response.status}): ${errorBody || response.statusText}`,
        );
    }

    const data = await response.json();
    if (!data?.token) {
        throw new Error("ElevenLabs token response did not include token");
    }

    return data.token;
}

/**
 * ElevenLabs transcript hook (manual WebSocket mode).
 * - Storage path: uploads mixed audio in 15s combined chunks (interviewer only).
 * - Transcript path: streams local mic to ElevenLabs realtime WebSocket.
 */
export function useElevenLabsTranscript({
    roomId,
    isEnabled = false,
    isMicOn = false,
    audioStream = null, // Mixed stream for storage
    transcriptionStream = null, // Local mic stream for transcription
    isTranscriptionEnabled = false,
    elevenLabsApiKey = import.meta.env.VITE_ELEVENLABS_API_KEY,
    onTranscriptUpdate = null,
    user,
}) {
    const storageRecorderRef = useRef(null);
    const recorderSessionIdRef = useRef(0);
    const isStartingRef = useRef(false);
    const accumulatedBlobs = useRef([]);
    const lastUploadTime = useRef(Date.now());
    const chunkSequenceRef = useRef(0);

    const websocketRef = useRef(null);
    const websocketSessionIdRef = useRef(0);
    const isConnectingWsRef = useRef(false);
    const isWsActiveRef = useRef(false);
    const refreshTimerRef = useRef(null);
    const refreshElevenLabsRef = useRef(null);
    const shouldRunTranscriptionRef = useRef(false);

    const audioContextRef = useRef(null);
    const audioSourceRef = useRef(null);
    const workletNodeRef = useRef(null);

    const userRoleRef = useRef(user?.role);
    const onTranscriptUpdateRef = useRef(onTranscriptUpdate);
    useEffect(() => {
        userRoleRef.current = user?.role;
    }, [user?.role]);
    useEffect(() => {
        onTranscriptUpdateRef.current = onTranscriptUpdate;
    }, [onTranscriptUpdate]);

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

    const addTranscriptItemRef = useRef(addTranscriptItem);
    useEffect(() => {
        addTranscriptItemRef.current = addTranscriptItem;
    }, [addTranscriptItem]);

    const clearRefreshTimer = useCallback(() => {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }
    }, []);

    const stopAudioPipeline = useCallback(async () => {
        if (audioSourceRef.current) {
            try {
                audioSourceRef.current.disconnect();
            } catch (_) {
                // no-op
            }
            audioSourceRef.current = null;
        }

        if (workletNodeRef.current) {
            try {
                workletNodeRef.current.port.onmessage = null;
                workletNodeRef.current.disconnect();
            } catch (_) {
                // no-op
            }
            workletNodeRef.current = null;
        }

        if (audioContextRef.current) {
            try {
                await audioContextRef.current.close();
            } catch (_) {
                // no-op
            }
            audioContextRef.current = null;
        }
    }, []);

    const shouldRunTranscription = useCallback(() => {
        return (
            isEnabled &&
            !!roomId &&
            isMicOn &&
            isTranscriptionEnabled &&
            !!transcriptionStream &&
            hasLiveAudioTrack(transcriptionStream)
        );
    }, [isEnabled, roomId, isMicOn, isTranscriptionEnabled, transcriptionStream]);

    useEffect(() => {
        shouldRunTranscriptionRef.current = shouldRunTranscription();
    }, [shouldRunTranscription]);

    const handleRealtimeMessage = useCallback((rawData, sessionId) => {
        if (websocketSessionIdRef.current !== sessionId) return;

        let data;
        try {
            const rawText = typeof rawData === "string" ? rawData : new TextDecoder().decode(rawData);
            data = JSON.parse(rawText);
        } catch (err) {
            console.error("[ElevenLabs] Failed to parse realtime message:", err);
            return;
        }

        const messageType = data?.message_type;
        const text = (data?.text ?? data?.transcript ?? "").trim();

        if (messageType === "session_started") {
            setIsTranscribing(true);
            return;
        }

        if (messageType === "partial_transcript") {
            if (!text) return;
            setInterimTranscript(text);
            if (onTranscriptUpdateRef.current) {
                onTranscriptUpdateRef.current(text, false, userRoleRef.current);
            }
            return;
        }

        if (messageType === "committed_transcript" || messageType === "committed_transcript_with_timestamps") {
            if (!text) return;
            addTranscriptItemRef.current(text, userRoleRef.current);
            setInterimTranscript("");
            if (onTranscriptUpdateRef.current) {
                onTranscriptUpdateRef.current(text, true, userRoleRef.current);
            }
            return;
        }

        if (
            messageType === "auth_error" ||
            messageType === "quota_exceeded" ||
            messageType === "commit_throttled" ||
            messageType === "transcriber_error" ||
            messageType === "unaccepted_terms" ||
            messageType === "rate_limited" ||
            messageType === "input_error" ||
            messageType === "queue_overflow" ||
            messageType === "resource_exhausted" ||
            messageType === "session_time_limit_exceeded" ||
            messageType === "chunk_size_exceeded" ||
            messageType === "insufficient_audio_activity" ||
            messageType === "error"
        ) {
            console.error("[ElevenLabs] Realtime error:", data);
            if (
                (messageType === "auth_error" || messageType === "session_time_limit_exceeded") &&
                refreshElevenLabsRef.current
            ) {
                void refreshElevenLabsRef.current();
            }
        }
    }, []);

    const startAudioPipeline = useCallback(async (sessionId) => {
        if (!transcriptionStream || !hasLiveAudioTrack(transcriptionStream)) return false;

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
            throw new Error("AudioContext is not supported in this browser");
        }

        const audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;

        const workletBlob = new Blob([scribeWorkletCode], { type: "application/javascript" });
        const workletUrl = URL.createObjectURL(workletBlob);
        await audioContext.audioWorklet.addModule(workletUrl);
        URL.revokeObjectURL(workletUrl);

        if (websocketSessionIdRef.current !== sessionId) {
            await stopAudioPipeline();
            return false;
        }

        const source = audioContext.createMediaStreamSource(transcriptionStream);
        audioSourceRef.current = source;

        const workletNode = new AudioWorkletNode(audioContext, "scribeAudioProcessor");
        workletNodeRef.current = workletNode;

        if (audioContext.sampleRate !== ELEVENLABS_SAMPLE_RATE) {
            workletNode.port.postMessage({
                type: "configure",
                inputSampleRate: audioContext.sampleRate,
                outputSampleRate: ELEVENLABS_SAMPLE_RATE,
            });
        }

        workletNode.port.onmessage = (event) => {
            if (websocketSessionIdRef.current !== sessionId || !isWsActiveRef.current) return;

            const ws = websocketRef.current;
            if (!ws || ws.readyState !== WebSocket.OPEN) return;

            const audioData = event?.data?.audioData;
            const audioBase64 = arrayBufferToBase64(audioData);
            if (!audioBase64) return;

            try {
                ws.send(
                    JSON.stringify({
                        message_type: "input_audio_chunk",
                        audio_base_64: audioBase64,
                        commit: false,
                        sample_rate: ELEVENLABS_SAMPLE_RATE,
                    }),
                );
            } catch (err) {
                console.error("[ElevenLabs] Failed to send audio chunk:", err);
            }
        };

        source.connect(workletNode);

        if (audioContext.state === "suspended") {
            await audioContext.resume();
        }

        return true;
    }, [transcriptionStream, stopAudioPipeline]);

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

    // --- ElevenLabs ---
    const stopElevenLabs = useCallback(async () => {
        websocketSessionIdRef.current += 1;
        isConnectingWsRef.current = false;
        isWsActiveRef.current = false;
        clearRefreshTimer();

        const currentWs = websocketRef.current;
        websocketRef.current = null;
        closeWebSocket(currentWs);

        await stopAudioPipeline();
        setIsTranscribing(false);
        setInterimTranscript("");
    }, [clearRefreshTimer, stopAudioPipeline]);

    const scheduleTokenRefresh = useCallback(() => {
        clearRefreshTimer();
        refreshTimerRef.current = setTimeout(() => {
            if (refreshElevenLabsRef.current) {
                void refreshElevenLabsRef.current();
            }
        }, ELEVENLABS_TOKEN_REFRESH_MS);
    }, [clearRefreshTimer]);

    const startElevenLabs = useCallback(async () => {
        if (!shouldRunTranscriptionRef.current) return false;
        if (isConnectingWsRef.current) return false;

        const currentWs = websocketRef.current;
        if (currentWs && currentWs.readyState === WebSocket.OPEN) {
            isWsActiveRef.current = true;
            return true;
        }

        const sessionId = websocketSessionIdRef.current + 1;
        websocketSessionIdRef.current = sessionId;
        isConnectingWsRef.current = true;
        isWsActiveRef.current = false;

        try {
            let connectedWs = null;
            let lastError = null;

            for (let attempt = 0; attempt < 2 && !connectedWs; attempt += 1) {
                try {
                    const token = await fetchFrontendSingleUseToken(elevenLabsApiKey);
                    const ws = new WebSocket(buildRealtimeSocketUrl(token));
                    await waitForWebSocketOpen(ws);
                    connectedWs = ws;
                } catch (err) {
                    lastError = err;
                }
            }

            if (!connectedWs) {
                throw lastError || new Error("Unable to connect ElevenLabs WebSocket");
            }

            if (websocketSessionIdRef.current !== sessionId) {
                closeWebSocket(connectedWs);
                return false;
            }

            connectedWs.onmessage = (event) => {
                handleRealtimeMessage(event.data, sessionId);
            };
            connectedWs.onerror = (event) => {
                console.error("[ElevenLabs] WebSocket error:", event);
            };
            connectedWs.onclose = (event) => {
                if (websocketRef.current === connectedWs) {
                    websocketRef.current = null;
                }
                if (websocketSessionIdRef.current !== sessionId) {
                    return;
                }

                setIsTranscribing(false);
                if (isWsActiveRef.current && shouldRunTranscriptionRef.current && refreshElevenLabsRef.current) {
                    console.warn(`[ElevenLabs] WebSocket closed (${event.code}). Attempting reconnect.`);
                    void refreshElevenLabsRef.current();
                }
            };

            websocketRef.current = connectedWs;
            const audioStarted = await startAudioPipeline(sessionId);
            if (!audioStarted) {
                closeWebSocket(connectedWs);
                websocketRef.current = null;
                return false;
            }

            isWsActiveRef.current = true;
            setIsTranscribing(true);
            scheduleTokenRefresh();
            return true;
        } catch (err) {
            console.error("[ElevenLabs] Failed to start realtime WebSocket:", err);
            await stopElevenLabs();
            return false;
        } finally {
            isConnectingWsRef.current = false;
        }
    }, [elevenLabsApiKey, handleRealtimeMessage, scheduleTokenRefresh, startAudioPipeline, stopElevenLabs]);

    const refreshElevenLabsConnection = useCallback(async () => {
        if (!shouldRunTranscriptionRef.current) return;
        if (isConnectingWsRef.current) return;

        await stopElevenLabs();
        await startElevenLabs();
    }, [stopElevenLabs, startElevenLabs]);

    useEffect(() => {
        refreshElevenLabsRef.current = refreshElevenLabsConnection;
        return () => {
            refreshElevenLabsRef.current = null;
        };
    }, [refreshElevenLabsConnection]);

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

    const stopRecording = useCallback(async () => {
        recorderSessionIdRef.current += 1;
        isStartingRef.current = false;
        await stopStorageRecorder();
        await stopElevenLabs();
    }, [stopStorageRecorder, stopElevenLabs]);

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
                await stopElevenLabs();
                return;
            }

            const isRealtimeReady = await startElevenLabs();
            if (recorderSessionIdRef.current !== sessionId) return;
            if (!isRealtimeReady) {
                console.warn("[ElevenLabs] Realtime WebSocket did not connect.");
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
        startElevenLabs,
        stopElevenLabs,
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

