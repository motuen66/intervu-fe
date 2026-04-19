import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Typography, Alert } from '@mui/material';
import { Button, InputField } from "../../../../common/design-system";
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
                    <Typography variant="h4" component="h1" style={{ fontWeight: 700, color: 'var(--claude-color-text-near-black)', marginBottom: '8px' }}>
                        Forgot Password?
                    </Typography>
                    <Typography variant="body2" style={{ color: 'rgba(0,0,0,0.6)' }}>
                        Enter your email address and we'll send you a link to reset your password.
                    </Typography>
                </div>

                {!success ? (
                    <form onSubmit={handleSubmit} className={styles.form}>
                        {error && (
                            <Alert severity="error" style={{ marginBottom: '16px', color: 'var(--claude-color-semantic-error)' }}>
                                {error}
                            </Alert>
                        )}

                        <InputField
                            label="Email Address"
                            type="email"
                            placeholder="Enter your email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{ marginBottom: '20px' }}
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            disabled={submitting}
                            style={{ width: '100%', marginBottom: '16px' }}
                        >
                            Send Reset Link
                        </Button>

                        <div style={{ textAlign: 'center' }}>
                            <Link
                                to="/login"
                                style={{
                                    fontSize: '14px',
                                    color: 'var(--claude-color-semantic-focus-blue)',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    textDecoration: 'none',
                                    position: 'relative',
                                    zIndex: 2,
                                }}
                            >
                                Back to Login
                            </Link>
                        </div>
                    </form>
                ) : (
                    <div className={styles.successMessage}>
                        <Alert severity="success" style={{ marginBottom: '16px', color: 'var(--claude-color-semantic-success)' }}>
                            If an account exists with that email, you will receive a password reset link shortly.
                        </Alert>
                        <Typography variant="body2" style={{ color: 'rgba(0,0,0,0.6)', marginBottom: '20px' }}>
                            Please check your email inbox and spam folder.
                        </Typography>
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={handleBackToLogin}
                            style={{ width: '100%' }}
                        >
                            Back to Login
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ForgotPassword;
