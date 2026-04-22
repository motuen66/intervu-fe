import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Alert } from '@mui/material';
import { PrimaryButton } from "../../../../common/components/buttons";
import { FormTextField } from "../../../../common/components";
import { callApi } from '../../../../common/utils/apiConnector';
import { METHOD } from '../../../../common/constants/api';
import { authEndPoints } from '../../services/authApi';
import styles from './ForgotPassword.module.css';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const { success, message } = await callApi({
                method: METHOD.POST,
                endpoint: authEndPoints.FORGOT_PASSWORD_API,
                arg: { email },
                displaySuccessMessage: false,
                alertErrorMessage: false
            });

            if (success) {
                setSuccess(true);
            } else {
                setError(message || 'Failed to send reset link. Please try again.');
            }
        } catch (err) {
            setError(err.message || 'An unexpected error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleBackToLogin = () => {
        navigate('/login');
    };

    return (
        <div className={styles.container}>
            <div className={styles.box}>
                <div className={styles.header}>
                    <Typography variant="h4" component="h1" style={{ fontWeight: 700, color: '#2a2a3e', marginBottom: '8px' }}>
                        Forgot Password?
                    </Typography>
                    <Typography variant="body2" style={{ color: 'rgba(0,0,0,0.6)' }}>
                        Enter your email address and we'll send you a link to reset your password.
                    </Typography>
                </div>

                {!success ? (
                    <form onSubmit={handleSubmit} className={styles.form}>
                        {error && (
                            <Alert severity="error" style={{ marginBottom: '16px', color: '#d32f2f' }}>
                                {error}
                            </Alert>
                        )}

                        <FormTextField
                            fullWidth
                            label="Email Address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            sx={{ mb: 2.5 }}
                        />

                        <div style={{ marginBottom: '16px' }}>
                            <PrimaryButton
                                fullWidth
                                type="submit"
                                loading={false}
                                disabled={submitting}
                                size="md"
                            >
                                Send Reset Link
                            </PrimaryButton>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <Typography
                                onClick={handleBackToLogin}
                                style={{
                                    fontSize: '14px',
                                    color: '#4F46E5',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                                sx={{
                                    '&:hover': {
                                        textDecoration: 'underline'
                                    }
                                }}
                            >
                                Back to Login
                            </Typography>
                        </div>
                    </form>
                ) : (
                    <div className={styles.successMessage}>
                        <Alert severity="success" style={{ marginBottom: '16px', color: '#388e3c' }}>
                            If an account exists with that email, you will receive a password reset link shortly.
                        </Alert>
                        <Typography variant="body2" style={{ color: 'rgba(0,0,0,0.6)', marginBottom: '20px' }}>
                            Please check your email inbox and spam folder.
                        </Typography>
                        <PrimaryButton
                            fullWidth
                            onClick={handleBackToLogin}
                            size="md"
                        >
                            Back to Login
                        </PrimaryButton>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ForgotPassword;
