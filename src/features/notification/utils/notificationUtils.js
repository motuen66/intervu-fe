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
    BookingNew: { icon: CalendarMonthIcon, color: p.secondary.main, bg: p.primary.main },
    BookingAccepted: { icon: CheckCircleIcon, color: p.secondary.main, bg: p.primary.main },
    BookingRejected: { icon: CancelIcon, color: p.secondary.main, bg: p.primary.main },
    PaymentSuccess: { icon: PaymentIcon, color: p.secondary.main, bg: p.primary.main },
    RescheduleRequested: { icon: SwapHorizIcon, color: p.secondary.main, bg: p.primary.main },
    RescheduleAccepted: { icon: EventAvailableIcon, color: p.secondary.main, bg: p.primary.main },
    RescheduleRejected: { icon: EventBusyIcon, color: p.secondary.main, bg: p.primary.main },
    InterviewReminder: { icon: AccessAlarmIcon, color: p.secondary.main, bg: p.primary.main },
    FeedbackReceived: { icon: RateReviewIcon, color: p.secondary.main, bg: p.primary.main },
    AiAnalysisCompleted: { icon: AutoAwesomeIcon, color: p.secondary.main, bg: p.primary.main },
    SystemAnnouncement: { icon: CampaignIcon, color: p.secondary.main, bg: p.primary.main },
};

const DEFAULT_CONFIG = { icon: NotificationsIcon, color: p.secondary.main, bg: p.primary.main };

export function getNotificationConfig(type) {
    return TYPE_CONFIG[type] || DEFAULT_CONFIG;
}

export function formatTimeAgo(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
    if (diffWeek < 4) return `${diffWeek} week${diffWeek > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
