import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronDown,
    LogOut,
    User,
    Settings,
    CreditCard,
    Search,
    Compass,
    Library,
    FileText,
    Bookmark,
    Flame,
    Milestone,
    Video,
    Zap,
    CalendarClock,
    Briefcase,
    Calendar,
    LayoutDashboard,
    Sparkles,
    Gift,
    Menu,
    X,
    FileCode,
    Layers,
    Terminal
} from "lucide-react";
import { ROLES } from "../../constants/common";
import { setUserData } from "../../store/authSlice";
import { authEndPoints } from "../../../features/auth/services/authApi";
import { callApi } from "../../utils/apiConnector";
import { METHOD } from "../../constants/api";
import NotificationDropdown from "../../../features/notification/components/NotificationDropdown";
import { Avatar } from "@mui/material";
import "./Navbar.css";

const NavDropdown = ({ label, items, sections, active, isOpen, onToggle, onMouseEnter, onMouseLeave, userData }) => {
    const navigate = useNavigate();

    const handleItemClick = (e, item) => {
        if (item.auth && !userData) {
            e.preventDefault();
            onToggle(false);
            navigate("/login");
            return;
        }
        onToggle(false);
    };

    return (
        <div
            className="nav-dropdown-wrapper"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <button
                className={`nav-item ${active ? "active" : ""} ${isOpen ? "dropdown-open" : ""}`}
                onClick={onToggle}
            >
                {label}
                <ChevronDown size={14} className={`dropdown-arrow ${isOpen ? "rotated" : ""}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className={`mega-menu ${sections ? "has-sections" : ""}`}
                        initial={{ opacity: 0, y: 15, x: "-50%", scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
                        exit={{ opacity: 0, y: 15, x: "-50%", scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        {sections ? (
                            <div className="mega-menu-grid">
                                {sections.map((section, sIdx) => (
                                    <div key={sIdx} className="nav-mega-section">
                                        <div className="nav-section-header">
                                            {section.titleIcon && <section.titleIcon size={14} className="section-title-icon" />}
                                            {section.title}
                                        </div>
                                        <div className="section-items">
                                            {section.items.map((item, iIdx) => (
                                                <Link
                                                    key={iIdx}
                                                    to={item.path}
                                                    className="mega-menu-item"
                                                    onClick={(e) => handleItemClick(e, item)}
                                                >
                                                    <div className="menu-icon-wrapper">
                                                        <item.icon size={20} />
                                                    </div>
                                                    <div className="menu-text">
                                                        <span className="menu-label">{item.label}</span>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={`mega-menu-content ${items?.length <= 3 ? "single-column" : ""}`}>
                                {items.map((item, idx) => (
                                    <Link
                                        key={idx}
                                        to={item.path}
                                        className="mega-menu-item"
                                        onClick={(e) => handleItemClick(e, item)}
                                    >
                                        <div className="menu-icon-wrapper">
                                            <item.icon size={20} />
                                        </div>
                                        <div className="menu-text">
                                            <span className="menu-label">{item.label}</span>
                                            {item.badge && <span className="menu-badge">{item.badge}</span>}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { userData } = useSelector((state) => state.auth || {});

    const [openDropdown, setOpenDropdown] = useState(null);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const dropdownTimer = useRef(null);

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

    const handleMouseEnter = (key) => {
        if (dropdownTimer.current) clearTimeout(dropdownTimer.current);
        setOpenDropdown(key);
    };

    const handleMouseLeave = () => {
        dropdownTimer.current = setTimeout(() => {
            setOpenDropdown(null);
        }, 150);
    };

    // Navigation Data
    const navData = {
        GUEST: [
            { label: "Find Coaches", path: "/home", type: "link" },
            { 
                label: "Practice", 
                type: "dropdown", 
                sections: [
                    {
                        title: "Question Bank",
                        items: [
                            { label: "All Questions", path: "/questions", icon: Library },
                            { label: "Saved Questions", path: "/questions/saved", icon: Bookmark, auth: true },
                            { label: "Suggested for you", path: "/questions", icon: Zap, auth: true },
                        ]
                    },
                    {
                        title: "Hot Topics",
                        titleIcon: Flame,
                        items: [
                            { label: "Java Backend", path: "/questions?topic=java", icon: FileCode },
                            { label: "System Design", path: "/questions?topic=system-design", icon: Layers },
                            { label: "Frontend", path: "/questions?topic=frontend", icon: Terminal },
                        ]
                    }
                ]
            },
            { label: "Pricing", path: "#", type: "link" },
        ],
        CANDIDATE: [
            { label: "Find Coaches", path: "/home", type: "link" },
            { 
                label: "My Journey", 
                type: "dropdown", 
                items: [
                    { label: "My Roadmap", path: "/assessment", icon: Milestone },
                    { label: "My Interviews", path: "/interview", icon: Video },
                    { label: "Smart Matching", path: "/home?smartMatch=1", icon: Sparkles },
                ]
            },
            { 
                label: "Practice", 
                type: "dropdown", 
                sections: [
                    {
                        title: "Question Bank",
                        items: [
                            { label: "All Questions", path: "/questions", icon: Library },
                            { label: "Saved Questions", path: "/questions/saved", icon: Bookmark },
                            { label: "Suggested for you", path: "/questions", icon: Zap },
                        ]
                    },
                    {
                        title: "Hot Topics",
                        titleIcon: Flame,
                        items: [
                            { label: "Java Backend", path: "/questions?topic=java", icon: FileCode },
                            { label: "System Design", path: "/questions?topic=system-design", icon: Layers },
                            { label: "Frontend", path: "/questions?topic=frontend", icon: Terminal },
                        ]
                    }
                ]
            },
            { label: "Pricing", path: "#", type: "link" },
        ],
        COACH: [
            { label: "Dashboard", path: "/home", type: "link" },
            {
                label: "Operations",
                type: "dropdown",
                items: [
                    { label: "Booking Requests", path: "/booking-requests", icon: CalendarClock },
                    { label: "My Services", path: "/my-services", icon: Briefcase },
                    { label: "Schedule", path: "/schedule", icon: Calendar },
                ]
            },
            { label: "My Interviews", path: "/interview", type: "link" },
        ]
    };

    const currentRoleKey = userData ? (userData.role === ROLES.INTERVIEWER ? "COACH" : "CANDIDATE") : "GUEST";
    const currentMenuItems = navData[currentRoleKey];

    const isPathActive = (path) => {
        if (path === "#") return false;
        return location.pathname === path || location.pathname.startsWith(path + "/");
    };

    return (
        <nav className="navbar-fixed-container">
            <div className="navbar-glass">
                <div className="navbar-inner">
                    {/* Logo */}
                    <Link to={userData ? "/home" : "/"} className="navbar-logo">
                        <div className="logo-box">V</div>
                        <div className="logo-text">
                            <h1>INTERVU</h1>
                            <span>PLATFORM</span>
                        </div>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="navbar-menu-desktop">
                        {currentMenuItems.map((item, idx) => (
                            item.type === "dropdown" ? (
                                <NavDropdown
                                    key={idx}
                                    label={item.label}
                                    items={item.items}
                                    sections={item.sections}
                                    active={item.sections ? item.sections.some(sec => sec.items.some(sub => isPathActive(sub.path))) : item.items.some(sub => isPathActive(sub.path))}
                                    isOpen={openDropdown === item.label}
                                    onMouseEnter={() => handleMouseEnter(item.label)}
                                    onMouseLeave={handleMouseLeave}
                                    onToggle={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                                    userData={userData}
                                />
                            ) : (
                                <Link
                                    key={idx}
                                    to={item.path}
                                    className={`nav-item ${isPathActive(item.path) ? "active" : ""}`}
                                >
                                    {item.label}
                                </Link>
                            )
                        ))}
                    </div>

                    {/* Right Section */}
                    <div className="navbar-right">
                        {!userData ? (
                            <div className="auth-buttons">
                                <Link to="/login" className="nav-item">Login</Link>
                                <Link to="/signup" className="app-btn">Register</Link>
                            </div>
                        ) : (
                            <>
                                <NotificationDropdown />

                                <div className="user-avatar-wrapper"
                                    onMouseEnter={() => setIsUserMenuOpen(true)}
                                    onMouseLeave={() => setIsUserMenuOpen(false)}
                                >
                                    <button className="navbar-avatar-btn">
                                        <Avatar
                                            src={userData.profilePicture}
                                            alt={userData.fullName}
                                            sx={{ width: 40, height: 40, border: '2px solid transparent' }}
                                        >
                                            {userData.fullName?.charAt(0)}
                                        </Avatar>
                                    </button>

                                    <AnimatePresence>
                                        {isUserMenuOpen && (
                                            <motion.div
                                                className="user-dropdown-menu"
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <div className="dropdown-user-info">
                                                    <p className="user-name">{userData.fullName}</p>
                                                    <p className="user-email">{userData.email}</p>
                                                </div>
                                                <div className="dropdown-divider" />
                                                <Link to={userData.role === ROLES.INTERVIEWER ? "/interviewer/profile" : "/candidate/profile"} className="dropdown-item">
                                                    <User size={16} /> My Profile
                                                </Link>
                                                <Link to="/payment-history" className="dropdown-item">
                                                    <CreditCard size={16} /> Payment History
                                                </Link>
                                                <Link to="/settings" className="dropdown-item">
                                                    <Settings size={16} /> Settings
                                                </Link>
                                                <div className="dropdown-divider" />
                                                <button className="dropdown-item logout-link" onClick={handleLogout}>
                                                    <LogOut size={16} /> Logout
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </>
                        )}

                        {/* Mobile Toggle */}
                        <button
                            className="mobile-toggle"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        className="mobile-menu-overlay"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <div className="mobile-menu-content">
                            {currentMenuItems.map((item, idx) => (
                                <div key={idx} className="mobile-nav-group">
                                    {item.type === "dropdown" ? (
                                        <>
                                            <div className="mobile-group-label">{item.label}</div>
                                            {item.sections ? (
                                                item.sections.map((section, secIdx) => (
                                                    <div key={secIdx} className="mobile-section">
                                                        <div className="mobile-section-title">{section.title}</div>
                                                        {section.items.map((sub, sIdx) => (
                                                            <Link 
                                                                key={sIdx} 
                                                                to={sub.path} 
                                                                className="mobile-nav-item sub"
                                                                onClick={(e) => handleItemClick(e, sub)}
                                                            >
                                                                <sub.icon size={18} /> {sub.label}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                ))
                                            ) : (
                                                item.items.map((sub, sIdx) => (
                                                    <Link 
                                                        key={sIdx} 
                                                        to={sub.path} 
                                                        className="mobile-nav-item sub"
                                                        onClick={(e) => handleItemClick(e, sub)}
                                                    >
                                                        <sub.icon size={18} /> {sub.label}
                                                    </Link>
                                                ))
                                            )}
                                        </>
                                    ) : (
                                        <Link
                                            to={item.path}
                                            className="mobile-nav-item"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            {item.label}
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
