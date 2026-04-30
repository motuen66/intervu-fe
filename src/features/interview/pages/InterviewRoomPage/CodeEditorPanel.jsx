import { Box, CircularProgress, IconButton, MenuItem, Paper, Stack, Tooltip, Typography } from "@mui/material";
import { PrimaryButton } from "../../../../common/components/buttons";
import CodeIcon from "@mui/icons-material/Code";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ClearIcon from "@mui/icons-material/Clear";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import Editor from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import { ROLES } from "../../../../common/constants/common.js";
import FormSelect from "../../../../common/components/form/FormSelect";

function CodeEditorPanel({
    languages,
    language,
    handleLanguageChange,
    code,
    handleCodeChange,
    formatCode,
    runCode,
    isRunning,
    consoleOutput,
    setConsoleOutput,
    testResults,
    setTestResults,
    user,
    handleEditorMount,
    readOnly = false,
}) {
    // Keep a stable ref to editor and its container to drive layout
    const editorRef = useRef(null);
    const editorContainerRef = useRef(null);
    const [consoleHeight, setConsoleHeight] = useState(250);
    const isDragging = useRef(false);

    const startResizing = (e) => {
        e.preventDefault();
        isDragging.current = true;
        document.addEventListener("mousemove", handleResizing);
        document.addEventListener("mouseup", stopResizing);
    };

    const handleResizing = (e) => {
        if (!isDragging.current || !editorContainerRef.current) return;
        const containerRect = editorContainerRef.current.parentElement.getBoundingClientRect();
        const newHeight = containerRect.bottom - e.clientY;
        if (newHeight > 100 && newHeight < containerRect.height - 100) {
            setConsoleHeight(newHeight);
            editorRef.current?.layout();
        }
    };

    const stopResizing = () => {
        isDragging.current = false;
        document.removeEventListener("mousemove", handleResizing);
        document.removeEventListener("mouseup", stopResizing);
    };

    useEffect(() => {
        if (!editorContainerRef.current) return;

        const layout = () => {
            try {
                editorRef.current?.layout();
            } catch {}
        };

        // Layout on window resize
        window.addEventListener("resize", layout);

        // Layout when the container resizes (tabs, split panes, accordions, etc.)
        const ro = new ResizeObserver(layout);
        ro.observe(editorContainerRef.current);

        // Layout after first paint (fixes initial mount in hidden tabs)
        const id = setTimeout(layout, 0);

        return () => {
            window.removeEventListener("resize", layout);
            ro.disconnect();
            clearTimeout(id);
        };
    }, []);

    const onEditorMount = (editor, monaco) => {
        editorRef.current = editor;
        // Initial layout to avoid white overlay when parent size was 0 at mount
        editor.layout();

        // Pass through to parent if provided
        if (typeof handleEditorMount === "function") {
            handleEditorMount(editor, monaco);
        }
    };

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minHeight: 0,
                border: "1px solid #ccc",
                borderRadius: 1,
                backgroundColor: "background.paper",
                // đảm bảo panel chiếm hết chiều cao cha nếu cha dùng flex
                height: "100%",
            }}
        >
            <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{
                    px: 1.5,
                    py: 0.5,
                    borderBottom: "1px solid #E5E7EB",
                    background: "#F9FAFB",
                    flexShrink: 0,
                    justifyContent: "space-between",
                    minHeight: 40,
                }}
            >
                {user?.role === ROLES.CANDIDATE && !readOnly ? (
                    <FormSelect
                        value={language}
                        onChange={handleLanguageChange}
                        size="small"
                        sx={{ minWidth: 150, '.MuiOutlinedInput-notchedOutline': { border: 'none' }, '.MuiSelect-select': { py: 0.5, color: '#6B7280', fontWeight: 500, fontSize: '0.75rem' } }}
                    >
                        {Object.keys(languages).map((lang) => (
                            <MenuItem key={lang} value={lang}>
                                {lang === 'javascript' ? 'JavaScript (Node.js 18)' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                            </MenuItem>
                        ))}
                    </FormSelect>
                ) : (
                    <Typography variant="caption" sx={{ px: 1, color: '#6B7280', fontWeight: 600 }}>
                        {language === 'javascript' ? 'JavaScript (Node.js 18)' : language.charAt(0).toUpperCase() + language.slice(1)}
                    </Typography>
                )}
                {user?.role === ROLES.CANDIDATE && !readOnly && (
                    <PrimaryButton
                        onClick={runCode}
                        startIcon={isRunning ? <CircularProgress size={14} color="inherit" /> : <PlayArrowIcon sx={{ fontSize: 16 }} />}
                        disabled={isRunning}
                        sx={{ textTransform: "none", py: 0.5, px: 2, fontSize: "0.75rem", minHeight: 32 }}
                    >
                        {isRunning ? "Running..." : "Run Code"}
                    </PrimaryButton>
                )}
            </Stack>

            {/* Editor responsive */}
            <Box
                ref={editorContainerRef}
                sx={{
                    flex: 1, // chiếm toàn bộ phần còn lại trừ console
                    minHeight: 0, // cần để flex children không overflow
                    position: "relative",
                    "& .monaco-editor, & .monaco-editor .overflow-guard": {
                        position: "absolute",
                        inset: 0,
                    },
                }}
            >
                <Editor
                    key={language}
                    height="100%"
                    language={language}
                    theme="vs-dark"
                    value={code}
                    onMount={onEditorMount}
                    onChange={handleCodeChange}
                    options={{
                        readOnly: readOnly || user?.role === ROLES.INTERVIEWER,
                        minimap: { enabled: false },
                        scrollbar: { vertical: "auto", horizontal: "auto" },
                        scrollBeyondLastLine: false,
                        fontSize: 15,
                        fontFamily: "'Fira Code', 'JetBrains Mono', 'Courier New', monospace",
                        padding: { top: 16 }
                    }}
                />
            </Box>

            {/* Resizable Divider */}
            <Box
                onMouseDown={startResizing}
                sx={{
                    height: "4px",
                    width: "100%",
                    cursor: "row-resize",
                    background: "#E5E7EB",
                    "&:hover": { background: "#3B82F6" },
                    transition: "background 0.2s",
                    flexShrink: 0,
                    zIndex: 10
                }}
            />

            {/* Console */}
            <Box
                sx={{
                    height: `${consoleHeight}px`,
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 120,
                    background: "#fafafa",
                }}
            >
                <Stack
                    direction="row"
                    alignItems="center"
                    sx={{ p: "4px 8px", background: "#f5f5f5", borderBottom: "1px solid #e0e0e0" }}
                >
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                        Console
                    </Typography>
                    {consoleOutput && (
                        <Typography variant="caption" sx={{ ml: 2, color: "text.secondary" }}>
                            {consoleOutput.executionTime !== undefined &&
                                `Executed in ${consoleOutput.executionTime}ms`}
                        </Typography>
                    )}
                    <Box sx={{ flexGrow: 1 }} />
                    <Tooltip title="Clear Console">
                        <IconButton
                            size="small"
                            onClick={() => {
                                setConsoleOutput(null);
                                setTestResults(null);
                            }}
                            disabled={!consoleOutput && !testResults}
                        >
                            <ClearIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
                <Box
                    sx={{
                        fontFamily: "monospace",
                        p: 1,
                        backgroundColor: "#fdfdfd",
                        overflowY: "auto",
                        whiteSpace: "pre-wrap",
                        flex: 1,
                        minHeight: 0,
                    }}
                >
                    {testResults ? (
                        <Stack spacing={2}>
                            {testResults.map((result, index) => (
                                <Paper
                                    key={index}
                                    elevation={1}
                                    sx={{ p: 1.5, bgcolor: result.passed ? "#f0f9f0" : "#fef0f0" }}
                                >
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                        {result.passed ? (
                                            <CheckCircleIcon color="success" fontSize="small" />
                                        ) : (
                                            <CancelIcon color="error" fontSize="small" />
                                        )}
                                        <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                                            Test Case {result.testCaseIndex + 1}: {result.passed ? "Passed" : "Failed"}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: "text.secondary", ml: "auto" }}>
                                            {`Executed in ${result.executionTime}ms`}
                                        </Typography>
                                    </Stack>
                                    <Typography variant="caption" display="block" sx={{ color: "text.secondary" }}>
                                        Input: {result.inputSummary}
                                    </Typography>
                                    <Typography variant="caption" display="block" sx={{ color: "text.secondary" }}>
                                        Expected:{" "}
                                        <Typography component="span" variant="caption" sx={{ fontFamily: "monospace" }}>
                                            {result.expectedOutput.join(" OR ")}
                                        </Typography>
                                    </Typography>
                                    <Typography variant="caption" display="block" sx={{ color: "text.secondary" }}>
                                        Got:{" "}
                                        <Typography
                                            component="span"
                                            variant="caption"
                                            sx={{
                                                fontFamily: "monospace",
                                                color: result.passed ? "inherit" : "error.main",
                                            }}
                                        >
                                            {result.actualOutput}
                                        </Typography>
                                    </Typography>
                                </Paper>
                            ))}
                        </Stack>
                    ) : !consoleOutput ? (
                        <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic" }}>
                            Console output will appear here...
                        </Typography>
                    ) : (
                        <>
                            {consoleOutput.stdout && (
                                <Typography
                                    component="pre"
                                    variant="body2"
                                    sx={{
                                        color: consoleOutput.stdout.includes("Compilation failed") ? "red" : "inherit",
                                        whiteSpace: "pre-wrap",
                                        fontFamily: "monospace",
                                    }}
                                >
                                    {consoleOutput.stdout}
                                </Typography>
                            )}
                            {consoleOutput.stderr && (
                                <Typography
                                    component="pre"
                                    variant="body2"
                                    sx={{ color: "red", whiteSpace: "pre-wrap", fontFamily: "monospace" }}
                                >
                                    {consoleOutput.stderr}
                                </Typography>
                            )}
                            {consoleOutput.exception && (
                                <Typography
                                    component="pre"
                                    variant="body2"
                                    sx={{ color: "red", whiteSpace: "pre-wrap", fontFamily: "monospace" }}
                                >
                                    {consoleOutput.exception}
                                </Typography>
                            )}
                        </>
                    )}
                </Box>
            </Box>

        </Box>
    );
}

export default CodeEditorPanel;
