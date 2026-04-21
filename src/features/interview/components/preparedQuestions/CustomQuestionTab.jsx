import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import RichDescriptionEditor from "../shared/RichDescriptionEditor";
import TestCasesEditor from "../shared/TestCasesEditor";
import { PREPARED_QUESTION_INTERACTION_TYPE } from "../../services/preparedQuestionApi";

const DEFAULT_TEST_CASE = () => ({
    inputs: [{ name: "", value: "" }],
    expectedOutputs: [""],
});

const CATEGORY_CHOICES = [
    { value: PREPARED_QUESTION_INTERACTION_TYPE.NonCoding, label: "Behavioral / Non-coding" },
    { value: PREPARED_QUESTION_INTERACTION_TYPE.Coding, label: "Coding" },
];

// Normalize an arbitrary test-case blob (e.g. from a bank-imported question,
// or from legacy data) into the { inputs, expectedOutputs } shape the editor
// and the backend agree on. Missing arrays fall back to a single empty row so
// the coach has something to type into.
function normalizeTestCase(raw) {
    const inputs = Array.isArray(raw?.inputs) && raw.inputs.length > 0
        ? raw.inputs.map((inp) => ({
            name: typeof inp?.name === "string" ? inp.name : "",
            value: typeof inp?.value === "string" ? inp.value : String(inp?.value ?? ""),
        }))
        : [{ name: "", value: "" }];
    const expectedOutputs = Array.isArray(raw?.expectedOutputs) && raw.expectedOutputs.length > 0
        ? raw.expectedOutputs.map((o) => (typeof o === "string" ? o : String(o ?? "")))
        : [""];
    return { inputs, expectedOutputs };
}

function buildInitialForm(seed) {
    if (seed) {
        const seededCases = Array.isArray(seed.testCases) && seed.testCases.length > 0
            ? seed.testCases.map(normalizeTestCase)
            : [DEFAULT_TEST_CASE()];
        return {
            interactionType: seed.interactionType,
            displayCategoryLabel: seed.displayCategoryLabel ?? "",
            title: seed.title ?? "",
            description: seed.description ?? "",
            functionName: seed.functionName ?? "",
            testCases: seededCases,
        };
    }
    return {
        interactionType: PREPARED_QUESTION_INTERACTION_TYPE.NonCoding,
        displayCategoryLabel: "",
        title: "",
        description: "",
        functionName: "",
        testCases: [DEFAULT_TEST_CASE()],
    };
}

/**
 * Category-aware custom authoring form. Behavioral: title + description only.
 * Coding: title + description + function name + test cases. Mirrors the backend
 * PreparedQuestion DTO shape so on submit we just forward the relevant fields.
 */
function CustomQuestionTab({ editingItem, onSubmit, onCancelEdit, isSubmitting }) {
    const [form, setForm] = useState(() => buildInitialForm(editingItem));
    const [activeTestCaseTab, setActiveTestCaseTab] = useState(0);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        setForm(buildInitialForm(editingItem));
        setActiveTestCaseTab(0);
        setErrors({});
    }, [editingItem]);

    const isCoding = form.interactionType === PREPARED_QUESTION_INTERACTION_TYPE.Coding;

    const updateField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (errors[key]) {
            setErrors((prev) => ({ ...prev, [key]: undefined }));
        }
    };

    const mutateTestCases = (mutator) => {
        setForm((prev) => ({ ...prev, testCases: mutator(prev.testCases ?? []) }));
    };

    const addTestCase = () => {
        mutateTestCases((cases) => [...cases, DEFAULT_TEST_CASE()]);
        setActiveTestCaseTab((form.testCases ?? []).length);
    };

    const removeTestCase = (index) => {
        mutateTestCases((cases) => {
            if (cases.length <= 1) return cases;
            return cases.filter((_, i) => i !== index);
        });
        setActiveTestCaseTab((prev) => (prev > 0 && prev >= (form.testCases ?? []).length - 1 ? prev - 1 : prev));
    };

    const handleTestCaseInputChange = (caseIndex, inputIndex, field, value) => {
        mutateTestCases((cases) =>
            cases.map((c, ci) =>
                ci !== caseIndex
                    ? c
                    : {
                          ...c,
                          inputs: c.inputs.map((inp, ii) =>
                              ii !== inputIndex ? inp : { ...inp, [field]: value },
                          ),
                      },
            ),
        );
    };

    const addInputToTestCase = (caseIndex) => {
        mutateTestCases((cases) =>
            cases.map((c, ci) =>
                ci !== caseIndex ? c : { ...c, inputs: [...c.inputs, { name: "", value: "" }] },
            ),
        );
    };

    const removeInputFromTestCase = (caseIndex, inputIndex) => {
        mutateTestCases((cases) =>
            cases.map((c, ci) => {
                if (ci !== caseIndex) return c;
                if (c.inputs.length <= 1) return c;
                return { ...c, inputs: c.inputs.filter((_, ii) => ii !== inputIndex) };
            }),
        );
    };

    const handleTestCaseOutputChange = (caseIndex, outputIndex, value) => {
        mutateTestCases((cases) =>
            cases.map((c, ci) =>
                ci !== caseIndex
                    ? c
                    : {
                          ...c,
                          expectedOutputs: c.expectedOutputs.map((o, oi) => (oi !== outputIndex ? o : value)),
                      },
            ),
        );
    };

    const addExpectedOutput = (caseIndex) => {
        mutateTestCases((cases) =>
            cases.map((c, ci) =>
                ci !== caseIndex ? c : { ...c, expectedOutputs: [...c.expectedOutputs, ""] },
            ),
        );
    };

    const removeExpectedOutput = (caseIndex, outputIndex) => {
        mutateTestCases((cases) =>
            cases.map((c, ci) => {
                if (ci !== caseIndex) return c;
                if (c.expectedOutputs.length <= 1) return c;
                return { ...c, expectedOutputs: c.expectedOutputs.filter((_, oi) => oi !== outputIndex) };
            }),
        );
    };

    const plainDescription = useMemo(
        () => (form.description || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
        [form.description],
    );

    const validate = () => {
        const next = {};
        if (!form.title.trim()) next.title = "Title is required";
        if (!plainDescription) next.description = "Description is required";
        if (isCoding) {
            if (!form.functionName.trim()) next.functionName = "Function name is required";
            const hasIncompleteCase = (form.testCases ?? []).some(
                (c) =>
                    !c.inputs?.length ||
                    c.inputs.some((inp) => !inp.name.trim()) ||
                    !c.expectedOutputs?.length ||
                    c.expectedOutputs.some((o) => !String(o).trim()),
            );
            if (hasIncompleteCase) next.testCases = "Each test case needs input names and at least one expected output";
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onSubmit({
            interactionType: form.interactionType,
            displayCategoryLabel: form.displayCategoryLabel.trim() || null,
            title: form.title.trim(),
            description: form.description,
            functionName: isCoding ? form.functionName.trim() : null,
            testCases: isCoding ? form.testCases : null,
        });
    };

    const isEditMode = Boolean(editingItem);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
                <Stack spacing={2}>
                    <TextField
                        select
                        label="Question type"
                        size="small"
                        value={form.interactionType}
                        onChange={(e) => updateField("interactionType", Number(e.target.value))}
                        fullWidth
                        disabled={isEditMode}
                        helperText={isEditMode ? "Type cannot be changed after creation" : undefined}
                    >
                        {CATEGORY_CHOICES.map((c) => (
                            <MenuItem key={c.value} value={c.value}>
                                {c.label}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        label="Display category label (optional)"
                        size="small"
                        value={form.displayCategoryLabel}
                        onChange={(e) => updateField("displayCategoryLabel", e.target.value)}
                        placeholder={isCoding ? "e.g. Algorithms, Data Structures" : "e.g. Leadership, Process"}
                        fullWidth
                    />

                    <TextField
                        label="Title"
                        size="small"
                        value={form.title}
                        onChange={(e) => updateField("title", e.target.value)}
                        error={Boolean(errors.title)}
                        helperText={errors.title}
                        fullWidth
                        required
                    />

                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Description <span style={{ color: "#d32f2f" }}>*</span>
                        </Typography>
                        <RichDescriptionEditor
                            value={form.description}
                            onChange={(html) => updateField("description", html)}
                            height={isCoding ? 160 : 220}
                            placeholder={
                                isCoding
                                    ? "Describe the problem — constraints, examples, edge cases…"
                                    : "What would you like the candidate to talk through?"
                            }
                        />
                        {errors.description && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                                {errors.description}
                            </Typography>
                        )}
                    </Box>

                    {isCoding && (
                        <>
                            <TextField
                                label="Function name"
                                size="small"
                                value={form.functionName}
                                onChange={(e) => updateField("functionName", e.target.value)}
                                placeholder="e.g. twoSum"
                                error={Boolean(errors.functionName)}
                                helperText={
                                    errors.functionName
                                    ?? "Used to auto-generate starter code when this question is sent to the editor"
                                }
                                fullWidth
                                required
                            />

                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                    Test cases
                                </Typography>
                                <TestCasesEditor
                                    testCases={form.testCases}
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
                                {errors.testCases && (
                                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                                        {errors.testCases}
                                    </Typography>
                                )}
                            </Box>
                        </>
                    )}
                </Stack>
            </Box>

            <Stack
                direction="row"
                spacing={1}
                justifyContent="flex-end"
                sx={(theme) => ({
                    p: 1.5,
                    borderTop: `1px solid ${theme.palette.divider}`,
                    flexShrink: 0,
                })}
            >
                {isEditMode && (
                    <Button
                        onClick={onCancelEdit}
                        startIcon={<CancelRoundedIcon />}
                        sx={{ textTransform: "none" }}
                    >
                        Cancel edit
                    </Button>
                )}
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    startIcon={isEditMode ? <SaveRoundedIcon /> : <AddRoundedIcon />}
                    sx={{ textTransform: "none" }}
                >
                    {isEditMode ? "Save changes" : "Add to roadmap"}
                </Button>
            </Stack>
        </Box>
    );
}

export default CustomQuestionTab;
