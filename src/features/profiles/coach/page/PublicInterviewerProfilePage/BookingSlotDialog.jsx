import { useEffect, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Stack,
    Paper,
    CircularProgress,
    Alert,
    IconButton,
    TableCell,
    Table,
    TableBody,
    TableRow,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { callApi } from "../../../../../common/utils/apiConnector";
import { METHOD } from "../../../../../common/constants/api";
import useLoading from "../../../../../common/hooks/useLoading";

const BookingSlotDialog = ({ open, onClose, interviewerId, onSlotSelected }) => {
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const isLoading = useLoading();

    // Fetch available slots
    useEffect(() => {
        if (open && interviewerId) {
            fetchAvailableSlots();
        }
    }, [open, interviewerId]);

    const fetchAvailableSlots = async () => {
        try {
            setLoading(true);
            setError(null);

            const today = new Date();
            const allSlots = [];

            // Fetch slots for next 3 months
            for (let i = 0; i < 3; i++) {
                const targetMonth = addMonths(today, i);
                const month = targetMonth.getMonth() + 1;
                const year = targetMonth.getFullYear();

                const response = await callApi({
                    method: METHOD.GET,
                    endpoint: `/availabilities/${interviewerId}?month=${month}&year=${year}`,
                });

                if (response.success && response.data) {
                    const availableData = response.data.filter((slot) => !slot.status || slot.status === 0);
                    allSlots.push(...availableData);
                }
            }

            allSlots.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
            setAvailableSlots(allSlots);

            // Set default to today
            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);
            setSelectedDate(todayDate);
        } catch (err) {
            setError("Error loading data: " + err.message);
            console.error("Error fetching slots:", err);
        } finally {
            setLoading(false);
        }
    };

    // Get unique dates from slots (excluding past dates)
    const getAvailableDates = () => {
        return availableSlots
            .map((slot) => new Date(slot.startTime.split("T")[0]))
            .filter((date, idx, arr) => {
                const isUnique = arr.findIndex((d) => isSameDay(d, date)) === idx;
                return isUnique && !isPastDate(date);
            });
    };

    // Get slots for selected date (excluding past slots)
    const getSlotsForDate = (date) => {
        return availableSlots.filter((slot) => {
            const slotDate = new Date(slot.startTime.split("T")[0]);
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
        // Don't allow selecting past dates
        if (isPastDate(date)) {
            return;
        }

        const slotsForThisDate = getSlotsForDate(date);
        if (slotsForThisDate.length > 0) {
            setSelectedDate(date);
        }
    };

    const handleSlotClick = (slot) => {
        // Check if slot is in the past
        if (isPastSlot(slot)) {
            return; // Don't allow selecting past slots
        }

        setSelectedSlot(slot);
    };

    const handleConfirmBooking = () => {
        if (selectedSlot && onSlotSelected) {
            onSlotSelected(selectedSlot);
            setSelectedSlot(null);
            onClose();
        }
    };

    const parseTime = (isoString) => {
        const match = isoString.match(/T(\d{2}):(\d{2})/);
        if (!match) return "";
        const [, hour, minute] = match;
        return `${hour}:${minute}`;
    };

    const isPastDate = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate < today; // Chỉ loại bỏ ngày quá khứ, cho phép hôm nay
    };

    const isPastSlot = (slot) => {
        const slotTime = new Date(slot.startTime);
        const now = new Date();
        // Loại bỏ slot nếu thời gian bắt đầu đã qua (cộng thêm buffer 15 phút để an toàn)
        return slotTime <= now || slotTime.getTime() - now.getTime() < 15 * 60 * 1000;
    };

    const availableDates = getAvailableDates();
    const calendarDays = getCalendarDays();
    const daysOfWeek = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const slotsForSelectedDate = selectedDate ? getSlotsForDate(selectedDate) : [];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 600, fontSize: "1.25rem", pb: 1 }}>Select Date & Time</DialogTitle>

            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)} />}

                    {loading ? (
                        <Box display="flex" justifyContent="center" py={6}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Stack direction="row" spacing={3}>
                            {/* LEFT SIDE — CALENDAR */}
                            <Box sx={{ flex: 1 }}>
                                <Stack spacing={2}>
                                    {/* Month Header */}
                                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                                        <IconButton size="small" onClick={handlePrevMonth}>
                                            <ChevronLeftIcon />
                                        </IconButton>
                                        <Typography variant="h6" fontWeight={600}>
                                            {format(currentMonth, "MMMM yyyy", { locale: enUS })}
                                        </Typography>
                                        <IconButton size="small" onClick={handleNextMonth}>
                                            <ChevronRightIcon />
                                        </IconButton>
                                    </Stack>

                                    {/* Calendar Grid */}
                                    <Table sx={{ borderCollapse: "separate", borderSpacing: "6px" }}>
                                        <TableBody>
                                            {/* Days of week header */}
                                            <TableRow>
                                                {daysOfWeek.map((day) => (
                                                    <TableCell
                                                        key={day}
                                                        align="center"
                                                        sx={{
                                                            fontWeight: 600,
                                                            color: "text.secondary",
                                                            fontSize: "0.875rem",
                                                            p: 0.5,
                                                            border: "none",
                                                        }}
                                                    >
                                                        {day}
                                                    </TableCell>
                                                ))}
                                            </TableRow>

                                            {/* Calendar Days */}
                                            {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map(
                                                (_, weekIdx) => (
                                                    <TableRow key={weekIdx}>
                                                        {calendarDays
                                                            .slice(weekIdx * 7, weekIdx * 7 + 7)
                                                            .map((day, dayIdx) => {
                                                                const hasSlot =
                                                                    day &&
                                                                    availableDates.some((d) => isSameDay(d, day));
                                                                const isSelected =
                                                                    day && selectedDate && isSameDay(day, selectedDate);

                                                                return (
                                                                    <TableCell
                                                                        key={dayIdx}
                                                                        align="center"
                                                                        sx={{
                                                                            p: 0.5,
                                                                            cursor: hasSlot ? "pointer" : "default",
                                                                            border: "none",
                                                                            opacity: hasSlot ? 1 : 0.4,
                                                                        }}
                                                                        onClick={() => hasSlot && handleDateClick(day)}
                                                                    >
                                                                        {day ? (
                                                                            <Box
                                                                                sx={{
                                                                                    width: "100%",
                                                                                    aspectRatio: "1",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center",
                                                                                    bgcolor: isSelected
                                                                                        ? "#4F46E5"
                                                                                        : "transparent",
                                                                                    color: isSelected
                                                                                        ? "white"
                                                                                        : "text.primary",
                                                                                    fontWeight: isSelected ? 600 : 500,
                                                                                    borderRadius: "8px",
                                                                                    fontSize: "0.875rem",
                                                                                    transition: "all 0.2s",
                                                                                    "&:hover": hasSlot
                                                                                        ? {
                                                                                              bgcolor: "#6366F1",
                                                                                              color: "white",
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
                                                ),
                                            )}
                                        </TableBody>
                                    </Table>
                                </Stack>
                            </Box>

                            {/* RIGHT SIDE — TIME SLOTS */}
                            <Box sx={{ width: 260 }}>
                                <Stack spacing={1.5}>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                                            Select Time
                                        </Typography>
                                        {selectedDate ? (
                                            <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                                                {format(selectedDate, "EEEE, dd MMMM yyyy", { locale: enUS })}
                                            </Typography>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                Select a date
                                            </Typography>
                                        )}
                                    </Box>

                                    <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
                                        {slotsForSelectedDate.length > 0 ? (
                                            <Stack spacing={1}>
                                                {slotsForSelectedDate.map((slot) => (
                                                    <Paper
                                                        key={slot.id}
                                                        onClick={() => handleSlotClick(slot)}
                                                        sx={{
                                                            p: 1.5,
                                                            cursor: "pointer",
                                                            border: "1px solid",
                                                            borderColor:
                                                                selectedSlot?.id === slot.id ? "#4F46E5" : "#E5E7EB",
                                                            bgcolor:
                                                                selectedSlot?.id === slot.id
                                                                    ? "#6366F1"
                                                                    : "background.paper",
                                                            transition: "all 0.2s ease-in-out",
                                                            "&:hover": {
                                                                borderColor: "#4F46E5",
                                                                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
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
                                                                        color:
                                                                            selectedSlot?.id === slot.id
                                                                                ? "white"
                                                                                : "#4F46E5",
                                                                    }}
                                                                />
                                                                <Typography
                                                                    variant="body2"
                                                                    fontWeight={600}
                                                                    color={
                                                                        selectedSlot?.id === slot.id
                                                                            ? "white"
                                                                            : "#4F46E5"
                                                                    }
                                                                >
                                                                    {parseTime(slot.startTime)} -{" "}
                                                                    {parseTime(slot.endTime)}
                                                                </Typography>
                                                            </Stack>
                                                            {selectedSlot?.id === slot.id && (
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
                                                                        color: "#4F46E5",
                                                                    }}
                                                                >
                                                                    ✓
                                                                </Box>
                                                            )}
                                                        </Stack>
                                                    </Paper>
                                                ))}
                                            </Stack>
                                        ) : (
                                            <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#F9FAFB" }}>
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
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} variant="outlined" color="inherit">
                    Cancel
                </Button>
                <Button
                    onClick={handleConfirmBooking}
                    variant="contained"
                    sx={{
                        backgroundColor: "#4F46E5",
                        color: "white",
                        fontWeight: 600,
                        "&:hover": {
                            backgroundColor: "#4338CA",
                        },
                        "&:disabled": {
                            backgroundColor: "#E5E7EB",
                            color: "#9CA3AF",
                        },
                    }}
                    loading={isLoading}
                >
                    Continue
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BookingSlotDialog;
