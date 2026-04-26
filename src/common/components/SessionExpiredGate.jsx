import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography } from "@mui/material";
import { Clock, LogIn } from "lucide-react";
import { PrimaryButton } from "./buttons";
import AppText from "./AppText";
import SectionHeading from "./SectionHeading";

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
            <DialogTitle id="session-expired-title" component="div" sx={{ color: '#0F172A' }}>
                <SectionHeading
                    title="Session Expired"
                    icon={
                        <Box sx={{ p: 1, borderRadius: '10px', backgroundColor: 'rgba(79, 70, 229, 0.1)', display: 'flex' }}>
                            <Clock size={20} color="#4F46E5" />
                        </Box>
                    }
                    disableGutters
                    as="h2"
                />
            </DialogTitle>
            <DialogContent>
                <AppText id="session-expired-description" variant="muted" sx={{ color: '#64748B', lineHeight: 1.6 }}>
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
                </AppText>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 1 }}>
                <PrimaryButton
                    onClick={() => {
                        localStorage.clear();
                        navigate("/login");
                    }}
                    fullWidth
                    startIcon={<LogIn size={18} />}
                >
                    Back to Login Now
                </PrimaryButton>
            </DialogActions>
        </Dialog>
    );
};

export default SessionExpiredGate;
