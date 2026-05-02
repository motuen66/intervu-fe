import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Dialog,
    DialogContent,
    Box,
    Typography,
    Stack,
    Paper,
    TextField,
    Alert,
    Chip,
    Divider,
    IconButton,
    Grow,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CodeIcon from "@mui/icons-material/Code";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import DescriptionIcon from "@mui/icons-material/Description";
import GroupsIcon from "@mui/icons-material/Groups";
import PsychologyIcon from "@mui/icons-material/Psychology";
import LanguageIcon from "@mui/icons-material/Language";
import { addMonths, format, startOfDay, isSameDay } from "date-fns";
import { callApi } from "../../../../../common/utils/apiConnector";
import { METHOD } from "../../../../../common/constants/api";
import { getCoachInterviewServices } from "../../../../coach/services/coachInterviewServiceApi";
import toast from "react-hot-toast";
import { PrimaryButton, SecondaryButton } from "../../../../../common/components/buttons";
import CalendlyCalendar from "../../../../../common/components/CalendlyCalendar";
import "./BookingSlotDialog.css";

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Grow ref={ref} {...props} timeout={500} />;
});

const BLOCK_MINUTES = 30;
const CANDIDATE_NOTE_MAX_LENGTH = 1000;

/**
 * Given a starting block, find N consecutive blocks from the available pool.
 */
function findConsecutiveBlocks(startBlock, requiredCount, availableBlocks) {
    if (requiredCount <= 0) return [];
    const sorted = [...availableBlocks].sort(
        (a, b) => new Date(a.startTime) - new Date(b.startTime)
    );
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

const BookingSlotDialog = ({ open, onClose, interviewerId, onSlotSelected, initialService = null }) => {
    const [activeStep, setActiveStep] = useState(0);

    // Step 1 - Service selection
    const [services, setServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(false);
    const [selectedService, setSelectedService] = useState(null);

    // Step 2 - Calendly-style date & time
    const [freeSlots, setFreeSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSlotData, setSelectedSlotData] = useState(null); // { startBlock, blocks }

    const [error, setError] = useState(null);
    const [candidateNote, setCandidateNote] = useState("");

    // Data fetching
    useEffect(() => {
        if (open && interviewerId) {
            loadServices();
            fetchFreeSlots();
            if (initialService) {
                setSelectedService(initialService);
                setActiveStep(1);
            }
        }
        if (!open) {
            setActiveStep(0);
            setSelectedService(null);
            setSelectedDate(null);
            setSelectedSlotData(null);
            setCurrentMonth(new Date());
            setError(null);
            setCandidateNote("");
        }
    }, [open, interviewerId, initialService]);

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
                    endpoint: `/availabilities/${interviewerId}/free-slots?month=${month}&year=${year}`,
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
            setError("Error loading availability: " + err.message);
        } finally {
            setLoadingSlots(false);
        }
    };

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

    const requiredBlocks = useMemo(() => {
        if (!selectedService) return 0;
        return Math.max(1, Math.ceil((selectedService.durationMinutes || BLOCK_MINUTES) / BLOCK_MINUTES));
    }, [selectedService]);

    // Compute all selectable 30-minute blocks for the selected date
    const dayTimeBlocks = useMemo(() => {
        if (!selectedDate || !selectedService) return [];
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const now = new Date();
        const minStartTime = now.getTime() + 3 * 60 * 60 * 1000;

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
    }, [selectedDate, selectedService, freeSlots]);

    // Handlers
    const handleServiceSelect = (service) => {
        setSelectedService(service);
        setSelectedDate(null);
        setSelectedSlotData(null);
    };

    const handleNextStep = () => {
        if (activeStep === 0 && selectedService) setActiveStep(1);
    };

    const handleBackStep = () => {
        if (activeStep === 1) {
            setActiveStep(0);
            setSelectedDate(null);
            setSelectedSlotData(null);
        }
    };

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setSelectedSlotData(null);
    };

    const handleTimeSelect = (slotBlock) => {
        if (!selectedService) return;

        const chain = findConsecutiveBlocks(slotBlock, requiredBlocks, dayTimeBlocks);
        if (!chain) {
            toast.error(`Need ${requiredBlocks} consecutive 30-minute slots for this ${selectedService.durationMinutes}-minute service.`);
            return;
        }

        setSelectedSlotData({
            startBlock: slotBlock,
            blocks: chain,
            time: new Date(slotBlock.startTime),
        });
    };

    const handleConfirmBooking = () => {
        if (!selectedService || !selectedSlotData) return;
        if (onSlotSelected) {
            const trimmedNote = candidateNote.trim();
            onSlotSelected({
                slot: selectedSlotData.startBlock,
                service: selectedService,
                startTime: selectedSlotData.time,
                ...(trimmedNote ? { candidateNote: trimmedNote.slice(0, CANDIDATE_NOTE_MAX_LENGTH) } : {}),
            });
        }
        onClose();
    };

    const getServiceIcon = (name) => {
        const lower = name?.toLowerCase() || "";
        if (lower.includes("soft skill")) return <PsychologyIcon />;
        if (lower.includes("cv") || lower.includes("resume")) return <DescriptionIcon />;
        if (lower.includes("technical") || lower.includes("coding")) return <CodeIcon />;
        return <GroupsIcon />;
    };

    const userTimezone = useMemo(() => {
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const now = new Date();
            const offsetStr = format(now, "HH:mm");
            return { name: tz.replace(/_/g, " "), time: offsetStr };
        } catch {
            return { name: "Local Time", time: "" };
        }
    }, []);

    // Block IDs consumed by the current selection (for multi-block services)
    const selectedBlockIds = useMemo(() => {
        if (!selectedSlotData) return new Set();
        return new Set(selectedSlotData.blocks.map((b) => String(b.id)));
    }, [selectedSlotData]);

    const canConfirm = selectedService && selectedSlotData;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            TransitionComponent={Transition}
            PaperProps={{ className: "booking-dialog-paper" }}
        >
            <Box className="booking-header">
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: "absolute",
                        right: 24,
                        top: 24,
                        color: "text.secondary",
                        bgcolor: "action.hover",
                        "&:hover": { bgcolor: "action.selected" },
                        zIndex: 10,
                    }}
                >
                    <CloseIcon />
                </IconButton>

                <span className="booking-header-tag">Single-Focus Interview</span>
                <Typography className="booking-header-title">
                    {activeStep === 0 ? "Select a Service" : "Select a Date & Time"}
                </Typography>
                <Typography className="booking-header-subtitle">
                    {activeStep === 0
                        ? "Choose your interview type to see available time slots."
                        : `${selectedService?.interviewTypeName || "Interview"} - ${selectedService?.durationMinutes} min`}
                </Typography>
            </Box>

            <DialogContent sx={{ overflowY: "auto", px: 0, pb: 0 }}>
                {error && (
                    <Box sx={{ px: 5, mb: 2 }}>
                        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
                    </Box>
                )}

                {/* STEP 1: Service Selection */}
                {activeStep === 0 && (
                    <Box className="booking-service-list">
                        {loadingServices ? (
                            <Box display="flex" justifyContent="center" py={10}>
                                <Typography color="text.secondary" fontWeight={600}>
                                    Loading services...
                                </Typography>
                            </Box>
                        ) : services.length === 0 ? (
                            <Paper sx={{ p: 6, textAlign: "center", bgcolor: "background.default", borderRadius: "16px", border: "none" }}>
                                <Typography color="text.secondary">This coach hasn't set up any services yet.</Typography>
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
                                                        <Chip label="CODING" size="small" sx={{ height: 18, fontSize: "9px", fontWeight: 800, bgcolor: "primary.main", color: "primary.contrastText", ml: 1.5 }} />
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
                                                {(service.price || 0).toLocaleString()}{" "}
                                                <span style={{ fontSize: "14px", fontWeight: 600 }}>VND</span>
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        )}
                    </Box>
                )}

                {/* STEP 2: Calendly-style Date & Time */}
                {activeStep === 1 && (
                    <Box sx={{ px: 5, pb: 4 }}>
                        {loadingSlots ? (
                            <Box display="flex" justifyContent="center" py={10}>
                                <Typography color="text.secondary" fontWeight={600}>
                                    Loading available slots...
                                </Typography>
                            </Box>
                        ) : (
                            <Stack direction={{ xs: "column", md: "row" }} spacing={0} sx={{ minHeight: 420 }}>
                                {/* Left: Calendar */}
                                <Box sx={{ flex: "0 0 auto", width: { xs: "100%", md: 470 }, pr: { md: 4 }, pb: { xs: 3, md: 0 }, borderRight: { md: "1px solid" }, borderColor: { md: "divider" } }}>
                                    <CalendlyCalendar
                                        currentMonth={currentMonth}
                                        onPrevMonth={() => setCurrentMonth((m) => addMonths(m, -1))}
                                        onNextMonth={() => setCurrentMonth((m) => addMonths(m, 1))}
                                        selectedDate={selectedDate}
                                        onDateSelect={handleDateSelect}
                                        availableDates={availableDates}
                                    />

                                    {/* Timezone */}
                                    <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
                                        <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "text.secondary", mb: 0.5 }}>
                                            Time zone
                                        </Typography>
                                        <Stack direction="row" alignItems="center" spacing={0.75}>
                                            <LanguageIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                                            <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "text.primary" }}>
                                                {userTimezone.name}
                                            </Typography>
                                        </Stack>
                                    </Box>
                                </Box>

                                {/* Right: Time slots */}
                                <Box sx={{ flex: 1, pl: { md: 4 }, minWidth: 0 }}>
                                    {!selectedDate ? (
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 300 }}>
                                            <Typography sx={{ color: "text.secondary", fontWeight: 500, fontSize: "0.95rem" }}>
                                                Select a date to see available times
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <>
                                            <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: "text.primary", mb: 2.5 }}>
                                                {format(selectedDate, "EEEE, MMMM d")}
                                            </Typography>
                                            {dayTimeBlocks.length === 0 ? (
                                                <Box sx={{ textAlign: "center", py: 6 }}>
                                                    <Typography color="text.secondary" fontSize="0.9rem">
                                                        No available 30-minute slots on this date.
                                                    </Typography>
                                                </Box>
                                            ) : (
                                                <Box className="calendly-timeslot-list">
                                                    {dayTimeBlocks.map((slot) => {
                                                        const isSelected = selectedBlockIds.has(String(slot.id));
                                                        const startTime = new Date(slot.startTime);
                                                        const endTime = new Date(slot.endTime);
                                                        return (
                                                            <Box
                                                                key={slot.id}
                                                                className={`calendly-timeslot ${isSelected ? "selected" : ""}`}
                                                                onClick={() => handleTimeSelect(slot)}
                                                            >
                                                                <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>
                                                                    {format(startTime, "HH:mm")} — {format(endTime, "HH:mm")}
                                                                </Typography>
                                                            </Box>
                                                        );
                                                    })}
                                                </Box>
                                            )}
                                        </>
                                    )}
                                </Box>
                            </Stack>
                        )}
                        {activeStep === 1 && selectedSlotData && (
                            <Box sx={{ pt: 3, pb: 1 }}>
                                <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", mb: 1, color: "text.primary" }}>
                                    Note for coach{" "}
                                    <Typography component="span" color="text.secondary" fontWeight={500} fontSize="0.8rem">
                                        (optional)
                                    </Typography>
                                </Typography>
                                <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mb: 1.5 }}>
                                    Optional. Share goals, target role/company, topics to focus on, or anything the coach should know.
                                </Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    minRows={3}
                                    size="small"
                                    placeholder="Your note..."
                                    value={candidateNote}
                                    onChange={(e) =>
                                        setCandidateNote(e.target.value.slice(0, CANDIDATE_NOTE_MAX_LENGTH))
                                    }
                                    inputProps={{ maxLength: CANDIDATE_NOTE_MAX_LENGTH }}
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: "12px",
                                            bgcolor: "background.default",
                                        },
                                    }}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                                    {candidateNote.length}/{CANDIDATE_NOTE_MAX_LENGTH}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>

            {/* Footer */}
            <Box className="booking-footer-premium">
                <Box>
                    {activeStep === 1 ? (
                        <SecondaryButton onClick={handleBackStep} startIcon={<ArrowBackIosNewIcon sx={{ fontSize: 14 }} />}>
                            Back
                        </SecondaryButton>
                    ) : (
                        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
                    )}
                </Box>
                <Stack direction="row" alignItems="center">
                    {selectedService && (
                        <Box className="price-summary-box">
                            <span className="price-label">Total Price</span>
                            <span className="price-amount">
                                {(selectedService.price || 0).toLocaleString()} VND
                            </span>
                        </Box>
                    )}
                    {activeStep === 0 ? (
                        <PrimaryButton disabled={!selectedService} onClick={handleNextStep}>
                            Next Step
                        </PrimaryButton>
                    ) : (
                        <PrimaryButton disabled={!canConfirm} onClick={handleConfirmBooking}>
                            Confirm & Pay
                        </PrimaryButton>
                    )}
                </Stack>
            </Box>
        </Dialog>
    );
};

export default BookingSlotDialog;
