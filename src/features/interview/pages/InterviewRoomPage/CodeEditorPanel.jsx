import { Box, Button, CircularProgress, IconButton, MenuItem, Paper, Select, Stack, Tooltip, Typography } from "@mui/material";
import CodeIcon from "@mui/icons-material/Code";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ClearIcon from "@mui/icons-material/Clear";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import Editor from "@monaco-editor/react";
import { useEffect, useRef } from "react";
import { ROLES } from "../../../../common/constants/common.js";

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
}) {
    // Keep a stable ref to editor and its container to drive layout
    const editorRef = useRef(null);
    const editorContainerRef = useRef(null);

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
            {/* Toolbar */}
            <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{
                    px: 1,
                    py: 0.5,
                    borderBottom: "1px solid #ccc",
                    background: "#f9f9f9",
                    flexShrink: 0,
                }}
            >
                {user?.role === ROLES.CANDIDATE ? (
                    <Select
                        value={language}
                        onChange={handleLanguageChange}
                        size="small"
                        sx={{ minWidth: 120, ".MuiSelect-select": { py: 0.5 } }}
                    >
                        {Object.keys(languages).map((lang) => (
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
                {user?.role === ROLES.CANDIDATE && (
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
                            sx={{ textTransform: "none" }}
                        >
                            {isRunning ? "Running..." : "Run"}
                        </Button>
                    </>
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
                    height="100%" // sẽ fill tuyệt đối container
                    language={language}
                    value={code}
                    onMount={onEditorMount}
                    onChange={handleCodeChange}
                    options={{
                        readOnly: user?.role === ROLES.INTERVIEWER,
                        minimap: { enabled: false },
                        scrollbar: { vertical: "auto", horizontal: "auto" },
                        scrollBeyondLastLine: false,
                        fontSize: 14,
                    }}
                />
            </Box>

            {/* Console (co giãn – có thể đổi sang collapsible nếu muốn) */}
            <Box
                sx={{
                    flexBasis: { xs: 140, sm: 180, md: 220 }, // responsive base height
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 120,
                    borderTop: "1px solid #ccc",
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
