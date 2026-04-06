import React, { useState } from 'react';
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
    Box
} from '@mui/material';

const ReportRoomModal = ({ open, onClose, onSubmit, isSubmitting }) => {
    const [reason, setReason] = useState('Coach no show');
    const [details, setDetails] = useState('');

    const handleSubmit = async () => {
        const success = await onSubmit({ reason, details });
        if (success) {
            onClose();
            setReason('Coach no show');
            setDetails('');
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Report Interview Issue</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                        Please describe the issue you are experiencing in this interview room. Our team will review the logs.
                    </Typography>

                    <FormControl fullWidth>
                        <InputLabel>Reason</InputLabel>
                        <Select
                            value={reason}
                            label="Reason"
                            onChange={(e) => setReason(e.target.value)}
                        >
                            <MenuItem value="Coach no show">Coach no show</MenuItem>
                            <MenuItem value="Candidate no show">Candidate no show</MenuItem>
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
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                <Button 
                    variant="contained" 
                    color="error" 
                    onClick={handleSubmit}
                    disabled={isSubmitting || !reason}
                >
                    {isSubmitting ? "Submitting..." : "Submit Report"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ReportRoomModal;
