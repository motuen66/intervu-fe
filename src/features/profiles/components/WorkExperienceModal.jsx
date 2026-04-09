import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Stack,
    FormControlLabel,
    Checkbox,
    Autocomplete,
    Box,
    MenuItem,
    FormControl,
    InputLabel,
    FormHelperText,
    Chip,
    Avatar,
} from "@mui/material";
import { PrimaryButton, SecondaryButton } from "../../../common/components/buttons";
import { CompanyLogo } from "../../../common/utils/logoImageGenerator";
import FormSelect from "../../../common/components/form/FormSelect";

const EMPLOYMENT_TYPES = [
    "Full-time",
    "Part-time",
    "Self-employed",
    "Freelance",
    "Contract",
    "Internship",
    "Apprenticeship",
    "Seasonal",
];

const LOCATION_TYPES = ["On-site", "Remote", "Hybrid"];
const MAX_DESCRIPTION_WORDS = 100;

const WorkExperienceModal = ({
    open,
    onClose,
    onSave,
    onDelete,
    experience,
    allSkills,
    allCompanies = [],
    onCreateCompany,
}) => {
    const [formData, setFormData] = useState({
        companyName: "",
        jobTitle: "",
        employmentType: "",
        location: "",
        locationType: "",
        startDate: "",
        endDate: "",
        isCurrentWorking: false,
        isEnded: false,
        description: "",
        skillIds: [],
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (experience) {
            setFormData({
                companyName: experience.companyName || "",
                jobTitle: experience.jobTitle || "",
                employmentType: experience.employmentType || "",
                location: experience.location || "",
                locationType: experience.locationType || "",
                startDate: experience.startDate ? experience.startDate.split("T")[0] : "",
                endDate: experience.endDate ? experience.endDate.split("T")[0] : "",
                isCurrentWorking: experience.isCurrentWorking || false,
                isEnded: experience.isEnded || false,
                description: experience.description || "",
                skillIds: experience.skillIds || [],
            });
        } else {
            setFormData({
                companyName: "",
                jobTitle: "",
                employmentType: "",
                location: "",
                locationType: "",
                startDate: "",
                endDate: "",
                isCurrentWorking: false,
                isEnded: false,
                description: "",
                skillIds: [],
            });
        }
        setErrors({});
    }, [experience, open]);

    const validate = () => {
        const newErrors = {};
        if (!formData.jobTitle) newErrors.jobTitle = "Job title is required";
        if (!formData.companyName) newErrors.companyName = "Company is required";
        if (!formData.startDate) newErrors.startDate = "Start date is required";

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (formData.startDate && new Date(formData.startDate) > today) {
            newErrors.startDate = "Start date cannot be in the future";
        }

        if (!formData.isCurrentWorking && formData.endDate) {
            const endDate = new Date(formData.endDate);
            if (endDate > today) {
                newErrors.endDate = "End date cannot be in the future";
            }
            if (formData.startDate && new Date(formData.startDate) > endDate) {
                newErrors.endDate = "End date must be after start date";
            }
        }

        // Description word count validation
        const wordCount = String(formData.description || "");

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        // If company is new and callback provided, create it first
        const name = (formData.companyName || "").trim();
        const exists = (allCompanies || []).some((c) => {
            const v = typeof c === "string" ? c : c.name || c.companyName || "";
            return v.toLowerCase() === name.toLowerCase();
        });
        try {
            if (!exists && name && typeof onCreateCompany === "function") {
                await onCreateCompany(name);
            }
        } catch (err) {
            console.warn("Failed to create company", err);
        }

        const payload = experience?.id ? { ...formData, id: experience.id } : formData;
        await onSave(payload);
    };

    const handleSkillChange = (event, newValue) => {
        setFormData({ ...formData, skillIds: newValue.map((s) => s.id) });
    };

    const handleDescriptionChange = (e) => {
        const text = e.target.value || "";
        const words = text.trim().split(/\s+/).filter(Boolean);
        if (words.length > MAX_DESCRIPTION_WORDS) {
            const truncated = words.slice(0, MAX_DESCRIPTION_WORDS).join(" ");
            setFormData({ ...formData, description: truncated });
        } else {
            setFormData({ ...formData, description: text });
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>
                {experience ? "Edit work experience" : "Add Experience"}
            </DialogTitle>
            {experience && (
                <Box sx={{ px: 3, pb: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <CompanyLogo name={formData.companyName || ""} size={28} />
                            <Box sx={{ minWidth: 120 }}>
                                <strong style={{ fontSize: 13 }}>{formData.companyName || "No company"}</strong>
                            </Box>
                        </Box>
                        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", ml: 1 }}>
                            {(allSkills || [])
                                .filter((s) => formData.skillIds?.includes(s.id))
                                .slice(0, 6)
                                .map((s) => (
                                    <Chip
                                        key={s.id}
                                        size="small"
                                        label={s.name}
                                        avatar={
                                            s.iconUrl ? (
                                                <Avatar src={s.iconUrl} alt={s.name} />
                                            ) : (
                                                <Avatar>{(s.name || "")[0]?.toUpperCase()}</Avatar>
                                            )
                                        }
                                    />
                                ))}
                        </Box>
                    </Stack>
                </Box>
            )}
            <DialogContent dividers>
                <Stack spacing={2.5} sx={{ mt: 1 }}>
                    <TextField
                        label="Job title"
                        placeholder="e.g. Retail Sales Manager"
                        fullWidth
                        required
                        value={formData.jobTitle}
                        onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                        error={!!errors.jobTitle}
                        helperText={errors.jobTitle}
                    />

                    <FormControl fullWidth>
                        <InputLabel>Employment type</InputLabel>
                        <FormSelect
                            value={formData.employmentType}
                            label="Employment type"
                            onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                        >
                            <MenuItem value="">Please select</MenuItem>
                            {EMPLOYMENT_TYPES.map((type) => (
                                <MenuItem key={type} value={type}>
                                    {type}
                                </MenuItem>
                            ))}
                        </FormSelect>
                    </FormControl>

                    <Autocomplete
                        freeSolo
                        options={allCompanies || []}
                        getOptionLabel={(option) =>
                            typeof option === "string" ? option : option.name || option.companyName || ""
                        }
                        inputValue={formData.companyName}
                        onInputChange={(e, val) => setFormData({ ...formData, companyName: val })}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Company or organization"
                                placeholder="e.g. Microsoft"
                                required
                                error={!!errors.companyName}
                                helperText={errors.companyName}
                                fullWidth
                            />
                        )}
                    />

                    <Box>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={formData.isCurrentWorking}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setFormData({
                                            ...formData,
                                            isCurrentWorking: checked,
                                            isEnded: !checked,
                                            endDate: checked ? "" : formData.endDate,
                                        });
                                    }}
                                />
                            }
                            label="I currently work in this role"
                            sx={{ "& .MuiFormControlLabel-label": { fontSize: "0.95rem", fontWeight: 500 } }}
                        />
                    </Box>

                    <Stack direction="row" spacing={2}>
                        <TextField
                            label="Start date"
                            type="date"
                            fullWidth
                            required
                            InputLabelProps={{ shrink: true }}
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            error={!!errors.startDate}
                            helperText={errors.startDate}
                        />
                        <TextField
                            label="End date"
                            type="date"
                            fullWidth
                            disabled={formData.isCurrentWorking}
                            InputLabelProps={{ shrink: true }}
                            value={formData.isCurrentWorking ? "" : formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            error={!!errors.endDate}
                            helperText={errors.endDate}
                        />
                    </Stack>

                    <TextField
                        label="Location"
                        placeholder="e.g. London, United Kingdom"
                        fullWidth
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />

                    <FormControl fullWidth>
                        <InputLabel>Location type</InputLabel>
                        <FormSelect
                            value={formData.locationType}
                            label="Location type"
                            onChange={(e) => setFormData({ ...formData, locationType: e.target.value })}
                        >
                            <MenuItem value="">Please select</MenuItem>
                            {LOCATION_TYPES.map((type) => (
                                <MenuItem key={type} value={type}>
                                    {type}
                                </MenuItem>
                            ))}
                        </FormSelect>
                        <FormHelperText>Select the location type (e.g. Remote)</FormHelperText>
                    </FormControl>

                    <Autocomplete
                        multiple
                        options={allSkills || []}
                        getOptionLabel={(option) => option.name || ""}
                        value={(allSkills || []).filter((s) => formData.skillIds.includes(s.id))}
                        onChange={handleSkillChange}
                        renderInput={(params) => (
                            <TextField {...params} label="Skills" placeholder="Select matching skills" />
                        )}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                    />

                    <TextField
                        label="Description"
                        multiline
                        rows={4}
                        fullWidth
                        value={formData.description}
                        onChange={handleDescriptionChange}
                        error={!!errors.description}
                        helperText={
                            errors.description
                                ? errors.description
                                : `${
                                      String(formData.description || "")
                                          .trim()
                                          .split(/\s+/)
                                          .filter(Boolean).length
                                  }/${MAX_DESCRIPTION_WORDS} words`
                        }
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
                <Box>
                    {experience?.id && (
                        <SecondaryButton
                            onClick={() => onDelete?.(experience)}
                            sx={{
                                color: "error.main",
                                borderColor: "error.main",
                                "&:hover": { borderColor: "error.dark", color: "error.dark" },
                            }}
                        >
                            Delete
                        </SecondaryButton>
                    )}
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
                    <PrimaryButton onClick={handleSave}>Save</PrimaryButton>
                </Box>
            </DialogActions>
        </Dialog>
    );
};

export default WorkExperienceModal;
