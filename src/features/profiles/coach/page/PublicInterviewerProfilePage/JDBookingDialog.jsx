import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Dialog from "@mui/material/Dialog";
import Grow from "@mui/material/Grow";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import CircularProgress from "@mui/material/CircularProgress";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import {
    Link,
    FileUser,
    ArrowRight,
    Target,
    Search,
    Terminal,
    CheckCircle,
    AlertCircle,
    Edit2,
} from 'lucide-react';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Grow ref={ref} {...props} timeout={500} />;
});

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { addDays, addMonths, addMinutes, format, startOfDay } from "date-fns";
import { AIM_LEVEL_LABELS } from "../../../../../common/constants/status";
import { getCoachInterviewServices } from "../../../../coach/services/coachInterviewServiceApi";
import { createJDBookingRequest, payBookingRequest } from "../../../../interview/services/bookingRequestApi";
import { callApi } from "../../../../../common/utils/apiConnector";
import { METHOD } from "../../../../../common/constants/api";
import { validateJDBookingRounds, isValidUrl } from "./jdBookingValidation";
import toast from "react-hot-toast";
import { useTheme } from "@mui/material/styles";
import { dialogStyles } from "../../../../../common/constants/uiStyles";
import "./JDBookingDialog.css";

const STEPS = ["Job Details & Rounds", "Schedule Rounds"];
const ROUND_COLORS = ["#d4ff3d", "#3b82f6", "#fb7247", "#818cf8", "#f472b6", "#c084fc"];
const getTodayStart = () => startOfDay(new Date());
const getRollingSevenDayRange = () => {
    const start = getTodayStart();
    return { start, end: addDays(start, 7) };
};

let nextRoundId = 1;
const createRound = () => ({ id: `round-${nextRoundId++}`, coachInterviewServiceId: "", startTime: null });

// ─── Sortable Round Card ──
function SortableRoundCard({
    round,
    index,
    isActive,
    onActivate,
    onRemove,
    onServiceChange,
    services,
    canDelete,
    allRounds,
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging, setActivatorNodeRef } = useSortable({
        id: round.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 20 : "auto",
    };

    const service = services.find((s) => s.id === round.coachInterviewServiceId);
    const isBehavioral = service?.interviewTypeName?.toLowerCase().includes("behavioral");
    const IconComponent = isBehavioral ? Search : Terminal;

    return (
        <Box
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onActivate}
            className={`jd-round-card-stitch ${isActive ? 'active' : ''}`}
            sx={{
                width: 280,
                height: 170,
                p: 2.5,
                flexShrink: 0,
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 24px -10px rgba(15, 23, 42, 0.12)',
                    borderColor: '#94a3b8'
                }
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box className="jd-card-icon-wrap jd-card-icon-wrap--dark">
                    <IconComponent size={18} color="#e2e8f0" />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {canDelete && (
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove();
                            }}
                            sx={{
                                color: "#94a3b8",
                                bgcolor: 'rgba(241, 245, 249, 0.5)',
                                p: 0.5,
                                "&:hover": { color: "#ef4444", bgcolor: 'rgba(239, 68, 68, 0.1)' }
                            }}
                        >
                            <DeleteIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                    )}
                    <Box className="jd-round-badge" sx={{ position: 'relative', top: 0, right: 0 }}>
                        ROUND {String(index + 1).padStart(2, '0')}
                    </Box>
                </Box>
            </Box>

            <Box>
                <Typography className="jd-label-mini" sx={{ mb: 1, color: '#94a3b8', fontSize: '0.65rem' }}>SERVICE TYPE</Typography>
                <TextField
                    fullWidth
                    select
                    size="small"
                    value={round.coachInterviewServiceId}
                    onChange={(e) => {
                        e.stopPropagation();
                        onServiceChange(e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    variant="outlined"
                    InputProps={{
                        sx: {
                            borderRadius: '10px',
                            bgcolor: '#f8fafc',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }
                        }
                    }}
                >
                    {services.map((s) => {
                        const isAlreadySelected = allRounds.some(r => r.id !== round.id && r.coachInterviewServiceId === s.id);
                        return (
                            <MenuItem key={s.id} value={s.id} disabled={isAlreadySelected}>
                                <Typography variant="body2" fontWeight={700}>
                                    {s.interviewTypeName} {isAlreadySelected && "(Already selected)"}
                                </Typography>
                            </MenuItem>
                        );
                    })}
                </TextField>
            </Box>
        </Box>
    );
}

function RoundScheduleTimelineItem({
    round,
    index,
    isActive,
    service,
    disabled,
    blockedByRoundNumber,
    isLast,
    onActivate,
}) {
    const handleClick = () => {
        // If it's already done OR it's the current one being scheduled, allowed to click
        // If it's blocked by a previous one, then check disabled
        if (disabled && !isDone) {
            toast.error(`Please set a time for Round ${index} first.`);
            return;
        }
        onActivate();
    };

    const isDone = Boolean(round.startTime);
    const isPending = !isDone && disabled;
    const statusClassName = isDone ? "done" : isPending ? "pending" : "current";

    let subtitle = "Selecting time...";
    if (isDone) {
        subtitle = format(round.startTime, "MMM dd 'at' HH:mm");
    } else if (isPending) {
        subtitle = blockedByRoundNumber ? `Complete Round ${blockedByRoundNumber} first` : "Pending";
    }

    return (
        <Box
            onClick={handleClick}
            className={`jd-schedule-item ${statusClassName} ${isActive ? "active" : ""} ${disabled && !isDone ? "disabled" : ""}`}
            sx={{ cursor: (disabled && !isDone) ? "not-allowed" : "pointer" }}
        >
            <Box className="jd-schedule-marker-wrap">
                <Box className="jd-schedule-marker">
                    {isDone ? <CheckIcon sx={{ fontSize: 12 }} /> : <Typography>{index + 1}</Typography>}
                </Box>
                {!isLast && <Box className="jd-schedule-line" />}
            </Box>

            <Box className="jd-schedule-content">
                <Box sx={{
                    display: 'inline-flex',
                    px: 1,
                    py: 0.25,
                    borderRadius: '4px',
                    bgcolor: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.12)',
                    mb: 0.75
                }}>
                    <Typography
                        className="jd-schedule-round"
                        sx={{
                            fontFamily: 'inherit',
                            fontWeight: 900,
                            fontSize: "0.6rem",
                            color: "#4f46e5",
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase'
                        }}
                    >
                        ROUND {index + 1}
                    </Typography>
                </Box>
                <Typography className="jd-schedule-title" component="p" sx={{ fontFamily: 'inherit', fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
                    {service?.interviewTypeName || "Select Service..."}
                </Typography>
                <Typography className="jd-schedule-subtitle" component="p">
                    {subtitle}
                </Typography>
            </Box>

            {isActive && (
                <Box
                    sx={{
                        position: "absolute",
                        top: 10,
                        right: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        px: 1,
                        py: 0.4,
                        bgcolor: "rgba(245, 158, 11, 0.12)",
                        borderRadius: "6px",
                        border: "1px solid rgba(245, 158, 11, 0.2)",
                    }}
                >
                    <Edit2
                        size={10}
                        color="#b45309"
                        strokeWidth={4}
                    />
                    <Typography
                        sx={{
                            fontSize: "0.55rem",
                            fontWeight: 900,
                            color: "#b45309",
                            letterSpacing: "0.05em",
                            lineHeight: 1
                        }}
                    >
                        EDITING
                    </Typography>
                </Box>
            )}
        </Box>
    );
}

export default function JDBookingDialog({ open, onClose, coachId }) {
    const theme = useTheme();
    const navigate = useNavigate();
    const calendarRef = useRef(null);

    const [activeStep, setActiveStep] = useState(0);
    const [form, setForm] = useState({ jobDescriptionUrl: "", cvUrl: "", aimLevel: "" });
    const [formErrors, setFormErrors] = useState({ jobDescriptionUrl: "", cvUrl: "" });
    const [services, setServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(false);
    const [freeSlots, setFreeSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [rounds, setRounds] = useState(() => [createRound(), createRound()]);
    const [activeRoundIndex, setActiveRoundIndex] = useState(0);
    const [stepTransitionClass, setStepTransitionClass] = useState("jd-step-enter-forward");

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open || activeStep !== 1 || !calendarRef.current) return;
        const calendarApi = calendarRef.current.getApi();
        calendarApi.changeView("rollingSevenDay", getTodayStart());
    }, [open, activeStep]);

    useEffect(() => {
        if (open && coachId) {
            loadServices();
            fetchFreeSlots();
        }
        if (!open) {
            setActiveStep(0);
            setForm({ jobDescriptionUrl: "", cvUrl: "", aimLevel: "" });
            setFormErrors({ jobDescriptionUrl: "", cvUrl: "" });
            setRounds([createRound(), createRound()]);
            setActiveRoundIndex(0);
            setError("");
        }
    }, [open, coachId]);

    const loadServices = async () => {
        setLoadingServices(true);
        try {
            const data = await getCoachInterviewServices(coachId);
            setServices(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingServices(false);
        }
    };

    const fetchFreeSlots = async () => {
        setLoadingSlots(true);
        try {
            const today = new Date();
            const allSlots = [];
            for (let i = 0; i < 3; i++) {
                const target = addMonths(today, i);
                const month = target.getMonth() + 1;
                const year = target.getFullYear();
                const response = await callApi({
                    method: METHOD.GET,
                    endpoint: `/availabilities/${coachId}/free-slots?month=${month}&year=${year}`,
                });
                if (response.success && response.data) {
                    const normalized = response.data.map((slot) => ({
                        ...slot,
                        startTime: slot.startTime && !slot.startTime.endsWith("Z") ? slot.startTime + "Z" : slot.startTime,
                        endTime: slot.endTime && !slot.endTime.endsWith("Z") ? slot.endTime + "Z" : slot.endTime,
                    }));
                    allSlots.push(...normalized);
                }
            }
            allSlots.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
            setFreeSlots(allSlots);
        } catch (err) {
            console.error("Error fetching free slots:", err);
        } finally {
            setLoadingSlots(false);
        }
    };

    const addRound = () => {
        if (rounds.length >= 5) {
            toast.error("You can add a maximum of 5 rounds for a single JD booking.");
            return;
        }
        setRounds((prev) => [...prev, createRound()]);
    };

    const removeRound = (index) => {
        if (rounds.length <= 2) {
            toast.error("JD booking requires at least 2 interview rounds.");
            return;
        }
        setRounds((prev) => prev.filter((_, i) => i !== index));
        if (activeRoundIndex >= rounds.length - 1) {
            setActiveRoundIndex(Math.max(0, rounds.length - 2));
        }
    };

    const updateRoundService = (index, serviceId) => {
        setRounds((prev) => prev.map((r, i) => (i === index ? { ...r, coachInterviewServiceId: serviceId, startTime: null } : r)));
    };

    const getServiceForRound = (round) => services.find((s) => s.id === round.coachInterviewServiceId);
    const getRoundColor = (index) => ROUND_COLORS[index % ROUND_COLORS.length];
    const getTotalPrice = () => rounds.reduce((sum, r) => sum + (getServiceForRound(r)?.price || 0), 0);
    const getTotalDurationMinutes = () => rounds.reduce((sum, r) => sum + (getServiceForRound(r)?.durationMinutes || 0), 0);
    const hasScheduledPreviousRounds = (index) => rounds.slice(0, index).every((r) => r.startTime);


    const calendarEvents = useMemo(() => {
        const now = new Date();
        const bgEvents = freeSlots.filter((slot) => new Date(slot.endTime) > now).map((slot) => ({
            id: `bg-${slot.id}-${slot.startTime}`,
            start: slot.startTime,
            end: slot.endTime,
            display: "background",
            className: "liquid-slot",
            groupId: "availability",
            editable: false,
        }));
        const roundEvents = rounds.map((round, index) => {
            if (!round.startTime || !round.coachInterviewServiceId) return null;
            const svc = getServiceForRound(round);
            if (!svc) return null;
            return {
                id: `round-${index}`,
                title: `R${index + 1}: ${svc.interviewTypeName || "Interview"}`,
                start: round.startTime.toISOString(),
                end: addMinutes(round.startTime, svc.durationMinutes).toISOString(),
                backgroundColor: getRoundColor(index),
                borderColor: getRoundColor(index),
                textColor: index === 0 ? "#0f172a" : "#fff", // Black text for Lime (Round 1), white for others
                editable: true,
            };
        }).filter(Boolean);
        return [...bgEvents, ...roundEvents];
    }, [freeSlots, rounds, services]);

    const handleCalendarDateClick = useCallback((info) => {
        const currentRound = rounds[activeRoundIndex];
        if (!hasScheduledPreviousRounds(activeRoundIndex)) {
            toast.error("Please complete scheduling previous rounds first.");
            return;
        }
        const svc = getServiceForRound(currentRound);
        if (!svc) {
            toast.error(`Please select a service for Round ${activeRoundIndex + 1} first`);
            return;
        }

        const clickedTime = info.date;
        const now = new Date();
        if (clickedTime.getTime() - now.getTime() < 3 * 60 * 60 * 1000) {
            toast.error("Please select a time at least 3 hours from now");
            return;
        }

        const snappedTime = new Date(clickedTime);
        snappedTime.setMinutes(Math.floor(snappedTime.getMinutes() / 15) * 15, 0, 0);
        const endTime = addMinutes(snappedTime, svc.durationMinutes);

        const matchingSlot = freeSlots.find((slot) => (snappedTime >= new Date(slot.startTime) && endTime <= new Date(slot.endTime)));
        if (!matchingSlot) {
            toast.error(`This time doesn't have enough availability for ${svc.durationMinutes} minutes.`);
            return;
        }

        const gapMs = 15 * 60 * 1000;
        if (activeRoundIndex > 0) {
            const prev = rounds[activeRoundIndex - 1];
            const prevEnd = addMinutes(prev.startTime, getServiceForRound(prev)?.durationMinutes || 0);
            if (snappedTime.getTime() < prevEnd.getTime() + gapMs) {
                toast.error(`Round ${activeRoundIndex + 1} must start at least 15 minutes after Round ${activeRoundIndex} ends.`);
                return;
            }
        }

        setRounds((prev) =>
            prev.map((r, i) => (i === activeRoundIndex ? { ...r, startTime: snappedTime } : r))
        );

        const nextRoundIndex = rounds.findIndex((r, i) => i > activeRoundIndex && !r.startTime);
        if (nextRoundIndex !== -1) {
            setActiveRoundIndex(nextRoundIndex);
        }
    }, [activeRoundIndex, rounds, services, freeSlots]);

    const handleEventDrop = useCallback((info) => {
        const { event } = info;
        if (!event.id?.startsWith("round-")) { info.revert(); return; }
        const roundIndex = parseInt(event.id.replace("round-", ""), 10);
        const targetRound = rounds[roundIndex];
        const svc = getServiceForRound(targetRound);
        if (!svc || !hasScheduledPreviousRounds(roundIndex)) { info.revert(); return; }

        const newStart = event.start;
        const now = new Date();
        if (newStart.getTime() - now.getTime() < 3 * 60 * 60 * 1000) { toast.error("Too soon"); info.revert(); return; }

        const snappedTime = new Date(newStart);
        snappedTime.setMinutes(Math.floor(snappedTime.getMinutes() / 15) * 15, 0, 0);
        const endTime = addMinutes(snappedTime, svc.durationMinutes);

        const matchingSlot = freeSlots.find(s => snappedTime >= new Date(s.startTime) && endTime <= new Date(s.endTime));
        if (!matchingSlot) { info.revert(); return; }

        setRounds(prev => prev.map((r, i) => i === roundIndex ? { ...r, startTime: snappedTime } : r));
    }, [rounds, services, freeSlots]);

    const handleFocusNextRound = () => {
        const nextIndex = rounds.findIndex((r, i) => i > activeRoundIndex && !r.startTime);
        if (nextIndex === -1) {
            const firstEmpty = rounds.findIndex(r => !r.startTime);
            if (firstEmpty !== -1) setActiveRoundIndex(firstEmpty);
            else toast.success("All rounds are already scheduled.");
        } else {
            setActiveRoundIndex(nextIndex);
        }
    };

    const handleSubmit = async () => {
        setError("");
        const selectedRounds = rounds.map((r) => ({
            serviceId: r.coachInterviewServiceId,
            startTime: r.startTime,
            durationMinutes: getServiceForRound(r)?.durationMinutes || 0,
        }));
        const validation = validateJDBookingRounds(selectedRounds, freeSlots.map(s => ({ ...s, startTime: new Date(s.startTime), endTime: new Date(s.endTime) })));
        if (!validation.isValid) { setError(validation.errorMsg); return; }

        setSaving(true);
        try {
            const payload = {
                coachId,
                jobDescriptionUrl: form.jobDescriptionUrl.trim(),
                cvUrl: form.cvUrl.trim(),
                rounds: rounds.map((r) => ({ coachInterviewServiceId: r.coachInterviewServiceId, startTime: r.startTime.toISOString() })),
                aimLevel: form.aimLevel === "" ? undefined : Number(form.aimLevel)
            };
            const booking = await createJDBookingRequest(payload);
            const payResult = await payBookingRequest(booking.id, { returnUrl: window.location.origin + window.location.pathname });
            if (payResult?.checkOutUrl) window.location.href = payResult.checkOutUrl;
            else {
                toast.success("Booking confirmed!");
                onClose();
                navigate("/booking-requests");
            }
        } catch (err) {
            setError(err.message || "Failed to confirm booking.");
        } finally {
            setSaving(false);
        }
    };

    const canProceedStep1 = form.jobDescriptionUrl.trim() && form.cvUrl.trim() && rounds.every(r => r.coachInterviewServiceId);
    const allRoundsConfigured = rounds.every(r => r.coachInterviewServiceId && r.startTime);
    const completedRoundCount = rounds.filter(r => !!r.startTime).length;

    const handleNextStep = () => {
        if (activeStep === 0) {
            const jdUrl = form.jobDescriptionUrl.trim();
            const cvUrl = form.cvUrl.trim();
            const newErrors = { jobDescriptionUrl: "", cvUrl: "" };
            let hasError = false;

            if (!isValidUrl(jdUrl)) {
                newErrors.jobDescriptionUrl = "Please provide a valid link for the Job Description";
                hasError = true;
            }
            if (!isValidUrl(cvUrl)) {
                newErrors.cvUrl = "Please provide a valid link for your CV (e.g. Google Drive link)";
                hasError = true;
            }

            setFormErrors(newErrors);

            if (hasError) return;

            if (!rounds.every(r => r.coachInterviewServiceId)) {
                setError("Please select a service for all interview rounds.");
                return;
            }

            setError("");
            setActiveStep(1);
            setActiveRoundIndex(0);
            setStepTransitionClass("jd-step-enter-forward");
        }
    };

    const handleBackStep = () => {
        if (activeStep === 1) {
            setActiveStep(0);
            setStepTransitionClass("jd-step-enter-backward");
        }
    };

    const handleClose = () => onClose();

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="xl"
            fullWidth
            TransitionComponent={Transition}
            PaperProps={{
                className: "jd-booking-dialog-paper",
                sx: { ...dialogStyles.paper(theme), borderRadius: "20px", overflow: "hidden" },
            }}
        >
            <DialogTitle sx={{ p: 4, pb: 2, pr: 7, position: "relative" }}>
                <Box sx={{ textAlign: "left", maxWidth: "100%" }}>
                    <Typography sx={{ fontFamily: theme.typography.h3.fontFamily, fontWeight: 800, fontSize: "1.5rem", color: "text.primary", mb: 1, letterSpacing: "-0.02em" }}>
                        JD Multi-Round Interview Booking
                    </Typography>
                    <Typography sx={{ fontSize: "0.9375rem", color: "text.secondary", lineHeight: 1.55, maxWidth: 560 }}>
                        Submit details and build your assessment workflow. Scheduling occurs in the next step.
                    </Typography>
                </Box>
                <IconButton onClick={handleClose} size="small" aria-label="Close" sx={{ position: "absolute", right: 20, top: 20, color: "text.secondary" }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ px: 5, pb: 4, pt: activeStep === 1 ? 1 : 2, minHeight: 500 }}>
                {activeStep === 1 && (
                    <Box sx={{ maxWidth: "900px", mx: "auto", mb: 4 }}>
                        <Stepper activeStep={activeStep}>
                            {STEPS.map((label) => (
                                <Step key={label}>
                                    <StepLabel sx={{ "& .MuiStepLabel-label": { fontWeight: 600 } }}>{label}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>
                    </Box>
                )}

                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setError("")}>{error}</Alert>}

                <Box key={activeStep} className={`jd-step-transition ${stepTransitionClass}`}>
                    {activeStep === 0 && (
                        <Box sx={{ width: '100%' }}>
                            <Stack spacing={5}>
                                <Box className="jd-url-section">
                                    <Grid
                                        container
                                        spacing={2}
                                        sx={{ width: "100%", mx: 0 }}
                                    >
                                        <Grid item xs={12} md={4} sx={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
                                            <Typography className="jd-label-mini" sx={{ color: formErrors.jobDescriptionUrl ? "#ef4444" : "#64748b" }}>Job url</Typography>
                                            <Box className={`jd-input-stitch ${formErrors.jobDescriptionUrl ? "error" : ""}`}>
                                                <Link size={18} color={formErrors.jobDescriptionUrl ? "#ef4444" : "#94a3b8"} aria-hidden />
                                                <TextField
                                                    fullWidth
                                                    variant="standard"
                                                    placeholder="https://company.com/role"
                                                    value={form.jobDescriptionUrl}
                                                    onChange={(e) => {
                                                        setForm({ ...form, jobDescriptionUrl: e.target.value });
                                                        if (formErrors.jobDescriptionUrl) setFormErrors(prev => ({ ...prev, jobDescriptionUrl: "" }));
                                                    }}
                                                    InputProps={{ disableUnderline: true }}
                                                    sx={{ "& .MuiInputBase-input": { py: 0.5, fontSize: "0.95rem", fontWeight: 600, color: "#0f172a" } }}
                                                />
                                            </Box>
                                            {formErrors.jobDescriptionUrl && (
                                                <Typography sx={{ color: "#ef4444", fontSize: "0.65rem", fontWeight: 700, mt: 0.5, ml: 0.5 }}>
                                                    {formErrors.jobDescriptionUrl}
                                                </Typography>
                                            )}
                                        </Grid>
                                        <Grid item xs={12} md={4} sx={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
                                            <Typography className="jd-label-mini" sx={{ color: formErrors.cvUrl ? "#ef4444" : "#64748b" }}>CV url</Typography>
                                            <Box className={`jd-input-stitch ${formErrors.cvUrl ? "error" : ""}`}>
                                                <FileUser size={18} color={formErrors.cvUrl ? "#ef4444" : "#94a3b8"} aria-hidden />
                                                <TextField
                                                    fullWidth
                                                    variant="standard"
                                                    placeholder="https://drive.google.com/cv.pdf"
                                                    value={form.cvUrl}
                                                    onChange={(e) => {
                                                        setForm({ ...form, cvUrl: e.target.value });
                                                        if (formErrors.cvUrl) setFormErrors(prev => ({ ...prev, cvUrl: "" }));
                                                    }}
                                                    InputProps={{ disableUnderline: true }}
                                                    sx={{ "& .MuiInputBase-input": { py: 0.5, fontSize: "0.95rem", fontWeight: 600, color: "#0f172a" } }}
                                                />
                                            </Box>
                                            {formErrors.cvUrl && (
                                                <Typography sx={{ color: "#ef4444", fontSize: "0.65rem", fontWeight: 700, mt: 0.5, ml: 0.5 }}>
                                                    {formErrors.cvUrl}
                                                </Typography>
                                            )}
                                        </Grid>
                                        <Grid item xs={12} md={4} sx={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
                                            <Typography className="jd-label-mini">Target</Typography>
                                            <Box className="jd-input-stitch">
                                                <Target size={18} color="#94a3b8" aria-hidden />
                                                <TextField
                                                    fullWidth
                                                    select
                                                    variant="standard"
                                                    value={form.aimLevel}
                                                    onChange={(e) => setForm({ ...form, aimLevel: e.target.value })}
                                                    InputProps={{ disableUnderline: true }}
                                                    SelectProps={{
                                                        displayEmpty: true,
                                                        renderValue: (selected) => {
                                                            if (selected === "" || selected === undefined) return "Software Engineer";
                                                            return AIM_LEVEL_LABELS[selected] ?? selected;
                                                        },
                                                    }}
                                                    sx={{
                                                        "& .MuiSelect-select": {
                                                            py: 0.5,
                                                            fontSize: "0.95rem",
                                                            fontWeight: 600,
                                                            display: "flex",
                                                            alignItems: "center",
                                                        },
                                                    }}
                                                >
                                                    <MenuItem value=""><em>Not specified</em></MenuItem>
                                                    {Object.entries(AIM_LEVEL_LABELS).map(([val, label]) => (
                                                        <MenuItem key={val} value={val}>{label}</MenuItem>
                                                    ))}
                                                </TextField>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Box>

                                <Box sx={{ width: "100%" }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                        <Box>
                                            <Typography fontWeight={800} fontSize="1.3rem" color="#0f172a">Build Your Interview Sequence</Typography>
                                            <Typography variant="caption" color="text.secondary">Define the logical flow of your assessment process</Typography>
                                        </Box>
                                        <Button
                                            size="medium"
                                            variant="contained"
                                            color="secondary"
                                            startIcon={<AddIcon />}
                                            onClick={addRound}
                                            sx={{ borderRadius: "8px", px: 2.5, fontWeight: 700, textTransform: "none" }}
                                        >
                                            Add Round
                                        </Button>
                                    </Stack>

                                    <Box className="jd-sequence-panel-stitch">
                                        <Box className="jd-track-stitch" sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 2 }}>
                                            {rounds.map((round, index) => {
                                                const service = services.find(s => s.id === round.coachInterviewServiceId);
                                                return (
                                                    <React.Fragment key={round.id}>
                                                        <Box className="jd-bubble-stitch">
                                                            <Box className="jd-bubble-num">{index + 1}</Box>
                                                            <Box className="jd-bubble-text">
                                                                <Box className="jd-bubble-title-row">
                                                                    <span className="jd-bubble-round-tag">Round {index + 1}</span>
                                                                    <span className="jd-bubble-service-name">{service?.interviewTypeName || "Select service..."}</span>
                                                                </Box>
                                                            </Box>
                                                        </Box>
                                                        {index < rounds.length - 1 && (
                                                            <Box className="jd-arrow-stitch" aria-hidden>
                                                                <ArrowRight size={20} />
                                                            </Box>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </Box>
                                    </Box>

                                    {loadingServices ? (
                                        <Box display="flex" justifyContent="center" py={8}><CircularProgress size={40} thickness={5} sx={{ color: 'var(--ep-accent)' }} /></Box>
                                    ) : (
                                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => {
                                            const { active, over } = e;
                                            if (over && active.id !== over.id) {
                                                setRounds((prev) => arrayMove(prev, prev.findIndex(r => r.id === active.id), prev.findIndex(r => r.id === over.id)));
                                            }
                                        }}>
                                            <SortableContext items={rounds.map(r => r.id)} strategy={verticalListSortingStrategy}>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4, mt: 2 }}>
                                                    {rounds.map((round, index) => (
                                                        <SortableRoundCard
                                                            key={round.id}
                                                            round={round}
                                                            index={index}
                                                            isActive={activeRoundIndex === index}
                                                            canDelete={rounds.length > 2}
                                                            onActivate={() => setActiveRoundIndex(index)}
                                                            onRemove={() => removeRound(index)}
                                                            onServiceChange={(val) => updateRoundService(index, val)}
                                                            services={services}
                                                            allRounds={rounds}
                                                        />
                                                    ))}
                                                </Box>
                                            </SortableContext>
                                        </DndContext>
                                    )}
                                </Box>
                            </Stack>
                        </Box>
                    )}

                    {activeStep === 1 && (
                        <Stack direction={{ xs: "column", md: "row" }} spacing={4}>
                            <Box sx={{ flex: 1, position: 'relative' }} className="jd-calendar-container animate__animated animate__fadeIn">
                                {loadingSlots && <Box sx={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", bgcolor: "rgba(255,255,255,0.7)", zIndex: 10, borderRadius: "16px" }}><CircularProgress /></Box>}
                                <FullCalendar
                                    ref={calendarRef}
                                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                    initialView="rollingSevenDay"
                                    views={{ rollingSevenDay: { type: "timeGrid", duration: { days: 7 }, buttonText: "7 Days", visibleRange: getRollingSevenDayRange } }}
                                    headerToolbar={{
                                        left: "prev,next today",
                                        center: "title",
                                        right: "rollingSevenDay,timeGridDay",
                                    }}
                                    events={calendarEvents}
                                    dateClick={handleCalendarDateClick}
                                    eventDrop={handleEventDrop}
                                    eventConstraint="availability"
                                    nowIndicator={true}
                                    height="650px"
                                    timeZone="local"
                                    slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
                                    slotMinTime="07:00:00"
                                    slotMaxTime="22:00:00"
                                />

                                <Stack direction="row" spacing={3} sx={{ mt: 2, px: 2 }}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Box sx={{ width: 14, height: 14, borderRadius: "4px", bgcolor: "rgba(190, 242, 100, 0.15)", borderLeft: "3px solid #bef264", border: "1px solid #d9f99d" }} />
                                        <Typography variant="caption" fontWeight={700} color="#64748b">Available Time</Typography>
                                    </Stack>
                                    {rounds.map((_, i) => (
                                        <Stack key={i} direction="row" spacing={1} alignItems="center">
                                            <Box sx={{ width: 14, height: 14, borderRadius: "4px", bgcolor: getRoundColor(i) }} />
                                            <Typography variant="caption" fontWeight={600} color="#64748b">Round {i + 1}</Typography>
                                        </Stack>
                                    ))}
                                </Stack>
                            </Box>

                            <Box sx={{ width: { xs: "100%", md: 360 }, flexShrink: 0 }}>
                                <Stack spacing={3} className="jd-schedule-panel animate__animated animate__fadeInRight">
                                    <Box>
                                        <Typography fontWeight={800} fontSize="1.1rem" color="#0f172a">Schedule rounds in order</Typography>
                                        <Typography variant="caption" color="text.secondary">Pick available slots on the calendar for each round</Typography>
                                    </Box>

                                    <Stack spacing={1.5}>
                                        {rounds.map((round, index) => (
                                            <RoundScheduleTimelineItem
                                                key={round.id}
                                                round={round}
                                                index={index}
                                                isActive={activeRoundIndex === index}
                                                service={getServiceForRound(round)}
                                                disabled={!hasScheduledPreviousRounds(index) && index !== 0}
                                                blockedByRoundNumber={index > 0 && !rounds[index - 1].startTime ? index : undefined}
                                                isLast={index === rounds.length - 1}
                                                onActivate={() => setActiveRoundIndex(index)}
                                            />
                                        ))}
                                    </Stack>

                                    <Box className="jd-summary-card-stitch">
                                        <Typography variant="overline" color="#64748b" fontWeight={800} sx={{ letterSpacing: '0.1em' }}>Booking Overview</Typography>
                                        <Divider sx={{ my: 1.5, borderColor: 'rgba(0,0,0,0.06)' }} />
                                        <Stack spacing={2.5}>
                                            <Box sx={{ p: 2, borderRadius: '16px', border: '1px dashed #cbd5e1', bgcolor: 'rgba(0,0,0,0.02)' }}>
                                                <Typography variant="overline" color="#94a3b8" fontWeight={700} sx={{ mb: 1.5, display: 'block', fontSize: '0.65rem' }}>Pipeline Summary</Typography>
                                                <Stack spacing={1.5}>
                                                    {rounds.map((r, i) => {
                                                        const svc = getServiceForRound(r);
                                                        return (
                                                            <Stack key={r.id} direction="row" justifyContent="space-between" alignItems="flex-start">
                                                                <Box>
                                                                    <Typography variant="caption" fontWeight={800} color="#1e293b" sx={{ display: 'block' }}>
                                                                        {i + 1}. {svc?.interviewTypeName || "Unset"}
                                                                    </Typography>
                                                                    <Typography variant="caption" color={r.startTime ? "#10b981" : "#94a3b8"} fontWeight={r.startTime ? 700 : 500}>
                                                                        {r.startTime ? format(r.startTime, "dd MMM, HH:mm") : "Time not set"}
                                                                    </Typography>
                                                                </Box>
                                                                {r.startTime && <CheckCircle size={14} color="#10b981" />}
                                                            </Stack>
                                                        );
                                                    })}
                                                </Stack>
                                            </Box>

                                            <Box className="jd-price-dashboard-stitch">
                                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                    <Box>
                                                        <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 800, fontSize: '0.65rem' }}>Total Price</Typography>
                                                        <Typography variant="caption" className="duration-badge">
                                                            {getTotalDurationMinutes()} mins total
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ textAlign: 'right' }}>
                                                        <Typography variant="h4" className="price-vibrant" sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                                                            {getTotalPrice().toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#d4ff3d' }}>VND</span>
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

            <DialogActions className="jd-dialog-footer" sx={{ p: 3, px: 4, justifyContent: "space-between", alignItems: "center" }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Stack direction="row" sx={{ "& > *": { ml: -1, border: "2.5px solid #fff" } }}>
                        {[...Array(2)].map((_, i) => (
                            <Box
                                key={i}
                                sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: "50%",
                                    bgcolor: "#e2e8f0",
                                    display: "grid",
                                    placeItems: "center",
                                    overflow: "hidden",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
                                }}
                            >

                            </Box>
                        ))}
                    </Stack>
                </Stack>

                <Stack direction="row" spacing={2} alignItems="center">
                    {activeStep === 1 && (
                        <Button startIcon={<ArrowBackIcon />} onClick={handleBackStep} sx={{ fontWeight: 700, textTransform: "none", color: "text.secondary" }}>
                            Back
                        </Button>
                    )}
                    <Button onClick={handleClose} sx={{ color: "text.secondary", fontWeight: 700, textTransform: "none" }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        className="jd-btn-next-footer"
                        onClick={activeStep === 0 ? handleNextStep : handleSubmit}
                        disabled={activeStep === 0 ? !canProceedStep1 : (!allRoundsConfigured || saving)}
                        endIcon={!saving && <ArrowRight size={20} strokeWidth={2.25} />}
                        sx={{ minWidth: { xs: "100%", sm: 240 }, py: 1.25 }}
                    >
                        {activeStep === 0 ? "Next: Schedule Rounds" : (saving ? "Confirming & Paying..." : "Confirm & Pay Now")}
                    </Button>
                </Stack>
            </DialogActions>
        </Dialog>
    );
}
