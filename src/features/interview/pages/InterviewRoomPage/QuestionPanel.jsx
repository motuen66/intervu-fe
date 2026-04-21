import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DOMPurify from "dompurify";
import { Box, Typography, Paper, TextField, Tabs, Tab, Stack, Button } from "@mui/material";
import QuizIcon from "@mui/icons-material/Quiz";
import { ROLES } from "../../../../common/constants/common.js";
import RichDescriptionEditor from "../../components/shared/RichDescriptionEditor.jsx";
import TestCasesEditor from "../../components/shared/TestCasesEditor.jsx";

function QuestionPanel({
    user,
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
    const editButton = user?.role === ROLES.INTERVIEWER ? (
        <Button
            size="small"
            variant={isEditingProblem ? "contained" : "outlined"}
            startIcon={isEditingProblem ? <VisibilityIcon sx={{ fontSize: 14 }} /> : <EditIcon sx={{ fontSize: 14 }} />}
            onClick={() => setIsEditingProblem(!isEditingProblem)}
            sx={(theme) => ({
                ml: "auto",
                mr: 1,
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.74rem",
                minHeight: 30,
                px: 1.25,
                flexShrink: 0,
                borderRadius: 1.25,
                borderWidth: 1,
                boxShadow: "none",
                ...(isEditingProblem
                    ? {
                        bgcolor: "primary.main",
                        borderColor: "primary.main",
                        color: "primary.contrastText",
                        "&:hover": {
                            bgcolor: "primary.dark",
                            borderColor: "primary.dark",
                            boxShadow: "none",
                        },
                    }
                    : {
                        bgcolor: "background.paper",
                        borderColor: "divider",
                        color: "text.primary",
                        "&:hover": {
                            bgcolor: theme.palette.action.hover,
                            borderColor: "text.disabled",
                        },
                    }),
            })}
        >
            {isEditingProblem ? "Preview" : "Edit"}
        </Button>
    ) : null;

    return (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {isEditingProblem && user?.role === ROLES.INTERVIEWER ? (
                // EDITING VIEW (Role 1 only)
                <>
                    {/* Header row with Edit toggle */}
                    <Stack
                        direction="row"
                        alignItems="center"
                        sx={{
                            borderBottom: "1px solid #E5E7EB",
                            minHeight: 40,
                            flexShrink: 0,
                            pl: 1.5,
                        }}
                    >
                        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.75rem", color: "#111827" }}>
                            Problem Setup
                        </Typography>
                        {editButton}
                    </Stack>
                    <Box sx={{ flex: 1, overflow: "auto", p: 2, display: "flex", flexDirection: "column" }}>
                        <TextField
                            label="Function Name (e.g., twoSum)"
                            value={problemShortName}
                            onChange={(e) => setProblemShortName(e.target.value)}
                            size="small"
                            variant="outlined"
                            sx={{ mb: 2 }}
                        />
                        <Box sx={{ mb: 2 }}>
                            <RichDescriptionEditor
                                value={problemDescription}
                                onChange={setProblemDescription}
                                height={200}
                            />
                        </Box>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                            Test Cases
                        </Typography>
                        <TestCasesEditor
                            testCases={testCases}
                            activeTestCaseTab={activeTestCaseTab}
                            setActiveTestCaseTab={setActiveTestCaseTab}
                            addTestCase={addTestCase}
                            removeTestCase={removeTestCase}
                            handleTestCaseInputChange={handleTestCaseInputChange}
                            addInputToTestCase={addInputToTestCase}
                            removeInputFromTestCase={removeInputFromTestCase}
                            handleTestCaseOutputChange={handleTestCaseOutputChange}
                            addExpectedOutput={addExpectedOutput}
                            removeExpectedOutput={removeExpectedOutput}
                        />
                        <Button onClick={sendProblem} variant="contained" sx={{ mt: 2, mb: 1 }}>
                            Send Problem to Candidate
                        </Button>
                    </Box>
                </>
            ) : (
                // DISPLAY VIEW (Both roles)
                <>
                    {/* Tab row with Edit button inline */}
                    <Stack
                        direction="row"
                        alignItems="center"
                        sx={{
                            borderBottom: "1px solid #E5E7EB",
                            minHeight: 40,
                            flexShrink: 0,
                        }}
                    >
                        <Tabs
                            value={problemTab}
                            onChange={(e, newValue) => setProblemTab(newValue)}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{
                                minHeight: 40,
                                flex: 1,
                                "& .MuiTab-root": {
                                    minWidth: "auto",
                                    px: 1.5,
                                    py: 0,
                                    textTransform: "none",
                                    fontWeight: 600,
                                    fontSize: "0.75rem",
                                    minHeight: 40,
                                },
                            }}
                        >
                            <Tab label={"Problem"} />
                            <Tab label="Test Cases" />
                        </Tabs>
                        {editButton}
                    </Stack>
                    <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
                        {problemTab === 0 && (
                            problemData ? (
                                <Box className="ql-snow">
                                    <Box className="ql-editor" sx={{ p: 0, whiteSpace: "pre-wrap", fontFamily: "body" }}>
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: DOMPurify.sanitize(problemData.description),
                                            }}
                                        />
                                    </Box>
                                </Box>
                            ) : (
                                <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ py: 6, color: "#9CA3AF" }}>
                                    <QuizIcon sx={{ fontSize: 40, color: "#D1D5DB" }} />
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#6B7280" }}>
                                        No Problem Assigned Yet
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: "#9CA3AF", textAlign: "center", maxWidth: 280 }}>
                                        {user?.role === ROLES.INTERVIEWER
                                            ? "Click \"Edit\" to create and send a problem to the candidate."
                                            : "Please wait for the interviewer to assign a problem."}
                                    </Typography>
                                </Stack>
                            )
                        )}
                        {problemTab === 1 && (
                            !problemData || !problemData.testCases?.length ? (
                                <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ py: 6, color: "#9CA3AF" }}>
                                    <QuizIcon sx={{ fontSize: 40, color: "#D1D5DB" }} />
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#6B7280" }}>
                                        No Test Cases Available
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: "#9CA3AF", textAlign: "center", maxWidth: 280 }}>
                                        {user?.role === ROLES.INTERVIEWER
                                            ? "Click \"Edit\" to create test cases and send them along with the problem."
                                            : "Test cases will appear here once the interviewer assigns a problem."}
                                    </Typography>
                                </Stack>
                            ) : (
                                <Stack spacing={1}>
                                    {problemData.testCases.map((tc, index) => {
                                        const inputs = Array.isArray(tc?.inputs)
                                            ? tc.inputs.filter((input) => {
                                                const hasName = typeof input?.name === "string" && input.name.trim() !== "";
                                                const hasValue = typeof input?.value === "string" && input.value.trim() !== "";
                                                return hasName || hasValue;
                                            })
                                            : [];
                                        const expectedOutputs = Array.isArray(tc?.expectedOutputs)
                                            ? tc.expectedOutputs
                                            : [];

                                        return (
                                            <Paper key={index} elevation={0} sx={{ p: 1.25, border: 1, borderColor: "divider", borderRadius: 1.5 }}>
                                                {/* Header */}
                                                <Typography
                                                    sx={{ fontSize: "0.7rem", fontWeight: 700, color: "text.secondary", mb: 0.75, textTransform: "uppercase", letterSpacing: 0.5 }}
                                                >
                                                    Case {index + 1}
                                                </Typography>

                                                {/* Inputs */}
                                                {inputs.length > 0 && (
                                                    <Stack spacing={0.5} sx={{ mb: 0.75 }}>
                                                        {inputs.map((input, inputIndex) => (
                                                            <Box key={inputIndex} sx={{ display: "flex", alignItems: "baseline", gap: 0.75, flexWrap: "wrap" }}>
                                                                <Typography
                                                                    sx={{ fontSize: "0.7rem", fontWeight: 700, color: "text.primary", flexShrink: 0 }}
                                                                >
                                                                    {input?.name?.trim() || "input"}
                                                                </Typography>
                                                                <Typography
                                                                    sx={{
                                                                        fontSize: "0.72rem",
                                                                        fontFamily: "monospace",
                                                                        whiteSpace: "pre-wrap",
                                                                        backgroundColor: "action.hover",
                                                                        color: "text.primary",
                                                                        px: 0.75,
                                                                        py: 0.25,
                                                                        borderRadius: 0.75,
                                                                        border: 1,
                                                                        borderColor: "divider",
                                                                        wordBreak: "break-all",
                                                                        flex: 1,
                                                                        minWidth: 0,
                                                                    }}
                                                                >
                                                                    {input?.value ?? ""}
                                                                </Typography>
                                                            </Box>
                                                        ))}
                                                    </Stack>
                                                )}

                                                {/* Divider */}
                                                <Box sx={{ borderTop: 1, borderTopStyle: "dashed", borderColor: "divider", my: 0.5 }} />

                                                {/* Expected output */}
                                                <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75, flexWrap: "wrap" }}>
                                                    <Typography
                                                        sx={{ fontSize: "0.7rem", fontWeight: 700, color: "info.dark", flexShrink: 0 }}
                                                    >
                                                        expected
                                                    </Typography>
                                                    {expectedOutputs.length === 0 ? (
                                                        <Typography sx={{ fontSize: "0.7rem", color: "text.disabled", fontStyle: "italic" }}>
                                                            —
                                                        </Typography>
                                                    ) : (
                                                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                                            {expectedOutputs.map((out, outIdx) => (
                                                                <Typography
                                                                    key={outIdx}
                                                                    sx={{
                                                                        fontSize: "0.72rem",
                                                                        fontFamily: "monospace",
                                                                        backgroundColor: "info.light",
                                                                        color: "info.dark",
                                                                        px: 0.75,
                                                                        py: 0.25,
                                                                        borderRadius: 0.75,
                                                                        border: 1,
                                                                        borderColor: "info.main",
                                                                        wordBreak: "break-all",
                                                                    }}
                                                                >
                                                                    {String(out ?? "")}
                                                                </Typography>
                                                            ))}
                                                        </Stack>
                                                    )}
                                                </Box>
                                            </Paper>
                                        );
                                    })}
                                </Stack>
                            )
                        )}
                    </Box>
                </>
            )}
        </Box>
    );
}

export default QuestionPanel;
