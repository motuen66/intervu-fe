import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
    Chip,
    Stepper,
    Step,
    StepLabel,
    Divider,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CodeIcon from "@mui/icons-material/Code";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { addMonths, addMinutes, format } from "date-fns";
import { callApi } from "../../../../../common/utils/apiConnector";
import { METHOD } from "../../../../../common/constants/api";
import { getCoachInterviewServices } from "../../../../coach/services/coachInterviewServiceApi";
import toast from "react-hot-toast";
import { PrimaryButton, SecondaryButton } from "../../../../../common/components/buttons";
import "./BookingSlotDialog.css";
import StatusChip from "../../../../../common/components/StatusChip";

const STEPS = ["Select Service", "Pick Time on Calendar"];

const BookingSlotDialog = ({ open, onClose, interviewerId, onSlotSelected }) => {
    // Step management
    const [activeStep, setActiveStep] = useState(0);

    // Step 1 — Service selection
    const [services, setServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(false);
    const [selectedService, setSelectedService] = useState(null);

    // Step 2 — Calendar & time picking
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedStartTime, setSelectedStartTime] = useState(null);
    const [containingSlot, setContainingSlot] = useState(null);

    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const calendarRef = useRef(null);

    // ─── Data Fetching ─────────────────────────────────
    useEffect(() => {
        if (open && interviewerId) {
            loadServices();
            fetchAvailableSlots();
        }
        if (!open) {
            // Reset state when dialog closes
            setActiveStep(0);
            setSelectedService(null);
            setSelectedStartTime(null);
            setContainingSlot(null);
            setError(null);
        }
    }, [open, interviewerId]);

    const loadServices = async () => {
        setLoadingServices(true);
        try {
            const data = await getCoachInterviewServices(interviewerId);
            setServices(data || []);
        } catch (err) {
            console.error("Error fetching services:", err);
        } finally {
            setLoadingServices(false);
        }
    };

    const fetchAvailableSlots = async () => {
        try {
            setLoadingSlots(true);
            setError(null);

            const today = new Date();
            const allSlots = [];

            for (let i = 0; i < 3; i++) {
                const targetMonth = addMonths(today, i);
                const month = targetMonth.getMonth() + 1;
                const year = targetMonth.getFullYear();

                const response = await callApi({
                    method: METHOD.GET,
                    endpoint: `/availabilities/${interviewerId}/free-slots?month=${month}&year=${year}`,
                });

                if (response.success && response.data) {
                    // free-slots endpoint already returns only available slots
                    // Normalize timestamps
                    const normalized = response.data.map((slot) => ({
                        ...slot,
                        startTime:
                            slot.startTime && !slot.startTime.endsWith("Z") ? slot.startTime + "Z" : slot.startTime,
                        endTime: slot.endTime && !slot.endTime.endsWith("Z") ? slot.endTime + "Z" : slot.endTime,
                    }));
                    allSlots.push(...normalized);
                }
            }

            allSlots.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
            setAvailableSlots(allSlots);
        } catch (err) {
            setError("Error loading availability: " + err.message);
            console.error("Error fetching slots:", err);
        } finally {
            setLoadingSlots(false);
        }
    };

    // ─── Calendar Events ───────────────────────────────
    const calendarEvents = useMemo(() => {
        const now = new Date();
        // Background events for available slots
        const bgEvents = availableSlots
            .filter((slot) => new Date(slot.endTime) > now)
            .map((slot) => ({
                id: `bg-${slot.id}-${slot.startTime}`,
                start: slot.startTime,
                end: slot.endTime,
                display: "background",
                backgroundColor: "#6366f1",
                groupId: "availability",
                editable: false,
                extendedProps: { slotId: slot.id, type: "availability" },
            }));

        // Preview event for selected time
        const previewEvents = [];
        if (selectedStartTime && selectedService && containingSlot) {
            const endTime = addMinutes(selectedStartTime, selectedService.durationMinutes);
            previewEvents.push({
                id: "booking-preview",
                title: `${selectedService.interviewType?.name || selectedService.name || "Interview"} (${selectedService.durationMinutes}m)`,
                start: selectedStartTime.toISOString(),
                end: endTime.toISOString(),
                backgroundColor: "var(--mui-palette-primary-main)",
                borderColor: "var(--mui-palette-primary-main)",
                textColor: "#fff",
                classNames: ["booking-preview"],
                editable: true,
                durationEditable: false,
            });
        }

        return [...bgEvents, ...previewEvents];
    }, [availableSlots, selectedStartTime, selectedService, containingSlot]);

    // ─── Time Selection Logic ──────────────────────────
    const handleCalendarDateClick = useCallback(
        (info) => {
            if (!selectedService) {
                toast.error("Please select a service first");
                return;
            }

            const clickedTime = info.date;
            const now = new Date();

            // Must be in the future (with 15-min buffer)
            if (clickedTime.getTime() - now.getTime() < 15 * 60 * 1000) {
                toast.error("Please select a time at least 15 minutes from now");
                return;
            }

            // Snap to nearest 15 minutes (floor)
            const minutes = clickedTime.getMinutes();
            const snappedMinutes = Math.floor(minutes / 15) * 15;
            const snappedTime = new Date(clickedTime);
            snappedTime.setMinutes(snappedMinutes, 0, 0);

            const endTime = addMinutes(snappedTime, selectedService.durationMinutes);
            // Calculate the end time buffer after the interview (matches backend rule)
            const endTimeWithBuffer = addMinutes(snappedTime, selectedService.durationMinutes);

            // Find the containing availability slot — must fit session + buffer
            const matchingSlot = availableSlots.find((slot) => {
                const slotStart = new Date(slot.startTime);
                const slotEnd = new Date(slot.endTime);
                return snappedTime >= slotStart && endTimeWithBuffer <= slotEnd;
            });

            if (!matchingSlot) {
                toast.error(
                    `This time  doesn't have enough availability for ${selectedService.durationMinutes} minutes. Please pick a time within the highlighted areas.`,
                );
                return;
            }

            setSelectedStartTime(snappedTime);
            setContainingSlot(matchingSlot);
        },
        [selectedService, availableSlots],
    );

    const handleEventDrop = useCallback(
        (info) => {
            if (info.event.id !== "booking-preview") {
                info.revert();
                return;
            }

            if (!selectedService) {
                toast.error("Please select a service first");
                info.revert();
                return;
            }

            const newStart = info.event.start;
            if (!newStart) {
                info.revert();
                return;
            }

            const now = new Date();
            if (newStart.getTime() - now.getTime() < 15 * 60 * 1000) {
                toast.error("Please select a time at least 15 minutes from now");
                info.revert();
                return;
            }

            // FullCalendar already snaps to 15-minute increments via snapDuration
            const snappedTime = new Date(newStart);
            snappedTime.setSeconds(0, 0);

            const endTime = addMinutes(snappedTime, selectedService.durationMinutes);
            const endTimeWithBuffer = addMinutes(snappedTime, selectedService.durationMinutes);

            const matchingSlot = availableSlots.find((slot) => {
                const slotStart = new Date(slot.startTime);
                const slotEnd = new Date(slot.endTime);
                return snappedTime >= slotStart && endTimeWithBuffer <= slotEnd;
            });

            if (!matchingSlot) {
                toast.error(
                    `This time  doesn't have enough availability for ${selectedService.durationMinutes} minutes. Please pick a time within the highlighted areas.`,
                );
                info.revert();
                return;
            }

            setSelectedStartTime(snappedTime);
            setContainingSlot(matchingSlot);
        },
        [selectedService, availableSlots],
    );

    // ─── Confirm Booking ───────────────────────────────
    const handleConfirmBooking = () => {
        if (!selectedService || !selectedStartTime || !containingSlot) return;

        if (onSlotSelected) {
            onSlotSelected({
                slot: containingSlot,
                service: selectedService,
                startTime: selectedStartTime,
            });
        }
        onClose();
    };

    // ─── Step Navigation ───────────────────────────────
    const handleServiceSelect = (service) => {
        setSelectedService(service);
        // Clear any previous time selection when changing service
        setSelectedStartTime(null);
        setContainingSlot(null);
    };

    const handleNextStep = () => {
        if (activeStep === 0 && selectedService) {
            setActiveStep(1);
        }
    };

    const handleBackStep = () => {
        if (activeStep === 1) {
            setActiveStep(0);
            setSelectedStartTime(null);
            setContainingSlot(null);
        }
    };

    // ─── Computed values ───────────────────────────────
    const endTime = useMemo(() => {
        if (!selectedStartTime || !selectedService) return null;
        return addMinutes(selectedStartTime, selectedService.durationMinutes);
    }, [selectedStartTime, selectedService]);

    const canConfirm = selectedService && selectedStartTime && containingSlot;

    // ─── Render ────────────────────────────────────────
    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ fontWeight: 600, fontSize: "1.25rem", pb: 1 }}>
                Book an Interview Session
                <Stepper activeStep={activeStep} sx={{ mt: 2 }}>
                    {STEPS.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </DialogTitle>

            <DialogContent>
                <Box sx={{ mt: 2, minHeight: 400 }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    {/* ──── STEP 1: Service Selection ──── */}
                    {activeStep === 0 && (
                        <Box>
                            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                                Choose an interview service
                            </Typography>

                            {loadingServices ? (
                                <Box display="flex" justifyContent="center" py={6}>
                                    <CircularProgress />
                                </Box>
                            ) : services.length === 0 ? (
                                <Paper sx={{ p: 3, textAlign: "center", bgcolor: "#f9fafb" }}>
                                    <Typography color="text.secondary">
                                        This coach hasn't set up any interview services yet.
                                    </Typography>
                                </Paper>
                            ) : (
                                <Stack spacing={1.5}>
                                    {services.map((service) => {
                                        const isSelected = selectedService?.id === service.id;
                                        return (
                                            <Box
                                                key={service.id}
                                                className={`service-card ${isSelected ? "selected" : ""}`}
                                                onClick={() => handleServiceSelect(service)}
                                            >
                                                <Stack
                                                    direction="row"
                                                    alignItems="center"
                                                    justifyContent="space-between"
                                                >
                                                    <Stack spacing={0.5}>
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <Typography variant="subtitle1" fontWeight={600}>
                                                                {service.interviewTypeName || "Interview"}
                                                            </Typography>
                                                            {service.isCoding && (
                                                                <StatusChip
                                                                    icon={<CodeIcon sx={{ fontSize: 14 }} />}
                                                                    label="Coding"
                                                                    color="primary"
                                                                />
                                                            )}
                                                        </Stack>
                                                        <Stack direction="row" spacing={2} alignItems="center">
                                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                                <AccessTimeIcon
                                                                    sx={{ fontSize: 16, color: "text.secondary" }}
                                                                />
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {service.durationMinutes} minutes
                                                                </Typography>
                                                            </Stack>
                                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                                <AttachMoneyIcon
                                                                    sx={{ fontSize: 16, color: "text.secondary" }}
                                                                />
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {service.price?.toLocaleString()} VND
                                                                </Typography>
                                                            </Stack>
                                                        </Stack>
                                                    </Stack>

                                                    {isSelected && (
                                                        <CheckCircleIcon sx={{ color: "var(--mui-palette-primary-main)", fontSize: 28 }} />
                                                    )}
                                                </Stack>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            )}
                        </Box>
                    )}

                    {/* ──── STEP 2: Calendar Time Picking ──── */}
                    {activeStep === 1 && (
                        <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
                            {/* Calendar */}
                            <Box sx={{ flex: 1, position: "relative" }} className="booking-calendar-container">
                                {loadingSlots && (
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            inset: 0,
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            bgcolor: "rgba(255,255,255,0.6)",
                                            zIndex: 2,
                                            borderRadius: "12px",
                                        }}
                                    >
                                        <CircularProgress />
                                    </Box>
                                )}
                                <FullCalendar
                                    ref={calendarRef}
                                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                    initialView="timeGridWeek"
                                    headerToolbar={{
                                        left: "prev,next today",
                                        center: "title",
                                        right: "timeGridWeek,timeGridDay",
                                    }}
                                    buttonText={{
                                        today: "Today",
                                        week: "Week",
                                        day: "Day",
                                    }}
                                    events={calendarEvents}
                                    dateClick={handleCalendarDateClick}
                                    eventDrop={handleEventDrop}
                                    selectable={false}
                                    editable={false}
                                    eventStartEditable={true}
                                    eventDurationEditable={false}
                                    eventConstraint="availability"
                                    now={new Date()}
                                    nowIndicator={true}
                                    snapDuration="00:15:00"
                                    height="auto"
                                    timeZone="local"
                                    slotLabelFormat={{
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: false,
                                    }}
                                    eventTimeFormat={{
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: false,
                                    }}
                                    allDaySlot={false}
                                    slotMinTime="06:00:00"
                                    slotMaxTime="23:00:00"
                                    expandRows={false}
                                    dayMaxEvents={true}
                                />

                                <Stack direction="row" spacing={3} sx={{ mt: 1.5, px: 1 }}>
                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                        <Box
                                            sx={{
                                                width: 14,
                                                height: 14,
                                                borderRadius: "3px",
                                                bgcolor: "rgba(99, 102, 241, 0.25)",
                                                border: "1px solid #6366f1",
                                            }}
                                        />
                                        <Typography variant="caption" color="text.secondary">
                                            Available
                                        </Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                        <Box
                                            sx={{
                                                width: 14,
                                                height: 14,
                                                borderRadius: "3px",
                                                bgcolor: "var(--mui-palette-primary-main)",
                                            }}
                                        />
                                        <Typography variant="caption" color="text.secondary">
                                            Your Booking
                                        </Typography>
                                    </Stack>
                                </Stack>
                            </Box>

                            {/* Right Panel — Summary */}
                            <Box sx={{ width: { xs: "100%", md: 280 }, flexShrink: 0 }}>
                                <Stack spacing={2}>
                                    {/* Selected service recap */}
                                    <Paper variant="outlined" sx={{ p: 2, borderRadius: "10px" }}>
                                        <Typography variant="caption" fontWeight={600} color="text.secondary">
                                            SELECTED SERVICE
                                        </Typography>
                                        <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 0.5 }}>
                                            {selectedService?.interviewType?.name || "Interview"}
                                        </Typography>
                                        <Stack direction="row" spacing={1.5} sx={{ mt: 0.5 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                {selectedService?.durationMinutes}m
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {selectedService?.price?.toLocaleString()} VND
                                            </Typography>
                                        </Stack>
                                    </Paper>

                                    {/* Instructions or Summary */}
                                    {!selectedStartTime ? (
                                        <Paper
                                            sx={{
                                                p: 2.5,
                                                textAlign: "center",
                                                bgcolor: "#f9fafb",
                                                borderRadius: "10px",
                                            }}
                                        >
                                            <EventAvailableIcon sx={{ fontSize: 40, color: "#9ca3af", mb: 1 }} />
                                            <Typography variant="body2" color="text.secondary">
                                                Click on a time within the{" "}
                                                <strong style={{ color: "#6366f1" }}>highlighted areas</strong> to
                                                select your preferred start time.
                                            </Typography>
                                        </Paper>
                                    ) : (
                                        <Box className="booking-summary">
                                            <Typography
                                                variant="subtitle2"
                                                fontWeight={700}
                                                sx={{ mb: 1.5, color: "var(--mui-palette-primary-main)" }}
                                            >
                                                Booking Summary
                                            </Typography>

                                            <Box className="summary-row">
                                                <Typography variant="body2" color="text.secondary">
                                                    Service
                                                </Typography>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {selectedService?.interviewType?.name || "Interview"}
                                                </Typography>
                                            </Box>

                                            <Box className="summary-row">
                                                <Typography variant="body2" color="text.secondary">
                                                    Date
                                                </Typography>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {format(selectedStartTime, "dd/MM/yyyy")}
                                                </Typography>
                                            </Box>

                                            <Box className="summary-row">
                                                <Typography variant="body2" color="text.secondary">
                                                    Time
                                                </Typography>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {format(selectedStartTime, "HH:mm")} – {format(endTime, "HH:mm")}
                                                </Typography>
                                            </Box>

                                            <Box className="summary-row">
                                                <Typography variant="body2" color="text.secondary">
                                                    Duration
                                                </Typography>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {selectedService?.durationMinutes} minutes
                                                </Typography>
                                            </Box>

                                            <hr className="summary-divider" />

                                            <Box className="summary-row">
                                                <Typography variant="body2" fontWeight={600}>
                                                    Total
                                                </Typography>
                                                <Typography variant="subtitle1" fontWeight={700} color="var(--mui-palette-primary-main)">
                                                    {selectedService?.price?.toLocaleString()} VND
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}
                                </Stack>
                            </Box>
                        </Stack>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1, justifyContent: "space-between" }}>
                <Box>
                    {activeStep === 1 && (
                        <SecondaryButton
                            onClick={handleBackStep}
                            startIcon={<ArrowBackIcon />}
                            sx={{ border: "none", "&:hover": { border: "none", bgcolor: "action.hover" } }}
                        >
                            Back
                        </SecondaryButton>
                    )}
                </Box>
                <Stack direction="row" spacing={1.5}>
                    <SecondaryButton onClick={onClose}>
                        Cancel
                    </SecondaryButton>
                    {activeStep === 0 ? (
                        <PrimaryButton
                            onClick={handleNextStep}
                            disabled={!selectedService}
                        >
                            Next
                        </PrimaryButton>
                    ) : (
                        <PrimaryButton
                            onClick={handleConfirmBooking}
                            disabled={!canConfirm || submitting}
                            loading={submitting}
                        >
                            Confirm & Pay
                        </PrimaryButton>
                    )}
                </Stack>
            </DialogActions>
        </Dialog>
    );
};

export default BookingSlotDialog;