import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Dialog from "@mui/material/Dialog";
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
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import CircularProgress from "@mui/material/CircularProgress";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import CodeIcon from "@mui/icons-material/Code";
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
import { addMonths, addMinutes, format } from "date-fns";
import { AIM_LEVEL, AIM_LEVEL_LABELS } from "../../../../../common/constants/status";
import { getCoachInterviewServices } from "../../../../coach/services/coachInterviewServiceApi";
import { createJDBookingRequest, payBookingRequest } from "../../../../interview/services/bookingRequestApi";
import { callApi } from "../../../../../common/utils/apiConnector";
import { METHOD } from "../../../../../common/constants/api";
import { validateJDBookingRounds } from "./jdBookingValidation";
import toast from "react-hot-toast";
import FormTextField from "../../../../../common/components/form/FormTextField";
import { dialogStyles } from "../../../../../common/constants/uiStyles";
import { PrimaryButton, SecondaryButton } from "../../../../../common/components/buttons";
import "./JDBookingDialog.css";

const STEPS = ["Job Details", "Configure Rounds"];
const ROUND_COLORS = ["#4f46e5", "#0891b2", "#7c3aed", "#db2777", "#ea580c", "#059669"];

let nextRoundId = 1;
const createRound = () => ({ id: `round-${nextRoundId++}`, coachInterviewServiceId: "", startTime: null });

// ─── Sortable Round Card (extracted for @dnd-kit) ──
function SortableRoundCard({
    round,
    index,
    isActive,
    canDelete,
    color,
    service,
    services,
    fieldSx,
    onActivate,
    onRemove,
    onServiceChange,
}) {
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
        id: round.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : "auto",
    };

    return (
        <Paper
            ref={setNodeRef}
            style={style}
            className={`jd-round-card ${isActive ? "active" : ""} ${isDragging ? "dragging" : ""}`}
            onClick={onActivate}
            sx={{ borderLeft: `4px solid ${color}`, cursor: "pointer" }}
            variant="outlined"
        >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                    <Box
                        ref={setActivatorNodeRef}
                        {...attributes}
                        {...listeners}
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                            cursor: "grab",
                            display: "flex",
                            alignItems: "center",
                            color: "#9ca3af",
                            "&:hover": { color: "#6366f1" },
                            "&:active": { cursor: "grabbing" },
                        }}
                    >
                        <DragIndicatorIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Typography fontWeight={600} fontSize="0.85rem" color="#374151">
                        Round {index + 1}
                    </Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center">
                    {isActive && (
                        <Chip
                            label="Editing"
                            size="small"
                            sx={{ height: 20, fontSize: "0.65rem", bgcolor: color, color: "#fff" }}
                        />
                    )}
                    {canDelete && (
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove();
                            }}
                            sx={{ color: "#ef4444", p: 0.5 }}
                        >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    )}
                </Stack>
            </Stack>

            <TextField
                fullWidth
                select
                size="small"
                label="Interview Service"
                value={round.coachInterviewServiceId}
                onChange={(e) => {
                    e.stopPropagation();
                    onServiceChange(e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                sx={{ ...fieldSx, mb: 1 }}
            >
                {services.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                        {s.interviewTypeName}
                        {s.isCoding ? " (Coding)" : ""} — {s.price?.toLocaleString()} ₫
                    </MenuItem>
                ))}
            </TextField>

            {service && (
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Stack direction="row" spacing={0.3} alignItems="center">
                        <AccessTimeIcon sx={{ fontSize: 14, color: "#9ca3af" }} />
                        <Typography variant="caption" color="text.secondary">
                            {service.durationMinutes}m
                        </Typography>
                    </Stack>
                    {service.isCoding && (
                        <Chip
                            icon={<CodeIcon sx={{ fontSize: 12 }} />}
                            label="Coding"
                            size="small"
                            variant="outlined"
                            color="primary"
                            sx={{ height: 18, fontSize: "0.6rem" }}
                        />
                    )}
                </Stack>
            )}

            {round.startTime ? (
                <Box sx={{ mt: 1, p: 1, borderRadius: 1, bgcolor: `${color}10` }}>
                    <Typography variant="caption" fontWeight={600} sx={{ color }}>
                        {format(round.startTime, "dd/MM/yyyy HH:mm")}
                        {service && ` – ${format(addMinutes(round.startTime, service.durationMinutes), "HH:mm")}`}
                    </Typography>
                </Box>
            ) : (
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: "block", fontStyle: "italic" }}
                >
                    {isActive ? "Click calendar to set time" : "Click to edit, then pick time"}
                </Typography>
            )}
        </Paper>
    );
}

/**
 * Flow C: Candidate submits JD + CV for a multi-round interview plan
 * Step 1: JD URL, CV URL, Aim Level
 * Step 2: Per-round service selection + calendar time picking
 */
export default function JDBookingDialog({ open, onClose, coachId }) {
    const navigate = useNavigate();
    const calendarRef = useRef(null);

    // Stepper
    const [activeStep, setActiveStep] = useState(0);

    // Step 1 — Job details
    const [form, setForm] = useState({ jobDescriptionUrl: "", cvUrl: "", aimLevel: "" });

    // Step 2 — Services & rounds
    const [services, setServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(false);
    const [freeSlots, setFreeSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [rounds, setRounds] = useState(() => [createRound(), createRound()]);
    const [activeRoundIndex, setActiveRoundIndex] = useState(0);

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );
    const roundIds = useMemo(() => rounds.map((r) => r.id), [rounds]);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // ─── Data Fetching ─────────────────────────────────
    useEffect(() => {
        if (open && coachId) {
            loadServices();
            fetchFreeSlots();
        }
        if (!open) {
            setActiveStep(0);
            setForm({ jobDescriptionUrl: "", cvUrl: "", aimLevel: "" });
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
                        startTime:
                            slot.startTime && !slot.startTime.endsWith("Z") ? slot.startTime + "Z" : slot.startTime,
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

    // ─── Round Management ──────────────────────────────
    const addRound = () => {
        setRounds((prev) => [...prev, createRound()]);
    };

    const removeRound = (index) => {
        if (rounds.length <= 2) return;
        setRounds((prev) => prev.filter((_, i) => i !== index));
        if (activeRoundIndex >= rounds.length - 1) {
            setActiveRoundIndex(Math.max(0, rounds.length - 2));
        }
    };

    const updateRoundService = (index, serviceId) => {
        setRounds((prev) =>
            prev.map((r, i) => (i === index ? { ...r, coachInterviewServiceId: serviceId, startTime: null } : r)),
        );
    };

    const getServiceForRound = (round) => services.find((s) => s.id === round.coachInterviewServiceId);

    const getRoundColor = (index) => ROUND_COLORS[index % ROUND_COLORS.length];

    const getTotalPrice = () =>
        rounds.reduce((sum, r) => {
            const svc = getServiceForRound(r);
            return sum + (svc?.price || 0);
        }, 0);

    // ─── Calendar Events ───────────────────────────────
    const calendarEvents = useMemo(() => {
        const now = new Date();

        // Background events — free slot availability
        const bgEvents = freeSlots
            .filter((slot) => new Date(slot.endTime) > now)
            .map((slot) => ({
                id: `bg-${slot.id}-${slot.startTime}`,
                start: slot.startTime,
                end: slot.endTime,
                display: "background",
                backgroundColor: "#6366f1",
                groupId: "availability",
                editable: false,
            }));

        // Round preview events
        const roundEvents = rounds
            .map((round, index) => {
                if (!round.startTime || !round.coachInterviewServiceId) return null;
                const svc = getServiceForRound(round);
                if (!svc) return null;
                const endTime = addMinutes(round.startTime, svc.durationMinutes);
                return {
                    id: `round-${index}`,
                    title: `R${index + 1}: ${svc.interviewTypeName || "Interview"} (${svc.durationMinutes}m)`,
                    start: round.startTime.toISOString(),
                    end: endTime.toISOString(),
                    backgroundColor: getRoundColor(index),
                    borderColor: getRoundColor(index),
                    textColor: "#fff",
                    classNames: ["jd-round-event"],
                    editable: true,
                };
            })
            .filter(Boolean);

        return [...bgEvents, ...roundEvents];
    }, [freeSlots, rounds, services]);

    // ─── Calendar Click Handler ────────────────────────
    const handleCalendarDateClick = useCallback(
        (info) => {
            const currentRound = rounds[activeRoundIndex];
            if (!currentRound?.coachInterviewServiceId) {
                toast.error(`Please select a service for Round ${activeRoundIndex + 1} first`);
                return;
            }

            const svc = getServiceForRound(currentRound);
            if (!svc) return;

            const clickedTime = info.date;
            const now = new Date();

            if (clickedTime.getTime() - now.getTime() < 3 * 60 * 60 * 1000) {
                toast.error("Please select a time at least 3 hours from now");
                return;
            }

            // Snap to 15-minute floor
            const snappedTime = new Date(clickedTime);
            snappedTime.setMinutes(Math.floor(snappedTime.getMinutes() / 15) * 15, 0, 0);

            const endTime = addMinutes(snappedTime, svc.durationMinutes);

            // Check fits within a free slot
            const matchingSlot = freeSlots.find((slot) => {
                const slotStart = new Date(slot.startTime);
                const slotEnd = new Date(slot.endTime);
                return snappedTime >= slotStart && endTime <= slotEnd;
            });

            if (!matchingSlot) {
                toast.error(`This time doesn't have enough availability for ${svc.durationMinutes} minutes.`);
                return;
            }

            // Enforce strict sequence order relative to previous and next rounds only
            const gapMs = 15 * 60 * 1000;

            // Previous round must end + gap <= this start
            if (activeRoundIndex > 0) {
                const prev = rounds[activeRoundIndex - 1];
                if (prev.startTime && prev.coachInterviewServiceId) {
                    const prevSvc = getServiceForRound(prev);
                    if (prevSvc) {
                        const prevEnd = addMinutes(prev.startTime, prevSvc.durationMinutes);
                        if (snappedTime.getTime() < prevEnd.getTime() + gapMs) {
                            toast.error(`Round ${activeRoundIndex + 1} must start at least 15 minutes after Round ${activeRoundIndex} ends.`);
                            return;
                        }
                    }
                }
            }

            // Next round (if set) must start at least gap after this round's end
            if (activeRoundIndex < rounds.length - 1) {
                const next = rounds[activeRoundIndex + 1];
                if (next.startTime && next.coachInterviewServiceId) {
                    const nextStart = next.startTime;
                    if (endTime.getTime() + gapMs > nextStart.getTime()) {
                        toast.error(`Round ${activeRoundIndex + 1} must end at least 15 minutes before Round ${activeRoundIndex + 2} starts.`);
                        return;
                    }
                }
            }

            setRounds((prev) => prev.map((r, i) => (i === activeRoundIndex ? { ...r, startTime: snappedTime } : r)));
            toast.success(`Round ${activeRoundIndex + 1} set to ${format(snappedTime, "dd/MM HH:mm")}`);
        },
        [activeRoundIndex, rounds, services, freeSlots],
    );

    const handleEventDrop = useCallback(
        (info) => {
            const { event } = info;

            if (!event.id || !event.id.startsWith("round-")) {
                info.revert();
                return;
            }

            const indexStr = event.id.replace("round-", "");
            const roundIndex = Number.parseInt(indexStr, 10);
            if (Number.isNaN(roundIndex) || roundIndex < 0 || roundIndex >= rounds.length) {
                info.revert();
                return;
            }

            const targetRound = rounds[roundIndex];
            const svc = getServiceForRound(targetRound);
            if (!svc) {
                info.revert();
                return;
            }

            const newStart = event.start;
            if (!newStart) {
                info.revert();
                return;
            }

            const now = new Date();
            if (newStart.getTime() - now.getTime() < 3 * 60 * 60 * 1000) {
                toast.error("Please select a time at least 3 hours from now");
                info.revert();
                return;
            }

            const snappedTime = new Date(newStart);
            snappedTime.setMinutes(Math.floor(snappedTime.getMinutes() / 15) * 15, 0, 0);

            const endTime = addMinutes(snappedTime, svc.durationMinutes);

            const matchingSlot = freeSlots.find((slot) => {
                const slotStart = new Date(slot.startTime);
                const slotEnd = new Date(slot.endTime);
                return snappedTime >= slotStart && endTime <= slotEnd;
            });

            if (!matchingSlot) {
                toast.error(`This time doesn't have enough availability for ${svc.durationMinutes} minutes.`);
                info.revert();
                return;
            }

            const gapMs = 15 * 60 * 1000;

            // Check previous round (roundIndex - 1)
            if (roundIndex > 0) {
                const prev = rounds[roundIndex - 1];
                if (prev.startTime && prev.coachInterviewServiceId) {
                    const prevSvc = getServiceForRound(prev);
                    if (prevSvc) {
                        const prevEnd = addMinutes(prev.startTime, prevSvc.durationMinutes);
                        if (snappedTime.getTime() < prevEnd.getTime() + gapMs) {
                            toast.error(`Round ${roundIndex + 1} must start at least 15 minutes after Round ${roundIndex} ends.`);
                            info.revert();
                            return;
                        }
                    }
                }
            }

            // Check next round (roundIndex + 1)
            if (roundIndex < rounds.length - 1) {
                const next = rounds[roundIndex + 1];
                if (next.startTime && next.coachInterviewServiceId) {
                    const nextStart = next.startTime;
                    if (endTime.getTime() + gapMs > nextStart.getTime()) {
                        toast.error(`Round ${roundIndex + 1} must end at least 15 minutes before Round ${roundIndex + 2} starts.`);
                        info.revert();
                        return;
                    }
                }
            }

            setRounds((prev) => prev.map((r, i) => (i === roundIndex ? { ...r, startTime: snappedTime } : r)));
            toast.success(`Round ${roundIndex + 1} moved to ${format(snappedTime, "dd/MM HH:mm")}`);
        },
        [rounds, services, freeSlots],
    );

    // ─── Submission ────────────────────────────────────
    const handleSubmit = async () => {
        setError("");

        // Build validation input
        const selectedRounds = rounds.map((r) => {
            const svc = getServiceForRound(r);
            return {
                serviceId: r.coachInterviewServiceId,
                startTime: r.startTime,
                durationMinutes: svc?.durationMinutes || 0,
            };
        });

        const parsedSlots = freeSlots.map((s) => ({
            id: s.id,
            startTime: new Date(s.startTime),
            endTime: new Date(s.endTime),
        }));

        const validation = validateJDBookingRounds(selectedRounds, parsedSlots);
        if (!validation.isValid) {
            setError(validation.errorMsg);
            return;
        }

        setSaving(true);
        try {
            const payload = {
                coachId,
                jobDescriptionUrl: form.jobDescriptionUrl.trim(),
                cvUrl: form.cvUrl.trim(),
                rounds: rounds.map((r) => ({
                    coachInterviewServiceId: r.coachInterviewServiceId,
                    startTime: r.startTime.toISOString(),
                })),
            };
            if (form.aimLevel !== "") {
                payload.aimLevel = Number(form.aimLevel);
            }

            const booking = await createJDBookingRequest(payload);
            const returnUrl = window.location.origin + window.location.pathname;
            const payResult = await payBookingRequest(booking.id, { returnUrl });

            if (payResult?.checkOutUrl) {
                onClose();
                window.location.href = payResult.checkOutUrl;
            } else {
                toast.success("Booking confirmed — already paid!");
                onClose();
                navigate("/booking-requests");
            }
        } catch (err) {
            setError(err.message || "Failed to confirm booking.");
        } finally {
            setSaving(false);
        }
    };

    // ─── Step Navigation ───────────────────────────────
    const canProceedStep1 = form.jobDescriptionUrl.trim() && form.cvUrl.trim();
    const allRoundsConfigured = rounds.every((r) => r.coachInterviewServiceId && r.startTime);

    const handleNextStep = () => {
        if (activeStep === 0 && canProceedStep1) setActiveStep(1);
    };

    const handleBackStep = () => {
        if (activeStep === 1) setActiveStep(0);
    };

    const handleClose = () => {
        onClose();
    };

    // ─── Style constants ───────────────────────────────
    const fieldSx = {
        "& .MuiOutlinedInput-root": {
            "&:hover fieldset": { borderColor: "#667eea" },
            "&.Mui-focused fieldset": { borderColor: "#667eea" },
        },
        "& .MuiInputLabel-root.Mui-focused": { color: "#667eea" },
    };

    // ─── Drag & Drop ───────────────────────────────────
    const handleDragEnd = useCallback(
        (event) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;

            setRounds((prev) => {
                const oldIndex = prev.findIndex((r) => r.id === active.id);
                const newIndex = prev.findIndex((r) => r.id === over.id);
                if (oldIndex === -1 || newIndex === -1) return prev;
                return arrayMove(prev, oldIndex, newIndex);
            });

            // Adjust active round index to follow the card
            setActiveRoundIndex((prevIdx) => {
                const oldIndex = rounds.findIndex((r) => r.id === active.id);
                const newIndex = rounds.findIndex((r) => r.id === over.id);
                if (prevIdx === oldIndex) return newIndex;
                if (oldIndex < prevIdx && newIndex >= prevIdx) return prevIdx - 1;
                if (oldIndex > prevIdx && newIndex <= prevIdx) return prevIdx + 1;
                return prevIdx;
            });
        },
        [rounds],
    );

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{ sx: dialogStyles.paper }}
        >
            <DialogTitle
                sx={{ fontWeight: 700, pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
                <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", color: "#111827" }}>
                        JD Multi-Round Interview Booking
                    </Typography>
                    <Typography sx={{ fontSize: "0.85rem", color: "#6b7280", mt: 0.5 }}>
                        Submit your JD & CV, then pick times for each round on the calendar.
                    </Typography>
                </Box>
                <IconButton onClick={handleClose} size="small" sx={{ color: "#6b7280" }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 2, minHeight: 500 }}>
                <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                    {STEPS.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
                        {error}
                    </Alert>
                )}

                {/* ──── STEP 1: Job Details ──── */}
                {activeStep === 0 && (
                    <Grid container spacing={2.5} direction="column">
                        <Grid item xs={12} sx={{ width: "100%" }}>
                            <TextField
                                fullWidth
                                label="Job Description URL"
                                value={form.jobDescriptionUrl}
                                onChange={(e) => setForm({ ...form, jobDescriptionUrl: e.target.value })}
                                required
                                placeholder="https://..."
                                sx={fieldSx}
                            />
                        </Grid>
                        <Grid item xs={12} sx={{ width: "100%" }}>
                            <TextField
                                fullWidth
                                label="CV URL"
                                value={form.cvUrl}
                                onChange={(e) => setForm({ ...form, cvUrl: e.target.value })}
                                required
                                placeholder="https://..."
                                sx={fieldSx}
                            />
                        </Grid>
                        <Grid item xs={12} sx={{ width: "100%" }}>
                            <TextField
                                fullWidth
                                select
                                label="Target Level (optional)"
                                value={form.aimLevel}
                                onChange={(e) => setForm({ ...form, aimLevel: e.target.value })}
                                sx={fieldSx}
                            >
                                <MenuItem value="">None</MenuItem>
                                {Object.entries(AIM_LEVEL_LABELS).map(([val, label]) => (
                                    <MenuItem key={val} value={val}>
                                        {label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                    </Grid>
                )}

                {/* ──── STEP 2: Rounds + Calendar ──── */}
                {activeStep === 1 && (
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2.5}>
                        {/* Left: Calendar */}
                        <Box sx={{ flex: 1 }} className="jd-calendar-container booking-calendar-container">
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
                                buttonText={{ today: "Today", week: "Week", day: "Day" }}
                                events={calendarEvents}
                                dateClick={handleCalendarDateClick}
                                selectable={false}
                                editable={false}
                                eventStartEditable={true}
                                eventDurationEditable={false}
                                eventDrop={handleEventDrop}
                                eventConstraint="availability"
                                now={new Date()}
                                nowIndicator={true}
                                snapDuration="00:15:00"
                                height="auto"
                                timeZone="local"
                                slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
                                eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
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
                                {rounds.map((_, i) => (
                                    <Stack key={i} direction="row" spacing={0.5} alignItems="center">
                                        <Box
                                            sx={{
                                                width: 14,
                                                height: 14,
                                                borderRadius: "3px",
                                                bgcolor: getRoundColor(i),
                                            }}
                                        />
                                        <Typography variant="caption" color="text.secondary">
                                            Round {i + 1}
                                        </Typography>
                                    </Stack>
                                ))}
                            </Stack>
                        </Box>


                        {/* Right: Rounds Panel */}
                        <Box sx={{ width: { xs: "100%", md: 320 }, flexShrink: 0 }}>
                            <Stack spacing={1.5}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography fontWeight={700} fontSize="0.95rem" color="#111827">
                                        Interview Rounds
                                    </Typography>
                                    <Button
                                        size="small"
                                        startIcon={<AddIcon />}
                                        onClick={addRound}
                                        sx={{ textTransform: "none", color: "#4F46E5", fontWeight: 600 }}
                                    >
                                        Add
                                    </Button>
                                </Stack>

                                {loadingServices ? (
                                    <Box display="flex" justifyContent="center" py={3}>
                                        <CircularProgress size={24} />
                                    </Box>
                                ) : (
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <SortableContext items={roundIds} strategy={verticalListSortingStrategy}>
                                            {rounds.map((round, index) => (
                                                <SortableRoundCard
                                                    key={round.id}
                                                    round={round}
                                                    index={index}
                                                    isActive={activeRoundIndex === index}
                                                    canDelete={rounds.length > 2}
                                                    color={getRoundColor(index)}
                                                    service={getServiceForRound(round)}
                                                    services={services}
                                                    fieldSx={fieldSx}
                                                    onActivate={() => setActiveRoundIndex(index)}
                                                    onRemove={() => removeRound(index)}
                                                    onServiceChange={(val) => updateRoundService(index, val)}
                                                />
                                            ))}
                                        </SortableContext>
                                    </DndContext>
                                )}

                                <Divider />

                                {/* Total */}
                                {getTotalPrice() > 0 && (
                                    <Box
                                        sx={{
                                            p: 1.5,
                                            borderRadius: 2,
                                            backgroundColor: "#f0f4ff",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Typography fontSize="0.85rem" color="#4338ca" fontWeight={600}>
                                            Estimated Total
                                        </Typography>
                                        <Typography fontSize="1rem" color="#4338ca" fontWeight={700}>
                                            {getTotalPrice().toLocaleString()} ₫
                                        </Typography>
                                    </Box>
                                )}

                                {/* Instructions */}
                                {!allRoundsConfigured && (
                                    <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#f9fafb", borderRadius: "10px" }}>
                                        <EventAvailableIcon sx={{ fontSize: 32, color: "#9ca3af", mb: 0.5 }} />
                                        <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                                            Select a service for each round, then click within the{" "}
                                            <strong style={{ color: "#6366f1" }}>highlighted areas</strong> on the
                                            calendar.
                                        </Typography>
                                    </Paper>
                                )}
                            </Stack>
                        </Box>
                    </Stack>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1, justifyContent: "space-between" }}>
                <Box>
                    {activeStep === 1 && (
                        <Button
                            onClick={handleBackStep}
                            variant="text"
                            startIcon={<ArrowBackIcon />}
                            sx={{ color: "#4f46e5" }}
                        >
                            Back
                        </Button>
                    )}
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button onClick={handleClose} variant="outlined" color="inherit" disabled={saving}>
                        Cancel
                    </Button>
                    {activeStep === 0 ? (
                        <Button
                            onClick={handleNextStep}
                            variant="contained"
                            disabled={!canProceedStep1}
                            sx={{
                                backgroundColor: "#4F46E5",
                                fontWeight: 600,
                                "&:hover": { backgroundColor: "#4338CA" },
                                "&:disabled": { backgroundColor: "#E5E7EB", color: "#9CA3AF" },
                            }}
                        >
                            Next
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            disabled={!allRoundsConfigured || saving}
                            sx={{
                                backgroundColor: "#4F46E5",
                                fontWeight: 600,
                                "&:hover": { backgroundColor: "#4338CA" },
                                "&:disabled": { backgroundColor: "#E5E7EB", color: "#9CA3AF" },
                            }}
                        >
                            {saving ? "Confirming..." : "Confirm & Pay"}
                        </Button>
                    )}
                </Stack>
            </DialogActions>
        </Dialog>
    );
}
