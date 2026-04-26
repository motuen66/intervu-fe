import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Box,
    Dialog,
    DialogContent,
    IconButton,
    Stack,
    Tab,
    Tabs,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-hot-toast";
import CustomQuestionTab from "./CustomQuestionTab";
import QuestionBankTab from "./QuestionBankTab";
import SelectedQuestionsPanel from "./SelectedQuestionsPanel";
import {
    addCustomPreparedQuestion,
    addPreparedQuestionFromBank,
    deletePreparedQuestion,
    getPreparedQuestionsByRoom,
    reorderPreparedQuestions,
    updatePreparedQuestion,
} from "../../services/preparedQuestionApi";
import AppText from "../../../../common/components/AppText";
import SectionHeading from "../../../../common/components/SectionHeading";

const TABS = {
    BANK: "bank",
    CUSTOM: "custom",
};

function extractErrorMessage(error, fallback) {
    return (
        error?.response?.data?.message
        ?? error?.response?.data?.error
        ?? error?.message
        ?? fallback
    );
}

function PreparedQuestionsModal({ open, onClose, roomId, roomTitle }) {
    const theme = useTheme();
    const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
    const [tab, setTab] = useState(TABS.BANK);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [addingBankId, setAddingBankId] = useState(null);

    const loadItems = useCallback(async () => {
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
        if (open) {
            loadItems();
            setTab(TABS.BANK);
            setEditingItem(null);
        }
    }, [open, loadItems]);

    const importedBankIds = useMemo(
        () => items.map((i) => i.sourceBankQuestionId).filter(Boolean),
        [items],
    );

    const handleAddBankQuestion = async (bankQuestion) => {
        if (!roomId || !bankQuestion?.id) return;
        setAddingBankId(bankQuestion.id);
        try {
            const dto = await addPreparedQuestionFromBank(roomId, bankQuestion.id);
            if (dto) {
                setItems((prev) => [...prev, dto]);
                toast.success("Question added from bank");
            } else {
                await loadItems();
            }
        } catch (error) {
            toast.error(extractErrorMessage(error, "Failed to add question"));
        } finally {
            setAddingBankId(null);
        }
    };

    const handleSubmitCustom = async (payload) => {
        if (!roomId) return;
        setSubmitting(true);
        try {
            if (editingItem) {
                const updated = await updatePreparedQuestion(editingItem.id, {
                    title: payload.title,
                    description: payload.description,
                    displayCategoryLabel: payload.displayCategoryLabel,
                    functionName: payload.functionName,
                    testCases: payload.testCases,
                });
                if (updated) {
                    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
                    toast.success("Question updated");
                    setEditingItem(null);
                    setTab(TABS.BANK);
                } else {
                    await loadItems();
                }
            } else {
                const created = await addCustomPreparedQuestion(roomId, payload);
                if (created) {
                    setItems((prev) => [...prev, created]);
                    toast.success("Question added");
                } else {
                    await loadItems();
                }
            }
        } catch (error) {
            toast.error(extractErrorMessage(error, "Failed to save question"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setTab(TABS.CUSTOM);
    };

    const handleCancelEdit = () => {
        setEditingItem(null);
    };

    const handleRemove = async (item) => {
        try {
            await deletePreparedQuestion(item.id);
            setItems((prev) => prev.filter((i) => i.id !== item.id));
            if (editingItem?.id === item.id) {
                setEditingItem(null);
            }
            toast.success("Question removed");
        } catch (error) {
            toast.error(extractErrorMessage(error, "Failed to remove question"));
        }
    };

    const handleReorder = async (fromIndex, toIndex) => {
        if (toIndex < 0 || toIndex >= items.length) return;
        const next = [...items];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        const previous = items;
        setItems(next);
        try {
            await reorderPreparedQuestions(roomId, next.map((i) => i.id));
        } catch (error) {
            setItems(previous);
            toast.error(extractErrorMessage(error, "Failed to save new order"));
        }
    };

    const handleClose = () => {
        setEditingItem(null);
        onClose?.();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="lg"
            PaperProps={{ sx: { height: isMdDown ? "100vh" : "min(86vh, 900px)" } }}
            fullScreen={isMdDown}
        >
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={(t) => ({
                    px: 2.5,
                    py: 2,
                    borderBottom: `1px solid ${t.palette.divider}`,
                })}
            >
                <Box>
                    <SectionHeading title="Prepare interview questions" disableGutters as="h2" />
                    {roomTitle && (
                        <AppText variant="caption" sx={{ color: "text.secondary" }}>
                            {roomTitle}
                        </AppText>
                    )}
                </Box>
                <IconButton onClick={handleClose} size="small">
                    <CloseIcon />
                </IconButton>
            </Stack>

            <DialogContent sx={{ p: 0, display: "flex", overflow: "hidden" }}>
                <Box
                    sx={(t) => ({
                        flex: 1.2,
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "column",
                        borderRight: isMdDown ? "none" : `1px solid ${t.palette.divider}`,
                    })}
                >
                    <Tabs
                        value={tab}
                        onChange={(_, v) => setTab(v)}
                        sx={(t) => ({
                            px: 1.5,
                            minHeight: 42,
                            borderBottom: `1px solid ${t.palette.divider}`,
                        })}
                    >
                        <Tab
                            value={TABS.BANK}
                            label="Question bank"
                            sx={{ textTransform: "none", minHeight: 42, fontWeight: 600 }}
                        />
                        <Tab
                            value={TABS.CUSTOM}
                            label={editingItem ? "Edit question" : "Custom question"}
                            sx={{ textTransform: "none", minHeight: 42, fontWeight: 600 }}
                        />
                    </Tabs>

                    <Box sx={{ flex: 1, overflow: "hidden" }}>
                        {tab === TABS.BANK ? (
                            <QuestionBankTab
                                importedBankIds={importedBankIds}
                                onAddBankQuestion={handleAddBankQuestion}
                                addingBankId={addingBankId}
                            />
                        ) : (
                            <CustomQuestionTab
                                editingItem={editingItem}
                                onSubmit={handleSubmitCustom}
                                onCancelEdit={handleCancelEdit}
                                isSubmitting={submitting}
                            />
                        )}
                    </Box>
                </Box>

                <Box
                    sx={(t) => ({
                        width: isMdDown ? "100%" : 380,
                        flexShrink: 0,
                        display: isMdDown ? "none" : "flex",
                        flexDirection: "column",
                        bgcolor: t.palette.background.default,
                    })}
                >
                    <Box sx={(t) => ({ px: 2, py: 1.5, borderBottom: `1px solid ${t.palette.divider}` })}>
                        <AppText variant="bodyStrong">
                            Selected questions ({items.length})
                        </AppText>
                        <AppText variant="caption" sx={{ color: "text.secondary" }}>
                            Drag the arrows to reorder — this is the order the coach sees in the room.
                        </AppText>
                    </Box>
                    <Box sx={{ flex: 1, minHeight: 0 }}>
                        <SelectedQuestionsPanel
                            items={items}
                            loading={loading}
                            onEdit={handleEdit}
                            onRemove={handleRemove}
                            onReorder={handleReorder}
                        />
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
}

export default PreparedQuestionsModal;
