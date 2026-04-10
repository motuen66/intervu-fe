import { useState, useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import "./MainLayout.css";
import { Container, Box, IconButton, Avatar } from "@mui/material";
import { Menu, User, Settings, LogOut } from "lucide-react";
import { ROLES } from "../../common/constants/common";
import { callApi } from "../../common/utils/apiConnector";
import { METHOD } from "../../common/constants/api";
import { authEndPoints } from "../../features/auth/services/authApi";
import { setUserData } from "../../common/store/authSlice";
import { userEndPoints } from "../../common/services/userApi";
import NotificationDropdown from "../../features/notification/components/NotificationDropdown";
import useNotificationHub from "../../features/notification/hooks/useNotificationHub";
import SuspendedGate from "../../common/components/SuspendedGate";
import CandidateAssessmentGate from "../../common/components/CandidateAssessmentGate";
import Navbar from "../../common/components/Navbar/Navbar";
import AdminSidebar from "../../features/admin/components/AdminSidebar";
import usePageTracking from "../../hooks/usePageTracking";
import { isAssessmentForceRequired } from "../../features/profiles/candidate/candidate-assessment/services/assessmentApi";
import {
    LayoutDashboard,
    Calendar,
    Video,
    Users,
    Building2,
    HelpCircle,
    CircleDollarSign,
    BarChart2,
    Bell,
    LogOut,
    User,
    Settings,
    ChevronDown,
    Search,
} from "lucide-react";

const MainLayout = () => {
    // automatic SPA page tracking for routes rendered inside MainLayout
    usePageTracking();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
    const adminDropdownRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { userData, token } = useSelector((state) => state.auth || {});
    const dispatch = useDispatch();
    const [remoteAvatar, setRemoteAvatar] = useState(null);

    // Initialize SignalR notification hub
    useNotificationHub(userData?.id, token);

    // Synchronize avatar state with current user data
    useEffect(() => {
        if (userData?.profilePicture) {
            setRemoteAvatar(userData.profilePicture);
        }
    }, [userData?.profilePicture]);

    // Synchronize user data across multiple browser tabs/windows
    useEffect(() => {
        const onStorage = (e) => {
            if (e.key !== "user") return;
            try {
                const newUser = e.newValue ? JSON.parse(e.newValue) : null;
                if (newUser) {
                    if (newUser.profilePicture) setRemoteAvatar(newUser.profilePicture);
                    setTimeout(() => dispatch(setUserData(newUser)), 0);
                }
            } catch (err) {}
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, [dispatch]);

    // Close admin dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (adminDropdownRef.current && !adminDropdownRef.current.contains(e.target)) {
                setIsAdminDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
            navigate("/login");
        }
    };

    // Navigation menu configuration mapped by user roles
    const menuItems = useMemo(
        () => [
            // ROLE: CANDIDATE
            [
                { label: "Home", path: "/home" },
                { label: "Questions", path: "/questions" },
                { label: "Interview", path: "/interview" },
                { label: "Roadmap", path: "/assessment?step=roadmap" },
                { label: "Booking Requests", path: "/booking-requests" },
                { label: "Settings", path: "/settings" },
            ],
            // ROLE: INTERVIEWER/COACH
            [
                { label: "Dashboard", path: "/coach/dashboard" },
                { label: "Questions", path: "/questions" },
                { label: "Schedule", path: "/coach/schedule" },
                { label: "Booking Requests", path: "/coach/requests" },
                { label: "My Services", path: "/coach/services" },
            ],
            // ROLE: ADMIN
            [
                { label: "Dashboard", path: "/admin/dashboard" },
                { label: "Users", path: "/admin/users" },
                { label: "Reports", path: "/admin/reports" },
            ],
        ],
        [],
    );

    const isAdmin = userData?.role === ROLES.ADMIN;
    const isAssessmentLocked = userData?.role === ROLES.CANDIDATE && isAssessmentForceRequired(userData?.id);

    // Extract user ID from token and refresh profile data from server
    useEffect(() => {
        const fetchLatestUser = async () => {
            let userId = userData?.id;
            if (!userId) {
                try {
                    const raw = localStorage.getItem("token");
                    if (raw) {
                        const t = JSON.parse(raw);
                        if (t && typeof t === "string") {
                            const parts = t.split(".");
                            if (parts.length >= 2) {
                                // Decode JWT payload safely
                                const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
                                const payload = JSON.parse(json);
                                userId = payload?.sub ?? payload?.id ?? payload?.userId ?? payload?.uid ?? userId;
                            }
                        }
                    }
                } catch (e) {}
            }
            if (!userId) return;
            try {
                const res = await callApi({
                    method: METHOD.GET,
                    endpoint: userEndPoints.GET_USER_PROFILE(userId),
                });
                const url = res?.data?.profilePicture ?? res?.data?.user?.profilePicture ?? null;
                if (url) {
                    setRemoteAvatar(url);
                    const updated = { ...(userData || {}), profilePicture: url, id: userId };
                    localStorage.setItem("user", JSON.stringify(updated));
                    dispatch(setUserData(updated));
                }
            } catch (err) {
                console.error("Failed to fetch user profile", err);
            }
        };
        fetchLatestUser();
    }, [userData?.id, dispatch]);

    // ADMIN LAYOUT
    if (isAdmin) {
        return (
            <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
                <AdminSidebar
                    userData={userData}
                    remoteAvatar={remoteAvatar}
                    onLogout={handleLogout}
                    mobileOpen={mobileOpen}
                    onMobileClose={() => setMobileOpen(false)}
                />
                <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
                    {/* Admin Topbar */}
                    <Box
                        component="header"
                        sx={{
                            height: 60,
                            bgcolor: "background.paper",
                            borderBottom: 1,
                            borderColor: "divider",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            px: 2.5,
                            position: "sticky",
                            top: 0,
                            zIndex: 20,
                        }}
                    >
                        {/* Mobile hamburger */}
                        <IconButton
                            onClick={() => setMobileOpen(true)}
                            sx={{ display: { xs: "flex", lg: "none" }, color: "text.primary" }}
                        >
                            <Menu size={22} />
                        </IconButton>
                        <Box sx={{ display: { xs: "none", lg: "block" } }} />

                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <NotificationDropdown />
                            <Box sx={{ position: "relative" }} ref={adminDropdownRef}>
                                <Avatar
                                    src={remoteAvatar ?? userData?.profilePicture}
                                    alt={userData?.fullName || "Admin"}
                                    sx={{ width: 36, height: 36, cursor: "pointer" }}
                                    onClick={() => setIsAdminDropdownOpen((v) => !v)}
                                >
                                    {!(remoteAvatar ?? userData?.profilePicture) &&
                                        (userData?.fullName?.charAt(0) || "A")}
                                </Avatar>
                                <AnimatePresence>
                                    {isAdminDropdownOpen && (
                                        <motion.div
                                            className="user-dropdown-menu"
                                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            style={{
                                                position: "absolute",
                                                right: 0,
                                                top: "calc(100% + 8px)",
                                                minWidth: 200,
                                            }}
                                        >
                                            <div className="dropdown-user-info">
                                                <p className="user-name">{userData?.fullName}</p>
                                                <p className="user-email">{userData?.email}</p>
                                            </div>
                                            <div className="dropdown-divider" />
                                            <button
                                                className="dropdown-item"
                                                onClick={() => {
                                                    navigate("/user/profile");
                                                    setIsAdminDropdownOpen(false);
                                                }}
                                            >
                                                <User size={15} /> Profile
                                            </button>
                                            <button
                                                className="dropdown-item"
                                                onClick={() => {
                                                    navigate("/settings");
                                                    setIsAdminDropdownOpen(false);
                                                }}
                                            >
                                                <Settings size={15} /> Settings
                                            </button>
                                            <div className="dropdown-divider" />
                                            <button
                                                className="dropdown-item logout-link"
                                                onClick={() => {
                                                    setIsAdminDropdownOpen(false);
                                                    handleLogout();
                                                }}
                                            >
                                                <LogOut size={15} /> Logout
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Box>
                        </Box>
                    </Box>

                    {/* Admin Main Content */}
                    <Box component="main" sx={{ flex: 1, p: { xs: 2, md: "20px 24px 32px" } }}>
                        <Outlet />
                    </Box>
                </Box>
                <SuspendedGate />
            </Box>
        );
    }

    // CANDIDATE / COACH LAYOUT
    return (
        <>
            <CandidateAssessmentGate />
            <div className="main-layout">
                {isAssessmentLocked ? (
                    <header
                        style={{
                            position: "sticky",
                            top: 0,
                            zIndex: 1200,
                            backdropFilter: "blur(10px)",
                            background: "rgba(255,255,255,0.85)",
                            borderBottom: "1px solid rgba(15,23,42,0.08)",
                        }}
                    >
                        <Container
                            maxWidth={false}
                            sx={{
                                maxWidth: "1350px",
                                py: 1.5,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        ></Container>
                    </header>
                ) : (
                    <Navbar remoteAvatar={remoteAvatar} menuItems={menuItems} />
                )}

                <main className="main-content">
                    <Container maxWidth={false} sx={{ maxWidth: "1350px", pt: 3, pb: 6 }}>
                        <Outlet />
                    </Container>
                </main>

                <SuspendedGate />

                <footer className="footer">
                    <div className="footer-container">
                        <p>&copy; 2026 Intervu. All rights reserved.</p>
                    </div>
                </footer>
            </div>
        </>
    );
};

export default MainLayout;