import { useState, useRef, useCallback, useEffect } from "react";
import { callApi } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";
import { interviewEndPoints } from "../services/interviewRoomApi";

/**
 * useAudioRecorder Hook
 * Records audio in chunks (webm/opus) and uploads to the backend.
 * 
 * @param {string} roomId - The recording session ID (Guid)
 * @param {boolean} isEnabled - Overall feature toggle
 * @param {boolean} isMicOn - Should record only when mic is active
 * @param {number} chunkIntervalMs - Interval between chunks (default 15s)
 * @param {MediaStream} audioStream - The audio stream to record (usually mixed)
 */
export function useAudioRecorder({ roomId, isEnabled = false, isMicOn = false, chunkIntervalMs = 15000, audioStream = null }) {
    const mediaRecorderRef = useRef(null);
    const chunkSequenceRef = useRef(0);
    const [isRecording, setIsRecording] = useState(false);

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
            console.log(`[AudioRecorder] Uploaded chunk ${sequence}, size: ${blob.size}`);
        } catch (error) {
            console.error("[AudioRecorder] Failed to upload chunk:", error);
        }
    }, [roomId]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            // This will trigger the final 'ondataavailable' event
            mediaRecorderRef.current.stop();
            // Don't stop tracks here because we are receiving external stream
            mediaRecorderRef.current = null;
            setIsRecording(false);
            console.log("[AudioRecorder] Stopped recording (Mic OFF or Room Left)");
        }
    }, []);

    const startRecording = useCallback(async () => {
        if (!isEnabled || !isMicOn || !roomId || !audioStream) return;
        
        try {
            const options = { mimeType: 'audio/webm;codecs=opus' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                delete options.mimeType;
            }

            const mediaRecorder = new MediaRecorder(audioStream, options);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = async (event) => {
                if (event.data && event.data.size > 0) {
                    // Capture current sequence for this closure
                    const currentSeq = chunkSequenceRef.current++;
                    await uploadChunk(event.data, currentSeq);
                }
            };

            // Start recording and request data every chunkIntervalMs
            mediaRecorder.start(chunkIntervalMs);
            setIsRecording(true);
            console.log("[AudioRecorder] Started recording (Mic ON)");

        } catch (error) {
            console.error("[AudioRecorder] Could not start recording:", error);
        }
    }, [isEnabled, isMicOn, roomId, chunkIntervalMs, uploadChunk, audioStream]);

    // Handle Mic ON/OFF or Room Leave
    useEffect(() => {
        if (isEnabled && isMicOn && roomId && audioStream) {
            if (!mediaRecorderRef.current) {
                startRecording();
            }
        } else {
            if (mediaRecorderRef.current) {
                stopRecording();
            }
        }
    }, [isEnabled, isMicOn, roomId, audioStream, startRecording, stopRecording]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current) {
                stopRecording();
            }
        };
    }, [stopRecording]);

    return { isRecording };
}
