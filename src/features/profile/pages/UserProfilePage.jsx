import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
    Box,
    Container,
    Paper,
    Avatar,
    Typography,
    TextField,
    Button,
    IconButton,
    Grid,
    Divider,
    CircularProgress,
    Alert
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import StarIcon from '@mui/icons-material/Star';
import { callApi } from '../../../common/utils/apiConnector';
import { METHOD } from '../../../common/constants/api';
import { profileEndPoints } from '../services/profileApi';
import toast from 'react-hot-toast';
import UploadCv from "../components/UploadCv.jsx";

export default function UserProfilePage() {
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    
    // User data from Redux
    const userData = useSelector(state => state.auth.userData);
    const userId = userData?.id;
    
    console.log('🔍 UserProfilePage - userData:', userData);
    console.log('🔍 UserProfilePage - userId:', userId);
    
    // Profile state
    const [profile, setProfile] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        profilePictureUrl: '',
        averageRating: 0
    });
    
    // Edit mode states
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editedProfile, setEditedProfile] = useState({
        firstName: '',
        lastName: ''
    });
    
    // Password state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    
    // Email state
    const [email, setEmail] = useState('');

    useEffect(() => {
        console.log('🔍 useEffect - userId changed:', userId);
        if (userId) {
            fetchProfile();
        } else {
            console.warn('⚠️ No userId found, skipping profile fetch');
            setLoading(false);
        }
    }, [userId]);

    const fetchProfile = async () => {
        setLoading(true);
        const response = await callApi({
            method: METHOD.GET,
            endpoint: profileEndPoints.GET_PROFILE(userId),
        });
        
        console.log('👤 Profile API Response:', response);
        
        if (response?.success && response.data && Object.keys(response.data).length > 0) {
            console.log('✅ Profile data from API:', response.data);
            
            // Backend may return fullName, so split it into firstName and lastName
            let firstName = response.data.firstName || '';
            let lastName = response.data.lastName || '';
            
            if (!firstName && !lastName && response.data.fullName) {
                const nameParts = response.data.fullName.split(' ');
                firstName = nameParts[0] || '';
                lastName = nameParts.slice(1).join(' ') || '';
            }
            
            setProfile({
                ...response.data,
                firstName,
                lastName
            });
            setEditedProfile({ firstName, lastName });
            setEmail(response.data.email || '');
        } else {
            // Fallback to Redux userData if API returns empty
            console.warn('⚠️ API returned empty data, using Redux userData as fallback');
            const nameParts = (userData?.fullName || '').split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            setProfile({
                firstName,
                lastName,
                username: userData?.username || '',
                email: userData?.email || '',
                profilePictureUrl: '',
                averageRating: 0
            });
            setEditedProfile({ firstName, lastName });
            setEmail(userData?.email || '');
        }
        setLoading(false);
    };

    const handleEditProfile = () => {
        setIsEditingProfile(true);
    };

    const handleSaveProfile = async () => {
        // Combine firstName and lastName into fullName for backend
        const updateData = {
            fullName: `${editedProfile.firstName} ${editedProfile.lastName}`.trim()
        };
        
        const response = await callApi({
            method: METHOD.PUT,
            endpoint: profileEndPoints.UPDATE_PROFILE(userId),
            arg: updateData,
            displaySuccessMessage: true,
        });
        
        if (response?.success) {
            setProfile(prev => ({
                ...prev,
                firstName: editedProfile.firstName,
                lastName: editedProfile.lastName
            }));
            setIsEditingProfile(false);
        }
    };

    const handleCancelEdit = () => {
        setEditedProfile({
            firstName: profile.firstName,
            lastName: profile.lastName
        });
        setIsEditingProfile(false);
    };

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New password and confirm password do not match');
            return;
        }
        
        if (passwordData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        const response = await callApi({
            method: METHOD.PUT,
            endpoint: profileEndPoints.UPDATE_PASSWORD(userId),
            arg: {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            },
            displaySuccessMessage: true,
            alertErrorMessage: true,
        });
        
        if (response?.success) {
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        }
    };

    const handleAvatarUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        const formData = new FormData();
        formData.append('profilePicture', file);

        setUploading(true);
        
        try {
            const response = await fetch(profileEndPoints.UPDATE_AVATAR(userId), {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${JSON.parse(localStorage.getItem('token'))}`
                },
                body: formData
            });

            const data = await response.json();
            
            if (data.success) {
                setProfile(prev => ({
                    ...prev,
                    profilePictureUrl: data.data.profilePictureUrl
                }));
                toast.success('Profile picture updated successfully');
            } else {
                toast.error(data.message || 'Failed to upload image');
            }
        } catch (error) {
            toast.error('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: "100vh", background: "#ffffff", py: 4 }}>
            <Container maxWidth="md">
                <Paper sx={{ p: 4, borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
                    {/* Header with Avatar */}
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                            <Box sx={{ position: "relative" }}>
                                <Avatar
                                    src={profile.profilePictureUrl}
                                    sx={{
                                        width: 120,
                                        height: 120,
                                        fontSize: "48px",
                                        fontWeight: 700,
                                        background: "linear-gradient(135deg, #7B61FF 0%, #B794F6 100%)",
                                        border: "4px solid #fff",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                    }}
                                >
                                    {!profile.profilePictureUrl &&
                                        `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`}
                                </Avatar>
                                <input
                                    accept="image/*"
                                    style={{ display: "none" }}
                                    id="avatar-upload"
                                    type="file"
                                    onChange={handleAvatarUpload}
                                    disabled={uploading}
                                />
                                <label htmlFor="avatar-upload">
                                    <IconButton
                                        component="span"
                                        disabled={uploading}
                                        sx={{
                                            position: "absolute",
                                            bottom: 0,
                                            right: 0,
                                            background: "#7B61FF",
                                            color: "#fff",
                                            "&:hover": {
                                                background: "#6851d9",
                                            },
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                        }}
                                    >
                                        {uploading ? (
                                            <CircularProgress size={20} sx={{ color: "#fff" }} />
                                        ) : (
                                            <PhotoCameraIcon />
                                        )}
                                    </IconButton>
                                </label>
                            </Box>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: "#1a1a2e", mb: 0.5 }}>
                                    {profile.firstName} {profile.lastName}
                                </Typography>
                                <Typography variant="body1" sx={{ color: "rgba(0,0,0,0.6)", mb: 1 }}>
                                    {profile.username}
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <StarIcon sx={{ color: "#fbbf24", fontSize: "20px" }} />
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#fbbf24" }}>
                                        {profile.averageRating?.toFixed(1) || "0.0"}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        {!isEditingProfile && (
                            <Button
                                variant="outlined"
                                onClick={handleEditProfile}
                                sx={{
                                    borderColor: "#7B61FF",
                                    color: "#7B61FF",
                                    "&:hover": {
                                        borderColor: "#6851d9",
                                        background: "rgba(123,97,255,0.05)",
                                    },
                                }}
                            >
                                Edit Profile
                            </Button>
                        )}
                    </Box>

                    {/* Profile Settings Content */}
                    <Box sx={{ mt: 3 }}>
                        <Box>
                            {/* Profile Edit Section */}
                            {isEditingProfile && (
                                <Box sx={{ mb: 4 }}>
                                    <Grid container spacing={2} sx={{ mb: 2 }}>
                                        <Grid item xs={6}>
                                            <TextField
                                                fullWidth
                                                label="First Name"
                                                value={editedProfile.firstName}
                                                onChange={(e) =>
                                                    setEditedProfile((prev) => ({ ...prev, firstName: e.target.value }))
                                                }
                                                variant="outlined"
                                            />
                                        </Grid>
                                        <Grid item xs={6}>
                                            <TextField
                                                fullWidth
                                                label="Last Name"
                                                value={editedProfile.lastName}
                                                onChange={(e) =>
                                                    setEditedProfile((prev) => ({ ...prev, lastName: e.target.value }))
                                                }
                                                variant="outlined"
                                            />
                                        </Grid>
                                    </Grid>

                                    <Box sx={{ display: "flex", gap: 2 }}>
                                        <Button
                                            variant="contained"
                                            onClick={handleSaveProfile}
                                            sx={{
                                                background: "#7B61FF",
                                                "&:hover": {
                                                    background: "#6851d9",
                                                },
                                                textTransform: "none",
                                                px: 4,
                                            }}
                                        >
                                            Save profile
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            onClick={handleCancelEdit}
                                            sx={{
                                                borderColor: "rgba(0,0,0,0.2)",
                                                color: "rgba(0,0,0,0.7)",
                                                textTransform: "none",
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </Box>
                                    <Divider sx={{ my: 4 }} />
                                </Box>
                            )}

                            {/* Email Section */}
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                                    Email
                                </Typography>
                                <Typography variant="body2" sx={{ color: "rgba(0,0,0,0.6)", mb: 2 }}>
                                    Your account is connected through Google. Please create a password with Exponent
                                    before making email changes.
                                </Typography>
                                <TextField
                                    fullWidth
                                    value={email}
                                    disabled
                                    variant="outlined"
                                    sx={{ mb: 2, background: "rgba(0,0,0,0.02)" }}
                                />
                                <Button
                                    variant="outlined"
                                    disabled
                                    sx={{
                                        borderColor: "rgba(0,0,0,0.2)",
                                        color: "rgba(0,0,0,0.4)",
                                        textTransform: "none",
                                    }}
                                >
                                    Update email
                                </Button>
                            </Box>

                            <Divider sx={{ my: 4 }} />

                            <UploadCv/>

                            <Divider sx={{ my: 4 }} />

                            {/* Password Settings */}
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                                    Password Settings
                                </Typography>
                                <Typography variant="body2" sx={{ color: "rgba(0,0,0,0.6)", mb: 2 }}>
                                    Click the button below to change your password.
                                </Typography>
                                <Button
                                    variant="contained"
                                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                                    sx={{
                                        background: "#7B61FF",
                                        "&:hover": {
                                            background: "#6851d9",
                                        },
                                        textTransform: "none",
                                        mb: showPasswordForm ? 3 : 0,
                                    }}
                                >
                                    {showPasswordForm ? "Hide Password Form" : "Change Password"}
                                </Button>

                                {/* Change Password Form */}
                                {showPasswordForm && (
                                    <Box sx={{ mt: 3 }}>
                                        <TextField
                                            fullWidth
                                            type="password"
                                            label="Current Password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) =>
                                                setPasswordData((prev) => ({
                                                    ...prev,
                                                    currentPassword: e.target.value,
                                                }))
                                            }
                                            variant="outlined"
                                            sx={{ mb: 2 }}
                                        />
                                        <TextField
                                            fullWidth
                                            type="password"
                                            label="New Password"
                                            value={passwordData.newPassword}
                                            onChange={(e) =>
                                                setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                                            }
                                            variant="outlined"
                                            sx={{ mb: 2 }}
                                        />
                                        <TextField
                                            fullWidth
                                            type="password"
                                            label="Confirm New Password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) =>
                                                setPasswordData((prev) => ({
                                                    ...prev,
                                                    confirmPassword: e.target.value,
                                                }))
                                            }
                                            variant="outlined"
                                            sx={{ mb: 2 }}
                                        />
                                        <Button
                                            variant="contained"
                                            onClick={handleChangePassword}
                                            disabled={
                                                !passwordData.currentPassword ||
                                                !passwordData.newPassword ||
                                                !passwordData.confirmPassword
                                            }
                                            sx={{
                                                background: "#7B61FF",
                                                "&:hover": {
                                                    background: "#6851d9",
                                                },
                                                textTransform: "none",
                                            }}
                                        >
                                            Update Password
                                        </Button>
                                    </Box>
                                )}
                            </Box>

                            <Divider sx={{ my: 4 }} />

                            {/* Notification Settings */}
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                                    Notification Settings
                                </Typography>
                                <Typography variant="body2" sx={{ color: "rgba(0,0,0,0.6)" }}>
                                    When would you like to receive an email?
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}
