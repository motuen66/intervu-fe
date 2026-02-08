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
import {
    Box,
    Button,
    Typography,
    Card,
    Stack,
    CircularProgress,
    CardContent,
} from "@mui/material";
import { IoAdd } from "react-icons/io5";
import { getAllInterviewTypes } from "../../../admin/services/interviewTypeApi";
import "./ScheduleManagement.css";
import ConfirmModal from "../../../../common/components/ConfirmModal";
import CreateAvailableSlotDialog from "./CreateAvailableSlotDialog";
import UpdateAvailableSlotDialog from "./UpdateAvailableSlotDialog";
import MiniCalendar from "./MiniCalendar";
import { AVAILABILITY_SLOTS_STATUS, getAvailabilityColors } from "../../../../common/constants/status";
import StatusLegend from "./StatusLegend";
import UpcomingSessionBlog from "./UpcomingSessionBlog";

const ScheduleManagement = () => {
    const dispatch = useDispatch();
    const { availabilities, loading, error } = useSelector((state) => state.availability);
    const authState = useSelector((state) => state.auth);
    // auth state has userData, not user
    const userId = authState?.userData?.id;
    const nowUtc = new Date().toISOString();

    const calendarRef = useRef(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [openModal, setOpenModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        date: "",
        focus: 1, // Job_Description integer
        typeId: "",
        startHour: 9,
        startMinute: 0,
        endHour: 10,
        endMinute: 0,
        duplicateDates: [], // Added for duplication
    });
    const [interviewTypes, setInterviewTypes] = useState([]);
    const FocusEnum = {
        General_Skills: 0,
        Job_Description: 1,
    };
    const [confirmOpen, setConfirmOpen] = useState(false);
    // const [confirmType, set                                                                                                      ] = useState(null); // "update" | "delete"
    const [selectedItem, setSelectedItem] = useState(null);

    // Calculate date range for current month
    const today = new Date();
    const minDateStr = today.toISOString().split("T")[0];
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const maxDateStr = lastDayOfMonth.toISOString().split("T")[0];

    const showError = (message) => {
        if (!message) return;
        toast.error(message, { id: "availability-error" });
    };


    const parseUTCDate = (isoString) => {
        const date = new Date(isoString);
        return `${date.getUTCDate().toString().padStart(2, "0")}/${(date.getUTCMonth() + 1).toString().padStart(2, "0")
            }/${date.getUTCFullYear()}`;
    };

    const parseUTCTime = (isoString) => {
        const date = new Date(isoString);
        return `${date.getUTCHours().toString().padStart(2, "0")}:${date
            .getUTCMinutes()
            .toString()
            .padStart(2, "0")}`;
    };

    useEffect(() => {
        if (userId) {
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();
            console.log("Fetching availabilities with:", { interviewerId: userId, month, year });
            const fetchAction = dispatch(fetchAvailabilitiesByMonth({ interviewerId: userId, month, year }));
            // Log the thunk result for debugging
            if (fetchAction && typeof fetchAction.then === 'function') {
                fetchAction
                    .then((res) => console.log("fetchAvailabilitiesByMonth result:", res))
                    .catch((err) => console.error("fetchAvailabilitiesByMonth error:", err));
            }
        }
    }, [userId, currentDate.getMonth(), currentDate.getFullYear()]);

    // Fetch interview types for General_Skills option
    useEffect(() => {
        const loadTypes = async () => {
            try {
                const types = await getAllInterviewTypes();
                console.log("Fetched interview types:", types);
                const list = Array.isArray(types) ? types : types?.items || [];
                setInterviewTypes(list || []);
            } catch (err) {
                console.error("Failed to load interview types", err);
            }
        };
        loadTypes();
    }, []);


    useEffect(() => {
        if (error && error !== "Network Error") {
            console.log("Error from state:", error);
            showError(error);
        }
    }, [error]);

    const handleAddClick = () => {
        setEditingId(null);
        const today = new Date().toISOString().split('T')[0];
        setFormData({
            date: today,
            startHour: 9,
            startMinute: 0,
            endHour: 10,
            endMinute: 0,
            focus: FocusEnum.Job_Description,
            typeId: "",
            duplicateDates: []
        });
        setOpenModal(true);
    };

    const handleEditClick = (availability) => {
        const startDate = new Date(availability.startTime);
        const endDate = new Date(availability.endTime);

        setEditingId(availability.id);
        setFormData({
            coachId: availability.coachId,
            date: startDate.toISOString().split("T")[0],
            focus: availability.focus,
            startHour: startDate.getUTCHours(),
            startMinute: startDate.getUTCMinutes(),
            endHour: endDate.getUTCHours(),
            endMinute: endDate.getUTCMinutes(),
            typeId:
                availability.focus === FocusEnum.General_Skills
                    ? availability.typeId || ""
                    : "",
            duplicateDates: []
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
        setFormData({
            date: start.getUTCFullYear() + "-" + (start.getUTCMonth() + 1).toString().padStart(2, "0") + "-" + start.getUTCDate().toString().padStart(2, "0"),
            startHour: start.getUTCHours(),
            startMinute: start.getUTCMinutes(),
            endHour: end.getUTCHours(),
            endMinute: end.getUTCMinutes(),
            focus: FocusEnum.Job_Description,
            typeId: "",
            duplicateDates: []
        });
        setOpenModal(true);
        selectInfo.view.calendar.unselect();
    };

    const handleEventChange = async (info) => {
        const event = info.event;
        const availabilityId = event.id;

        // Prevent editing past events
        if (event.extendedProps.isPast) {
            toast.error("Cannot modify past availability");
            info.revert();
            return;
        }

        // Prevent editing booked slots
        if (event.extendedProps.isBooked) {
            toast.error("Cannot modify booked slots");
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
        const avail = availabilities.find(a => String(a.id) === String(availabilityId)) || {
            focus: event.extendedProps.focus,
            typeId: event.extendedProps.typeId,
            coachId: event.extendedProps.coachId || userId
        };

        if (avail.focus === FocusEnum.Job_Description && durationMinutes < 30) {
            toast.error("Availability must be at least 30 minutes");
            info.revert();
            return;
        }

        // Handle fixed duration for General Skills with type
        if (avail.focus === FocusEnum.General_Skills && avail.typeId) {
            const type = interviewTypes.find(t => t.id === avail.typeId);

            if (type?.durationMinutes) {
                const fixedEnd = new Date(startTime);
                fixedEnd.setUTCMinutes(
                    fixedEnd.getUTCMinutes() + type.durationMinutes
                );
                endTime = fixedEnd;
                event.setEnd(fixedEnd);
            }
        }

        // Check if the event stays within the current month
        const eventMonth = startTime.getUTCMonth();
        const eventYear = startTime.getUTCFullYear();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        if (eventMonth !== currentMonth || eventYear !== currentYear) {
            toast.error("Cannot move availability to a different month");
            info.revert();
            return;
        }

        const payload = {
            coachId: avail.coachId || userId,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            focus: avail.focus,
            typeId: avail.typeId ?? null,
        };

        // Show loading toast
        const loadingToast = toast.loading("Updating availability...");

        try {
            const result = await dispatch(editAvailability({ id: availabilityId, payload }));
            console.log("editAvailability result:", result);

            toast.dismiss(loadingToast);

            if (editAvailability.fulfilled.match(result)) {
                toast.success("Availability updated successfully");
            } else {
                // Revert the change on error
                info.revert();

                const payloadMessage = typeof result.payload === "string"
                    ? result.payload
                    : result.payload?.message;
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

        if (
            Number.isNaN(startHour) ||
            Number.isNaN(startMinute) ||
            Number.isNaN(endHour) ||
            Number.isNaN(endMinute)
        ) {
            showError("Invalid time value");
            return;
        }

        const startTotalMinutes = startHour * 60 + startMinute;
        const endTotalMinutes = endHour * 60 + endMinute;

        if (startTotalMinutes >= endTotalMinutes) {
            showError("EndTime must be greater than StartTime");
            return;
        }

        const durationMinutes = endTotalMinutes - startTotalMinutes;

        if (formData.focus === FocusEnum.Job_Description && durationMinutes < 30) {
            showError("Availability must be at least 30 minutes");
            return;
        }

        if (formData.focus === FocusEnum.General_Skills && !formData.typeId) {
            showError("Type is required for General Skills");
            return;
        }

        // Validate all dates (main date + duplicate dates)
        const allDates = [formData.date, ...(formData.duplicateDates || [])];
        const payloads = [];

        for (const dateStr of allDates) {
            const selectedDate = new Date(dateStr);
            const selectedDateUtc = new Date(Date.UTC(
                selectedDate.getFullYear(),
                selectedDate.getMonth(),
                selectedDate.getDate()
            ));

            const startTime = new Date(selectedDateUtc);
            startTime.setUTCHours(startHour, startMinute, 0, 0);

            const endTime = new Date(selectedDateUtc);
            endTime.setUTCHours(endHour, endMinute, 0, 0);

            if (startTime < new Date()) {
                showError(`Cannot create availability in the past for date: ${dateStr}`);
                return;
            }

            payloads.push({
                coachId: userId,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                focus: formData.focus,
                typeId: formData.focus === FocusEnum.General_Skills ? formData.typeId : null,
            });
        }

        const loadingToast = toast.loading(editingId ? "Updating and duplicating slots..." : "Creating availability slots...");

        try {
            if (editingId) {
                // Update primary slot
                const result = await dispatch(editAvailability({ id: editingId, payload: payloads[0] }));

                if (!editAvailability.fulfilled.match(result)) {
                    toast.dismiss(loadingToast);
                    const errorMsg = typeof result.payload === "string" ? result.payload : result.payload?.message;
                    showError(errorMsg || "Failed to update main slot");
                    return;
                }

                // Create duplicates
                for (let i = 1; i < payloads.length; i++) {
                    const res = await dispatch(addAvailability(payloads[i]));
                    console.log("addAvailability (duplicate) result:", res);
                }

                toast.dismiss(loadingToast);
                toast.success("Availability updated and duplicated successfully");

                const month = currentDate.getMonth() + 1;
                const year = currentDate.getFullYear();

                await dispatch(fetchAvailabilitiesByMonth({
                    interviewerId: userId,
                    month,
                    year
                }));

            } else {
                // Create all slots
                for (const p of payloads) {
                    const res = await dispatch(addAvailability(p));
                    console.log("addAvailability result:", res);
                }

                toast.dismiss(loadingToast);
                toast.success("Availability slots created successfully");

                const month = currentDate.getMonth() + 1;
                const year = currentDate.getFullYear();

                await dispatch(fetchAvailabilitiesByMonth({
                    interviewerId: userId,
                    month,
                    year
                }));

            }

            setOpenModal(false);
            setEditingId(null);

        } catch (err) {
            toast.dismiss(loadingToast);
            console.error(err);
            showError("An unexpected error occurred");
        }
    };


    const handleMiniCalendarDateClick = (date) => {
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
            const dateUtc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            calendarApi.gotoDate(dateUtc);
            calendarApi.changeView('timeGridDay');
            setSelectedDate(dateUtc);
        }
    };

    const calendarEvents = availabilities.map((avail) => {
        // Compare UTC timestamps directly without timezone conversion
        const now = new Date().toISOString(); // Get current UTC time as ISO string
        const eventEnd = avail.endTime;
        const isPast = eventEnd < now; // String comparison works for ISO 8601 format

        let backgroundColor, borderColor, classNames = [], title = "";

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

        // Derive isBooked from status for backward compatibility
        const isBooked = Number(avail.status) === AVAILABILITY_SLOTS_STATUS.RESERVED ||
            Number(avail.status) === AVAILABILITY_SLOTS_STATUS.BOOKED;

        return {
            id: String(avail.id),
            title: title,
            start: avail.startTime,
            end: avail.endTime,
            backgroundColor,
            borderColor,
            classNames,
            editable: !isPast && !isBooked,
            extendedProps: {
                isPast,
                isBooked: isBooked,
                status: avail.status,
                focus: avail.focus,
                typeId: avail.typeId,
                coachId: avail.coachId,
                candidateId: avail.candidateId
            }

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
                    showError(resultAction.payload?.message || resultAction.error?.message || "Failed to delete availability");
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

                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<IoAdd size={18} />}
                            onClick={handleAddClick}
                            sx={{
                                fontWeight: 600,
                                textTransform: "none",
                                py: 1.25,
                                px: 3,
                            }}

                        >
                            Add Slot
                        </Button>
                    </Stack>

                    {/* Main Content */}
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 320px" }, gap: 3 }}>
                        {/* Calendar Section */}
                        <Card
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
                                            top: 0, left: 0, right: 0, bottom: 0,
                                            display: "flex", justifyContent: "center", alignItems: "center",
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
                                            (a) => String(a.id) === String(info.event.id)
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
                                    snapDuration="00:15:00"
                                    selectOverlap={false}
                                    eventOverlap={false}
                                    eventAllow={(dropInfo, draggedEvent) => {
                                        // Prevent dragging past events
                                        if (draggedEvent.extendedProps.isPast) {
                                            return false;
                                        }
                                        // Prevent dragging booked slots
                                        if (draggedEvent.extendedProps.isBooked) {
                                            return false;
                                        }
                                        return true;
                                    }}
                                    datesSet={(info) => {
                                        setCurrentDate(info.start);
                                        // Update selected date based on current view
                                        const calendarApi = calendarRef.current?.getApi();
                                        if (calendarApi) {
                                            const view = calendarApi.view;
                                            if (view.type === 'timeGridDay') {
                                                setSelectedDate(view.currentStart);
                                            }
                                        }
                                    }}
                                    height="auto"
                                    timeZone="UTC"
                                />
                            </Box>
                        </Card>

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

                            <Card
                                sx={{
                                    background: "white",
                                    boxShadow: 1,
                                    border: '1px solid',
                                    borderColor: 'grey.200',
                                }}
                            >
                                <CardContent sx={{ p: 2.5 }}>
                                    <Box display="flex" justifyContent="space-between" mb={2}>
                                        <Typography
                                            variant="overline"
                                            sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 1 }}
                                        >
                                            Quick Legend
                                        </Typography>
                                    </Box>

                                    <StatusLegend />
                                </CardContent>
                            </Card>

                            <UpcomingSessionBlog
                                availabilities={availabilities}
                                loading={loading}
                                nowUtc={nowUtc}
                                parseUTCDate={parseUTCDate}
                                parseUTCTime={parseUTCTime}
                            />
                        </Stack>

                    </Box>
                </Box>

                {/* Modal Add/Edit */}
                {openModal && (
                    editingId ? (
                        <UpdateAvailableSlotDialog
                            open={openModal}
                            onClose={() => {
                                setOpenModal(false);
                                setEditingId(null);
                                setFormData({
                                    date: "",
                                    focus: FocusEnum.Job_Description,
                                    typeId: "",
                                    startHour: 9,
                                    startMinute: 0,
                                    endHour: 10,
                                    endMinute: 0,
                                    duplicateDates: []
                                });
                            }}
                            formData={formData}
                            setFormData={setFormData}
                            interviewTypes={interviewTypes}
                            FocusEnum={FocusEnum}
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
                                    focus: FocusEnum.Job_Description,
                                    typeId: "",
                                    startHour: 9,
                                    startMinute: 0,
                                    endHour: 10,
                                    endMinute: 0,
                                    duplicateDates: []
                                });
                            }}
                            formData={formData}
                            setFormData={setFormData}
                            interviewTypes={interviewTypes}
                            FocusEnum={FocusEnum}
                            handleSubmit={handleSubmit}
                            loading={loading}
                            minDate={minDateStr}
                            maxDate={maxDateStr}
                        />
                    )
                )}
            </Box >
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