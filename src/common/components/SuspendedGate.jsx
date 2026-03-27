import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";
import { callApi } from "../utils/apiConnector";
import { METHOD } from "../constants/api";
import { authEndPoints } from "../../features/auth/services/authApi";
import { setUserData, setToken } from "../store/authSlice";

const SuspendedGate = ({ children }) => {
    const { userData } = useSelector((state) => state.auth || {});
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await callApi({
                method: METHOD.POST,
                endpoint: authEndPoints.LOGOUT_API,
            });
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            localStorage.clear();
            dispatch(setUserData(null));
            dispatch(setToken(null));
            navigate("/login");
        }
    };

    const isSuspended = userData?.status === 1 || userData?.status === 'Inactive';

    if (!isSuspended) {
        return children || null;
    }

    return (
        <>
            {children}
            <Dialog
                open={true}
                aria-labelledby="suspended-dialog-title"
                aria-describedby="suspended-dialog-description"
                disableEscapeKeyDown
                onClose={() => {}} // Prevent closing
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        padding: '12px',
                        maxWidth: '450px',
                        boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
                        position: 'relative',
                        zIndex: 1000001,
                        pointerEvents: 'auto'
                    }
                }}
                slotProps={{
                    backdrop: {
                        sx: {
                            backgroundColor: 'rgba(0, 0, 0, 0.75)',
                            backdropFilter: 'blur(3px)',
                            zIndex: 1000000
                        }
                    }
                }}
                sx={{ zIndex: 1000000 }}
            >
                <DialogTitle id="suspended-dialog-title" sx={{ fontWeight: 700, pb: 1, color: '#ef4444' }}>
                    Account Suspended
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="suspended-dialog-description" sx={{ color: '#1e293b', fontSize: '1rem', lineHeight: 1.6 }}>
                        Your account has been suspended by the administrator. You are currently restricted from performing any actions on the platform. 
                        Please contact us at <strong>admin@intervu.com</strong> for assistance.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, pt: 1, justifyContent: 'center' }}>
                    <Button 
                        onClick={handleLogout} 
                        variant="contained" 
                        color="error"
                        fullWidth
                        sx={{ 
                            borderRadius: '10px', 
                            textTransform: 'none', 
                            fontWeight: 600,
                            py: 1,
                            fontSize: '1rem',
                            backgroundColor: '#ef4444',
                            '&:hover': {
                                backgroundColor: '#dc2626'
                            }
                        }}
                    >
                        Log out
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default SuspendedGate;
