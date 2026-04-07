import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PaymentIcon from "@mui/icons-material/Payment";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import AccessAlarmIcon from "@mui/icons-material/AccessAlarm";
import RateReviewIcon from "@mui/icons-material/RateReview";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CampaignIcon from "@mui/icons-material/Campaign";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { theme } from "../../../common/constants/theme";

const p = theme.palette;

const TYPE_CONFIG = {
    BookingNew: { icon: CalendarMonthIcon, color: p.primary.main, bg: p.primary.main + "14" },
    BookingAccepted: { icon: CheckCircleIcon, color: p.success.main, bg: p.success.main + "14" },
    BookingRejected: { icon: CancelIcon, color: p.error.main, bg: p.error.main + "14" },
    PaymentSuccess: { icon: PaymentIcon, color: p.success.main, bg: p.success.main + "14" },
    RescheduleRequested: { icon: SwapHorizIcon, color: p.warning.main, bg: p.warning.main + "14" },
    RescheduleAccepted: { icon: EventAvailableIcon, color: p.success.main, bg: p.success.main + "14" },
    RescheduleRejected: { icon: EventBusyIcon, color: p.error.main, bg: p.error.main + "14" },
    InterviewReminder: { icon: AccessAlarmIcon, color: p.primary.light, bg: p.primary.light + "14" },
    FeedbackReceived: { icon: RateReviewIcon, color: p.secondary.main, bg: p.secondary.main + "14" },
    AiAnalysisCompleted: { icon: AutoAwesomeIcon, color: p.secondary.main, bg: p.secondary.main + "14" },
    SystemAnnouncement: { icon: CampaignIcon, color: p.text.secondary, bg: p.text.secondary + "14" },
};

const DEFAULT_CONFIG = { icon: NotificationsIcon, color: p.primary.main, bg: p.primary.main + "14" };

export function getNotificationConfig(type) {
    return TYPE_CONFIG[type] || DEFAULT_CONFIG;
}

export function formatTimeAgo(dateStr, t) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);

    if (diffSec < 60) return t("notifications.time.just_now");
    if (diffMin < 60) return t("notifications.time.minutes_ago", { count: diffMin });
    if (diffHour < 24) return t("notifications.time.hours_ago", { count: diffHour });
    if (diffDay < 7) return t("notifications.time.days_ago", { count: diffDay });
    if (diffWeek < 4) return t("notifications.time.weeks_ago", { count: diffWeek });
    return date.toLocaleDateString(t("common.date_locale"), { month: "short", day: "numeric" });
}
