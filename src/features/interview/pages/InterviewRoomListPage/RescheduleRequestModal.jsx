import { useState, useEffect, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    IconButton,
    Stack,
    CircularProgress,
    Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import { PrimaryButton, SecondaryButton } from "../../../../common/components/buttons";
import FormTextField from "../../../../common/components/form/FormTextField";
import { dialogStyles } from "../../../../common/constants/uiStyles";
import { formattedDateTime } from "../../../../common/utils/dateFormatter";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import CalendlyCalendar from "../../../../common/components/CalendlyCalendar";
import AppText from "../../../../common/components/AppText";
import { addMonths, format, isSameDay } from "date-fns";
import "../../../../features/profiles/coach/page/PublicInterviewerProfilePage/BookingSlotDialog.css";

const BLOCK_MINUTES = 30;
const MIN_REASON_LENGTH = 10;
const MAX_REASON_LENGTH = 500;

/**
 * Given a starting block, find N consecutive blocks from the available pool.
 */
function findConsecutiveBlocks(startBlock, requiredCount, availableBlocks) {
    if (requiredCount <= 0) return [];
    const sorted = [...availableBlocks].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    const startIdx = sorted.findIndex((b) => String(b.id) === String(startBlock.id));
    if (startIdx === -1) return null;

    const chain = [sorted[startIdx]];
    for (let i = startIdx + 1; i < sorted.length && chain.length < requiredCount; i++) {
        const prevEnd = new Date(chain[chain.length - 1].endTime).getTime();
        const currStart = new Date(sorted[i].startTime).getTime();
        if (currStart === prevEnd) {
            chain.push(sorted[i]);
        } else {
            break;
        }
    }
    return chain.length === requiredCount ? chain : null;
}

const normalizeIso = (value) => (value && !value.endsWith("Z") ? `${value}Z` : value);

function RescheduleRequestModal({ open, onClose, onSubmit, currentSession }) {
    const [freeSlots, setFreeSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSlotData, setSelectedSlotData] = useState(null);
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const coachId =
        currentSession?.coachId || currentSession?.CoachId || currentSession?.coach?.id || currentSession?.Coach?.Id;

    const durationMinutes = currentSession?.durationMinutes || currentSession?.DurationMinutes || 30;
    const requiredBlocks = Math.max(1, Math.ceil(durationMinutes / BLOCK_MINUTES));
    const trimmedReason = reason.trim();
    const isReasonTooShort = trimmedReason.length > 0 && trimmedReason.length < MIN_REASON_LENGTH;
    const isReasonTooLong = trimmedReason.length > MAX_REASON_LENGTH;

    // Reset state when modal closes
    useEffect(() => {
        if (!open) {
            setSelectedDate(null);
            setSelectedSlotData(null);
            setReason("");
            setError(null);
            setFreeSlots([]);
            setCurrentMonth(new Date());
        }
    }, [open]);

    // Fetch free slots when modal opens
    useEffect(() => {
        if (!open || !coachId) return;

        const fetchFreeSlots = async () => {
            setLoading(true);
            setError(null);
            try {
                const allSlots = [];
                const today = new Date();

                for (let i = 0; i < 3; i++) {
                    const targetMonth = addMonths(today, i);
                    const month = targetMonth.getMonth() + 1;
                    const year = targetMonth.getFullYear();

                    const response = await callApi({
                        method: METHOD.GET,
                        endpoint: `/availabilities/${coachId}/free-slots?month=${month}&year=${year}`,
                    });

                    if (response?.success && Array.isArray(response.data)) {
                        allSlots.push(
                            ...response.data.map((slot) => ({
                                ...slot,
                                startTime: normalizeIso(slot.startTime ?? slot.StartTime),
                                endTime: normalizeIso(slot.endTime ?? slot.EndTime),
                            })),
                        );
                    }
                }

                allSlots.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
                setFreeSlots(allSlots);
            } catch (err) {
                setError("Failed to load available slots: " + (err?.response?.data?.message || err.message));
            } finally {
                setLoading(false);
            }
        };

        fetchFreeSlots();
    }, [open, coachId]);

    // Compute which dates have available slots
    const availableDates = useMemo(() => {
        const dates = new Set();
        const now = new Date();
        freeSlots.forEach((slot) => {
            if (new Date(slot.endTime) > now) {
                dates.add(format(new Date(slot.startTime), "yyyy-MM-dd"));
            }
        });
        return dates;
    }, [freeSlots]);

    // Compute 30-min blocks for the selected date
    const dayTimeBlocks = useMemo(() => {
        if (!selectedDate) return [];
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const now = new Date();
        const minStartTime = now.getTime() + 15 * 60 * 1000; // 15-min buffer

        const uniqueSlots = new Map();
        freeSlots.forEach((slot) => {
            const start = new Date(slot.startTime);
            const slotDate = format(start, "yyyy-MM-dd");
            if (slotDate !== dateStr) return;
            if (new Date(slot.endTime) <= now) return;
            if (start.getTime() < minStartTime) return;
            uniqueSlots.set(start.getTime(), slot);
        });

        return [...uniqueSlots.values()].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    }, [selectedDate, freeSlots]);

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setSelectedSlotData(null);
        setError(null);
    };

    const isSlotSelected = (slot) => {
        if (!selectedSlotData?.blocks?.length) return false;
        return selectedSlotData.blocks.some((block) => block.startTime === slot.startTime);
    };

    const handleTimeSelect = (slotBlock) => {
        const chain = findConsecutiveBlocks(slotBlock, requiredBlocks, dayTimeBlocks);
        if (!chain) {
            setError(
                `Need ${requiredBlocks} consecutive 30-minute slot${requiredBlocks > 1 ? "s" : ""} for this ${durationMinutes}-minute session.`,
            );
            return;
        }

        setSelectedSlotData({
            startBlock: slotBlock,
            blocks: chain,
            startTime: new Date(slotBlock.startTime),
        });
    };

    const handleSubmit = async () => {
        if (!selectedSlotData || isReasonTooShort || isReasonTooLong || !trimmedReason) return;

        setIsSubmitting(true);
        try {
            await onSubmit({
                roomId: currentSession?.id || currentSession?.Id,
                newStartTime: selectedSlotData.startTime.toISOString(),
                reason: trimmedReason,
            });
            handleClose();
            window.location.reload();
        } catch (error) {
            console.error("Failed to submit reschedule request:", error);
            const backendMessage = error?.response?.data?.message;
            const validationErrors = error?.response?.data?.errors;
            const firstValidationMessage = validationErrors ? Object.values(validationErrors).flat()?.[0] : null;

            setError(backendMessage || firstValidationMessage || "Failed to submit request. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedDate(null);
        setSelectedSlotData(null);
        setReason("");
        setError(null);
        onClose();
    };

    const isFormValid = selectedSlotData && trimmedReason && !isReasonTooShort && !isReasonTooLong;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: (theme) => ({
                    ...dialogStyles.paper(theme),
                    maxHeight: "90vh",
                }),
            }}
        >
            {/* Header */}
            <Box sx={{ px: { xs: 3, md: 4 }, pt: 3, pb: 1, position: "relative" }}>
                <IconButton
                    onClick={handleClose}
                    sx={{
                        position: "absolute",
                        right: 20,
                        top: 20,
                        color: "text.secondary",
                        bgcolor: "action.hover",
                        "&:hover": { bgcolor: "action.selected" },
                    }}
                >
                    <CloseIcon />
                </IconButton>

                <AppText variant="overline" sx={{ color: "primary.main", mb: 0.75, letterSpacing: "1.2px" }}>
                    Request Reschedule
                </AppText>
                <AppText variant="bodyStrong" sx={{ fontSize: "1.35rem", fontWeight: 700, letterSpacing: "-0.01em" }}>
                    Select a New Time
                </AppText>
                <AppText variant="muted" sx={{ fontSize: "0.875rem", mt: 0.75, mb: 1 }}>
                    Current: {formattedDateTime(currentSession?.scheduledTime)} — {durationMinutes} min session
                </AppText>
            </Box>

            <DialogContent sx={{ overflowY: "auto", px: 0, pb: 0 }}>
                {error && (
                    <Box sx={{ px: { xs: 3, md: 4 }, mb: 2 }}>
                        <Alert severity="error" onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    </Box>
                )}

                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" py={10}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box sx={{ px: { xs: 3, md: 4 }, pb: 2.5 }}>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={0} sx={{ minHeight: 310 }}>
                            {/* Left: Calendar */}
                            <Box
                                sx={{
                                    flex: "0 0 auto",
                                    width: { xs: "100%", md: 340 },
                                    pr: { md: 4 },
                                    pb: { xs: 3, md: 0 },
                                    borderRight: { md: "1px solid" },
                                    borderColor: { md: "divider" },
                                }}
                            >
                                <CalendlyCalendar
                                    currentMonth={currentMonth}
                                    onPrevMonth={() => setCurrentMonth((m) => addMonths(m, -1))}
                                    onNextMonth={() => setCurrentMonth((m) => addMonths(m, 1))}
                                    selectedDate={selectedDate}
                                    onDateSelect={handleDateSelect}
                                    availableDates={availableDates}
                                />
                            </Box>

                            {/* Right: Time slots (30-min blocks) */}
                            <Box sx={{ flex: 1, pl: { md: 4 }, minWidth: 0 }}>
                                {!selectedDate ? (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            height: "100%",
                                            minHeight: 240,
                                        }}
                                    >
                                        <AppText variant="muted" sx={{ fontSize: "0.95rem" }}>
                                            Select a date to see available times
                                        </AppText>
                                    </Box>
                                ) : (
                                    <>
                                        <AppText variant="bodyStrong" sx={{ fontSize: "1rem", mb: 2.5 }}>
                                            {format(selectedDate, "EEEE, MMMM d")}
                                        </AppText>
                                        {dayTimeBlocks.length === 0 ? (
                                            <Box sx={{ textAlign: "center", py: 6 }}>
                                                <AppText variant="muted" sx={{ fontSize: "0.9rem" }}>
                                                    No available 30-minute slots on this date.
                                                </AppText>
                                            </Box>
                                        ) : (
                                            <Box className="calendly-timeslot-list">
                                                {dayTimeBlocks.map((slot) => {
                                                    const startTime = new Date(slot.startTime);
                                                    const endTime = new Date(slot.endTime);
                                                    const isSelected = isSlotSelected(slot);
                                                    return (
                                                        <Box
                                                            key={`${format(startTime, "yyyy-MM-dd-HH-mm")}-${slot.id || ""}`}
                                                            className={`calendly-timeslot ${isSelected ? "selected" : ""}`}
                                                            onClick={() => handleTimeSelect(slot)}
                                                        >
                                                            <AppText variant="bodyStrong" sx={{ fontSize: "0.95rem" }}>
                                                                {format(startTime, "HH:mm")} —{" "}
                                                                {format(endTime, "HH:mm")}
                                                            </AppText>
                                                        </Box>
                                                    );
                                                })}
                                            </Box>
                                        )}
                                    </>
                                )}
                            </Box>
                        </Stack>

                        {/* Reason Section */}
                        <Box sx={{ mt: 2.5, pt: 2.5, borderTop: "1px solid", borderColor: "divider" }}>
                            <AppText variant="bodyStrong" sx={{ mb: 1.5 }}>
                                Reason for Rescheduling{" "}
                                <Typography component="span" color="error.main">
                                    *
                                </Typography>
                            </AppText>
                            <FormTextField
                                fullWidth
                                multiline
                                rows={2}
                                placeholder="Why do you want to reschedule? Enter your reason here..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                error={isReasonTooShort || isReasonTooLong}
                                helperText={
                                    isReasonTooShort
                                        ? `Reason must be at least ${MIN_REASON_LENGTH} characters.`
                                        : isReasonTooLong
                                          ? `Reason must be at most ${MAX_REASON_LENGTH} characters.`
                                          : `${trimmedReason.length}/${MAX_REASON_LENGTH}`
                                }
                                inputProps={{ maxLength: MAX_REASON_LENGTH }}
                            />
                        </Box>
                    </Box>
                )}
            </DialogContent>

            {/* Actions */}
            <DialogActions sx={{ px: { xs: 3, md: 4 }, pb: 3, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
                <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                <PrimaryButton
                    onClick={handleSubmit}
                    disabled={!isFormValid || isSubmitting || loading}
                    endIcon={<SendIcon />}
                    loading={isSubmitting}
                >
                    {isSubmitting ? "Sending..." : "Send Request"}
                </PrimaryButton>
            </DialogActions>
        </Dialog>
    );
}

export default RescheduleRequestModal;
