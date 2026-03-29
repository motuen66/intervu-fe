import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Box, Typography } from "@mui/material";
import { Clock, LogIn } from "lucide-react";

const SessionExpiredGate = () => {
    const [countdown, setCountdown] = useState(5);
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    localStorage.clear();
                    navigate("/login");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [navigate]);

    return (
        <Dialog
            open={true}
            aria-labelledby="session-expired-title"
            aria-describedby="session-expired-description"
            disableEscapeKeyDown
            PaperProps={{
                sx: {
                    borderRadius: '16px',
                    padding: '12px',
                    maxWidth: '420px',
                    boxShadow: '0 24px 48px rgba(15, 23, 42, 0.12)',
                    zIndex: 2147483647,
                }
            }}
            slotProps={{
                backdrop: {
                    sx: {
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(3px)',
                        zIndex: 2147483646
                    }
                }
            }}
            sx={{ zIndex: 2147483645 }}
        >
            <DialogTitle id="session-expired-title" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#0F172A', fontWeight: 700 }}>
                <Box sx={{ p: 1, borderRadius: '10px', backgroundColor: 'rgba(79, 70, 229, 0.1)', display: 'flex' }}>
                    <Clock size={20} color="#4F46E5" />
                </Box>
                Session Expired
            </DialogTitle>
            <DialogContent>
                <DialogContentText id="session-expired-description" sx={{ color: '#64748B', lineHeight: 1.6 }}>
                    Your session has expired for security reasons. You will be automatically redirected to the login page in{" "}
                    <Typography 
                        component="span" 
                        sx={{ 
                            fontWeight: 700, 
                            color: '#4F46E5', 
                            fontSize: '1.2rem',
                            mx: 0.5,
                            display: 'inline-block',
                            minWidth: '20px',
                            textAlign: 'center'
                        }}
                    >
                        {countdown}
                    </Typography>{" "}
                    seconds.
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 1 }}>
                <Button 
                    onClick={() => {
                        localStorage.clear();
                        navigate("/login");
                    }} 
                    variant="contained" 
                    fullWidth
                    startIcon={<LogIn size={18} />}
                    sx={{ 
                        borderRadius: '10px', 
                        textTransform: 'none', 
                        fontWeight: 600,
                        py: 1,
                        backgroundColor: '#0F172A',
                        '&:hover': { backgroundColor: '#1e293b' }
                    }}
                >
                    Back to Login Now
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SessionExpiredGate;
