import { useState, useRef, useCallback, useEffect } from "react";
import { callApi } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";
import { interviewEndPoints } from "../services/interviewRoomApi";
import { ROLES } from "../../../common/constants/common.js";

/**
 * Upload-only recorder hook.
 * Keeps mixed stream recording for interviewer and posts chunks to backend.
 */
export function useAudioRecorder({
    roomId,
    isEnabled = false,
    isMicOn = false,
    chunkIntervalMs = 15000,
    audioStream = null,
    user
}) {
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
            console.log(`[AudioRecorder] Uploaded chunk ${sequence}`);
        } catch (error) {
            console.error("[AudioRecorder] Upload error:", error);
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current = null;
            setIsRecording(false);
            console.log("[AudioRecorder] Stopped recording (Mic OFF or Room Left)");
        }
    }, []);

    const startRecording = useCallback(async () => {
        // Upload pipeline is interviewer-only by requirement.
        if (user?.role !== ROLES.INTERVIEWER) return;
        if (!isEnabled || !roomId || !audioStream) return;

        try {
            const options = { mimeType: "audio/webm;codecs=opus" };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) delete options.mimeType;

            const mediaRecorder = new MediaRecorder(audioStream, options);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = async (event) => {
                if (!(event.data && event.data.size > 0)) return;
                const currentSeq = chunkSequenceRef.current++;
                if (user?.role === ROLES.INTERVIEWER) {
                    await uploadChunk(event.data, currentSeq);
                }
            };

            mediaRecorder.start(chunkIntervalMs);
            setIsRecording(true);
        } catch (error) {
            console.error("[AudioRecorder] Start failed:", error);
        }
    }, [isEnabled, roomId, audioStream, user?.role, uploadChunk]);

    useEffect(() => {
        if (user?.role === ROLES.INTERVIEWER && isEnabled && roomId && audioStream && isMicOn) {
            if (!mediaRecorderRef.current) startRecording();
        } else if (mediaRecorderRef.current) {
            stopRecording();
        }
    }, [user?.role, isEnabled, roomId, audioStream, isMicOn, startRecording, stopRecording]);

    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current) stopRecording();
        };
    }, [stopRecording]);

    return { isRecording };
}
