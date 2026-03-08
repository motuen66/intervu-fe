import { createSlice } from "@reduxjs/toolkit";

const notificationSlice = createSlice({
    name: "notification",
    initialState: {
        items: [],
        unreadCount: 0,
        totalCount: 0,
        page: 1,
        pageSize: 20,
        loading: false,
    },
    reducers: {
        setNotifications(state, action) {
            state.items = action.payload.items;
            state.totalCount = action.payload.totalCount;
            state.unreadCount = action.payload.unreadCount;
            state.page = action.payload.page;
            state.pageSize = action.payload.pageSize;
        },
        appendNotifications(state, action) {
            // Append items from next page, dedup by id
            const existingIds = new Set(state.items.map((n) => n.id));
            const newItems = (action.payload.items || []).filter((n) => !existingIds.has(n.id));
            state.items = [...state.items, ...newItems];
            state.totalCount = action.payload.totalCount;
            state.unreadCount = action.payload.unreadCount;
        },
        addNotification(state, action) {
            // Prepend new real-time notification
            state.items.unshift(action.payload);
            state.unreadCount += 1;
            state.totalCount += 1;
        },
        markAsRead(state, action) {
            const id = action.payload;
            const item = state.items.find((n) => n.id === id);
            if (item && !item.isRead) {
                item.isRead = true;
                state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
        },
        markAllAsRead(state) {
            state.items.forEach((n) => (n.isRead = true));
            state.unreadCount = 0;
        },
        setUnreadCount(state, action) {
            state.unreadCount = action.payload;
        },
        setLoading(state, action) {
            state.loading = action.payload;
        },
    },
});

export const {
    setNotifications,
    appendNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    setUnreadCount,
    setLoading,
} = notificationSlice.actions;

export default notificationSlice.reducer;
