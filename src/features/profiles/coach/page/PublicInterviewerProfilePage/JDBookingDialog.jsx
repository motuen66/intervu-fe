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
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import { AIM_LEVEL, AIM_LEVEL_LABELS } from "../../../../../common/constants/status";
import { getCoachInterviewServices } from "../../../../coach/services/coachInterviewServiceApi";
import { createJDBookingRequest } from "../../../../interview/services/bookingRequestApi";
import toast from "react-hot-toast";
import FormTextField from "../../../../../common/components/form/FormTextField";
import { dialogStyles } from "../../../../../common/constants/uiStyles";
import { PrimaryButton, SecondaryButton } from "../../../../../common/components/buttons";

/**
 * Flow C: Candidate submits JD + CV for a multi-round interview plan
 */
export default function JDBookingDialog({ open, onClose, coachId }) {
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(false);
    const [form, setForm] = useState({
        jobDescriptionUrl: "",
        cvUrl: "",
        aimLevel: "",
    });
    const [rounds, setRounds] = useState([
        { coachInterviewServiceId: "", startTime: "" },
        { coachInterviewServiceId: "", startTime: "" },
    ]);
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

    const addRound = () => {
        setRounds([...rounds, { coachInterviewServiceId: "", startTime: "" }]);
    };

    const removeRound = (index) => {
        if (rounds.length <= 2) return;
        setRounds(rounds.filter((_, i) => i !== index));
    };

    const updateRound = (index, field, value) => {
        setRounds(rounds.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
    };

    const getServiceName = (serviceId) => {
        const svc = services.find((s) => s.id === serviceId);
        return svc ? `${svc.interviewTypeName}${svc.isCoding ? " (Coding)" : ""}` : "";
    };

    const getTotalPrice = () => {
        return rounds.reduce((sum, r) => {
            const svc = services.find((s) => s.id === r.coachInterviewServiceId);
            return sum + (svc?.price || 0);
        }, 0);
    };

    const handleSubmit = async () => {
        setError("");
        if (!form.jobDescriptionUrl.trim()) {
            setError("Please provide the Job Description URL.");
            return;
        }
        if (!form.cvUrl.trim()) {
            setError("Please provide the CV URL.");
            return;
        }
        for (let i = 0; i < rounds.length; i++) {
            if (!rounds[i].coachInterviewServiceId) {
                setError(`Please select an interview service for Round ${i + 1}.`);
                return;
            }
            if (!rounds[i].startTime) {
                setError(`Please select a start time for Round ${i + 1}.`);
                return;
            }
        }

        setSaving(true);
        try {
            const payload = {
                coachId,
                jobDescriptionUrl: form.jobDescriptionUrl.trim(),
                cvUrl: form.cvUrl.trim(),
                rounds: rounds.map((r) => ({
                    coachInterviewServiceId: r.coachInterviewServiceId,
                    startTime: new Date(r.startTime).toISOString(),
                })),
            };
            if (form.aimLevel !== "") {
                payload.aimLevel = Number(form.aimLevel);
            }

            await createJDBookingRequest(payload);
            toast.success("JD booking request submitted! The coach will review it.");
            handleClose();
            navigate("/booking-requests");
        } catch (err) {
            setError(err.message || "Failed to submit booking request.");
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setForm({ jobDescriptionUrl: "", cvUrl: "", aimLevel: "" });
        setRounds([
            { coachInterviewServiceId: "", startTime: "" },
            { coachInterviewServiceId: "", startTime: "" },
        ]);
        setError("");
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
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
                        JD Multi-Round Interview Booking
                    </Typography>
                    <Typography sx={{ fontSize: "0.85rem", color: "#6b7280", mt: 0.5 }}>
                        Submit your JD & CV and configure multiple interview rounds.
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
                        <>
                            <Grid container spacing={2.5} direction="column">
                                <Grid item xs={12} sx={{ width: "100%" }}>
                                    <FormTextField
                                        fullWidth
                                        label="Job Description URL"
                                        value={form.jobDescriptionUrl}
                                        onChange={(e) => setForm({ ...form, jobDescriptionUrl: e.target.value })}
                                        required
                                        placeholder="https://..."
                                    />
                                </Grid>

                                <Grid item xs={12} sx={{ width: "100%" }}>
                                    <FormTextField
                                        fullWidth
                                        label="CV URL"
                                        value={form.cvUrl}
                                        onChange={(e) => setForm({ ...form, cvUrl: e.target.value })}
                                        required
                                        placeholder="https://..."
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

                            <Divider sx={{ my: 3 }} />

                            {/* Rounds */}
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                <Typography fontWeight={700} fontSize="0.95rem" color="#111827">
                                    Interview Rounds (min. 2)
                                </Typography>
                                <Button
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={addRound}
                                    sx={{
                                        textTransform: "none",
                                        color: "var(--mui-palette-primary-main)",
                                        fontWeight: 600,
                                    }}
                                >
                                    Add Round
                                </Button>
                            </Stack>

                            <Stack spacing={2}>
                                {rounds.map((round, index) => (
                                    <Box
                                        key={index}
                                        sx={{
                                            p: 2,
                                            borderRadius: 2,
                                            border: "1px solid #e2e8f0",
                                            backgroundColor: "#fafbfc",
                                        }}
                                    >
                                        <Stack
                                            direction="row"
                                            justifyContent="space-between"
                                            alignItems="center"
                                            sx={{ mb: 1.5 }}
                                        >
                                            <Typography fontWeight={600} fontSize="0.85rem" color="#374151">
                                                Round {index + 1}
                                            </Typography>
                                            {rounds.length > 2 && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => removeRound(index)}
                                                    sx={{ color: "#ef4444" }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </Stack>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <FormTextField
                                                    fullWidth
                                                    select
                                                    size="small"
                                                    label="Interview Service"
                                                    value={round.coachInterviewServiceId}
                                                    onChange={(e) =>
                                                        updateRound(index, "coachInterviewServiceId", e.target.value)
                                                    }
                                                    required
                                                >
                                                    {services.map((svc) => (
                                                        <MenuItem key={svc.id} value={svc.id}>
                                                            {svc.interviewTypeName}
                                                            {svc.isCoding ? " (Coding)" : ""} —{" "}
                                                            {svc.price?.toLocaleString()} ₫
                                                        </MenuItem>
                                                    ))}
                                                </FormTextField>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <FormTextField
                                                    fullWidth
                                                    size="small"
                                                    label="Start Time"
                                                    type="datetime-local"
                                                    value={round.startTime}
                                                    onChange={(e) => updateRound(index, "startTime", e.target.value)}
                                                    required
                                                    InputLabelProps={{ shrink: true }}
                                                    inputProps={{
                                                        min: new Date().toISOString().slice(0, 16),
                                                    }}
                                                />
                                            </Grid>
                                        </Grid>
                                    </Box>
                                ))}
                            </Stack>

                            {/* Total price */}
                            {getTotalPrice() > 0 && (
                                <Box
                                    sx={{
                                        mt: 2,
                                        p: 1.5,
                                        borderRadius: 2,
                                        backgroundColor: "#f0f4ff",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <Typography fontSize="0.85rem" color="#4338ca" fontWeight={600}>
                                        Estimated Total
                                    </Typography>
                                    <Typography fontSize="1rem" color="#4338ca" fontWeight={700}>
                                        {getTotalPrice().toLocaleString()} ₫
                                    </Typography>
                                </Box>
                            )}
                        </>
                    )}

                    {error && <Typography sx={{ color: "error.main", mt: 2, fontSize: "0.85rem" }}>{error}</Typography>}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
                    <SecondaryButton onClick={handleClose} disabled={saving}>
                        Cancel
                    </SecondaryButton>
                    <PrimaryButton type="submit" loading={saving}>
                        Submit Booking Request
                    </PrimaryButton>
                </DialogActions>
            </form>
        </Dialog>
    );
}
