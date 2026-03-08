import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import CircularProgress from "@mui/material/CircularProgress";
import { AIM_LEVEL, AIM_LEVEL_LABELS } from "../../../../../common/constants/status";
import { getCoachInterviewServices } from "../../../../coach/services/coachInterviewServiceApi";
import { createExternalBookingRequest } from "../../../../interview/services/bookingRequestApi";
import toast from "react-hot-toast";
import FormTextField from "../../../../../common/components/form/FormTextField";
import { dialogStyles } from "../../../../../common/constants/uiStyles";
import { PrimaryButton, SecondaryButton } from "../../../../../common/components/buttons";

/**
 * Flow B: Candidate requests an external session (outside coach's available slots)
 */
export default function ExternalBookingDialog({ open, onClose, coachId }) {
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(false);
    const [form, setForm] = useState({
        coachInterviewServiceId: "",
        requestedStartTime: "",
        aimLevel: "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (open && coachId) {
            loadServices();
        }
    }, [open, coachId]);

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

    const selectedService = services.find((s) => s.id === form.coachInterviewServiceId);

    const handleSubmit = async () => {
        setError("");
        if (!form.coachInterviewServiceId) {
            setError("Please select an interview service.");
            return;
        }
        if (!form.requestedStartTime) {
            setError("Please select a start time.");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                coachId,
                coachInterviewServiceId: form.coachInterviewServiceId,
                requestedStartTime: new Date(form.requestedStartTime).toISOString(),
            };
            if (form.aimLevel !== "") {
                payload.aimLevel = Number(form.aimLevel);
            }

            await createExternalBookingRequest(payload);
            toast.success("Booking request submitted! The coach will review it.");
            handleClose();
            navigate("/booking-requests");
        } catch (err) {
            setError(err.message || "Failed to submit booking request.");
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setForm({ coachInterviewServiceId: "", requestedStartTime: "", aimLevel: "" });
        setError("");
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: dialogStyles.paper }}
        >
            <DialogTitle
                sx={{
                    fontWeight: 700,
                    pb: 1,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", color: "#111827" }}>
                        Request External Booking
                    </Typography>
                    <Typography sx={{ fontSize: "0.85rem", color: "#6b7280", mt: 0.5 }}>
                        Request a session outside the coach's available time slots.
                    </Typography>
                </Box>
                <IconButton
                    onClick={handleClose}
                    size="small"
                    sx={{ color: "#6b7280", "&:hover": { background: "rgba(15,23,42,0.06)" } }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}
            >
                <DialogContent sx={{ pt: 3 }}>
                    {loadingServices ? (
                        <Box display="flex" justifyContent="center" py={3}>
                            <CircularProgress size={28} />
                        </Box>
                    ) : (
                        <Grid container spacing={2.5} direction="column">
                            <Grid item xs={12} sx={{ width: "100%" }}>
                                <FormTextField
                                    fullWidth
                                    select
                                    label="Interview Service"
                                    value={form.coachInterviewServiceId}
                                    onChange={(e) => setForm({ ...form, coachInterviewServiceId: e.target.value })}
                                    required
                                >
                                    {services.map((svc) => (
                                        <MenuItem key={svc.id} value={svc.id}>
                                            {svc.interviewTypeName}
                                            {svc.isCoding ? " (Coding)" : ""} — {svc.price?.toLocaleString()} ₫ ·{" "}
                                            {svc.durationMinutes} min
                                        </MenuItem>
                                    ))}
                                </FormTextField>
                            </Grid>

                            {selectedService && (
                                <Grid item xs={12} sx={{ width: "100%" }}>
                                    <Box
                                        sx={{
                                            p: 1.5,
                                            borderRadius: 2,
                                            backgroundColor: "#f0f4ff",
                                            fontSize: "0.82rem",
                                            color: "#4338ca",
                                        }}
                                    >
                                        {selectedService.interviewTypeName} · {selectedService.durationMinutes} min ·{" "}
                                        {selectedService.price?.toLocaleString()} ₫
                                    </Box>
                                </Grid>
                            )}

                            <Grid item xs={12} sx={{ width: "100%" }}>
                                <FormTextField
                                    fullWidth
                                    label="Requested Start Time"
                                    type="datetime-local"
                                    value={form.requestedStartTime}
                                    onChange={(e) => setForm({ ...form, requestedStartTime: e.target.value })}
                                    required
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{
                                        min: new Date().toISOString().slice(0, 16),
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} sx={{ width: "100%" }}>
                                <FormTextField
                                    fullWidth
                                    select
                                    label="Target Level (optional)"
                                    value={form.aimLevel}
                                    onChange={(e) => setForm({ ...form, aimLevel: e.target.value })}
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {Object.entries(AIM_LEVEL_LABELS).map(([val, label]) => (
                                        <MenuItem key={val} value={val}>
                                            {label}
                                        </MenuItem>
                                    ))}
                                </FormTextField>
                            </Grid>
                        </Grid>
                    )}

                    {error && <Typography sx={{ color: "error.main", mt: 2, fontSize: "0.85rem" }}>{error}</Typography>}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
                    <SecondaryButton onClick={handleClose} disabled={saving}>
                        Cancel
                    </SecondaryButton>
                    <PrimaryButton type="submit" loading={saving}>
                        Submit Request
                    </PrimaryButton>
                </DialogActions>
            </form>
        </Dialog>
    );
}
