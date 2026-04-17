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
    Terminal,
} from "lucide-react";
import { ROLES } from "../../constants/common";
import { setUserData } from "../../store/authSlice";
import { authEndPoints } from "../../../features/auth/services/authApi";
import { callApi } from "../../utils/apiConnector";
import { METHOD } from "../../constants/api";
import NotificationDropdown from "../../../features/notification/components/NotificationDropdown";
import { Avatar, Drawer, Box, Typography, IconButton, Divider, Fade } from "@mui/material";
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
        <div className="nav-dropdown-wrapper" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
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
                                            {section.titleIcon && (
                                                <section.titleIcon size={14} className="section-title-icon" />
                                            )}
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

const MobileMenuItem = ({ item, userData, onClose }) => {
    const ItemIcon = item.icon || Search;
    return (
        <Box
            component={Link}
            to={item.auth && !userData ? "/login" : item.path}
            onClick={onClose}
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.75,
                p: "10px 12px",
                textDecoration: "none",
                borderRadius: "16px",
                transition: "all 0.2s ease",
                "&:hover": {
                    bgcolor: "primary.main",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                    transform: "translateY(-2px)",
                    "& .sidebar-icon-box": {
                        bgcolor: "secondary.main",
                        color: "primary.main",
                        transform: "rotate(5deg) scale(1.1)",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
                    },
                    "& .sidebar-label": { color: "white" },
                },
                "&:active": { transform: "scale(0.98)" },
            }}
        >
            <Box
                className="sidebar-icon-box"
                sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "12px",
                    bgcolor: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "secondary.main",
                    flexShrink: 0,
                    transition: "all 0.3s ease",
                }}
            >
                <ItemIcon size={20} />
            </Box>
            <Typography
                className="sidebar-label"
                sx={{ fontSize: "14px", fontWeight: 700, color: "text.primary", transition: "color 0.2s ease" }}
            >
                {item.label}
            </Typography>
        </Box>
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
            { label: "Find Coaches", path: "/home", type: "link", icon: Search, sectionLabel: "DISCOVER" },
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
                        ],
                    },
                    {
                        title: "Hot Topics",
                        titleIcon: Flame,
                        items: [
                            { label: "Java Backend", path: "/questions?topic=java", icon: FileCode },
                            { label: "System Design", path: "/questions?topic=system-design", icon: Layers },
                            { label: "Frontend", path: "/questions?topic=frontend", icon: Terminal },
                        ],
                    },
                ],
            },
            // { label: "Pricing", path: "#", type: "link", icon: CreditCard, sectionLabel: "MEMBERSHIP" },
        ],
        CANDIDATE: [
            { label: "Find Coaches", path: "/home", type: "link", icon: Search, sectionLabel: "DISCOVER" },
            {
                label: "My Journey",
                type: "dropdown",
                items: [
                    { label: "My Roadmap", path: "/roadmap", icon: Milestone },
                    { label: "My Interviews", path: "/interview", icon: Video },
                    { label: "Smart Matching", path: "/home?smartMatch=1", icon: Sparkles },
                    { label: "Booking Requests", path: "/booking-requests", icon: CalendarClock },
                ],
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
                        ],
                    },
                    {
                        title: "Hot Topics",
                        titleIcon: Flame,
                        items: [
                            { label: "Java Backend", path: "/questions?topic=java", icon: FileCode },
                            { label: "System Design", path: "/questions?topic=system-design", icon: Layers },
                            { label: "Frontend", path: "/questions?topic=frontend", icon: Terminal },
                        ],
                    },
                ],
            },
            // { label: "Pricing", path: "#", type: "link", icon: CreditCard, sectionLabel: "MEMBERSHIP" },
        ],
        COACH: [
            { label: "Dashboard", path: "/dashboard", type: "link", icon: LayoutDashboard, sectionLabel: "WORKSPACE" },
            {
                label: "Operations",
                type: "dropdown",
                items: [
                    { label: "Booking Requests", path: "/booking-requests", icon: CalendarClock },
                    { label: "My Services", path: "/my-services", icon: Briefcase },
                    { label: "Schedule", path: "/schedule", icon: Calendar },
                    { label: "Wallet", path: "/dashboard/wallet", icon: CreditCard },
                ],
            },
            { label: "My Interviews", path: "/interview", type: "link", icon: Video, sectionLabel: "RECORDS" },
        ],
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
                        {currentMenuItems.map((item, idx) =>
                            item.type === "dropdown" ? (
                                <NavDropdown
                                    key={idx}
                                    label={item.label}
                                    items={item.items}
                                    sections={item.sections}
                                    active={
                                        item.sections
                                            ? item.sections.some((sec) =>
                                                  sec.items.some((sub) => isPathActive(sub.path)),
                                              )
                                            : item.items.some((sub) => isPathActive(sub.path))
                                    }
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
                            ),
                        )}
                    </div>

                    {/* Right Section */}
                    <div className="navbar-right">
                        {!userData ? (
                            <div className="auth-buttons">
                                <Link to="/login" className="nav-item">
                                    Login
                                </Link>
                                <Link to="/signup" className="app-btn">
                                    Register
                                </Link>
                            </div>
                        ) : (
                            <>
                                <NotificationDropdown />

                                <div
                                    className="user-avatar-wrapper"
                                    onMouseEnter={() => setIsUserMenuOpen(true)}
                                    onMouseLeave={() => setIsUserMenuOpen(false)}
                                >
                                    <button className="navbar-avatar-btn">
                                        <Avatar
                                            src={userData.profilePicture}
                                            alt={userData.fullName}
                                            sx={{ width: 40, height: 40, border: "2px solid transparent" }}
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
                                                <Link
                                                    to={
                                                        userData.role === ROLES.INTERVIEWER
                                                            ? "/interviewer/profile"
                                                            : "/candidate/profile"
                                                    }
                                                    className="dropdown-item"
                                                >
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
                        <button className="mobile-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Sidebar Drawer */}
            <Drawer
                anchor="right"
                open={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                sx={{ display: { xs: "block", lg: "none" } }}
                PaperProps={{
                    sx: {
                        width: { xs: "85%", sm: "320px" },
                        p: 2.5,
                        bgcolor: "background.paper",
                        borderRadius: "20px 0 0 20px",
                        display: "flex",
                        flexDirection: "column",
                    },
                }}
            >
                {/* Header: Logo + Close */}
                {(() => {
                    let fadeIndex = 0;
                    return (
                        <>
                            <Fade
                                in={isMobileMenuOpen}
                                style={{ transitionDelay: isMobileMenuOpen ? `${fadeIndex++ * 50}ms` : "0ms" }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        mb: 2,
                                    }}
                                >
                                    <Link
                                        to={userData ? "/home" : "/"}
                                        style={{
                                            textDecoration: "none",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "12px",
                                        }}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <Box
                                            sx={{
                                                width: 36,
                                                height: 36,
                                                bgcolor: "primary.main",
                                                color: "secondary.main",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                borderRadius: "10px",
                                                fontWeight: 900,
                                                fontSize: "18px",
                                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                            }}
                                        >
                                            V
                                        </Box>
                                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                                            <Typography
                                                sx={{
                                                    fontSize: "20px",
                                                    fontWeight: 900,
                                                    letterSpacing: "-0.02em",
                                                    color: "primary.main",
                                                    lineHeight: 1,
                                                    my: 0,
                                                }}
                                            >
                                                INTERVU
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontSize: "10px",
                                                    fontWeight: 700,
                                                    color: "text.secondary",
                                                    letterSpacing: "0.1em",
                                                    my: 0,
                                                }}
                                            >
                                                PLATFORM
                                            </Typography>
                                        </Box>
                                    </Link>
                                    <IconButton
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        sx={{ color: "text.secondary" }}
                                    >
                                        <X size={22} />
                                    </IconButton>
                                </Box>
                            </Fade>

                            {/* User Info Card */}
                            {userData && (
                                <Fade
                                    in={isMobileMenuOpen}
                                    style={{ transitionDelay: isMobileMenuOpen ? `${fadeIndex++ * 50}ms` : "0ms" }}
                                >
                                    <Box
                                        sx={{
                                            bgcolor: "action.disabledBackground",
                                            borderRadius: "14px",
                                            p: 1.5,
                                            mb: 2,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1.5,
                                        }}
                                    >
                                        <Avatar
                                            src={userData.profilePicture}
                                            alt={userData.fullName}
                                            sx={{ width: 40, height: 40 }}
                                        >
                                            {userData.fullName?.charAt(0)}
                                        </Avatar>
                                        <Box>
                                            <Typography
                                                sx={{ fontSize: "14px", fontWeight: 700, color: "text.primary" }}
                                            >
                                                {userData.fullName}
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontSize: "10px",
                                                    fontWeight: 700,
                                                    letterSpacing: "0.08em",
                                                    color: "text.disabled",
                                                    textTransform: "uppercase",
                                                }}
                                            >
                                                {userData.role === ROLES.INTERVIEWER ? "COACH" : "CANDIDATE"}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Fade>
                            )}

                            {/* Menu Items */}
                            <Box sx={{ flex: 1, overflowY: "auto" }}>
                                {currentMenuItems.map((item, idx) => {
                                    if (item.type === "link") {
                                        const ItemIcon = item.icon || Search;
                                        const elements = [];

                                        if (item.sectionLabel) {
                                            const labelDelay = fadeIndex++;
                                            elements.push(
                                                <Fade
                                                    key={`sec-label-link-${idx}`}
                                                    in={isMobileMenuOpen}
                                                    style={{
                                                        transitionDelay: isMobileMenuOpen
                                                            ? `${labelDelay * 50}ms`
                                                            : "0ms",
                                                    }}
                                                >
                                                    <Typography
                                                        sx={{
                                                            fontSize: "11px",
                                                            fontWeight: 800,
                                                            color: "text.disabled",
                                                            textTransform: "uppercase",
                                                            letterSpacing: "0.08em",
                                                            px: 0.5,
                                                            pt: 1.5,
                                                            pb: 0.5,
                                                        }}
                                                    >
                                                        {item.sectionLabel}
                                                    </Typography>
                                                </Fade>,
                                            );
                                        }

                                        const itemDelay = fadeIndex++;
                                        elements.push(
                                            <Fade
                                                key={`link-${idx}`}
                                                in={isMobileMenuOpen}
                                                style={{
                                                    transitionDelay: isMobileMenuOpen ? `${itemDelay * 50}ms` : "0ms",
                                                }}
                                            >
                                                <div>
                                                    <MobileMenuItem
                                                        item={item}
                                                        userData={userData}
                                                        onClose={() => setIsMobileMenuOpen(false)}
                                                    />
                                                </div>
                                            </Fade>,
                                        );

                                        return elements;
                                    }

                                    // Dropdown items — render as flat sections
                                    const elements = [];

                                    if (item.sections) {
                                        item.sections.forEach((section, secIdx) => {
                                            const labelDelay = fadeIndex++;
                                            elements.push(
                                                <Fade
                                                    key={`sec-label-${idx}-${secIdx}`}
                                                    in={isMobileMenuOpen}
                                                    style={{
                                                        transitionDelay: isMobileMenuOpen
                                                            ? `${labelDelay * 50}ms`
                                                            : "0ms",
                                                    }}
                                                >
                                                    <Typography
                                                        sx={{
                                                            fontSize: "11px",
                                                            fontWeight: 800,
                                                            color: "text.disabled",
                                                            textTransform: "uppercase",
                                                            letterSpacing: "0.08em",
                                                            px: 0.5,
                                                            pt: 1.5,
                                                            pb: 0.5,
                                                        }}
                                                    >
                                                        {section.title}
                                                    </Typography>
                                                </Fade>,
                                            );
                                            section.items.forEach((sub, sIdx) => {
                                                const itemDelay = fadeIndex++;
                                                elements.push(
                                                    <Fade
                                                        key={`sec-item-${idx}-${secIdx}-${sIdx}`}
                                                        in={isMobileMenuOpen}
                                                        style={{
                                                            transitionDelay: isMobileMenuOpen
                                                                ? `${itemDelay * 50}ms`
                                                                : "0ms",
                                                        }}
                                                    >
                                                        <div>
                                                            <MobileMenuItem
                                                                item={sub}
                                                                userData={userData}
                                                                onClose={() => setIsMobileMenuOpen(false)}
                                                            />
                                                        </div>
                                                    </Fade>,
                                                );
                                            });
                                        });
                                    } else if (item.items) {
                                        const labelDelay = fadeIndex++;
                                        elements.push(
                                            <Fade
                                                key={`label-${idx}`}
                                                in={isMobileMenuOpen}
                                                style={{
                                                    transitionDelay: isMobileMenuOpen ? `${labelDelay * 50}ms` : "0ms",
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        fontSize: "11px",
                                                        fontWeight: 800,
                                                        color: "text.disabled",
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.08em",
                                                        px: 0.5,
                                                        pt: 1.5,
                                                        pb: 0.5,
                                                    }}
                                                >
                                                    {item.label}
                                                </Typography>
                                            </Fade>,
                                        );
                                        item.items.forEach((sub, sIdx) => {
                                            const itemDelay = fadeIndex++;
                                            elements.push(
                                                <Fade
                                                    key={`item-${idx}-${sIdx}`}
                                                    in={isMobileMenuOpen}
                                                    style={{
                                                        transitionDelay: isMobileMenuOpen
                                                            ? `${itemDelay * 50}ms`
                                                            : "0ms",
                                                    }}
                                                >
                                                    <div>
                                                        <MobileMenuItem
                                                            item={sub}
                                                            userData={userData}
                                                            onClose={() => setIsMobileMenuOpen(false)}
                                                        />
                                                    </div>
                                                </Fade>,
                                            );
                                        });
                                    }

                                    return elements;
                                })}
                            </Box>

                            {/* Bottom Section: Settings + Logout */}
                            {userData && (
                                <>
                                    <Divider sx={{ my: 1.5 }} />
                                    <Box sx={{ mt: "auto" }}>
                                        <Fade
                                            in={isMobileMenuOpen}
                                            style={{
                                                transitionDelay: isMobileMenuOpen ? `${fadeIndex++ * 50}ms` : "0ms",
                                            }}
                                        >
                                            <Box
                                                component={Link}
                                                to="/settings"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 1.5,
                                                    p: "10px 12px",
                                                    textDecoration: "none",
                                                    borderRadius: "12px",
                                                    color: "text.secondary",
                                                    fontSize: "14px",
                                                    fontWeight: 600,
                                                    transition: "all 0.2s ease",
                                                    "&:hover": { bgcolor: "action.hover", color: "primary.main" },
                                                }}
                                            >
                                                <Settings size={20} /> Settings
                                            </Box>
                                        </Fade>
                                        <Fade
                                            in={isMobileMenuOpen}
                                            style={{
                                                transitionDelay: isMobileMenuOpen ? `${fadeIndex++ * 50}ms` : "0ms",
                                            }}
                                        >
                                            <Box
                                                component="button"
                                                onClick={() => {
                                                    setIsMobileMenuOpen(false);
                                                    handleLogout();
                                                }}
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 1.5,
                                                    width: "100%",
                                                    p: "10px 12px",
                                                    border: "none",
                                                    background: "transparent",
                                                    borderRadius: "12px",
                                                    color: "error.main",
                                                    fontSize: "14px",
                                                    fontWeight: 600,
                                                    cursor: "pointer",
                                                    transition: "all 0.2s ease",
                                                    "&:hover": { bgcolor: "error.light", color: "error.dark" },
                                                }}
                                            >
                                                <LogOut size={20} /> Logout
                                            </Box>
                                        </Fade>
                                    </Box>
                                </>
                            )}
                        </>
                    );
                })()}
            </Drawer>
        </nav>
    );
};

export default Navbar;
