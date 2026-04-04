import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

import useUser from "../../../../common/hooks/useUser";
import { callApi } from "../../../../common/utils/apiConnector.js";
import { METHOD } from "../../../../common/constants/api.js";
import { INTERVIEW_ROOM_STATUS } from "../../../../common/constants/status.js";
import { ROLES } from "../../../../common/constants/common.js";
import { interviewEndPoints } from "../../services/interviewRoomApi";

import QuestionPanel from "./QuestionPanel";
import VideoPanel from "./VideoPanel";
import CodeEditorPanel from "./CodeEditorPanel";

import { useWebRTC } from "../../hooks/useWebRTC.js";
import { useInterviewSignalR } from "../../hooks/useInterviewSignalR.js";
import { useCodeSync, LANGUAGE_EXAMPLES } from "../../hooks/useCodeSync.js";
import { useAudioRecorder } from "../../hooks/useAudioRecorder.js";

// ---------------------------------------------------------------------------
// InterviewRoomPage — Clean Orchestrator
//
// This component owns:
//   • Room status gate (redirect if not ON_GOING / COMPLETED)
//   • Resizable 3-column layout
//   • Video element refs (wired to streams from useWebRTC)
//   • Problem / test-case editing state (Interviewer only)
//   • Callback-bag ref that bridges useInterviewSignalR ↔ useWebRTC / useCodeSync
//
// It does NOT contain any WebRTC, SignalR, or Monaco formatting logic.
// ---------------------------------------------------------------------------

function InterviewRoomPage() {
    const user = useUser();
    const { roomId } = useParams();
    const navigate = useNavigate();

    // --- State for Room Loading and Validation ---
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [roomInfo, setRoomInfo] = useState(null);

    /**
     * Callback: checkRoomStatus
     * Fetches room details and validates its status. Redirects if invalid.
     */
    const checkRoomStatus = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            const res = await callApi({ 
                method: METHOD.GET, 
                endpoint: interviewEndPoints.GET_ROOM_BY_ID(roomId) 
            });
            const room = res.data;
            if (room?.status !== INTERVIEW_ROOM_STATUS.ON_GOING && room?.status !== INTERVIEW_ROOM_STATUS.COMPLETED) {
                setError("This interview is not in progress. You will be redirected.");
                setTimeout(() => navigate("/interview"), 3000);
            } else {
                setRoomInfo(room);
                setLoading(false);
            }
        } catch (err) {
            console.error("Failed to fetch room details:", err);
            setError("Failed to load interview room. You will be redirected.");
            setTimeout(() => navigate("/interview"), 3000);
        }
    }, [roomId, navigate, user]);

    /**
     * Effect: Initial Room Status Check
     * Runs once on component mount to validate the interview room.
     */
    useEffect(() => {
        if (user) checkRoomStatus();
    }, [user, checkRoomStatus]);

    // --- Refs for Video Elements ---
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    // --- Callback Bag for SignalR ---
    // This ref holds callbacks that bridge SignalR events to WebRTC/CodeSync logic.
    // useInterviewSignalR reads callbacks.current when events fire (async),
    // so by the time any hub event arrives the bag is populated.
    const callbacks = useRef({});

    // --- useInterviewSignalR Hook ---
    // Manages the SignalR connection and peer signaling.
    // `sendSignal` is a stable callback (reads connRef inside the hook) so it is
    // safe to pass straight to useCodeSync / useWebRTC without wrapping.
    const { connectionId, peers, sendSignal, leaveRoom } = useInterviewSignalR({
        roomId: loading || error ? null : roomId,
        userId: user?.id,
        role: user?.role,
        userName: user?.fullName,
        callbacks,
    });

    // --- useCodeSync Hook ---
    // Manages code editor state, language changes, execution, and synchronization.
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

    // --- useWebRTC Hook ---
    // Manages WebRTC peer connections, local/remote media streams, and camera/mic controls.
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

    // --- useAudioRecorder Hook ---
    // Manages audio recording for transcription/analysis purposes.
    useAudioRecorder({
        roomId,
        isEnabled: !loading && !error && (user?.role === ROLES.INTERVIEWER || user?.role === ROLES.CANDIDATE),
        isMicOn,
        chunkIntervalMs: 15000
    });

    // --- State for Remote Peer Media Status ---
    const [remoteCameraOn, setRemoteCameraOn] = useState(false);
    const [remoteMicOn, setRemoteMicOn] = useState(false);

    /**
     * Callback Bag Wiring
     * This runs every render but is cheap (just ref assignment).
     * It ensures that SignalR events can trigger the correct WebRTC/CodeSync actions.
     */
    callbacks.current = {
        // WebRTC Callbacks
        onOffer: handleOffer,
        onAnswer: handleAnswer,
        onIce: handleIceCandidate,
        onPeerJoin: initiatePeerConnection,
        onPeerLeave: (peerId) => {
            closePeerConnection();
            setRemoteCameraOn(false);
            setRemoteMicOn(false);
        },
        // Code Sync Callbacks
        onReceiveCode: applyExternalCode,
        onReceiveLanguage: applyExternalLanguage,
        onReceiveFullState: (state) => {
            initFromRoomState(state);
            if (state) {
                setProblemDescription(state.problemDescription ?? "");
                setProblemShortName(state.problemShortName ?? "");
                setTestCases(
                    state.testCases?.length
                        ? state.testCases
                        : [{ inputs: [{ name: "", value: "" }], expectedOutputs: [""] }],
                );
                setReceivedProblem({
                    description: state.problemDescription,
                    shortName: state.problemShortName,
                    testCases: state.testCases,
                });
                // Hydrate remote peer media states from FullState
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
        onReceiveProblem: (description, shortName, testCases) => {
            setReceivedProblem({ description, shortName, testCases });
            setProblemDescription(description);
            setProblemShortName(shortName);
            setTestCases(testCases);
        },
        onReceiveExecutionResult: (result) => {
            setConsoleOutput(result);
            setIsRunning(false);
        },
        onReceiveTestResults: (results) => {
            setTestResults(results);
            setIsRunning(false);
        },
        // Remote Media State Callbacks
        onReceiveCameraState: (_fromId, isOn) => {
            setRemoteCameraOn(isOn);
        },
        onReceiveMicState: (_fromId, isOn) => {
            setRemoteMicOn(isOn);
        },
    };

    /**
     * Effect: Wire Local Video Stream
     * Connects the local WebRTC stream to the local video element.
     */
    useEffect(() => {
        if (localVideoRef.current) localVideoRef.current.srcObject = localStream ?? null;
    }, [localStream]);

    /**
     * Effect: Wire Remote Video Stream
     * Connects the remote WebRTC stream to the remote video element.
     */
    useEffect(() => {
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream ?? null;
            if (remoteStream) {
                remoteVideoRef.current.play().catch((e) => console.warn("[Video] Remote play blocked:", e));
            }
        }
    }, [remoteStream]);

    /**
     * Effect: Broadcast Local Camera State
     * Sends local camera status to other peers via SignalR.
     */
    useEffect(() => {
        if (!connectionId || !roomId) return;
        sendSignal("SendCameraState", roomId, isCameraOn).catch?.(() => {});
    }, [isCameraOn, connectionId, roomId, sendSignal]);

    /**
     * Effect: Broadcast Local Mic State
     * Sends local microphone status to other peers via SignalR.
     */
    useEffect(() => {
        if (!connectionId || !roomId) return;
        sendSignal("SendMicState", roomId, isMicOn).catch?.(() => {});
    }, [isMicOn, connectionId, roomId, sendSignal]);

    /**
     * Callback: handleLeaveRoom
     * Disconnects from the interview room and navigates away.
     */
    const handleLeaveRoom = useCallback(() => {
        leaveRoom();
        navigate("/interview");
    }, [leaveRoom, navigate]);

    // --- State for Problem Description and Test Cases (Interviewer editing) ---
    const [problemDescription, setProblemDescription] = useState("");
    const [problemShortName, setProblemShortName] = useState("");
    const [testCases, setTestCases] = useState([{ inputs: [{ name: "", value: "" }], expectedOutputs: [""] }]);
    const [receivedProblem, setReceivedProblem] = useState(null); // For Candidate view
    const [activeTestCaseTab, setActiveTestCaseTab] = useState(0);
    const [isEditingProblem, setIsEditingProblem] = useState(false);
    const [problemTab, setProblemTab] = useState(0);

    // Memoized problem data for rendering (Interviewer edits vs. Candidate view)
    const problemData =
        user?.role === ROLES.INTERVIEWER
            ? { description: problemDescription, shortName: problemShortName, testCases }
            : receivedProblem;

    /**
     * Callback: sendProblem
     * Sends problem description and test cases to other peers via SignalR.
     */
    const sendProblem = useCallback(() => {
        sendSignal("SendProblem", roomId, problemDescription, problemShortName, testCases)
            .then(() => setIsEditingProblem(false))
            .catch(console.error);
    }, [sendSignal, roomId, problemDescription, problemShortName, testCases]);

    // --- Test-case Helper Callbacks (pure state mutations) ---
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
        if (testCases.length <= 1) return;
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

    // --- Resizable Layout Logic ---
    const containerRef = useRef(null);
    const [cols, setCols] = useState([25, 35, 40]); // Initial column widths
    const [dragging, setDragging] = useState(null); // State for drag operation

    /**
     * Callback: startDrag
     * Initiates column resizing when a resizer handle is moused down.
     */
    const startDrag = (e, index) => {
        e.preventDefault();
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setDragging({ index, startX: e.clientX, startCols: [...cols], containerWidth: rect.width });
    };

    /**
     * Effect: Handle Column Dragging
     * Attaches/detaches mousemove/mouseup listeners for resizing columns.
     */
    useEffect(() => {
        if (!dragging) return;
        const MIN_COL = 10; // Minimum column width in percentage
        const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

        const onMove = (e) => {
            const deltaPct = ((e.clientX - dragging.startX) / dragging.containerWidth) * 100;
            const [l0, m0, r0] = dragging.startCols;
            if (dragging.index === 0) { // Dragging first resizer (between left and middle)
                const d = clamp(deltaPct, -(l0 - MIN_COL), m0 - MIN_COL);
                setCols([l0 + d, m0 - d, r0]);
            } else { // Dragging second resizer (between middle and right)
                const d = clamp(deltaPct, -(m0 - MIN_COL), r0 - MIN_COL);
                setCols([l0, m0 + d, r0 - d]);
            }
        };
        const onUp = () => setDragging(null); // End drag operation
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
        return () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
        };
    }, [dragging]); // Re-run effect only when dragging state changes

    const resizerStyle = { width: 6, cursor: "col-resize", background: "#e5e7eb", userSelect: "none" };

    // --- Conditional Render: Loading/Error State ---
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
                {loading && !error && <CircularProgress />}
                <Typography variant="h6" sx={{ mt: 2 }}>
                    {error ?? "Verifying interview status..."}
                </Typography>
            </Box>
        );
    }

    // --- Main Render: Interview Room Layout ---
    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
            <Box ref={containerRef} style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
                {/* Left Panel: Question Panel */}
                <Box
                    sx={{
                        width: `${cols[0]}%`,
                        minWidth: 0,
                        overflow: "auto",
                        padding: 1.5,
                        borderRight: "1px solid #eee",
                    }}
                >
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
                </Box>

                <div style={resizerStyle} onMouseDown={(e) => startDrag(e, 0)} />

                {/* Middle Panel: Code Editor Panel */}
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
                    />
                </Box>

                <div style={resizerStyle} onMouseDown={(e) => startDrag(e, 1)} />

                {/* Right Panel: Video Panel */}
                <Box sx={{ width: `${cols[2]}%`, minWidth: 0, overflow: "auto", padding: 1.5 }}>
                    <VideoPanel
                        myId={connectionId}
                        peers={peers}
                        onCall={initiatePeerConnection}
                        localVideoRef={localVideoRef}
                        remoteVideoRef={remoteVideoRef}
                        isCameraOn={isCameraOn}
                        isMicOn={isMicOn}
                        isLocalSpeaking={isLocalSpeaking}
                        isRemoteSpeaking={isRemoteSpeaking}
                        remoteCameraOn={remoteCameraOn}
                        remoteMicOn={remoteMicOn}
                        onToggleCamera={toggleCam}
                        onToggleMic={toggleMic}
                        onLeaveRoom={handleLeaveRoom}
                        user={user}
                        roomInfo={roomInfo}
                    />
                </Box>
            </Box>
        </Box>
    );
}

export default InterviewRoomPage;
