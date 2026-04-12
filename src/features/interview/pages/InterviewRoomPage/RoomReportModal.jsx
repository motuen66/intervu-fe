import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Alert,
} from "@mui/material";
import { callApi } from "../../../../common/utils/apiConnector.js";
import { METHOD } from "../../../../common/constants/api.js";

const ReportRoomModal = ({ open, onClose, roomId }) => {
    const [reason, setReason] = useState("Coach absent");
    const [details, setDetails] = useState("");
    const [resolution, setResolution] = useState("Refund");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const resetForm = () => {
        setReason("Coach absent");
        setResolution("Refund");
        setDetails("");
        setErrorMessage("");
    };

    const handleClose = () => {
        if (isSubmitting) return;
        resetForm();
        onClose();
    };

    const getErrorMessage = (error) => {
        return (
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            "Failed to submit report. Please try again."
        );
    };

    const handleSubmit = async () => {
        setErrorMessage("");
        setIsSubmitting(true);
        try {
            await callApi({
                method: METHOD.POST,
                endpoint: `/interviewroom/${roomId}/report`,
                arg: {
                    reason,
                    details,
                    expectTo: resolution,
                },
                displaySuccessMessage: true,
                alertErrorMessage: false,
            });

            onClose();
            resetForm();
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle>Report Interview Issue</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                        Please describe the issue you are experiencing in this interview room. Our team will review the
                        logs.
                    </Typography>

                    {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

                    <FormControl fullWidth>
                        <InputLabel>Reason</InputLabel>
                        <Select value={reason} label="Reason" onChange={(e) => setReason(e.target.value)}>
                            <MenuItem value="Coach absent">Coach absent</MenuItem>
                            {/* <MenuItem value="Candidate no show">Candidate no show</MenuItem> */}
                            <MenuItem value="Technical issues">Technical issues</MenuItem>
                            <MenuItem value="Unprofessional behavior">Unprofessional behavior</MenuItem>
                            <MenuItem value="Other">Other</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Details"
                        placeholder="Please provide more details about the issue..."
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                    />

                    <FormControl fullWidth>
                        <InputLabel>Expect to</InputLabel>
                        <Select value={resolution} label="Expect to" onChange={(e) => setResolution(e.target.value)}>
                            <MenuItem value="Refund">Refund</MenuItem>
                            {/* <MenuItem value="Candidate no show">Candidate no show</MenuItem> */}
                        </Select>
                    </FormControl>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={handleClose} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button variant="contained" color="error" onClick={handleSubmit} disabled={isSubmitting || !reason}>
                    {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ReportRoomModal;
