import { useParams, useNavigate } from "react-router-dom";
import { BE_BASE_URL } from "../../../../common/constants/env";
import * as signalR from "@microsoft/signalr";
import { useEffect, useRef, useState, useCallback } from "react";
import useUser from '../../../../common/hooks/useUser';
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    List,
    ListItem,
    ListItemText,
    Typography,
    Stack,
    IconButton,
    Avatar,
    Tabs,
    Tab
} from "@mui/material";
import QuestionPanel from "./QuestionPanel";
import VideoPanel from "./VideoPanel";
import CodeEditorPanel from "./CodeEditorPanel";
// import AiInterviewPanel from "./AiInterviewPanel";
import { ROLES } from "../../../../common/constants/common.js";
import { callApi } from "../../../../common/utils/apiConnector.js";
import { audioBufferToWavArrayBuffer, encodeMediaBlobToWav, wavArrayBufferToByteArray } from "../../../../common/utils/wavEncode.js";
import { METHOD } from "../../../../common/constants/api.js";
import { INTERVIEW_ROOM_STATUS } from "../../../../common/constants/status.js";
import SettingsIcon from "@mui/icons-material/Settings";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import CodeIcon from "@mui/icons-material/Code";
import { INTERVIEW_ROOM_TYPE } from "../../../../common/constants/types.js";
import { interviewEndPoints } from "../../services/interviewRoomApi.js";
import { useLocation } from "react-router-dom";
import EvaluationForm from "./EvaluationForm";

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

const TRANSCRIPT_CHUNK_INTERVAL_MS = 15_000;

const languages = {
    // python: {
    //     example: "print(\"Hello, World!\")",
    // },
    javascript: {
        example: 'console.log("Hello, World!");',
    },
    java: {
        example:
            'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n      System.out.println("Hello, World!");\n  }\n}',
    },
    csharp: {
        example:
            'using System;\nusing System.Collections.Generic;\nusing System.Linq;\nusing System.Text.RegularExpressions;\n\nnamespace HelloWorld\n{\n\tpublic class Program\n\t{\n\t\tpublic static void Main(string[] args)\n\t\t{\n\t\t\tConsole.WriteLine("Hello, World!");\n\t\t}\n\t}\n}',
    },
    // c: {
    //     example: "#include <stdio.h>\nint main()\n{\n    printf(\"Hello, World!\");\n}",
    // },
    // 'c++': {
    //     example: "#include <iostream>\nusing namespace std;\n\nint main() \n{\n    cout << \"Hello, World!\";\n    return 0;\n}",
    // },
    // lua: {
    //     example: "print (\"Hello, World!\")",
    // },
};

function InterviewRoomPage() {
    const user = useUser();
    const { roomId } = useParams();
    const navigate = useNavigate();
    const localVideoRef = useRef();
    const remoteVideoRef = useRef();
    const pcRef = useRef(null);
    const connRef = useRef(null);
    const editorRef = useRef(null);
    const monacoRef = useRef(null);
    const isExternalChange = useRef(false);
    const sendCodeTimeout = useRef(null);
    const [myId, setMyId] = useState(null);
    const [peers, setPeers] = useState([]);
    const [language, setLanguage] = useState("java");
    const [roomLanguageCodeMap, setRoomLanguageCodeMap] = useState({});
    // const [code, setCode] = useState(languages.java.example);
    const [consoleOutput, setConsoleOutput] = useState(null);
    const [testResults, setTestResults] = useState(null);
    const [isRunning, setIsRunning] = useState(false);

    // Problem state
    const [problemDescription, setProblemDescription] = useState("");
    const [problemShortName, setProblemShortName] = useState("");
    const [testCases, setTestCases] = useState([{ inputs: [{ name: "", value: "" }], expectedOutputs: [""] }]);
    const [receivedProblem, setReceivedProblem] = useState(null);
    const [activeTestCaseTab, setActiveTestCaseTab] = useState(0);
    const [isEditingProblem, setIsEditingProblem] = useState(false);
    const [problemTab, setProblemTab] = useState(0);

    // Main side-panel tab (Problem vs Evaluation)
    const [mainPanelTab, setMainPanelTab] = useState(0);

    // Media and signaling related state/refs (missing earlier)
    const location = useLocation();
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isMicOn, setIsMicOn] = useState(false);
    const hasAutoStartedMedia = useRef(false);
    const [isRemoteAudioOn, setIsRemoteAudioOn] = useState(false);
    const localStreamRef = useRef(null);
    const remotePeerIdRef = useRef(null);
    const iceCandidatesQueue = useRef([]);
    const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
    const [isRemoteSpeaking, setIsRemoteSpeaking] = useState(false);
    const audioAnalysers = useRef({ local: null, remote: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [roomInfo, setRoomInfo] = useState(null);
    const [elapsedTime, setElapsedTime] = useState("00:00");
    const startTimeRef = useRef(null);
    const [roomType, setRoomType] = useState(null);
    const transcriptRecorderRef = useRef(null);
    const transcriptChunkSeqRef = useRef(0);
    const transcriptPendingUploadsRef = useRef([]);
    const transcriptAudioContextRef = useRef(null);
    const finalChunkUploadedRef = useRef(false);
    const micPromptedRef = useRef(false);
    const hasSentTranscriptRef = useRef(false);
    const [isTranscriptRecording, setIsTranscriptRecording] = useState(false);
    const [isTranscriptSending, setIsTranscriptSending] = useState(false);
    const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
    const [transcriptQuestions, setTranscriptQuestions] = useState([]);
    const [transcriptError, setTranscriptError] = useState(null);

    // Mounted check for background processes
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    // --- Resizable layout state ---
    const containerRef = useRef(null);
    const [cols, setCols] = useState([20, 60, 20]); // [left, middle, right] in %
    const [dragging, setDragging] = useState(null); // { index, startX, startCols, containerWidth }

    const startDrag = (e, index) => {
        e.preventDefault();
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setDragging({
            index,
            startX: e.clientX,
            startCols: [...cols],
            containerWidth: rect.width,
        });
    };

    const problemData =
        user?.role === ROLES.INTERVIEWER
            ? { description: problemDescription, shortName: problemShortName, testCases }
            : receivedProblem;

    useEffect(() => {
        if (!dragging) return;

        const MIN_COL = 10; // percent
        function clamp(v, min, max) {
            return Math.max(min, Math.min(max, v));
        }

        const onMove = (e) => {
            const dx = e.clientX - dragging.startX;
            const deltaPct = (dx / dragging.containerWidth) * 100;

            if (dragging.index === 0) {
                // between left and middle
                const [l0, m0, r0] = dragging.startCols;
                const minDelta = -(l0 - MIN_COL);
                const maxDelta = m0 - MIN_COL;
                const d = clamp(deltaPct, minDelta, maxDelta);
                const left = l0 + d;
                const middle = m0 - d;
                const right = r0; // unchanged
                setCols([left, middle, right]);
            } else if (dragging.index === 1) {
                // between middle and right
                const [l0, m0, r0] = dragging.startCols;
                const minDelta = -(m0 - MIN_COL);
                const maxDelta = r0 - MIN_COL;
                const d = clamp(deltaPct, minDelta, maxDelta);
                const middle = m0 + d;
                const right = r0 - d;
                const left = l0; // unchanged
                setCols([left, middle, right]);
            }
        };

        const onUp = () => setDragging(null);

        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
        return () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
        };
    }, [dragging]);

    const checkRoomStatus = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            const res = await callApi({
                method: METHOD.GET,
                endpoint: `/interviewroom`,
            });

            const room = res.data.find(item => item.id === roomId);
            setRoomInfo(room || null);
            if (room.status !== INTERVIEW_ROOM_STATUS.ON_GOING &&
                room.status !== INTERVIEW_ROOM_STATUS.COMPLETED) {
                setError("This interview is not in progress. You will be redirected.");
                setTimeout(() => navigate("/interview"), 3000);
            } else {
                setRoomType(room.type);
                setLoading(false);
            }
        } catch (err) {
            console.error("Failed to fetch room details:", err);
            setError("Failed to load interview room. You will be redirected.");
            setTimeout(() => navigate("/interview"), 3000);
        }
    }, [roomId, navigate, user]);

    useEffect(() => {
        if (!roomInfo) return;
        if (!startTimeRef.current) {
            startTimeRef.current = new Date();
        }

        const interval = setInterval(() => {
            const now = new Date();
            const diff = now - startTimeRef.current;

            const totalSeconds = Math.floor(diff / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const mins = Math.floor((totalSeconds % 3600) / 60);
            const secs = totalSeconds % 60;

            if (hours > 0) {
                setElapsedTime(`${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
            } else {
                setElapsedTime(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [roomInfo]);

    const monitorAudio = useCallback((stream, type) => {
        if (!stream || stream.getAudioTracks().length === 0) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioContext();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 256;

            audioAnalysers.current[type] = { context: audioContext, analyser };

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const checkVolume = () => {
                if (!audioAnalysers.current[type]) return;
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                const average = sum / dataArray.length;

                // Sensitivity threshold (5 is more sensitive)
                const isSpeaking = average > 5;
                if (type === 'local') setIsLocalSpeaking(isSpeaking);
                else setIsRemoteSpeaking(isSpeaking);

                requestAnimationFrame(checkVolume);
            };
            checkVolume();
        } catch (e) {
            console.warn("Audio analysis failed:", e);
        }
    }, []);

    useEffect(() => {
        if (isMicOn && localStreamRef.current) {
            monitorAudio(localStreamRef.current, 'local');
        } else {
            if (audioAnalysers.current.local) {
                audioAnalysers.current.local.context.close();
                audioAnalysers.current.local = null;
                setIsLocalSpeaking(false);
            }
        }
    }, [isMicOn, monitorAudio]);

    useEffect(() => {
        if (user) {
            checkRoomStatus();
        }
    }, [user, checkRoomStatus]);

    useEffect(() => {
        if (loading || error) return;

        const conn = new signalR.HubConnectionBuilder()
            .withUrl(`${BE_BASE_URL}/hubs/interviewroom?userId=${user?.id || 1}&role=${user?.role}`)
            .withAutomaticReconnect()
            .build();

        connRef.current = conn;

        conn.start()
            .then(() => {
                console.log("SignalR connected");
                conn.invoke("JoinRoom", roomId).then(() => {
                    console.log("Joined room", roomId);
                    const id = conn.connectionId;
                    setMyId(id ?? null);
                    console.log("My connection id:", id);
                });
            })
            .catch(console.error);

        conn.onreconnected?.((newId) => {
            setMyId(newId ?? null);
            console.log("Reconnected with id:", newId);
            // Re-join the room with the new connection ID
            conn.invoke("JoinRoom", roomId)
                .then(() => {
                    console.log("Re-joined room", roomId, "with new connection ID:", newId);
                })
                .catch(console.error);
        });

        conn.on("UserJoined", (connectionId) => {
            console.log("UserJoined", connectionId);
            setPeers((p) => {
                const selfId = conn.connectionId;
                if (!p.includes(connectionId) && connectionId !== selfId) return [...p, connectionId];
                return p;
            });
            // Initiate call as existing participant if we already have media
            if (!pcRef.current && (isCameraOn || isMicOn)) {
                remotePeerIdRef.current = connectionId;
                call(connectionId);
            }
        });

        conn.on("UserLeft", (connectionId) => {
            setPeers((p) => p.filter((x) => x !== connectionId));
        });

        // Receive list of existing peers when we join
        conn.on("ExistingPeers", (existing) => {
            console.log("ExistingPeers", existing);
            setPeers(existing.filter((id) => id !== conn.connectionId));
        });

        // New handler for receiving the full initial state upon joining
        conn.on("ReceiveFullState", (roomState) => {
            console.log("Received initial room state:", roomState);
            if (roomState) {
                const { currentLanguage, languageCodes } = roomState;
                setLanguage(currentLanguage);

                // Check if the received map has code for the current language.
                // If not, use the example code as a fallback.
                const initialCode = languageCodes?.[currentLanguage] || languages[currentLanguage]?.example || "";
                const initialCodeMap = languageCodes || {};

                // Ensure the map has an entry for the current language's code
                if (!initialCodeMap[currentLanguage]) {
                    initialCodeMap[currentLanguage] = initialCode;
                }

                setRoomLanguageCodeMap(initialCodeMap);
                setReceivedProblem({ description: roomState.problemDescription, shortName: roomState.problemShortName, testCases: roomState.testCases });
                setProblemDescription(roomState.problemDescription);
                setProblemShortName(roomState.problemShortName);
                setTestCases(roomState.testCases || [{ inputs: [{ name: "", value: "" }], expectedOutputs: [""] }]);
            }
        });

        conn.on("ReceiveOffer", async (fromId, sdp) => {
            console.log("ReceiveOffer from", fromId);
            remotePeerIdRef.current = fromId;

            // Create PC if missing (answerer path)
            if (!pcRef.current) {
                await createPeerConnection(fromId, false);
            }

            // Set remote description
            await pcRef.current.setRemoteDescription({ type: "offer", sdp });

            // Acquire local media if user already toggled cam/mic but stream not initialized yet
            if ((isCameraOn || isMicOn) && !localStreamRef.current) {
                try {
                    const constraints = { video: isCameraOn, audio: isMicOn };
                    const stream = await navigator.mediaDevices.getUserMedia(constraints);
                    localStreamRef.current = stream;
                    localVideoRef.current.srcObject = stream;
                    stream.getTracks().forEach((track) => pcRef.current.addTrack(track, stream));
                    console.log(
                        "Added local tracks during answer path:",
                        stream.getTracks().map((t) => t.kind),
                    );
                } catch (err) {
                    console.warn("Failed to get local media for answer path", err);
                }
            }

            // Ensure existing local tracks are attached (replace if needed)
            if (localStreamRef.current) {
                const tracks = localStreamRef.current.getTracks();
                const senders = pcRef.current.getSenders();
                tracks.forEach((track) => {
                    const senderSameKind = senders.find((s) => s.track?.kind === track.kind);
                    if (!senderSameKind) {
                        console.log("Attaching missing", track.kind, "track before answering");
                        pcRef.current.addTrack(track, localStreamRef.current);
                    }
                });
            }

            // Flush queued ICE candidates (if any)
            while (iceCandidatesQueue.current.length > 0) {
                const candidate = iceCandidatesQueue.current.shift();
                try {
                    await pcRef.current.addIceCandidate(candidate);
                    console.log("Added queued ICE candidate");
                } catch (e) {
                    console.error("Error adding queued ICE candidate", e);
                }
            }

            // Create answer
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            await conn.invoke("SendAnswer", fromId, answer.sdp);
            console.log(
                "Sent answer to",
                fromId,
                "with",
                localStreamRef.current?.getTracks().length || 0,
                "local tracks",
            );
        });

        conn.on("ReceiveAnswer", async (fromId, sdp) => {
            console.log("ReceiveAnswer from", fromId);
            if (!pcRef.current) return;
            await pcRef.current.setRemoteDescription({ type: "answer", sdp });
            // Flush any queued ICE now that remote description is set
            while (iceCandidatesQueue.current.length > 0) {
                const cand = iceCandidatesQueue.current.shift();
                try {
                    await pcRef.current.addIceCandidate(cand);
                    console.log("Added queued ICE after answer");
                } catch (e) {
                    console.error("Error adding queued ICE after answer", e);
                }
            }
        });

        conn.on("ReceiveIceCandidate", async (fromId, candidate) => {
            try {
                if (pcRef.current && candidate) {
                    const ice = JSON.parse(candidate);
                    if (!pcRef.current.remoteDescription) {
                        // Queue until remote description is set
                        iceCandidatesQueue.current.push(ice);
                        console.log("Queued ICE candidate (no remoteDescription yet)");
                    } else {
                        await pcRef.current.addIceCandidate(ice);
                    }
                }
            } catch (e) {
                console.error("addIceCandidate error", e);
            }
        });

        conn.on("ReceiveCode", (changes, codeLang) => {
            if (editorRef.current) {
                isExternalChange.current = true;
                // Apply the changes received from the server
                const currentPosition = editorRef.current.getPosition();
                editorRef.current.setValue(changes);
                if (currentPosition) {
                    editorRef.current.setPosition(currentPosition);
                }
                isExternalChange.current = false;

                // Update the central map with the new code value after applying edits
            }
        });

        conn.on("ReceiveLanguage", (lang, codeForLang) => {
            setLanguage(lang);
            const newCode = codeForLang ?? (languages[lang]?.example || "");
            setRoomLanguageCodeMap(prevMap => ({ ...prevMap, [lang]: newCode }));

            if (editorRef.current) {
                isExternalChange.current = true;
                editorRef.current.setValue(newCode);
                isExternalChange.current = false;
            }
        });

        conn.on("ReceiveExecutionResult", (result) => {
            setConsoleOutput(result);
            setIsRunning(false);
        });

        conn.on("ReceiveProblem", (description, shortName, testCases) => {
            // The only job here is to update the state for the problem description/test case view.
            // Code generation is now handled by the backend and sent via "ReceiveCode".
            setReceivedProblem({ description, shortName, testCases });

            // Also, synchronize the local editing state. This is crucial for when
            // an interviewer reloads the page, so their editing fields are
            // populated with the last sent problem data.
            setProblemDescription(description);
            setProblemShortName(shortName);
            setTestCases(testCases);
        });

        conn.on("ReceiveTestResults", (results) => {
            setTestResults(results);
            setIsRunning(false);
        });

        return () => {
            if (connRef.current) {
                connRef.current.invoke("LeaveRoom", roomId).catch(() => { });
                connRef.current.stop();
            }
            if (pcRef.current) pcRef.current.close();
            releaseLocalMediaTracks({ updateUi: false });
            // Close AudioContext for WAV encoding
            if (transcriptAudioContextRef.current) {
                transcriptAudioContextRef.current.close();
                transcriptAudioContextRef.current = null;
            }

            // Cleanup local media tracks
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [roomId, user?.id, user?.role, loading, error]);

    // Handle initial device state from Pre-check
    useEffect(() => {
        if (loading || hasAutoStartedMedia.current) return;

        const initMedia = async () => {
            hasAutoStartedMedia.current = true;
            if (location.state?.initialCameraOn) {
                await toggleCamera();
            }
            if (location.state?.initialMicOn) {
                await toggleMic();
            }
        };
        initMedia();
    }, [loading, location.state]);

    function arrayBufferToByteArray(buffer) {
        return Array.from(new Uint8Array(buffer));
    }

    function startTranscriptRecording(stream) {
        if (transcriptRecorderRef.current || !stream) return;
        
        // Only show recording session dialog once
        if (!micPromptedRef.current) {
            micPromptedRef.current = true;
            setIsTranscriptModalOpen(true);
        }

        // Create AudioContext for WAV encoding
        if (!transcriptAudioContextRef.current) {
            transcriptAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 16000,
            });
        }

        const mimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"];
        const supportedMimeType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type));

        let isRunning = true;
        let currentRecorder = null;
        let chunkTimeout = null;
        let loopExitResolve = null;
        const loopExitPromise = new Promise(r => loopExitResolve = r);

        // Recursive function to record independent valid media files
        const recordNextChunk = () => {
            if (!isRunning) {
                if (loopExitResolve) loopExitResolve();
                return;
            }

            const recorder = new MediaRecorder(stream, supportedMimeType ? { mimeType: supportedMimeType } : undefined);
            currentRecorder = recorder;
            let chunks = [];

            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: supportedMimeType });
                chunks = [];

                if (blob.size > 0) {
                    const sequenceNumber = transcriptChunkSeqRef.current++;
                    const upload = (async () => {
                        try {
                            if (!transcriptAudioContextRef.current || transcriptAudioContextRef.current.state === 'closed') return;

                            const wavArrayBuffer = await encodeMediaBlobToWav(blob, transcriptAudioContextRef.current);
                            const audioData = wavArrayBufferToByteArray(wavArrayBuffer);
                            await callApi({
                                method: METHOD.POST,
                                endpoint: interviewEndPoints.STORE_AUDIO_CHUNK,
                                arg: { audioData, recordingSessionId: roomId, sequenceNumber },
                                displaySuccessMessage: false,
                                alertErrorMessage: false,
                            });
                        } catch (err) {
                            console.error(`Failed to store transcript audio chunk ${sequenceNumber}:`, err);
                        }
                    })();
                    transcriptPendingUploadsRef.current.push(upload);
                }

                if (isRunning) {
                    recordNextChunk();
                } else {
                    if (loopExitResolve) loopExitResolve();
                }
            };

            recorder.start(); // No timeslice, we stop manually

            chunkTimeout = setTimeout(() => {
                if (recorder.state === "recording") {
                    recorder.stop();
                }
            }, TRANSCRIPT_CHUNK_INTERVAL_MS);
        };

        recordNextChunk();

        transcriptRecorderRef.current = {
            get recorder() { return currentRecorder; },
            stop: async () => {
                isRunning = false;
                if (chunkTimeout) clearTimeout(chunkTimeout);
                if (currentRecorder && currentRecorder.state === "recording") {
                    currentRecorder.stop();
                }
                await loopExitPromise;
            }
        };
        setIsTranscriptRecording(true);
    }

    async function stopTranscriptRecording() {
        const capture = transcriptRecorderRef.current;
        if (!capture) return;

        // Clear the ref first to prevent double-calling
        transcriptRecorderRef.current = null;

        // Stop the loop and current recorder
        const stopPromise = capture.stop();

        // Safety race
        const timeout = new Promise(resolve => setTimeout(resolve, 2000));
        await Promise.race([stopPromise, timeout]);

        // Wait for all pending uploads
        await Promise.allSettled(transcriptPendingUploadsRef.current);

        transcriptPendingUploadsRef.current = [];
        if (mountedRef.current) setIsTranscriptRecording(false);
        console.log("Transcript recording stopped, all chunks uploaded");
    }

    async function generateQuestionsFromTranscript() {
        if (hasSentTranscriptRef.current) return;
        if (mountedRef.current) setTranscriptError(null);
        // Stop recording if still active (may already be stopped by leaveRoom)
        await stopTranscriptRecording();

        // Wait a bit to ensure all uploads are complete
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            if (mountedRef.current) setIsTranscriptSending(true);
            const response = await callApi({
                method: METHOD.POST,
                endpoint: interviewEndPoints.TRANSCRIPT_QUESTIONS,
                arg: { recordingSessionId: roomId },
                displaySuccessMessage: false,
                alertErrorMessage: mountedRef.current, // Only alert if user hasn't left
            });
            if (mountedRef.current) {
                setTranscriptQuestions(response?.data || []);
            }
            hasSentTranscriptRef.current = true;
        } catch (err) {
            console.error("Failed to generate questions from transcript:", err);
            if (mountedRef.current) setTranscriptError("Failed to generate questions. Please try again.");
        } finally {
            if (mountedRef.current) setIsTranscriptSending(false);
        }
    }

    async function startLocalStream({ video = true, audio = true } = {}) {
        if (localStreamRef.current) return localStreamRef.current;
        const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
        localStreamRef.current = stream;
        localVideoRef.current.srcObject = stream;
        return stream;
    }

    async function toggleCamera() {
        try {
            if (isCameraOn) {
                // Turn off camera
                if (localStreamRef.current) {
                    const videoTrack = localStreamRef.current.getVideoTracks()[0];
                    if (videoTrack) {
                        videoTrack.stop();
                        localStreamRef.current.removeTrack(videoTrack);
                    }
                }

                // Remove from peer connection
                if (pcRef.current) {
                    const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
                    if (sender) {
                        pcRef.current.removeTrack(sender);
                    }
                }

                setIsCameraOn(false);
            } else {
                // Turn on camera
                // Acquire / add video track
                const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const videoTrack = videoStream.getVideoTracks()[0];
                if (!localStreamRef.current) localStreamRef.current = new MediaStream();
                localStreamRef.current.addTrack(videoTrack);
                localVideoRef.current.srcObject = localStreamRef.current;

                // Add to peer connection if exists and renegotiate
                if (pcRef.current && connRef.current) {
                    const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
                    if (sender) {
                        await sender.replaceTrack(videoTrack);
                    } else {
                        pcRef.current.addTrack(videoTrack, localStreamRef.current);
                    }

                    // Check signaling state before renegotiation
                    if (pcRef.current.signalingState === "stable") {
                        // Renegotiate: create new offer
                        const offer = await pcRef.current.createOffer();
                        await pcRef.current.setLocalDescription(offer);

                        // Send to the connected peer
                        const targetPeer = remotePeerIdRef.current || peers[0];
                        if (targetPeer) {
                            await connRef.current.invoke("SendOffer", targetPeer, offer.sdp);
                            console.log("Sent renegotiation offer to", targetPeer, "after camera toggle");
                        } else {
                            console.warn("No peer to send renegotiation offer");
                        }
                    } else {
                        console.warn("Cannot renegotiate, signaling state is:", pcRef.current.signalingState);
                    }
                } else if (!pcRef.current && connRef.current) {
                    // Not connected yet: if we already have peers, initiate the call
                    const targetPeer = peers[0];
                    if (targetPeer) {
                        remotePeerIdRef.current = targetPeer;
                        await call(targetPeer);
                        console.log("Initiated call to", targetPeer, "after camera turned on");
                    } else {
                        console.log("Camera on but no peer available to call yet");
                    }
                }

                setIsCameraOn(true);
            }
        } catch (err) {
            console.error("Error toggling camera:", err);
        }
    }

    async function toggleMic() {
        try {
            if (isMicOn) {
                // Turn off mic
                if (localStreamRef.current) {
                    const audioTrack = localStreamRef.current.getAudioTracks()[0];
                    if (audioTrack) {
                        audioTrack.stop();
                        localStreamRef.current.removeTrack(audioTrack);
                    }
                }

                if (pcRef.current) {
                    const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "audio");
                    if (sender) {
                        pcRef.current.removeTrack(sender);
                    }
                }

                // If Interviewer, stop recording but ensure current chunk is sent
                if (user?.role === ROLES.INTERVIEWER) {
                    await stopTranscriptRecording();
                }

                setIsMicOn(false);
            } else {
                // Turn on mic
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const audioTrack = audioStream.getAudioTracks()[0];
                if (!localStreamRef.current) localStreamRef.current = new MediaStream();
                if (audioTrack) {
                    localStreamRef.current.addTrack(audioTrack);
                    localVideoRef.current.srcObject = localStreamRef.current;

                    if (pcRef.current && connRef.current) {
                        const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "audio");
                        if (sender) {
                            await sender.replaceTrack(audioTrack);
                        } else {
                            pcRef.current.addTrack(audioTrack, localStreamRef.current);
                        }

                        // Check signaling state before renegotiation
                        if (pcRef.current.signalingState === "stable") {
                            const offer = await pcRef.current.createOffer();
                            await pcRef.current.setLocalDescription(offer);
                            const targetPeer = remotePeerIdRef.current || peers[0];
                            if (targetPeer) {
                                await connRef.current.invoke("SendOffer", targetPeer, offer.sdp);
                                console.log("Sent renegotiation offer to", targetPeer, "after mic toggle");
                            }
                        } else {
                            console.warn("Cannot renegotiate, signaling state is:", pcRef.current.signalingState);
                        }
                    }

                    // If Interviewer, start recording
                    if (user?.role === ROLES.INTERVIEWER) {
                        startTranscriptRecording(localStreamRef.current);
                    }
                }

                setIsMicOn(true);
            }
        } catch (err) {
            console.error("Error toggling mic:", err);
        }
    }

    function toggleRemoteAudio() {
        try {
            if (!remoteVideoRef.current) return;
            const next = !isRemoteAudioOn;
            remoteVideoRef.current.muted = !next;
            if (next) {
                // user gesture may be required; ensure play is called
                remoteVideoRef.current.play().catch((e) => console.warn("Remote audio play blocked:", e));
            }
            setIsRemoteAudioOn(next);
        } catch (e) {
            console.warn("toggleRemoteAudio error:", e);
        }
    }

    async function createPeerConnection(targetId, isOfferer) {
        if (pcRef.current) {
            console.warn("PeerConnection already exists (demo supports single peer).");
            return;
        }

        pcRef.current = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        pcRef.current.onicecandidate = (e) => {
            if (e.candidate) {
                connRef.current.invoke("SendIceCandidate", targetId, JSON.stringify(e.candidate));
            }
        };

        pcRef.current.ontrack = (e) => {
            console.log("✅ Received remote track:", e.track.kind, "enabled:", e.track.enabled);
            if (remoteVideoRef.current && e.streams[0]) {
                remoteVideoRef.current.srcObject = e.streams[0];
                monitorAudio(e.streams[0], 'remote');
                console.log("Set remote video srcObject");
                // Force play in case browser pauses autoplay with audio
                remoteVideoRef.current.play().catch((err) => console.warn("Remote video play blocked", err));
            }
        };

        pcRef.current.onnegotiationneeded = async () => {
            console.log("⚠️ Negotiation needed");
        };

        pcRef.current.oniceconnectionstatechange = () => {
            console.log("ICE connection state:", pcRef.current.iceConnectionState);
        };

        pcRef.current.onconnectionstatechange = () => {
            console.log("Connection state:", pcRef.current.connectionState);
        };

        // Add existing local stream tracks if any; otherwise prime recvonly transceivers so we can receive remote media immediately.
        if (localStreamRef.current) {
            const tracks = localStreamRef.current.getTracks();
            console.log(`Adding ${tracks.length} local tracks to peer connection`);
            tracks.forEach((track) => {
                console.log("  - Adding local track:", track.kind, "enabled:", track.enabled);
                pcRef.current.addTrack(track, localStreamRef.current);
            });
        } else {
            console.log("No local stream to add; adding recvonly transceivers for video/audio");
            pcRef.current.addTransceiver("video", { direction: "recvonly" });
            pcRef.current.addTransceiver("audio", { direction: "recvonly" });
        }

        if (isOfferer) {
            const offer = await pcRef.current.createOffer();
            await pcRef.current.setLocalDescription(offer);
            connRef.current.invoke("SendOffer", targetId, offer.sdp);
        }
    }

    const call = async (targetId) => {
        await createPeerConnection(targetId, true);
    };

    function releaseLocalMediaTracks({ updateUi = true } = {}) {
        if (transcriptRecorderRef.current) {
            const { recorder } = transcriptRecorderRef.current;
            if (recorder && recorder.state !== "inactive") {
                recorder.stop();
            }
            // If we're updating UI, we assume we want to clear everything.
            // If updateUi is false (e.g. unmount), we might have a background process.
            if (updateUi) {
                transcriptRecorderRef.current = null;
                transcriptPendingUploadsRef.current = [];
            }
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
        }
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }
        if (pcRef.current) {
            pcRef.current.getSenders().forEach((sender) => {
                if (sender.track) sender.track.stop();
            });
        }
        if (updateUi && mountedRef.current) {
            setIsTranscriptRecording(false);
            setIsMicOn(false);
            setIsCameraOn(false);
        }
    }

    const leaveRoom = async () => {
        console.log("Leaving room, triggering background processes...");

        // Fire and forget transcript processing
        if (user?.role === ROLES.INTERVIEWER) {
            generateQuestionsFromTranscript().catch(console.error);
        } else if (transcriptRecorderRef.current) {
            stopTranscriptRecording().catch(console.error);
        }

        // Cleanup other media tracks immediately
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
        }
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }
        if (pcRef.current) {
            pcRef.current.getSenders().forEach((sender) => {
                if (sender.track) sender.track.stop();
            });
        }

        if (connRef.current) {
            connRef.current
                .invoke("LeaveRoom", roomId)
                .catch(console.error);
        }

        navigate("/interview");
    };

    const handleCodeChange = (value, event) => {
        // The 'value' parameter is the full, current code in the editor.
        // We use it instead of event.changes.
        if (isExternalChange.current || !connRef.current) {
            return;
        }

        // Debounce the code sending to avoid flooding the server
        if (sendCodeTimeout.current) {
            clearTimeout(sendCodeTimeout.current);
        }

        // Only the candidate sends code changes automatically.
        if (user?.role === ROLES.CANDIDATE) {
            sendCodeTimeout.current = setTimeout(() => {
                connRef.current.invoke("SendCode", roomId, value, language).catch(console.error);
            }, 300); // Send after 300ms of inactivity
        }
    };

    const handleLanguageChange = async (e) => {
        const newLang = e.target.value;
        const oldLang = language;
        setLanguage(newLang);

        if (connRef.current) {
            const oldCode = editorRef.current?.getValue();
            // console.log(roomId);
            // console.log(oldCode);
            // console.log(oldLang);
            // connRef.current.invoke("SendCode", roomId, oldCode, oldLang);
            try {
                // Await the SendCode invocation to handle potential errors
                await connRef.current.invoke("SendCode", roomId, oldCode, oldLang);
                console.log(`Sent old code for language ${oldLang} to server.`);
            } catch (error) {
                console.error(`Error sending old code for language ${oldLang}:`, error);
            }
        }
        // const newCode = languages[newLang].example;
        // setCode(newCode);

        // Determine the code to load for the new language
        // Prioritize code from the map, otherwise use example code
        const codeToLoad = roomLanguageCodeMap[newLang] || languages[newLang].example;

        if (editorRef.current) {
            isExternalChange.current = true; // Mark as external change to prevent immediate SendCode
            editorRef.current.setValue(codeToLoad);
            isExternalChange.current = false;
        }

        // Update the map with the newly loaded code (even if it was example code)
        setRoomLanguageCodeMap(prevMap => ({
            ...prevMap,
            [newLang]: codeToLoad
        }));

        if (connRef.current) {
            // connRef.current.invoke("SendLanguage", roomId, newLang);
            try {
                // Await the SendLanguage invocation
                await connRef.current.invoke("SendLanguage", roomId, newLang);
                console.log(`Sent new language ${newLang} to server.`);
            } catch (error) {
                console.error(`Error sending new language ${newLang}:`, error);
            }
        }
    };

    const formatCode = async () => {
        if (!editorRef.current) return;
        editorRef.current.getAction("editor.action.formatDocument").run();
    };

    const runCode = () => {
        if (!connRef.current || !editorRef.current || isRunning) return;

        const currentCode = editorRef.current.getValue();
        setConsoleOutput(null);
        setTestResults(null);
        setIsRunning(true);
        connRef.current.invoke("RunCode", roomId, currentCode, language).catch((err) => {
            console.error("RunCode invocation failed: ", err);
            setConsoleOutput({
                stdout: null,
                stderr: `Error: Could not run code. ${err}`,
                exception: null,
                executionTime: 0,
            });
            setIsRunning(false);
        });
    };

    const handleTestCaseInputChange = (testCaseIndex, inputIndex, field, value) => {
        const newTestCases = JSON.parse(JSON.stringify(testCases));
        newTestCases[testCaseIndex].inputs[inputIndex][field] = value;
        setTestCases(newTestCases);
    };

    const handleTestCaseOutputChange = (testCaseIndex, outputIndex, value) => {
        const newTestCases = JSON.parse(JSON.stringify(testCases));
        newTestCases[testCaseIndex].expectedOutputs[outputIndex] = value;
        setTestCases(newTestCases);
    };

    const addInputToTestCase = (testCaseIndex) => {
        const newTestCases = JSON.parse(JSON.stringify(testCases));
        newTestCases[testCaseIndex].inputs.push({ name: "", value: "" });
        setTestCases(newTestCases);
    };

    const removeInputFromTestCase = (testCaseIndex, inputIndex) => {
        const newTestCases = JSON.parse(JSON.stringify(testCases));
        if (newTestCases[testCaseIndex].inputs.length > 1) {
            newTestCases[testCaseIndex].inputs.splice(inputIndex, 1);
            setTestCases(newTestCases);
        }
    };

    const addTestCase = () => {
        const newTestCases = [...testCases, { inputs: [{ name: "", value: "" }], expectedOutputs: [""] }];
        setTestCases(newTestCases);
        setActiveTestCaseTab(newTestCases.length - 1);
    };

    const removeTestCase = (index) => {
        if (testCases.length <= 1) return;
        const newTestCases = testCases.filter((_, i) => i !== index);
        setTestCases(newTestCases);

        if (activeTestCaseTab >= index) {
            setActiveTestCaseTab(Math.max(0, activeTestCaseTab - 1));
        }
    };

    const addExpectedOutput = (testCaseIndex) => {
        const newTestCases = JSON.parse(JSON.stringify(testCases));
        newTestCases[testCaseIndex].expectedOutputs.push("");
        setTestCases(newTestCases);
    };

    const removeExpectedOutput = (testCaseIndex, outputIndex) => {
        const newTestCases = JSON.parse(JSON.stringify(testCases));
        if (newTestCases[testCaseIndex].expectedOutputs.length > 1) {
            newTestCases[testCaseIndex].expectedOutputs.splice(outputIndex, 1);
            setTestCases(newTestCases);
        }
    };

    const sendProblem = () => {
        if (connRef.current) {
            connRef.current
                .invoke("SendProblem", roomId, problemDescription, problemShortName, testCases)
                .then(() => setIsEditingProblem(false))
                .catch(console.error);
        }
    };

    const handleEditorMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        monaco.languages.registerDocumentFormattingEditProvider("javascript", {
            async provideDocumentFormattingEdits(model) {
                const unformattedCode = model.getValue();
                try {
                    const formattedCode = await prettier.format(unformattedCode, {
                        parser: "babel",
                        plugins: [prettierPluginBabel, prettierPluginEstree],
                        tabWidth: 4,
                        useTabs: false,
                    });
                    return [
                        {
                            range: model.getFullModelRange(),
                            text: formattedCode,
                        },
                    ];
                } catch (error) {
                    console.error("Prettier formatting failed:", error);
                    return [];
                }
            },
        });

        const cStyleFormatter = {
            provideDocumentFormattingEdits(model) {
                const code = model.getValue();
                let formatted = "";
                let indentLevel = 0;
                const indentUnit = "    ";
                let processedCode = code
                    .replace(/\s*{\s*/g, "\n{\n")
                    .replace(/\s*}\s*/g, "\n}\n")
                    .replace(/\s*;\s*/g, ";\n");
                const lines = processedCode.split("\n");
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine.length === 0) continue;
                    if (trimmedLine.startsWith("}")) {
                        indentLevel = Math.max(0, indentLevel - 1);
                    }
                    formatted += indentUnit.repeat(indentLevel) + trimmedLine + "\n";
                    if (trimmedLine.endsWith("{")) {
                        indentLevel++;
                    }
                }
                formatted = formatted.replace(/\n\s*\n/g, "\n");
                return [
                    {
                        range: model.getFullModelRange(),
                        text: formatted.trim(),
                    },
                ];
            },
        };
        ["c", "c++", "java", "csharp"].forEach((lang) =>
            monaco.languages.registerDocumentFormattingEditProvider(lang, cStyleFormatter),
        );

        monaco.languages.registerDocumentFormattingEditProvider("python", {
            provideDocumentFormattingEdits(model) {
                const edits = [];
                for (let i = 1; i <= model.getLineCount(); i++) {
                    const line = model.getLineContent(i);
                    const newText = line.replace(/\t/g, "    ").trimEnd();
                    if (newText !== line) {
                        edits.push({
                            range: new monaco.Range(i, 1, i, line.length + 1),
                            text: newText,
                        });
                    }
                }
                return edits;
            },
        });

        monaco.languages.registerDocumentFormattingEditProvider("lua", {
            provideDocumentFormattingEdits(model) {
                const edits = [];
                let indent = 0;
                const indentKeywords = ["function", "if", "for", "while", "repeat"];
                const dedentKeywords = ["end", "until"];
                const middleKeywords = ["else", "elseif"];

                for (let i = 1; i <= model.getLineCount(); i++) {
                    const line = model.getLineContent(i);
                    const trimmed = line.trim();
                    if (trimmed.length === 0) {
                        if (line.length > 0)
                            edits.push({ range: new monaco.Range(i, 1, i, line.length + 1), text: "" });
                        continue;
                    }
                    const firstWord = trimmed.split(/\s+/)[0];
                    if (dedentKeywords.includes(firstWord) || middleKeywords.includes(firstWord)) {
                        if (indent > 0) indent--;
                    }
                    const correctIndent = "  ".repeat(indent);
                    const newText = correctIndent + trimmed;
                    if (newText !== line) {
                        edits.push({
                            range: new monaco.Range(i, 1, i, line.length + 1),
                            text: newText,
                        });
                    }
                    const lastWord = trimmed.split(/\s+/).pop();
                    if (indentKeywords.includes(firstWord) || lastWord === "do" || lastWord === "then") {
                        indent++;
                    }
                }
                return edits;
            },
        });

        editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF, () => {
            formatCode();
        });
    };

    const resizerStyle = {
        width: 6,
        cursor: "col-resize",
        background: "#e5e7eb",
        userSelect: "none",
    };

    if (loading || error) {
        return (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh" }}>
                {loading && !error && <CircularProgress />}
                <Typography variant="h6" sx={{ mt: 2 }}>
                    {error ? error : "Verifying interview status..."}
                </Typography>
            </Box>
        );
    }

    // const isAiRoom = roomType === INTERVIEW_ROOM_TYPE.WITH_AI;

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "#FAFAFA" }}>
            {/* Header */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 3,
                    py: 1.5,
                    borderBottom: "1px solid #E5E7EB",
                    background: "#FFFFFF",
                }}
            >
                <Stack direction="row" alignItems="center" spacing={3}>
                    <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<ExitToAppIcon />}
                        onClick={leaveRoom}
                        sx={{ fontWeight: "bold", textTransform: "none", borderRadius: 2 }}
                    >
                        Leave Room
                    </Button>
                    {roomInfo?.interviewTypeName && (
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1F2937", borderLeft: "1px solid #E5E7EB", pl: 3 }}>
                            {roomInfo.interviewTypeName}
                        </Typography>
                    )}
                    <Typography variant="body2" sx={{ color: "#6B7280", fontWeight: 600, bgcolor: "#F3F4F6", px: 1.5, py: 0.5, borderRadius: 2 }}>
                        SESSION ID: {roomId || 'TR-992-XQ'}
                    </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={3}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ color: "#6B7280", bgcolor: "#F3F4F6", px: 2, py: 0.5, borderRadius: 2 }}>
                        <AccessTimeIcon fontSize="small" sx={{ color: "#3B82F6" }} />
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "#111827" }}>
                            {elapsedTime}
                        </Typography>
                    </Stack>
                    <IconButton size="small" sx={{ color: "#6B7280" }}><SettingsIcon fontSize="small" /></IconButton>
                    <IconButton size="small" sx={{ color: "#6B7280" }}><HelpOutlineIcon fontSize="small" /></IconButton>
                    <Avatar
                        src={user?.profilePicture || user?.avatarUrl || user?.imageUrl || user?.imagePath || user?.avatar}
                        alt={user?.name || 'User'}
                        sx={{ width: 35, height: 35, border: "2px solid #3B82F6" }}
                    />
                </Stack>
            </Box>

            {/* Resizable 3-column layout */}
            <Box
                ref={containerRef}
                style={{
                    display: "flex",
                    flex: 1,
                    minHeight: 0,
                    overflow: "hidden",
                }}
            >
                {/* {isAiRoom ? (
                    <>
                        <Box
                            sx={{
                                width: `${cols[0] + cols[1]}%`,
                                minWidth: 0,
                                overflow: "auto",
                                padding: 1.5,
                                borderRight: "1px solid #eee",
                            }}
                        >
                            <AiInterviewPanel roomId={roomId} />
                        </Box>

                        <div style={resizerStyle} onMouseDown={(e) => startDrag(e, 1)} />
                    </>
                ) : ( */}
                    <>
                        <Box
                            sx={{
                                width: `${cols[0]}%`,
                                minWidth: 0,
                                overflow: "hidden", // Changed to hidden to manage scrolls in panels
                                display: 'flex',
                                flexDirection: 'column',
                                borderRight: "1px solid #eee",
                                bgcolor: 'white'
                            }}
                        >
                            {user?.role === ROLES.INTERVIEWER && (
                                <Tabs
                                    value={mainPanelTab}
                                    onChange={(_, v) => setMainPanelTab(v)}
                                    variant="fullWidth"
                                    sx={{ 
                                        minHeight: 40,
                                        borderBottom: 1,
                                        borderColor: 'divider',
                                        '& .MuiTab-root': { py: 1, minHeight: 40, textTransform: 'none', fontWeight: 700 }
                                    }}
                                >
                                    <Tab icon={<CodeIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Problem" />
                                    <Tab icon={<AssignmentTurnedInIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Evaluation" />
                                </Tabs>
                            )}
                            
                            <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
                                {mainPanelTab === 0 ? (
                                    <QuestionPanel
                                        user={user}
                                        isEditingProblem={isEditingProblem}
                                        setIsEditingProblem={setIsEditingProblem}
                                        problemDescription={problemDescription}
                                        setProblemDescription={setProblemDescription}
                                        problemShortName={problemShortName}
                                        setProblemShortName={setProblemShortName}
                                        testCases={testCases}
                                        setTestCases={setTestCases}
                                        sendProblem={sendProblem}
                                        problemTab={problemTab}
                                        problemData={problemData}
                                        setProblemTab={setProblemTab}
                                        activeTestCaseTab={activeTestCaseTab}
                                        setActiveTestCaseTab={setActiveTestCaseTab}
                                        addTestCase={addTestCase}
                                        handleTestCaseInputChange={handleTestCaseInputChange}
                                        handleTestCaseOutputChange={handleTestCaseOutputChange}
                                        addInputToTestCase={addInputToTestCase}
                                        removeInputFromTestCase={removeInputFromTestCase}
                                        removeTestCase={removeTestCase}
                                        addExpectedOutput={addExpectedOutput}
                                        removeExpectedOutput={removeExpectedOutput}
                                    />
                                ) : (
                                    <EvaluationForm roomId={roomId} onSubmitted={() => setMainPanelTab(0)} />
                                )}
                            </Box>
                        </Box>

                        <div style={resizerStyle} onMouseDown={(e) => startDrag(e, 0)} />

                        <Box
                            sx={{
                                width: `${cols[1]}%`,
                                minWidth: 0,
                                overflow: "auto",
                                padding: 1.5,
                                borderRight: "1px solid #eee",
                            }}
                        >
                            <CodeEditorPanel
                                language={language}
                                handleLanguageChange={handleLanguageChange}
                                code={roomLanguageCodeMap[language] || languages[language]?.example || ""}
                                handleCodeChange={handleCodeChange}
                                formatCode={formatCode}
                                runCode={runCode}
                                isRunning={isRunning}
                                consoleOutput={consoleOutput}
                                setConsoleOutput={setConsoleOutput}
                                testResults={testResults}
                                setTestResults={setTestResults}
                                user={user}
                                languages={languages}
                                handleEditorMount={handleEditorMount}
                            />
                        </Box>

                        <div style={resizerStyle} onMouseDown={(e) => startDrag(e, 1)} />
                    </>
                {/* )} */}

                <Box
                    sx={{
                        width: `${cols[2]}%`,
                        minWidth: 0,
                        overflow: "auto",
                        padding: 1.5,
                    }}
                >
                    <VideoPanel
                        myId={myId}
                        peers={peers}
                        onCall={call}
                        localVideoRef={localVideoRef}
                        remoteVideoRef={remoteVideoRef}
                        isCameraOn={isCameraOn}
                        isMicOn={isMicOn}
                        isLocalSpeaking={isLocalSpeaking}
                        isRemoteSpeaking={isRemoteSpeaking}
                        onToggleCamera={toggleCamera}
                        onToggleMic={toggleMic}
                        onLeaveRoom={leaveRoom}
                        user={user}
                        roomInfo={roomInfo}
                    />
                </Box>
            </Box>

            <Dialog
                open={isTranscriptModalOpen}
                onClose={() => {
                    if (isTranscriptRecording || isTranscriptSending) return;
                    setIsTranscriptModalOpen(false);
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Transcript Questions</DialogTitle>
                <DialogContent dividers>
                    {transcriptError && (
                        <Typography color="error" sx={{ mb: 2 }}>
                            {transcriptError}
                        </Typography>
                    )}
                    {isTranscriptRecording ? (
                        <Typography variant="body2" color="text.secondary">
                            Recording your microphone for the full session. Questions will be generated when you leave the room.
                        </Typography>
                    ) : transcriptQuestions.length > 0 ? (
                        <List dense>
                            {transcriptQuestions.map((q, idx) => (
                                <ListItem key={`${q.title || "q"}-${idx}`} alignItems="flex-start">
                                    <ListItemText
                                        primary={q.title || `Question ${idx + 1}`}
                                        secondary={q.content || ""}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            No questions generated yet.
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setIsTranscriptModalOpen(false)}
                        variant="contained"
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default InterviewRoomPage;
