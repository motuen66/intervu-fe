import { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    MenuItem,
    Box,
    IconButton,
    InputAdornment,
    Alert,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { PrimaryButton, SecondaryButton } from "../../../common/components/buttons";
import FormTextField from "../../../common/components/form/FormTextField";
import FormSelect from "../../../common/components/form/FormSelect";
import { FormControl, FormHelperText, InputLabel } from "@mui/material";

const USER_ROLES = [
    { value: 0, label: "Candidate" },
    { value: 1, label: "Coach" },
    { value: 2, label: "Admin" },
];

const roleNumberToText = {
    0: "Candidate",
    1: "Coach",
    2: "Admin",
};

const roleTextToNumber = {
    Candidate: 0,
    Coach: 1,
    Admin: 2,
};

export default function UserFormModal({ open, onClose, onSubmit, user, mode = "create" }) {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phoneNumber: "",
        password: "",
        role: 0,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState("");

    useEffect(() => {
        if (mode === "edit" && user) {
            setFormData({
                fullName: user.fullName || "",
                email: user.email || "",
                phoneNumber: user.phoneNumber || "",
                password: "", // Không hiển thị password cũ
                role: typeof user.role === "number" ? user.role : roleTextToNumber[user.role] || 0,
            });
        } else if (mode === "create") {
            setFormData({
                fullName: "",
                email: "",
                phoneNumber: "",
                password: "",
                role: 0,
            });
        }
        setErrors({});
        setSubmitError("");
    }, [user, mode, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let finalValue = value;

        // Convert role to number
        if (name === "role") {
            finalValue = parseInt(value, 10);
        }

        setFormData((prev) => ({
            ...prev,
            [name]: finalValue,
        }));
        // Clear error when user types
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
        // Clear submit error
        if (submitError) {
            setSubmitError("");
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = "Full name is required.";
        }

        if (!formData.email.trim()) {
            newErrors.email = "Email is required.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Please enter a valid email address.";
        }

        if (mode === 'create' && !formData.password.trim()) {
            newErrors.password = 'Password is required.';
        } else if (formData.password && formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters.";
        }

        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = "Phone number is required.";
        } else if (!/^[0-9+\-\s]{8,15}$/.test(formData.phoneNumber.trim())) {
            newErrors.phoneNumber = "Please enter a valid phone number.";
        }

        if (formData.role === "" || formData.role === null) {
            newErrors.role = "Role is required.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const dataToSubmit = { ...formData };

        onSubmit(dataToSubmit, (error) => {
            if (error) {
                setSubmitError(error);
            }
        });
    };

    const handleClose = () => {
        setFormData({
            fullName: "",
            email: "",
            phoneNumber: "",
            password: "",
            role: "CANDIDATE",
        });
        setErrors({});
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    background: "rgba(255,255,255,0.98)",
                },
            }}
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
                        {mode === "create" ? "Create user" : "Edit user"}
                    </Typography>
                    <Typography sx={{ fontSize: "0.85rem", color: "#6b7280", mt: 0.5 }}>
                        {mode === "create" ? "Add a new account to the system." : "Update user profile details."}
                    </Typography>
                </Box>
                <IconButton
                    onClick={handleClose}
                    size="small"
                    sx={{
                        color: "#6b7280",
                        "&:hover": { background: "rgba(15,23,42,0.06)" },
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent sx={{ pt: 3 }}>
                    <Grid container spacing={2.5} direction="column">
                        {submitError && (
                            <Grid item xs={12} sx={{ width: "100%" }}>
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {submitError}
                                </Alert>
                            </Grid>
                        )}
                        <Grid item xs={12} sx={{ width: "100%" }}>
                            <FormTextField
                                fullWidth
                                label="Full name"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                error={!!errors.fullName}
                                helperText={errors.fullName}
                                required
                                inputProps={{ maxLength: 60 }}
                            />
                        </Grid>

                        <Grid item xs={12} sx={{ width: "100%" }}>
                            <FormTextField
                                fullWidth
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                error={!!errors.email}
                                helperText={errors.email}
                                required
                                inputProps={{ maxLength: 100 }}
                                disabled={mode === "edit"}
                            />
                        </Grid>

                        <Grid item xs={12} sx={{ width: "100%" }}>
                            <FormTextField
                                fullWidth
                                label="Phone number"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                error={!!errors.phoneNumber}
                                helperText={errors.phoneNumber}
                                required
                                inputProps={{ maxLength: 20 }}
                            />
                        </Grid>

                        <Grid item xs={12} sx={{ width: "100%" }}>
                            <FormTextField
                                fullWidth
                                label={mode === 'edit' ? "Password (leave blank to keep current)" : "Password"}
                                name="password"
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={handleChange}
                                error={!!errors.password}
                                helperText={errors.password}
                                required={mode === 'create'}
                                inputProps={{ maxLength: 50 }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                                size="small"
                                            >
                                                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sx={{ width: "100%" }}>
                            <FormControl fullWidth error={!!errors.role} required>
                                <InputLabel id="role-label">Role</InputLabel>
                                <FormSelect
                                    labelId="role-label"
                                    label="Role"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                >
                                    {USER_ROLES.map((role) => (
                                        <MenuItem key={role.value} value={role.value}>
                                            {role.label}
                                        </MenuItem>
                                    ))}
                                </FormSelect>
                                {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
                    <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                    <PrimaryButton type="submit">
                        {mode === "create" ? "Create user" : "Save changes"}
                    </PrimaryButton>
                </DialogActions>
            </form>
        </Dialog>
    );
}
