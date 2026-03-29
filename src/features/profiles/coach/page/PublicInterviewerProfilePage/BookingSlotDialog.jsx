import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
    IconButton,
    Grow
} from "@mui/material";

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Grow ref={ref} {...props} timeout={500} />;
});
import CloseIcon from "@mui/icons-material/Close";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CodeIcon from "@mui/icons-material/Code";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import DescriptionIcon from '@mui/icons-material/Description';
import GroupsIcon from '@mui/icons-material/Groups';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TimelineIcon from "@mui/icons-material/Timeline";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import VerifiedIcon from "@mui/icons-material/Verified";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import NavigationIcon from '@mui/icons-material/Navigation';
import { CheckCircle } from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { addDays, addMonths, addMinutes, format, startOfDay } from "date-fns";
import { callApi } from "../../../../../common/utils/apiConnector";
import { METHOD } from "../../../../../common/constants/api";
import { getCoachInterviewServices } from "../../../../coach/services/coachInterviewServiceApi";
import toast from "react-hot-toast";
import { PrimaryButton, SecondaryButton } from "../../../../../common/components/buttons";
import "./BookingSlotDialog.css";
import StatusChip from "../../../../../common/components/StatusChip";

const STEPS = ["Select Service", "Pick Time on Calendar"];
const getTodayStart = () => startOfDay(new Date());
const getRollingSevenDayRange = () => {
    const start = getTodayStart();
    return { start, end: addDays(start, 7) };
};

const BookingSlotDialog = ({ open, onClose, interviewerId, onSlotSelected, initialService = null }) => {
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

            if (initialService) {
                setSelectedService(initialService);
                setActiveStep(1);
            }
        }
        if (!open) {
            // Reset state when dialog closes
            setActiveStep(0);
            setSelectedService(null);
            setSelectedStartTime(null);
            setContainingSlot(null);
            setError(null);
        }
    }, [open, interviewerId, initialService]);

    useEffect(() => {
        if (!open || activeStep !== 1 || !calendarRef.current) return;

        const calendarApi = calendarRef.current.getApi();
        calendarApi.changeView("rollingSevenDay", getTodayStart());
    }, [open, activeStep]);

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
                backgroundColor: "rgba(190, 242, 100, 0.15)", // Liquid Glass - Translucent and premium
                borderColor: "#bef264",
                classNames: ["liquid-slot"],
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
                backgroundColor: "#d4ff3d", // Electric Lime for selection
                borderColor: "#d4ff3d",
                textColor: "#0f172a",
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

    const getServiceIcon = (name) => {
        const lower = name?.toLowerCase() || "";
        if (lower.includes("soft skill")) return <PsychologyIcon />;
        if (lower.includes("cv") || lower.includes("resume")) return <DescriptionIcon />;
        if (lower.includes("technical") || lower.includes("coding")) return <CodeIcon />;
        return <GroupsIcon />;
    };

    // ─── Render ────────────────────────────────────────
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xl"
            fullWidth
            TransitionComponent={Transition}
            PaperProps={{ className: "booking-dialog-paper" }}
        >
            <Box className="booking-header">
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 32,
                        top: 32,
                        color: '#64748b',
                        bgcolor: 'rgba(0,0,0,0.03)',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.06)' },
                        zIndex: 10
                    }}
                >
                    <CloseIcon />
                </IconButton>

                <span className="booking-header-tag">Single-Focus Interview</span>
                <Typography className="booking-header-title">
                    Book an Interview Session
                </Typography>

                {activeStep === 0 ? (
                    <Typography className="booking-header-subtitle">
                        Select your session type to proceed with the laboratory booking.
                    </Typography>
                ) : (
                    <Typography className="booking-header-subtitle">
                        Select an available time slot on the calendar for your session.
                    </Typography>
                )}
            </Box>

            <DialogContent sx={{ overflowY: 'auto' }}>
                <Box sx={{ minHeight: activeStep === 0 ? 300 : 500 }}>
                    {error && (
                        <Box sx={{ px: 5, mb: 2 }}>
                            <Alert severity="error" onClose={() => setError(null)}>
                                {error}
                            </Alert>
                        </Box>
                    )}

                    {/* ──── STEP 1: Service Selection ──── */}
                    {activeStep === 0 && (
                        <Box className="booking-service-list">
                            {loadingServices ? (
                                <Box display="flex" justifyContent="center" py={10}>
                                    <CircularProgress sx={{ color: '#d4ff3d' }} />
                                </Box>
                            ) : services.length === 0 ? (
                                <Paper sx={{ p: 6, textAlign: "center", bgcolor: "#f8fafc", borderRadius: '16px', border: 'none' }}>
                                    <Typography color="text.secondary">
                                        This coach hasn't set up any interview services yet.
                                    </Typography>
                                </Paper>
                            ) : (
                                <Stack spacing={0}>
                                    {services.map((service) => {
                                        const isSelected = selectedService?.id === service.id;
                                        return (
                                            <Box
                                                key={service.id}
                                                className={`service-card-premium ${isSelected ? "selected" : ""}`}
                                                onClick={() => handleServiceSelect(service)}
                                            >
                                                <Box className="service-icon-box">
                                                    {getServiceIcon(service.interviewTypeName || service.name)}
                                                </Box>

                                                <Box className="service-info-main">
                                                    <Typography className="service-title">
                                                        {service.interviewTypeName || "Interview"}
                                                        {service.isCoding && (
                                                            <Chip
                                                                label="CODING"
                                                                size="small"
                                                                sx={{
                                                                    height: 18,
                                                                    fontSize: '9px',
                                                                    fontWeight: 800,
                                                                    bgcolor: '#0f172a',
                                                                    color: '#fff',
                                                                    ml: 1.5
                                                                }}
                                                            />
                                                        )}
                                                    </Typography>
                                                    <Box className="service-meta-row">
                                                        <Box className="service-meta-item">
                                                            <AccessTimeIcon sx={{ fontSize: 16 }} />
                                                            {service.durationMinutes} min
                                                        </Box>
                                                        <Box className="service-meta-dot" />
                                                        <Box className="service-meta-item">
                                                            {service.isCoding ? "Technical Focus" : "Standard Prep"}
                                                        </Box>
                                                    </Box>
                                                </Box>

                                                <Typography className="service-price-tag">
                                                    {(service.price || 0).toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 600 }}>VND</span>
                                                </Typography>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            )}
                        </Box>
                    )}

                    {/* ──── STEP 2: Calendar Time Picking ──── */}
                    {activeStep === 1 && (
                        <Stack direction={{ xs: "column", md: "row" }} spacing={4} className="booking-calendar-layout">
                            <Box sx={{ flex: 1, position: "relative", height: '750px', overflow: 'hidden' }} className="booking-calendar-main-container">
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
                                        <CircularProgress sx={{ color: '#d4ff3d' }} />
                                    </Box>
                                )}
                                <FullCalendar
                                    ref={calendarRef}
                                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                    initialDate={getTodayStart()}
                                    initialView="rollingSevenDay"
                                    views={{
                                        rollingSevenDay: {
                                            type: "timeGrid",
                                            duration: { days: 7 },
                                            dateAlignment: "day",
                                            buttonText: "7 Days",
                                            visibleRange: getRollingSevenDayRange,
                                        },
                                    }}
                                    headerToolbar={{
                                        left: "prev,next today",
                                        center: "title",
                                        right: "rollingSevenDay,timeGridDay",
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
                                    height="600px"
                                    timeZone="local"
                                    allDaySlot={false}
                                    slotMinTime="07:00:00"
                                    slotMaxTime="22:00:00"
                                />

                                <Stack direction="row" spacing={3} sx={{ mt: 2, px: 2 }}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Box sx={{ width: 14, height: 14, borderRadius: "4px", bgcolor: "rgba(190, 242, 100, 0.15)", borderLeft: "3px solid #bef264", border: "1px solid #d9f99d" }} />
                                        <Typography variant="caption" fontWeight={700} color="#64748b">Available Time</Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Box sx={{ width: 14, height: 14, borderRadius: "4px", bgcolor: "#d4ff3d", border: '1px solid #afe34a' }} />
                                        <Typography variant="caption" fontWeight={700} color="#64748b">Your Selection</Typography>
                                    </Stack>
                                </Stack>

                
                            </Box>

                            <Box sx={{ width: { xs: "100%", md: 360 }, flexShrink: 0 }} className="booking-summary-sidebar">
                                <Stack spacing={3} sx={{ height: '100%' }}>
                                    <Box className="jd-summary-card-stitch">
                                        <Typography variant="overline" color="#64748b" fontWeight={800} sx={{ letterSpacing: '0.1em' }}>Booking Overview</Typography>
                                        <Divider sx={{ my: 1.5, borderColor: 'rgba(0,0,0,0.06)' }} />

                                        <Stack spacing={2.5}>
                                            <Box sx={{ p: 2.5, borderRadius: '16px', border: '1px dashed #cbd5e1', bgcolor: 'rgba(0,0,0,0.02)' }}>
                                                <Typography variant="overline" color="#94a3b8" fontWeight={800} sx={{ mb: 1.5, display: 'block', fontSize: '0.65rem' }}>Pipeline Summary</Typography>
                                                <Stack spacing={2}>
                                                    <Box>
                                                        <Typography variant="caption" fontWeight={800} color="#1e293b" sx={{ display: 'block', fontSize: '0.85rem' }}>
                                                            1. {selectedService?.interviewTypeName || selectedService?.name || "Service not selected"}
                                                        </Typography>
                                                        <Typography variant="caption" color={selectedStartTime ? "#10b981" : "#94a3b8"} fontWeight={selectedStartTime ? 700 : 500}>
                                                            {selectedStartTime ? `  ${format(selectedStartTime, "HH:mm")} on ${format(selectedStartTime, "dd MMM")}` : "Time not set"}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </Box>

                                            <Box className="jd-price-dashboard-stitch">
                                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                    <Box>
                                                        <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 800, fontSize: '0.65rem' }}>Total Price</Typography>
                                                        <Typography variant="caption" className="duration-badge">
                                                            {selectedService?.durationMinutes || 0} mins total
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ textAlign: 'right' }}>
                                                        <Typography variant="h4" className="price-vibrant" sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                                                            {(selectedService?.price || 0).toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#d4ff3d' }}>VND</span>
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </Box>
                                        </Stack>
                                    </Box>


                                </Stack>
                            </Box>
                        </Stack>
                    )}
                </Box>
            </DialogContent>

            <Box className="booking-footer-premium">
                <Box>
                    {activeStep === 1 ? (
                        <SecondaryButton
                            className="back-btn-premium"
                            onClick={handleBackStep}
                            startIcon={<ArrowBackIosNewIcon sx={{ fontSize: 14 }} />}
                        >
                            Back
                        </SecondaryButton>
                    ) : (
                        <SecondaryButton
                            className="back-btn-premium"
                            onClick={onClose}
                        >
                            Cancel
                        </SecondaryButton>
                    )}
                </Box>

                <Stack direction="row" alignItems="center">
                    {/* Only show bottom price if not in Step 2, as Step 2 has its own sidebar summary */}
                    {activeStep === 0 && (
                        <Box className="price-summary-box">
                            <span className="price-label">Total Price</span>
                            <span className="price-amount">
                                {(selectedService?.price || 0).toLocaleString()} VND
                            </span>
                        </Box>
                    )}

                    {activeStep === 0 ? (
                        <PrimaryButton
                            color="secondary"
                            disabled={!selectedService}
                            onClick={handleNextStep}
                            sx={{ px: 5 }}
                        >
                            Next Step
                        </PrimaryButton>
                    ) : (
                        <PrimaryButton
                            color="secondary"
                            disabled={!canConfirm || submitting}
                            onClick={handleConfirmBooking}
                            loading={submitting}
                            sx={{ px: 5 }}
                        >
                            Confirm & Pay
                        </PrimaryButton>
                    )}
                </Stack>
            </Box>
        </Dialog>
    );
};

export default BookingSlotDialog;
