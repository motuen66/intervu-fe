import {
    Box,
    Chip,
    CircularProgress,
    IconButton,
    Stack,
    Tooltip,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
    PREPARED_QUESTION_INTERACTION_TYPE,
    PREPARED_QUESTION_STATUS,
} from "../../services/preparedQuestionApi";
import AppText from "../../../../common/components/AppText";

function PlainPreview({ html, maxLength = 160 }) {
    const stripped = (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const shortened = stripped.length > maxLength ? `${stripped.slice(0, maxLength)}…` : stripped;
    return (
        <AppText variant="body" sx={{ color: "text.secondary", whiteSpace: "pre-wrap" }}>
            {shortened || "—"}
        </AppText>
    );
}

function SelectedRow({ item, onEdit, onRemove, onReorder, index, total }) {
    const isCoding = item.interactionType === PREPARED_QUESTION_INTERACTION_TYPE.Coding;
    const isAsked = item.status === PREPARED_QUESTION_STATUS.Asked;
    const isIncomplete = isCoding && !item.isReadyForEditor;

    return (
        <Box
            sx={(theme) => ({
                p: 1.5,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1.5,
                backgroundColor: isAsked ? "rgba(76, 175, 80, 0.04)" : theme.palette.background.paper,
                display: "flex",
                gap: 1,
                alignItems: "flex-start",
            })}
        >
            <Stack spacing={0.5} sx={{ color: "text.disabled", pt: 0.5 }}>
                <Tooltip title="Move up">
                    <span>
                        <IconButton
                            size="small"
                            onClick={() => onReorder(index, index - 1)}
                            disabled={index === 0}
                        >
                            <DragIndicatorIcon sx={{ transform: "rotate(-90deg)", fontSize: 16 }} />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title="Move down">
                    <span>
                        <IconButton
                            size="small"
                            onClick={() => onReorder(index, index + 1)}
                            disabled={index === total - 1}
                        >
                            <DragIndicatorIcon sx={{ transform: "rotate(90deg)", fontSize: 16 }} />
                        </IconButton>
                    </span>
                </Tooltip>
            </Stack>

            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5, flexWrap: "wrap" }}>
                    <Chip
                        size="small"
                        label={item.displayCategoryLabel || (isCoding ? "Coding" : "Behavioral")}
                        sx={{
                            fontWeight: 700,
                            height: 20,
                            fontSize: "0.65rem",
                            backgroundColor: isCoding ? "#E0E7FF" : "#FEF3C7",
                            color: isCoding ? "#3730A3" : "#92400E",
                        }}
                    />
                    {isAsked && (
                        <Chip
                            size="small"
                            label="Asked"
                            color="success"
                            variant="outlined"
                            sx={{ height: 20, fontSize: "0.65rem" }}
                        />
                    )}
                    {isIncomplete && (
                        <Tooltip title="Add a function name and at least one test case before sending to the editor">
                            <Chip
                                size="small"
                                icon={<WarningAmberRoundedIcon sx={{ fontSize: "0.9rem !important" }} />}
                                label="Incomplete"
                                color="warning"
                                variant="outlined"
                                sx={{ height: 20, fontSize: "0.65rem" }}
                            />
                        </Tooltip>
                    )}
                </Stack>
                <AppText variant="bodyStrong" sx={{ mb: 0.5 }}>
                    {item.title}
                </AppText>
                <PlainPreview html={item.description} />
            </Box>

            <Stack direction="row" spacing={0.5}>
                <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => onEdit(item)}>
                        <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title={isAsked ? "Unmark before deleting" : "Remove from roadmap"}>
                    <span>
                        <IconButton
                            size="small"
                            onClick={() => onRemove(item)}
                            disabled={isAsked}
                            sx={{ color: isAsked ? undefined : "error.main" }}
                        >
                            <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
            </Stack>
        </Box>
    );
}

function SelectedQuestionsPanel({ items, loading, onEdit, onRemove, onReorder }) {
    if (loading) {
        return (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    if (!items?.length) {
        return (
            <Stack
                alignItems="center"
                justifyContent="center"
                spacing={1}
                sx={{ height: "100%", textAlign: "center", px: 3, color: "text.secondary" }}
            >
                <AppText variant="bodyStrong">No questions added yet</AppText>
                <AppText variant="caption">
                    Pick from the Question Bank or write your own on the Custom Question tab.
                </AppText>
            </Stack>
        );
    }

    return (
        <Stack spacing={1.25} sx={{ p: 1.5, overflow: "auto", height: "100%" }}>
            {items.map((item, index) => (
                <SelectedRow
                    key={item.id}
                    item={item}
                    index={index}
                    total={items.length}
                    onEdit={onEdit}
                    onRemove={onRemove}
                    onReorder={onReorder}
                />
            ))}
        </Stack>
    );
}

export default SelectedQuestionsPanel;
