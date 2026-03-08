import { Link, Outlet, useNavigate } from "react-router-dom";
import ScrollTopFab from "./ScrollTopFab";
import useUser from "../../common/hooks/useUser";
import { AppBar, Toolbar, Container, Typography, Box, CssBaseline, Button, Avatar } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { setToken, setUserData } from "../../common/store/authSlice";
import { callApi } from "../../common/utils/apiConnector";
import { METHOD } from "../../common/constants/api";
import { authEndPoints } from "../../features/auth/services/authApi";

const DefaultLayout = () => {
    const { userData } = useSelector((state) => state.auth || {});
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const logout = async () => {
        try {
            await callApi({
                method: METHOD.POST,
                endpoint: authEndPoints.LOGOUT_API
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.clear();
            dispatch(setUserData(null));
            dispatch(setToken(null));
            navigate("/");
        }
    };

    return (
        <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
            <CssBaseline />
            {/* Header */}
            <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Container maxWidth={false} sx={{ maxWidth: "1350px" }}>
                    <Toolbar disableGutters sx={{ py: 1.5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1 }}>
                            Intervu
                        </Typography>
                        {userData?.profilePicture ? (
                            <img src={userData.profilePicture} alt="User Avatar" className="avatar-img" />
                        ) : (
                            <Avatar sx={{ width: 40, height: 40 }} />
                        )}
                        <Button variant="outlined" sx={{ ml: 2 }} onClick={logout}>
                            Sign In
                        </Button>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Main */}
            <Box component="main" sx={{ flex: 1 }}>
                <Container maxWidth={false} sx={{ maxWidth: "1350px", pt: 3, pb: 6 }}>
                    <Outlet />
                </Container>
            </Box>

            {/* Footer */}
            <Box component="footer" sx={{ borderTop: 1, borderColor: "divider", bgcolor: "background.default" }}>
                <Container maxWidth={false} sx={{ maxWidth: "1350px", py: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        © {new Date().getFullYear()} Intervu. All rights reserved.
                    </Typography>
                </Container>
            </Box>

            <ScrollTopFab />
        </Box>
    );
};

export default DefaultLayout;
