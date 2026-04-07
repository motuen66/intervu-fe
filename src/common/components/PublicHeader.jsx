import { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../app/layouts/MainLayout.css";

const PublicHeader = ({
    menuItems,
    primaryActionLabel,
    onPrimaryAction,
    className = "",
    logoLabel,
    logoSubLabel,
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    const defaultMenuItems = useMemo(() => [
        { label: t("common.public_header.nav_home"), path: "/home" },
        { label: t("common.public_header.nav_questions"), path: "/questions" },
    ], [t]);

    const resolvedMenuItems = menuItems ?? defaultMenuItems;

    const isMenuItemActive = (path) => location.pathname === path;

    return (
        <nav className={`navbar ${className}`.trim()}>
            <div className="navbar-container">
                <div className="navbar-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
                    <div className="navbar-logo-icon">V</div>
                    <div className="navbar-logo-copy">
                        <h1>{logoLabel || t("common.public_header.logo")}</h1>
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
                        {primaryActionLabel || t("common.public_header.btn_signin")}
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default PublicHeader;
