import { useParams, useNavigate } from "react-router-dom";
import { BE_BASE_URL } from "../../../../common/constants/env";
import * as signalR from "@microsoft/signalr";
import { useEffect, useRef, useState } from "react";
import useUser from "../../../../common/hooks/useUser";
import Editor from "@monaco-editor/react";
import { Box, Select, MenuItem, Typography, Button, Stack, IconButton, Tooltip, CircularProgress, TextField, Paper, Tabs, Tab } from "@mui/material";
import CodeIcon from "@mui/icons-material/Code";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';


// Prettier and plugins
import prettier from "prettier/standalone";
import * as prettierPluginBabel from "prettier/plugins/babel";
import * as prettierPluginEstree from "prettier/plugins/estree";

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

const languages = {
    // python: {
    //     example: "print(\"Hello, World!\")",
    // },
    javascript: {
        example: "console.log(\"Hello, World!\");",
    },
    java: {
        example: "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n      System.out.println(\"Hello, World!\");\n  }\n}",
    },
    csharp: {
        example: "using System;\nusing System.Collections.Generic;\nusing System.Linq;\nusing System.Text.RegularExpressions;\n\nnamespace HelloWorld\n{\n\tpublic class Program\n\t{\n\t\tpublic static void Main(string[] args)\n\t\t{\n\t\t\tConsole.WriteLine(\"Hello, World!\");\n\t\t}\n\t}\n}",
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

const quillModules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'script': 'sub' }, { 'script': 'super' }], // Superscript and Subscript
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'code-block'],
        ['clean']
    ],
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
    const [myId, setMyId] = useState(null);
    const [peers, setPeers] = useState([]);
    const [language, setLanguage] = useState("java");
    const [code, setCode] = useState(languages.java.example);
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


    // --- Resizable layout state ---
    const containerRef = useRef(null);
    const [cols, setCols] = useState([25, 35, 40]); // left, middle, right in %
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

    useEffect(() => {
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
            conn.invoke("JoinRoom", roomId).then(() => {
                console.log("Re-joined room", roomId, "with new connection ID:", newId);
            }).catch(console.error);
        });

        conn.on("UserJoined", (connectionId) => {
            console.log("UserJoined", connectionId);
            setPeers((p) => {
                const selfId = conn.connectionId;
                if (!p.includes(connectionId) && connectionId !== selfId) return [...p, connectionId];
                return p;
            });
        });

        conn.on("UserLeft", (connectionId) => {
            setPeers((p) => p.filter((x) => x !== connectionId));
        });

        conn.on("ReceiveOffer", async (fromId, sdp) => {
            console.log("ReceiveOffer from", fromId);
            await createPeerConnection(fromId, false);
            await pcRef.current.setRemoteDescription({ type: "offer", sdp });
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            conn.invoke("SendAnswer", fromId, answer.sdp);
        });

        conn.on("ReceiveAnswer", async (fromId, sdp) => {
            console.log("ReceiveAnswer from", fromId);
            if (!pcRef.current) return;
            await pcRef.current.setRemoteDescription({ type: "answer", sdp });
        });

        conn.on("ReceiveIceCandidate", async (fromId, candidate) => {
            try {
                if (pcRef.current && candidate) {
                    await pcRef.current.addIceCandidate(JSON.parse(candidate));
                }
            } catch (e) {
                console.error("addIceCandidate error", e);
            }
        });

        conn.on("ReceiveCode", (newCode) => {
            if (editorRef.current && editorRef.current.getValue() !== newCode) {
                isExternalChange.current = true;
                const position = editorRef.current.getPosition();
                editorRef.current.setValue(newCode);
                if (position) {
                    editorRef.current.setPosition(position);
                }
                isExternalChange.current = false;
            }
        });

        conn.on("ReceiveLanguage", (lang, initialCode) => {
            setLanguage(lang);
            setCode(initialCode);
            if (editorRef.current) {
                isExternalChange.current = true;
                editorRef.current.setValue(initialCode);
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
        });

        conn.on("ReceiveTestResults", (results) => {
            setTestResults(results);
            setIsRunning(false);
        });

        return () => {
            if (connRef.current) {
                connRef.current.invoke("LeaveRoom", roomId).catch(() => {});
                connRef.current.stop();
            }
            if (pcRef.current) pcRef.current.close();
        };
    }, [roomId, user?.id, user?.role]);

    async function startLocalStream() {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideoRef.current.srcObject = stream;
        return stream;
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
            remoteVideoRef.current.srcObject = e.streams[0];
        };

        const localStream = await startLocalStream();
        localStream.getTracks().forEach((t) => pcRef.current.addTrack(t, localStream));

        if (isOfferer) {
            const offer = await pcRef.current.createOffer();
            await pcRef.current.setLocalDescription(offer);
            connRef.current.invoke("SendOffer", targetId, offer.sdp);
        }
    }

    const call = async (targetId) => {
        await createPeerConnection(targetId, true);
    };

    const leaveRoom = () => {
        if (connRef.current) {
            connRef.current.invoke("LeaveRoom", roomId).then(() => {
                navigate("/interview");
            }).catch(console.error);
        }
    };

    const handleCodeChange = (value) => {
        if (isExternalChange.current) {
            return;
        }
        setCode(value);
        if (user?.role !== 1 && connRef.current) {
            connRef.current.invoke("SendCode", roomId, value);
        }
    };

    const handleLanguageChange = (e) => {
        const newLang = e.target.value;
        setLanguage(newLang);
        const newCode = languages[newLang].example;
        setCode(newCode);

        if (editorRef.current) {
            editorRef.current.setValue(newCode);
        }

        if (connRef.current) {
            connRef.current.invoke("SendLanguage", roomId, newLang, newCode);
        }
    };

    const formatCode = async () => {
        if (!editorRef.current) return;
        editorRef.current.getAction('editor.action.formatDocument').run();
    };

    const runCode = () => {
        if (!connRef.current || !editorRef.current || isRunning) return;

        const currentCode = editorRef.current.getValue();
        setConsoleOutput(null);
        setTestResults(null);
        setIsRunning(true);
        connRef.current.invoke("RunCode", roomId, currentCode, language)
            .catch(err => {
                console.error("RunCode invocation failed: ", err);
                setConsoleOutput({
                    stdout: null,
                    stderr: `Error: Could not run code. ${err}`,
                    exception: null,
                    executionTime: 0
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
            connRef.current.invoke("SendProblem", roomId, problemDescription, problemShortName, testCases)
                .then(() => setIsEditingProblem(false))
                .catch(console.error);
        }
    };

    const handleEditorMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        monaco.languages.registerDocumentFormattingEditProvider('javascript', {
            async provideDocumentFormattingEdits(model) {
                const unformattedCode = model.getValue();
                try {
                    const formattedCode = await prettier.format(unformattedCode, {
                        parser: "babel",
                        plugins: [prettierPluginBabel, prettierPluginEstree],
                        tabWidth: 4,
                        useTabs: false,
                    });
                    return [{
                        range: model.getFullModelRange(),
                        text: formattedCode,
                    }];
                } catch (error) {
                    console.error("Prettier formatting failed:", error);
                    return [];
                }
            }
        });

        const cStyleFormatter = {
            provideDocumentFormattingEdits(model) {
                const code = model.getValue();
                let formatted = '';
                let indentLevel = 0;
                const indentUnit = '    ';
                let processedCode = code
                    .replace(/\s*{\s*/g, '\n{\n')
                    .replace(/\s*}\s*/g, '\n}\n')
                    .replace(/\s*;\s*/g, ';\n');
                const lines = processedCode.split('\n');
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine.length === 0) continue;
                    if (trimmedLine.startsWith('}')) {
                        indentLevel = Math.max(0, indentLevel - 1);
                    }
                    formatted += indentUnit.repeat(indentLevel) + trimmedLine + '\n';
                    if (trimmedLine.endsWith('{')) {
                        indentLevel++;
                    }
                }
                formatted = formatted.replace(/\n\s*\n/g, '\n');
                return [{
                    range: model.getFullModelRange(),
                    text: formatted.trim(),
                }];
            }
        };
        ['c', 'c++', 'java', 'csharp'].forEach(lang => monaco.languages.registerDocumentFormattingEditProvider(lang, cStyleFormatter));

        monaco.languages.registerDocumentFormattingEditProvider('python', {
            provideDocumentFormattingEdits(model) {
                const edits = [];
                for (let i = 1; i <= model.getLineCount(); i++) {
                    const line = model.getLineContent(i);
                    const newText = line.replace(/\t/g, '    ').trimEnd();
                    if (newText !== line) {
                        edits.push({
                            range: new monaco.Range(i, 1, i, line.length + 1),
                            text: newText
                        });
                    }
                }
                return edits;
            }
        });

        monaco.languages.registerDocumentFormattingEditProvider('lua', {
            provideDocumentFormattingEdits(model) {
                const edits = [];
                let indent = 0;
                const indentKeywords = ['function', 'if', 'for', 'while', 'repeat'];
                const dedentKeywords = ['end', 'until'];
                const middleKeywords = ['else', 'elseif'];

                for (let i = 1; i <= model.getLineCount(); i++) {
                    const line = model.getLineContent(i);
                    const trimmed = line.trim();
                    if (trimmed.length === 0) {
                        if (line.length > 0) edits.push({ range: new monaco.Range(i, 1, i, line.length + 1), text: '' });
                        continue;
                    }
                    const firstWord = trimmed.split(/\s+/)[0];
                    if (dedentKeywords.includes(firstWord) || middleKeywords.includes(firstWord)) {
                        if (indent > 0) indent--;
                    }
                    const correctIndent = '  '.repeat(indent);
                    const newText = correctIndent + trimmed;
                    if (newText !== line) {
                        edits.push({
                            range: new monaco.Range(i, 1, i, line.length + 1),
                            text: newText
                        });
                    }
                    const lastWord = trimmed.split(/\s+/).pop();
                    if (indentKeywords.includes(firstWord) || lastWord === 'do' || lastWord === 'then') {
                        indent++;
                    }
                }
                return edits;
            }
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

    const [problemTab, setProblemTab] = useState(0);

    // Determine which data to display.
    // If we have received a problem from the server, always prefer that for consistency.
    // Otherwise, the interviewer sees their local, unsent changes.
    const problemData = receivedProblem || (user?.role === 1 ? { description: problemDescription, shortName: problemShortName, testCases } : null);


    return (
        <Box style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
            <header
                style={{
                    padding: "10px 16px",
                    borderBottom: "1px solid #e5e7eb",
                    background: "#fafafa",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <div>
                    <strong>Interview Room:</strong> {roomId}
                </div>
                <button onClick={leaveRoom}>Leave Room</button>
            </header>

            <Box
                ref={containerRef}
                style={{
                    display: "flex",
                    flex: 1,
                    minHeight: 0,
                    overflow: "hidden",
                }}
            >
                <Box
                    sx={{
                        width: `${cols[0]}%`,
                        minWidth: 0,
                        overflow: "auto",
                        padding: 1.5,
                        borderRight: "1px solid #eee",
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    {user?.role === 1 && (
                        <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={isEditingProblem ? <VisibilityIcon /> : <EditIcon />}
                                onClick={() => setIsEditingProblem(!isEditingProblem)}
                            >
                                {isEditingProblem ? "View Problem" : "Edit Problem"}
                            </Button>
                        </Stack>
                    )}

                    {isEditingProblem && user?.role === 1 ? (
                        // EDITING VIEW (Role 1 only)
                        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                            <Typography variant="h6" gutterBottom>Problem Setup</Typography>
                            <TextField
                                label="Function Name (e.g., twoSum)"
                                value={problemShortName}
                                onChange={(e) => setProblemShortName(e.target.value)}
                                size="small"
                                variant="outlined"
                                sx={{ mb: 2 }}
                            />
                            <Box sx={{ height: 250, mb: 2, '.ql-container': { height: 'calc(100% - 42px)' } }}>
                                <ReactQuill
                                    theme="snow"
                                    value={problemDescription}
                                    onChange={setProblemDescription}
                                    modules={quillModules}
                                    style={{ height: '80%' }}
                                />
                            </Box>
                            <Typography variant="h6" sx={{ mb: 1 }}>Test Cases</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                                <Tabs
                                    value={activeTestCaseTab}
                                    onChange={(e, newValue) => setActiveTestCaseTab(newValue)}
                                    variant="scrollable"
                                    scrollButtons="auto"
                                >
                                    {testCases?.map((_, index) => (
                                        <Tab
                                            key={index}
                                            label={
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Typography variant="body2">Case {index + 1}</Typography>
                                                    {testCases.length > 1 && (
                                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); removeTestCase(index); }}>
                                                            <CloseIcon fontSize="small" />
                                                        </IconButton>
                                                    )}
                                                </Stack>
                                            }
                                        />
                                    ))}
                                </Tabs>
                                <Tooltip title="Add Test Case">
                                    <IconButton onClick={addTestCase} size="small">
                                        <AddIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                            <Box sx={{ pt: 2, flex: 1, overflowY: 'auto' }}>
                                {testCases[activeTestCaseTab] && (
                                    <Stack spacing={2}>
                                        <Typography variant="subtitle2">Inputs</Typography>
                                        {testCases[activeTestCaseTab].inputs.map((input, inputIndex) => (
                                            <Stack direction="row" spacing={1} key={inputIndex} alignItems="center">
                                                <TextField label="Name" size="small" value={input.name} onChange={(e) => handleTestCaseInputChange(activeTestCaseTab, inputIndex, 'name', e.target.value)} />
                                                <TextField label="Value" size="small" fullWidth value={input.value} onChange={(e) => handleTestCaseInputChange(activeTestCaseTab, inputIndex, 'value', e.target.value)} />
                                                <IconButton size="small" onClick={() => removeInputFromTestCase(activeTestCaseTab, inputIndex)} disabled={testCases[activeTestCaseTab].inputs.length <= 1}>
                                                    <CloseIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                        ))}
                                        <Button size="small" startIcon={<AddIcon />} onClick={() => addInputToTestCase(activeTestCaseTab)}>Add Input</Button>

                                        <Typography variant="subtitle2" sx={{ mt: 2 }}>Expected Outputs</Typography>
                                        {testCases[activeTestCaseTab].expectedOutputs.map((output, outputIndex) => (
                                            <Stack direction="row" spacing={1} key={outputIndex} alignItems="center">
                                                <TextField
                                                    label={`Valid Answer #${outputIndex + 1}`}
                                                    fullWidth
                                                    value={output}
                                                    onChange={(e) => handleTestCaseOutputChange(activeTestCaseTab, outputIndex, e.target.value)}
                                                />
                                                <IconButton size="small" onClick={() => removeExpectedOutput(activeTestCaseTab, outputIndex)} disabled={testCases[activeTestCaseTab].expectedOutputs.length <= 1}>
                                                    <CloseIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                        ))}
                                        <Button size="small" startIcon={<AddIcon />} onClick={() => addExpectedOutput(activeTestCaseTab)}>Add Valid Answer</Button>
                                    </Stack>
                                )}
                            </Box>
                            <Button onClick={sendProblem} variant="contained" sx={{ mt: 2 }}>Send Problem to Candidate</Button>
                        </Box>
                    ) : (
                        // DISPLAY VIEW (Both roles)
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                            <Tabs value={problemTab} onChange={(e, newValue) => setProblemTab(newValue)}>
                                <Tab label="Description" />
                                <Tab label="Test Cases" disabled={!problemData} />
                            </Tabs>
                            <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
                                {problemTab === 0 && (
                                    <Box className="ql-snow">
                                        <Box className="ql-editor" sx={{ p: 0, whiteSpace: 'pre-wrap', fontFamily: 'body' }}>
                                            {problemData ? (
                                                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(problemData.description) }} />
                                            ) : (
                                                "The problem description will appear here."
                                            )}
                                        </Box>
                                    </Box>
                                )}
                                {problemTab === 1 && problemData && (
                                    <Stack spacing={2}>
                                        {problemData?.testCases?.map((tc, index) => (
                                            <Paper key={index} elevation={2} sx={{ p: 2 }}>
                                                <Typography variant="subtitle2" gutterBottom>Test Case {index + 1}</Typography>
                                                {tc.inputs.map((input, inputIndex) => (
                                                    <Box key={inputIndex} sx={{ mb: 1 }}>
                                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>{input.name}</Typography>
                                                        <Typography sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', background: '#f5f5f5', p: 1, borderRadius: 1 }}>
                                                            {input.value}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Paper>
                                        ))}
                                        <Paper elevation={2} sx={{ p: 2, mt: 2, background: '#e3f2fd' }}>
                                            <Typography variant="subtitle2" gutterBottom>Expected Outputs</Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                The candidate's code output must match one of the valid answers provided by the interviewer.
                                            </Typography>
                                        </Paper>
                                    </Stack>
                                )}
                            </Box>
                        </Box>
                    )}
                </Box>

                <div style={resizerStyle} onMouseDown={(e) => startDrag(e, 0)} />

                <Box
                    sx={{
                        width: `${cols[1]}%`,
                        minWidth: 0,
                        padding: 1.5,
                        borderRight: "1px solid #eee",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, border: '1px solid #ccc', borderRadius: 1 }}>
                        {/* Toolbar */}
                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{ px: 1, py: 0.5, borderBottom: '1px solid #ccc', background: '#f9f9f9' }}
                        >
                            {user?.role === 0 ? (
                                <Select
                                    value={language}
                                    onChange={handleLanguageChange}
                                    size="small"
                                    sx={{ minWidth: 120, '.MuiSelect-select': { py: 0.5 } }}
                                >
                                    {Object.keys(languages).map(lang => (
                                        <MenuItem key={lang} value={lang}>
                                            {lang.charAt(0).toUpperCase() + lang.slice(1)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            ) : (
                                <Typography variant="subtitle2" sx={{ px: 1 }}>
                                    Language: <strong>{language.charAt(0).toUpperCase() + language.slice(1)}</strong>
                                </Typography>
                            )}
                            {user?.role === 0 && (
                                <>
                                    <Tooltip title="Format Code (Shift+Alt+F)">
                                        <IconButton onClick={formatCode} size="small">
                                            <CodeIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Box sx={{ flexGrow: 1 }} />
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        size="small"
                                        onClick={runCode}
                                        startIcon={isRunning ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
                                        disabled={isRunning}
                                        sx={{ textTransform: 'none' }}
                                    >
                                        {isRunning ? 'Running...' : 'Run'}
                                    </Button>
                                </>
                            )}
                        </Stack>

                        {/* Editor */}
                        <Box sx={{ flex: '1 1 60%', minHeight: 200, position: 'relative' }}>
                            <Editor
                                height="100%"
                                language={language}
                                value={code}
                                onMount={handleEditorMount}
                                onChange={handleCodeChange}
                                options={{
                                    readOnly: user?.role === 1,
                                    minimap: { enabled: false },
                                    scrollbar: { vertical: "auto", horizontal: "auto" },
                                    scrollBeyondLastLine: false,
                                    fontSize: 14,
                                }}
                            />
                        </Box>

                        {/* Console */}
                        <Box sx={{ flex: '1 1 40%', display: 'flex', flexDirection: 'column', minHeight: 100, borderTop: '1px solid #ccc' }}>
                            <Stack direction="row" alignItems="center" sx={{ p: '4px 8px', background: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Console</Typography>
                                {consoleOutput && (
                                    <Typography variant="caption" sx={{ ml: 2, color: 'text.secondary' }}>
                                        {consoleOutput.executionTime !== undefined && `Executed in ${consoleOutput.executionTime}ms`}
                                    </Typography>
                                )}
                                <Box sx={{ flexGrow: 1 }} />
                                <Tooltip title="Clear Console">
                                    <IconButton size="small" onClick={() => { setConsoleOutput(null); setTestResults(null); }} disabled={!consoleOutput && !testResults}>
                                        <ClearIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                            <Box sx={{
                                fontFamily: 'monospace',
                                p: 1,
                                backgroundColor: '#fdfdfd',
                                overflowY: 'auto',
                                whiteSpace: 'pre-wrap',
                                flex: 1,
                            }}>
                                {testResults ? (
                                    <Stack spacing={2}>
                                        {testResults.map((result, index) => (
                                            <Paper key={index} elevation={1} sx={{ p: 1.5, bgcolor: result.passed ? '#f0f9f0' : '#fef0f0' }}>
                                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                                    {result.passed ? (
                                                        <CheckCircleIcon color="success" fontSize="small" />
                                                    ) : (
                                                        <CancelIcon color="error" fontSize="small" />
                                                    )}
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                                        Test Case {result.testCaseIndex + 1}: {result.passed ? 'Passed' : 'Failed'}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary', ml: 'auto' }}>
                                                        {`Executed in ${result.executionTime}ms`}
                                                    </Typography>
                                                </Stack>
                                                <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>Input: {result.inputSummary}</Typography>
                                                <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>Expected: <Typography component="span" variant="caption" sx={{ fontFamily: 'monospace' }}>{result.expectedOutput.join(' OR ')}</Typography></Typography>
                                                <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>Got: <Typography component="span" variant="caption" sx={{ fontFamily: 'monospace', color: result.passed ? 'inherit' : 'error.main' }}>{result.actualOutput}</Typography></Typography>
                                            </Paper>
                                        ))}
                                    </Stack>
                                ) : !consoleOutput ? (
                                    <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                        Console output will appear here...
                                    </Typography>
                                ) : (
                                    <>
                                        {consoleOutput.stdout && (
                                            <Typography
                                                component="pre"
                                                variant="body2"
                                                sx={{ color: consoleOutput.stdout.includes("Compilation failed") ? 'red' : 'inherit', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
                                            >
                                                {consoleOutput.stdout}
                                            </Typography>
                                        )}
                                        {consoleOutput.stderr && (
                                            <Typography component="pre" variant="body2" sx={{ color: 'red', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                                {consoleOutput.stderr}
                                            </Typography>
                                        )}
                                        {consoleOutput.exception && (
                                            <Typography component="pre" variant="body2" sx={{ color: 'red', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                                {consoleOutput.exception}
                                            </Typography>
                                        )}
                                    </>
                                )}
                            </Box>
                        </Box>
                    </Box>
                </Box>

                <div style={resizerStyle} onMouseDown={(e) => startDrag(e, 1)} />

                <Box
                    sx={{
                        width: `${cols[2]}%`,
                        minWidth: 0,
                        overflow: "auto",
                        padding: 1.5,
                    }}
                >
                    <h3 style={{ marginTop: 0 }}>Info</h3>
                    <p>My id: {myId}</p>
                    <p>Peers: {peers.length}</p>

                    <h3 style={{ marginTop: 0 }}>Peers</h3>
                    <ul style={{ paddingLeft: 18 }}>
                        {peers.map((p) => (
                            <li key={p} style={{ marginBottom: 8 }}>
                                <code>{p}</code>
                                <button onClick={() => call(p)} style={{ marginLeft: 8 }}>
                                    Call
                                </button>
                            </li>
                        ))}
                    </ul>

                    <h3 style={{ marginTop: 0 }}>Video</h3>
                    <div>
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            style={{ width: "100%", borderRadius: 8, background: "#000" }}
                        />
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            style={{ width: "100%", borderRadius: 8, background: "#000" }}
                        />
                    </div>
                </Box>
            </Box>
        </Box>
    );
}

export default InterviewRoomPage;
