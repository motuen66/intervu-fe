import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
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

    // Connect to notification SignalR hub
    useNotificationHub(userData?.id, token);

    useEffect(() => {
        if (userData?.profilePicture) {
            setRemoteAvatar(userData.profilePicture);
        }
    }, [userData?.profilePicture]);

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

    const menuItems = [
        // CANDIDATE
        [
            { label: "Home", path: "/home" },
            { label: "Questions", path: "/questions" },
            { label: "Interview", path: "/interview" },
            { label: "Roadmap", path: "/assessment" },
            { label: "Booking Requests", path: "/booking-requests" },
            { label: "Messages", path: "#" },
            { label: "Settings", path: "/settings" },
        ],
        // INTERVIEWER
        [
            { label: "Dashboard", path: "/#" },
            { label: "Questions", path: "/questions" },
            { label: "Schedule", path: "/schedule" },
            { label: "Interview", path: "/interview" },
            { label: "Booking Requests", path: "/booking-requests" },
            { label: "My Services", path: "/my-services" },
            { label: "Messages", path: "#" },
        ],
        // ADMIN
        [
            { label: "Dashboard", path: "#" },
            { label: "Users", path: "#" },
            { label: "Reports", path: "#" },
        ],
    ];

    const currentMenuItems = menuItems[userData?.role] || menuItems[ROLES.CANDIDATE];

    const isAdmin = userData?.role === ROLES.ADMIN;
    const [openGroups, setOpenGroups] = useState({
        users: true,
        income: true,
        settings: true,
    });

    const toggleGroup = (key) => {
        setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    useEffect(() => {
        const fetchLatestUser = async () => {
            let userId = userData?.id;
            if (!userId) {
                try {
                    const raw = localStorage.getItem("token");
                    if (raw) {
                        const token = JSON.parse(raw);
                        if (token && typeof token === "string") {
                            const parts = token.split(".");
                            if (parts.length >= 2) {
                                const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
                                const payload = JSON.parse(json);
                                userId = payload?.sub ?? payload?.id ?? payload?.userId ?? payload?.uid ?? userId;
                            }
                        }
                    }
                } catch (e) {
                    // ignore
                }
            }

            if (!userId) return;

            try {
                const res = await callApi({ method: METHOD.GET, endpoint: userEndPoints.GET_USER_PROFILE(userId) });
                const url = res?.data?.profilePicture ?? res?.data?.user?.profilePicture ?? null;
                if (url) {
                    setRemoteAvatar(url);
                    const updated = { ...(userData || {}), profilePicture: url, id: userId };
                    try {
                        localStorage.setItem("user", JSON.stringify(updated));
                    } catch (e) {
                        console.warn("Failed to persist user to localStorage", e);
                    }
                    dispatch(setUserData(updated));
                }
            } catch (err) {
                console.error("Failed to fetch user profile", err);
            }
        };

        fetchLatestUser();
    }, [userData?.id]);

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

    const isMenuItemActive = (path) => location.pathname === path;

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
                                            <button
                                                className="sidebar-item"
                                                onClick={() => toggleGroup(item.key)}
                                                type="button"
                                            >
                                                <span className="sidebar-item-icon">
                                                    <Icon size={20} strokeWidth={1.5} color="#64748B" />
                                                </span>
                                                <span className="sidebar-item-text">{item.label}</span>
                                                <span
                                                    className={`sidebar-item-arrow ${openGroups[item.key] ? "open" : ""}`}
                                                >
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
                                <span className="sidebar-item-icon">
                                    <Bell size={20} strokeWidth={1.5} color="#64748B" />
                                </span>
                                <span className="sidebar-item-text">Notification</span>
                            </button>
                            <button className="sidebar-item" onClick={handleLogout} type="button">
                                <span className="sidebar-item-icon">
                                    <LogOut size={20} strokeWidth={1.5} color="#64748B" />
                                </span>
                                <span className="sidebar-item-text">Log out</span>
                            </button>
                        </div>
                    </nav>
                </aside>

                <div className="admin-content">
                    <header className="admin-topbar">
                        <div className="admin-search">
                            <input type="text" placeholder="Search..." className="admin-search-input" />
                            <span className="admin-search-icon">
                                <Search size={20} strokeWidth={1.5} color="#64748B" />
                            </span>
                        </div>
                        <div className="admin-actions">
                            <NotificationDropdown />
                            <div className="admin-user-dropdown">
                                <button
                                    className="admin-avatar-btn"
                                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                                    title="Account"
                                >
                                    <Avatar
                                        src={remoteAvatar ?? userData?.profilePicture}
                                        alt={userData?.fullName || "User"}
                                        sx={{ width: 36, height: 36 }}
                                        imgProps={{
                                            onError: (e) => {
                                                e.currentTarget.style.display = "none";
                                            },
                                        }}
                                    >
                                        {!(remoteAvatar ?? userData?.profilePicture) &&
                                            (userData?.fullName
                                                ?.split(" ")
                                                .map((n) => n[0])
                                                .join("")
                                                .toUpperCase() ||
                                                "U")}
                                    </Avatar>
                                </button>

                                {isUserDropdownOpen && (
                                    <div className="dropdown-menu admin-dropdown-menu">
                                        <div className="dropdown-header">
                                            <p className="dropdown-name">{userData?.fullName}</p>
                                            <p className="dropdown-email">{userData?.email}</p>
                                        </div>
                                        <hr className="dropdown-divider" />
                                        <button
                                            className="dropdown-item"
                                            onClick={() => {
                                                navigate("/user/profile");
                                                setIsUserDropdownOpen(false);
                                            }}
                                        >
                                            View Profile
                                        </button>
                                        <button
                                            className="dropdown-item"
                                            onClick={() => {
                                                navigate("/settings");
                                                setIsUserDropdownOpen(false);
                                            }}
                                        >
                                            Settings
                                        </button>
                                        <button className="dropdown-item">Help & Support</button>
                                        <hr className="dropdown-divider" />
                                        <button className="dropdown-item logout-item" onClick={handleLogout}>
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>
                    <main className="admin-main">
                        <Outlet />
                    </main>
                </div>

                <SuspendedGate />
            </div>
        );
    }

    return (
        <div className="main-layout">
            {/* Navbar */}
            <nav className="navbar">
                <div className="navbar-container">
                    {/* Logo */}
                    <div className="navbar-logo">
                        <div className="navbar-logo-icon">V</div>
                        <h1>INTERVU</h1>
                    </div>

                    {/* Navigation Menu */}
                    <div className="navbar-menu">
                        {currentMenuItems.map((item) => (
                            <button
                                key={item.label}
                                className={`nav-item ${isMenuItemActive(item.path) ? "active" : ""}`}
                                onClick={() => navigate(item.path)}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* Right Section */}
                    <div className="navbar-right">
                        {/* Upgrade Button */}
                        {userData?.role === ROLES.CANDIDATE && <button className="app-btn">Upgrade Pro</button>}

                        {/* Notification Dropdown */}
                        <NotificationDropdown />

                        {/* User Avatar Dropdown */}
                        <div className="user-dropdown">
                            <button
                                className="navbar-avatar-btn"
                                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                                title="Account"
                            >
                                <Avatar
                                    src={remoteAvatar ?? userData?.profilePicture}
                                    alt={userData?.fullName || "User"}
                                    sx={{ width: 40, height: 40 }}
                                    imgProps={{
                                        onError: (e) => {
                                            e.currentTarget.style.display = "none";
                                        },
                                    }}
                                >
                                    {!(remoteAvatar ?? userData?.profilePicture) &&
                                        (userData?.fullName
                                            ?.split(" ")
                                            .map((n) => n[0])
                                            .join("")
                                            .toUpperCase()
                                            .slice(0, 2) ||
                                            "U")}
                                </Avatar>
                            </button>

                            {isUserDropdownOpen && (
                                <div className="dropdown-menu">
                                    <div className="dropdown-header">
                                        <p className="dropdown-name">{userData?.fullName}</p>
                                        <p className="dropdown-email">{userData?.email}</p>
                                    </div>
                                    <hr className="dropdown-divider" />
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            const role = userData?.role;
                                            const path =
                                                role === ROLES.INTERVIEWER
                                                    ? "/interviewer/profile"
                                                    : role === ROLES.CANDIDATE
                                                      ? "/candidate/profile"
                                                      : "/user/profile";
                                            navigate(path);
                                            setIsUserDropdownOpen(false);
                                        }}
                                    >
                                        View Profile
                                    </button>
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            navigate("/payment-history");
                                            setIsUserDropdownOpen(false);
                                        }}
                                    >
                                        View Payment History
                                    </button>
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            navigate("/questions/saved");
                                            setIsUserDropdownOpen(false);
                                        }}
                                    >
                                        Saved Questions
                                    </button>
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            navigate("/settings");
                                            setIsUserDropdownOpen(false);
                                        }}
                                    >
                                        Settings
                                    </button>
                                    <button className="dropdown-item">Help & Support</button>
                                    <hr className="dropdown-divider" />
                                    <button className="dropdown-item logout-item" onClick={handleLogout}>
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="main-content">
                <Container maxWidth={false} sx={{ maxWidth: "1350px", pt: 3, pb: 6 }}>
                    <Outlet />
                </Container>
            </main>

            <SuspendedGate />

            {/* Footer */}
            <footer className="footer">
                <div className="footer-container">
                    <p>&copy; 2026 Intervu. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
