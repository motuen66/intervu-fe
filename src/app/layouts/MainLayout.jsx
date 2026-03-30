import { useState, useEffect, useMemo } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import "./MainLayout.css";
import { Container, Avatar } from "@mui/material";
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
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
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
            } catch (err) { }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, [dispatch]);

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
    const menuItems = useMemo(() => [
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
    ], []);

    const isAdmin = userData?.role === ROLES.ADMIN;

    // Sidebar group toggle states for Admin view
    const [openGroups, setOpenGroups] = useState({
        users: true,
        income: true,
        settings: true,
    });

    const toggleGroup = (key) => {
        setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
    };

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
                } catch (e) { }
            }
            if (!userId) return;
            try {
                const res = await callApi({
                    method: METHOD.GET,
                    endpoint: userEndPoints.GET_USER_PROFILE(userId)
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

    const adminNavItems = [
        { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
        { label: "Schedules", icon: Calendar, path: "/admin/schedules" },
        { label: "Interviews", icon: Video, path: "/admin/interviews" },
        { label: "Users", icon: Users, path: "/admin/users" },
        { label: "Company", icon: Building2, path: "/admin/companies" },
        { label: "Question Bank", icon: HelpCircle, path: "/admin/question-bank" },
        {
            label: "Income",
            icon: CircleDollarSign,
            key: "income",
            children: [
                { label: "Earnings", path: "/admin/income/earnings" },
                { label: "Refunds", path: "/admin/income/refunds" },
                { label: "Payouts", path: "/admin/income/payouts" },
            ],
        },
        { label: "Reports", icon: BarChart2, path: "/admin/reports" },
    ];

    // ADMIN LAYOUT
    if (isAdmin) {
        return (
            <div className="main-layout admin-layout">
                <aside className="admin-sidebar">
                    <div className="sidebar-brand">INTERVU</div>
                    <nav className="sidebar-nav">
                        <div className="sidebar-section">
                            <div className="sidebar-section-title">Menu</div>
                            {adminNavItems.map((item) => {
                                const Icon = item.icon;
                                if (item.children) {
                                    return (
                                        <div key={item.label} className="sidebar-group">
                                            <button className="sidebar-item" onClick={() => toggleGroup(item.key)} type="button">
                                                <span className="sidebar-item-icon">
                                                    <Icon size={20} strokeWidth={1.5} color="#64748B" />
                                                </span>
                                                <span className="sidebar-item-text">{item.label}</span>
                                                <span className={`sidebar-item-arrow ${openGroups[item.key] ? "open" : ""}`}>
                                                    <ChevronDown size={16} strokeWidth={2} color="#64748B" />
                                                </span>
                                            </button>
                                            {openGroups[item.key] && (
                                                <div className="sidebar-subitems">
                                                    {item.children.map((child) => (
                                                        <button
                                                            key={child.label}
                                                            className={`sidebar-subitem ${location.pathname + location.search === child.path ? "active" : ""}`}
                                                            onClick={() => navigate(child.path)}
                                                            type="button"
                                                        >
                                                            {child.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                                return (
                                    <button
                                        key={item.label}
                                        className={`sidebar-item ${location.pathname + location.search === item.path ? "active" : ""}`}
                                        onClick={() => navigate(item.path)}
                                        type="button"
                                    >
                                        <span className="sidebar-item-icon">
                                            <Icon size={20} strokeWidth={1.5} color="#64748B" />
                                        </span>
                                        <span className="sidebar-item-text">{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="sidebar-section">
                            <div className="sidebar-section-title">Settings</div>
                            <button
                                className={`sidebar-item ${location.pathname + location.search === "/settings" ? "active" : ""}`}
                                onClick={() => navigate("/settings")}
                                type="button"
                            >
                                <span className="sidebar-item-icon"><Bell size={20} strokeWidth={1.5} color="#64748B" /></span>
                                <span className="sidebar-item-text">Notification</span>
                            </button>
                            <button className="sidebar-item" onClick={handleLogout} type="button">
                                <span className="sidebar-item-icon"><LogOut size={20} strokeWidth={1.5} color="#64748B" /></span>
                                <span className="sidebar-item-text">Log out</span>
                            </button>
                        </div>
                    </nav>
                </aside>
                <div className="admin-content">
                    <header className="admin-topbar">
                        <div className="admin-search">
                            <input type="text" placeholder="Search..." className="admin-search-input" />
                            <span className="admin-search-icon"><Search size={20} strokeWidth={1.5} color="#64748B" /></span>
                        </div>
                        <div className="admin-actions">
                            <NotificationDropdown />
                            <div className="admin-user-dropdown">
                                <button className="admin-avatar-btn" onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}>
                                    <Avatar
                                        src={remoteAvatar ?? userData?.profilePicture}
                                        alt={userData?.fullName || "User"}
                                        sx={{ width: 36, height: 36 }}
                                    >
                                        {!(remoteAvatar ?? userData?.profilePicture) &&
                                            (userData?.fullName?.charAt(0) || "U")}
                                    </Avatar>
                                </button>
                                <AnimatePresence>
                                    {isUserDropdownOpen && (
                                        <motion.div
                                            className="user-dropdown-menu admin-dropdown-menu"
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
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
                                                    setIsUserDropdownOpen(false);
                                                }}
                                            >
                                                <User size={16} /> My Profile
                                            </button>
                                            <button
                                                className="dropdown-item"
                                                onClick={() => {
                                                    navigate("/settings");
                                                    setIsUserDropdownOpen(false);
                                                }}
                                            >
                                                <Settings size={16} /> Settings
                                            </button>
                                            <div className="dropdown-divider" />
                                            <button className="dropdown-item logout-link" onClick={handleLogout}>
                                                <LogOut size={16} /> Logout
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </header>
                    <main className="admin-main"><Outlet /></main>
                </div>
                <SuspendedGate />
            </div>
        );
    }

    // CANDIDATE / COACH LAYOUT
    return (
        <>
            <CandidateAssessmentGate />
            <div className="main-layout">
                <Navbar remoteAvatar={remoteAvatar} menuItems={menuItems} />

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