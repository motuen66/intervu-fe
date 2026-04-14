import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState, useCallback, lazy, Suspense } from "react";
import {
    Box,
    CircularProgress,
    Typography,
    IconButton,
    Button,
    Avatar,
    Chip,
    Tooltip,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
} from "@mui/material";
import toast from "react-hot-toast";

// Icons
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CodeIcon from "@mui/icons-material/Code";
import BrushIcon from "@mui/icons-material/Brush";
import QuizIcon from "@mui/icons-material/Quiz";
import WorkIcon from "@mui/icons-material/Work";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import EditNoteIcon from "@mui/icons-material/EditNote";
import CallEndIcon from "@mui/icons-material/CallEnd";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FlagIcon from "@mui/icons-material/Flag";
import ClosedCaptionIcon from '@mui/icons-material/ClosedCaption';

import useUser from "../../../../common/hooks/useUser";
import { callApi } from "../../../../common/utils/apiConnector.js";
import { METHOD } from "../../../../common/constants/api.js";
import { ROLES } from "../../../../common/constants/common.js";

import QuestionPanel from "./QuestionPanel";
import CodeEditorPanel from "./CodeEditorPanel";
import RoomReportModal from "./RoomReportModal";
const WhiteboardPanel = lazy(() => import("./WhiteboardPanel").then((m) => ({ default: m.WhiteboardPanel })));
import { CameraWidget } from "./CameraWidget";
import { JdCvPanel } from "./JdCvPanel";

import { useWebRTC } from "../../hooks/useWebRTC.js";
import { useInterviewSignalR } from "../../hooks/useInterviewSignalR.js";
import { useCodeSync, LANGUAGE_EXAMPLES } from "../../hooks/useCodeSync.js";
import { useWhiteboardSync } from "../../hooks/useWhiteboardSync.js";
import { useAudioRecorder } from "../../hooks/useAudioRecorder.js";
import { getBookingRequestDetail } from "../../services/bookingRequestApi.js";

// Analytics
import { trackRoomView, trackLeaveInterviewRoom } from "../../../../utils/analytics";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TIMER_SECONDS = 45 * 60; // 45 minutes
const MIN_SPLIT_PCT = 30;
const MAX_SPLIT_PCT = 70;
const MIN_VERTICAL_PCT = 15;
const MAX_VERTICAL_PCT = 85;

function formatSecondsToClock(totalSeconds) {
    const safeSeconds = Math.max(0, totalSeconds);
    const h = Math.floor(safeSeconds / 3600);
    const m = Math.floor((safeSeconds % 3600) / 60);
    const s = safeSeconds % 60;

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function parseServerDateToMs(value) {
    if (!value) return NaN;

    if (value instanceof Date) {
        return value.getTime();
    }

    const raw = String(value).trim();
    if (!raw) return NaN;

    // If backend omits timezone (e.g. "2026-04-12T09:00:00"), treat as UTC.
    const hasTimezone = /[zZ]$|[+-]\d{2}:\d{2}$/.test(raw);
    const normalized = hasTimezone ? raw : `${raw}Z`;

    return new Date(normalized).getTime();
}

function resolveRoomEndTime(room) {
    if (!room) return null;

    const directEndTime = room.endTime ?? room.endAt;
    if (directEndTime) {
        const parsed = parseServerDateToMs(directEndTime);
        if (!Number.isNaN(parsed)) return parsed;
    }

    if (!room.scheduledTime || !room.durationMinutes) {
        return null;
    }

    const scheduled = parseServerDateToMs(room.scheduledTime);
    if (Number.isNaN(scheduled)) {
        return null;
    }

    return scheduled + Number(room.durationMinutes) * 60 * 1000;
}

// ---------------------------------------------------------------------------
// InterviewRoomPage — Clean Orchestrator
// ---------------------------------------------------------------------------
function InterviewRoomPage() {
    const user = useUser();
    const { roomId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const isViewOnly = searchParams.get("viewOnly") === "true";

    // ── Gate ──────────────────────────────────────────────────────────────────
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [roomInfo, setRoomInfo] = useState(null);
    const [bookingDocLinks, setBookingDocLinks] = useState({
        jobDescriptionUrl: "",
        cvUrl: "",
    });

    const checkRoomStatus = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            const res = await callApi({ method: METHOD.GET, endpoint: `/interviewroom/${roomId}` });
            const roomPayload = res?.data;
            const room = roomPayload?.data ?? roomPayload ?? null;
            setRoomInfo(room);
            setLoading(false);
            try {
                trackRoomView(room?.id ?? roomId, { title: room?.title ?? room?.name, viewOnly: isViewOnly });
            } catch (err) {
                console.warn("trackRoomView failed", err);
            }
        } catch (err) {
            console.error("Failed to fetch room details:", err);
            setError("Failed to load interview room. You will be redirected.");
            setTimeout(() => navigate("/interview"), 3000);
        }
    }, [roomId, navigate, user]);

    useEffect(() => {
        if (user) checkRoomStatus();
    }, [user, checkRoomStatus]);

    useEffect(() => {
        const bookingRequestId = roomInfo?.bookingRequestId;
        if (!bookingRequestId) {
            setBookingDocLinks({ jobDescriptionUrl: "", cvUrl: "" });
            return;
        }

        let cancelled = false;

        const loadBookingLinks = async () => {
            try {
                const result = await getBookingRequestDetail(bookingRequestId);
                const payload = result?.data ?? result ?? {};
                if (!cancelled) {
                    setBookingDocLinks({
                        jobDescriptionUrl: payload?.jobDescriptionUrl ?? "",
                        cvUrl: payload?.cvUrl ?? "",
                    });
                }
            } catch (err) {
                console.error("Failed to load booking request links:", err);
                if (!cancelled) {
                    setBookingDocLinks({ jobDescriptionUrl: "", cvUrl: "" });
                }
            }
        };

        loadBookingLinks();

        return () => {
            cancelled = true;
        };
    }, [roomInfo?.bookingRequestId]);

    // ── Video refs ───────────────────────────────────────────────────────────
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const fullLocalVideoRef = useRef(null);
    const fullRemoteVideoRef = useRef(null);

    // ── Callback bag ─────────────────────────────────────────────────────────
    const callbacks = useRef({});

    // ── SignalR ──────────────────────────────────────────────────────────────
    const { connectionId, peers, sendSignal, leaveRoom } = useInterviewSignalR({
        roomId: loading || error || isViewOnly ? null : roomId,
        userId: user?.id,
        role: user?.role,
        userName: user?.fullName,
        callbacks,
    });

    // ── Code sync ────────────────────────────────────────────────────────────
    const {
        editorRef,
        language,
        roomLanguageCodeMap,
        isRunning,
        setIsRunning,
        consoleOutput,
        setConsoleOutput,
        testResults,
        setTestResults,
        handleCodeChange,
        handleLanguageChange,
        handleEditorMount,
        formatCode,
        runCode,
        applyExternalCode,
        applyExternalLanguage,
        initFromRoomState,
    } = useCodeSync({ sendSignal, roomId, user });

    // ── Whiteboard sync ─────────────────────────────────────────────────────
    const {
        excalidrawAPIRef,
        handleWhiteboardChange,
        applyExternalWhiteboardState,
        initFromWhiteboardState,
        flushWhiteboardState,
    } = useWhiteboardSync({ sendSignal, roomId });

    // ── WebRTC ───────────────────────────────────────────────────────────────
    const {
        localStream,
        remoteStream,
        isCameraOn,
        isMicOn,
        isLocalSpeaking,
        isRemoteSpeaking,
        toggleCam,
        toggleMic,
        initiatePeerConnection,
        closePeerConnection,
        handleOffer,
        handleAnswer,
        handleIceCandidate,
    } = useWebRTC({ signalingSender: sendSignal, selfId: connectionId });

    // ── Audio Mixing Logic (Interviewer only) ──────────────────────────────────
    const [mixedStream, setMixedStream] = useState(null);
    const audioContextRef = useRef(null);

    useEffect(() => {
        if (user?.role !== ROLES.INTERVIEWER || !localStream) {
            setMixedStream(null);
            return;
        }

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            audioContextRef.current = ctx;

            const dest = ctx.createMediaStreamDestination();

            const localSource = ctx.createMediaStreamSource(localStream);
            localSource.connect(dest);

            let remoteSource = null;
            if (remoteStream && remoteStream.getAudioTracks().length > 0) {
                remoteSource = ctx.createMediaStreamSource(remoteStream);
                remoteSource.connect(dest);
            }

            setMixedStream(dest.stream);

            return () => {
                if (ctx.state !== "closed") {
                    ctx.close();
                }
            };
        } catch (err) {
            console.error("Failed to initialize audio mixing:", err);
        }
    }, [user?.role, localStream, remoteStream]);

    // ── Audio Recording & Transcription ────────────────────────────────────────
    const [isTranscriptionEnabled, setIsTranscriptionEnabled] = useState(false);
    
    // Broadcast transcript to others in room
    const handleTranscriptUpdate = useCallback((final, interim) => {
        sendSignal("SendTranscript", roomId, final, interim).catch(e => console.warn("SendTranscript failed", e));
    }, [sendSignal, roomId]);

    const { transcript, interimTranscript, setTranscript, isTranscribing } = useAudioRecorder({
        roomId,
        isEnabled: !loading && !error && !isViewOnly && user?.role === ROLES.INTERVIEWER,
        isMicOn,
        chunkIntervalMs: 15000,
        audioStream: mixedStream,
        isTranscriptionEnabled: true, // Always transcribing internally to stay in sync
        onTranscriptUpdate: handleTranscriptUpdate,
        user: user
    });

    // Sync full camera view video srcObject via useEffect (not ref callbacks).
    // useCallback ref callbacks cause flicker: when the stream dependency changes,
    // React calls the OLD callback with null (detaches srcObject) then the NEW
    // callback with the element (reattaches). Using useEffect + plain refs avoids
    // this unmount/remount cycle entirely.
    useEffect(() => {
        if (fullRemoteVideoRef.current) {
            fullRemoteVideoRef.current.srcObject = remoteStream ?? null;
            if (remoteStream) {
                fullRemoteVideoRef.current.play().catch((e) => {
                    if (e.name !== "NotAllowedError") console.warn("[Video] Full remote play error:", e);
                });
            }
        }
    }, [remoteStream]);
    useEffect(() => {
        if (fullLocalVideoRef.current) {
            fullLocalVideoRef.current.srcObject = localStream ?? null;
        }
    }, [localStream]);

    // ── Remote peer media state ──────────────────────────────────────────────
    const [remoteCameraOn, setRemoteCameraOn] = useState(false);
    const [remoteMicOn, setRemoteMicOn] = useState(false);
    const [remoteTranscript, setRemoteTranscript] = useState({ final: "", interim: "" });

    // ── Problem / test-case state (Interviewer editing) ──────────────────────
    const [problemDescription, setProblemDescription] = useState("");
    const [problemShortName, setProblemShortName] = useState("");
    const [testCases, setTestCases] = useState([]);
    const [receivedProblem, setReceivedProblem] = useState(null);
    const [activeTestCaseTab, setActiveTestCaseTab] = useState(0);
    const [isEditingProblem, setIsEditingProblem] = useState(false);
    const [problemTab, setProblemTab] = useState(0);

    const problemData =
        user?.role === ROLES.INTERVIEWER
            ? (problemDescription && problemDescription !== "<p><br></p>") ||
              (problemShortName && problemShortName.trim() !== "")
                ? { description: problemDescription, shortName: problemShortName, testCases }
                : null
            : receivedProblem;

    const sendProblem = useCallback(() => {
        sendSignal("SendProblem", roomId, problemDescription, problemShortName, testCases)
            .then(() => setIsEditingProblem(false))
            .catch(console.error);
    }, [sendSignal, roomId, problemDescription, problemShortName, testCases]);

    // In view-only mode we don't join SignalR, so hydrate workspace directly from API room payload.
    useEffect(() => {
        if (!roomInfo) return;

        initFromRoomState(roomInfo);

        const description = roomInfo?.problemDescription ?? "";
        const shortName = roomInfo?.problemShortName ?? "";
        const persistedTestCases = Array.isArray(roomInfo?.testCases) ? roomInfo.testCases : [];

        setProblemDescription(description);
        setProblemShortName(shortName);
        setTestCases(persistedTestCases);
        setReceivedProblem({
            description,
            shortName,
            testCases: persistedTestCases,
        });
    }, [roomInfo, initFromRoomState]);

    // Test-case helpers
    const handleTestCaseInputChange = (tcIdx, inIdx, field, fieldVal) => {
        setTestCases((prev) => {
            const next = JSON.parse(JSON.stringify(prev));
            next[tcIdx].inputs[inIdx][field] = fieldVal;
            return next;
        });
    };
    const handleTestCaseOutputChange = (tcIdx, outIdx, fieldVal) => {
        setTestCases((prev) => {
            const next = JSON.parse(JSON.stringify(prev));
            next[tcIdx].expectedOutputs[outIdx] = fieldVal;
            return next;
        });
    };
    const addInputToTestCase = (tcIdx) => {
        setTestCases((prev) => {
            const next = JSON.parse(JSON.stringify(prev));
            next[tcIdx].inputs.push({ name: "", value: "" });
            return next;
        });
    };
    const removeInputFromTestCase = (tcIdx, inIdx) => {
        setTestCases((prev) => {
            const next = JSON.parse(JSON.stringify(prev));
            if (next[tcIdx].inputs.length > 1) next[tcIdx].inputs.splice(inIdx, 1);
            return next;
        });
    };
    const addTestCase = () => {
        setTestCases((prev) => {
            const next = [...prev, { inputs: [{ name: "", value: "" }], expectedOutputs: [""] }];
            setActiveTestCaseTab(next.length - 1);
            return next;
        });
    };
    const removeTestCase = (idx) => {
        setTestCases((prev) => {
            const next = prev.filter((_, i) => i !== idx);
            setActiveTestCaseTab((t) => Math.max(0, t >= idx ? t - 1 : t));
            return next;
        });
    };
    const addExpectedOutput = (tcIdx) => {
        setTestCases((prev) => {
            const next = JSON.parse(JSON.stringify(prev));
            next[tcIdx].expectedOutputs.push("");
            return next;
        });
    };
    const removeExpectedOutput = (tcIdx, outIdx) => {
        setTestCases((prev) => {
            const next = JSON.parse(JSON.stringify(prev));
            if (next[tcIdx].expectedOutputs.length > 1) next[tcIdx].expectedOutputs.splice(outIdx, 1);
            return next;
        });
    };

    // ── Wire callbacks bag ──────────────────────────────────────────────────
    callbacks.current = {
        onOffer: handleOffer,
        onAnswer: handleAnswer,
        onIce: handleIceCandidate,
        onPeerJoin: initiatePeerConnection,
        onPeerLeave: () => {
            closePeerConnection();
            setRemoteCameraOn(false);
            setRemoteMicOn(false);
            setRemoteTranscript({ final: "", interim: "" });
        },
        onReceiveCode: applyExternalCode,
        onReceiveLanguage: applyExternalLanguage,
        onReceiveFullState: (state) => {
            initFromRoomState(state);
            initFromWhiteboardState(state?.whiteboardElements);
            if (state) {
                setProblemDescription(state.problemDescription ?? "");
                setProblemShortName(state.problemShortName ?? "");
                setTestCases(state.testCases ?? []);
                setReceivedProblem({
                    description: state.problemDescription,
                    shortName: state.problemShortName,
                    testCases: state.testCases ?? [],
                });
                if (state.peerCameraStates) {
                    const remoteEntries = Object.entries(state.peerCameraStates).filter(([id]) => id !== connectionId);
                    if (remoteEntries.length > 0) setRemoteCameraOn(remoteEntries[0][1]);
                }
                if (state.peerMicStates) {
                    const remoteEntries = Object.entries(state.peerMicStates).filter(([id]) => id !== connectionId);
                    if (remoteEntries.length > 0) setRemoteMicOn(remoteEntries[0][1]);
                }
            }
        },
        onReceiveProblem: (description, shortName, tcs) => {
            setReceivedProblem({ description, shortName, testCases: tcs });
            setProblemDescription(description);
            setProblemShortName(shortName);
            setTestCases(tcs);
        },
        onReceiveExecutionResult: (result) => {
            setConsoleOutput(result);
            setIsRunning(false);
        },
        onReceiveTestResults: (results) => {
            setTestResults(results);
            setIsRunning(false);
        },
        onReceiveCameraState: (_fromId, isOn) => setRemoteCameraOn(isOn),
        onReceiveMicState: (_fromId, isOn) => setRemoteMicOn(isOn),
        onReceiveWhiteboardState: applyExternalWhiteboardState,
        onReceiveTranscript: (_fromId, final, interim) => {
            setRemoteTranscript({ final, interim });
        }
    };

    // ── Wire video streams ──────────────────────────────────────────────────
    useEffect(() => {
        if (localVideoRef.current) localVideoRef.current.srcObject = localStream ?? null;
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream ?? null;
            if (remoteStream) {
                remoteVideoRef.current.play().catch((e) => {
                    // NotAllowedError is expected before user gesture — autoPlay
                    // attribute will resume once the user interacts with the page.
                    if (e.name !== "NotAllowedError") {
                        console.warn("[Video] Remote play error:", e);
                    }
                });
            }
        }
    }, [remoteStream]);

    // Broadcast camera/mic state
    useEffect(() => {
        if (!connectionId || !roomId) return;
        sendSignal("SendCameraState", roomId, isCameraOn).catch?.(() => {});
    }, [isCameraOn, connectionId, roomId, sendSignal]);

    useEffect(() => {
        if (!connectionId || !roomId) return;
        sendSignal("SendMicState", roomId, isMicOn).catch?.(() => {});
    }, [isMicOn, connectionId, roomId, sendSignal]);

    // ── Leave room ──────────────────────────────────────────────────────────
    const handleLeaveRoom = useCallback(() => {
        leaveRoom();
        try {
            trackLeaveInterviewRoom(roomId);
        } catch (err) {
            console.warn("trackLeaveInterviewRoom failed", err);
        }
        navigate("/interview");
    }, [leaveRoom, navigate]);

    // Ensure we emit leave event on unmount/navigation
    useEffect(() => {
        return () => {
            try {
                trackLeaveInterviewRoom(roomId);
            } catch (err) {}
        };
    }, [roomId]);

    // ── Panel visibility ────────────────────────────────────────────────────
    const [showPanelA, setShowPanelA] = useState(true);
    const [showPanelC, setShowPanelC] = useState(true);
    const [showPanelD, setShowPanelD] = useState(true);
    const [panelATab, setPanelATab] = useState("editor"); // 'editor' | 'whiteboard'

    const isFullCameraView = !showPanelA && !showPanelC && !showPanelD;

    // Full camera view video srcObject sync handled by useEffects above

    // ── Horizontal split (Panel A / Panel B) ────────────────────────────────
    const [splitPct, setSplitPct] = useState(65);
    const containerRef = useRef(null);
    const panelARef = useRef(null);
    const panelBRef = useRef(null);

    // Store last width before hiding for animation restore
    const lastSplitRef = useRef(65);

    // ── Vertical split inside Panel B (Panel C / Panel D) ───────────────────
    const [verticalSplitPct, setVerticalSplitPct] = useState(50);

    // ── Notes window ─────────────────────────────────────────────────────────
    const [notesOpen, setNotesOpen] = useState(false);
    const [noteText, setNoteText] = useState("");
    const [notesPos, setNotesPos] = useState({ x: 80, y: 80 });

    // ── Transcript window ────────────────────────────────────────────────────
    const [transcriptPos, setTranscriptPos] = useState({ x: window.innerWidth / 2 - 300, y: window.innerHeight - 250 });

    // ── Report room modal ──────────────────────────────────────────────────────
    const [reportModalOpen, setReportModalOpen] = useState(false);

    // ── Timer ────────────────────────────────────────────────────────────────
    const notifiedThresholdsRef = useRef({ tenMinutes: false, fiveMinutes: false, timeUp: false });
    const [displayTime, setDisplayTime] = useState("00:00");
    const [remainingSeconds, setRemainingSeconds] = useState(TIMER_SECONDS);

    useEffect(() => {
        notifiedThresholdsRef.current = { tenMinutes: false, fiveMinutes: false, timeUp: false };
    }, [roomId, roomInfo?.scheduledTime, roomInfo?.durationMinutes, roomInfo?.endTime, roomInfo?.endAt]);

    useEffect(() => {
        const endTimeMs = resolveRoomEndTime(roomInfo);
        if (!endTimeMs) {
            const fallback = formatSecondsToClock(TIMER_SECONDS);
            setDisplayTime(fallback);
            setRemainingSeconds(TIMER_SECONDS);
            return;
        }

        const tick = () => {
            const remainingSeconds = Math.max(0, Math.floor((endTimeMs - Date.now()) / 1000));
            setRemainingSeconds(remainingSeconds);
            setDisplayTime(formatSecondsToClock(remainingSeconds));

            if (isViewOnly) return;

            if (remainingSeconds <= 600 && !notifiedThresholdsRef.current.tenMinutes) {
                toast("10 minutes left in this interview", { id: `room-time-10-${roomId}` });
                notifiedThresholdsRef.current.tenMinutes = true;
            }

            if (remainingSeconds <= 300 && !notifiedThresholdsRef.current.fiveMinutes) {
                toast("5 minutes left in this interview", { id: `room-time-5-${roomId}` });
                notifiedThresholdsRef.current.fiveMinutes = true;
            }

            if (remainingSeconds <= 0 && !notifiedThresholdsRef.current.timeUp) {
                toast("Room reached end time", { id: `room-time-up-${roomId}` });
                notifiedThresholdsRef.current.timeUp = true;
            }
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [roomInfo, roomId, isViewOnly]);

    // ── Peer info for camera widget ──────────────────────────────────────────
    const isCandidate = user?.role === ROLES.CANDIDATE;
    const remotePeerName = roomInfo
        ? isCandidate
            ? roomInfo.coachName || "Coach"
            : roomInfo.candidateName || "Candidate"
        : "Peer";
    const localRoleNameInRoom = isCandidate ? roomInfo?.candidateName : roomInfo?.coachName;
    const localPeerName =
        user?.name || user?.firstName || user?.userName || user?.displayName || localRoleNameInRoom || "You";
    const localAvatar = user?.profilePicture || user?.avatarUrl || user?.imagePath || user?.avatar;
    // Remote avatar fetching is done inside VideoPanel logic - we'll pass null and let CameraWidget handle it
    const remoteAvatar = roomInfo
        ? isCandidate
            ? roomInfo.coachAvatar ||
              roomInfo.coachProfilePicture ||
              roomInfo.coach?.profilePicture ||
              roomInfo.coach?.avatarUrl ||
              roomInfo.coach?.avatar ||
              roomInfo.interviewer?.profilePicture ||
              roomInfo.interviewer?.avatar ||
              roomInfo.interviewer?.avatarUrl ||
              roomInfo.interviewerAvatar
            : roomInfo.candidateAvatar ||
              roomInfo.candidateProfilePicture ||
              roomInfo.candidate?.profilePicture ||
              roomInfo.candidate?.avatarUrl ||
              roomInfo.candidate?.avatar
        : null;

    // ── Horizontal resize drag ───────────────────────────────────────────────
    const hDragRef = useRef(null);

    const startHDrag = useCallback(
        (e) => {
            e.preventDefault();
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            hDragRef.current = { startX: e.clientX, startPct: splitPct, containerWidth: rect.width };

            const onMove = (me) => {
                if (!hDragRef.current) return;
                const deltaPct = ((me.clientX - hDragRef.current.startX) / hDragRef.current.containerWidth) * 100;
                const newPct = Math.max(MIN_SPLIT_PCT, Math.min(MAX_SPLIT_PCT, hDragRef.current.startPct + deltaPct));
                setSplitPct(newPct);
                lastSplitRef.current = newPct;
            };
            const onUp = () => {
                hDragRef.current = null;
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
            };
            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
        },
        [splitPct],
    );

    // ── Vertical resize drag ─────────────────────────────────────────────────
    const vDragRef = useRef(null);

    const startVDrag = useCallback(
        (e) => {
            e.preventDefault();
            if (!panelBRef.current) return;
            const rect = panelBRef.current.getBoundingClientRect();
            vDragRef.current = { startY: e.clientY, startPct: verticalSplitPct, containerHeight: rect.height };

            const onMove = (me) => {
                if (!vDragRef.current) return;
                const deltaPct = ((me.clientY - vDragRef.current.startY) / vDragRef.current.containerHeight) * 100;
                const newPct = Math.max(
                    MIN_VERTICAL_PCT,
                    Math.min(MAX_VERTICAL_PCT, vDragRef.current.startPct + deltaPct),
                );
                setVerticalSplitPct(newPct);
            };
            const onUp = () => {
                vDragRef.current = null;
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
            };
            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
        },
        [verticalSplitPct],
    );

    // ── Notes drag ───────────────────────────────────────────────────────────
    const notesDragRef = useRef(null);

    const startNotesDrag = useCallback(
        (e) => {
            e.preventDefault();
            notesDragRef.current = { startX: e.clientX, startY: e.clientY, posX: notesPos.x, posY: notesPos.y };

            const onMove = (me) => {
                if (!notesDragRef.current) return;
                setNotesPos({
                    x: notesDragRef.current.posX + (me.clientX - notesDragRef.current.startX),
                    y: notesDragRef.current.posY + (me.clientY - notesDragRef.current.startY),
                });
            };
            const onUp = () => {
                notesDragRef.current = null;
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
            };
            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
        },
        [notesPos],
    );

    // ── Transcript drag ──────────────────────────────────────────────────────
    const transcriptDragRef = useRef(null);

    const startTranscriptDrag = useCallback(
        (e) => {
            e.preventDefault();
            transcriptDragRef.current = { startX: e.clientX, startY: e.clientY, posX: transcriptPos.x, posY: transcriptPos.y };

            const onMove = (me) => {
                if (!transcriptDragRef.current) return;
                setTranscriptPos({
                    x: transcriptDragRef.current.posX + (me.clientX - transcriptDragRef.current.startX),
                    y: transcriptDragRef.current.posY + (me.clientY - transcriptDragRef.current.startY),
                });
            };
            const onUp = () => {
                transcriptDragRef.current = null;
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
            };
            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
        },
        [transcriptPos],
    );

    // ── Compute effective widths for panels ──────────────────────────────────
    const panelAVisible = showPanelA;
    const panelBVisible = showPanelC || showPanelD;

    const getPanelAWidth = () => {
        if (!panelAVisible && !panelBVisible) return "0%";
        if (!panelAVisible) return "0%";
        if (!panelBVisible) return "100%";
        return `${splitPct}%`;
    };

    const getPanelBWidth = () => {
        if (!panelAVisible && !panelBVisible) return "0%";
        if (!panelBVisible) return "0%";
        if (!panelAVisible) return "100%";
        return `${100 - splitPct}%`;
    };

    // ── Gate render ──────────────────────────────────────────────────────────
    if (loading || error) {
        return (
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100vh",
                }}
            >
                {loading && !error}
                <Typography variant="h6" sx={{ mt: 2 }}>
                    {error ?? "Verifying interview status..."}
                </Typography>
            </Box>
        );
    }

    // ── Main render ──────────────────────────────────────────────────────────
    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", bgcolor: "#F0F4F8" }}>
            {/* ── Top Bar (Review Mode Only) ── */}
            {isViewOnly && (
                <Box
                    sx={{
                        bgcolor: "#0f172a",
                        color: "white",
                        px: 4,
                        py: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Chip
                            icon={<VisibilityIcon sx={{ fontSize: "1rem !important", color: "white !important" }} />}
                            label="VIEW ONLY MODE"
                            sx={{
                                bgcolor: "rgba(255,255,255,0.1)",
                                color: "white",
                                fontWeight: 800,
                                fontSize: "0.65rem",
                                border: "1px solid rgba(255,255,255,0.2)",
                            }}
                        />
                        <Typography variant="body2" fontWeight={600}>
                            Reviewing Solution: {roomInfo?.title || "Coding Session"}
                        </Typography>
                    </Stack>
                    <Box
                        sx={{ cursor: "pointer", opacity: 0.8, "&:hover": { opacity: 1 } }}
                        onClick={() => navigate(-1)}
                    >
                        <Typography variant="caption" fontWeight={700}>
                            CLOSE REVIEW ✕
                        </Typography>
                    </Box>
                </Box>
            )}

            {/* ═══ Header Bar ═══ */}
            <Box
                sx={{
                    height: 56,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    px: 2,
                    bgcolor: "#FFFFFF",
                    borderBottom: "1px solid #E5E7EB",
                }}
            >
                {/* Left: Timer */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <AccessTimeIcon sx={{ fontSize: 20, color: "#6B7280" }} />
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 700,
                            fontSize: "1.1rem",
                            color:
                                remainingSeconds <= 300
                                    ? "error.main"
                                    : remainingSeconds <= 600
                                      ? "warning.main"
                                      : "text.primary",
                            fontVariantNumeric: "tabular-nums",
                        }}
                    >
                        {displayTime}
                    </Typography>
                </Box>

                {/* Center: spacer */}
                <Box sx={{ flex: 1 }} />

                {/* Right: Panel toggles */}
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Tooltip title="Report problem" placement="bottom">
                        <IconButton
                            onClick={() => setReportModalOpen(true)}
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: "8px",
                                bgcolor: "#F3F4F6",
                                color: "#6B7280",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                    bgcolor: "#E5E7EB",
                                    color: "#EF4444",
                                },
                            }}
                        >
                            <FlagIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Tooltip>
                    <HeaderToggle
                        id="header-toggle-editor"
                        icon={<CodeIcon sx={{ fontSize: 18 }} />}
                        label="Workspace"
                        active={showPanelA}
                        onClick={() => setShowPanelA((v) => !v)}
                    />
                    <HeaderToggle
                        id="header-toggle-problem"
                        icon={<QuizIcon sx={{ fontSize: 18 }} />}
                        label="Question"
                        active={showPanelC}
                        onClick={() => setShowPanelC((v) => !v)}
                    />
                    <HeaderToggle
                        id="header-toggle-evaluation"
                        icon={<WorkIcon sx={{ fontSize: 18 }} />}
                        label="JD / CV"
                        active={showPanelD}
                        onClick={() => setShowPanelD((v) => !v)}
                    />
                </Box>
            </Box>

            {/* ═══ Main Content Area ═══ */}

            {/* Full Camera View — always mounted, toggled via display */}
            <Box
                sx={{
                    flex: isFullCameraView ? 1 : 0,
                    display: isFullCameraView ? "flex" : "none",
                    position: "relative",
                    bgcolor: "#111827",
                    overflow: "hidden",
                    p: 2,
                }}
            >
                {/* Remote peer — padded with rounded border */}
                <Box
                    sx={{
                        flex: 1,
                        position: "relative",
                        borderRadius: "16px",
                        overflow: "hidden",
                        border: "2px solid #374151",
                        bgcolor: "#1F2937",
                    }}
                >
                    <video
                        ref={fullRemoteVideoRef}
                        autoPlay
                        playsInline
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    {!remoteCameraOn && (
                        <Box
                            sx={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: "#1F2937",
                            }}
                        >
                            <Avatar src={remoteAvatar} sx={{ width: 96, height: 96, fontSize: 40 }}>
                                {remotePeerName?.[0] || "?"}
                            </Avatar>
                        </Box>
                    )}
                    <Box
                        sx={{
                            position: "absolute",
                            bottom: 12,
                            left: 12,
                            bgcolor: "rgba(0,0,0,0.6)",
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 2,
                        }}
                    >
                        <Typography sx={{ color: "#FFF", fontWeight: 700, fontSize: "0.85rem" }}>
                            {remotePeerName || "Peer"}
                        </Typography>
                    </Box>
                </Box>
                {/* Local PiP — bottom-right corner */}
                <Box
                    sx={{
                        position: "absolute",
                        bottom: 24,
                        right: 24,
                        width: 200,
                        borderRadius: "12px",
                        overflow: "hidden",
                        aspectRatio: "16/9",
                        border: isLocalSpeaking ? "2px solid #A3E635" : "2px solid rgba(255,255,255,0.3)",
                        bgcolor: "#374151",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                    }}
                >
                    <video
                        ref={fullLocalVideoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: isCameraOn ? "block" : "none",
                        }}
                    />
                    {!isCameraOn && (
                        <Box
                            sx={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Avatar src={localAvatar} sx={{ width: 48, height: 48, fontSize: 20 }}>
                                {localPeerName?.[0] || "?"}
                            </Avatar>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Panel System — always mounted, toggled via display */}
            <Box
                ref={containerRef}
                sx={{
                    display: isFullCameraView ? "none" : "flex",
                    flex: isFullCameraView ? 0 : 1,
                    minHeight: 0,
                    overflow: "hidden",
                }}
            >
                {/* ── Panel A: Code Editor ── */}
                <Box
                    ref={panelARef}
                    sx={{
                        width: getPanelAWidth(),
                        minWidth: 0,
                        overflow: "hidden",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        transition: hDragRef.current ? "none" : "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                >
                    {panelAVisible && (
                        <>
                            {/* Tab bar: Editor / Whiteboard */}
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    height: 40,
                                    flexShrink: 0,
                                    borderBottom: "1px solid #E5E7EB",
                                    bgcolor: "#FFFFFF",
                                    px: 1,
                                    gap: 0.5,
                                }}
                            >
                                {[
                                    { key: "editor", label: "Editor", icon: <CodeIcon sx={{ fontSize: 16 }} /> },
                                    {
                                        key: "whiteboard",
                                        label: "Whiteboard",
                                        icon: <BrushIcon sx={{ fontSize: 16 }} />,
                                    },
                                ].map(({ key, label, icon }) => (
                                    <Button
                                        key={key}
                                        id={`panel-a-tab-${key}`}
                                        size="small"
                                        startIcon={icon}
                                        onClick={() => setPanelATab(key)}
                                        sx={{
                                            borderRadius: "8px",
                                            px: 1.5,
                                            py: 0.5,
                                            fontSize: "0.78rem",
                                            fontWeight: 600,
                                            textTransform: "none",
                                            bgcolor: panelATab === key ? "#F0F4F8" : "transparent",
                                            color: panelATab === key ? "#111827" : "#6B7280",
                                            "&:hover": { bgcolor: "#F3F4F6" },
                                        }}
                                    >
                                        {label}
                                    </Button>
                                ))}
                            </Box>

                            {/* Tab content */}
                            {panelATab === "editor" && (
                                <CodeEditorPanel
                                    language={language}
                                    handleLanguageChange={handleLanguageChange}
                                    code={roomLanguageCodeMap[language] || LANGUAGE_EXAMPLES[language]?.example || ""}
                                    handleCodeChange={handleCodeChange}
                                    formatCode={formatCode}
                                    runCode={runCode}
                                    isRunning={isRunning}
                                    consoleOutput={consoleOutput}
                                    setConsoleOutput={setConsoleOutput}
                                    testResults={testResults}
                                    setTestResults={setTestResults}
                                    user={user}
                                    languages={LANGUAGE_EXAMPLES}
                                    handleEditorMount={handleEditorMount}
                                    readOnly={isViewOnly}
                                />
                            )}
                            {panelATab === "whiteboard" && (
                                <Suspense
                                    fallback={
                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                flex: 1,
                                            }}
                                        >
                                            <CircularProgress />
                                        </Box>
                                    }
                                >
                                    <WhiteboardPanel
                                        excalidrawAPIRef={excalidrawAPIRef}
                                        onChange={handleWhiteboardChange}
                                        onPointerUp={flushWhiteboardState}
                                        readOnly={isViewOnly}
                                    />
                                </Suspense>
                            )}
                        </>
                    )}
                    {/* CameraWidget — always mounted, visibility controlled by CSS */}
                    <Box sx={{ display: panelAVisible ? "block" : "none" }}>
                        <CameraWidget
                            localVideoRef={localVideoRef}
                            remoteVideoRef={remoteVideoRef}
                            isCameraOn={isCameraOn}
                            isMicOn={isMicOn}
                            isLocalSpeaking={isLocalSpeaking}
                            isRemoteSpeaking={isRemoteSpeaking}
                            remoteCameraOn={remoteCameraOn}
                            remoteMicOn={remoteMicOn}
                            localPeerName={localPeerName}
                            remotePeerName={remotePeerName}
                            localAvatar={localAvatar}
                            remoteAvatar={remoteAvatar}
                            panelARef={panelARef}
                            isVisible={panelAVisible}
                            localStream={localStream}
                            remoteStream={remoteStream}
                        />
                    </Box>
                </Box>

                {/* Horizontal divider between Panel A and Panel B */}
                {panelAVisible && panelBVisible && (
                    <Box
                        onMouseDown={startHDrag}
                        sx={{
                            width: 6,
                            flexShrink: 0,
                            cursor: "col-resize",
                            bgcolor: "#E5E7EB",
                            userSelect: "none",
                            transition: "background 0.2s",
                            "&:hover": { bgcolor: "#A3E635" },
                        }}
                    />
                )}

                {/* ── Panel B: Support Info (Panel C + Panel D) ── */}
                <Box
                    ref={panelBRef}
                    sx={{
                        width: getPanelBWidth(),
                        minWidth: 0,
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        transition: hDragRef.current ? "none" : "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                >
                    {/* Panel C: Question Panel */}
                    <Box
                        sx={{
                            height: showPanelC ? (showPanelD ? `${verticalSplitPct}%` : "100%") : 0,
                            overflow: showPanelC ? "auto" : "hidden",
                            transition: vDragRef.current ? "none" : "height 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            p: showPanelC ? 1.5 : 0,
                        }}
                    >
                        {showPanelC && (
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
                        )}
                    </Box>

                    {/* Vertical divider between Panel C and Panel D */}
                    {showPanelC && showPanelD && (
                        <Box
                            onMouseDown={startVDrag}
                            sx={{
                                height: 6,
                                flexShrink: 0,
                                cursor: "row-resize",
                                bgcolor: "#E5E7EB",
                                userSelect: "none",
                                transition: "background 0.2s",
                                "&:hover": { bgcolor: "#A3E635" },
                            }}
                        />
                    )}

                    {/* Panel D: JD / CV / Evaluate */}
                    <Box
                        sx={{
                            height: showPanelD ? (showPanelC ? `${100 - verticalSplitPct}%` : "100%") : 0,
                            overflow: showPanelD ? "hidden" : "hidden",
                            transition: vDragRef.current ? "none" : "height 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                    >
                        {showPanelD && (
                            <JdCvPanel
                                roomId={roomId}
                                user={user}
                                jobDescriptionUrl={bookingDocLinks.jobDescriptionUrl}
                                cvUrl={bookingDocLinks.cvUrl}
                            />
                        )}
                    </Box>
                </Box>
            </Box>

            {/* ═══ Footer Bar ═══ */}
            <Box
                sx={{
                    height: 64,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    px: 2,
                    bgcolor: "#FFFFFF",
                    borderTop: "1px solid #E5E7EB",
                }}
            >
                {/* Left: empty */}
                <Box sx={{ flex: 1 }} />

                {/* Center: Media controls */}
                <Box sx={{ display: "flex", gap: 1.5 }}>
                    <FooterMediaButton
                        id="footer-btn-mic"
                        on={isMicOn}
                        onClick={toggleMic}
                        iconOn={<MicIcon />}
                        iconOff={<MicOffIcon />}
                        ariaLabel={isMicOn ? "Mute microphone" : "Unmute microphone"}
                    />
                    <FooterMediaButton
                        id="footer-btn-video"
                        on={isCameraOn}
                        onClick={toggleCam}
                        iconOn={<VideocamIcon />}
                        iconOff={<VideocamOffIcon />}
                        ariaLabel={isCameraOn ? "Turn off camera" : "Turn on camera"}
                    />

                    <FooterMediaButton
                        id="footer-btn-transcript"
                        on={isTranscriptionEnabled}
                        onClick={() => setIsTranscriptionEnabled((v) => !v)}
                        iconOn={<ClosedCaptionIcon />}
                        iconOff={<ClosedCaptionIcon />}
                        ariaLabel={isTranscriptionEnabled ? "Disable Transcript" : "Enable Transcript"}
                    />

                    <FooterNeutralButton
                        id="footer-btn-notes"
                        icon={<EditNoteIcon />}
                        ariaLabel="Quick notes"
                        onClick={() => setNotesOpen((v) => !v)}
                    />
                </Box>

                {/* Right: End Interview */}
                <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
                    <Button
                        id="footer-btn-end-interview"
                        onClick={handleLeaveRoom}
                        startIcon={<CallEndIcon />}
                        aria-label="Leave"
                        sx={{
                            bgcolor: "#E11D48",
                            color: "#FFFFFF",
                            borderRadius: "12px",
                            px: 3,
                            py: 1.25,
                            textTransform: "none",
                            fontWeight: 600,
                            transition: "all 0.15s ease",
                            "&:hover": { bgcolor: "#BE123C" },
                            "&:active": { transform: "scale(0.94)" },
                        }}
                    >
                        End Interview
                    </Button>
                </Box>
            </Box>

            {/* ═══ Sticky Notes Window ═══ */}
            {notesOpen && (
                <Box
                    id="notes-window"
                    role="dialog"
                    aria-label="Quick Notes"
                    sx={{
                        position: "fixed",
                        top: notesPos.y,
                        left: notesPos.x,
                        width: 280,
                        height: 320,
                        zIndex: 1000,
                        bgcolor: "#FFFDE7",
                        borderRadius: "12px",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                    }}
                >
                    {/* Drag handle header */}
                    <Box
                        id="notes-drag-handle"
                        onMouseDown={startNotesDrag}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            px: 1.5,
                            py: 1,
                            cursor: "grab",
                            userSelect: "none",
                            borderBottom: "1px solid #FFF9C4",
                            "&:active": { cursor: "grabbing" },
                        }}
                    >
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#5D4037" }}>
                            Quick Notes
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={() => setNotesOpen(false)}
                            aria-label="Close notes"
                            sx={{ color: "#8D6E63", p: 0.5 }}
                        >
                            <CloseIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Box>
                    {/* Textarea */}
                    <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add your private notes here..."
                        style={{
                            flex: 1,
                            border: "none",
                            background: "transparent",
                            resize: "none",
                            padding: 12,
                            outline: "none",
                            fontFamily: "inherit",
                            fontSize: 14,
                            lineHeight: 1.5,
                            color: "#3E2723",
                        }}
                    />
                </Box>
            )}

            {/* ═══ Draggable Transcript Overlay ═══ */}
            {isTranscriptionEnabled && (
                <Box
                    id="transcript-window"
                    sx={{
                        position: "fixed",
                        top: transcriptPos.y,
                        left: transcriptPos.x,
                        width: 500,
                        minHeight: 100,
                        zIndex: 1100,
                        bgcolor: "rgba(15, 23, 42, 0.9)",
                        color: "white",
                        borderRadius: "16px",
                        boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.1)",
                        backdropFilter: "blur(12px)",
                    }}
                >
                    {/* Drag Handle Header */}
                    <Box
                        onMouseDown={startTranscriptDrag}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            px: 2,
                            py: 1,
                            cursor: "grab",
                            userSelect: "none",
                            bgcolor: "rgba(0,0,0,0.3)",
                            borderBottom: "1px solid rgba(255,255,255,0.1)",
                            "&:active": { cursor: "grabbing" },
                        }}
                    >
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Box sx={{ 
                                width: 8, 
                                height: 8, 
                                borderRadius: "50%", 
                                bgcolor: isTranscribing ? "#A3E635" : "#EF4444",
                                boxShadow: isTranscribing ? "0 0 10px #A3E635" : "none",
                                animation: isTranscribing ? "pulse 2s infinite" : "none",
                                "@keyframes pulse": {
                                    "0%": { opacity: 1 },
                                    "50%": { opacity: 0.5 },
                                    "100%": { opacity: 1 }
                                }
                            }} />
                            <Typography variant="caption" sx={{ fontWeight: 800, color: "#D9F99D", textTransform: "uppercase", letterSpacing: 1 }}>
                                {isTranscribing ? "Live Transcript" : "Disconnected"}
                            </Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.5}>
                            <IconButton
                                size="small"
                                onClick={() => setTranscript("")}
                                title="Clear transcript"
                                sx={{ color: "rgba(255,255,255,0.4)", p: 0.5, "&:hover": { color: "#D9F99D" } }}
                            >
                                <EditNoteIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                            <IconButton
                                size="small"
                                onClick={() => setIsTranscriptionEnabled(false)}
                                sx={{ color: "rgba(255,255,255,0.4)", p: 0.5, "&:hover": { color: "#EF4444" } }}
                            >
                                <CloseIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Stack>
                    </Box>
                    {/* Transcript Content */}
                    <Box sx={{ p: 2, maxHeight: 200, overflowY: "auto", scrollBehavior: "smooth" }}>
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                lineHeight: 1.6,
                                fontStyle: (transcript || interimTranscript || remoteTranscript.final || remoteTranscript.interim) ? "normal" : "italic",
                                color: (transcript || interimTranscript || remoteTranscript.final || remoteTranscript.interim) ? "white" : "rgba(255,255,255,0.4)",
                                fontSize: "0.9rem",
                                whiteSpace: "pre-wrap"
                            }}
                        >
                            {/* Local side */}
                            {transcript}{" "}
                            <span style={{ color: "rgba(255,255,255,0.6)" }}>
                                {interimTranscript}
                            </span>

                            {/* Remote side synchronization fallback (if for some reason local mix is missing something) */}
                            {/* This is a visual merge of both people's transcripts if they are being sent via SignalR */}
                            {remoteTranscript.final && !transcript.includes(remoteTranscript.final) && (
                                <Box component="span" sx={{ display: 'block', mt: 1, color: '#D9F99D' }}>
                                    {remoteTranscript.final}
                                </Box>
                            )}
                            {remoteTranscript.interim && (
                                <Box component="span" sx={{ display: 'block', color: 'rgba(217, 249, 157, 0.6)' }}>
                                    {remoteTranscript.interim}
                                </Box>
                            )}

                            {!transcript && !interimTranscript && !remoteTranscript.final && !remoteTranscript.interim && (isTranscribing ? "Waiting for speech..." : "Connecting to Deepgram...")}
                        </Typography>
                    </Box>
                </Box>
            )}

            {/* ═══ Report Room Modal ═══ */}
            <RoomReportModal open={reportModalOpen} onClose={() => setReportModalOpen(false)} roomId={roomId} />
        </Box>
    );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function HeaderToggle({ id, icon, label, active, onClick }) {
    return (
        <Button
            id={id}
            onClick={onClick}
            startIcon={icon}
            size="small"
            aria-label={`Toggle ${label}`}
            sx={{
                bgcolor: active ? "#111827" : "#F3F4F6",
                color: active ? "#D9F99D" : "#6B7280",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.8rem",
                borderRadius: "8px",
                px: 2,
                py: 0.6,
                minWidth: "auto",
                border: active ? "1px solid #111827" : "1px solid #E5E7EB",
                transition: "all 0.2s ease",
                "&:hover": {
                    bgcolor: active ? "#1F2937" : "#E5E7EB",
                    color: active ? "#E1FB8C" : "#374151",
                    boxShadow: active ? "0 4px 12px rgba(163, 230, 53, 0.15)" : "none",
                },
                "& .MuiButton-startIcon": {
                    color: active ? "#D9F99D" : "#9CA3AF",
                },
            }}
        >
            {label}
        </Button>
    );
}

function FooterMediaButton({ id, on, onClick, iconOn, iconOff, ariaLabel }) {
    return (
        <IconButton
            id={id}
            onClick={onClick}
            aria-label={ariaLabel}
            sx={{
                width: 48,
                height: 48,
                borderRadius: "16px",
                bgcolor: "#111827",
                color: on ? "#D9F99D" : "#E11D48",
                transition: "all 0.15s ease",
                "&:hover": { bgcolor: "#1F2937", color: on ? "#E1FB8C" : "#FB7185" },
                "&:active": { transform: "scale(0.94)" },
            }}
        >
            {on ? iconOn : iconOff}
        </IconButton>
    );
}

function FooterNeutralButton({ id, icon, ariaLabel, onClick }) {
    return (
        <IconButton
            id={id}
            onClick={onClick}
            aria-label={ariaLabel}
            sx={{
                width: 48,
                height: 48,
                borderRadius: "16px",
                bgcolor: "#111827",
                color: "#D9F99D",
                transition: "all 0.15s ease",
                "&:hover": { bgcolor: "#1F2937", color: "#E1FB8C" },
                "&:active": { transform: "scale(0.94)" },
            }}
        >
            {icon}
        </IconButton>
    );
}

export default InterviewRoomPage;
