import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Typography, Paper, Stack, List, ListItem, ListItemText, Divider, Button, CircularProgress } from "@mui/material";
import { callApi } from "../../../../common/utils/apiConnector.js";
import { METHOD } from "../../../../common/constants/api.js";
import { interviewEndPoints } from "../../services/interviewRoomApi.js";

function AiInterviewPanel({ roomId }) {
    const [isRecording, setIsRecording] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [currentTranscript, setCurrentTranscript] = useState("");
    const [history, setHistory] = useState([]);
    const recorderRef = useRef(null);
    const streamRef = useRef(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            if (recorderRef.current) {
                try {
                    recorderRef.current.stopRecording(() => {});
                } catch (e) {}
                recorderRef.current = null;
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
                streamRef.current = null;
            }
        };
    }, []);

    const appendTranscript = useCallback((text) => {
        if (!text) return;
        setCurrentTranscript((prev) => (prev ? `${prev} ${text}` : text));
    }, []);

    const fetchIntro = useCallback(async () => {
        const response = await callApi({
            method: METHOD.POST,
            endpoint: interviewEndPoints.AI_INTERVIEW_INTRO,
            arg: { roomId },
            displaySuccessMessage: false,
            alertErrorMessage: true,
        });
        const intro = response?.data?.text || response?.data?.intro || "";
        if (intro) appendTranscript(intro);
    }, [appendTranscript, roomId]);

    const sendAudioChunk = useCallback(
        async (blob) => {
            if (!blob || !roomId) return;
            const formData = new FormData();
            formData.append("audio", blob);
            formData.append("roomId", roomId);

            const response = await callApi({
                method: METHOD.POST,
                endpoint: interviewEndPoints.AI_INTERVIEW_TRANSCRIBE,
                arg: formData,
                displaySuccessMessage: false,
                alertErrorMessage: true,
            });

            const text = response?.data?.text || response?.data?.transcript || "";
            if (text) appendTranscript(text);
        },
        [appendTranscript, roomId],
    );

    const getAudioStream = useCallback(() => {
        return navigator.mediaDevices.getUserMedia({ audio: true });
    }, []);

    const startRecording = async () => {
        if (isRecording || isStarting) return;
        setIsStarting(true);

        try {
            if (currentTranscript.trim()) {
                setHistory((prev) => [
                    { id: crypto.randomUUID?.() || Date.now(), text: currentTranscript, createdAt: new Date().toISOString() },
                    ...prev,
                ]);
                setCurrentTranscript("");
            }

            const stream = await getAudioStream();
            streamRef.current = stream;

            await fetchIntro();

            const supportedMimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
            const recorder = supportedMimeType
                ? new MediaRecorder(stream, { mimeType: supportedMimeType })
                : new MediaRecorder(stream);

            recorder.ondataavailable = (event) => {
                if (!isMountedRef.current || !event.data || event.data.size === 0) return;
                sendAudioChunk(event.data).catch(() => {});
            };

            recorderRef.current = recorder;
            recorder.start(4000);
            setIsRecording(true);
        } catch (error) {
            console.error("Failed to start recording:", error);
        } finally {
            setIsStarting(false);
        }
    };

    const stopRecording = async () => {
        if (!recorderRef.current) return;
        setIsRecording(false);
        recorderRef.current.ondataavailable = null;
        recorderRef.current.stop();
        recorderRef.current = null;
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (currentTranscript.trim()) {
            setHistory((prev) => [
                { id: crypto.randomUUID?.() || Date.now(), text: currentTranscript, createdAt: new Date().toISOString() },
                ...prev,
            ]);
        }
    };

    const hasHistory = history.length > 0;

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    AI Interview
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                        Start recording to capture your responses and generate transcripts.
                    </Typography>
                    {isRecording ? (
                        <Button variant="outlined" color="error" onClick={stopRecording}>
                            Stop
                        </Button>
                    ) : (
                        <Button variant="contained" onClick={startRecording} disabled={isStarting}>
                            {isStarting ? (
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <CircularProgress size={16} color="inherit" />
                                    <span>Starting...</span>
                                </Stack>
                            ) : (
                                "Start"
                            )}
                        </Button>
                    )}
                </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    Current Transcript
                </Typography>
                {currentTranscript ? (
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                        {currentTranscript}
                    </Typography>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        No transcript yet.
                    </Typography>
                )}
            </Paper>

            <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    History
                </Typography>
                {hasHistory ? (
                    <List dense disablePadding>
                        {history.map((h, idx) => (
                            <Box key={`${h.id ?? "h"}-${idx}`}>
                                <ListItem disableGutters>
                                    <ListItemText
                                        primary={h.createdAt ? new Date(h.createdAt).toLocaleString() : "Session"}
                                        secondary={h.text || ""}
                                    />
                                </ListItem>
                                {idx < history.length - 1 && <Divider />}
                            </Box>
                        ))}
                    </List>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        No history yet.
                    </Typography>
                )}
            </Paper>
        </Box>
    );
}

export default AiInterviewPanel;
