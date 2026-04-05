import React, { useMemo } from "react";
import { Box, TextField, Typography, Modal, Card, Stack, FormControl, Select, MenuItem, Divider } from "@mui/material";
import StatusChip from "../../../../common/components/StatusChip";
import { PrimaryButton, SecondaryButton, DangerButton } from "../../../../common/components/buttons";
import { IoTrash } from "react-icons/io5";
import { AVAILABILITY_SLOTS_STATUS } from "../../../../common/constants/status";

const MINUTES_STEP = 30;
const MINUTE_OPTIONS = Array.from({ length: 60 / MINUTES_STEP }, (_, i) => i * MINUTES_STEP);

const UpdateAvailableSlotDialog = ({
    open,
    onClose,
    formData,
    setFormData,
    handleSubmit,
    handleDelete,
    loading,
    minDate,
    maxDate,
    existingBlocks = [],
}) => {
    // Generate the list of affected 30-min blocks based on current form state
    const affectedBlocks = useMemo(() => {
        if (!formData.date) return [];
        const startTotal = Number(formData.startHour) * 60 + Number(formData.startMinute);
        const endTotal = Number(formData.endHour) * 60 + Number(formData.endMinute);
        if (endTotal <= startTotal) return [];

        const blocks = [];
        let cursor = startTotal;
        while (cursor < endTotal) {
            const blockStartH = Math.floor(cursor / 60);
            const blockStartM = cursor % 60;
            const blockEndCursor = cursor + MINUTES_STEP;
            const blockEndH = Math.floor(blockEndCursor / 60);
            const blockEndM = blockEndCursor % 60;

            // Check if this block matches any existing booked block
            const [year, month, day] = formData.date.split("-").map(Number);
            const blockStartDate = new Date(year, month - 1, day, blockStartH, blockStartM);
            const isBooked = existingBlocks.some((b) => {
                const bStart = new Date(b.startTime);
                return (
                    bStart.getTime() === blockStartDate.getTime() &&
                    Number(b.status) === AVAILABILITY_SLOTS_STATUS.BOOKED
                );
            });

            blocks.push({
                label: `${String(blockStartH).padStart(2, "0")}:${String(blockStartM).padStart(2, "0")} - ${String(blockEndH).padStart(2, "0")}:${String(blockEndM).padStart(2, "0")}`,
                isBooked,
            });
            cursor = blockEndCursor;
        }
        return blocks;
    }, [formData.date, formData.startHour, formData.startMinute, formData.endHour, formData.endMinute, existingBlocks]);

    const hasBookedBlocks = affectedBlocks.some((b) => b.isBooked);

    return (
        <Modal
            open={open}
            onClose={(event, reason) => {
                if (reason === "backdropClick" || reason === "escapeKeyDown") onClose();
            }}
            disableScrollLock={false}
            closeAfterTransition
            keepMounted
            BackdropProps={{ style: { position: "fixed" } }}
            sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
        >
            <Card sx={{ width: "90%", maxWidth: "500px", borderRadius: "12px", maxHeight: "90vh", overflowY: "auto" }}>
                <Box sx={{ p: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: "text.primary" }}>
                        Edit Availability Slot
                    </Typography>

                    <Stack spacing={2.5}>
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: "text.primary" }}>
                                Date
                            </Typography>
                            <TextField
                                type="date"         
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                inputProps={{
                                    min:
                                        minDate ||
                                        (() => {
                                            const now = new Date();
                                            return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                                        })(),
                                    max: maxDate,
                                }}
                                fullWidth
                                variant="outlined"
                                size="small"
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                            />
                        </Box>

                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: "text.primary" }}>
                                Start Time
                            </Typography>
                            <Stack direction="row" spacing={1}>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={formData.startHour}
                                        onChange={(e) =>
                                            setFormData({ ...formData, startHour: Number(e.target.value) })
                                        }
                                        sx={{ borderRadius: "8px" }}
                                    >
                                        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                            <MenuItem key={hour} value={hour}>
                                                {hour.toString().padStart(2, "0")}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <Typography sx={{ display: "flex", alignItems: "center", mx: 0.5 }}>:</Typography>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={formData.startMinute}
                                        onChange={(e) =>
                                            setFormData({ ...formData, startMinute: Number(e.target.value) })
                                        }
                                        sx={{ borderRadius: "8px" }}
                                    >
                                        {MINUTE_OPTIONS.map((minute) => (
                                            <MenuItem key={minute} value={minute}>
                                                {minute.toString().padStart(2, "0")}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Box>

                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: "text.primary" }}>
                                End Time
                            </Typography>
                            <Stack direction="row" spacing={1}>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={formData.endHour}
                                        onChange={(e) => setFormData({ ...formData, endHour: Number(e.target.value) })}
                                        sx={{ borderRadius: "8px" }}
                                    >
                                        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                            <MenuItem key={hour} value={hour}>
                                                {hour.toString().padStart(2, "0")}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <Typography sx={{ display: "flex", alignItems: "center", mx: 0.5 }}>:</Typography>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={formData.endMinute}
                                        onChange={(e) =>
                                            setFormData({ ...formData, endMinute: Number(e.target.value) })
                                        }
                                        sx={{ borderRadius: "8px" }}
                                    >
                                        {MINUTE_OPTIONS.map((minute) => (
                                            <MenuItem key={minute} value={minute}>
                                                {minute.toString().padStart(2, "0")}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Box>

                        {/* Affected 30-min blocks preview */}
                        {/* {affectedBlocks.length > 0 && (
                            <Box>
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: "text.primary" }}>
                                    Affected 30-min Blocks
                                </Typography>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                    {affectedBlocks.map((block) => (
                                        <StatusChip
                                            key={block.label}
                                            label={block.isBooked ? `${block.label} (Booked)` : block.label}
                                            color={block.isBooked ? "error" : "secondary"}
                                            variant={block.isBooked ? "filled" : "default"}
                                        />
                                    ))}
                                </Box>
                                {hasBookedBlocks && (
                                    <Typography variant="caption" sx={{ color: "error.main", mt: 1, display: "block" }}>
                                        Range contains booked blocks. Booked blocks cannot be modified or removed.
                                    </Typography>
                                )}
                            </Box>
                        )} */}

                        <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ mt: 3 }}>
                            <DangerButton onClick={handleDelete} disabled={loading || hasBookedBlocks}>
                                <IoTrash size={16} />
                            </DangerButton>
                            <Stack direction="row" spacing={2}>
                                <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
                                <PrimaryButton onClick={handleSubmit} loading={loading} disabled={hasBookedBlocks}>
                                    Update
                                </PrimaryButton>
                            </Stack>
                        </Stack>
                    </Stack>
                </Box>
            </Card>
        </Modal>
    );
};

export default UpdateAvailableSlotDialog;
