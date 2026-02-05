import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchAvailabilitiesByMonth,
    addAvailability,
    editAvailability,
    removeAvailability,
    clearError,
} from "../store/availabilitySlice";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import toast from "react-hot-toast";
import {
    Box,
    Button,
    TextField,
    Typography,
    Modal,
    Card,
    CardContent,
    Stack,
    Alert,
    CircularProgress,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
} from "@mui/material";
import { IoAdd, IoTrash, IoPencil, IoCheckmarkCircle } from "react-icons/io5";
import "./ScheduleManagement.css";

const ScheduleManagement = () => {
    const dispatch = useDispatch();
    const { availabilities, loading, error } = useSelector((state) => state.availability);
    const authState = useSelector((state) => state.auth);
    // auth state has userData, not user
    const userId = authState?.userData?.id;

    const calendarRef = useRef(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [openModal, setOpenModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        date: "",
        startHour: "09",
        endHour: "10",
    });

    const parseUTCDate = (isoString) => {
        // Parse ISO string to get date only (M/D/YYYY or MM/DD/YYYY format)
        // Handle both "2025-11-18T09:00:00Z" and "2025-11-18T09:00:00" formats
        const cleanStr = isoString.replace('Z', '').split('.')[0]; // Remove Z and milliseconds
        const match = cleanStr.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (!match) return "";
        const [, year, month, day] = match;
        // Return without leading zeros: 11/19/2025 instead of 11/19/2025
        return `${parseInt(month)}/${parseInt(day)}/${year}`;
    };

    const parseUTCDateTime = (isoString) => {
        // Parse ISO string directly without timezone conversion
        // Handle both "2025-11-18T09:00:00Z" and "2025-11-18T09:00:00" formats
        const cleanStr = isoString.replace('Z', '').split('.')[0]; // Remove Z and milliseconds
        const match = cleanStr.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):/);
        if (!match) return "";
        const [, year, month, day, hour, minute] = match;
        return `${month}/${day} ${hour}:${minute}`;
    };

    const parseUTCTime = (isoString) => {
        // Parse just the time portion
        // Handle both "2025-11-18T09:00:00Z" and "2025-11-18T09:00:00" formats
        const cleanStr = isoString.replace('Z', '').split('.')[0]; // Remove Z and milliseconds
        const match = cleanStr.match(/T(\d{2}):(\d{2}):/);
        if (!match) return "";
        const [, hour, minute] = match;
        return `${hour}:${minute}`;
    };
    useEffect(() => {
        if (userId) {
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();
            console.log("Fetching availabilities with:", { interviewerId: userId, month, year });
            dispatch(fetchAvailabilitiesByMonth({ interviewerId: userId, month, year }));
        }
    }, [userId, currentDate.getMonth(), currentDate.getFullYear()]);

    // Handle error display
    // Note: Errors from add/edit actions are now handled directly in handleSubmit
    // to prevent double toasts. This effect is kept for other potential errors.
    useEffect(() => {
        if (error && error !== "Network Error") {
            // Only show fetch errors, not add/edit errors (those are handled in handleSubmit)
            console.log("Error from state:", error);
            // toast.error(error); // Disabled to prevent double toasts
            // dispatch(clearError());
        }
    }, [error, dispatch]);

    const handleAddClick = () => {
        setEditingId(null);
        const today = new Date().toISOString().split('T')[0];
        setFormData({ date: today, startHour: "09", endHour: "10" });
        setOpenModal(true);
    };

    const handleEditClick = (availability) => {
        setEditingId(availability.id);
        // Parse UTC time directly without timezone conversion
        // Handle both "2025-11-18T09:00:00Z" and "2025-11-18T09:00:00" formats
        const cleanStartTime = availability.startTime.replace('Z', '');
        const cleanEndTime = availability.endTime.replace('Z', '');
        
        const date = cleanStartTime.split('T')[0]; // Extract date
        
        // Parse time directly from string to avoid Date object timezone conversion
        const startTimeMatch = cleanStartTime.match(/T(\d{2}):(\d{2}):/);
        const endTimeMatch = cleanEndTime.match(/T(\d{2}):(\d{2}):/);
        
        const startHour = startTimeMatch ? startTimeMatch[1] : '09';
        const endHour = endTimeMatch ? endTimeMatch[1] : '10';
        
        console.log("Edit clicked:", {
            startTime: availability.startTime,
            endTime: availability.endTime,
            date,
            startHour,
            endHour,
        });
        
        setFormData({
            date,
            startHour,
            endHour,
        });
        setOpenModal(true);
    };

    const handleDeleteClick = async (id) => {
        if (window.confirm("Are you sure you want to delete this availability slot?")) {
            await dispatch(removeAvailability(id));
            toast.success("Availability slot deleted");
        }
    };

    const checkOverlap = (newStart, newEnd, excludeId = null) => {
        // Check if new time slot overlaps with existing slots
        // Use string comparison for ISO 8601 format (works because format is standardized)
        for (const avail of availabilities) {
            // Skip the slot being edited
            if (excludeId && avail.id === excludeId) {
                continue;
            }

            // String comparison works for ISO 8601: YYYY-MM-DDTHH:MM:SS.sssZ format
            // newStart < existingEnd AND newEnd > existingStart = overlap
            if (newStart < avail.endTime && newEnd > avail.startTime) {
                return true; // Overlap found
            }
        }
        return false; // No overlap
    };

    const handleSubmit = async () => {
        if (!formData.date || !formData.startHour || !formData.endHour) {
            toast.error("Please fill in all fields");
            return;
        }

        // Build ISO datetime strings (hour only, minute/second = 0)
        // Send as local time formatted as UTC - backend will treat as UTC
        const startTime = `${formData.date}T${formData.startHour}:00:00Z`;
        const endTime = `${formData.date}T${formData.endHour}:00:00Z`;

        if (parseInt(formData.endHour) <= parseInt(formData.startHour)) {
            toast.error("End hour must be after start hour");
            return;
        }

        // Validate: slot cannot be in the past
        // Compare with current time in same format (local time treated as UTC)
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD in UTC
        const currentHour = now.getHours(); // Current hour (browser local, but we'll use it for UTC comparison)
        
        // If date is today, check if hour is in past
        if (formData.date === todayStr && parseInt(formData.endHour) <= currentHour) {
            toast.error("Cannot create slot in the past");
            return;
        }
        
        // If date is before today, reject
        if (formData.date < todayStr) {
            toast.error("Cannot create slot in the past");
            return;
        }

        // Check for overlap before submitting
        if (checkOverlap(startTime, endTime, editingId)) {
            toast.error("Time slot overlaps with existing availability");
            return;
        }

        try {
            let result;
            if (editingId) {
                result = await dispatch(
                    editAvailability({
                        id: editingId,
                        payload: { startTime, endTime },
                    })
                );
            } else {
                result = await dispatch(
                    addAvailability({
                        coachId: userId,
                        startTime,
                        endTime,
                    })
                );
            }

            // Check if dispatch was rejected
            if (result.type && result.type.endsWith("/rejected")) {
                console.error("API Error:", result.payload);
                toast.error(result.payload || "Operation failed");
                return;
            }
            if (editingId) {
                toast.success("Availability slot updated");
            } else {
                const duration = parseInt(formData.endHour) - parseInt(formData.startHour);
                toast.success(`${duration} hour slot(s) created successfully`);
                const month = currentDate.getMonth() + 1;
                const year = currentDate.getFullYear();
                dispatch(fetchAvailabilitiesByMonth({ interviewerId: userId, month, year }));
            }
            
            setOpenModal(false);
            setEditingId(null);
            setFormData({
                date: "",
                startHour: "09",
                endHour: "10",
            });
        } catch (err) {
            console.error("Error in handleSubmit catch block:", err);
            toast.error("An error occurred");
        }
    };

    const calendarEvents = availabilities.map((avail) => {
        // Compare UTC timestamps directly without timezone conversion
        const now = new Date().toISOString(); // Get current UTC time as ISO string
        const eventEnd = avail.endTime;
        const isPast = eventEnd < now; // String comparison works for ISO 8601 format
        
        let backgroundColor, borderColor, classNames = [];
        
        if (isPast) {
            backgroundColor = "#9CA3AF"; // gray-400 for past events
            borderColor = "#9CA3AF";
            classNames.push("past-event");
        } else if (avail.isBooked) {
            backgroundColor = "#EF4444"; // red-500 for booked
            borderColor = "#EF4444";
        } else {
            backgroundColor = "#4F46E5"; // indigo-600 for available
            borderColor = "#4F46E5";
        }
        
        return {
            id: String(avail.id),
            title: isPast ? "Past" : (avail.isBooked ? "Booked" : "Available"),
            start: avail.startTime,
            end: avail.endTime,
            backgroundColor,
            borderColor,
            classNames,
            extendedProps: {
                isPast,
                isBooked: avail.isBooked,
            },
        };
    });

    return (
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

                {/* Error Alert */}
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

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
                        <Box sx={{ 
                            p: 3,
                            '& .fc .fc-button': {
                                all: 'unset',
                                display: 'inline-block',
                                backgroundColor: '#FFFFFF',
                                border: '1.5px solid #E5E7EB',
                                color: '#374151',
                                fontWeight: 600,
                                textTransform: 'none',
                                fontSize: '0.875rem',
                                borderRadius: '8px',
                                padding: '8px 16px',
                                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                                cursor: 'pointer',
                                lineHeight: 'normal',
                                textAlign: 'center',
                                verticalAlign: 'middle',
                                userSelect: 'none',
                                '&:hover': {
                                    backgroundColor: '#F9FAFB',
                                    borderColor: '#4F46E5',
                                    color: '#4F46E5',
                                },
                            },
                            '& .fc .fc-button-active': {
                                backgroundColor: '#4F46E5 !important',
                                borderColor: '#4F46E5 !important',
                                color: '#FFFFFF !important',
                            },
                            '& .fc .fc-toolbar-title': {
                                fontSize: '1.25rem',
                                fontWeight: 700,
                                color: '#111827',
                                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                            },
                        }}>
                            {loading ? (
                                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <FullCalendar
                                    ref={calendarRef}
                                    plugins={[dayGridPlugin, timeGridPlugin]}
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
                                        // Prevent editing past events
                                        if (info.event.extendedProps.isPast) {
                                            toast.error("Cannot edit past availability slots");
                                            return;
                                        }
                                        
                                        const avail = availabilities.find(
                                            (a) => a.id === parseInt(info.event.id)
                                        );
                                        if (avail) {
                                            handleEditClick(avail);
                                        }
                                    }}
                                    editable={false}
                                    eventResizableFromStart={false}
                                    eventDurationEditable={false}
                                    datesSet={(info) => {
                                        setCurrentDate(info.start);
                                    }}
                                    height="auto"
                                    timeZone="UTC"
                                />
                            )}
                        </Box>
                    </Card>

                    {/* Right Panel - Availabilities List */}
                    <Card
                        variant="outlined"
                        sx={{
                            borderColor: "divider",
                            borderRadius: "12px",
                            height: "fit-content",
                        }}
                    >
                        <CardContent sx={{ p: 2 }}>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 600,
                                    mb: 2,
                                    color: "text.primary",
                                }}
                            >
                                Upcoming Slots ({availabilities.filter(a => new Date(a.endTime) >= new Date()).length})
                            </Typography>

                            <Stack spacing={1.5}>
                                {loading ? (
                                    <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                                        <CircularProgress size={24} />
                                    </Box>
                                ) : availabilities.filter(a => new Date(a.endTime) >= new Date()).length === 0 ? (
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: "text.secondary",
                                            textAlign: "center",
                                            py: 3,
                                            fontStyle: "italic",
                                        }}
                                    >
                                        No upcoming slots
                                    </Typography>
                                ) : (
                                    availabilities
                                        .filter(a => new Date(a.endTime) >= new Date())
                                        .sort((a, b) => {
                                            // Sort by startTime ascending (soonest first)
                                            return new Date(a.startTime) - new Date(b.startTime);
                                        })
                                        .map((avail) => (
                                        <Box
                                            key={avail.id}
                                            sx={{
                                                border: "1px solid",
                                                borderColor: "divider",
                                                borderRadius: "8px",
                                                p: 1.5,
                                                transition: "all 0.2s ease-in-out",
                                                "&:hover": {
                                                    borderColor: "primary.main",
                                                    boxShadow: "0 2px 8px rgba(79, 70, 229, 0.1)",
                                                },
                                            }}
                                        >
                                            {/* Status row */}
                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                                <IoCheckmarkCircle
                                                    size={14}
                                                    style={{
                                                        color: avail.isBooked ? "#EF4444" : "#10B981",
                                                    }}
                                                />
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: avail.isBooked ? "error.main" : "success.main",
                                                    }}
                                                >
                                                    {avail.isBooked ? "Booked" : "Available"}
                                                </Typography>
                                            </Stack>

                                            {/* Date & Time row */}
                                            <Typography 
                                                variant="caption" 
                                                sx={{ 
                                                    color: "text.secondary",
                                                    display: "block",
                                                    mb: 0.5,
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {parseUTCDate(avail.startTime)}
                                            </Typography>
                                            
                                            {/* Time range */}
                                            <Typography 
                                                variant="body2" 
                                                sx={{ 
                                                    color: "primary.main",
                                                    fontWeight: 600,
                                                    mb: 1,
                                                }}
                                            >
                                                {parseUTCTime(avail.startTime)} - {parseUTCTime(avail.endTime)}
                                            </Typography>

                                            {/* Edit/Delete buttons */}
                                            {!avail.isBooked && (
                                                <Stack
                                                    direction="row"
                                                    spacing={0.5}
                                                    sx={{ justifyContent: "flex-end" }}
                                                >
                                                    <Button
                                                        size="small"
                                                        variant="text"
                                                        startIcon={<IoPencil size={14} />}
                                                        onClick={() => handleEditClick(avail)}
                                                        sx={{
                                                            textTransform: "none",
                                                            fontSize: "0.75rem",
                                                            color: "primary.main",
                                                        }}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        variant="text"
                                                        color="error"
                                                        startIcon={<IoTrash size={14} />}
                                                        onClick={() => handleDeleteClick(avail.id)}
                                                        sx={{
                                                            textTransform: "none",
                                                            fontSize: "0.75rem",
                                                        }}
                                                    >
                                                        Delete
                                                    </Button>
                                                </Stack>
                                            )}
                                        </Box>
                                        ))
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            {/* Modal Add/Edit */}
            <Modal
                open={openModal}
                onClose={() => {
                    setOpenModal(false);
                    setEditingId(null);
                    setFormData({
                        date: "",
                        startHour: "09",
                        endHour: "10",
                    });
                }}
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <Card
                    sx={{
                        width: "90%",
                        maxWidth: "500px",
                        borderRadius: "12px",
                    }}
                >
                    <Box sx={{ p: 3 }}>
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 700,
                                mb: 3,
                                color: "text.primary",
                            }}
                        >
                            {editingId ? "Edit Availability Slot" : "Create Availability Slot"}
                        </Typography>

                        <Stack spacing={2.5}>
                            <Box>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontWeight: 600,
                                        mb: 1,
                                        color: "text.primary",
                                    }}
                                >
                                    Date
                                </Typography>
                                <TextField
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) =>
                                        setFormData({ ...formData, date: e.target.value })
                                    }
                                    inputProps={{
                                        min: new Date().toISOString().split('T')[0], // Disable past dates
                                    }}
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: "8px",
                                        },
                                    }}
                                />
                            </Box>

                            <Box>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontWeight: 600,
                                        mb: 1,
                                        color: "text.primary",
                                    }}
                                >
                                    Start Hour
                                </Typography>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={formData.startHour}
                                        onChange={(e) =>
                                            setFormData({ ...formData, startHour: e.target.value })
                                        }
                                        sx={{
                                            borderRadius: "8px",
                                        }}
                                    >
                                        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                            <MenuItem key={hour} value={hour.toString().padStart(2, '0')}>
                                                {hour.toString().padStart(2, '0')}:00
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            <Box>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontWeight: 600,
                                        mb: 1,
                                        color: "text.primary",
                                    }}
                                >
                                    End Hour
                                </Typography>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={formData.endHour}
                                        onChange={(e) =>
                                            setFormData({ ...formData, endHour: e.target.value })
                                        }
                                        sx={{
                                            borderRadius: "8px",
                                        }}
                                    >
                                        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                            <MenuItem key={hour} value={hour.toString().padStart(2, '0')}>
                                                {hour.toString().padStart(2, '0')}:00
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            <Stack
                                direction="row"
                                spacing={2}
                                justifyContent="flex-end"
                                sx={{ mt: 3 }}
                            >
                                <Button
                                    variant="outlined"
                                    onClick={() => setOpenModal(false)}
                                    sx={{
                                        textTransform: "none",
                                        borderColor: "divider",
                                        color: "text.secondary",
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    sx={{
                                        textTransform: "none",
                                    }}
                                >
                                    {editingId ? "Update" : "Create"}
                                </Button>
                            </Stack>
                        </Stack>
                    </Box>
                </Card>
            </Modal>
        </Box>
    );
};

export default ScheduleManagement;
