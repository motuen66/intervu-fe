import { useCallback, useEffect, useImperativeHandle, forwardRef, useState } from "react";
import {
    Box,
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    Stack,
    Tooltip,
} from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import RefreshIcon from "@mui/icons-material/Refresh";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { toast } from "react-hot-toast";
import {
    getPreparedQuestionsByRoom,
    markPreparedQuestionAsked,
    unmarkPreparedQuestionAsked,
    sendPreparedQuestionToEditor,
    PREPARED_QUESTION_INTERACTION_TYPE,
    PREPARED_QUESTION_STATUS,
} from "../../services/preparedQuestionApi";
import { PrimaryButton, SecondaryButton, SuccessButton } from "../../../../common/components/buttons";
import AppText from "../../../../common/components/AppText";

function extractErrorMessage(error, fallback) {
    return (
        error?.response?.data?.message
        ?? error?.response?.data?.error
        ?? error?.message
        ?? fallback
    );
}

function stripHtml(html, maxLength = 220) {
    const text = (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

function QuestionCard({ item, busyAction, onMark, onUnmark, onSend }) {
    const isCoding = item.interactionType === PREPARED_QUESTION_INTERACTION_TYPE.Coding;
    const isAsked = item.status === PREPARED_QUESTION_STATUS.Asked;
    const isIncomplete = isCoding && !item.isReadyForEditor;

    return (
        <Box
            sx={(theme) => ({
                p: 1.5,
                borderRadius: 1.5,
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: isAsked ? "rgba(46, 125, 50, 0.04)" : theme.palette.background.paper,
                transition: "background-color 120ms ease",
            })}
        >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75, flexWrap: "wrap" }}>
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
                        icon={<CheckCircleOutlineIcon sx={{ fontSize: "0.9rem !important" }} />}
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
            <AppText variant="body" sx={{ color: "text.secondary", mb: 1.25 }}>
                {stripHtml(item.description)}
            </AppText>

            <Stack direction="row" spacing={1} flexWrap="wrap">
                {isCoding ? (
                    <PrimaryButton
                        size="sm"
                        startIcon={<SendRoundedIcon />}
                        disabled={isIncomplete || busyAction === "send"}
                        onClick={() => onSend(item)}
                    >
                        {isAsked ? "Resend to editor" : "Send to editor"}
                    </PrimaryButton>
                ) : isAsked ? (
                    <SecondaryButton
                        size="sm"
                        startIcon={<RadioButtonUncheckedIcon />}
                        disabled={busyAction === "unmark"}
                        onClick={() => onUnmark(item)}
                    >
                        Unmark
                    </SecondaryButton>
                ) : (
                    <SuccessButton
                        size="sm"
                        startIcon={<CheckCircleOutlineIcon />}
                        disabled={busyAction === "mark"}
                        onClick={() => onMark(item)}
                    >
                        Mark as asked
                    </SuccessButton>
                )}
            </Stack>
        </Box>
    );
}

/**
 * Coach-only roadmap panel shown inside the interview room. Owns its own
 * fetch/state so it does not touch or re-run any WebRTC or code-sync hooks.
 *
 * External updates (from the server's `PreparedQuestionStatusChanged` event)
 * are merged in via the imperative ref method `applyStatusUpdate(dto)`, which
 * the parent page wires up inside the SignalR callbacks ref.
 */
const PreparedQuestionsWorkspace = forwardRef(function PreparedQuestionsWorkspace({ roomId }, ref) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState({ id: null, action: null });

    const fetchItems = useCallback(async () => {
        if (!roomId) return;
        setLoading(true);
        try {
            const data = await getPreparedQuestionsByRoom(roomId);
            setItems(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error(extractErrorMessage(error, "Failed to load prepared questions"));
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [roomId]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    useImperativeHandle(
        ref,
        () => ({
            applyStatusUpdate: (dto) => {
                if (!dto?.id) return;
                setItems((prev) => {
                    const idx = prev.findIndex((it) => it.id === dto.id);
                    if (idx === -1) return prev;
                    const next = [...prev];
                    next[idx] = { ...next[idx], ...dto };
                    return next;
                });
            },
        }),
        [],
    );

    const runAction = async (item, action, fn, successMessage) => {
        setBusy({ id: item.id, action });
        try {
            const updated = await fn(item.id);
            if (updated?.id) {
                setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
            }
            if (successMessage) toast.success(successMessage);
        } catch (error) {
            toast.error(extractErrorMessage(error, "Action failed"));
        } finally {
            setBusy({ id: null, action: null });
        }
    };

    const handleMark = (item) => runAction(item, "mark", markPreparedQuestionAsked, "Marked as asked");
    const handleUnmark = (item) => runAction(item, "unmark", unmarkPreparedQuestionAsked, "Unmarked");
    const handleSend = (item) => runAction(item, "send", sendPreparedQuestionToEditor, "Sent to editor");

    const askedCount = items.filter((i) => i.status === PREPARED_QUESTION_STATUS.Asked).length;

    return (
        <Box
            sx={(theme) => ({
                display: "flex",
                flexDirection: "column",
                height: "100%",
                borderLeft: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.default,
            })}
        >
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={(t) => ({ px: 2, py: 1.25, borderBottom: `1px solid ${t.palette.divider}` })}
            >
                <Box>
                    <AppText variant="bodyStrong">Question roadmap</AppText>
                    <AppText variant="caption" sx={{ color: "text.secondary" }}>
                        {items.length === 0
                            ? "No prepared questions"
                            : `${askedCount}/${items.length} asked`}
                    </AppText>
                </Box>
                <Tooltip title="Refresh">
                    <IconButton size="small" onClick={fetchItems} disabled={loading}>
                        <RefreshIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Stack>

            <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", p: 1.5 }}>
                {loading && items.length === 0 ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress size={22} />
                    </Box>
                ) : items.length === 0 ? (
                    <Stack alignItems="center" spacing={1} sx={{ py: 4, px: 2, color: "text.secondary", textAlign: "center" }}>
                        <AppText variant="bodyStrong">Nothing prepared yet</AppText>
                        <AppText variant="caption">
                            Close the room and open &quot;Prepare Questions&quot; on this round to build your list.
                        </AppText>
                    </Stack>
                ) : (
                    <Stack spacing={1.25} divider={<Divider flexItem sx={{ opacity: 0 }} />}>
                        {items.map((item) => (
                            <QuestionCard
                                key={item.id}
                                item={item}
                                busyAction={busy.id === item.id ? busy.action : null}
                                onMark={handleMark}
                                onUnmark={handleUnmark}
                                onSend={handleSend}
                            />
                        ))}
                    </Stack>
                )}
            </Box>
        </Box>
    );
});

export default PreparedQuestionsWorkspace;
