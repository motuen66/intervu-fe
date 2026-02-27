import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { TextField, Button, Typography, Alert } from '@mui/material';
import { callApi } from '../../../../common/utils/apiConnector';
import { METHOD } from '../../../../common/constants/api';
import { authEndPoints } from '../../services/authApi';
import styles from './ForgotPassword.module.css';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const loading = useSelector((state) => state.auth.loading);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

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

                        <TextField
                            fullWidth
                            label="Email Address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            variant="outlined"
                            style={{ marginBottom: '20px' }}
                            InputProps={{
                                style: {
                                    borderRadius: '8px'
                                }
                            }}
                        />

                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            style={{
                                padding: '12px',
                                background: loading ? '#ccc' : 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
                                color: '#fff',
                                fontSize: '15px',
                                fontWeight: 600,
                                borderRadius: '8px',
                                textTransform: 'none',
                                boxShadow: '0 4px 14px rgba(91, 95, 199, 0.4)',
                                transition: 'all 0.3s ease',
                                marginBottom: '16px'
                            }}
                            sx={{
                                '&:hover': {
                                    background: loading ? '#ccc' : '#4A4EB8',
                                    boxShadow: '0 6px 20px rgba(91, 95, 199, 0.6)',
                                    transform: 'translateY(-2px)'
                                }
                            }}
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </Button>

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
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleBackToLogin}
                            style={{
                                padding: '12px',
                                background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
                                color: '#fff',
                                fontSize: '15px',
                                fontWeight: 600,
                                borderRadius: '8px',
                                textTransform: 'none',
                                boxShadow: '0 4px 14px rgba(91, 95, 199, 0.4)',
                                transition: 'all 0.3s ease'
                            }}
                            sx={{
                                '&:hover': {
                                    background: '#4A4EB8',
                                    boxShadow: '0 6px 20px rgba(91, 95, 199, 0.6)',
                                    transform: 'translateY(-2px)'
                                }
                            }}
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
