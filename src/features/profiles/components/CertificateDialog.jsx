import React, { useEffect, useState } from "react";
import { Dialog, DialogActions, DialogContent, DialogTitle, Stack, Box, Typography } from "@mui/material";
import { PrimaryButton, SecondaryButton } from "../../../common/components/buttons";
import FormTextField from "../../../common/components/form/FormTextField";
import { CompanyLogo } from "../../../common/utils/logoImageGenerator";

const EMPTY_FORM = {
    name: "",
    issuer: "",
    issuedAt: "",
    expiryAt: "",
    link: "",
};

function normalizeDate(dateValue) {
    if (!dateValue) return "";
    if (typeof dateValue === "string") return dateValue.split("T")[0];
    return "";
}

function CertificateDialog({ open, onClose, onSave, onDelete, certificate }) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!open) return;
        setForm({
            name: certificate?.name || certificate?.Name || "",
            issuer: certificate?.issuer || certificate?.Issuer || "",
            issuedAt: normalizeDate(certificate?.issuedAt || certificate?.IssuedAt),
            expiryAt: normalizeDate(certificate?.expiryAt || certificate?.ExpiryAt),
            link: certificate?.link || certificate?.Link || "",
        });
        setErrors({});
    }, [open, certificate]);

    const validate = () => {
        const nextErrors = {};
        if (!form.name.trim()) nextErrors.name = "Certificate name is required";
        
        if (form.issuedAt && form.expiryAt) {
            const issued = new Date(form.issuedAt);
            const expiry = new Date(form.expiryAt);
            if (issued > expiry) {
                nextErrors.expiryAt = "Expiry date must be after issued date";
            }
        }
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;
        onSave?.(form);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>
                {certificate?.id ? "Edit certificate" : "Add certificate"}
            </DialogTitle>
            {(form.name || form.link) && (
                <Box sx={{ px: 3, pt: 1 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <CompanyLogo
                            name={(function () {
                                if (form.link) {
                                    try {
                                        const u = new URL(form.link);
                                        return u.hostname.replace("www.", "");
                                    } catch (e) {
                                        return form.name || "Certificate";
                                    }
                                }
                                return form.name || "Certificate";
                            })()}
                            size={36}
                        />
                        <Box>
                            <Typography sx={{ fontWeight: 700 }}>{form.name || "Certificate"}</Typography>
                            {form.issuer && (
                                <Typography variant="body2" color="text.secondary">
                                    {form.issuer}
                                </Typography>
                            )}
                        </Box>
                    </Stack>
                </Box>
            )}
            <DialogContent dividers>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <FormTextField
                        fullWidth
                        label="Certificate name"
                        required
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        error={!!errors.name}
                        helperText={errors.name}
                    />
                    <FormTextField
                        fullWidth
                        label="Issuer"
                        value={form.issuer}
                        onChange={(e) => setForm((prev) => ({ ...prev, issuer: e.target.value }))}
                    />
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <FormTextField
                            fullWidth
                            label="Issued date"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            value={form.issuedAt}
                            onChange={(e) => setForm((prev) => ({ ...prev, issuedAt: e.target.value }))}
                        />
                        <FormTextField
                            fullWidth
                            label="Expiry date"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            value={form.expiryAt}
                            onChange={(e) => setForm((prev) => ({ ...prev, expiryAt: e.target.value }))}
                            error={!!errors.expiryAt}
                            helperText={errors.expiryAt}
                        />
                    </Stack>
                    <FormTextField
                        fullWidth
                        label="Certificate link"
                        placeholder="https://..."
                        value={form.link}
                        onChange={(e) => setForm((prev) => ({ ...prev, link: e.target.value }))}
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
                <Stack direction="row" spacing={1}>
                    {certificate?.id && (
                        <SecondaryButton
                            onClick={() => onDelete?.(certificate)}
                            sx={{
                                color: "error.main",
                                borderColor: "error.main",
                                "&:hover": { borderColor: "error.dark", color: "error.dark" },
                            }}
                        >
                            Delete
                        </SecondaryButton>
                    )}
                </Stack>
                <Stack direction="row" spacing={1}>
                    <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
                    <PrimaryButton onClick={handleSave}>Save</PrimaryButton>
                </Stack>
            </DialogActions>
        </Dialog>
    );
}

export default CertificateDialog;
