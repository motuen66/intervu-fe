import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SaveIcon from "@mui/icons-material/Save";
import { addMinutes, addMonths, endOfMonth, eachDayOfInterval, format, getDay, isSameDay, startOfMonth, subMonths } from "date-fns";
import { enUS } from "date-fns/locale";
import { PrimaryButton, SecondaryButton } from "../../../../common/components/buttons";
import { dialogStyles } from "../../../../common/constants/uiStyles";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { INTERVIEW_ROOM_STATUS } from "../../../../common/constants/status";
import { formattedDateTime } from "../../../../common/utils/dateFormatter";

const DAYS_OF_WEEK = ["S", "M", "T", "W", "T", "F", "S"];
const SLOT_STEP_MINUTES = 15;

const normalizeIso = (value) => (value && !value.endsWith("Z") ? `${value}Z` : value);

const toDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const getRoundDisabledReason = (round) => {
    if ((round.status ?? round.Status) !== INTERVIEW_ROOM_STATUS.SCHEDULED) {
        return "Only scheduled rounds can be rescheduled";
    }
    if (round.hasPendingReschedule) {
        return "This round already has a pending reschedule request";
    }
    if (!round.canReschedule) {
        return "This round cannot be rescheduled (already rescheduled or within 12 hours)";
    }
    return null;
};

function JDMultiRoundRescheduleModal({ open, onClose, onSubmit, currentSession }) {
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [roundPlans, setRoundPlans] = useState([]);
    const [activeRoundId, setActiveRoundId] = useState(null);

    const coachId =
        currentSession?.coachId ||
        currentSession?.CoachId ||
        currentSession?.coach?.id ||
        currentSession?.Coach?.Id;

    const bookingRequestId = currentSession?.bookingRequestId || currentSession?.BookingRequestId;

    useEffect(() => {
        if (!open) {
            setError(null);
            setAvailableSlots([]);
            setRoundPlans([]);
            setSelectedDate(null);
            setActiveRoundId(null);
            setCurrentMonth(new Date());
            return;
        }

        const rounds = Array.isArray(currentSession?.rounds) ? [...currentSession.rounds] : [];
        rounds.sort((a, b) => (a.roundNumber ?? 0) - (b.roundNumber ?? 0));

        const plans = rounds.map((round, index) => {
            const roomId = round.id || round.Id;
            const disabledReason = getRoundDisabledReason(round);

            return {
                roomId,
                roundNumber: round.roundNumber ?? index + 1,
                title: round.interviewTypeName || round.problemShortName || `Round ${index + 1}`,
                durationMinutes: round.durationMinutes ?? 60,
                currentStartTime: round.scheduledTime || round.ScheduledTime,
                selected: false,
                newStartTime: null,
                disabledReason,
                canSelect: !disabledReason,
            };
        });

        const firstSelectable = plans.find((plan) => plan.canSelect)?.roomId ?? null;
        setRoundPlans(plans);
        setActiveRoundId(firstSelectable);
    }, [open, currentSession]);

    useEffect(() => {
        if (!open || !coachId) return;

        const fetchAvailableSlots = async () => {
            setLoadingSlots(true);
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
                setAvailableSlots(allSlots);
            } catch (err) {
                setError(err?.response?.data?.message || err.message || "Failed to load coach available slots");
            } finally {
                setLoadingSlots(false);
            }
        };

        fetchAvailableSlots();
    }, [open, coachId]);

    const activeRound = useMemo(
        () => roundPlans.find((plan) => plan.roomId === activeRoundId) ?? null,
        [roundPlans, activeRoundId],
    );

    const getTimeOptionsForDate = (date, durationMinutes) => {
        if (!date || !durationMinutes) return [];

        const options = [];
        const now = new Date();

        for (const slot of availableSlots) {
            const slotStart = toDate(slot.startTime);
            const slotEnd = toDate(slot.endTime);

            if (!slotStart || !slotEnd || !isSameDay(slotStart, date)) continue;

            const latestStart = new Date(slotEnd.getTime() - durationMinutes * 60 * 1000);
            for (
                let cursor = new Date(slotStart);
                cursor <= latestStart;
                cursor = addMinutes(cursor, SLOT_STEP_MINUTES)
            ) {
                const optionEnd = addMinutes(cursor, durationMinutes);
                if (cursor <= now) continue;
                options.push({
                    key: `${slot.id}-${cursor.toISOString()}`,
                    start: new Date(cursor),
                    end: optionEnd,
                });
            }
        }

        const uniqueOptions = [];
        const seen = new Set();
        for (const option of options) {
            const key = option.start.getTime();
            if (seen.has(key)) continue;
            seen.add(key);
            uniqueOptions.push(option);
        }

        uniqueOptions.sort((a, b) => a.start - b.start);
        return uniqueOptions;
    };

    const hasTimeOptionsForDate = (date) => {
        if (!activeRound) return false;
        return getTimeOptionsForDate(date, activeRound.durationMinutes).length > 0;
    };

    const availableDatesForActiveRound = useMemo(() => {
        if (!activeRound) return [];

        const dateMap = new Map();
        for (const slot of availableSlots) {
            const slotStart = toDate(slot.startTime);
            if (!slotStart) continue;
            const dayKey = format(slotStart, "yyyy-MM-dd");
            if (!dateMap.has(dayKey)) {
                dateMap.set(dayKey, slotStart);
            }
        }

        return Array.from(dateMap.values()).filter((date) => hasTimeOptionsForDate(date));
    }, [availableSlots, activeRound]);

    const timeOptionsForSelectedDate = useMemo(() => {
        if (!selectedDate || !activeRound) return [];
        return getTimeOptionsForDate(selectedDate, activeRound.durationMinutes);
    }, [selectedDate, activeRound, availableSlots]);

    const getCalendarDays = () => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        const days = eachDayOfInterval({ start, end });
        const firstDayOfWeek = getDay(start);
        const emptyDays = Array(firstDayOfWeek).fill(null);
        return [...emptyDays, ...days];
    };

    const handleSelectRound = (roomId) => {
        setRoundPlans((prev) => {
            const target = prev.find((plan) => plan.roomId === roomId);
            if (!target || !target.canSelect) return prev;
            const shouldSelect = !target.selected;

            const updated = prev.map((plan) => {
                if (plan.roomId !== roomId) return plan;
                return {
                    ...plan,
                    selected: shouldSelect,
                    newStartTime: shouldSelect ? plan.newStartTime : null,
                };
            });

            if (shouldSelect) {
                setActiveRoundId(roomId);
                return updated;
            }

            const selectedPlans = updated.filter((plan) => plan.selected);
            if (!selectedPlans.some((plan) => plan.roomId === activeRoundId)) {
                setActiveRoundId(selectedPlans[0]?.roomId ?? updated.find((plan) => plan.canSelect)?.roomId ?? null);
            }

            return updated;
        });
    };

    const handleSetActiveRound = (roomId) => {
        const target = roundPlans.find((plan) => plan.roomId === roomId);
        if (!target || !target.selected) return;
        setActiveRoundId(roomId);
    };

    const handlePickTimeOption = (option) => {
        if (!activeRound) return;
        setRoundPlans((prev) =>
            prev.map((plan) =>
                plan.roomId === activeRound.roomId
                    ? { ...plan, selected: true, newStartTime: option.start }
                    : plan,
            ),
        );
    };

    const validateBeforeSubmit = () => {
        const selectedRounds = roundPlans.filter((plan) => plan.selected);
        if (selectedRounds.length === 0) {
            return "Select at least one round to reschedule.";
        }

        const missingRounds = selectedRounds.filter((plan) => !plan.newStartTime).map((plan) => plan.roundNumber);
        if (missingRounds.length > 0) {
            return `Please choose a new time for round ${missingRounds.join(", ")}.`;
        }

        const unchangedRounds = selectedRounds
            .filter((plan) => {
                const oldTime = toDate(plan.currentStartTime);
                if (!oldTime || !plan.newStartTime) return false;
                return oldTime.getTime() === plan.newStartTime.getTime();
            })
            .map((plan) => plan.roundNumber);

        if (unchangedRounds.length > 0) {
            return `Round ${unchangedRounds.join(", ")} must have a new time different from current schedule.`;
        }

        const now = new Date();
        const timeline = [...roundPlans]
            .sort((a, b) => a.roundNumber - b.roundNumber)
            .map((plan) => {
                const current = toDate(plan.currentStartTime);
                const start = plan.selected ? plan.newStartTime : current;
                if (!start) return null;
                return {
                    roundNumber: plan.roundNumber,
                    start,
                    end: addMinutes(start, plan.durationMinutes),
                };
            });

        if (timeline.some((entry) => !entry)) {
            return "Some rounds are missing scheduled time information.";
        }

        for (const plan of selectedRounds) {
            if (plan.newStartTime <= now) {
                return `Round ${plan.roundNumber} must be scheduled in the future.`;
            }
        }

        for (let i = 1; i < timeline.length; i++) {
            const prev = timeline[i - 1];
            const current = timeline[i];
            if (current.start.getTime() < prev.end.getTime() + SLOT_STEP_MINUTES * 60 * 1000) {
                return `Round ${current.roundNumber} must start at least 15 minutes after round ${prev.roundNumber}.`;
            }
        }

        return null;
    };

    const handleSubmit = async () => {
        const validationError = validateBeforeSubmit();
        if (validationError) {
            setError(validationError);
            return;
        }

        if (!bookingRequestId) {
            setError("Booking request information is missing.");
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            const selectedRounds = roundPlans.filter((plan) => plan.selected);
            await onSubmit({
                type: "multi-round",
                bookingRequestId,
                rounds: selectedRounds.map((plan) => ({
                    interviewRoomId: plan.roomId,
                    newStartTime: plan.newStartTime.toISOString(),
                })),
            });
            onClose();
        } catch (err) {
            setError(err?.response?.data?.message || err.message || "Failed to reschedule selected rounds.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (isSubmitting) return;
        onClose();
    };

    const calendarDays = getCalendarDays();
    const selectedTimeKey = activeRound?.newStartTime ? activeRound.newStartTime.getTime() : null;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: (theme) => ({
                    ...dialogStyles.paper(theme),
                    maxHeight: "92vh",
                }),
            }}
        >
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    pb: 1,
                }}
            >
                <Box>
                    <Typography variant="h6" fontWeight={700}>
                        Reschedule JD Multi-Round Booking
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Select one or more rounds, then choose new time slots from coach availability.
                    </Typography>
                </Box>
                <IconButton onClick={handleClose} size="small" disabled={isSubmitting}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 2 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.25 }}>
                        Select Rounds To Reschedule
                    </Typography>
                    <Stack spacing={1}>
                        {roundPlans.map((plan) => {
                            const currentStartDate = toDate(plan.currentStartTime);
                            const newStart = plan.newStartTime;
                            const isActive = plan.roomId === activeRoundId;
                            return (
                                <Paper
                                    key={plan.roomId}
                                    onClick={() => handleSetActiveRound(plan.roomId)}
                                    sx={{
                                        p: 1.5,
                                        border: "1px solid",
                                        borderColor: isActive ? "primary.main" : "divider",
                                        bgcolor: isActive ? "primary.lighter" : "background.paper",
                                        cursor: plan.selected ? "pointer" : "default",
                                    }}
                                >
                                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                        <Checkbox
                                            checked={plan.selected}
                                            disabled={!plan.canSelect || isSubmitting}
                                            onChange={() => handleSelectRound(plan.roomId)}
                                            sx={{ p: 0.25, mt: 0.15 }}
                                        />
                                        <Box sx={{ flex: 1 }}>
                                            <Stack
                                                direction={{ xs: "column", sm: "row" }}
                                                spacing={0.75}
                                                justifyContent="space-between"
                                            >
                                                <Typography variant="subtitle2" fontWeight={700}>
                                                    Round {plan.roundNumber}: {plan.title}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Duration: {plan.durationMinutes} min
                                                </Typography>
                                            </Stack>
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                Current: {currentStartDate ? formattedDateTime(currentStartDate.toISOString()) : "—"}
                                            </Typography>
                                            {plan.selected && newStart && (
                                                <Typography variant="body2" color="primary.main" fontWeight={600} sx={{ mt: 0.35 }}>
                                                    New: {formattedDateTime(newStart.toISOString())}
                                                </Typography>
                                            )}
                                            {plan.disabledReason && (
                                                <Typography variant="caption" color="error.main" sx={{ mt: 0.35, display: "block" }}>
                                                    {plan.disabledReason}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Stack>
                                </Paper>
                            );
                        })}
                    </Stack>
                </Box>

                {loadingSlots ? (
                    <Box display="flex" justifyContent="center" alignItems="center" py={6}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                                Calendar
                            </Typography>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.25 }}>
                                <IconButton size="small" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                                    <ChevronLeftIcon />
                                </IconButton>
                                <Typography variant="subtitle1" fontWeight={700}>
                                    {format(currentMonth, "MMMM yyyy", { locale: enUS })}
                                </Typography>
                                <IconButton size="small" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                                    <ChevronRightIcon />
                                </IconButton>
                            </Stack>

                            <Table sx={{ borderCollapse: "separate", borderSpacing: "4px" }}>
                                <TableBody>
                                    <TableRow>
                                        {DAYS_OF_WEEK.map((day) => (
                                            <TableCell
                                                key={day}
                                                align="center"
                                                sx={{
                                                    p: 0.4,
                                                    border: "none",
                                                    fontSize: "0.75rem",
                                                    fontWeight: 700,
                                                    color: "text.secondary",
                                                }}
                                            >
                                                {day}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                    {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIndex) => (
                                        <TableRow key={weekIndex}>
                                            {calendarDays.slice(weekIndex * 7, weekIndex * 7 + 7).map((day, dayIndex) => {
                                                const hasOptions = day && availableDatesForActiveRound.some((d) => isSameDay(d, day));
                                                const isSelected = day && selectedDate && isSameDay(day, selectedDate);
                                                return (
                                                    <TableCell
                                                        key={`${weekIndex}-${dayIndex}`}
                                                        align="center"
                                                        sx={{
                                                            p: 0.4,
                                                            border: "none",
                                                            opacity: hasOptions ? 1 : 0.35,
                                                            cursor: hasOptions ? "pointer" : "default",
                                                        }}
                                                        onClick={() => {
                                                            if (hasOptions) {
                                                                setSelectedDate(day);
                                                            }
                                                        }}
                                                    >
                                                        {day ? (
                                                            <Box
                                                                sx={{
                                                                    width: 32,
                                                                    height: 32,
                                                                    borderRadius: "8px",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    bgcolor: isSelected ? "primary.main" : "transparent",
                                                                    color: isSelected ? "common.white" : "text.primary",
                                                                    fontWeight: isSelected ? 700 : 500,
                                                                    mx: "auto",
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
                        </Box>

                        <Box sx={{ width: { xs: "100%", md: 360 } }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                                {activeRound
                                    ? `Pick Time For Round ${activeRound.roundNumber}`
                                    : "Pick Time"}
                            </Typography>

                            {!activeRound ? (
                                <Paper sx={{ p: 2, textAlign: "center", bgcolor: "grey.50" }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Select at least one eligible round first.
                                    </Typography>
                                </Paper>
                            ) : (
                                <>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        {selectedDate
                                            ? format(selectedDate, "EEEE, dd MMM yyyy", { locale: enUS })
                                            : "Choose a date from calendar"}
                                    </Typography>
                                    <Box sx={{ maxHeight: 320, overflowY: "auto" }}>
                                        {timeOptionsForSelectedDate.length === 0 ? (
                                            <Paper sx={{ p: 2, textAlign: "center", bgcolor: "grey.50" }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    {selectedDate
                                                        ? "No valid start times for this round on the selected day."
                                                        : "Select a date to see valid time options."}
                                                </Typography>
                                            </Paper>
                                        ) : (
                                            <Stack spacing={1}>
                                                {timeOptionsForSelectedDate.map((option) => {
                                                    const isSelected = selectedTimeKey === option.start.getTime();
                                                    return (
                                                        <Paper
                                                            key={option.key}
                                                            onClick={() => handlePickTimeOption(option)}
                                                            sx={{
                                                                p: 1.25,
                                                                border: "1px solid",
                                                                borderColor: isSelected ? "primary.main" : "divider",
                                                                bgcolor: isSelected ? "primary.main" : "background.paper",
                                                                color: isSelected ? "common.white" : "text.primary",
                                                                cursor: "pointer",
                                                            }}
                                                        >
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <AccessTimeIcon
                                                                    fontSize="small"
                                                                    sx={{ color: isSelected ? "common.white" : "primary.main" }}
                                                                />
                                                                <Typography variant="body2" fontWeight={700}>
                                                                    {format(option.start, "HH:mm")} - {format(option.end, "HH:mm")}
                                                                </Typography>
                                                            </Stack>
                                                        </Paper>
                                                    );
                                                })}
                                            </Stack>
                                        )}
                                    </Box>
                                </>
                            )}
                        </Box>
                    </Stack>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                <SecondaryButton onClick={handleClose} disabled={isSubmitting}>
                    Cancel
                </SecondaryButton>
                <PrimaryButton
                    onClick={handleSubmit}
                    disabled={loadingSlots || isSubmitting}
                    loading={isSubmitting}
                    endIcon={<SaveIcon />}
                >
                    {isSubmitting ? "Saving..." : "Apply Reschedule"}
                </PrimaryButton>
            </DialogActions>
        </Dialog>
    );
}

export default JDMultiRoundRescheduleModal;
