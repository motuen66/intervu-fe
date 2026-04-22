import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Alert, Box, Typography } from "@mui/material";
import { callApi } from '../../../../common/utils/apiConnector';
import { METHOD } from '../../../../common/constants/api';
import { authEndPoints } from '../../services/authApi';
import { FormTextField } from "../../../../common/components";
import { PrimaryButton } from "../../../../common/components/buttons";
import styles from './ResetPassword.module.css';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [token, setToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [tokenValid, setTokenValid] = useState(null); // null = validating, true = valid, false = invalid
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const tokenFromURL = searchParams.get("token");
        if (tokenFromURL) {
            setToken(tokenFromURL);
            validateToken(tokenFromURL);
        } else {
            setMessage("Invalid reset link. Token is missing.");
            setTokenValid(false);
        }
    }, [searchParams]);

    const validateToken = async (tokenValue) => {
        try {
            const { success, message: responseMessage } = await callApi({
                method: METHOD.GET,
                endpoint: `${authEndPoints.VALIDATE_RESET_TOKEN_API}/${tokenValue}`,
                displaySuccessMessage: false,
                alertErrorMessage: false
            });
            
            if (success) {
                setTokenValid(true);
                setMessage("Token is valid. You can now reset your password.");
            } else {
                setTokenValid(false);
                setMessage(responseMessage || "The reset link is invalid or has expired. Please request a new one.");
            }
        } catch (error) {
            setTokenValid(false);
            setMessage(error.message || "An error occurred while validating the token. Please try again.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            setMessage("Passwords do not match. Please ensure both fields are identical.");
            return;
        }

        if (newPassword.length < 6) {
            setMessage("Password must be at least 6 characters long.");
            return;
        }

        setMessage("");
        setSubmitting(true);

        try {
            const { success, message: responseMessage } = await callApi({
                method: METHOD.POST,
                endpoint: authEndPoints.RESET_PASSWORD_API,
                arg: {
                    token: token,
                    newPassword: newPassword,
                    confirmPassword: confirmPassword
                },
                displaySuccessMessage: false,
                alertErrorMessage: false
            });

            if (success) {
                setMessage("Your password has been successfully reset. Redirecting to login...");
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setMessage(responseMessage || "Failed to reset password. Please try again.");
            }
        } catch (error) {
            setMessage(error.message || "An unexpected error occurred. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    // Show loading state while validating token
    if (tokenValid === null) {
        return (
            <div className={styles.container}>
                <Typography variant="h5">Validating reset link...</Typography>
            </div>
        );
    }

    // Show error if token is invalid
    if (tokenValid === false) {
        return (
            <div className={styles.container}>
                <Typography variant="h5">Reset Link Invalid</Typography>
                <p className={styles.errorMessage}>{message}</p>
                <PrimaryButton className={styles.button} onClick={() => navigate('/forgot-password')}>
                    Request New Link
                </PrimaryButton>
            </div>
        );
    }

    // Show reset password form
    return (
        <div className={styles.container}>
            <Typography variant="h5" sx={{ mb: 2 }}>Reset Your Password</Typography>
            
            {message && (
                <Alert severity={message.includes('successfully') ? "success" : "error"} sx={{ mb: 2 }}>
                    {message}
                </Alert>
            )}

            <form onSubmit={handleSubmit}>
                <Box sx={{ mb: 2 }}>
                    <FormTextField
                        fullWidth
                        label="New Password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        disabled={submitting}
                        inputProps={{ minLength: 6 }}
                        placeholder="Enter new password"
                    />
                </Box>

                <Box sx={{ mb: 2 }}>
                    <FormTextField
                        fullWidth
                        label="Confirm Password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={submitting}
                        inputProps={{ minLength: 6 }}
                        placeholder="Confirm new password"
                    />
                </Box>

                <PrimaryButton type="submit" disabled={submitting} className={styles.button}>
                    {submitting ? 'Resetting...' : 'Reset Password'}
                </PrimaryButton>
            </form>
        </div>
    );
};

export default ResetPassword;
