import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Dialog from "@mui/material/Dialog";
import Grow from "@mui/material/Grow";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Divider from "@mui/material/Divider";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
import LanguageIcon from "@mui/icons-material/Language";
import { Link, FileUser, ArrowRight, Target, Search, Terminal, CheckCircle, Edit2, UploadCloud } from "lucide-react";
import { uploadMedia } from "../../../../../common/services/mediaApi";

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
import { addMonths, format, startOfDay } from "date-fns";
import { AIM_LEVEL_LABELS } from "../../../../../common/constants/status";
import { getCoachInterviewServices } from "../../../../coach/services/coachInterviewServiceApi";
import { candidateProfileEndPoints } from "../../../../profiles/candidate/service/candidateProfileApi";
import { createJDBookingRequest, payBookingRequest } from "../../../../interview/services/bookingRequestApi";
import { callApi } from "../../../../../common/utils/apiConnector";
import { METHOD } from "../../../../../common/constants/api";
import { validateJDBookingRounds, isValidUrl } from "./jdBookingValidation";
import toast from "react-hot-toast";
import { useTheme } from "@mui/material/styles";
import { dialogStyles } from "../../../../../common/constants/uiStyles";
import CalendlyCalendar from "../../../../../common/components/CalendlyCalendar";
import StatusChip from "../../../../../common/components/StatusChip";
import FormSelect from "../../../../../common/components/form/FormSelect";
import FormTextField from "../../../../../common/components/form/FormTextField";
import { PrimaryButton, SecondaryButton, TextButton } from "../../../../../common/components/buttons";
import { formatCurrency } from "../../../../../common/utils/dateFormatter";
import "./JDBookingDialog.css";

const STEPS = ["Job Details & Rounds", "Schedule Rounds"];
const BLOCK_MINUTES = 30;
const CANDIDATE_NOTE_MAX_LENGTH = 1000;

let nextRoundId = 1;
const createRound = () => ({
    id: `round-${nextRoundId++}`,
    coachInterviewServiceId: "",
    startTime: null,
    availabilityIds: [],
});

/**
 * Given a starting block, find N consecutive blocks from the available pool.
 */
function findConsecutiveBlocks(startBlock, requiredCount, availableBlocks) {
    if (requiredCount <= 0) return [];
    const sorted = [...availableBlocks].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

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

// ─── Sortable Round Card (Step 1) ──
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
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: round.id });
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
            className={`jd-round-card-stitch ${isActive ? "active" : ""}`}
            sx={{
                width: 280,
                height: 170,
                p: 2.5,
                flexShrink: 0,
                cursor: "pointer",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 12px 24px -10px rgba(15, 23, 42, 0.12)",
                    borderColor: "#94a3b8",
                },
            }}
        >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box className="jd-card-icon-wrap jd-card-icon-wrap--dark">
                    <IconComponent size={18} color="#e2e8f0" />
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {canDelete && (
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove();
                            }}
                            sx={{
                                color: "#94a3b8",
                                bgcolor: "rgba(241, 245, 249, 0.5)",
                                p: 0.5,
                                "&:hover": { color: "#ef4444", bgcolor: "rgba(239, 68, 68, 0.1)" },
                            }}
                        >
                            <DeleteIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                    )}
                    <Box className="jd-round-badge" sx={{ position: "relative", top: 0, right: 0 }}>
                        ROUND {String(index + 1).padStart(2, "0")}
                    </Box>
                </Box>
            </Box>
            <Box>
                <Typography className="jd-label-mini" sx={{ mb: 1, color: "#94a3b8", fontSize: "0.65rem" }}>
                    SERVICE TYPE
                </Typography>
                <FormSelect
                    fullWidth
                    size="small"
                    value={round.coachInterviewServiceId}
                    onChange={(e) => {
                        e.stopPropagation();
                        onServiceChange(e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                        borderRadius: "10px",
                        bgcolor: "#f8fafc",
                        fontWeight: 400,
                        fontSize: "0.8rem",
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e2e8f0" },
                    }}
                >
                    {services.map((s) => {
                        const isAlreadySelected = allRounds.some(
                            (r) => r.id !== round.id && r.coachInterviewServiceId === s.id,
                        );
                        return (
                            <MenuItem key={s.id} value={s.id} disabled={isAlreadySelected}>
                                <Typography variant="body2" fontWeight={400}>
                                    {s.interviewTypeName} {isAlreadySelected && "(Already selected)"}
                                </Typography>
                            </MenuItem>
                        );
                    })}
                </FormSelect>
            </Box>
        </Box>
    );
}

// ─── Round Schedule Timeline Item (Step 2 sidebar) ──
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
        if (disabled && !isDone) {
            toast.error(`Please set a time for Round ${index} first.`);
            return;
        }
        onActivate();
    };

    const isDone = Boolean(round.startTime && round.availabilityIds?.length > 0);
    const isPending = !isDone && disabled;
    const statusClassName = isDone ? "done" : isPending ? "pending" : "current";

    let subtitle = "Selecting time...";
    if (isDone) {
        const blockCount = round.availabilityIds?.length || 0;
        subtitle = `${format(round.startTime, "MMM dd 'at' HH:mm")} (${blockCount} block${blockCount > 1 ? "s" : ""})`;
    } else if (isPending) {
        subtitle = blockedByRoundNumber ? `Complete Round ${blockedByRoundNumber} first` : "Pending";
    }

    return (
        <Box
            onClick={handleClick}
            className={`jd-schedule-item ${statusClassName} ${isActive ? "active" : ""} ${disabled && !isDone ? "disabled" : ""}`}
            sx={{ cursor: disabled && !isDone ? "not-allowed" : "pointer" }}
        >
            <Box className="jd-schedule-marker-wrap">
                <Box className="jd-schedule-marker">
                    {isDone ? <CheckIcon sx={{ fontSize: 12 }} /> : <Typography>{index + 1}</Typography>}
                </Box>
                {!isLast && <Box className="jd-schedule-line" />}
            </Box>
            <Box className="jd-schedule-content">
                <Box
                    sx={{
                        display: "inline-flex",
                        px: 1,
                        py: 0.25,
                        borderRadius: "4px",
                        bgcolor: "rgba(99, 102, 241, 0.08)",
                        border: "1px solid rgba(99, 102, 241, 0.12)",
                        mb: 0.75,
                    }}
                >
                    <Typography
                        sx={{
                            fontFamily: "inherit",
                            fontWeight: 900,
                            fontSize: "0.6rem",
                            color: "#4f46e5",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                        }}
                    >
                        ROUND {index + 1}
                    </Typography>
                </Box>
                <Typography component="p" sx={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b" }}>
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
                    <Edit2 size={10} color="#b45309" strokeWidth={4} />
                    <Typography
                        sx={{
                            fontSize: "0.55rem",
                            fontWeight: 900,
                            color: "#b45309",
                            letterSpacing: "0.05em",
                            lineHeight: 1,
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

    const [activeStep, setActiveStep] = useState(0);
    const [form, setForm] = useState({ jobDescriptionUrl: "", cvUrl: "", aimLevel: "" });
    const [formErrors, setFormErrors] = useState({ jobDescriptionUrl: "", cvUrl: "" });
    const [uploadingJd, setUploadingJd] = useState(false);
    const [uploadingCv, setUploadingCv] = useState(false);
    const [jdUploadingName, setJdUploadingName] = useState("");
    const [cvUploadingName, setCvUploadingName] = useState("");
    const [bookingSessionId, setBookingSessionId] = useState("");
    const [uploadedMeta, setUploadedMeta] = useState({
        jobDescriptionUrl: null,
        cvUrl: null,
    });
    const [manualUrls, setManualUrls] = useState({ jobDescriptionUrl: "", cvUrl: "" });
    const [urlInputMode, setUrlInputMode] = useState({ jobDescriptionUrl: "link", cvUrl: "link" });
    const [cvSource, setCvSource] = useState("manual");
    const [profileCvUrl, setProfileCvUrl] = useState("");
    const [loadingProfileCv, setLoadingProfileCv] = useState(false);
    const [hasAttemptedProfileCvFetch, setHasAttemptedProfileCvFetch] = useState(false);

    const { userData } = useSelector((state) => state.auth);

    const jdFileInputRef = React.useRef(null);
    const cvFileInputRef = React.useRef(null);
    const profileCvFetchRequestRef = React.useRef(0);
    const [services, setServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(false);
    const [freeSlots, setFreeSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [rounds, setRounds] = useState(() => [createRound(), createRound()]);
    const [activeRoundIndex, setActiveRoundIndex] = useState(0);
    const [stepTransitionClass, setStepTransitionClass] = useState("jd-step-enter-forward");

    // Calendly-style state
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [candidateNote, setCandidateNote] = useState("");

    const fetchProfileCvUrl = useCallback(async () => {
        if (!userData?.id) {
            setProfileCvUrl("");
            setHasAttemptedProfileCvFetch(false);
            setLoadingProfileCv(false);
            return;
        }

        const requestId = ++profileCvFetchRequestRef.current;
        setLoadingProfileCv(true);
        setHasAttemptedProfileCvFetch(false);

        try {
            const endpoint = candidateProfileEndPoints.VIEW_OWN_CANDIDATE_PROFILE.replace("{id}", userData.id);
            const response = await callApi({
                method: METHOD.GET,
                endpoint,
            });

            if (profileCvFetchRequestRef.current !== requestId) return;

            if (response?.success) {
                setProfileCvUrl((response?.data?.cvUrl || "").trim());
            } else {
                setProfileCvUrl("");
            }
        } catch (err) {
            if (profileCvFetchRequestRef.current !== requestId) return;
            console.error("Error fetching profile CV:", err);
            setProfileCvUrl("");
        } finally {
            if (profileCvFetchRequestRef.current === requestId) {
                setHasAttemptedProfileCvFetch(true);
                setLoadingProfileCv(false);
            }
        }
    }, [userData?.id]);

    useEffect(() => {
        if (open && coachId) {
            loadServices();
            fetchFreeSlots();
            setBookingSessionId(crypto.randomUUID?.() || Date.now().toString());
        }

        if (open && userData?.id) {
            fetchProfileCvUrl();
        }

        if (open && !userData?.id) {
            setProfileCvUrl("");
            setLoadingProfileCv(false);
            setHasAttemptedProfileCvFetch(false);
        }

        if (!open) {
            setActiveStep(0);
            setForm({ jobDescriptionUrl: "", cvUrl: "", aimLevel: "" });
            setFormErrors({ jobDescriptionUrl: "", cvUrl: "" });
            setRounds([createRound(), createRound()]);
            setActiveRoundIndex(0);
            setSelectedDate(null);
            setCurrentMonth(new Date());
            setError("");
            setBookingSessionId("");
            setJdUploadingName("");
            setCvUploadingName("");
            setUploadedMeta({ jobDescriptionUrl: null, cvUrl: null });
            setManualUrls({ jobDescriptionUrl: "", cvUrl: "" });
            setUrlInputMode({ jobDescriptionUrl: "link", cvUrl: "link" });
            setCvSource("manual");
            setProfileCvUrl("");
            setLoadingProfileCv(false);
            setHasAttemptedProfileCvFetch(false);
            setCandidateNote("");
        }
    }, [open, coachId, userData?.id, fetchProfileCvUrl]);

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

    const addRound = () => {
        if (rounds.length >= 5) {
            toast.error("Maximum of 5 rounds allowed.");
            return;
        }
        setRounds((prev) => [...prev, createRound()]);
    };

    const removeRound = (index) => {
        if (rounds.length <= 1) {
            toast.error("At least 1 round is required.");
            return;
        }
        setRounds((prev) => prev.filter((_, i) => i !== index));
        if (activeRoundIndex >= rounds.length - 1) setActiveRoundIndex(Math.max(0, rounds.length - 2));
    };

    const updateRoundService = (index, serviceId) => {
        setRounds((prev) =>
            prev.map((r, i) =>
                i === index ? { ...r, coachInterviewServiceId: serviceId, startTime: null, availabilityIds: [] } : r,
            ),
        );
    };

    const getServiceForRound = (round) => services.find((s) => s.id === round.coachInterviewServiceId);
    const getTotalPrice = () => rounds.reduce((sum, r) => sum + (getServiceForRound(r)?.price || 0), 0);
    const getTotalDurationMinutes = () =>
        rounds.reduce((sum, r) => sum + (getServiceForRound(r)?.durationMinutes || 0), 0);
    const hasScheduledPreviousRounds = (index) => rounds.slice(0, index).every((r) => r.startTime);

    // Block IDs used by OTHER rounds (not the active one)
    const otherUsedBlockIds = useMemo(() => {
        const ids = new Set();
        rounds.forEach((r, i) => {
            if (i !== activeRoundIndex) r.availabilityIds.forEach((id) => ids.add(String(id)));
        });
        return ids;
    }, [rounds, activeRoundIndex]);

    // Available dates that have slots (excluding other rounds' used blocks)
    const availableDates = useMemo(() => {
        const dates = new Set();
        const now = new Date();
        freeSlots.forEach((slot) => {
            if (new Date(slot.endTime) > now && !otherUsedBlockIds.has(String(slot.id))) {
                dates.add(format(new Date(slot.startTime), "yyyy-MM-dd"));
            }
        });
        return dates;
    }, [freeSlots, otherUsedBlockIds]);

    // All selectable 30-minute blocks for current round on selected date
    const dayTimeBlocks = useMemo(() => {
        const currentRound = rounds[activeRoundIndex];
        if (!selectedDate || !currentRound?.coachInterviewServiceId) return [];

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
            if (otherUsedBlockIds.has(String(slot.id))) return;
            uniqueSlots.set(start.getTime(), slot);
        });

        return [...uniqueSlots.values()].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    }, [selectedDate, rounds, activeRoundIndex, freeSlots, otherUsedBlockIds]);

    const handleDateSelect = (date) => {
        setSelectedDate(date);
    };

    const handleTimeSelect = useCallback(
        (slotBlock) => {
            const currentRound = rounds[activeRoundIndex];
            if (!hasScheduledPreviousRounds(activeRoundIndex)) {
                toast.error("Please complete scheduling previous rounds first.");
                return;
            }

            const selectedService = services.find((s) => s.id === currentRound?.coachInterviewServiceId);
            if (!selectedService) {
                toast.error("Please select a service for this round first.");
                return;
            }

            const requiredBlocks = Math.max(
                1,
                Math.ceil((selectedService.durationMinutes || BLOCK_MINUTES) / BLOCK_MINUTES),
            );
            const chain = findConsecutiveBlocks(slotBlock, requiredBlocks, dayTimeBlocks);
            if (!chain) {
                toast.error(
                    `Need ${requiredBlocks} consecutive 30-minute slots for this ${selectedService.durationMinutes}-minute service.`,
                );
                return;
            }

            const selectedIds = chain.map((b) => b.id);
            setRounds((prev) =>
                prev.map((r, i) =>
                    i === activeRoundIndex
                        ? { ...r, startTime: new Date(slotBlock.startTime), availabilityIds: selectedIds }
                        : r,
                ),
            );

            // Auto-advance to next unscheduled round
            const nextRoundIndex = rounds.findIndex((r, i) => i > activeRoundIndex && !r.startTime);
            if (nextRoundIndex !== -1) {
                setActiveRoundIndex(nextRoundIndex);
                setSelectedDate(null);
            }
        },
        [activeRoundIndex, rounds, services, dayTimeBlocks],
    );

    const handleFileUpload = async (event, field) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const isJd = field === "jobDescriptionUrl";
        if (isJd) {
            setUploadingJd(true);
            setJdUploadingName(file.name);
        } else {
            setUploadingCv(true);
            setCvUploadingName(file.name);
        }

        try {
            const folder = `bookings/${userData?.id || "anonymous"}/${coachId}/${bookingSessionId}`;
            const url = await uploadMedia(file, folder);
            setForm((prev) => ({ ...prev, [field]: url }));
            setUploadedMeta((prev) => ({ ...prev, [field]: { fileName: file.name, url } }));
            setUrlInputMode((prev) => ({ ...prev, [field]: "file" }));
            if (!isJd) {
                setCvSource("uploaded");
            }
            toast.success("File uploaded successfully!");
            if (formErrors[field]) {
                setFormErrors((prev) => ({ ...prev, [field]: "" }));
            }
        } catch (err) {
            console.error("Upload error:", err);
            toast.error(err.message || "Failed to upload file");
        } finally {
            if (isJd) {
                setUploadingJd(false);
                setJdUploadingName("");
            } else {
                setUploadingCv(false);
                setCvUploadingName("");
            }
            // Clear input
            event.target.value = "";
        }
    };

    const handleSubmit = async () => {
        setError("");
        const selectedRounds = rounds.map((r) => ({
            serviceId: r.coachInterviewServiceId,
            availabilityIds: r.availabilityIds,
            durationMinutes: getServiceForRound(r)?.durationMinutes || 0,
        }));
        const validation = validateJDBookingRounds(
            selectedRounds,
            freeSlots.map((s) => ({ ...s, startTime: new Date(s.startTime), endTime: new Date(s.endTime) })),
        );
        if (!validation.isValid) {
            setError(validation.errorMsg);
            return;
        }

        setSaving(true);
        try {
            const trimmedNote = candidateNote.trim().slice(0, CANDIDATE_NOTE_MAX_LENGTH);
            const payload = {
                coachId,
                jobDescriptionUrl: form.jobDescriptionUrl.trim(),
                cvUrl: form.cvUrl.trim(),
                rounds: rounds.map((r) => ({
                    coachInterviewServiceId: r.coachInterviewServiceId,
                    availabilityIds: r.availabilityIds,
                })),
                aimLevel: form.aimLevel === "" ? undefined : Number(form.aimLevel),
                ...(trimmedNote ? { candidateNote: trimmedNote } : {}),
            };
            const booking = await createJDBookingRequest(payload);
            const payResult = await payBookingRequest(booking.id, {
                returnUrl: window.location.origin + `/booking-requests/${booking.id}`,
            });
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

    const canProceedStep1 =
        form.jobDescriptionUrl.trim() && form.cvUrl.trim() && rounds.every((r) => r.coachInterviewServiceId);
    const allRoundsConfigured = rounds.every(
        (r) => r.coachInterviewServiceId && r.startTime && r.availabilityIds.length > 0,
    );

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

            if (!rounds.every((r) => r.coachInterviewServiceId)) {
                setError("Please select a service for all interview rounds.");
                return;
            }

            setError("");
            setActiveStep(1);
            setActiveRoundIndex(0);
            setSelectedDate(null);
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

    const switchToManualLink = (field) => {
        setUrlInputMode((prev) => ({ ...prev, [field]: "link" }));
        setForm((prev) => ({ ...prev, [field]: manualUrls[field] || "" }));
        if (field === "cvUrl") {
            setCvSource("manual");
        }
    };

    const switchToUploadedFile = (field) => {
        const uploadedUrl = uploadedMeta[field]?.url;
        if (!uploadedUrl) return;
        setUrlInputMode((prev) => ({ ...prev, [field]: "file" }));
        setForm((prev) => ({ ...prev, [field]: uploadedUrl }));
        if (field === "cvUrl") {
            setCvSource("uploaded");
        }
    };

    const useProfileCv = () => {
        if (!profileCvUrl) return;
        setUrlInputMode((prev) => ({ ...prev, cvUrl: "link" }));
        setManualUrls((prev) => ({ ...prev, cvUrl: profileCvUrl }));
        setForm((prev) => ({ ...prev, cvUrl: profileCvUrl }));
        setCvSource("profile");
        if (formErrors.cvUrl) {
            setFormErrors((prev) => ({ ...prev, cvUrl: "" }));
        }
    };

    const userTimezone = useMemo(() => {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, " ");
        } catch {
            return "Local Time";
        }
    }, []);

    const activeRound = rounds[activeRoundIndex];
    const activeService = activeRound ? getServiceForRound(activeRound) : null;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="lg"
            fullWidth
            TransitionComponent={Transition}
            PaperProps={{
                className: "jd-booking-dialog-paper",
                sx: { ...dialogStyles.paper(theme), borderRadius: "20px", overflow: "hidden" },
            }}
        >
            <DialogTitle sx={{ p: 4, pb: 2, pr: 7, position: "relative" }}>
                <Box sx={{ textAlign: "left", maxWidth: "100%" }}>
                    <Typography
                        sx={{
                            fontFamily: theme.typography.h3.fontFamily,
                            fontWeight: 800,
                            fontSize: "1.5rem",
                            color: "text.primary",
                            mb: 1,
                            letterSpacing: "-0.02em",
                        }}
                    >
                        JD Multi-Round Interview Booking
                    </Typography>
                    <Typography
                        sx={{ fontSize: "0.9375rem", color: "text.secondary", lineHeight: 1.55, maxWidth: 560 }}
                    >
                        {activeStep === 1 && "Select dates and times for each round."}
                    </Typography>
                </Box>
                <IconButton
                    onClick={handleClose}
                    size="small"
                    aria-label="Close"
                    sx={{ position: "absolute", right: 20, top: 20, color: "text.secondary" }}
                >
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

                {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }} onClose={() => setError("")}>
                        {error}
                    </Alert>
                )}

                <Box key={activeStep} className={`jd-step-transition ${stepTransitionClass}`}>
                    {/* ═══ STEP 1: Job Details & Rounds ═══ */}
                    {activeStep === 0 && (
                        <Box sx={{ width: "100%" }}>
                            <Stack spacing={5}>
                                <Box className="jd-url-section">
                                    <Grid container spacing={2} sx={{ width: "100%", mx: 0 }}>
                                        <Grid
                                            item
                                            xs={12}
                                            md={4}
                                            sx={{ minWidth: 0, display: "flex", flexDirection: "column" }}
                                        >
                                            <Typography className="jd-label-mini">Job url</Typography>
                                            {uploadingJd ? (
                                                <Box className="jd-input-stitch">
                                                    <Link size={18} color="#94a3b8" aria-hidden />
                                                    <FormTextField
                                                        fullWidth
                                                        variant="standard"
                                                        placeholder={`Uploading: ${jdUploadingName}...`}
                                                        value=""
                                                        helperText="Saving to session folder..."
                                                        InputProps={{ disableUnderline: true }}
                                                        sx={{
                                                            "& .MuiInputBase-input": {
                                                                py: 0.5,
                                                                fontSize: "0.95rem",
                                                                fontWeight: 600,
                                                                color: "#0f172a",
                                                            },
                                                            "& .MuiFormHelperText-root": {
                                                                mx: 0,
                                                                fontSize: "0.7rem",
                                                                fontWeight: 500,
                                                                color: "#6366f1",
                                                            },
                                                        }}
                                                    />
                                                </Box>
                                            ) : uploadedMeta.jobDescriptionUrl && urlInputMode.jobDescriptionUrl === "file" ? (
                                                <Stack spacing={0.5}>
                                                    <Box className="jd-input-stitch" sx={{ justifyContent: "space-between" }}>
                                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                                                            <CheckCircle size={16} color="#22c55e" />
                                                            <Typography
                                                                sx={{
                                                                    fontSize: "0.88rem",
                                                                    fontWeight: 600,
                                                                    color: "#0f172a",
                                                                    overflow: "hidden",
                                                                    textOverflow: "ellipsis",
                                                                    whiteSpace: "nowrap",
                                                                    maxWidth: 180,
                                                                }}
                                                            >
                                                                {uploadedMeta.jobDescriptionUrl.fileName}
                                                            </Typography>
                                                        </Stack>
                                                        <Stack direction="row" spacing={0.75} alignItems="center">
                                                            <StatusChip label="Uploaded" color="success" size="sm" variant="filled" />
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => jdFileInputRef.current?.click()}
                                                                sx={{ color: "#6366f1" }}
                                                            >
                                                                <UploadCloud size={17} />
                                                            </IconButton>
                                                        </Stack>
                                                    </Box>
                                                    <TextButton
                                                        sx={{ alignSelf: "flex-start", fontSize: "0.75rem", px: 0.5 }}
                                                        onClick={() => switchToManualLink("jobDescriptionUrl")}
                                                    >
                                                        Use link 
                                                    </TextButton>
                                                </Stack>
                                            ) : (
                                                <Stack spacing={0.5}>
                                                    <Box className="jd-input-stitch">
                                                        <Link size={18} color="#94a3b8" aria-hidden />
                                                        <FormTextField
                                                            fullWidth
                                                            variant="standard"
                                                            placeholder="https://company.com/role"
                                                            value={manualUrls.jobDescriptionUrl}
                                                            onChange={(e) => {
                                                                const nextValue = e.target.value;
                                                                setManualUrls((prev) => ({ ...prev, jobDescriptionUrl: nextValue }));
                                                                setForm((prev) => ({ ...prev, jobDescriptionUrl: nextValue }));
                                                            }}
                                                            InputProps={{ disableUnderline: true }}
                                                            sx={{
                                                                "& .MuiInputBase-input": {
                                                                    py: 0.5,
                                                                    fontSize: "0.95rem",
                                                                    fontWeight: 600,
                                                                    color: "#0f172a",
                                                                },
                                                            }}
                                                        />
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => jdFileInputRef.current?.click()}
                                                            sx={{ color: "#6366f1" }}
                                                        >
                                                            <UploadCloud size={18} />
                                                        </IconButton>
                                                    </Box>
                                                    {uploadedMeta.jobDescriptionUrl && (
                                                        <TextButton
                                                            sx={{ alignSelf: "flex-start", fontSize: "0.75rem", px: 0.5 }}
                                                            onClick={() => switchToUploadedFile("jobDescriptionUrl")}
                                                        >
                                                            Use uploaded file 
                                                        </TextButton>
                                                    )}
                                                </Stack>
                                            )}
                                            <input
                                                type="file"
                                                accept=".pdf,.doc,.docx,image/*"
                                                hidden
                                                ref={jdFileInputRef}
                                                onChange={(e) => handleFileUpload(e, "jobDescriptionUrl")}
                                            />
                                            {formErrors.jobDescriptionUrl && (
                                                <Typography
                                                    sx={{
                                                        color: "#ef4444",
                                                        fontSize: "0.65rem",
                                                        fontWeight: 700,
                                                        mt: 0.5,
                                                        ml: 0.5,
                                                    }}
                                                >
                                                    {formErrors.jobDescriptionUrl}
                                                </Typography>
                                            )}
                                        </Grid>
                                        <Grid
                                            item
                                            xs={12}
                                            md={4}
                                            sx={{ minWidth: 0, display: "flex", flexDirection: "column" }}
                                        >
                                            <Typography className="jd-label-mini">CV url</Typography>
                                            {uploadingCv ? (
                                                <Box className="jd-input-stitch">
                                                    <FileUser size={18} color="#94a3b8" aria-hidden />
                                                    <FormTextField
                                                        fullWidth
                                                        variant="standard"
                                                        placeholder={`Uploading: ${cvUploadingName}...`}
                                                        value=""
                                                        helperText="Saving to session folder..."
                                                        InputProps={{ disableUnderline: true }}
                                                        sx={{
                                                            "& .MuiInputBase-input": {
                                                                py: 0.5,
                                                                fontSize: "0.95rem",
                                                                fontWeight: 600,
                                                                color: "#0f172a",
                                                            },
                                                            "& .MuiFormHelperText-root": {
                                                                mx: 0,
                                                                fontSize: "0.7rem",
                                                                fontWeight: 500,
                                                                color: "#6366f1",
                                                            },
                                                        }}
                                                    />
                                                </Box>
                                            ) : uploadedMeta.cvUrl && urlInputMode.cvUrl === "file" ? (
                                                <Stack spacing={0.5}>
                                                    <Box className="jd-input-stitch" sx={{ justifyContent: "space-between" }}>
                                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                                                            <CheckCircle size={16} color="#22c55e" />
                                                            <Typography
                                                                sx={{
                                                                    fontSize: "0.88rem",
                                                                    fontWeight: 600,
                                                                    color: "#0f172a",
                                                                    overflow: "hidden",
                                                                    textOverflow: "ellipsis",
                                                                    whiteSpace: "nowrap",
                                                                    maxWidth: 180,
                                                                }}
                                                            >
                                                                {uploadedMeta.cvUrl.fileName}
                                                            </Typography>
                                                        </Stack>
                                                        <Stack direction="row" spacing={0.75} alignItems="center">
                                                            <StatusChip label="Uploaded" color="success" size="sm" variant="filled" />
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => cvFileInputRef.current?.click()}
                                                                sx={{ color: "#6366f1" }}
                                                            >
                                                                <UploadCloud size={17} />
                                                            </IconButton>
                                                        </Stack>
                                                    </Box>
                                                    {!loadingProfileCv && profileCvUrl ? (
                                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                                            <TextButton
                                                                sx={{ fontSize: "0.75rem", px: 0.5 }}
                                                                onClick={() => switchToManualLink("cvUrl")}
                                                            >
                                                                Use link 
                                                            </TextButton>
                                                            <TextButton sx={{ fontSize: "0.75rem", px: 0.5 }} onClick={useProfileCv}>
                                                                Use profile CV
                                                            </TextButton>
                                                        </Stack>
                                                    ) : (
                                                        <TextButton
                                                            sx={{ alignSelf: "flex-start", fontSize: "0.75rem", px: 0.5 }}
                                                            onClick={() => switchToManualLink("cvUrl")}
                                                        >
                                                            Use link 
                                                        </TextButton>
                                                    )}
                                                    {loadingProfileCv && (
                                                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ ml: 0.5 }}>
                                                            <CircularProgress size={12} thickness={7} />
                                                            <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
                                                                Checking profile CV...
                                                            </Typography>
                                                        </Stack>
                                                    )}
                                                </Stack>
                                            ) : (
                                                <Stack spacing={0.5}>
                                                    <Box className="jd-input-stitch">
                                                        <FileUser size={18} color="#94a3b8" aria-hidden />
                                                        <FormTextField
                                                            fullWidth
                                                            variant="standard"
                                                            placeholder="https://drive.google.com/cv.pdf"
                                                            value={cvSource === "profile" ? "Your CV" : manualUrls.cvUrl}
                                                            onChange={(e) => {
                                                                const nextValue = e.target.value;
                                                                setManualUrls((prev) => ({ ...prev, cvUrl: nextValue }));
                                                                setForm((prev) => ({ ...prev, cvUrl: nextValue }));
                                                                if (cvSource === "profile") {
                                                                    setCvSource("manual");
                                                                }
                                                                if (formErrors.cvUrl)
                                                                    setFormErrors((prev) => ({ ...prev, cvUrl: "" }));
                                                            }}
                                                            InputProps={{ disableUnderline: true }}
                                                            sx={{
                                                                "& .MuiInputBase-input": {
                                                                    py: 0.5,
                                                                    fontSize: "0.95rem",
                                                                    fontWeight: 600,
                                                                    color: "#0f172a",
                                                                },
                                                            }}
                                                        />
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => cvFileInputRef.current?.click()}
                                                            sx={{ color: "#6366f1" }}
                                                        >
                                                            <UploadCloud size={18} />
                                                        </IconButton>
                                                    </Box>
                                                    {uploadedMeta.cvUrl && !loadingProfileCv && profileCvUrl ? (
                                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                                            <TextButton
                                                                sx={{ fontSize: "0.75rem", px: 0.5 }}
                                                                onClick={() => switchToUploadedFile("cvUrl")}
                                                            >
                                                                Use uploaded file
                                                            </TextButton>
                                                            <TextButton sx={{ fontSize: "0.75rem", px: 0.5 }} onClick={useProfileCv}>
                                                                Use profile CV
                                                            </TextButton>
                                                        </Stack>
                                                    ) : (
                                                        uploadedMeta.cvUrl && (
                                                            <TextButton
                                                                sx={{ alignSelf: "flex-start", fontSize: "0.75rem", px: 0.5 }}
                                                                onClick={() => switchToUploadedFile("cvUrl")}
                                                            >
                                                                Use uploaded file
                                                            </TextButton>
                                                        )
                                                    )}
                                                    {loadingProfileCv && (
                                                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ ml: 0.5 }}>
                                                            <CircularProgress size={12} thickness={7} />
                                                            <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
                                                                Checking profile CV...
                                                            </Typography>
                                                        </Stack>
                                                    )}
                                                    {!loadingProfileCv && profileCvUrl && !uploadedMeta.cvUrl && (
                                                        <TextButton
                                                            sx={{ alignSelf: "flex-start", fontSize: "0.75rem", px: 0.5 }}
                                                            onClick={useProfileCv}
                                                        >
                                                            Use profile CV
                                                        </TextButton>
                                                    )}
                                                    {!loadingProfileCv &&
                                                        hasAttemptedProfileCvFetch &&
                                                        userData?.id &&
                                                        !profileCvUrl && (
                                                            <Typography
                                                                sx={{
                                                                    fontSize: "0.72rem",
                                                                    color: "text.secondary",
                                                                    px: 0.5,
                                                                }}
                                                            >
                                                                No CV found in your profile yet. Upload here or add one in Profile.
                                                            </Typography>
                                                        )}
                                                </Stack>
                                            )}
                                            <input
                                                type="file"
                                                accept=".pdf,.doc,.docx,image/*"
                                                hidden
                                                ref={cvFileInputRef}
                                                onChange={(e) => handleFileUpload(e, "cvUrl")}
                                            />
                                            {formErrors.cvUrl && (
                                                <Typography
                                                    sx={{
                                                        color: "#ef4444",
                                                        fontSize: "0.65rem",
                                                        fontWeight: 700,
                                                        mt: 0.5,
                                                        ml: 0.5,
                                                    }}
                                                >
                                                    {formErrors.cvUrl}
                                                </Typography>
                                            )}
                                        </Grid>
                                    </Grid>
                                </Box>

                                <Box sx={{ width: "100%" }}>
                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        sx={{ mb: 2 }}
                                    >
                                        <Box>
                                            <Typography fontWeight={800} fontSize="1.3rem" color="#0f172a">
                                                Build Your Interview Sequence
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Define the logical flow of your assessment process
                                            </Typography>
                                        </Box>
                                        <SecondaryButton startIcon={<AddIcon />} onClick={addRound}>
                                            Add Round
                                        </SecondaryButton>
                                    </Stack>

                                    <Box className="jd-sequence-panel-stitch">
                                        <Box
                                            className="jd-track-stitch"
                                            sx={{
                                                display: "flex",
                                                flexWrap: "wrap",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                gap: 2,
                                            }}
                                        >
                                            {rounds.map((round, index) => {
                                                const service = services.find(
                                                    (s) => s.id === round.coachInterviewServiceId,
                                                );
                                                return (
                                                    <React.Fragment key={round.id}>
                                                        <Box className="jd-bubble-stitch">
                                                            <Box className="jd-bubble-num">{index + 1}</Box>
                                                            <Box className="jd-bubble-text">
                                                                <Box className="jd-bubble-title-row">
                                                                    <span className="jd-bubble-round-tag">
                                                                        Round {index + 1}
                                                                    </span>
                                                                    <span className="jd-bubble-service-name">
                                                                        {service?.interviewTypeName ||
                                                                            "Select service..."}
                                                                    </span>
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
                                        <Box display="flex" justifyContent="center" py={8}>
                                            <Typography color="text.secondary" fontWeight={600}>
                                                Loading interview services...
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragEnd={(e) => {
                                                const { active, over } = e;
                                                if (over && active.id !== over.id) {
                                                    setRounds((prev) =>
                                                        arrayMove(
                                                            prev,
                                                            prev.findIndex((r) => r.id === active.id),
                                                            prev.findIndex((r) => r.id === over.id),
                                                        ),
                                                    );
                                                }
                                            }}
                                        >
                                            <SortableContext
                                                items={rounds.map((r) => r.id)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        flexWrap: "wrap",
                                                        justifyContent: "center",
                                                        gap: 4,
                                                        mt: 2,
                                                    }}
                                                >
                                                    {rounds.map((round, index) => (
                                                        <SortableRoundCard
                                                            key={round.id}
                                                            round={round}
                                                            index={index}
                                                            isActive={activeRoundIndex === index}
                                                            canDelete={rounds.length > 1}
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

                    {/* ═══ STEP 2: Calendly-style Schedule Rounds ═══ */}
                    {activeStep === 1 && (
                        <Stack direction={{ xs: "column", md: "row" }} spacing={4}>
                            {/* Left: Calendar + Time Slots */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                {loadingSlots ? (
                                    <Box display="flex" justifyContent="center" py={10}>
                                        <Typography color="text.secondary" fontWeight={600}>
                                            Loading available slots...
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={0} sx={{ minHeight: 400 }}>
                                        {/* Calendar */}
                                        <Box
                                            sx={{
                                                flex: "0 0 auto",
                                                width: { xs: "100%", sm: 300 },
                                                pr: { sm: 3 },
                                                pb: { xs: 3, sm: 0 },
                                                borderRight: { sm: "1px solid" },
                                                borderColor: { sm: "divider" },
                                            }}
                                        >
                                            {/* Active round indicator */}
                                            <Box
                                                sx={{
                                                    mb: 2,
                                                    px: 1.5,
                                                    py: 1,
                                                    borderRadius: "8px",
                                                    bgcolor: "rgba(99, 102, 241, 0.08)",
                                                    border: "1px solid rgba(99, 102, 241, 0.15)",
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        fontSize: "0.65rem",
                                                        fontWeight: 800,
                                                        color: "#4f46e5",
                                                        letterSpacing: "0.08em",
                                                        textTransform: "uppercase",
                                                    }}
                                                >
                                                    Scheduling Round {activeRoundIndex + 1}
                                                </Typography>
                                                <Typography
                                                    sx={{
                                                        fontSize: "0.85rem",
                                                        fontWeight: 700,
                                                        color: "text.primary",
                                                        mt: 0.25,
                                                    }}
                                                >
                                                    {activeService?.interviewTypeName || "Select service..."}{" "}
                                                    {activeService && (
                                                        <span style={{ color: "#64748b", fontWeight: 500 }}>
                                                            ({activeService.durationMinutes} min)
                                                        </span>
                                                    )}
                                                </Typography>
                                            </Box>

                                            <CalendlyCalendar
                                                currentMonth={currentMonth}
                                                onPrevMonth={() => setCurrentMonth((m) => addMonths(m, -1))}
                                                onNextMonth={() => setCurrentMonth((m) => addMonths(m, 1))}
                                                selectedDate={selectedDate}
                                                onDateSelect={handleDateSelect}
                                                availableDates={availableDates}
                                            />

                                            <Box
                                                sx={{ mt: 2.5, pt: 2, borderTop: "1px solid", borderColor: "divider" }}
                                            >
                                                <Typography
                                                    sx={{
                                                        fontSize: "0.75rem",
                                                        fontWeight: 600,
                                                        color: "text.secondary",
                                                        mb: 0.5,
                                                    }}
                                                >
                                                    Time zone
                                                </Typography>
                                                <Stack direction="row" alignItems="center" spacing={0.75}>
                                                    <LanguageIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                                                    <Typography
                                                        sx={{
                                                            fontSize: "0.8rem",
                                                            fontWeight: 600,
                                                            color: "text.primary",
                                                        }}
                                                    >
                                                        {userTimezone}
                                                    </Typography>
                                                </Stack>
                                            </Box>
                                        </Box>

                                        {/* Time Slots */}
                                        <Box sx={{ flex: 1, pl: { sm: 3 }, minWidth: 0 }}>
                                            {!selectedDate ? (
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        height: "100%",
                                                        minHeight: 300,
                                                    }}
                                                >
                                                    <Typography
                                                        sx={{
                                                            color: "text.secondary",
                                                            fontWeight: 500,
                                                            fontSize: "0.95rem",
                                                        }}
                                                    >
                                                        Select a date to see available times
                                                    </Typography>
                                                </Box>
                                            ) : !activeService ? (
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        height: "100%",
                                                        minHeight: 300,
                                                    }}
                                                >
                                                    <Typography
                                                        sx={{
                                                            color: "text.secondary",
                                                            fontWeight: 500,
                                                            fontSize: "0.95rem",
                                                        }}
                                                    >
                                                        Select a service for this round first
                                                    </Typography>
                                                </Box>
                                            ) : (
                                                <>
                                                    <Typography
                                                        sx={{
                                                            fontWeight: 700,
                                                            fontSize: "1rem",
                                                            color: "text.primary",
                                                            mb: 2.5,
                                                        }}
                                                    >
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
                                                                const isSelected =
                                                                    activeRound?.availabilityIds?.includes(slot.id);
                                                                const startTime = new Date(slot.startTime);
                                                                const endTime = new Date(slot.endTime);
                                                                return (
                                                                    <Box
                                                                        key={slot.id}
                                                                        className={`calendly-timeslot ${isSelected ? "selected" : ""}`}
                                                                        onClick={() => handleTimeSelect(slot)}
                                                                    >
                                                                        <Typography
                                                                            sx={{
                                                                                fontWeight: 700,
                                                                                fontSize: "0.95rem",
                                                                            }}
                                                                        >
                                                                            {format(startTime, "HH:mm")} —{" "}
                                                                            {format(endTime, "HH:mm")}
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
                            </Box>

                            {/* Right: Round Schedule Panel */}
                            <Box sx={{ width: { xs: "100%", md: 320 }, flexShrink: 0 }}>
                                <Stack spacing={3} className="jd-schedule-panel animate__animated animate__fadeInRight">
                                    <Box>
                                        <Typography fontWeight={800} fontSize="1.1rem" color="#0f172a">
                                            Schedule rounds in order
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Pick available slots for each round
                                        </Typography>
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
                                                blockedByRoundNumber={
                                                    index > 0 && !rounds[index - 1].startTime ? index : undefined
                                                }
                                                isLast={index === rounds.length - 1}
                                                onActivate={() => {
                                                    setActiveRoundIndex(index);
                                                    setSelectedDate(null);
                                                }}
                                            />
                                        ))}
                                    </Stack>

                                    <Box className="jd-summary-card-stitch">
                                        <Typography
                                            variant="overline"
                                            color="#64748b"
                                            fontWeight={800}
                                            sx={{ letterSpacing: "0.1em" }}
                                        >
                                            Booking Overview
                                        </Typography>
                                        <Divider sx={{ my: 1.5, borderColor: "rgba(0,0,0,0.06)" }} />
                                        <Stack spacing={2.5}>
                                            <Box
                                                sx={{
                                                    p: 2,
                                                    borderRadius: "16px",
                                                    border: "1px dashed #cbd5e1",
                                                    bgcolor: "rgba(0,0,0,0.02)",
                                                }}
                                            >
                                                <Typography
                                                    variant="overline"
                                                    color="#94a3b8"
                                                    fontWeight={700}
                                                    sx={{ mb: 1.5, display: "block", fontSize: "0.65rem" }}
                                                >
                                                    Pipeline Summary
                                                </Typography>
                                                <Stack spacing={1.5}>
                                                    {rounds.map((r, i) => {
                                                        const svc = getServiceForRound(r);
                                                        return (
                                                            <Stack
                                                                key={r.id}
                                                                direction="row"
                                                                justifyContent="space-between"
                                                                alignItems="flex-start"
                                                            >
                                                                <Box>
                                                                    <Typography
                                                                        variant="caption"
                                                                        fontWeight={800}
                                                                        color="#1e293b"
                                                                        sx={{ display: "block" }}
                                                                    >
                                                                        {i + 1}. {svc?.interviewTypeName || "Unset"}
                                                                    </Typography>
                                                                    <Typography
                                                                        variant="caption"
                                                                        color={r.startTime ? "#10b981" : "#94a3b8"}
                                                                        fontWeight={r.startTime ? 700 : 500}
                                                                    >
                                                                        {r.startTime
                                                                            ? format(r.startTime, "dd MMM, HH:mm")
                                                                            : "Time not set"}
                                                                    </Typography>
                                                                </Box>
                                                                {r.startTime && (
                                                                    <CheckCircle size={14} color="#10b981" />
                                                                )}
                                                            </Stack>
                                                        );
                                                    })}
                                                </Stack>
                                            </Box>

                                            <Box className="jd-price-dashboard-stitch">
                                                <Stack
                                                    direction="row"
                                                    justifyContent="space-between"
                                                    alignItems="center"
                                                >
                                                    <Box>
                                                        <Typography
                                                            variant="overline"
                                                            sx={{
                                                                color: "rgba(255,255,255,0.6)",
                                                                fontWeight: 800,
                                                                fontSize: "0.65rem",
                                                            }}
                                                        >
                                                            Total Price
                                                        </Typography>
                                                        <Typography variant="caption" className="duration-badge">
                                                            {getTotalDurationMinutes()} mins total
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ textAlign: "right" }}>
                                                        <Typography variant="h4" className="price-vibrant">
                                                            {formatCurrency(getTotalPrice())}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </Box>

                                            <Box sx={{ mt: 2 }}>
                                                <Typography
                                                    variant="overline"
                                                    color="#64748b"
                                                    fontWeight={800}
                                                    sx={{ letterSpacing: "0.06em", display: "block", mb: 1 }}
                                                >
                                                    Note for coach{" "}
                                                    <Typography component="span" variant="caption" fontWeight={500}>
                                                        (optional)
                                                    </Typography>
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.25 }}>
                                                    Optional. Share goals, target role/company, topics to focus on, or anything the coach should know.
                                                </Typography>
                                                <FormTextField
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
                                                            bgcolor: "rgba(255,255,255,0.06)",
                                                        },
                                                    }}
                                                />
                                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block" }}>
                                                    {candidateNote.length}/{CANDIDATE_NOTE_MAX_LENGTH}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Box>
                                </Stack>
                            </Box>
                        </Stack>
                    )}
                </Box>
            </DialogContent>

            <DialogActions
                className="jd-dialog-footer"
                sx={{ p: 3, px: 4, justifyContent: "space-between", alignItems: "center" }}
            >
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
                            />
                        ))}
                    </Stack>
                </Stack>

                <Stack direction="row" spacing={2} alignItems="center">
                    {activeStep === 1 && (
                            <TextButton startIcon={<ArrowBackIcon />} onClick={handleBackStep}>
                                Back
                            </TextButton>
                    )}
                        <TextButton onClick={handleClose}>Cancel</TextButton>
                        <Box sx={{ minWidth: { xs: "100%", sm: 240 } }}>
                            <PrimaryButton
                                className="jd-btn-next-footer"
                                onClick={activeStep === 0 ? handleNextStep : handleSubmit}
                                disabled={activeStep === 0 ? !canProceedStep1 : !allRoundsConfigured || saving}
                                endIcon={!saving && <ArrowRight size={20} strokeWidth={2.25} />}
                                fullWidth
                            >
                                {activeStep === 0
                                    ? "Next: Schedule Rounds"
                                    : saving
                                      ? "Confirming & Paying..."
                                      : "Confirm & Pay Now"}
                            </PrimaryButton>
                        </Box>
                </Stack>
            </DialogActions>
        </Dialog>
    );
}
