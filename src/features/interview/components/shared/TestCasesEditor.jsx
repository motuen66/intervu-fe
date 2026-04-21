import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import {
    Box,
    Button,
    IconButton,
    Stack,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";

/**
 * Shared, fully-controlled test-cases editor. The shape of a test case is:
 *   { inputs: [{ name, value }, ...], expectedOutputs: [string, ...] }
 *
 * This mirrors the JSON persisted on InterviewRoom.TestCases and
 * PreparedQuestion.TestCases, so the same shape flows end-to-end.
 *
 * All mutations are delegated to the parent via handlers (keeps state
 * ownership with whoever is already managing the form / room state).
 */
function TestCasesEditor({
    testCases,
    activeTestCaseTab,
    setActiveTestCaseTab,
    addTestCase,
    removeTestCase,
    handleTestCaseInputChange,
    addInputToTestCase,
    removeInputFromTestCase,
    handleTestCaseOutputChange,
    addExpectedOutput,
    removeExpectedOutput,
}) {
    const safeTestCases = testCases ?? [];
    const rawActiveCase = safeTestCases[activeTestCaseTab];
    // Defensive: stored test cases may be null (bank-imported coding
    // questions) or may be missing an array field. Treat any missing
    // shape as an empty collection so we never call `.map` on undefined.
    const activeCase = rawActiveCase
        ? {
              inputs: Array.isArray(rawActiveCase.inputs) ? rawActiveCase.inputs : [],
              expectedOutputs: Array.isArray(rawActiveCase.expectedOutputs)
                  ? rawActiveCase.expectedOutputs
                  : [],
          }
        : null;

    return (
        <Box>
            <Box sx={{ display: "flex", alignItems: "center", borderBottom: 1, borderColor: "divider" }}>
                <Tabs
                    value={activeTestCaseTab}
                    onChange={(e, newValue) => setActiveTestCaseTab(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    {safeTestCases.map((_, index) => (
                        <Tab
                            key={index}
                            label={
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Typography variant="body2">Case {index + 1}</Typography>
                                    {safeTestCases.length > 1 && (
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

            <Box sx={{ pt: 2 }}>
                {activeCase && (
                    <Stack spacing={2}>
                        <Typography variant="subtitle2">Inputs</Typography>
                        {activeCase.inputs.map((input, inputIndex) => (
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
                                    disabled={activeCase.inputs.length <= 1}
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Stack>
                        ))}
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<AddIcon sx={{ fontSize: "0.85rem !important" }} />}
                            onClick={() => addInputToTestCase(activeTestCaseTab)}
                            sx={{
                                alignSelf: "flex-start",
                                textTransform: "none",
                                fontSize: "0.75rem",
                                py: 0.4,
                                px: 1.25,
                                borderStyle: "dashed",
                            }}
                        >
                            Add input
                        </Button>

                        <Typography variant="subtitle2" sx={{ mt: 1 }}>
                            Expected Outputs
                        </Typography>
                        {activeCase.expectedOutputs.map((output, outputIndex) => (
                            <Stack direction="row" spacing={1} key={outputIndex} alignItems="center">
                                <TextField
                                    label={`Valid Answer #${outputIndex + 1}`}
                                    size="small"
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
                                    disabled={activeCase.expectedOutputs.length <= 1}
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Stack>
                        ))}
                        <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            startIcon={<AddIcon sx={{ fontSize: "0.85rem !important" }} />}
                            onClick={() => addExpectedOutput(activeTestCaseTab)}
                            sx={{
                                alignSelf: "flex-start",
                                textTransform: "none",
                                fontSize: "0.75rem",
                                py: 0.4,
                                px: 1.25,
                                borderStyle: "dashed",
                            }}
                        >
                            Add valid answer
                        </Button>
                    </Stack>
                )}
            </Box>
        </Box>
    );
}

export default TestCasesEditor;
