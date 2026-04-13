import { useState, useRef, useCallback, useEffect } from "react";
import { callApi } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";
import { interviewEndPoints } from "../services/interviewRoomApi";
import { DeepgramClient, logging} from "@deepgram/sdk";
import { ROLES } from "../../../common/constants/common.js";

/**
 * useAudioRecorder Hook
 * Records audio in chunks and uploads to backend + Deepgram transcription.
 */
export function useAudioRecorder({ 
    roomId, 
    isEnabled = false, 
    isMicOn = false, 
    chunkIntervalMs = 15000, 
    audioStream = null,
    isTranscriptionEnabled = false,
    deepgramApiKey = import.meta.env.VITE_DEEPGRAM_API_KEY,
    onTranscriptUpdate = null,
    user
}) {
    const mediaRecorderRef = useRef(null);
    const chunkSequenceRef = useRef(0);
    const [isRecording, setIsRecording] = useState(false);
    
    // Deepgram refs
    const deepgramConnectionRef = useRef(null);
    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const [isTranscribing, setIsTranscribing] = useState(false);

    const uploadChunk = useCallback(async (blob, sequence) => {
        if (!blob || blob.size === 0) return;
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
            console.log(`[AudioRecorder] Uploaded chunk ${sequence}`);
        } catch (error) {
            console.error("[AudioRecorder] Upload error:", error);
        }
    }, [roomId]);

    const stopDeepgram = useCallback(() => {
        if (deepgramConnectionRef.current) {
            console.log("[Deepgram] Closing connection");
            try {
                deepgramConnectionRef.current.close();
            } catch (e) {}
            deepgramConnectionRef.current = null;
        }
        setIsTranscribing(false);
        setInterimTranscript("");
    }, []);

    const startDeepgram = useCallback(async () => {
        if (!deepgramApiKey || !audioStream) return;

        let keepAlive;
        try {
            console.log("[Deepgram] Initializing...");
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
                diarization: true,
                keepAlive: true,
                endpointing: 10,
            });

            if (keepAlive) clearInterval(keepAlive);
            keepAlive = setInterval(() => {
                if (connection.readyState === 1) {
                    connection.sendKeepAlive({ type: "KeepAlive" });
                }
            }, 3000);

            deepgramConnectionRef.current = connection;

            connection.on("open", () => {
                console.log("[Deepgram] Connection opened");
                setIsTranscribing(true);
            });

            connection.on("message", (data) => {
                if (data.type === "Results") {
                    const text = data.channel?.alternatives[0]?.transcript;
                    if (text) {
                        if (data.is_final) {
                            const newText = text;
                            setTranscript((prev) => {
                                const full = prev ? prev + " " + newText : newText;
                                if (onTranscriptUpdate) onTranscriptUpdate(full, "");
                                return full;
                            });
                            setInterimTranscript("");
                        } else {
                            setInterimTranscript(text);
                            if (onTranscriptUpdate) {
                                // We don't want to re-calculate the full transcript every interim result if possible
                                // but for sync we might need to.
                                setTranscript(prev => {
                                    onTranscriptUpdate(prev, text);
                                    return prev;
                                });
                            }
                        }
                    }
                }
            });

            connection.on("error", (err) => console.error("[Deepgram] Error:", err));
            connection.on("close", () => {
                console.log("[Deepgram] Closed");
                setIsTranscribing(false);
                setInterimTranscript("");
                if (keepAlive) clearInterval(keepAlive);
            });

            if (typeof connection.connect === "function") connection.connect();
        } catch (err) {
            console.error("[Deepgram] Setup failed:", err);
        }
    }, [deepgramApiKey, audioStream, onTranscriptUpdate]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current = null;
            setIsRecording(false);
            console.log("[AudioRecorder] Stopped recording (Mic OFF or Room Left)");
        }
        stopDeepgram();
    }, [stopDeepgram]);

    const startRecording = useCallback(async () => {
        if (!isEnabled || !roomId || !audioStream) return;
        
        try {
            const options = { mimeType: 'audio/webm;codecs=opus' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) delete options.mimeType;

            const mediaRecorder = new MediaRecorder(audioStream, options);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = async (event) => {
                if (event.data && event.data.size > 0) {
                    const currentSeq = chunkSequenceRef.current++;
                    // 1. Upload chunk to backend
                    // await uploadChunk(event.data, currentSeq);

                    // Always try to send to Deepgram if it's open
                    if (deepgramConnectionRef.current && deepgramConnectionRef.current.readyState === 1) {
                        deepgramConnectionRef.current.sendMedia(event.data);
                    }

                    // Optional: Upload chunk to backend (could be interviewer only)
                    if (user?.role === ROLES.INTERVIEWER) await uploadChunk(event.data, currentSeq);
                }
            };

            // Important: To get real-time transcript, we might want smaller timeslices
            // for Deepgram, but the current logic sends chunks every chunkIntervalMs.
            // If we want Deepgram to be "real-time", we should probably use a separate
            // interval or shorter slices for mediaRecorder.start().
            mediaRecorder.start(2000);
            setIsRecording(true);
            
            // Always start deepgram if we have a stream, visibility is handled in UI
            await startDeepgram();

            console.log("[AudioRecorder] Started");
        } catch (error) {
            console.error("[AudioRecorder] Start failed:", error);
        }
    }, [isEnabled, roomId, audioStream, startDeepgram]);

    useEffect(() => {
        if (isEnabled && roomId && audioStream) {
            if (!mediaRecorderRef.current) startRecording();
        } else {
            if (mediaRecorderRef.current) stopRecording();
        }
    }, [isEnabled, roomId, audioStream, startRecording, stopRecording]);

    useEffect(() => {
        return () => { if (mediaRecorderRef.current) stopRecording(); };
    }, [stopRecording]);

    return { isRecording, transcript, interimTranscript, setTranscript, isTranscribing };
}
