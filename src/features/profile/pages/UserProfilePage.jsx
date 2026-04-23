import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
    Box,
    Paper,
    Avatar,
    IconButton,
    Grid,
    Divider,
    CircularProgress,
    Alert
} from '@mui/material';
// import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
// import StarIcon from '@mui/icons-material/Star';
import { callApi } from '../../../common/utils/apiConnector';
import { METHOD } from '../../../common/constants/api';
import { profileEndPoints } from '../services/profileApi';
import toast from 'react-hot-toast';
import { AppText, FormTextField, PageHeader, SectionHeading } from '../../../common/components';
import { PrimaryButton, SecondaryButton } from '../../../common/components/buttons';
// import UploadCv from "../components/UploadCv.jsx";

export default function UserProfilePage() {
    const [loading, setLoading] = useState(true);
    // const [uploading, setUploading] = useState(false);
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

    // const handleEditProfile = () => {
    //     setIsEditingProfile(true);
    // };

    // const handleSaveProfile = async () => {
    //     // Combine firstName and lastName into fullName for backend
    //     const updateData = {
    //         fullName: `${editedProfile.firstName} ${editedProfile.lastName}`.trim()
    //     };

    //     const response = await callApi({
    //         method: METHOD.PUT,
    //         endpoint: profileEndPoints.UPDATE_PROFILE(userId),
    //         arg: updateData,
    //         displaySuccessMessage: true,
    //     });

    //     if (response?.success) {
    //         setProfile(prev => ({
    //             ...prev,
    //             firstName: editedProfile.firstName,
    //             lastName: editedProfile.lastName
    //         }));
    //         setIsEditingProfile(false);
    //     }
    // };

    // const handleCancelEdit = () => {
    //     setEditedProfile({
    //         firstName: profile.firstName,
    //         lastName: profile.lastName
    //     });
    //     setIsEditingProfile(false);
    // };

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

    // const handleAvatarUpload = async (event) => {
    //     const file = event.target.files[0];
    //     if (!file) return;

    //     // Validate file type
    //     if (!file.type.startsWith('image/')) {
    //         toast.error('Please select an image file');
    //         return;
    //     }

    //     // Validate file size (max 5MB)
    //     if (file.size > 5 * 1024 * 1024) {
    //         toast.error('Image size must be less than 5MB');
    //         return;
    //     }

    //     const formData = new FormData();
    //     formData.append('profilePicture', file);

    //     setUploading(true);

    //     try {
    //         const response = await fetch(profileEndPoints.UPDATE_AVATAR(userId), {
    //             method: 'PUT',
    //             headers: {
    //                 'Authorization': `Bearer ${JSON.parse(localStorage.getItem('token'))}`
    //             },
    //             body: formData
    //         });

    //         const data = await response.json();

    //         if (data.success) {
    //             setProfile(prev => ({
    //                 ...prev,
    //                 profilePictureUrl: data.data.profilePictureUrl
    //             }));
    //             toast.success('Profile picture updated successfully');
    //         } else {
    //             toast.error(data.message || 'Failed to upload image');
    //         }
    //     } catch (error) {
    //         toast.error('Failed to upload image');
    //     } finally {
    //         setUploading(false);
    //     }
    // };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                {/* <CircularProgress /> */}
            </Box>
        );
    }

    return (
        <>

                <Paper sx={{ p: 4, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}></Box>
                    <PageHeader title="Settings" />
                    {/* Email Section */}
                    <Box sx={{ mb: 4 }}>
                        <SectionHeading title="Email" />
                        <AppText variant="muted" sx={{ mb: 2 }}>
                            Your account is connected through Google. Please create a password with Exponent
                            before making email changes.
                        </AppText>
                        <FormTextField
                            fullWidth
                            value={email}
                            disabled
                            sx={{ mb: 2, background: "rgba(0,0,0,0.02)" }}
                        />
                        <SecondaryButton disabled>Update email</SecondaryButton>
                    </Box>

                    <Divider sx={{ my: 4 }} />

                    {/* Password Settings */}
                    <Box sx={{ mb: 4 }}>
                        <SectionHeading title="Password Settings" />
                        <AppText variant="muted" sx={{ mb: 2 }}>
                            Click the button below to change your password.
                        </AppText>
                        <Box sx={{ mb: showPasswordForm ? 3 : 0 }}>
                            <PrimaryButton onClick={() => setShowPasswordForm(!showPasswordForm)}>
                                {showPasswordForm ? "Hide Password Form" : "Change Password"}
                            </PrimaryButton>
                        </Box>

                        {/* Change Password Form */}
                        {showPasswordForm && (
                            <Box sx={{ mt: 3 }}>
                                <FormTextField
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
                                    sx={{ mb: 2 }}
                                />
                                <FormTextField
                                    fullWidth
                                    type="password"
                                    label="New Password"
                                    value={passwordData.newPassword}
                                    onChange={(e) =>
                                        setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                                    }
                                    sx={{ mb: 2 }}
                                />
                                <FormTextField
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
                                    sx={{ mb: 2 }}
                                />
                                <PrimaryButton
                                    onClick={handleChangePassword}
                                    disabled={
                                        !passwordData.currentPassword ||
                                        !passwordData.newPassword ||
                                        !passwordData.confirmPassword
                                    }
                                >
                                    Update Password
                                </PrimaryButton>
                            </Box>
                        )}
                    </Box>

                    <Divider sx={{ my: 4 }} />

                    {/* Notification Settings */}
                    <Box>
                        <SectionHeading title="Notification Settings" />
                        <AppText variant="muted">
                            When would you like to receive an email?
                        </AppText>
                    </Box>
                </Paper>
        </>
    );
}
