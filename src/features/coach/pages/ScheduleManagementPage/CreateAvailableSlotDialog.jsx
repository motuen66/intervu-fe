import React, { useState } from "react";
import {
    Box,
    Button,
    TextField,
    Typography,
    Modal,
    Card,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Chip,
} from "@mui/material";
import { IoAdd, IoClose } from "react-icons/io5";
import toast from "react-hot-toast";
import { getInterviewTypeById } from "../../../admin/services/interviewTypeApi";

const CreateAvailableSlotDialog = ({
    open,
    onClose,
    formData,
    setFormData,
    interviewTypes,
    FocusEnum,
    handleSubmit,
    loading,
    minDate,
    maxDate,
}) => {
    const [tempDate, setTempDate] = useState("");

    const handleAddDuplicateDate = () => {
        if (!tempDate) return;
        if (formData.date === tempDate) {
            toast.error("Date already selected as main date");
            return;
        }
        if (formData.duplicateDates.includes(tempDate)) {
            toast.error("Date already added");
            return;
        }
        setFormData({
            ...formData,
            duplicateDates: [...formData.duplicateDates, tempDate]
        });
        setTempDate("");
    };

    const handleRemoveDuplicateDate = (dateToRemove) => {
        setFormData({
            ...formData,
            duplicateDates: formData.duplicateDates.filter(d => d !== dateToRemove)
        });
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
        >
            <Card sx={{ width: "90%", maxWidth: "500px", borderRadius: "12px", maxHeight: "90vh", overflowY: "auto" }}>
                <Box sx={{ p: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: "text.primary" }}>
                        Create Availability Slot
                    </Typography>

                    <Stack spacing={2.5}>
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: "text.primary" }}>
                                Date
                            </Typography>
                            <TextField
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                inputProps={{
                                    min: minDate || (() => {
                                        const now = new Date();
                                        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                                    })(),
                                    max: maxDate
                                }}
                                fullWidth
                                variant="outlined"
                                size="small"
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                            />
                        </Box>

                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: "text.primary" }}>
                                Duplicate to other dates (Optional)
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                                <TextField
                                    type="date"
                                    value={tempDate}
                                    onChange={(e) => setTempDate(e.target.value)}
                                    inputProps={{
                                        min: minDate || (() => {
                                            const now = new Date();
                                            return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                                        })(),
                                        max: maxDate
                                    }}
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                                />
                                <Button
                                    variant="outlined"
                                    onClick={handleAddDuplicateDate}
                                    sx={{ minWidth: "auto", px: 1 }}
                                >
                                    <IoAdd size={20} />
                                </Button>
                            </Stack>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                {formData.duplicateDates?.map((date) => (
                                    <Chip
                                        key={date}
                                        label={date}
                                        onDelete={() => handleRemoveDuplicateDate(date)}
                                        size="small"
                                        variant="outlined"
                                    />
                                ))}
                            </Box>
                        </Box>

                        <Box>
                            <FormControl fullWidth margin="normal">
                                <InputLabel id="focus-label">Focus</InputLabel>
                                <Select
                                    labelId="focus-label"
                                    value={formData.focus}
                                    label="Focus"
                                    onChange={(e) => {
                                        const newFocus = Number(e.target.value);
                                        setFormData((prev) => ({
                                            ...prev,
                                            focus: newFocus,
                                            typeId: newFocus === FocusEnum.GeneralSkills ? prev.typeId : "",
                                        }));
                                    }}
                                >
                                    <MenuItem value={FocusEnum.JobDescription}>Job Description</MenuItem>
                                    <MenuItem value={FocusEnum.GeneralSkills}>General Skills</MenuItem>
                                </Select>
                            </FormControl>

                            {formData.focus === FocusEnum.GeneralSkills && (
                                <FormControl fullWidth margin="normal">
                                    <InputLabel id="type-label">Type</InputLabel>
                                    <Select
                                        labelId="type-label"
                                        value={formData.typeId || ""}
                                        label="Type"
                                        onChange={async (e) => {
                                            const selectedTypeId = e.target.value;
                                            setFormData({ ...formData, typeId: selectedTypeId });

                                            if (selectedTypeId) {
                                                try {
                                                    const typeDetails = await getInterviewTypeById(selectedTypeId);
                                                    const duration = typeDetails.durationMinutes || 0;

                                                    if (duration > 0) {
                                                        const startTotalMinutes = formData.startHour * 60 + formData.startMinute;
                                                        const endTotalMinutes = startTotalMinutes + duration;
                                                        const newEndHour = Math.floor(endTotalMinutes / 60);
                                                        const newEndMinute = endTotalMinutes % 60;
                                                        setFormData((prev) => ({ ...prev, typeId: selectedTypeId, endHour: newEndHour, endMinute: newEndMinute }));
                                                    }
                                                } catch (error) {
                                                    console.error("Error fetching interview type details:", error);
                                                    toast.error("Failed to fetch interview type duration");
                                                }
                                            }
                                        }}
                                    >
                                        {interviewTypes.map((t) => (
                                            <MenuItem key={t.id} value={t.id}>
                                                {t.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        </Box>

                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: "text.primary" }}>
                                Start Time
                            </Typography>
                            <Stack direction="row" spacing={1}>
                                <FormControl fullWidth size="small">
                                    <Select value={formData.startHour} onChange={(e) => {
                                        const newHour = Number(e.target.value);

                                        setFormData((prev) => {
                                            if (prev.focus !== FocusEnum.GeneralSkills || !prev.typeId)
                                                return { ...prev, startHour: newHour };

                                            const type = interviewTypes.find(t => t.id === prev.typeId);
                                            if (!type?.durationMinutes)
                                                return { ...prev, startHour: newHour };

                                            const total = newHour * 60 + prev.startMinute + type.durationMinutes;

                                            return {
                                                ...prev,
                                                startHour: newHour,
                                                endHour: Math.floor(total / 60),
                                                endMinute: total % 60,
                                            };
                                        });
                                    }}
                                        sx={{ borderRadius: "8px" }}>
                                        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                            <MenuItem key={hour} value={hour}>
                                                {hour.toString().padStart(2, "0")}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <Typography sx={{ display: "flex", alignItems: "center", mx: 0.5 }}>:</Typography>
                                <FormControl fullWidth size="small">
                                    <Select value={formData.startMinute} onChange={(e) => setFormData({ ...formData, startMinute: e.target.value })} sx={{ borderRadius: "8px" }}>
                                        {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                                            <MenuItem key={minute} value={minute}>
                                                {minute.toString().padStart(2, "0")}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Box>

                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: "text.primary" }}>
                                End Time
                            </Typography>
                            <Stack direction="row" spacing={1}>
                                <FormControl fullWidth size="small">
                                    <Select value={formData.endHour} disabled={formData.focus === FocusEnum.GeneralSkills} onChange={(e) => setFormData({ ...formData, endHour: e.target.value })} sx={{ borderRadius: "8px" }}>
                                        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                            <MenuItem key={hour} value={hour}>
                                                {hour.toString().padStart(2, "0")}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <Typography sx={{ display: "flex", alignItems: "center", mx: 0.5 }}>:</Typography>
                                <FormControl fullWidth size="small">
                                    <Select value={formData.endMinute} disabled={formData.focus === FocusEnum.GeneralSkills} onChange={(e) => setFormData({ ...formData, endMinute: e.target.value })} sx={{ borderRadius: "8px" }}>
                                        {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                                            <MenuItem key={minute} value={minute}>
                                                {minute.toString().padStart(2, "0")}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Box>

                        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                            <Button variant="outlined" onClick={onClose} sx={{ textTransform: "none", borderColor: "divider", color: "text.secondary" }}>
                                Cancel
                            </Button>
                            <Button variant="contained" color="primary" onClick={handleSubmit} disabled={loading} sx={{ textTransform: "none" }}>
                                Create
                            </Button>
                        </Stack>
                    </Stack>
                </Box>
            </Card>
        </Modal>
    );
};

export default CreateAvailableSlotDialog;