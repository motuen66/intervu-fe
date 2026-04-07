import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import CircleIcon from "@mui/icons-material/Circle";
import CloseIcon from "@mui/icons-material/Close";
import { callApi } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";
import { notificationEndPoints } from "../services/notificationApi";
import {
    setNotifications,
    appendNotifications,
    markAsRead,
    markAllAsRead,
    setUnreadCount,
} from "../store/notificationSlice";
import { getNotificationConfig, formatTimeAgo } from "../utils/notificationUtils";
import "./NotificationDropdown.css";

const PAGE_SIZE = 8;

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("all"); // "all" | "unread"
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [unreadVisibleCount, setUnreadVisibleCount] = useState(PAGE_SIZE);
    const [detailModal, setDetailModal] = useState(null); // notification to show in modal
    const dropdownRef = useRef(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const { items, unreadCount } = useSelector((state) => state.notification);

    // Fetch notifications
    const fetchNotifications = useCallback(
        async (pageNum = 1, append = false) => {
            try {
                if (append) setLoadingMore(true);
                const endpoint = `${notificationEndPoints.GET_NOTIFICATIONS}?page=${pageNum}&pageSize=${PAGE_SIZE}`;
                const result = await callApi({
                    method: METHOD.GET,
                    endpoint,
                });
                if (result?.success && result.data) {
                    if (append) {
                        dispatch(appendNotifications(result.data));
                    } else {
                        dispatch(setNotifications(result.data));
                    }
                    setTotalCount(result.data.totalCount || 0);
                }
            } catch (err) {
                console.error("Failed to fetch notifications:", err);
            } finally {
                setLoadingMore(false);
            }
        },
        [dispatch]
    );

    // Calculate hasMore from loaded items vs totalCount
    const hasMore = items.length < totalCount;

    // All unread items from loaded data
    const allUnreadItems = items.filter((n) => !n.isRead);
    const hasMoreUnread = allUnreadItems.length > unreadVisibleCount || hasMore;

    // Fetch unread count on mount
    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const result = await callApi({
                    method: METHOD.GET,
                    endpoint: notificationEndPoints.GET_UNREAD_COUNT,
                });
                if (result?.success && result.data) {
                    dispatch(setUnreadCount(result.data.count ?? result.data));
                }
            } catch (err) {
                console.error("Failed to fetch unread count:", err);
            }
        };
        fetchUnread();
    }, [dispatch]);

    // Fetch on open
    useEffect(() => {
        if (isOpen) {
            setPage(1);
            setActiveTab("all");
            setUnreadVisibleCount(PAGE_SIZE);
            fetchNotifications(1, false);
        }
    }, [isOpen, fetchNotifications]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToggle = () => setIsOpen((prev) => !prev);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === "unread") setUnreadVisibleCount(PAGE_SIZE);
    };

    const handleMarkRead = async (notification) => {
        if (!notification.isRead) {
            dispatch(markAsRead(notification.id));
            try {
                await callApi({
                    method: METHOD.PATCH,
                    endpoint: `${notificationEndPoints.MARK_AS_READ}${notification.id}/read`,
                });
            } catch (err) {
                console.error("Failed to mark as read:", err);
            }
        }
    };

    const handleItemClick = async (notification) => {
        await handleMarkRead(notification);

        if (notification.actionUrl) {
            // Has action URL → navigate
            setIsOpen(false);
            navigate(notification.actionUrl);
        } else {
            // No action URL (e.g. admin announcement) → show detail modal
            setDetailModal(notification);
        }
    };

    const handleMarkAllRead = async () => {
        dispatch(markAllAsRead());
        try {
            await callApi({
                method: METHOD.PATCH,
                endpoint: notificationEndPoints.MARK_ALL_AS_READ,
            });
        } catch (err) {
            console.error("Failed to mark all as read:", err);
        }
    };

    const handleLoadMore = () => {
        if (activeTab === "unread") {
            // Show more unread items client-side
            setUnreadVisibleCount((prev) => prev + PAGE_SIZE);
            // Also load more from server if we're near the end
            if (allUnreadItems.length <= unreadVisibleCount + PAGE_SIZE && hasMore) {
                const nextPage = page + 1;
                setPage(nextPage);
                fetchNotifications(nextPage, true);
            }
        } else {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchNotifications(nextPage, true);
        }
    };

    // Display items with pagination
    const displayItems =
        activeTab === "unread"
            ? allUnreadItems.slice(0, unreadVisibleCount)
            : items;

    const showLoadMore =
        activeTab === "all" ? hasMore : hasMoreUnread;

    return (
        <div className="noti-wrapper" ref={dropdownRef}>
            <button className="noti-bell" onClick={handleToggle} title="Notifications">
                <NotificationsNoneOutlinedIcon />
                {unreadCount > 0 && (
                    <span className="noti-badge">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="noti-panel">
                    {/* Header */}
                    <div className="noti-header">
                        <h3>{t("notifications.title")}</h3>
                    </div>

                    {/* Tabs */}
                    <div className="noti-tabs">
                        <button
                            className={`noti-tab ${activeTab === "all" ? "active" : ""}`}
                            onClick={() => handleTabChange("all")}
                        >
                            {t("notifications.tabs.all")}
                        </button>
                        <button
                            className={`noti-tab ${activeTab === "unread" ? "active" : ""}`}
                            onClick={() => handleTabChange("unread")}
                        >
                            {t("notifications.tabs.unread")}{unreadCount > 0 ? ` (${unreadCount})` : ""}
                        </button>
                    </div>

                    {/* List */}
                    <div className="noti-list">
                        {displayItems.length === 0 ? (
                            <div className="noti-empty">
                                <NotificationsNoneOutlinedIcon style={{ fontSize: 44, opacity: 0.25 }} />
                                <p>
                                    {activeTab === "unread"
                                        ? t("notifications.empty_unread")
                                        : t("notifications.empty")}
                                </p>
                            </div>
                        ) : (
                            displayItems.map((n) => (
                                <NotificationItem
                                    key={n.id}
                                    notification={n}
                                    onClick={handleItemClick}
                                    t={t}
                                />
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="noti-footer">
                        {showLoadMore && displayItems.length > 0 && (
                            <button
                                className="noti-load-more"
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                            >
                                {loadingMore ? t("notifications.loading") : t("notifications.load_more")}
                            </button>
                        )}
                        {unreadCount > 0 && (
                            <button className="noti-mark-all" onClick={handleMarkAllRead}>
                                <DoneAllIcon style={{ fontSize: 16 }} />
                                {t("notifications.mark_all_read")}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Detail Modal — for notifications without actionUrl */}
            {detailModal && (
                <NotificationDetailModal
                    notification={detailModal}
                    onClose={() => setDetailModal(null)}
                    t={t}
                />
            )}
        </div>
    );
}

/* ─── Individual notification item ─── */
function NotificationItem({ notification, onClick, t }) {
    const config = getNotificationConfig(notification.type);
    const Icon = config.icon;

    return (
        <button
            className={`noti-item ${!notification.isRead ? "unread" : ""}`}
            onClick={() => onClick(notification)}
        >
            {/* Type icon avatar */}
            <div
                className="noti-item-avatar"
                style={{ backgroundColor: config.bg, color: config.color }}
            >
                <Icon style={{ fontSize: 22 }} />
            </div>

            {/* Content */}
            <div className="noti-item-body">
                <p className="noti-item-text">
                    <span className="noti-item-title">
                        {t(`notifications.types.${notification.type}.title`, { defaultValue: notification.title })}
                    </span>{" "}
                    {t(`notifications.types.${notification.type}.message`, { 
                        defaultValue: notification.message,
                        ...notification.data 
                    })}
                </p>
                <div className="noti-item-meta">
                <span className="noti-item-time">{formatTimeAgo(notification.createdAt, t)}</span>
                </div>
            </div>

            {/* Unread dot */}
            {!notification.isRead && (
                <div className="noti-item-dot">
                    <CircleIcon style={{ fontSize: 10, color: "var(--mui-palette-primary-main)" }} />
                </div>
            )}
        </button>
    );
}

/* ─── Detail Modal — shows full notification content ─── */
function NotificationDetailModal({ notification, onClose, t }) {
    const config = getNotificationConfig(notification.type);
    const Icon = config.icon;

    // Close on backdrop click
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    // Close on Escape
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    return (
        <div className="noti-modal-backdrop" onClick={handleBackdropClick}>
            <div className="noti-modal">
                <div className="noti-modal-header">
                    <div
                        className="noti-modal-icon"
                        style={{ backgroundColor: config.bg, color: config.color }}
                    >
                        <Icon style={{ fontSize: 24 }} />
                    </div>
                    <div className="noti-modal-header-text">
                        <h4>{t(`notifications.types.${notification.type}.title`, { defaultValue: notification.title })}</h4>
                        <span className="noti-modal-time">
                            {formatTimeAgo(notification.createdAt, t)}
                        </span>
                    </div>
                    <button className="noti-modal-close" onClick={onClose}>
                        <CloseIcon style={{ fontSize: 20 }} />
                    </button>
                </div>
                <div className="noti-modal-body">
                    <p>
                        {t(`notifications.types.${notification.type}.message`, { 
                            defaultValue: notification.message,
                            ...notification.data 
                        })}
                    </p>
                </div>
            </div>
        </div>
    );
}
