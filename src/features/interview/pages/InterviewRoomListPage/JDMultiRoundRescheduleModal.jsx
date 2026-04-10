import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grow,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import SaveIcon from "@mui/icons-material/Save";
import { addMinutes, addMonths, format, isSameDay, subMonths } from "date-fns";
import { PrimaryButton, SecondaryButton } from "../../../../common/components/buttons";
import { dialogStyles } from "../../../../common/constants/uiStyles";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { INTERVIEW_ROOM_STATUS } from "../../../../common/constants/status";
import { formattedDateTime } from "../../../../common/utils/dateFormatter";
import CalendlyCalendar from "../../../../common/components/CalendlyCalendar";
import "../../../profiles/coach/page/PublicInterviewerProfilePage/JDBookingDialog.css";

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

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Grow ref={ref} {...props} timeout={400} />;
});

function RoundItem({ plan, isActive, isLast, onActivate, onDeselect }) {
    const isDone = Boolean(plan.selected && plan.newStartTime);
    const currentStart = toDate(plan.currentStartTime);

    let statusClass = "";
    if (!plan.canSelect) statusClass = "disabled";
    else if (isActive) statusClass = "current active";
    else if (isDone) statusClass = "done";

    return (
        <Box sx={{ position: "relative" }}>
            <Box
                className={`jd-schedule-item ${statusClass}`}
                onClick={() => {
                    if (plan.canSelect) onActivate(plan.roomId);
                }}
                sx={{ cursor: plan.canSelect ? "pointer" : "not-allowed" }}
            >
                <Box className="jd-schedule-marker">
                    {isDone && !isActive ? (
                        <CheckIcon sx={{ fontSize: 14 }} />
                    ) : (
                        <Typography sx={{ fontWeight: 800, fontSize: "0.875rem", lineHeight: 1 }}>
                            {plan.roundNumber}
                        </Typography>
                    )}
                </Box>

                <Box sx={{ flex: 1, minWidth: 0, pr: isActive || plan.selected ? 3 : 0 }}>
                    <Box
                        sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            px: 0.75,
                            py: 0.2,
                            borderRadius: "4px",
                            bgcolor: "rgba(99,102,241,0.08)",
                            border: "1px solid rgba(99,102,241,0.12)",
                            mb: 0.5,
                        }}
                    >
                        <Typography
                            sx={{
                                fontWeight: 900,
                                fontSize: "0.58rem",
                                color: "#4f46e5",
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                            }}
                        >
                            ROUND {plan.roundNumber} · {plan.durationMinutes}min
                        </Typography>
                    </Box>
                    <Typography
                        sx={{
                            fontSize: "0.875rem",
                            fontWeight: 700,
                            color: "#1e293b",
                            lineHeight: 1.25,
                            mb: 0.3,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {plan.title}
                    </Typography>
                    <Typography sx={{ fontSize: "0.7rem", color: "#64748b", lineHeight: 1.4 }}>
                        {isDone
                            ? `→ ${formattedDateTime(plan.newStartTime.toISOString())}`
                            : plan.disabledReason
                              ? plan.disabledReason
                              : currentStart
                                ? `Now: ${formattedDateTime(currentStart.toISOString())}`
                                : "—"}
                    </Typography>
                </Box>

                {isActive && (
                    <Box
                        sx={{
                            position: "absolute",
                            top: 8,
                            right: plan.selected ? 28 : 8,
                            px: 0.75,
                            py: 0.35,
                            bgcolor: "rgba(245,158,11,0.12)",
                            borderRadius: "5px",
                            border: "1px solid rgba(245,158,11,0.25)",
                        }}
                    >
                        <Typography
                            sx={{ fontSize: "0.5rem", fontWeight: 900, color: "#b45309", letterSpacing: "0.06em" }}
                        >
                            EDITING
                        </Typography>
                    </Box>
                )}

                {plan.selected && (
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeselect(plan.roomId);
                        }}
                        sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            width: 18,
                            height: 18,
                            color: "#94a3b8",
                            "&:hover": { color: "#ef4444", bgcolor: "rgba(239,68,68,0.08)" },
                        }}
                    >
                        <CloseIcon sx={{ fontSize: 11 }} />
                    </IconButton>
                )}
            </Box>

            {!isLast && <Box sx={{ width: "2px", height: 12, bgcolor: "#e2e8f0", ml: "31px" }} />}
        </Box>
    );
}

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
        currentSession?.coachId || currentSession?.CoachId || currentSession?.coach?.id || currentSession?.Coach?.Id;

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

    // Time ranges already claimed by other (non-active) selected rounds.
    // Used to prevent double-booking the same slot across rounds.
    const excludedTimeRanges = useMemo(
        () =>
            roundPlans
                .filter((p) => p.selected && p.newStartTime && p.roomId !== activeRoundId)
                .map((p) => ({
                    start: p.newStartTime,
                    end: addMinutes(p.newStartTime, p.durationMinutes),
                })),
        [roundPlans, activeRoundId],
    );

    /**
     * Merges individual 30-min availability blocks into contiguous windows,
     * then generates all valid start times for a session of `durationMinutes`.
     * Slots that overlap with already-booked rounds are excluded.
     */
    const getTimeOptionsForDate = (date, durationMinutes) => {
        if (!date || !durationMinutes) return [];

        const now = new Date();

        // Collect and sort all blocks on this day
        const dayBlocks = availableSlots
            .map((s) => ({ start: toDate(s.startTime), end: toDate(s.endTime) }))
            .filter(({ start, end }) => start && end && isSameDay(start, date))
            .sort((a, b) => a.start - b.start);

        if (dayBlocks.length === 0) return [];

        // Merge consecutive / overlapping blocks into contiguous windows
        const windows = [];
        let current = { start: new Date(dayBlocks[0].start), end: new Date(dayBlocks[0].end) };
        for (let i = 1; i < dayBlocks.length; i++) {
            const next = dayBlocks[i];
            if (next.start <= current.end) {
                // Adjacent or overlapping — extend the current window
                if (next.end > current.end) current.end = new Date(next.end);
            } else {
                windows.push(current);
                current = { start: new Date(next.start), end: new Date(next.end) };
            }
        }
        windows.push(current);

        // Generate start options from each merged window
        const options = [];
        for (const win of windows) {
            const latestStart = new Date(win.end.getTime() - durationMinutes * 60 * 1000);
            if (latestStart < win.start) continue; // Window too short for this duration

            for (
                let cursor = new Date(win.start);
                cursor <= latestStart;
                cursor = addMinutes(cursor, SLOT_STEP_MINUTES)
            ) {
                if (cursor <= now) continue;
                const optionEnd = addMinutes(cursor, durationMinutes);

                // Skip if this slot overlaps an already-booked round
                const blocked = excludedTimeRanges.some((r) => cursor < r.end && optionEnd > r.start);
                if (blocked) continue;

                options.push({ key: cursor.toISOString(), start: new Date(cursor), end: optionEnd });
            }
        }

        // Deduplicate by start time (shouldn't happen after merging, but kept for safety)
        const seen = new Set();
        const uniqueOptions = [];
        for (const opt of options) {
            if (seen.has(opt.start.getTime())) continue;
            seen.add(opt.start.getTime());
            uniqueOptions.push(opt);
        }

        return uniqueOptions; // already sorted (windows are sorted, cursor increments forward)
    };

    const availableDatesForActiveRound = useMemo(() => {
        if (!activeRound) return [];

        const dateMap = new Map();
        for (const slot of availableSlots) {
            const slotStart = toDate(slot.startTime);
            if (!slotStart) continue;
            const dayKey = format(slotStart, "yyyy-MM-dd");
            if (!dateMap.has(dayKey)) dateMap.set(dayKey, slotStart);
        }

        return Array.from(dateMap.values()).filter(
            (date) => getTimeOptionsForDate(date, activeRound.durationMinutes).length > 0,
        );
    }, [availableSlots, activeRound, excludedTimeRanges]);

    const availableDatesSet = useMemo(() => {
        const set = new Set();
        for (const date of availableDatesForActiveRound) {
            set.add(format(date, "yyyy-MM-dd"));
        }
        return set;
    }, [availableDatesForActiveRound]);

    const timeOptionsForSelectedDate = useMemo(() => {
        if (!selectedDate || !activeRound) return [];
        return getTimeOptionsForDate(selectedDate, activeRound.durationMinutes);
    }, [selectedDate, activeRound, availableSlots, excludedTimeRanges]);

    // Activate a round (auto-select if not yet selected). Resets date when switching rounds.
    const handleSetActiveRound = (roomId) => {
        const target = roundPlans.find((plan) => plan.roomId === roomId);
        if (!target || !target.canSelect) return;
        if (!target.selected) {
            setRoundPlans((prev) => prev.map((plan) => (plan.roomId === roomId ? { ...plan, selected: true } : plan)));
        }
        if (roomId !== activeRoundId) {
            setSelectedDate(null);
        }
        setActiveRoundId(roomId);
    };

    // Deselect a round (× button), clear its time, and switch active to another.
    const handleDeselectRound = (roomId) => {
        setRoundPlans((prev) =>
            prev.map((plan) => (plan.roomId === roomId ? { ...plan, selected: false, newStartTime: null } : plan)),
        );

        if (activeRoundId === roomId) {
            const remaining = roundPlans.filter((p) => p.selected && p.roomId !== roomId);
            const next =
                remaining[0]?.roomId ?? roundPlans.find((p) => p.canSelect && p.roomId !== roomId)?.roomId ?? null;
            setActiveRoundId(next);
            setSelectedDate(null);
        }
    };

    const handlePickTimeOption = (option) => {
        if (!activeRound) return;
        setRoundPlans((prev) =>
            prev.map((plan) =>
                plan.roomId === activeRound.roomId ? { ...plan, selected: true, newStartTime: option.start } : plan,
            ),
        );
    };

    const validateBeforeSubmit = () => {
        const selectedRounds = roundPlans.filter((plan) => plan.selected);
        if (selectedRounds.length === 0) return "Select at least one round to reschedule.";

        const missingRounds = selectedRounds.filter((plan) => !plan.newStartTime).map((plan) => plan.roundNumber);
        if (missingRounds.length > 0) return `Please choose a new time for round ${missingRounds.join(", ")}.`;

        const unchangedRounds = selectedRounds
            .filter((plan) => {
                const oldTime = toDate(plan.currentStartTime);
                return oldTime && plan.newStartTime && oldTime.getTime() === plan.newStartTime.getTime();
            })
            .map((plan) => plan.roundNumber);
        if (unchangedRounds.length > 0)
            return `Round ${unchangedRounds.join(", ")} must differ from the current schedule.`;

        const now = new Date();
        const timeline = [...roundPlans]
            .sort((a, b) => a.roundNumber - b.roundNumber)
            .map((plan) => {
                const start = plan.selected ? plan.newStartTime : toDate(plan.currentStartTime);
                if (!start) return null;
                return { roundNumber: plan.roundNumber, start, end: addMinutes(start, plan.durationMinutes) };
            });

        if (timeline.some((e) => !e)) return "Some rounds are missing scheduled time information.";

        for (const plan of selectedRounds) {
            if (plan.newStartTime <= now) return `Round ${plan.roundNumber} must be scheduled in the future.`;
        }

        // Validate gap time 15mins
        // for (let i = 1; i < timeline.length; i++) {
        //     const prev = timeline[i - 1];
        //     const curr = timeline[i];
        //     if (curr.start.getTime() < prev.end.getTime() + SLOT_STEP_MINUTES * 60 * 1000) {
        //         return `Round ${curr.roundNumber} must start at least 15 minutes after round ${prev.roundNumber}.`;
        //     }
        // }

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
        if (!isSubmitting) onClose();
    };

    const selectedTimeKey = activeRound?.newStartTime ? activeRound.newStartTime.getTime() : null;
    const selectedRoundsCount = roundPlans.filter((p) => p.selected).length;
    const doneRoundsCount = roundPlans.filter((p) => p.selected && p.newStartTime).length;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="lg"
            fullWidth
            TransitionComponent={Transition}
            PaperProps={{
                className: "jd-booking-dialog-paper",
                sx: (theme) => ({
                    ...dialogStyles.paper(theme),
                    maxHeight: "90vh",
                }),
            }}
        >
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    pb: 1.5,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                }}
            >
                <Box>
                    <Typography variant="h6" fontWeight={800} sx={{ fontSize: "1.1rem" }}>
                        Reschedule Interview Rounds
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                        Click a round · pick a date · select a time — repeat for each round
                    </Typography>
                </Box>
                <IconButton onClick={handleClose} size="small" disabled={isSubmitting} sx={{ mt: -0.5 }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {error && (
                    <Alert severity="error" sx={{ mx: 3, mt: 2, borderRadius: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {loadingSlots ? (
                    <Box display="flex" justifyContent="center" alignItems="center" gap={2} py={10}>
                        <CircularProgress size={24} />
                        <Typography variant="body2" color="text.secondary">
                            Loading coach availability…
                        </Typography>
                    </Box>
                ) : (
                    <Stack direction="row" sx={{ flex: 1, overflow: "hidden", minHeight: 460 }}>
                        {/* ── Left: round list ── */}
                        <Box
                            sx={{
                                width: 350,
                                flexShrink: 0,
                                borderRight: "1px solid",
                                borderColor: "divider",
                                overflowY: "auto",
                                p: 2.5,
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
                            <Typography className="jd-label-mini" sx={{ mb: 1.5 }}>
                                ROUNDS TO RESCHEDULE
                            </Typography>

                            {roundPlans.map((plan, i) => (
                                <RoundItem
                                    key={plan.roomId}
                                    plan={plan}
                                    isActive={plan.roomId === activeRoundId}
                                    isLast={i === roundPlans.length - 1}
                                    onActivate={handleSetActiveRound}
                                    onDeselect={handleDeselectRound}
                                />
                            ))}

                            {selectedRoundsCount > 0 && (
                                <Box
                                    sx={{
                                        mt: 2,
                                        p: 1.5,
                                        bgcolor: "#f8fafc",
                                        border: "1px solid #e2e8f0",
                                        borderRadius: 2,
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontSize: "0.65rem",
                                            fontWeight: 800,
                                            color: "#64748b",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.05em",
                                            mb: 0.5,
                                        }}
                                    >
                                        PROGRESS
                                    </Typography>
                                    <Typography sx={{ fontSize: "0.8rem", color: "#1e293b", fontWeight: 700 }}>
                                        {doneRoundsCount} / {selectedRoundsCount} round
                                        {selectedRoundsCount > 1 ? "s" : ""} scheduled
                                    </Typography>
                                </Box>
                            )}

                            {roundPlans.length > 0 && selectedRoundsCount === 0 && (
                                <Box
                                    sx={{
                                        mt: 2,
                                        p: 1.5,
                                        bgcolor: "rgba(99,102,241,0.04)",
                                        border: "1px dashed rgba(99,102,241,0.2)",
                                        borderRadius: 2,
                                    }}
                                >
                                    <Typography sx={{ fontSize: "0.75rem", color: "#64748b", lineHeight: 1.5 }}>
                                        Click any round card above to start scheduling a new time.
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        {/* ── Middle: Calendar ── */}
                        <Box
                            sx={{
                                flex: 1,
                                overflowY: "auto",
                                px: 3,
                                py: 2.5,
                                borderRight: "1px solid",
                                borderColor: "divider",
                            }}
                        >
                            {activeRound ? (
                                <>
                                    <Typography className="jd-label-mini" sx={{ mb: 1.5 }}>
                                        {`SELECT DATE — ROUND ${activeRound.roundNumber}`}
                                    </Typography>
                                    <CalendlyCalendar
                                        currentMonth={currentMonth}
                                        onPrevMonth={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                        onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                        selectedDate={selectedDate}
                                        onDateSelect={setSelectedDate}
                                        availableDates={availableDatesSet}
                                    />
                                </>
                            ) : (
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        height: "100%",
                                    }}
                                >
                                    <Typography sx={{ fontSize: "0.875rem", color: "#94a3b8", textAlign: "center" }}>
                                        No rounds available to reschedule
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        {/* ── Right: Time slots ── */}
                        <Box
                            sx={{
                                width: 270,
                                flexShrink: 0,
                                overflowY: "auto",
                                px: 2.5,
                                py: 2.5,
                            }}
                        >
                            <Typography className="jd-label-mini" sx={{ mb: 1.5 }}>
                                {selectedDate && activeRound ? `ROUND ${activeRound.roundNumber} TIMES` : "TIME SLOT"}
                            </Typography>

                            {!activeRound ? (
                                <Typography sx={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                                    Select a round first
                                </Typography>
                            ) : !selectedDate ? (
                                <Typography sx={{ fontSize: "0.8rem", color: "#94a3b8", lineHeight: 1.6 }}>
                                    Pick a date on the calendar to see available times
                                </Typography>
                            ) : timeOptionsForSelectedDate.length === 0 ? (
                                <Box
                                    sx={{
                                        p: 1.5,
                                        bgcolor: "#f8fafc",
                                        borderRadius: 2,
                                        border: "1px solid #e2e8f0",
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontSize: "0.78rem",
                                            color: "#94a3b8",
                                            textAlign: "center",
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        No slots fit this round&apos;s duration on this date
                                    </Typography>
                                </Box>
                            ) : (
                                <>
                                    <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8", mb: 1.25 }}>
                                        {format(selectedDate, "EEE, MMM d")} · {activeRound.durationMinutes}min
                                    </Typography>
                                    <div className="calendly-timeslot-list">
                                        {timeOptionsForSelectedDate.map((option) => {
                                            const isSelected = selectedTimeKey === option.start.getTime();
                                            return (
                                                <div
                                                    key={option.key}
                                                    className={`calendly-timeslot ${isSelected ? "selected" : ""}`}
                                                    onClick={() => handlePickTimeOption(option)}
                                                >
                                                    <Typography variant="body2" fontWeight={700}>
                                                        {format(option.start, "HH:mm")} – {format(option.end, "HH:mm")}
                                                    </Typography>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </Box>
                    </Stack>
                )}
            </DialogContent>

            <DialogActions
                className="jd-dialog-footer"
                sx={{ px: 3, py: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
                <Typography sx={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                    {selectedRoundsCount > 0
                        ? `${doneRoundsCount} / ${selectedRoundsCount} round${selectedRoundsCount > 1 ? "s" : ""} ready`
                        : "Select rounds to reschedule"}
                </Typography>
                <Stack direction="row" spacing={1.5}>
                    <SecondaryButton onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                    </SecondaryButton>
                    <PrimaryButton
                        onClick={handleSubmit}
                        disabled={loadingSlots || isSubmitting || doneRoundsCount === 0}
                        loading={isSubmitting}
                        endIcon={<SaveIcon />}
                    >
                        {isSubmitting ? "Saving…" : "Apply Reschedule"}
                    </PrimaryButton>
                </Stack>
            </DialogActions>
        </Dialog>
    );
}

export default JDMultiRoundRescheduleModal;
