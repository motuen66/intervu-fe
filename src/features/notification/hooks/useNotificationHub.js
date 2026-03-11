import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import * as signalR from "@microsoft/signalr";
import { NOTIFICATION_HUB_URL } from "../services/notificationApi";
import { addNotification } from "../store/notificationSlice";
import { showNotificationToast } from "../components/NotificationToast";

/**
 * Custom hook to establish SignalR connection to the notification hub.
 * Listens for "ReceiveNotification" events and dispatches to Redux + shows toast.
 *
 * @param {string|null} userId - Current user ID. Connection won't start if null.
 * @param {string|null} token  - JWT token for authentication.
 */
export default function useNotificationHub(userId, token) {
    const dispatch = useDispatch();
    const connectionRef = useRef(null);

    useEffect(() => {
        if (!userId || !token) return;

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${NOTIFICATION_HUB_URL}?userId=${userId}`, {
                accessTokenFactory: () => token,
            })
            .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        connection.on("ReceiveNotification", (notification) => {
            dispatch(addNotification(notification));
            showNotificationToast(notification);
        });

        connection
            .start()
            .then(() => console.log("[SignalR] Notification hub connected"))
            .catch((err) => console.error("[SignalR] Notification hub connection error:", err));

        connectionRef.current = connection;

        return () => {
            connection
                .stop()
                .then(() => console.log("[SignalR] Notification hub disconnected"))
                .catch(() => {});
        };
    }, [userId, token, dispatch]);

    return connectionRef;
}
