import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, TextField, Typography, Modal, Card, Stack, FormControl, Select, MenuItem, Chip } from "@mui/material";
import { PrimaryButton, SecondaryButton } from "../../../../common/components/buttons";
import { IoAdd } from "react-icons/io5";
import toast from "react-hot-toast";
import StatusChip from "../../../../common/components/StatusChip";

const CreateAvailableSlotDialog = ({
    open,
    onClose,
    formData,
    setFormData,
    handleSubmit,
    loading,
    minDate,
    maxDate,
}) => {
    const { t } = useTranslation();
    const [tempDate, setTempDate] = useState("");

    const handleAddDuplicateDate = () => {
        if (!tempDate) return;
        if (formData.date === tempDate) {
            toast.error(t("coach.schedule.dialog.error_main_date"));
            return;
        }
        if (formData.duplicateDates.includes(tempDate)) {
            toast.error(t("coach.schedule.dialog.error_already_added"));
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
                // allow closing only via backdrop click or escape key
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
                        {t("coach.schedule.dialog.title_create")}
                    </Typography>

                    <Stack spacing={2.5}>
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: "text.primary" }}>
                                {t("coach.schedule.dialog.field_date")}
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
                                {t("coach.schedule.dialog.field_duplicate")}
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
                                <SecondaryButton onClick={handleAddDuplicateDate} sx={{ minWidth: "auto", px: 1 }}>
                                    <IoAdd size={20} />
                                </SecondaryButton>
                            </Stack>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                {formData.duplicateDates?.map((date) => (
                                    <StatusChip
                                        key={date}
                                        label={date}
                                        onDelete={() => handleRemoveDuplicateDate(date)}
                                        color="primary"
                                    />
                                ))}
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: "text.primary" }}>
                                {t("coach.schedule.dialog.field_start_time")}
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
                                        {[0, 30].map((minute) => (
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
                                {t("coach.schedule.dialog.field_end_time")}
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
                                        {[0, 30].map((minute) => (
                                            <MenuItem key={minute} value={minute}>
                                                {minute.toString().padStart(2, "0")}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Box>

                        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                            <SecondaryButton onClick={onClose}>{t("coach.schedule.dialog.btn_cancel")}</SecondaryButton>
                            <PrimaryButton onClick={handleSubmit} loading={loading}>
                                {t("coach.schedule.dialog.btn_create")}
                            </PrimaryButton>
                        </Stack>
                    </Stack>
                </Box>
            </Card>
        </Modal>
    );
};

export default CreateAvailableSlotDialog;
