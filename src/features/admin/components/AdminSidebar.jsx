import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Drawer, Box, Typography, IconButton, Divider, Avatar, Collapse } from "@mui/material";
import {
    LayoutDashboard,
    Calendar,
    Video,
    Users,
    Building2,
    HelpCircle,
    CircleDollarSign,
    BarChart2,
    Monitor,
    LogOut,
    Settings,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    X,
} from "lucide-react";

const SIDEBAR_EXPANDED_WIDTH = 264;
const SIDEBAR_COLLAPSED_WIDTH = 88;
const SIDEBAR_COLLAPSE_STORAGE_KEY = "intervu_admin_sidebar_collapsed";

const adminNavItems = [
    {
        sectionLabel: "MENU",
        items: [
            { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
            { label: "Schedules", icon: Calendar, path: "/admin/schedules" },
            { label: "Interviews", icon: Video, path: "/admin/interviews" },
            {
                label: "Users",
                icon: Users,
                key: "users",
                children: [
                    { label: "Candidates", path: "/admin/users/candidates" },
                    { label: "Coaches", path: "/admin/users/coaches" },
                ],
            },
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
                    { label: "Withdrawal Requests", path: "/admin/income/withdrawals" },
                ],
            },
            {
                label: "Reports",
                icon: BarChart2,
                key: "reports",
                children: [
                    { label: "Room Report", path: "/admin/reports/room" },
                    { label: "Question Report", path: "/admin/reports/question" },
                ],
            },
            {
                label: "System",
                icon: Monitor,
                key: "system",
                children: [
                    { label: "Pinecone", path: "/admin/system/pinecone" },
                    { label: "AI Services", path: "/admin/system/ai-services" },
                ],
            },
        ],
    },
];

const SidebarMenuItem = ({ item, isActive, onClick, collapsed }) => {
    const ItemIcon = item.icon;
    return (
        <Box
            component="button"
            onClick={onClick}
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                justifyContent: collapsed ? "center" : "flex-start",
                p: collapsed ? "6px" : "6px 9px",
                width: collapsed ? 52 : "100%",
                mx: collapsed ? "auto" : 0,
                border: "none",
                background: "transparent",
                textDecoration: "none",
                borderRadius: "16px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                ...(isActive && {
                    bgcolor: "action.selected",
                    background: "linear-gradient(90deg, rgba(79, 70, 229, 0.1) 0%, rgba(79, 70, 229, 0.02) 100%)",
                    "& .sidebar-icon-box": {
                        bgcolor: "primary.main",
                        color: "white",
                        boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
                    },
                    "& .sidebar-label": { color: "primary.main", fontWeight: 700 },
                }),
                "&:hover": {
                    bgcolor: isActive ? "action.selected" : "action.hover",
                    transform: "translateX(4px)",
                    "& .sidebar-icon-box": {
                        bgcolor: "primary.main",
                        color: "white",
                        transform: "rotate(5deg) scale(1.1)",
                    },
                    "& .sidebar-label": { color: "primary.main" },
                },
                "&:active": { transform: "scale(0.98)" },
            }}
            title={item.label}
        >
            <Box
                className="sidebar-icon-box"
                sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "10px",
                    bgcolor: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "secondary.main",
                    flexShrink: 0,
                    transition: "all 0.3s ease",
                }}
            >
                <ItemIcon size={17} />
            </Box>
            {!collapsed && (
                <Typography
                    className="sidebar-label"
                    sx={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "text.primary",
                        transition: "color 0.2s ease",
                        textAlign: "left",
                    }}
                >
                    {item.label}
                </Typography>
            )}
        </Box>
    );
};

const SidebarGroupItem = ({ item, openGroups, onToggleGroup, location, onNavigate, collapsed }) => {
    const ItemIcon = item.icon;
    const isOpen = openGroups[item.key];
    const isChildActive = item.children.some(
        (child) => location.pathname === child.path || location.pathname.startsWith(child.path + "/"),
    );

    return (
        <Box>
            <Box
                component="button"
                onClick={() => (collapsed ? onNavigate(item.children[0]?.path) : onToggleGroup(item.key))}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    justifyContent: collapsed ? "center" : "flex-start",
                    p: collapsed ? "6px" : "6px 9px",
                    width: collapsed ? 52 : "100%",
                    mx: collapsed ? "auto" : 0,
                    border: "none",
                    background: "transparent",
                    borderRadius: "16px",
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    ...(isChildActive &&
                        !isOpen && {
                            bgcolor: "action.selected",
                            "& .sidebar-icon-box": {
                                bgcolor: "primary.main",
                                color: "white",
                            },
                            "& .sidebar-label": { color: "primary.main", fontWeight: 700 },
                            "& .sidebar-arrow": { color: "primary.main" },
                        }),
                    "&:hover": {
                        bgcolor: "action.hover",
                        transform: "translateX(4px)",
                        "& .sidebar-label": { color: "primary.main" },
                        "& .sidebar-icon-box": { transform: "rotate(5deg) scale(1.05)" }
                    },
                    "&:active": { transform: "scale(0.98)" },
                }}
                title={item.label}
            >
                <Box
                    className="sidebar-icon-box"
                    sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "10px",
                        bgcolor: "primary.main",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "secondary.main",
                        flexShrink: 0,
                        transition: "all 0.3s ease",
                    }}
                >
                    <ItemIcon size={17} />
                </Box>
                {!collapsed && (
                    <>
                        <Typography
                            className="sidebar-label"
                            sx={{
                                fontSize: "13px",
                                fontWeight: 500,
                                color: "text.primary",
                                transition: "color 0.2s ease",
                                flex: 1,
                                textAlign: "left",
                            }}
                        >
                            {item.label}
                        </Typography>
                        <Box
                            className="sidebar-arrow"
                            sx={{
                                display: "flex",
                                color: "text.secondary",
                                transition: "transform 0.2s ease",
                                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                            }}
                        >
                            <ChevronDown size={16} />
                        </Box>
                    </>
                )}
            </Box>
            <Collapse in={!collapsed && isOpen}>
                <Box sx={{ pl: "44px", mt: 0.5, display: "flex", flexDirection: "column", gap: 0.25 }}>
                    {item.children.map((child) => {
                        const childActive =
                            location.pathname === child.path || location.pathname.startsWith(child.path + "/");
                        return (
                            <Box
                                key={child.label}
                                component="button"
                                onClick={() => onNavigate(child.path)}
                                sx={{
                                    border: "none",
                                    background: "transparent",
                                    textAlign: "left",
                                    p: "6px 11px",
                                    borderRadius: "12px",
                                    fontSize: "13px",
                                    fontWeight: childActive ? 600 : 400,
                                    color: childActive ? "primary.main" : "text.secondary",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    ...(childActive && {
                                        bgcolor: "action.selected",
                                    }),
                                    "&:hover": {
                                        bgcolor: "action.hover",
                                        color: "primary.main",
                                    },
                                }}
                            >
                                {child.label}
                            </Box>
                        );
                    })}
                </Box>
            </Collapse>
        </Box>
    );
};

export default function AdminSidebar({ userData, remoteAvatar, onLogout, mobileOpen, onMobileClose }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [openGroups, setOpenGroups] = useState({ income: false, reports: true, users: true, system: false });
    const [desktopCollapsed, setDesktopCollapsed] = useState(() => {
        if (typeof window === "undefined") return false;
        return localStorage.getItem(SIDEBAR_COLLAPSE_STORAGE_KEY) === "true";
    });

    useEffect(() => {
        localStorage.setItem(SIDEBAR_COLLAPSE_STORAGE_KEY, String(desktopCollapsed));
    }, [desktopCollapsed]);

    const isCollapsed = !mobileOpen && desktopCollapsed;

    const toggleGroup = (key) => {
        setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleNavigate = (path) => {
        navigate(path);
        if (mobileOpen) onMobileClose();
    };

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

    const sidebarContent = (
        <>
            {/* Header: Logo + Close (mobile only) */}
            <Box
                sx={{
                    display: "flex",
                    flexDirection: isCollapsed ? "column" : "row",
                    justifyContent: isCollapsed ? "center" : "space-between",
                    alignItems: "center",
                    mb: 2,
                    gap: isCollapsed ? 1 : 0,
                }}
            >
                <Link
                    to="/admin/dashboard"
                    style={{
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: isCollapsed ? "0px" : "12px",
                        padding: isCollapsed ? "4px" : "5px 8px",
                        borderRadius: "16px",
                    }}
                    onClick={() => mobileOpen && onMobileClose()}
                >
                    <Box
                        sx={{
                            width: 32,
                            height: 32,
                            bgcolor: "primary.main",
                            color: "secondary.main",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "10px",
                            fontWeight: 900,
                            fontSize: "17px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                    >
                        V
                    </Box>
                    {!isCollapsed && (
                        <Typography
                            sx={{
                                fontSize: "18px",
                                fontWeight: 900,
                                letterSpacing: "-0.02em",
                                color: "primary.main",
                                lineHeight: 1,
                                my: 0,
                            }}
                        >
                            INTERVU
                        </Typography>
                    )}
                </Link>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <IconButton
                        onClick={() => setDesktopCollapsed((prev) => !prev)}
                        sx={{
                            color: "text.secondary",
                            display: { xs: "none", lg: "flex" },
                            width: 30,
                            height: 30,
                        }}
                        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    </IconButton>

                    {/* Close button only visible on mobile */}
                    <IconButton
                        onClick={onMobileClose}
                        sx={{ color: "text.secondary", display: { xs: "flex", lg: "none" } }}
                    >
                        <X size={22} />
                    </IconButton>
                </Box>
            </Box>

            {/* User Info Card
            {userData && (
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
                        src={remoteAvatar ?? userData?.profilePicture}
                        alt={userData?.fullName || "Admin"}
                        sx={{ width: 36, height: 36 }}
                    >
                        {!(remoteAvatar ?? userData?.profilePicture) &&
                            (userData?.fullName?.charAt(0) || "A")}
                    </Avatar>
                    <Box>
                        <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "text.primary" }}>
                            {userData?.fullName}
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: "10px",
                                fontWeight: 500,
                                color: "text.disabled",
                            }}
                        >
                            {userData?.email}
                        </Typography>
                    </Box>
                </Box>
            )} */}

            {/* Menu Items */}
            <Box sx={{ flex: 1 }}>
                {adminNavItems.map((section, sectionIdx) => (
                    <Box key={sectionIdx}>
                        <Typography
                            sx={{
                                fontSize: "10px",
                                fontWeight: 700,
                                color: "text.disabled",
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                                px: 0.5,
                                pt: 1.5,
                                pb: 0.5,
                                display: isCollapsed ? "none" : "block",
                            }}
                        >
                            {section.sectionLabel}
                        </Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                            {section.items.map((item) => {
                                if (item.children) {
                                    return (
                                        <SidebarGroupItem
                                            key={item.label}
                                            item={item}
                                            openGroups={openGroups}
                                            onToggleGroup={toggleGroup}
                                            location={location}
                                            onNavigate={handleNavigate}
                                            collapsed={isCollapsed}
                                        />
                                    );
                                }
                                return (
                                    <SidebarMenuItem
                                        key={item.label}
                                        item={item}
                                        isActive={isActive(item.path)}
                                        onClick={() => handleNavigate(item.path)}
                                        collapsed={isCollapsed}
                                    />
                                );
                            })}
                        </Box>
                    </Box>
                ))}
            </Box>

            {/* Bottom Section: Settings, Logout */}
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ mt: "auto" }}>
                <Box
                    component={Link}
                    to="/settings"
                    onClick={() => mobileOpen && onMobileClose()}
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        justifyContent: isCollapsed ? "center" : "flex-start",
                        p: isCollapsed ? "6px" : "6px 9px",
                        width: isCollapsed ? 52 : "100%",
                        mx: isCollapsed ? "auto" : 0,
                        textDecoration: "none",
                        borderRadius: "12px",
                        color: "text.secondary",
                        fontSize: "13px",
                        fontWeight: 500,
                        transition: "all 0.2s ease",
                        "&:hover": { bgcolor: "action.hover", color: "primary.main" },
                    }}
                    title="Settings"
                >
                    <Settings size={18} /> {!isCollapsed && "Settings"}
                </Box>
                <Box
                    component="button"
                    onClick={() => {
                        if (mobileOpen) onMobileClose();
                        onLogout();
                    }}
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        justifyContent: isCollapsed ? "center" : "flex-start",
                        width: isCollapsed ? 52 : "100%",
                        mx: isCollapsed ? "auto" : 0,
                        p: isCollapsed ? "6px" : "6px 9px",
                        border: "none",
                        background: "transparent",
                        borderRadius: "12px",
                        color: "error.main",
                        fontSize: "13px",
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        "&:hover": { bgcolor: "error.light", color: "error.dark" },
                    }}
                    title="Logout"
                >
                    <LogOut size={18} /> {!isCollapsed && "Logout"}
                </Box>
            </Box>
        </>
    );

    const drawerPaperSx = {
        width: {
            xs: "85%",
            sm: "320px",
            lg: isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH,
        },
        p: isCollapsed ? 1.25 : 2.5,
        bgcolor: "background.paper",
        display: "flex",
        flexDirection: "column",
        borderRight: 1,
        borderColor: "divider",
        transition: "width 0.25s ease",
    };

    return (
        <>
            {/* Desktop: permanent drawer on the left */}
            <Drawer
                variant="permanent"
                anchor="left"
                sx={{
                    display: { xs: "none", lg: "block" },
                    "& .MuiDrawer-paper": {
                        ...drawerPaperSx,
                        position: "sticky",
                        top: 0,
                        height: "100vh",
                        borderRadius: 0,
                    },
                }}
                open
            >
                {sidebarContent}
            </Drawer>

            {/* Mobile: temporary drawer on the left */}
            <Drawer
                variant="temporary"
                anchor="left"
                open={mobileOpen}
                onClose={onMobileClose}
                sx={{
                    display: { xs: "block", lg: "none" },
                }}
                PaperProps={{
                    sx: {
                        ...drawerPaperSx,
                        borderRadius: "0 20px 20px 0",
                    },
                }}
                ModalProps={{ keepMounted: true }}
            >
                {sidebarContent}
            </Drawer>
        </>
    );
}
