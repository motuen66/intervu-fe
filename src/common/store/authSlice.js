import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    userData: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null,
    token: localStorage.getItem("token") ? JSON.parse(localStorage.getItem("token")) : null,
    loading: false,
    loadingCount: 0,
};

const authSlice = createSlice({
    name: "auth",
    initialState: initialState,
    reducers: {
        setUserData(state, value) {
            state.userData = value.payload;
        },
        setToken(state, value) {
            state.token = value.payload;
        },
        setLoading(state, value) {
            state.loading = value.payload;
            state.loadingCount = value.payload ? Math.max(1, state.loadingCount) : 0;
        },
        startGlobalLoading(state) {
            state.loadingCount += 1;
            state.loading = true;
        },
        stopGlobalLoading(state) {
            state.loadingCount = Math.max(0, state.loadingCount - 1);
            state.loading = state.loadingCount > 0;
        },
    },
});

export const { setUserData, setToken, setLoading, startGlobalLoading, stopGlobalLoading } = authSlice.actions;

export default authSlice.reducer;
