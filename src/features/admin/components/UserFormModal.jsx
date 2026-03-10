import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
    MenuItem,
    Box,
    IconButton,
    InputAdornment,
    Alert,
    Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { PrimaryButton, SecondaryButton } from '../../../common/components/buttons';

const USER_ROLES = [
    { value: 0, label: 'Candidate' },
    { value: 1, label: 'Coach' },
    { value: 2, label: 'Admin' },
];

const roleNumberToText = {
    0: 'Candidate',
    1: 'Coach',
    2: 'Admin'
};

const roleTextToNumber = {
    'Candidate': 0,
    'Coach': 1,
    'Admin': 2
};

export default function UserFormModal({ open, onClose, onSubmit, user, mode = 'create' }) {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        role: 0,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState('');

    useEffect(() => {
        if (mode === 'edit' && user) {
            setFormData({
                fullName: user.fullName || '',
                email: user.email || '',
                phoneNumber: user.phoneNumber || '',
                password: '', // Không hiển thị password cũ
                role: typeof user.role === 'number' ? user.role : roleTextToNumber[user.role] || 0,
            });
        } else if (mode === 'create') {
            setFormData({
                fullName: '',
                email: '',
                phoneNumber: '',
                password: '',
                role: 0,
            });
        }
        setErrors({});
        setSubmitError('');
    }, [user, mode, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let finalValue = value;

        // Convert role to number
        if (name === 'role') {
            finalValue = parseInt(value, 10);
        }

        setFormData(prev => ({
            ...prev,
            [name]: finalValue
        }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
        // Clear submit error
        if (submitError) {
            setSubmitError('');
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Full name is required.';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address.';
        }

        if (!formData.password.trim()) {
            newErrors.password = 'Password is required.';
        } else if (formData.password && formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters.';
        }

        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = 'Phone number is required.';
        } else if (!/^[0-9+\-\s]{8,15}$/.test(formData.phoneNumber.trim())) {
            newErrors.phoneNumber = 'Please enter a valid phone number.';
        }

        if (formData.role === '' || formData.role === null) {
            newErrors.role = 'Role is required.';
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
            fullName: '',
            email: '',
            phoneNumber: '',
            password: '',
            role: 'CANDIDATE',
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
                    background: 'rgba(255,255,255,0.98)',
                }
            }}
        >
            <DialogTitle sx={{
                fontWeight: 700,
                pb: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#111827' }}>
                        {mode === 'create' ? 'Create user' : 'Edit user'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: '#6b7280', mt: 0.5 }}>
                        {mode === 'create' ? 'Add a new account to the system.' : 'Update user profile details.'}
                    </Typography>
                </Box>
                <IconButton
                    onClick={handleClose}
                    size="small"
                    sx={{
                        color: '#6b7280',
                        '&:hover': { background: 'rgba(15,23,42,0.06)' }
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent sx={{ pt: 3 }}>
                    <Grid container spacing={2.5} direction="column">
                        {submitError && (
                            <Grid item xs={12} sx={{ width: '100%' }}>
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {submitError}
                                </Alert>
                            </Grid>
                        )}
                        <Grid item xs={12} sx={{ width: '100%' }}>
                            <TextField
                                fullWidth
                                label="Full name"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                error={!!errors.fullName}
                                helperText={errors.fullName}
                                required
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '&:hover fieldset': {
                                            borderColor: '#4F46E5',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#4F46E5',
                                        },
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                        color: '#4F46E5',
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sx={{ width: '100%' }}>
                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                error={!!errors.email}
                                helperText={errors.email}
                                required
                                disabled={mode === 'edit'}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '&:hover fieldset': {
                                            borderColor: '#4F46E5',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#4F46E5',
                                        },
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                        color: '#4F46E5',
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sx={{ width: '100%' }}>
                            <TextField
                                fullWidth
                                label="Phone number"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                error={!!errors.phoneNumber}
                                helperText={errors.phoneNumber}
                                required
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '&:hover fieldset': {
                                            borderColor: '#4F46E5',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#4F46E5',
                                        },
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                        color: '#4F46E5',
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sx={{ width: '100%' }}>
                            <TextField
                                fullWidth
                                label="Password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={handleChange}
                                error={!!errors.password}
                                helperText={errors.password}
                                required
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
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '&:hover fieldset': {
                                            borderColor: '#4F46E5',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#4F46E5',
                                        },
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                        color: '#4F46E5',
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sx={{ width: '100%' }}>
                            <TextField
                                fullWidth
                                select
                                label="Role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                error={!!errors.role}
                                helperText={errors.role}
                                required
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '&:hover fieldset': {
                                            borderColor: '#4F46E5',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#4F46E5',
                                        },
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                        color: '#4F46E5',
                                    },
                                }}
                            >
                                {USER_ROLES.map((role) => (
                                    <MenuItem key={role.value} value={role.value}>
                                        {role.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
                    <SecondaryButton onClick={handleClose}>
                        Cancel
                    </SecondaryButton>
                    <PrimaryButton type="submit" sx={{ px: 4 }}>
                        {mode === 'create' ? 'Create user' : 'Save changes'}
                    </PrimaryButton>
                </DialogActions>
            </form>
        </Dialog>
    );
}
