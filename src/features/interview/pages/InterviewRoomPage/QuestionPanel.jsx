import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import DOMPurify from "dompurify";
import { Box, Typography, Paper, TextField, Tabs, Tab, Stack, Button, Tooltip, IconButton } from "@mui/material";
import { ROLES } from "../../../../common/constants/common.js";
import { INTERVIEW_ROOM_STATUS } from "../../../../common/constants/status.js";

function QuestionPanel({
    user,
    roomStatus,
    problemData,
    isEditingProblem,
    setIsEditingProblem,
    problemShortName,
    setProblemShortName,
    problemDescription,
    setProblemDescription,
    testCases,
    setTestCases,
    sendProblem,
    problemTab,
    setProblemTab,
    activeTestCaseTab,
    setActiveTestCaseTab,
    addTestCase,
    handleTestCaseInputChange,
    handleTestCaseOutputChange,
    addInputToTestCase,
    removeInputFromTestCase,
    removeExpectedOutput,
    removeTestCase,
    addExpectedOutput,
}) {
    const quillModules = {
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ script: "sub" }, { script: "super" }], // Superscript and Subscript
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "code-block"],
            ["clean"],
        ],
    };

    return (
        <Box>
            {user?.role === ROLES.INTERVIEWER && roomStatus !== INTERVIEW_ROOM_STATUS.COMPLETED && (
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

            {isEditingProblem && user?.role === ROLES.INTERVIEWER && roomStatus !== INTERVIEW_ROOM_STATUS.COMPLETED ? (
                // EDITING VIEW (Role 1 only)
                <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                    <Typography variant="h6" gutterBottom>
                        Problem Setup
                    </Typography>
                    <TextField
                        label="Function Name (e.g., twoSum)"
                        value={problemShortName}
                        onChange={(e) => setProblemShortName(e.target.value)}
                        size="small"
                        variant="outlined"
                        sx={{ mb: 2 }}
                    />
                    <Box sx={{ height: 250, mb: 2, ".ql-container": { height: "calc(100% - 42px)" } }}>
                        <ReactQuill
                            theme="snow"
                            value={problemDescription}
                            onChange={setProblemDescription}
                            modules={quillModules}
                            style={{ height: "80%" }}
                        />
                    </Box>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                        Test Cases
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", borderBottom: 1, borderColor: "divider" }}>
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
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeTestCase(index);
                                                    }}
                                                >
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
                    <Box sx={{ pt: 2, flex: 1, overflowY: "auto" }}>
                        {testCases[activeTestCaseTab] && (
                            <Stack spacing={2}>
                                <Typography variant="subtitle2">Inputs</Typography>
                                {testCases[activeTestCaseTab].inputs.map((input, inputIndex) => (
                                    <Stack direction="row" spacing={1} key={inputIndex} alignItems="center">
                                        <TextField
                                            label="Name"
                                            size="small"
                                            value={input.name}
                                            onChange={(e) =>
                                                handleTestCaseInputChange(
                                                    activeTestCaseTab,
                                                    inputIndex,
                                                    "name",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <TextField
                                            label="Value"
                                            size="small"
                                            fullWidth
                                            value={input.value}
                                            onChange={(e) =>
                                                handleTestCaseInputChange(
                                                    activeTestCaseTab,
                                                    inputIndex,
                                                    "value",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <IconButton
                                            size="small"
                                            onClick={() => removeInputFromTestCase(activeTestCaseTab, inputIndex)}
                                            disabled={testCases[activeTestCaseTab].inputs.length <= 1}
                                        >
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    </Stack>
                                ))}
                                <Button
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={() => addInputToTestCase(activeTestCaseTab)}
                                >
                                    Add Input
                                </Button>

                                <Typography variant="subtitle2" sx={{ mt: 2 }}>
                                    Expected Outputs
                                </Typography>
                                {testCases[activeTestCaseTab].expectedOutputs.map((output, outputIndex) => (
                                    <Stack direction="row" spacing={1} key={outputIndex} alignItems="center">
                                        <TextField
                                            label={`Valid Answer #${outputIndex + 1}`}
                                            fullWidth
                                            value={output}
                                            onChange={(e) =>
                                                handleTestCaseOutputChange(
                                                    activeTestCaseTab,
                                                    outputIndex,
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <IconButton
                                            size="small"
                                            onClick={() => removeExpectedOutput(activeTestCaseTab, outputIndex)}
                                            disabled={testCases[activeTestCaseTab].expectedOutputs.length <= 1}
                                        >
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    </Stack>
                                ))}
                                <Button
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={() => addExpectedOutput(activeTestCaseTab)}
                                >
                                    Add Valid Answer
                                </Button>
                            </Stack>
                        )}
                    </Box>
                    <Button onClick={sendProblem} variant="contained" sx={{ mt: 2 }}>
                        Send Problem to Candidate
                    </Button>
                </Box>
            ) : (
                // DISPLAY VIEW (Both roles)
                <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                    <Tabs value={problemTab} onChange={(e, newValue) => setProblemTab(newValue)}>
                        <Tab label="Description" />
                        <Tab label="Test Cases" disabled={!problemData} />
                    </Tabs>
                    <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
                        {problemTab === 0 && (
                            <Box className="ql-snow">
                                <Box className="ql-editor" sx={{ p: 0, whiteSpace: "pre-wrap", fontFamily: "body" }}>
                                    {problemData ? (
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: DOMPurify.sanitize(problemData.description),
                                            }}
                                        />
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
                                        <Typography variant="subtitle2" gutterBottom>
                                            Test Case {index + 1}
                                        </Typography>
                                        {tc.inputs.map((input, inputIndex) => (
                                            <Box key={inputIndex} sx={{ mb: 1 }}>
                                                <Typography
                                                    variant="caption"
                                                    sx={{ color: "text.secondary", fontWeight: "bold" }}
                                                >
                                                    {input.name}
                                                </Typography>
                                                <Typography
                                                    sx={{
                                                        fontFamily: "monospace",
                                                        whiteSpace: "pre-wrap",
                                                        background: "#f5f5f5",
                                                        p: 1,
                                                        borderRadius: 1,
                                                    }}
                                                >
                                                    {input.value}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Paper>
                                ))}
                                <Paper elevation={2} sx={{ p: 2, mt: 2, background: "#e3f2fd" }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Expected Outputs
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                        The candidate's code output must match one of the valid answers provided by the
                                        interviewer.
                                    </Typography>
                                </Paper>
                            </Stack>
                        )}
                    </Box>
                </Box>
            )}
        </Box>
    );
}

export default QuestionPanel;
