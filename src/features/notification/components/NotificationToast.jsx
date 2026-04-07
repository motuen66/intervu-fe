import toast from "react-hot-toast";
import i18n from "../../../i18n";
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
        (toastInstance) => (
            <div
                className={`notification-toast ${toastInstance.visible ? "show" : "hide"}`}
                onClick={() => {
                    toast.dismiss(toastInstance.id);
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
                    <p className="notification-toast-title">
                        {i18n.t(`notifications.types.${notification.type}.title`, { defaultValue: notification.title })}
                    </p>
                    <p className="notification-toast-message">
                        {i18n.t(`notifications.types.${notification.type}.message`, { 
                            defaultValue: notification.message,
                            ...notification.data 
                        })}
                    </p>
                </div>
                <button
                    className="notification-toast-close"
                    onClick={(e) => {
                        e.stopPropagation();
                        toast.dismiss(toastInstance.id);
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
