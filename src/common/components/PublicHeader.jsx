import { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../app/layouts/MainLayout.css";

const PublicHeader = ({
    menuItems,
    primaryActionLabel = "Sign In",
    onPrimaryAction,
    className = "",
    logoLabel = "INTERVU",
    logoSubLabel,
}) => {
    const navigate = useNavigate();
    const location = useLocation();

    const defaultMenuItems = useMemo(() => [
        { label: "Home", path: "/home" },
        { label: "Question Bank", path: "/questions" },
    ], []);

    const resolvedMenuItems = menuItems ?? defaultMenuItems;

    const isMenuItemActive = (path) => location.pathname === path;

    return (
        <nav className={`navbar ${className}`.trim()}>
            <div className="navbar-container">
                <div className="navbar-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
                    <div className="navbar-logo-icon">V</div>
                    <div className="navbar-logo-copy">
                        <h1>{logoLabel}</h1>
                        {logoSubLabel ? <span>{logoSubLabel}</span> : null}
                    </div>
                </div>

                <div className="navbar-menu">
                    {resolvedMenuItems.map((item) => (
                        <button
                            key={item.label}
                            className={`nav-item ${isMenuItemActive(item.path) ? "active" : ""}`}
                            onClick={() => navigate(item.path)}
                            type="button"
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="navbar-right">
                    <button
                        className="app-btn"
                        onClick={onPrimaryAction ?? (() => navigate("/login"))}
                        type="button"
                    >
                        {primaryActionLabel}
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default PublicHeader;
