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
import { useTranslation } from 'react-i18next';

const ReportRoomModal = ({ open, onClose, onSubmit, isSubmitting }) => {
    const { t } = useTranslation();
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
            <DialogTitle>{t("interview.room.report_modal.title")}</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                        {t("interview.room.report_modal.subtitle")}
                    </Typography>

                    <FormControl fullWidth>
                        <InputLabel>{t("interview.room.report_modal.label_reason")}</InputLabel>
                        <Select
                            value={reason}
                            label={t("interview.room.report_modal.label_reason")}
                            onChange={(e) => setReason(e.target.value)}
                        >
                            <MenuItem value="Coach no show">{t("interview.room.report_modal.reason_coach_no_show")}</MenuItem>
                            <MenuItem value="Candidate no show">{t("interview.room.report_modal.reason_candidate_no_show")}</MenuItem>
                            <MenuItem value="Technical issues">{t("interview.room.report_modal.reason_tech_issues")}</MenuItem>
                            <MenuItem value="Unprofessional behavior">{t("interview.room.report_modal.reason_unprofessional")}</MenuItem>
                            <MenuItem value="Other">{t("interview.room.report_modal.reason_other")}</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label={t("interview.room.report_modal.label_details")}
                        placeholder={t("interview.room.report_modal.placeholder_details")}
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} disabled={isSubmitting}>{t("interview.room.report_modal.btn_cancel")}</Button>
                <Button 
                    variant="contained" 
                    color="error" 
                    onClick={handleSubmit}
                    disabled={isSubmitting || !reason}
                >
                    {isSubmitting ? t("interview.room.report_modal.btn_submitting") : t("interview.room.report_modal.btn_submit")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ReportRoomModal;
