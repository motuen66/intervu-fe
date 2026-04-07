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
    Button,
    Grid,
    Tooltip,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SaveIcon from "@mui/icons-material/Save";
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AssignmentIcon from '@mui/icons-material/Assignment';
import InfoIcon from '@mui/icons-material/Info';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { addMinutes, addMonths, endOfMonth, eachDayOfInterval, format, getDay, isSameDay, startOfMonth, subMonths } from "date-fns";
import { enUS } from "date-fns/locale";
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [roundPlans, setRoundPlans] = useState([]);
    const [activeRoundId, setActiveRoundId] = useState(null);
    const [newSchedules, setNewSchedules] = useState({});

    const coachId = currentSession?.coachId || currentSession?.CoachId || currentSession?.coach?.id || currentSession?.Coach?.Id;
    const bookingRequestId = currentSession?.bookingRequestId || currentSession?.BookingRequestId;

    useEffect(() => {
        if (!open) {
            setError(null);
            setAvailableSlots([]);
            setRoundPlans([]);
            setSelectedDate(null);
            setActiveRoundId(null);
            setCurrentMonth(new Date());
            setNewSchedules({});
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

    const activeRound = useMemo(() => roundPlans.find((plan) => plan.roomId === activeRoundId) ?? null, [roundPlans, activeRoundId]);

    const getTimeOptionsForDate = (date, durationMinutes) => {
        if (!date || !durationMinutes) return [];
        const options = [];
        const now = new Date();
        for (const slot of availableSlots) {
            const slotStart = toDate(slot.startTime);
            const slotEnd = toDate(slot.endTime);
            if (!slotStart || !slotEnd || !isSameDay(slotStart, date)) continue;
            const latestStart = new Date(slotEnd.getTime() - durationMinutes * 60 * 1000);
            for (let cursor = new Date(slotStart); cursor <= latestStart; cursor = addMinutes(cursor, SLOT_STEP_MINUTES)) {
                const optionEnd = addMinutes(cursor, durationMinutes);
                if (cursor <= now) continue;
                options.push({ key: `${slot.id}-${cursor.toISOString()}`, start: new Date(cursor), end: optionEnd });
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

    const availableDatesForActiveRound = useMemo(() => {
        if (!activeRound) return [];
        const dateMap = new Map();
        for (const slot of availableSlots) {
            const slotStart = toDate(slot.startTime);
            if (!slotStart) continue;
            const dayKey = format(slotStart, "yyyy-MM-dd");
            if (!dateMap.has(dayKey)) dateMap.set(dayKey, slotStart);
        }
        return Array.from(dateMap.values()).filter((date) => getTimeOptionsForDate(date, activeRound.durationMinutes).length > 0);
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
        return [...Array(firstDayOfWeek).fill(null), ...days];
    };

    const handleSelectRound = (roomId) => {
        setRoundPlans((prev) => {
            const target = prev.find((plan) => plan.roomId === roomId);
            if (!target || !target.canSelect) return prev;
            const shouldSelect = !target.selected;
            const updated = prev.map((plan) => (plan.roomId !== roomId ? plan : { ...plan, selected: shouldSelect }));
            if (shouldSelect) setActiveRoundId(roomId);
            else if (activeRoundId === roomId) setActiveRoundId(updated.find((p) => p.selected)?.roomId ?? null);
            return updated;
        });
    };

    const validateBeforeSubmit = () => {
        const selected = roundPlans.filter((p) => p.selected);
        if (selected.length === 0) return t("interview.list.jd_reschedule_modal.error_select_one");
        const missing = selected.filter((p) => !newSchedules[p.roomId]).map((p) => p.roundNumber);
        if (missing.length > 0) return t("interview.list.jd_reschedule_modal.error_missing_time", { rounds: missing.join(", ") });
        return null;
    };

    const handleSubmit = async () => {
        const validationError = validateBeforeSubmit();
        if (validationError) { setError(validationError); return; }
        setIsSubmitting(true);
        try {
            await onSubmit({
                type: "multi-round",
                bookingRequestId,
                rounds: roundPlans.filter((p) => p.selected).map((p) => ({ interviewRoomId: p.roomId, newStartTime: newSchedules[p.roomId].toISOString() })),
            });
            onClose();
        } catch (err) { setError(err?.response?.data?.message || err.message || "Failed to reschedule."); }
        finally { setIsSubmitting(false); }
    };

    const handleClose = () => { if (!isSubmitting) onClose(); };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth PaperProps={{ sx: (theme) => ({ ...dialogStyles.paper(theme), maxHeight: "92vh" }) }}>
            <DialogTitle sx={{ p: 3, pb: 2 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700} color="text.primary">{t("interview.list.jd_reschedule_modal.title")}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{t("interview.list.jd_reschedule_modal.subtitle")}</Typography>
                </Box>
                <IconButton onClick={handleClose} sx={{ position: 'absolute', right: 16, top: 16, color: 'text.secondary' }}><CloseIcon /></IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 2 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
                <Grid container spacing={3}>
                    <Grid item xs={12} md={5}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AssignmentIcon fontSize="small" color="primary" />
                            {t("interview.list.jd_reschedule_modal.select_rounds")}
                        </Typography>
                        <Stack spacing={1}>
                            {roundPlans.map((plan) => (
                                <Paper key={plan.roomId} onClick={() => plan.canSelect && setActiveRoundId(plan.roomId)} sx={{ p: 1.5, border: "1px solid", borderColor: plan.roomId === activeRoundId ? "primary.main" : "divider", cursor: plan.canSelect ? "pointer" : "default" }}>
                                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                        <Checkbox checked={plan.selected} disabled={!plan.canSelect} onChange={() => handleSelectRound(plan.roomId)} />
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle2" fontWeight={600}>{t("interview.list.jd_reschedule_modal.round_label", { number: plan.roundNumber, title: plan.title })}</Typography>
                                            <Typography variant="caption" color="text.secondary">{t("interview.list.jd_reschedule_modal.duration_label", { minutes: plan.durationMinutes })}</Typography>
                                            {newSchedules[plan.roomId] && <Typography variant="caption" color="success.main" display="block">{t("interview.list.jd_reschedule_modal.new_time", { time: formattedDateTime(newSchedules[plan.roomId].toISOString()) })}</Typography>}
                                        </Box>
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                    </Grid>
                    <Grid item xs={12} md={7}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarMonthIcon fontSize="small" color="primary" />
                            {t("interview.list.jd_reschedule_modal.pick_time")}
                        </Typography>
                        {activeRound ? (
                            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                <Box sx={{ flex: 1 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                        <IconButton onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeftIcon /></IconButton>
                                        <Typography variant="subtitle1" fontWeight={700}>{format(currentMonth, "MMMM yyyy")}</Typography>
                                        <IconButton onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRightIcon /></IconButton>
                                    </Stack>
                                    <Table>
                                        <TableBody>
                                            <TableRow>{DAYS_OF_WEEK.map((d, i) => <TableCell key={i} align="center" sx={{ p: 0.5, border: 0 }}>{d}</TableCell>)}</TableRow>
                                            {Array.from({ length: Math.ceil(getCalendarDays().length / 7) }).map((_, i) => (
                                                <TableRow key={i}>{getCalendarDays().slice(i * 7, i * 7 + 7).map((day, j) => (
                                                    <TableCell key={j} align="center" sx={{ p: 0.5, border: 0, cursor: day && availableDatesForActiveRound.some(d => isSameDay(d, day)) ? "pointer" : "default" }} onClick={() => day && setSelectedDate(day)}>
                                                        {day && <Box sx={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: selectedDate && isSameDay(day, selectedDate) ? 'primary.main' : 'transparent' }}>{format(day, 'd')}</Box>}
                                                    </TableCell>
                                                ))}</TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Box>
                                <Box sx={{ width: 200 }}>
                                    {timeOptionsForSelectedDate.map((opt) => (
                                        <Button key={opt.key} fullWidth variant={newSchedules[activeRound.roomId]?.getTime() === opt.start.getTime() ? "contained" : "outlined"} onClick={() => setNewSchedules(prev => ({ ...prev, [activeRound.roomId]: opt.start }))} sx={{ mb: 1 }}>
                                            {format(opt.start, "HH:mm")}
                                        </Button>
                                    ))}
                                </Box>
                            </Stack>
                        ) : (
                            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50', borderRadius: 2 }}>
                                <Typography color="text.secondary">{t("interview.list.jd_reschedule_modal.select_eligible_round")}</Typography>
                            </Box>
                        )}
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                <SecondaryButton onClick={handleClose}>{t("interview.list.jd_reschedule_modal.btn_cancel")}</SecondaryButton>
                <PrimaryButton onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? t("interview.list.jd_reschedule_modal.btn_saving") : t("interview.list.jd_reschedule_modal.btn_apply")}</PrimaryButton>
            </DialogActions>
        </Dialog>
    );
}

export default JDMultiRoundRescheduleModal;
