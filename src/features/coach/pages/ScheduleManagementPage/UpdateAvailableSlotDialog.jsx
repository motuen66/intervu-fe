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
    Select,
    MenuItem,
    Chip,
} from "@mui/material";
import { IoAdd, IoTrash } from "react-icons/io5";
import toast from "react-hot-toast";

const UpdateAvailableSlotDialog = ({
    open,
    onClose,
    formData,
    setFormData,
    handleSubmit,
    handleDelete,
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
            duplicateDates: [...formData.duplicateDates, tempDate],
        });
        setTempDate("");
    };

    const handleRemoveDuplicateDate = (dateToRemove) => {
        setFormData({
            ...formData,
            duplicateDates: formData.duplicateDates.filter((d) => d !== dateToRemove),
        });
    };

    return (
        <Modal
            open={open}
            onClose={(event, reason) => {
                if (reason === "backdropClick" || reason === "escapeKeyDown") onClose();
            }}
            disableScrollLock={false}
            closeAfterTransition
            keepMounted
            BackdropProps={{ style: { position: "fixed" } }}
            sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
        >
            <Card sx={{ width: "90%", maxWidth: "500px", borderRadius: "12px", maxHeight: "90vh", overflowY: "auto" }}>
                <Box sx={{ p: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: "text.primary" }}>
                        Edit Availability Slot
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
                                    min:
                                        minDate ||
                                        (() => {
                                            const now = new Date();
                                            return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                                        })(),
                                    max: maxDate,
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
                                        min:
                                            minDate ||
                                            (() => {
                                                const now = new Date();
                                                return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                                            })(),
                                        max: maxDate,
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
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: "text.primary" }}>
                                Start Time
                            </Typography>
                            <Stack direction="row" spacing={1}>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={formData.startHour}
                                        onChange={(e) =>
                                            setFormData({ ...formData, startHour: Number(e.target.value) })
                                        }
                                        sx={{ borderRadius: "8px" }}
                                    >
                                        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                            <MenuItem key={hour} value={hour}>
                                                {hour.toString().padStart(2, "0")}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <Typography sx={{ display: "flex", alignItems: "center", mx: 0.5 }}>:</Typography>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={formData.startMinute}
                                        onChange={(e) => setFormData({ ...formData, startMinute: e.target.value })}
                                        sx={{ borderRadius: "8px" }}
                                    >
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
                                    <Select
                                        value={formData.endHour}
                                        onChange={(e) => setFormData({ ...formData, endHour: e.target.value })}
                                        sx={{ borderRadius: "8px" }}
                                    >
                                        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                            <MenuItem key={hour} value={hour}>
                                                {hour.toString().padStart(2, "0")}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <Typography sx={{ display: "flex", alignItems: "center", mx: 0.5 }}>:</Typography>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={formData.endMinute}
                                        onChange={(e) => setFormData({ ...formData, endMinute: e.target.value })}
                                        sx={{ borderRadius: "8px" }}
                                    >
                                        {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                                            <MenuItem key={minute} value={minute}>
                                                {minute.toString().padStart(2, "0")}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Box>

                        <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ mt: 3 }}>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<IoTrash size={16} />}
                                onClick={handleDelete}
                                disabled={loading}
                                sx={{ textTransform: "none" }}
                            >
                                Delete
                            </Button>
                            <Stack direction="row" spacing={2}>
                                <Button
                                    variant="outlined"
                                    onClick={onClose}
                                    sx={{ textTransform: "none", borderColor: "divider", color: "text.secondary" }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    sx={{ textTransform: "none" }}
                                >
                                    Update
                                </Button>
                            </Stack>
                        </Stack>
                    </Stack>
                </Box>
            </Card>
        </Modal>
    );
};

export default UpdateAvailableSlotDialog;
