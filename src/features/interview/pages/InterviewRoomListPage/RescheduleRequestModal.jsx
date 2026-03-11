import { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    Button,
    IconButton,
    TextField,
    Stack,
    Paper,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableRow,
    TableCell,
} from "@mui/material";
import { PrimaryButton, SecondaryButton } from "../../../../common/components/buttons";
import { dialogStyles } from "../../../../common/constants/uiStyles";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SendIcon from "@mui/icons-material/Send";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { formattedDateTime } from "../../../../common/utils/dateFormatter";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    addMonths,
    subMonths,
    getDay,
} from "date-fns";
import { enUS } from "date-fns/locale";

// Days of the week header
const DAYS_OF_WEEK = ["S", "M", "T", "W", "T", "F", "S"];

function RescheduleRequestModal({ open, onClose, onSubmit, currentSession }) {
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get coach ID from currentSession (handle both camelCase and PascalCase)
    const coachId = currentSession?.coachId || currentSession?.CoachId || currentSession?.coach?.id || currentSession?.Coach?.Id;

    // Debug: log currentSession to see available fields
    useEffect(() => {
        if (open && currentSession) {
            console.log("RescheduleModal - currentSession:", currentSession);
            console.log("RescheduleModal - coachId extracted:", coachId);
        }
    }, [open, currentSession, coachId]);

    // Fetch available slots when modal opens
    useEffect(() => {
        if (open && coachId) {
            fetchAvailableSlots();
        }
    }, [open, coachId]);

    // Reset state when modal closes
    useEffect(() => {
        if (!open) {
            setSelectedDate(null);
            setSelectedSlot(null);
            setReason("");
            setError(null);
        }
    }, [open]);

    const fetchAvailableSlots = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!coachId) {
                setError("Cannot find coach information for this interview");
                setLoading(false);
                return;
            }

            const today = new Date();
            const allSlots = [];

            console.log("Fetching slots for coachId:", coachId);

            // Fetch slots for next 3 months
            for (let i = 0; i < 3; i++) {
                const targetMonth = addMonths(today, i);
                const month = targetMonth.getMonth() + 1;
                const year = targetMonth.getFullYear();

                const response = await callApi({
                    method: METHOD.GET,
                    endpoint: `/availabilities/${coachId}?month=${month}&year=${year}`,
                });

                console.log(`Slots for ${month}/${year}:`, response);

                if (response.success && response.data) {
                    // Filter only available (not booked) slots
                    // Handle both isBooked and IsBooked (PascalCase)
                    const availableData = response.data.filter(
                        (slot) => {
                            const isBooked = slot.isBooked ?? slot.IsBooked ?? false;
                            const status = slot.status ?? slot.Status ?? 0;
                            return !isBooked && (status === 0 || status === undefined);
                        }
                    );
                    console.log(`Available slots for ${month}/${year}:`, availableData);
                    allSlots.push(...availableData);
                }
            }

            // Sort by start time
            allSlots.sort((a, b) => new Date(a.startTime || a.StartTime) - new Date(b.startTime || b.StartTime));
            console.log("Total available slots:", allSlots);
            setAvailableSlots(allSlots);
        } catch (err) {
            setError("Failed to load available slots: " + err.message);
            console.error("Error fetching slots:", err);
        } finally {
            setLoading(false);
        }
    };

    // Check if date is in the past
    const isPastDate = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate < today;
    };

    // Check if slot is in the past or too soon (< 15 min buffer)
    const isPastSlot = (slot) => {
        const startTime = slot.startTime || slot.StartTime;
        const slotTime = new Date(startTime);
        const now = new Date();
        return slotTime <= now || slotTime.getTime() - now.getTime() < 15 * 60 * 1000;
    };

    // Get unique dates from slots (excluding past dates)
    const getAvailableDates = () => {
        return availableSlots
            .map((slot) => {
                const startTime = slot.startTime || slot.StartTime;
                return new Date(startTime.split("T")[0]);
            })
            .filter((date, idx, arr) => {
                const isUnique = arr.findIndex((d) => isSameDay(d, date)) === idx;
                return isUnique && !isPastDate(date);
            });
    };

    // Get slots for selected date (excluding past slots)
    const getSlotsForDate = (date) => {
        return availableSlots.filter((slot) => {
            const startTime = slot.startTime || slot.StartTime;
            const slotDate = new Date(startTime.split("T")[0]);
            return isSameDay(slotDate, date) && !isPastSlot(slot);
        });
    };

    // Build calendar grid
    const getCalendarDays = () => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        const days = eachDayOfInterval({ start, end });

        // Add empty cells for days before month starts
        const firstDayOfWeek = getDay(start);
        const emptyDays = Array(firstDayOfWeek).fill(null);

        return [...emptyDays, ...days];
    };

    const handlePrevMonth = () => {
        setCurrentMonth(subMonths(currentMonth, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(addMonths(currentMonth, 1));
    };

    const handleDateClick = (date) => {
        if (isPastDate(date)) return;

        const slotsForThisDate = getSlotsForDate(date);
        if (slotsForThisDate.length > 0) {
            setSelectedDate(date);
            setSelectedSlot(null); // Reset selected slot when date changes
        }
    };

    const handleSlotClick = (slot) => {
        if (isPastSlot(slot)) return;
        setSelectedSlot(slot);
    };

    const parseTime = (isoString) => {
        if (!isoString) return "";
        const match = isoString.match(/T(\d{2}):(\d{2})/);
        if (!match) return "";
        const [, hour, minute] = match;
        return `${hour}:${minute}`;
    };

    const getSlotStartTime = (slot) => slot.startTime || slot.StartTime;
    const getSlotEndTime = (slot) => slot.endTime || slot.EndTime;

    const handleSubmit = async () => {
        if (!selectedSlot || !reason.trim()) return;

        setIsSubmitting(true);
        try {
            const startTime = selectedSlot.startTime || selectedSlot.StartTime;
            const slotId = selectedSlot.id || selectedSlot.Id;
            await onSubmit({
                roomId: currentSession?.id || currentSession?.Id,
                proposedAvailabilityId: slotId,
                reason: reason.trim(),
            });
            handleClose();
        } catch (error) {
            console.error("Failed to submit reschedule request:", error);
            setError("Failed to submit request. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedDate(null);
        setSelectedSlot(null);
        setReason("");
        setError(null);
        onClose();
    };

    const availableDates = getAvailableDates();
    const calendarDays = getCalendarDays();
    const slotsForSelectedDate = selectedDate ? getSlotsForDate(selectedDate) : [];
    const isFormValid = selectedSlot && reason.trim();

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
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    pb: 1,
                }}
            >
                <Box>
                    <Typography variant="h6" fontWeight={600}>
                        Request Reschedule
                    </Typography>
                    <Typography variant="body2" color="primary.main" sx={{ mt: 0.5 }}>
                        Current: {formattedDateTime(currentSession?.scheduledTime)}
                    </Typography>
                </Box>
                <IconButton onClick={handleClose} size="small" sx={{ color: "text.secondary" }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 2 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" py={8}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        {/* Date and Time Selection */}
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ mb: 3 }}>
                            {/* LEFT SIDE — CALENDAR */}
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                                    Select New Date
                                </Typography>

                                {/* Month Header */}
                                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                                    <IconButton size="small" onClick={handlePrevMonth}>
                                        <ChevronLeftIcon />
                                    </IconButton>
                                    <Typography variant="subtitle1" fontWeight={600}>
                                        {format(currentMonth, "MMMM yyyy", { locale: enUS })}
                                    </Typography>
                                    <IconButton size="small" onClick={handleNextMonth}>
                                        <ChevronRightIcon />
                                    </IconButton>
                                </Stack>

                                {/* Calendar Grid */}
                                <Table sx={{ borderCollapse: "separate", borderSpacing: "4px" }}>
                                    <TableBody>
                                        {/* Days of week header */}
                                        <TableRow>
                                            {DAYS_OF_WEEK.map((day, idx) => (
                                                <TableCell
                                                    key={idx}
                                                    align="center"
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: "text.secondary",
                                                        fontSize: "0.75rem",
                                                        p: 0.5,
                                                        border: "none",
                                                    }}
                                                >
                                                    {day}
                                                </TableCell>
                                            ))}
                                        </TableRow>

                                        {/* Calendar Days */}
                                        {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIdx) => (
                                            <TableRow key={weekIdx}>
                                                {calendarDays.slice(weekIdx * 7, weekIdx * 7 + 7).map((day, dayIdx) => {
                                                    const hasSlot = day && availableDates.some((d) => isSameDay(d, day));
                                                    const isSelected = day && selectedDate && isSameDay(day, selectedDate);
                                                    const isPast = day && isPastDate(day);

                                                    return (
                                                        <TableCell
                                                            key={dayIdx}
                                                            align="center"
                                                            sx={{
                                                                p: 0.5,
                                                                cursor: hasSlot && !isPast ? "pointer" : "default",
                                                                border: "none",
                                                                opacity: hasSlot && !isPast ? 1 : 0.4,
                                                            }}
                                                            onClick={() => hasSlot && !isPast && handleDateClick(day)}
                                                        >
                                                            {day ? (
                                                                <Box
                                                                    sx={{
                                                                        width: 32,
                                                                        height: 32,
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        justifyContent: "center",
                                                                        bgcolor: isSelected ? "primary.main" : "transparent",
                                                                        color: isSelected ? "white" : "text.primary",
                                                                        fontWeight: isSelected ? 600 : 500,
                                                                        borderRadius: "8px",
                                                                        fontSize: "0.875rem",
                                                                        transition: "all 0.2s",
                                                                        mx: "auto",
                                                                        "&:hover":
                                                                            hasSlot && !isPast
                                                                                ? {
                                                                                    bgcolor: isSelected
                                                                                        ? "primary.main"
                                                                                        : "primary.lighter",
                                                                                }
                                                                                : {},
                                                                    }}
                                                                >
                                                                    {format(day, "d")}
                                                                </Box>
                                                            ) : null}
                                                        </TableCell>
                                                    );
                                                })}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {availableDates.length === 0 && !loading && (
                                    <Paper sx={{ p: 2, mt: 2, textAlign: "center", bgcolor: "grey.50" }}>
                                        <Typography variant="body2" color="text.secondary">
                                            No available slots from this coach
                                        </Typography>
                                    </Paper>
                                )}
                            </Box>

                            {/* RIGHT SIDE — TIME SLOTS */}
                            <Box sx={{ width: { xs: "100%", sm: 280 } }}>
                                <Stack spacing={1.5}>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                                            Select Time Slot
                                        </Typography>
                                        {selectedDate ? (
                                            <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                                                {format(selectedDate, "EEEE, dd MMMM yyyy", { locale: enUS })}
                                            </Typography>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                Select a date first
                                            </Typography>
                                        )}
                                    </Box>

                                    <Box sx={{ maxHeight: 280, overflowY: "auto" }}>
                                        {slotsForSelectedDate.length > 0 ? (
                                            <Stack spacing={1}>
                                                {slotsForSelectedDate.map((slot) => {
                                                    const slotId = slot.id || slot.Id;
                                                    const selectedId = selectedSlot?.id || selectedSlot?.Id;
                                                    const isSelected = slotId === selectedId;

                                                    return (
                                                        <Paper
                                                            key={slotId}
                                                            onClick={() => handleSlotClick(slot)}
                                                            sx={{
                                                                p: 1.5,
                                                                cursor: "pointer",
                                                                border: "1px solid",
                                                                borderColor: isSelected ? "primary.main" : "divider",
                                                                bgcolor: isSelected ? "primary.main" : "background.paper",
                                                                transition: "all 0.2s ease-in-out",
                                                                "&:hover": {
                                                                    borderColor: "primary.main",
                                                                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                                                },
                                                            }}
                                                        >
                                                            <Stack
                                                                direction="row"
                                                                alignItems="center"
                                                                justifyContent="space-between"
                                                            >
                                                                <Stack direction="row" spacing={1} alignItems="center">
                                                                    <AccessTimeIcon
                                                                        fontSize="small"
                                                                        sx={{
                                                                            color: isSelected ? "white" : "primary.main",
                                                                        }}
                                                                    />
                                                                    <Typography
                                                                        variant="body2"
                                                                        fontWeight={600}
                                                                        color={isSelected ? "white" : "primary.main"}
                                                                    >
                                                                        {parseTime(getSlotStartTime(slot))} - {parseTime(getSlotEndTime(slot))}
                                                                    </Typography>
                                                                </Stack>
                                                                {isSelected && (
                                                                    <Box
                                                                        sx={{
                                                                            width: 20,
                                                                            height: 20,
                                                                            borderRadius: "50%",
                                                                            bgcolor: "white",
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            justifyContent: "center",
                                                                            fontSize: "12px",
                                                                            fontWeight: "bold",
                                                                            color: "primary.main",
                                                                        }}
                                                                    >
                                                                        ✓
                                                                    </Box>
                                                                )}
                                                            </Stack>
                                                        </Paper>
                                                    );
                                                })}
                                            </Stack>
                                        ) : (
                                            <Paper sx={{ p: 2, textAlign: "center", bgcolor: "grey.50" }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    {selectedDate
                                                        ? "No available slots for this date"
                                                        : "Select a date to see available times"}
                                                </Typography>
                                            </Paper>
                                        )}
                                    </Box>
                                </Stack>
                            </Box>
                        </Stack>

                        {/* Reason Section */}
                        <Box>
                            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                                Reason for Rescheduling{" "}
                                <Typography component="span" color="error.main">
                                    *
                                </Typography>
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                placeholder="Why do you want to reschedule? Enter your reason here..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "8px",
                                    },
                                }}
                            />
                        </Box>
                    </>
                )}
            </DialogContent>

            {/* Actions */}
            <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
                <SecondaryButton
                    onClick={handleClose}
                >
                    Cancel
                </SecondaryButton>
                <PrimaryButton
                    onClick={handleSubmit}
                    disabled={!isFormValid || isSubmitting || loading}
                    endIcon={<SendIcon />}
                    loading={isSubmitting}
                    sx={{ boxShadow: "none" }}
                >
                    {isSubmitting ? "Sending..." : "Send Request"}
                </PrimaryButton>
            </DialogActions>
        </Dialog>
    );
}

export default RescheduleRequestModal;
