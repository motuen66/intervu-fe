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
import PageHeader from "../../../../common/components/PageHeader";
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
const getMonthFromThreeDaysAgoRange = () => {
    const start = addDays(getTodayStart(), -3);
    const end = addDays(start, 26);
    return { start, end };
};

/** Snap minutes to nearest 30-min boundary */
const snapTo30 = (minutes) => Math.round(minutes / BLOCK_MINUTES) * BLOCK_MINUTES;
const toTimestamp = (dateLike) => {
    const ts = new Date(dateLike).getTime();
    return Number.isNaN(ts) ? null : ts;
};
const rangesOverlap = (startA, endA, startB, endB) => startA < endB && endA > startB;
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
    const resolveErrorMessage = (payload, fallbackMessage) => {
        const status = payload?.status;
        const backendMsg = payload?.message;
        if (status === 409) {
            return backendMsg || "This time range overlaps an existing slot.";
        }
        if (typeof payload === "string") return payload;
        return backendMsg || fallbackMessage;
    };
    const hasConflictingRange = (rangeStart, rangeEnd, excludePredicate = () => false) => {
        const startTs = toTimestamp(rangeStart);
        const endTs = toTimestamp(rangeEnd);
        if (startTs === null || endTs === null) return false;

        return availabilities.some((avail) => {
            if (excludePredicate(avail)) return false;
            const availStart = toTimestamp(avail.startTime);
            const availEnd = toTimestamp(avail.endTime);
            if (availStart === null || availEnd === null) return false;
            return rangesOverlap(startTs, endTs, availStart, availEnd);
        });
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
        if (originalRange) {
            setOpenModal(false);
            setSelectedItem({
                coachId: userId,
                rangeStartTime: originalRange.startTime,
                rangeEndTime: originalRange.endTime,
            });
            setEditingId(null);
            setOriginalRange(null);
            setConfirmOpen(true);
        }
    };

    const handleDateSelect = (selectInfo) => {
        const start = selectInfo.start;
        const end = selectInfo.end;
        const isAllDaySelection = selectInfo.allDay || selectInfo.view.type === "customMonth";

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
        if (clickInfo.view.type !== "customMonth") return;

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
        const movingEventKey = event.extendedProps.availabilityEventId || String(event.id);
        if (
            hasConflictingRange(startTime, endTime, (avail) => {
                const availKey = buildCalendarEventId(avail);
                return availKey === movingEventKey;
            })
        ) {
            toast.error("This time range overlaps an existing slot");
            info.revert();
            return;
        }

        try {
            const result = await dispatch(editAvailability(payload));
            if (editAvailability.fulfilled.match(result)) {
                // toast.success("Availability updated");
                refetchMonth();
            } else {
                info.revert();
                const errMsg = resolveErrorMessage(result.payload, "Failed to update");
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
                const originalStartTs = toTimestamp(originalRange.startTime);
                const originalEndTs = toTimestamp(originalRange.endTime);
                const hasConflict = hasConflictingRange(newStart, newEnd, (avail) => {
                    const availStart = toTimestamp(avail.startTime);
                    const availEnd = toTimestamp(avail.endTime);
                    return availStart === originalStartTs && availEnd === originalEndTs;
                });
                if (hasConflict) {
                    showError("This time range overlaps an existing slot");
                    return;
                }

                const result = await dispatch(editAvailability(updatePayload));
                if (!editAvailability.fulfilled.match(result)) {
                    const errorMsg = resolveErrorMessage(result.payload, "Failed to update slot");
                    showError(errorMsg || "Failed to update slot");
                    return;
                }

                // Create duplicates on other dates as new ranges
                for (let i = 1; i < allDates.length; i++) {
                    const [dy, dm, dd] = allDates[i].split("-").map(Number);
                    const dupStart = new Date(dy, dm - 1, dd, startHour, startMinute, 0, 0);
                    const dupEnd = new Date(dy, dm - 1, dd, endHour, endMinute, 0, 0);
                    if (hasConflictingRange(dupStart, dupEnd)) {
                        showError(`This time range overlaps an existing slot for ${allDates[i]}`);
                        return;
                    }

                    const duplicateResult = await dispatch(
                        addAvailability({
                            coachId: userId,
                            rangeStartTime: dupStart.toISOString(),
                            rangeEndTime: dupEnd.toISOString(),
                        }),
                    );
                    if (!addAvailability.fulfilled.match(duplicateResult)) {
                        const errMsg = resolveErrorMessage(
                            duplicateResult.payload,
                            `Failed to create slot for ${allDates[i]}`,
                        );
                        showError(errMsg);
                        return;
                    }
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
                    if (hasConflictingRange(rangeStart, rangeEnd)) {
                        showError(`This time range overlaps an existing slot for ${dateStr}`);
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
                        const errMsg = resolveErrorMessage(res.payload, `Failed to create slot for ${dateStr}`);
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
        const isAvailable = status === AVAILABILITY_SLOTS_STATUS.AVAILABLE && !isPast;
        const isBooked = status === AVAILABILITY_SLOTS_STATUS.BOOKED && !isPast;

        if (isPast) classNames.push("past-event");
        if (isAvailable) classNames.push("available-event");
        if (isBooked) classNames.push("booked-event");

        const isUnavailable = Number(avail.status) === AVAILABILITY_SLOTS_STATUS.BOOKED;

        return {
            id: eventId,
            title: colors.title,
            start: avail.startTime,
            end: avail.endTime,
            ...(isAvailable ? {} : { backgroundColor: colors.bg, borderColor: colors.border }),
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
                let resultAction;
                if (typeof selectedItem === "object") {
                    resultAction = await dispatch(removeAvailabilityRange(selectedItem));
                    if (removeAvailabilityRange.fulfilled.match(resultAction)) {
                        refetchMonth();
                    } else {
                        showError(
                            resultAction.payload?.message ||
                                resultAction.error?.message ||
                                "Failed to delete availability",
                        );
                    }
                } else {
                    resultAction = await dispatch(removeAvailability(selectedItem));
                    if (removeAvailability.fulfilled.match(resultAction)) {
                        refetchMonth();
                    } else {
                        showError(
                            resultAction.payload?.message ||
                                resultAction.error?.message ||
                                "Failed to delete availability",
                        );
                    }
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
            <PageHeader
                title="Interview Schedule"
                subtitle="Manage your available time slots for interviews"
                actions={
                    <PrimaryButton startIcon={<IoAdd size={18} />} onClick={handleAddClick}>
                        Add Slot
                    </PrimaryButton>
                }
            />

            {/* Main Content */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 320px" }, gap: 3 }}>
                {/* Calendar Section */}
                <BaseCard variant="outlined" sx={{ borderColor: "divider", borderRadius: "12px", overflow: "hidden" }}>
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
                            initialView="customMonth"
                            views={{
                                customMonth: {
                                    type: "dayGrid",
                                    duration: { weeks: 4 },
                                    dateAlignment: "day",
                                    visibleRange: getMonthFromThreeDaysAgoRange,
                                    buttonText: "Month",
                                    fixedWeekCount: false,
                                },
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
                                right: "customMonth,rollingSevenDay,timeGridDay",
                            }}
                            buttonText={{ today: "Today", month: "Month", day: "Day" }}
                            events={calendarEvents}
                            eventClick={(info) => {
                                if (info.event.extendedProps.isPast) {
                                    toast.error("Cannot edit past availability slots");
                                    return;
                                }

                                const eventKey = info.event.extendedProps.availabilityEventId || String(info.event.id);
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
                                if (selectInfo.view.type !== "customMonth") return true;
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
                                if (arg.view.type !== "customMonth") return [];

                                const classes = [];
                                if (startOfDay(arg.date) < todayStart) {
                                    classes.push("fc-day-past-disabled");
                                }
                                if (arg.isToday) {
                                    classes.push("fc-day-today-highlight");
                                }
                                return classes;
                            }}
                            height={600}
                            timeZone="local"
                            slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
                            eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
                            dayCellContent={(arg) => {
                                const date = arg.date;
                                const day = String(date.getDate()).padStart(2, "0");
                                const month = String(date.getMonth() + 1).padStart(2, "0");
                                return `${day}/${month}`;
                            }}
                            dayMaxEvents={4}
                            moreLinkContent={(args) => {
                                return `${args.num} more`;
                            }}
                            // moreLinkClick=""
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
                    content={
                        <Stack spacing={1.5}>
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                This slot is booked and cannot be edited.
                            </Typography>
                            <Box
                                sx={{
                                    display: "inline-flex",
                                    alignSelf: "flex-start",
                                    px: 1.25,
                                    py: 0.5,
                                    borderRadius: 99,
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    letterSpacing: 0.3,
                                    bgcolor: "#57595B",
                                    color: "#ffffff",
                                    border: "1px solid #4a4c4d",
                                }}
                            >
                                BOOKED
                            </Box>
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: "auto 1fr",
                                    rowGap: 1,
                                    columnGap: 1.5,
                                    px: 1.5,
                                    py: 1.25,
                                    border: "1px solid",
                                    borderColor: "divider",
                                    borderRadius: 2,
                                    bgcolor: "#fff",
                                }}
                            >
                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                    Time
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {parseLocalTime(bookedDetailData.startTime)} -{" "}
                                    {parseLocalTime(bookedDetailData.endTime)}
                                </Typography>

                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                    Date
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {parseLocalDate(bookedDetailData.startTime)}
                                </Typography>

                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                    Candidate
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {bookedDetailData.candidateName || "Not assigned"}
                                </Typography>

                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                    Type
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {bookedDetailData.sessionName ||
                                        bookedDetailData.interviewTypeName ||
                                        bookedDetailData.typeName ||
                                        bookedDetailData.interviewType ||
                                        "Interview"}
                                </Typography>
                            </Box>
                        </Stack>
                    }
                    paperSx={{ borderRadius: 4, overflow: "hidden" }}
                    titleSx={{
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        background: "linear-gradient(180deg, rgba(15,23,42,0.03), rgba(15,23,42,0.01))",
                    }}
                    contentSx={{ bgcolor: "#f8fafc" }}
                    actionsSx={{ borderTop: "1px solid", borderColor: "divider", pt: 2 }}
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
