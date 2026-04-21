import { Box } from "@mui/material";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const DEFAULT_TOOLBAR = [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ script: "sub" }, { script: "super" }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "code-block"],
    ["clean"],
];

/**
 * Shared Quill-based rich text editor for problem descriptions.
 * Used by the in-room QuestionPanel "Problem Setup" view and by the
 * pre-interview PreparedQuestions custom form so both surfaces produce
 * the exact same HTML (which later flows into InterviewRoom.ProblemDescription).
 */
function RichDescriptionEditor({ value, onChange, height = 200, placeholder, readOnly = false }) {
    const modules = { toolbar: DEFAULT_TOOLBAR };

    return (
        <Box sx={{ ".ql-container": { height: `${height}px` } }}>
            <ReactQuill
                theme="snow"
                value={value || ""}
                onChange={onChange}
                modules={modules}
                placeholder={placeholder}
                readOnly={readOnly}
            />
        </Box>
    );
}

export default RichDescriptionEditor;
