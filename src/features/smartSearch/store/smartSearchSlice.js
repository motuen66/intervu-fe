import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { smartSearchEndPoints } from "../services/smartSearchApi";

export const searchCoaches = createAsyncThunk(
    "smartSearch/searchCoaches",
    async (query, { rejectWithValue }) => {
        try {
            const response = await axios.post(smartSearchEndPoints.SEARCH_COACHES, { query });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Smart search failed");
        }
    }
);

const smartSearchSlice = createSlice({
    name: "smartSearch",
    initialState: {
        results: [],
        loading: false,
        error: null,
    },
    reducers: {
        clearResults(state) {
            state.results = [];
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(searchCoaches.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.results = [];
            })
            .addCase(searchCoaches.fulfilled, (state, action) => {
                state.loading = false;
                state.results = action.payload?.data || [];
            })
            .addCase(searchCoaches.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearResults } = smartSearchSlice.actions;
export default smartSearchSlice.reducer;
