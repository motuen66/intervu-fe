import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchAvailabilitiesByMonth,
    addAvailability,
    editAvailability,
    removeAvailability,
} from "../../store/availabilitySlice";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import toast from "react-hot-toast";
import { Box, Typography, Stack, CircularProgress, CardContent } from "@mui/material";
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

const ScheduleManagement = () => {
    const dispatch = useDispatch();
    const { availabilities, loading, error } = useSelector((state) => state.availability);
    const authState = useSelector((state) => state.auth);
    // auth state has userData, not user
    const userId = authState?.userData?.id;

    const calendarRef = useRef(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [openModal, setOpenModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        date: "",
        startHour: 9,
        startMinute: 0,
        endHour: 10,
        endMinute: 0,
        duplicateDates: [], // Added for duplication
    });
    const [confirmOpen, setConfirmOpen] = useState(false);
    // const [confirmType, set] = useState(null); // "update" | "delete"
    const [selectedItem, setSelectedItem] = useState(null);

    // Calculate date range for current month
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

    useEffect(() => {
        if (userId) {
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();
            console.log("Fetching availabilities with:", { interviewerId: userId, month, year });
            const fetchAction = dispatch(fetchAvailabilitiesByMonth({ interviewerId: userId, month, year }));
            // Log the thunk result for debugging
            if (fetchAction && typeof fetchAction.then === "function") {
                fetchAction
                    .then((res) => console.log("fetchAvailabilitiesByMonth result:", res))
                    .catch((err) => console.error("fetchAvailabilitiesByMonth error:", err));
            }
        }
    }, [userId, currentDate.getMonth(), currentDate.getFullYear()]);

    useEffect(() => {
        if (error && error !== "Network Error") {
            console.log("Error from state:", error);
            showError(error);
        }
    }, [error]);

    const handleAddClick = () => {
        setEditingId(null);
        const today = new Date().toISOString().split("T")[0];
        setFormData({
            date: today,
            startHour: 9,
            startMinute: 0,
            endHour: 10,
            endMinute: 0,
            duplicateDates: [],
        });
        setOpenModal(true);
    };

    const handleEditClick = (availability) => {
        const startDate = new Date(availability.startTime);
        const endDate = new Date(availability.endTime);

        // Format date as YYYY-MM-DD in local time
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, "0");
        const day = String(startDate.getDate()).padStart(2, "0");
        const localDateStr = `${year}-${month}-${day}`;

        setEditingId(availability.id);
        setFormData({
            coachId: availability.coachId,
            date: localDateStr,
            startHour: startDate.getHours(),
            startMinute: startDate.getMinutes(),
            endHour: endDate.getHours(),
            endMinute: endDate.getMinutes(),
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
            setConfirmOpen(true);
        }
    };

    const handleDateSelect = (selectInfo) => {
        const start = selectInfo.start;
        const end = selectInfo.end;

        if (start < new Date()) {
            toast.error("Cannot create availability in the past");
            selectInfo.view.calendar.unselect();
            return;
        }

        setEditingId(null);
        // Format as YYYY-MM-DD in local time
        const year = start.getFullYear();
        const month = String(start.getMonth() + 1).padStart(2, "0");
        const day = String(start.getDate()).padStart(2, "0");
        const localDateStr = `${year}-${month}-${day}`;

        setFormData({
            date: localDateStr,
            startHour: start.getHours(),
            startMinute: start.getMinutes(),
            endHour: end.getHours(),
            endMinute: end.getMinutes(),
            duplicateDates: [],
        });
        setOpenModal(true);
        selectInfo.view.calendar.unselect();
    };

    const handleEventChange = async (info) => {
        const event = info.event;
        const availabilityId = event.id;

        if (!event.end) {
            info.revert();
            toast.error("Invalid end time – cannot resize to exactly midnight");
            return;
        }

        // Prevent editing past events
        if (event.extendedProps.isPast) {
            toast.error("Cannot modify past availability");
            info.revert();
            return;
        }

        // Prevent editing unavailable slots
        if (event.extendedProps.isUnavailable) {
            toast.error("Cannot modify unavailable slots");
            info.revert();
            return;
        }

        let startTime = event.start;
        let endTime = event.end;

        // Validation: Check if start time is in the past
        if (startTime < new Date()) {
            toast.error("Cannot move availability to the past");
            info.revert();
            return;
        }

        // Validation: Minimum duration check (15 minutes for Job Description)
        const durationMinutes = (endTime - startTime) / (1000 * 60);

        // Get availability data from extended props or find in array
        const avail = availabilities.find((a) => String(a.id) === String(availabilityId)) || {
            coachId: event.extendedProps.coachId || userId,
        };

        if (durationMinutes < 30) {
            toast.error("Availability must be at least 30 minutes");
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

        const payload = {
            coachId: avail.coachId || userId,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
        };

        // Show loading toast
        // const loadingToast = toast.loading("Updating availability...");

        try {
            const result = await dispatch(editAvailability({ id: availabilityId, payload }));
            console.log("editAvailability result:", result);

            toast.dismiss(loadingToast);

            if (editAvailability.fulfilled.match(result)) {
                toast.success("Availability updated successfully");
            } else {
                // Revert the change on error
                info.revert();

                const payloadMessage = typeof result.payload === "string" ? result.payload : result.payload?.message;
                const errMsg = payloadMessage || result.error?.message || "Failed to update availability";
                toast.error(errMsg);
            }
        } catch (error) {
            toast.dismiss(loadingToast);
            info.revert();
            toast.error("An unexpected error occurred");
            console.error("Error updating availability:", error);
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

        // End can > start
        const isOvernight = endTotalMinutes <= startTotalMinutes;
        const durationMinutes = isOvernight
            ? 24 * 60 - startTotalMinutes + endTotalMinutes
            : endTotalMinutes - startTotalMinutes;

        if (durationMinutes === 0) {
            showError("Start time and end time cannot be the same");
            return;
        }

        if (durationMinutes < 30) {
            showError("Availability must be at least 30 minutes");
            return;
        }

        // Validate all dates (main date + duplicate dates)
        const allDates = [formData.date, ...(formData.duplicateDates || [])];
        const payloads = [];

        for (const dateStr of allDates) {
            // dateStr is "YYYY-MM-DD"
            const [year, month, day] = dateStr.split("-").map(Number);

            const startTime = new Date(year, month - 1, day, startHour, startMinute, 0, 0);
            const endTime = isOvernight
                ? new Date(year, month - 1, day + 1, endHour, endMinute, 0, 0)
                : new Date(year, month - 1, day, endHour, endMinute, 0, 0);

            if (startTime < new Date()) {
                showError(`Cannot create availability in the past for date: ${dateStr}`);
                return;
            }

            payloads.push({
                coachId: userId,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
            });
        }

        // const loadingToast = toast.loading(
        //     editingId ? "Updating and duplicating slots..." : "Creating availability slots...",
        // );

        try {
            if (editingId) {
                // Update primary slot
                const result = await dispatch(editAvailability({ id: editingId, payload: payloads[0] }));

                if (!editAvailability.fulfilled.match(result)) {
                    // toast.dismiss(loadingToast);
                    const errorMsg = typeof result.payload === "string" ? result.payload : result.payload?.message;
                    showError(errorMsg || "Failed to update main slot");
                    return;
                }

                // Create duplicates
                for (let i = 1; i < payloads.length; i++) {
                    const res = await dispatch(addAvailability(payloads[i]));
                    console.log("addAvailability (duplicate) result:", res);
                }

                // toast.dismiss(loadingToast);
                // toast.success("Availability updated and duplicated successfully");

                const month = currentDate.getMonth() + 1;
                const year = currentDate.getFullYear();

                await dispatch(
                    fetchAvailabilitiesByMonth({
                        interviewerId: userId,
                        month,
                        year,
                    }),
                );
            } else {
                // Create all slots
                for (const p of payloads) {
                    const res = await dispatch(addAvailability(p));
                    console.log("addAvailability result:", res);
                }

                // toast.dismiss(loadingToast);
                // toast.success("Availability slots created successfully");

                const month = currentDate.getMonth() + 1;
                const year = currentDate.getFullYear();

                await dispatch(
                    fetchAvailabilitiesByMonth({
                        interviewerId: userId,
                        month,
                        year,
                    }),
                );
            }

            setOpenModal(false);
            setEditingId(null);
        } catch (err) {
            // toast.dismiss(loadingToast);
            console.error(err);
            showError("An unexpected error occurred");
        }
    };

    const handleMiniCalendarDateClick = (date) => {
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
            const dateUtc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            calendarApi.gotoDate(dateUtc);
            calendarApi.changeView("timeGridDay");
            setSelectedDate(dateUtc);
        }
    };

    const calendarEvents = availabilities.map((avail) => {
        // Compare UTC timestamps directly without timezone conversion
        const now = new Date().toISOString(); // Get current UTC time as ISO string
        const eventEnd = avail.endTime;
        const isPast = eventEnd < now; // String comparison works for ISO 8601 format

        let backgroundColor,
            borderColor,
            classNames = [],
            title = "";

        // Use helper to map numeric API status to colors/titles
        const status = avail.status ?? AVAILABILITY_SLOTS_STATUS.AVAILABLE;
        const colors = getAvailabilityColors(status, isPast);
        backgroundColor = colors.bg;
        borderColor = colors.border;
        // Use generic titles; do not display candidate data on this page
        title = colors.title;

        if (isPast) {
            classNames.push("past-event");
        }

        // Derive isUnavailable from status
        const isUnavailable = Number(avail.status) === AVAILABILITY_SLOTS_STATUS.UNAVAILABLE;

        return {
            id: String(avail.id),
            title: title,
            start: avail.startTime,
            end: avail.endTime,
            backgroundColor,
            borderColor,
            textColor: colors.textColor,
            classNames,
            editable: !isPast && !isUnavailable,
            extendedProps: {
                isPast,
                isUnavailable: isUnavailable,
                status: avail.status,
                coachId: avail.coachId,
            },
        };
    });

    const handleConfirm = async () => {
        // if (!confirmType) return;

        if (selectedItem) {
            try {
                const resultAction = await dispatch(removeAvailability(selectedItem));
                if (removeAvailability.fulfilled.match(resultAction)) {
                    toast.success("Availability slot deleted");
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
        // setConfirmType(null);
        setSelectedItem(null);
    };

    return (
        <>
            <Box
                sx={{
                    minHeight: "100vh",
                    py: 4,
                }}
            >
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
                            <Typography
                                variant="h3"
                                sx={{
                                    fontWeight: 700,
                                    color: "text.primary",
                                    mb: 0.5,
                                }}
                            >
                                Interview Schedule
                            </Typography>
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                Manage your available time slots for interviews
                            </Typography>
                        </div>

                        <PrimaryButton
                            startIcon={<IoAdd size={18} />}
                            onClick={handleAddClick}
                            sx={{
                                py: 1.25,
                                px: 3,
                            }}
                        >
                            Add Slot
                        </PrimaryButton>
                    </Stack>

                    {/* Main Content */}
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 320px" }, gap: 3 }}>
                        {/* Calendar Section */}
                        <BaseCard
                            variant="outlined"
                            sx={{
                                borderColor: "divider",
                                borderRadius: "12px",
                                overflow: "hidden",
                            }}
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
                                    initialView="timeGridWeek"
                                    headerToolbar={{
                                        left: "prev,next today",
                                        center: "title",
                                        right: "dayGridMonth,timeGridWeek,timeGridDay",
                                    }}
                                    buttonText={{
                                        today: "Today",
                                        month: "Month",
                                        week: "Week",
                                        day: "Day",
                                    }}
                                    events={calendarEvents}
                                    eventClick={(info) => {
                                        if (info.event.extendedProps.isPast) {
                                            toast.error("Cannot edit past availability slots");
                                            return;
                                        }

                                        const avail = availabilities.find(
                                            (a) => String(a.id) === String(info.event.id),
                                        );
                                        if (avail) {
                                            handleEditClick(avail);
                                        }
                                    }}
                                    selectable={true}
                                    selectMirror={true}
                                    select={handleDateSelect}
                                    editable={true}
                                    eventDrop={handleEventChange}
                                    eventResize={handleEventChange}
                                    eventResizableFromStart={true}
                                    eventDurationEditable={true}
                                    // now={new Date().toISOString()}
                                    now={new Date()} // use local time
                                    nowIndicator={true}
                                    snapDuration="00:15:00"
                                    selectOverlap={false}
                                    eventOverlap={false}
                                    eventAllow={(dropInfo, draggedEvent) => {
                                        // Prevent dragging past events
                                        if (draggedEvent.extendedProps.isPast) {
                                            return false;
                                        }
                                        // Prevent dragging unavailable slots
                                        if (draggedEvent.extendedProps.isUnavailable) {
                                            return false;
                                        }
                                        return true;
                                    }}
                                    datesSet={(info) => {
                                        setCurrentDate(info.start);
                                        const calendarApi = calendarRef.current?.getApi();
                                        if (calendarApi) {
                                            const view = calendarApi.view;
                                            if (view.type === "timeGridDay") {
                                                setSelectedDate(view.currentStart);
                                            }
                                        }
                                    }}
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
                                />
                            </Box>
                        </BaseCard>

                        {/* Right Panel: Mini Calendar + Quick Legend */}
                        <Stack spacing={3}>
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                                <MiniCalendar
                                    availabilities={availabilities}
                                    onDateClick={handleMiniCalendarDateClick}
                                    currentDate={currentDate}
                                    selectedDate={selectedDate}
                                />
                            </div>

                            <BaseCard
                                sx={{
                                    background: "white",
                                    boxShadow: 1,
                                    border: "1px solid",
                                    borderColor: "grey.200",
                                }}
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
                            </BaseCard>

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
                                setFormData({
                                    date: "",
                                    startHour: 9,
                                    startMinute: 0,
                                    endHour: 10,
                                    endMinute: 0,
                                    duplicateDates: [],
                                });
                            }}
                            formData={formData}
                            setFormData={setFormData}
                            handleSubmit={handleSubmit}
                            handleDelete={handleDeleteFromDialog}
                            loading={loading}
                            minDate={minDateStr}
                            maxDate={maxDateStr}
                        />
                    ) : (
                        <CreateAvailableSlotDialog
                            open={openModal}
                            onClose={() => {
                                setOpenModal(false);
                                setEditingId(null);
                                setFormData({
                                    date: "",
                                    startHour: 9,
                                    startMinute: 0,
                                    endHour: 10,
                                    endMinute: 0,
                                    duplicateDates: [],
                                });
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
            <ConfirmModal
                show={confirmOpen}
                title={"Confirm Delete"}
                message={"Are you sure you want to delete this availability slot? This action cannot be undone."}
                confirmText={"Delete"}
                cancelText="Cancel"
                onConfirm={handleConfirm}
                onCancel={() => {
                    setConfirmOpen(false);
                    // setConfirmType(null);
                    setSelectedItem(null);
                }}
            />
        </>
    );
};

export default ScheduleManagement;
