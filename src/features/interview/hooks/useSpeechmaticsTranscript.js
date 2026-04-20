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

const workletCode = `
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const channelData = input[0];
      for (let i = 0; i < channelData.length; i++) {
        this.buffer[this.bufferIndex++] = channelData[i];
        if (this.bufferIndex >= this.bufferSize) {
          this.port.postMessage(this.buffer);
          this.bufferIndex = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor('pcm-processor', PCMProcessor);
`;

function getPreferredMediaRecorderOptions() {
    const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
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
    audioStream = null, // USED FOR STORAGE (Mixed Stream)
    transcriptionStream = null, // USED FOR TRANSCRIPTION (Local Mic)
    isTranscriptionEnabled = false,
    speechmaticsApiKey = import.meta.env.VITE_SPEECHMATICS_API_KEY,
    onTranscriptUpdate = null,
    user,
}) {
    const mediaRecorderRef = useRef(null);
    const audioContextRef = useRef(null);
    const audioSourceRef = useRef(null);
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

    useEffect(() => {
        if (!roomId || transcriptHistory.length === 0) return;
        const timer = setTimeout(() => {
            try {
                localStorage.setItem(getCombinedTranscriptStorageKey(roomId), JSON.stringify(transcriptHistory));
                const rolesInHistory = [...new Set(transcriptHistory.map((item) => item.rawRole))].filter(
                    (r) => r !== undefined,
                );
                rolesInHistory.forEach((role) => {
                    const displayRole = getDisplayRole(role);
                    const roleTranscript = transcriptHistory.filter((i) => i.role === displayRole);
                    localStorage.setItem(getRoleTranscriptStorageKey(roomId, role), JSON.stringify(roleTranscript));
                });
            } catch (e) {
                console.error("Failed to save transcript to localStorage", e);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [transcriptHistory, roomId]);

    const addTranscriptItem = useCallback((text, role) => {
        if (!text || !text.trim() || Number(role) !== ROLES.INTERVIEWER) return;
        const displayRole = getDisplayRole(role);
        setTranscriptHistory((prev) => {
            const lastItem = prev[prev.length - 1];
            if (lastItem && lastItem.role === displayRole) {
                const newHistory = [...prev];
                newHistory[newHistory.length - 1] = { ...lastItem, text: `${lastItem.text} ${text}`.trim() };
                return newHistory;
            } else {
                const newIndex = lastItem ? lastItem.index + 1 : 1;
                return [...prev, { index: newIndex, role: displayRole, text: text.trim(), rawRole: role }];
            }
        });
    }, []);

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
                    arg: { audioData: byteArray, recordingSessionId: roomId, sequenceNumber: sequence },
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

        console.log(`[AudioRecorder] Flushing ${accumulatedBlobs.current.length} blobs...`);

        const blobsToUpload = [...accumulatedBlobs.current];
        accumulatedBlobs.current = [];
        lastUploadTime.current = Date.now();
        const combinedBlob = new Blob(blobsToUpload, { type: "audio/webm;codecs=opus" });
        const currentSeq = chunkSequenceRef.current++;
        await uploadChunk(combinedBlob, currentSeq);
    }, [uploadChunk]);

    // --- Speechmatics ---
    const scheduleReconnect = useCallback(() => {
        if (reconnectTimerRef.current) return;
        reconnectTimerRef.current = setTimeout(() => {
            reconnectTimerRef.current = null;
            if (isEnabled && isMicOn && isTranscriptionEnabled && transcriptionStream) startSpeechmatics();
        }, 1500);
    }, [transcriptionStream, isEnabled, isMicOn, isTranscriptionEnabled]);

    const stopSpeechmatics = useCallback(async () => {
        speechmaticsSessionIdRef.current += 1;
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
        isStartingSpeechmaticsRef.current = false;
        if (speechmaticsClientRef.current) {
            try {
                await speechmaticsClientRef.current.stopRecognition({ noTimeout: true });
            } catch (e) { }
            speechmaticsClientRef.current = null;
        }
        setIsTranscribing(false);
        setInterimTranscript("");
    }, []);

    const startSpeechmatics = useCallback(async () => {
        if (speechmaticsClientRef.current || isStartingSpeechmaticsRef.current) return;
        if (!speechmaticsApiKey || !transcriptionStream || !isTranscriptionEnabled) return;

        const sessionId = speechmaticsSessionIdRef.current + 1;
        speechmaticsSessionIdRef.current = sessionId;
        isStartingSpeechmaticsRef.current = true;

        try {
            const client = new RealtimeClient();
            client.addEventListener("receiveMessage", ({ data }) => {
                if (speechmaticsSessionIdRef.current !== sessionId) return;
                if (data.message === "AddTranscript") {
                    let text = "";
                    for (const result of data.results)
                        text += (result.type === "word" ? " " : "") + result.alternatives?.[0].content;
                    if (text.trim()) {
                        addTranscriptItem(text, user?.role);
                        setInterimTranscript("");
                        if (onTranscriptUpdate) onTranscriptUpdate(text, true, user?.role);
                    }
                } else if (data.message === "AddPartialTranscript") {
                    let partialText = "";
                    for (const result of data.results)
                        partialText += (result.type === "word" ? " " : "") + result.alternatives?.[0].content;
                    if (partialText.trim()) {
                        if (Number(user?.role) === ROLES.INTERVIEWER) setInterimTranscript(partialText);
                        if (onTranscriptUpdate) onTranscriptUpdate(partialText, false, user?.role);
                    }
                }
            });

            const jwt = await createSpeechmaticsJWT({ type: "rt", apiKey: speechmaticsApiKey, ttl: 3600 });
            const sampleRate = audioContextRef.current?.sampleRate || 16000;

            await client.start(jwt, {
                transcription_config: { language: "en", operating_point: "enhanced", enable_partials: true },
                audio_format: { type: "raw", encoding: "pcm_f32le", sample_rate: sampleRate },
            });
            speechmaticsClientRef.current = client;
            setIsTranscribing(true);
        } catch (err) {
            scheduleReconnect();
        } finally {
            isStartingSpeechmaticsRef.current = false;
        }
    }, [
        speechmaticsApiKey,
        transcriptionStream,
        isTranscriptionEnabled,
        onTranscriptUpdate,
        addTranscriptItem,
        user?.role,
        scheduleReconnect,
    ]);

    // --- Recorder lifecycle ---
    const stopRecording = useCallback(async () => {
        recorderSessionIdRef.current += 1;
        isStartingRecorderRef.current = false;
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
            if (Number(user?.role) === ROLES.INTERVIEWER) flushAndUpload();
        }
        mediaRecorderRef.current = null;
        if (audioSourceRef.current) audioSourceRef.current.disconnect();
        if (workletNodeRef.current) workletNodeRef.current.disconnect();
        if (audioContextRef.current) {
            try {
                await audioContextRef.current.close();
            } catch (e) { }
            audioContextRef.current = null;
        }
        await stopSpeechmatics();
    }, [stopSpeechmatics, user?.role, flushAndUpload]);

    const startRecording = useCallback(async () => {
        if (!isEnabled || !roomId || !audioStream || !transcriptionStream || !isMicOn) return;
        if (isStartingRecorderRef.current) return;

        isStartingRecorderRef.current = true;
        const sessionId = recorderSessionIdRef.current + 1;
        recorderSessionIdRef.current = sessionId;

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = audioContext;

            const blob = new Blob([workletCode], { type: "application/javascript" });
            const workletUrl = URL.createObjectURL(blob);
            await audioContext.audioWorklet.addModule(workletUrl);
            URL.revokeObjectURL(workletUrl);

            // ── TRANSCRIPTION: Use LOCAL MIC stream ────────────────
            const source = audioContext.createMediaStreamSource(transcriptionStream);
            audioSourceRef.current = source;
            const workletNode = new AudioWorkletNode(audioContext, "pcm-processor");
            workletNodeRef.current = workletNode;
            workletNode.port.onmessage = (event) => {
                if (speechmaticsClientRef.current && isTranscriptionEnabled) {
                    speechmaticsClientRef.current.sendAudio(event.data.buffer);
                }
            };
            source.connect(workletNode);
            // DO NOT connect to destination to avoid echoing back to user

            // ── STORAGE: Use MIXED stream (uploaded to backend) ──────────
            const mediaRecorder = new MediaRecorder(audioStream, getPreferredMediaRecorderOptions());
            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0 && Number(user?.role) === ROLES.INTERVIEWER) {
                    accumulatedBlobs.current.push(event.data);
                    if (Date.now() - lastUploadTime.current >= 15000) flushAndUpload();
                }
            };

            if (recorderSessionIdRef.current === sessionId) {
                mediaRecorder.start(1000);
                if (isTranscriptionEnabled) await startSpeechmatics();
            }
        } catch (error) {
            stopRecording();
        } finally {
            isStartingRecorderRef.current = false;
        }
    }, [
        isEnabled,
        roomId,
        audioStream,
        transcriptionStream,
        isMicOn,
        isTranscriptionEnabled,
        startSpeechmatics,
        stopRecording,
        user?.role,
        flushAndUpload,
    ]);

    useEffect(() => {
        if (isEnabled && roomId && audioStream && transcriptionStream && isMicOn) startRecording();
        else stopRecording();
    }, [isEnabled, roomId, audioStream, transcriptionStream, isMicOn, startRecording, stopRecording]);

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