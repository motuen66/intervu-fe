import { useState, useRef, useCallback, useEffect } from "react";
import { RealtimeClient } from "@speechmatics/real-time-client";
import { createSpeechmaticsJWT } from "@speechmatics/auth";
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

// Inline AudioWorklet script to handle PCM audio processing
const workletCode = `
class PCMProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const channelData = input[0];
      this.port.postMessage(channelData);
    }
    return true;
  }
}
registerProcessor('pcm-processor', PCMProcessor);
`;

function getPreferredMediaRecorderOptions() {
    const candidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
    ];

    if (typeof MediaRecorder === "undefined") return null;
    for (const mimeType of candidates) {
        if (typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported(mimeType)) {
            return { mimeType };
        }
    }

    return null;
}

export function useSpeechmaticsTranscript({
    roomId,
    isEnabled = false,
    isMicOn = false,
    audioStream = null,
    isTranscriptionEnabled = false,
    speechmaticsApiKey = import.meta.env.VITE_SPEECHMATICS_API_KEY,
    onTranscriptUpdate = null,
    user
}) {
    const mediaRecorderRef = useRef(null);
    const audioContextRef = useRef(null);
    const workletNodeRef = useRef(null);
    const speechmaticsClientRef = useRef(null);
    const speechmaticsSessionIdRef = useRef(0);
    const isStartingRecorderRef = useRef(false);
    const recorderSessionIdRef = useRef(0);
    const isStartingSpeechmaticsRef = useRef(false);
    const reconnectTimerRef = useRef(null);
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
        console.log(`[Transcript] Adding item: role=${displayRole}, text=${text}`);

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
            console.log(`[AudioRecorder] Uploading chunk ${sequence} (${blob.size} bytes) for room ${roomId}`);
            await callApi({
                method: METHOD.POST,
                endpoint: interviewEndPoints.STORE_AUDIO_CHUNK,
                arg: {
                    audioData: byteArray,
                    recordingSessionId: roomId,
                    sequenceNumber: sequence
                }
            });
        } catch (error) {
            console.error("[AudioRecorder] Upload error:", error);
        }
    }, [roomId]);

    const flushAndUpload = useCallback(async () => {
        if (accumulatedBlobs.current.length === 0) return;
        console.log(`[AudioRecorder] Flushing ${accumulatedBlobs.current.length} blobs...`);
        const blobsToUpload = [...accumulatedBlobs.current];
        accumulatedBlobs.current = [];
        lastUploadTime.current = Date.now();
        const combinedBlob = new Blob(blobsToUpload, { type: "audio/webm;codecs=opus" });
        const currentSeq = chunkSequenceRef.current++;
        await uploadChunk(combinedBlob, currentSeq);
    }, [uploadChunk]);

    // --- Speechmatics ---
    const clearReconnectTimer = useCallback(() => {
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
    }, []);

    const scheduleReconnect = useCallback(() => {
        if (reconnectTimerRef.current) return;
        reconnectTimerRef.current = setTimeout(() => {
            reconnectTimerRef.current = null;
            if (
                isEnabled &&
                isMicOn &&
                isTranscriptionEnabled &&
                audioStream &&
                !speechmaticsClientRef.current &&
                !isStartingSpeechmaticsRef.current
            ) {
                startSpeechmatics();
            }
        }, 1500);
    }, [audioStream, isEnabled, isMicOn, isTranscriptionEnabled]);

    const stopSpeechmatics = useCallback(async () => {
        speechmaticsSessionIdRef.current += 1;
        clearReconnectTimer();
        isStartingSpeechmaticsRef.current = false;
        if (speechmaticsClientRef.current) {
            try {
                console.log("[Speechmatics] Stopping client...");
                await speechmaticsClientRef.current.stopRecognition({ noTimeout: true });
            } catch (e) {
                console.error("[Speechmatics] Error stopping client:", e);
            }
            speechmaticsClientRef.current = null;
        }
        setIsTranscribing(false);
        setInterimTranscript("");
    }, [clearReconnectTimer]);

    const startSpeechmatics = useCallback(async () => {
        if (speechmaticsClientRef.current || isStartingSpeechmaticsRef.current) return;
        if (!speechmaticsApiKey || !audioStream || !isTranscriptionEnabled) return;
        const hasEnabledAudioTrack = audioStream
            ?.getAudioTracks()
            ?.some((track) => track.readyState === "live" && track.enabled);
        if (!hasEnabledAudioTrack) return;

        const sessionId = speechmaticsSessionIdRef.current + 1;
        speechmaticsSessionIdRef.current = sessionId;
        isStartingSpeechmaticsRef.current = true;
        clearReconnectTimer();

        try {
            const client = new RealtimeClient();
            
            client.addEventListener("receiveMessage", ({ data }) => {
                if (speechmaticsSessionIdRef.current !== sessionId) return;

                if (data.message === "RecognitionStarted") {
                    setIsTranscribing(true);
                }

                if (data.message === "AddTranscript") {
                    setIsTranscribing(true);
                    let text = "";
                    for (const result of data.results) {
                        text += (result.type === "word" ? " " : "") + result.alternatives?.[0].content;
                    }
                    if (text.trim()) {
                        addTranscriptItem(text, user?.role);
                        setInterimTranscript("");
                        if (onTranscriptUpdate) onTranscriptUpdate(text, true, user?.role);
                    }
                } else if (data.message === "AddPartialTranscript") {
                     setIsTranscribing(true);
                     let partialText = "";
                     for (const result of data.results) {
                        partialText += (result.type === "word" ? " " : "") + result.alternatives?.[0].content;
                    }
                    if (partialText.trim()) {
                        setInterimTranscript(partialText);
                        if (onTranscriptUpdate) onTranscriptUpdate(partialText, false, user?.role);
                    }
                } else if (data.message === "Error") {
                    console.error("[Speechmatics] Error:", data);
                    if (speechmaticsSessionIdRef.current === sessionId) {
                        speechmaticsClientRef.current = null;
                        setInterimTranscript("");
                        scheduleReconnect();
                    }
                    setIsTranscribing(false);
                }
            });

            client.addEventListener("recognitionStarted", () => {
                if (speechmaticsSessionIdRef.current !== sessionId) return;
                console.log("[Speechmatics] Recognition started event");
                setIsTranscribing(true);
            });

            client.addEventListener("close", () => {
                if (speechmaticsSessionIdRef.current !== sessionId) return;
                console.warn("[Speechmatics] Connection closed, scheduling reconnect...");
                speechmaticsClientRef.current = null;
                setIsTranscribing(false);
                setInterimTranscript("");
                scheduleReconnect();
            });

            const jwt = await createSpeechmaticsJWT({
                type: "rt",
                apiKey: speechmaticsApiKey,
                ttl: 3600,
            });

            const sampleRate = audioContextRef.current?.sampleRate || 16000;
            console.log(`[Speechmatics] Starting with sample rate: ${sampleRate}`);

            await client.start(jwt, {
                transcription_config: {
                    language: "en",
                    operating_point: "enhanced",
                    max_delay: 1.0,
                    enable_partials: true,
                    transcript_filtering_config: {
                        remove_disfluencies: true,
                    },
                },
                audio_format: {
                    type: "raw",
                    encoding: "pcm_f32le",
                    sample_rate: sampleRate
                }
            });

            speechmaticsClientRef.current = client;
            setIsTranscribing(true);

        } catch (err) {
            console.error("[Speechmatics] Setup failed:", err);
            speechmaticsClientRef.current = null;
            setIsTranscribing(false);
            scheduleReconnect();
        } finally {
            isStartingSpeechmaticsRef.current = false;
        }
    }, [
        speechmaticsApiKey,
        audioStream,
        isTranscriptionEnabled,
        onTranscriptUpdate,
        addTranscriptItem,
        user?.role,
        clearReconnectTimer,
        scheduleReconnect,
    ]);

    // --- Recorder Lifecycle ---
    const stopRecording = useCallback(async () => {
        console.log("[Recorder] Stopping...");
        recorderSessionIdRef.current += 1;
        isStartingRecorderRef.current = false;
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
            if (Number(user?.role) === ROLES.INTERVIEWER) flushAndUpload();
        }
        mediaRecorderRef.current = null;

        if (workletNodeRef.current) {
            workletNodeRef.current.disconnect();
            workletNodeRef.current = null;
        }

        if (audioContextRef.current) {
            try { await audioContextRef.current.close(); } catch (e) {}
            audioContextRef.current = null;
        }

        await stopSpeechmatics();
    }, [stopSpeechmatics, user?.role, flushAndUpload]);

    const startRecording = useCallback(async () => {
        if (!isEnabled || !roomId || !audioStream || !isMicOn) return;
        if (isStartingRecorderRef.current) return;
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") return;

        const hasLiveTrack = audioStream
            ?.getAudioTracks()
            ?.some((track) => track.readyState === "live");
        if (!hasLiveTrack) {
            console.warn("[Recorder] Skip start: no live audio track.");
            return;
        }

        isStartingRecorderRef.current = true;
        const sessionId = recorderSessionIdRef.current + 1;
        recorderSessionIdRef.current = sessionId;
        console.log("[Recorder] Starting...");
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = audioContext;

            const blob = new Blob([workletCode], { type: 'application/javascript' });
            const workletUrl = URL.createObjectURL(blob);
            await audioContext.audioWorklet.addModule(workletUrl);
            URL.revokeObjectURL(workletUrl);

            const source = audioContext.createMediaStreamSource(audioStream);
            const workletNode = new AudioWorkletNode(audioContext, 'pcm-processor');
            workletNodeRef.current = workletNode;

            workletNode.port.onmessage = (event) => {
                if (speechmaticsClientRef.current && isTranscriptionEnabled) {
                    const pcmData = event.data;
                    speechmaticsClientRef.current.sendAudio(pcmData.buffer);
                }
            };

            source.connect(workletNode);
            workletNode.connect(audioContext.destination);

            const options = getPreferredMediaRecorderOptions();
            const mediaRecorder = options
                ? new MediaRecorder(audioStream, options)
                : new MediaRecorder(audioStream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.onerror = (event) => {
                console.error("[Recorder] MediaRecorder error:", event?.error || event);
            };

            mediaRecorder.ondataavailable = (event) => {
                if (!(event.data && event.data.size > 0)) return;
                
                // Audio upload check: compare roles as numbers
                if (Number(user?.role) === ROLES.INTERVIEWER) {
                    accumulatedBlobs.current.push(event.data);
                    if (Date.now() - lastUploadTime.current >= 15000) {
                        flushAndUpload();
                    }
                }
            };

            if (recorderSessionIdRef.current !== sessionId) return;
            mediaRecorder.start(1000);
            if (isTranscriptionEnabled) await startSpeechmatics();

        } catch (error) {
            console.error("[Recorder] Start failed:", error);
            mediaRecorderRef.current = null;
            if (workletNodeRef.current) {
                workletNodeRef.current.disconnect();
                workletNodeRef.current = null;
            }
            if (audioContextRef.current) {
                try { await audioContextRef.current.close(); } catch (e) {}
                audioContextRef.current = null;
            }
        } finally {
            isStartingRecorderRef.current = false;
        }
    }, [isEnabled, roomId, audioStream, isMicOn, isTranscriptionEnabled, startSpeechmatics, user?.role, flushAndUpload]);

    useEffect(() => {
        if (isEnabled && roomId && audioStream && isMicOn) {
            if (!mediaRecorderRef.current) startRecording();
        } else {
            stopRecording();
        }
    }, [isEnabled, roomId, audioStream, isMicOn, startRecording, stopRecording]);

    useEffect(() => {
        const shouldConnect =
            isEnabled &&
            roomId &&
            audioStream &&
            isMicOn &&
            isTranscriptionEnabled;

        if (shouldConnect) {
            if (!speechmaticsClientRef.current && !isStartingSpeechmaticsRef.current) {
                startSpeechmatics();
            }
        } else {
            stopSpeechmatics();
        }
    }, [
        isEnabled,
        roomId,
        audioStream,
        isMicOn,
        isTranscriptionEnabled,
        startSpeechmatics,
        stopSpeechmatics,
    ]);

    useEffect(() => {
        return () => {
            clearReconnectTimer();
            stopRecording();
        };
    }, [stopRecording, clearReconnectTimer]);

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
