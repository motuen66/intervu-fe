import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchAvailabilitiesByMonth,
    addAvailability,
    editAvailability,
    removeAvailability,
    removeAvailabilityRange,
} from "../../store/availabilitySlice";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import toast from "react-hot-toast";
import { Box, Typography, Stack, CircularProgress, CardContent } from "@mui/material";
import { addDays, startOfDay } from "date-fns";
import BaseCard from "../../../../common/components/cards/BaseCard";
import { PrimaryButton } from "../../../../common/components/buttons";
import { IoAdd } from "react-icons/io5";
import ConfirmModal from "../../../../common/components/ConfirmModal";
import CreateAvailableSlotDialog from "./CreateAvailableSlotDialog";
import UpdateAvailableSlotDialog from "./UpdateAvailableSlotDialog";
import MiniCalendar from "./MiniCalendar";
import { AVAILABILITY_SLOTS_STATUS, getAvailabilityColors } from "../../../../common/constants/status";
import StatusLegend from "./StatusLegend";
import UpcomingSessionBlog from "./UpcomingSessionBlog";
import "./ScheduleManagement.css";

const BLOCK_MINUTES = 30;

const getTodayStart = () => startOfDay(new Date());
const getRollingSevenDayRange = () => {
    const start = getTodayStart();
    return { start, end: addDays(start, 7) };
};

/** Snap minutes to nearest 30-min boundary */
const snapTo30 = (minutes) => Math.round(minutes / BLOCK_MINUTES) * BLOCK_MINUTES;
const toTimestamp = (dateLike) => {
    const ts = new Date(dateLike).getTime();
    return Number.isNaN(ts) ? null : ts;
};
const buildCalendarEventId = (availability) => {
    const status = availability.status ?? AVAILABILITY_SLOTS_STATUS.AVAILABLE;
    const slotId = availability.id ?? "no-id";
    const startTs = toTimestamp(availability.startTime);
    const endTs = toTimestamp(availability.endTime);
    const startKey = startTs ?? String(availability.startTime ?? "");
    const endKey = endTs ?? String(availability.endTime ?? "");
    return `${status}-${slotId}-${startKey}-${endKey}`;
};

const ScheduleManagement = () => {
    const dispatch = useDispatch();
    const { availabilities, loading, error } = useSelector((state) => state.availability);
    const authState = useSelector((state) => state.auth);
    const userId = authState?.userData?.id;

    const calendarRef = useRef(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [openModal, setOpenModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    // Store the original range when editing, for the update diff
    const [originalRange, setOriginalRange] = useState(null);
    const [formData, setFormData] = useState({
        date: "",
        startHour: 9,
        startMinute: 0,
        endHour: 10,
        endMinute: 0,
        duplicateDates: [],
    });
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    // For showing booked slot details
    const [bookedDetailOpen, setBookedDetailOpen] = useState(false);
    const [bookedDetailData, setBookedDetailData] = useState(null);
    const todayStart = getTodayStart();

    const today = new Date();
    const minDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const maxDate30 = new Date(today);
    maxDate30.setDate(today.getDate() + 30);
    const maxDateStr = `${maxDate30.getFullYear()}-${String(maxDate30.getMonth() + 1).padStart(2, "0")}-${String(maxDate30.getDate()).padStart(2, "0")}`;

    const showError = (message) => {
        if (!message) return;
        toast.error(message, { id: "availability-error" });
    };

    const parseLocalDate = (isoString) => {
        const date = new Date(isoString);
        return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}/${date.getFullYear()}`;
    };

    const parseLocalTime = (isoString) => {
        const date = new Date(isoString);
        return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    };

    const getViewAnchorDate = () => {
        const calendarApi = calendarRef.current?.getApi();
        const anchorDate = calendarApi?.getDate?.();
        if (anchorDate instanceof Date && !Number.isNaN(anchorDate.getTime())) {
            return anchorDate;
        }

        const viewCurrentStart = calendarApi?.view?.currentStart;
        if (viewCurrentStart instanceof Date && !Number.isNaN(viewCurrentStart.getTime())) {
            return viewCurrentStart;
        }
        return currentDate;
    };

    const refetchMonth = () => {
        if (!userId) return;
        const viewDate = getViewAnchorDate();
        const month = viewDate.getMonth() + 1;
        const year = viewDate.getFullYear();
        dispatch(fetchAvailabilitiesByMonth({ interviewerId: userId, month, year }));
    };

    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    useEffect(() => {
        if (userId) {
            dispatch(fetchAvailabilitiesByMonth({ interviewerId: userId, month: currentMonth, year: currentYear }));
        }
    }, [dispatch, userId, currentMonth, currentYear]);

    useEffect(() => {
        if (error && error !== "Network Error") {
            showError(error);
        }
    }, [error]);

    const handleAddClick = () => {
        setEditingId(null);
        setOriginalRange(null);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split("T")[0];
        setFormData({
            date: tomorrowStr,
            startHour: 9,
            startMinute: 0,
            endHour: 10,
            endMinute: 0,
            duplicateDates: [],
        });
        setOpenModal(true);
    };

    const handleEditClick = (availability) => {
        // Only allow editing Available blocks
        if (Number(availability.status) === AVAILABILITY_SLOTS_STATUS.BOOKED) {
            // Show booked detail instead
            setBookedDetailData(availability);
            setBookedDetailOpen(true);
            return;
        }

        const startDate = new Date(availability.startTime);
        const endDate = new Date(availability.endTime);

        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, "0");
        const day = String(startDate.getDate()).padStart(2, "0");
        const localDateStr = `${year}-${month}-${day}`;

        setEditingId(availability.id);
        setOriginalRange({
            startTime: availability.startTime,
            endTime: availability.endTime,
        });
        setFormData({
            coachId: availability.coachId,
            date: localDateStr,
            startHour: startDate.getHours(),
            startMinute: snapTo30(startDate.getMinutes()),
            endHour: endDate.getHours(),
            endMinute: snapTo30(endDate.getMinutes()),
            duplicateDates: [],
        });
        setOpenModal(true);
    };

    const handleDeleteClick = (id) => {
        setSelectedItem(id);
        setConfirmOpen(true);
    };

    const handleDeleteFromDialog = () => {
        if (editingId) {
            setOpenModal(false);
            setSelectedItem(editingId);
            setEditingId(null);
            setOriginalRange(null);
            setConfirmOpen(true);
        }
    };

    const handleDateSelect = (selectInfo) => {
        const start = selectInfo.start;
        const end = selectInfo.end;
        const isAllDaySelection = selectInfo.allDay || selectInfo.view.type === "dayGridMonth";

        if (start < new Date()) {
            toast.error("Cannot create availability in the past");
            selectInfo.view.calendar.unselect();
            return;
        }

        setEditingId(null);
        setOriginalRange(null);
        const year = start.getFullYear();
        const month = String(start.getMonth() + 1).padStart(2, "0");
        const day = String(start.getDate()).padStart(2, "0");
        const localDateStr = `${year}-${month}-${day}`;

        const defaultStartHour = 9;
        const defaultEndHour = 10;
        const startHour = isAllDaySelection ? defaultStartHour : start.getHours();
        const startMinute = isAllDaySelection ? 0 : snapTo30(start.getMinutes());
        const endHour = isAllDaySelection ? defaultEndHour : end.getHours();
        const endMinute = isAllDaySelection ? 0 : snapTo30(end.getMinutes());

        setFormData({
            date: localDateStr,
            startHour,
            startMinute,
            endHour,
            endMinute,
            duplicateDates: [],
        });
        setOpenModal(true);
        selectInfo.view.calendar.unselect();
    };

    const handleDateClick = (clickInfo) => {
        if (clickInfo.view.type !== "dayGridMonth") return;

        const clickedDate = startOfDay(clickInfo.date);
        if (clickedDate < todayStart) {
            toast.error("Cannot create availability in the past");
            return;
        }

        setEditingId(null);
        setOriginalRange(null);

        const year = clickedDate.getFullYear();
        const month = String(clickedDate.getMonth() + 1).padStart(2, "0");
        const day = String(clickedDate.getDate()).padStart(2, "0");
        const localDateStr = `${year}-${month}-${day}`;

        setFormData({
            date: localDateStr,
            startHour: 9,
            startMinute: 0,
            endHour: 10,
            endMinute: 0,
            duplicateDates: [],
        });
        setOpenModal(true);
    };

    const handleEventChange = async (info) => {
        const event = info.event;

        if (!event.end) {
            info.revert();
            toast.error("Invalid end time");
            return;
        }

        if (event.extendedProps.isPast) {
            toast.error("Cannot modify past availability");
            info.revert();
            return;
        }

        if (event.extendedProps.isUnavailable) {
            toast.error("Cannot modify booked slots");
            info.revert();
            return;
        }

        const startTime = event.start;
        const endTime = event.end;

        if (startTime < new Date()) {
            toast.error("Cannot move availability to the past");
            info.revert();
            return;
        }

        const durationMinutes = (endTime - startTime) / (1000 * 60);
        if (durationMinutes < BLOCK_MINUTES) {
            toast.error(`Availability must be at least ${BLOCK_MINUTES} minutes`);
            info.revert();
            return;
        }

        const maxAllowed = new Date();
        maxAllowed.setDate(maxAllowed.getDate() + 30);
        maxAllowed.setHours(23, 59, 59, 999);

        if (startTime > maxAllowed) {
            toast.error("Cannot move availability beyond the 30-day window");
            info.revert();
            return;
        }

        // Use range-based update: original times from the event's previous position
        const originalStart = info.oldEvent?.start ?? event.start;
        const originalEnd = info.oldEvent?.end ?? event.end;

        const payload = {
            coachId: event.extendedProps.coachId || userId,
            originalStartTime: originalStart.toISOString(),
            originalEndTime: originalEnd.toISOString(),
            newStartTime: startTime.toISOString(),
            newEndTime: endTime.toISOString(),
        };

        try {
            const result = await dispatch(editAvailability(payload));
            if (editAvailability.fulfilled.match(result)) {
                // toast.success("Availability updated");
                refetchMonth();
            } else {
                info.revert();
                const errMsg =
                    typeof result.payload === "string" ? result.payload : result.payload?.message || "Failed to update";
                toast.error(errMsg);
            }
        } catch (error) {
            info.revert();
            toast.error("An unexpected error occurred");
        }
    };

    const handleSubmit = async () => {
        if (!formData.date) {
            showError("Date is required");
            return;
        }

        const startHour = Number(formData.startHour);
        const startMinute = Number(formData.startMinute);
        const endHour = Number(formData.endHour);
        const endMinute = Number(formData.endMinute);

        if (Number.isNaN(startHour) || Number.isNaN(startMinute) || Number.isNaN(endHour) || Number.isNaN(endMinute)) {
            showError("Invalid time value");
            return;
        }

        const startTotalMinutes = startHour * 60 + startMinute;
        const endTotalMinutes = endHour * 60 + endMinute;

        if (endTotalMinutes <= startTotalMinutes) {
            showError("End time must be after start time");
            return;
        }

        const durationMinutes = endTotalMinutes - startTotalMinutes;

        if (durationMinutes < BLOCK_MINUTES) {
            showError(`Availability must be at least ${BLOCK_MINUTES} minutes`);
            return;
        }

        if (durationMinutes % BLOCK_MINUTES !== 0) {
            showError(`Duration must be a multiple of ${BLOCK_MINUTES} minutes`);
            return;
        }

        // Build payloads for all dates
        const allDates = [formData.date, ...(formData.duplicateDates || [])];

        try {
            if (editingId && originalRange) {
                // Range-based update for the primary date
                const [year, month, day] = formData.date.split("-").map(Number);
                const newStart = new Date(year, month - 1, day, startHour, startMinute, 0, 0);
                const newEnd = new Date(year, month - 1, day, endHour, endMinute, 0, 0);

                const updatePayload = {
                    coachId: userId,
                    originalStartTime: originalRange.startTime,
                    originalEndTime: originalRange.endTime,
                    newStartTime: newStart.toISOString(),
                    newEndTime: newEnd.toISOString(),
                };

                const result = await dispatch(editAvailability(updatePayload));
                if (!editAvailability.fulfilled.match(result)) {
                    const errorMsg = typeof result.payload === "string" ? result.payload : result.payload?.message;
                    showError(errorMsg || "Failed to update slot");
                    return;
                }

                // Create duplicates on other dates as new ranges
                for (let i = 1; i < allDates.length; i++) {
                    const [dy, dm, dd] = allDates[i].split("-").map(Number);
                    const dupStart = new Date(dy, dm - 1, dd, startHour, startMinute, 0, 0);
                    const dupEnd = new Date(dy, dm - 1, dd, endHour, endMinute, 0, 0);

                    await dispatch(
                        addAvailability({
                            coachId: userId,
                            rangeStartTime: dupStart.toISOString(),
                            rangeEndTime: dupEnd.toISOString(),
                        }),
                    );
                }
            } else {
                // Create new ranges for all dates
                for (const dateStr of allDates) {
                    const [year, month, day] = dateStr.split("-").map(Number);
                    const rangeStart = new Date(year, month - 1, day, startHour, startMinute, 0, 0);
                    const rangeEnd = new Date(year, month - 1, day, endHour, endMinute, 0, 0);

                    if (rangeStart < new Date()) {
                        showError(`Cannot create availability in the past for date: ${dateStr}`);
                        return;
                    }

                    const res = await dispatch(
                        addAvailability({
                            coachId: userId,
                            rangeStartTime: rangeStart.toISOString(),
                            rangeEndTime: rangeEnd.toISOString(),
                        }),
                    );

                    if (!addAvailability.fulfilled.match(res)) {
                        const errMsg = typeof res.payload === "string" ? res.payload : res.payload?.message;
                        showError(errMsg || `Failed to create slot for ${dateStr}`);
                        return;
                    }
                }

                toast.success("Availability created successfully.", { id: "availability-success" });
            }

            refetchMonth();
            setOpenModal(false);
            setEditingId(null);
            setOriginalRange(null);
        } catch (err) {
            console.error(err);
            showError("An unexpected error occurred");
        }
    };

    const handleMiniCalendarDateClick = (date) => {
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
            const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            calendarApi.gotoDate(localDate);
            calendarApi.changeView("timeGridDay");
            setSelectedDate(localDate);
        }
    };

    const nowTs = Date.now();
    const calendarEvents = availabilities.map((avail) => {
        const eventEndTs = toTimestamp(avail.endTime);
        const isPast = eventEndTs !== null && eventEndTs < nowTs;
        const eventId = buildCalendarEventId(avail);

        let classNames = [];
        const status = avail.status ?? AVAILABILITY_SLOTS_STATUS.AVAILABLE;
        const colors = getAvailabilityColors(status, isPast);

        if (isPast) classNames.push("past-event");

        const isUnavailable = Number(avail.status) === AVAILABILITY_SLOTS_STATUS.BOOKED;

        return {
            id: eventId,
            title: colors.title,
            start: avail.startTime,
            end: avail.endTime,
            backgroundColor: colors.bg,
            borderColor: colors.border,
            textColor: colors.textColor,
            classNames,
            editable: !isPast && !isUnavailable,
            extendedProps: {
                availabilityEventId: eventId,
                availabilityId: avail.id,
                isPast,
                isUnavailable,
                status: avail.status,
                coachId: avail.coachId,
            },
        };
    });

    const handleConfirm = async () => {
        if (selectedItem) {
            try {
                const resultAction = await dispatch(removeAvailability(selectedItem));
                if (removeAvailability.fulfilled.match(resultAction)) {
                    // toast.success("Availability slot deleted");
                    refetchMonth();
                } else {
                    showError(
                        resultAction.payload?.message || resultAction.error?.message || "Failed to delete availability",
                    );
                }
            } catch (err) {
                console.error("Error deleting availability:", err);
                showError("An unexpected error occurred while deleting availability");
            }
        }

        setConfirmOpen(false);
        setSelectedItem(null);
    };

    return (
        <>
            <Box sx={{ minHeight: "100vh", py: 4 }}>
                <Box sx={{ maxWidth: "1400px", mx: "auto" }}>
                    {/* Header */}
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        justifyContent="space-between"
                        alignItems={{ xs: "flex-start", sm: "center" }}
                        spacing={2}
                        sx={{ mb: 4 }}
                    >
                        <div>
                            <Typography variant="h3" sx={{ fontWeight: 700, color: "text.primary", mb: 0.5 }}>
                                Interview Schedule
                            </Typography>
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                Manage your available time slots for interviews
                            </Typography>
                        </div>

                        <PrimaryButton
                            startIcon={<IoAdd size={18} />}
                            onClick={handleAddClick}
                            sx={{ py: 1.25, px: 3 }}
                        >
                            Add Slot
                        </PrimaryButton>
                    </Stack>

                    {/* Main Content */}
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 320px" }, gap: 3 }}>
                        {/* Calendar Section */}
                        <BaseCard
                            variant="outlined"
                            sx={{ borderColor: "divider", borderRadius: "12px", overflow: "hidden" }}
                        >
                            <Box sx={{ p: 3, position: "relative" }}>
                                {loading && (
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            bgcolor: "rgba(255,255,255,0.4)",
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
                                    initialDate={getTodayStart()}
                                    initialView="dayGridMonth"
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
                                        left: "today",
                                        center: "title",
                                        right: "dayGridMonth,rollingSevenDay,timeGridDay",
                                    }}
                                    buttonText={{ today: "Today", month: "Month", day: "Day" }}
                                    events={calendarEvents}
                                    eventClick={(info) => {
                                        if (info.event.extendedProps.isPast) {
                                            toast.error("Cannot edit past availability slots");
                                            return;
                                        }

                                        const eventKey =
                                            info.event.extendedProps.availabilityEventId || String(info.event.id);
                                        const avail = availabilities.find((a) => buildCalendarEventId(a) === eventKey);
                                        if (avail) {
                                            handleEditClick(avail);
                                        }
                                    }}
                                    selectable={true}
                                    selectMirror={true}
                                    select={handleDateSelect}
                                    dateClick={handleDateClick}
                                    selectAllow={(selectInfo) => {
                                        if (selectInfo.view.type !== "dayGridMonth") return true;
                                        return startOfDay(selectInfo.start) >= todayStart;
                                    }}
                                    editable={true}
                                    eventDrop={handleEventChange}
                                    eventResize={handleEventChange}
                                    eventResizableFromStart={true}
                                    eventDurationEditable={true}
                                    now={new Date()}
                                    nowIndicator={true}
                                    snapDuration="00:30:00"
                                    slotDuration="00:30:00"
                                    selectOverlap={false}
                                    eventOverlap={false}
                                    eventAllow={(dropInfo, draggedEvent) => {
                                        if (draggedEvent.extendedProps.isPast) return false;
                                        if (draggedEvent.extendedProps.isUnavailable) return false;
                                        return true;
                                    }}
                                    datesSet={(info) => {
                                        setCurrentDate(info.view.currentStart);
                                        if (info.view.type === "timeGridDay") {
                                            setSelectedDate(info.view.currentStart);
                                        }
                                    }}
                                    dayCellClassNames={(arg) => {
                                        if (arg.view.type !== "dayGridMonth") return [];

                                        const classes = [];
                                        if (startOfDay(arg.date) < todayStart) {
                                            classes.push("fc-day-past-disabled");
                                        }
                                        if (arg.isToday) {
                                            classes.push("fc-day-today-highlight");
                                        }
                                        return classes;
                                    }}
                                    height="auto"
                                    timeZone="local"
                                    slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
                                    eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
                                />
                            </Box>
                        </BaseCard>

                        {/* Right Panel */}
                        <Stack spacing={3}>
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                                <MiniCalendar
                                    availabilities={availabilities}
                                    onDateClick={handleMiniCalendarDateClick}
                                    currentDate={currentDate}
                                    selectedDate={selectedDate}
                                />
                            </div>

                            {/* <BaseCard
                                sx={{ background: "white", boxShadow: 1, border: "1px solid", borderColor: "grey.200" }}
                            >
                                <CardContent sx={{ p: 2.5 }}>
                                    <Box display="flex" justifyContent="space-between" mb={2}>
                                        <Typography
                                            variant="overline"
                                            sx={{ color: "text.secondary", fontWeight: 600, letterSpacing: 1 }}
                                        >
                                            Quick Legend
                                        </Typography>
                                    </Box>
                                    <StatusLegend />
                                </CardContent>
                            </BaseCard> */}

                            <UpcomingSessionBlog
                                availabilities={availabilities}
                                loading={loading}
                                parseLocalDate={parseLocalDate}
                                parseLocalTime={parseLocalTime}
                            />
                        </Stack>
                    </Box>
                </Box>

                {/* Modal Add/Edit */}
                {openModal &&
                    (editingId ? (
                        <UpdateAvailableSlotDialog
                            open={openModal}
                            onClose={() => {
                                setOpenModal(false);
                                setEditingId(null);
                                setOriginalRange(null);
                            }}
                            formData={formData}
                            setFormData={setFormData}
                            handleSubmit={handleSubmit}
                            handleDelete={handleDeleteFromDialog}
                            loading={loading}
                            minDate={minDateStr}
                            maxDate={maxDateStr}
                            existingBlocks={availabilities}
                        />
                    ) : (
                        <CreateAvailableSlotDialog
                            open={openModal}
                            onClose={() => {
                                setOpenModal(false);
                                setEditingId(null);
                                setOriginalRange(null);
                            }}
                            formData={formData}
                            setFormData={setFormData}
                            handleSubmit={handleSubmit}
                            loading={loading}
                            minDate={minDateStr}
                            maxDate={maxDateStr}
                        />
                    ))}
            </Box>

            {/* Confirm Delete */}
            <ConfirmModal
                show={confirmOpen}
                title="Confirm Delete"
                message="Are you sure you want to delete this availability slot? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleConfirm}
                onCancel={() => {
                    setConfirmOpen(false);
                    setSelectedItem(null);
                }}
            />

            {/* Booked Slot Detail Modal */}
            {bookedDetailOpen && bookedDetailData && (
                <ConfirmModal
                    show={bookedDetailOpen}
                    title="Booked Session Details"
                    message={`This slot is booked and cannot be edited.\n\n
                        Time: ${parseLocalTime(bookedDetailData.startTime)} - ${parseLocalTime(bookedDetailData.endTime)}\n
                        Date: ${parseLocalDate(bookedDetailData.startTime)}${
                            bookedDetailData.candidateName ? `\nCandidate: ${bookedDetailData.candidateName}` : ""
                        }${
                            bookedDetailData.typeName || bookedDetailData.interviewType
                                ? `\nType: ${bookedDetailData.typeName || bookedDetailData.interviewType}`
                                : ""
                        }`}
                    confirmText="Close"
                    onConfirm={() => {
                        setBookedDetailOpen(false);
                        setBookedDetailData(null);
                    }}
                    onCancel={() => {
                        setBookedDetailOpen(false);
                        setBookedDetailData(null);
                    }}
                />
            )}
        </>
    );
};

export default ScheduleManagement;
