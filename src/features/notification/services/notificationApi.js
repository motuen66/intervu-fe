import { BE_BASE_URL } from "../../../common/constants/env";

export const notificationEndPoints = {
    GET_NOTIFICATIONS: BE_BASE_URL + "/notifications",
    GET_UNREAD_COUNT: BE_BASE_URL + "/notifications/unread-count",
    MARK_AS_READ: BE_BASE_URL + "/notifications/", // + {id}/read
    MARK_ALL_AS_READ: BE_BASE_URL + "/notifications/read-all",
};

// SignalR hub URL (no /api/v1 prefix pattern — use base origin)
export const NOTIFICATION_HUB_URL = BE_BASE_URL.replace("/api/v1", "") + "/api/v1/hubs/notification";
