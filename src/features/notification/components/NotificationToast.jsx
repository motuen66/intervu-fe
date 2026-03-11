import toast from "react-hot-toast";
import { getNotificationConfig } from "../utils/notificationUtils";

const TOAST_DURATION = 5000;

/**
 * Shows a rich notification toast in the bottom-right corner
 * with a countdown progress bar and close button.
 */
export function showNotificationToast(notification) {
    const config = getNotificationConfig(notification.type);
    const Icon = config.icon;

    toast.custom(
        (t) => (
            <div
                className={`notification-toast ${t.visible ? "show" : "hide"}`}
                onClick={() => {
                    toast.dismiss(t.id);
                    if (notification.actionUrl) {
                        window.location.href = notification.actionUrl;
                    }
                }}
            >
                <div
                    className="notification-toast-icon"
                    style={{ backgroundColor: config.bg, color: config.color }}
                >
                    <Icon style={{ fontSize: 20 }} />
                </div>
                <div className="notification-toast-body">
                    <p className="notification-toast-title">{notification.title}</p>
                    <p className="notification-toast-message">{notification.message}</p>
                </div>
                <button
                    className="notification-toast-close"
                    onClick={(e) => {
                        e.stopPropagation();
                        toast.dismiss(t.id);
                    }}
                >
                    ×
                </button>
                {/* Progress bar countdown */}
                <div className="notification-toast-progress">
                    <div
                        className="notification-toast-progress-bar"
                        style={{
                            animationDuration: `${TOAST_DURATION}ms`,
                            backgroundColor: config.color,
                        }}
                    />
                </div>
            </div>
        ),
        {
            duration: TOAST_DURATION,
            position: "bottom-right",
        }
    );
}
