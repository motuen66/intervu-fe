import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { callApi } from "../utils/apiConnector";
import { METHOD } from "../constants/api";
import { authEndPoints } from "../../features/auth/services/authApi";
import { setUserData, setToken } from "../store/authSlice";
import { DangerButton } from "./buttons";
import AppText from "./AppText";
import SectionHeading from "./SectionHeading";

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
                        zIndex: 2147483647,
                        pointerEvents: 'auto'
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
                <DialogTitle id="suspended-dialog-title" component="div" sx={{ color: '#ef4444' }}>
                    <SectionHeading title="Account Suspended" disableGutters as="h2" />
                </DialogTitle>
                <DialogContent>
                    <AppText id="suspended-dialog-description" variant="body" sx={{ color: '#1e293b', fontSize: '1rem', lineHeight: 1.6 }}>
                        Your account has been suspended by the administrator. You are currently restricted from performing any actions on the platform. 
                        Please contact us at <strong>admin@intervu.com</strong> for assistance.
                    </AppText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, pt: 1, justifyContent: 'center' }}>
                    <DangerButton
                        onClick={handleLogout}
                        fullWidth
                    >
                        Log out
                    </DangerButton>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default SuspendedGate;
