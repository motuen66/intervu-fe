import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { smartSearchEndPoints } from "../services/smartSearchApi";

export const extractDocument = createAsyncThunk(
    "smartSearch/extractDocument",
    async ({ file, docType }, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append("File", file);
            formData.append("DocType", docType);
            const response = await axios.post(smartSearchEndPoints.EXTRACT_DOCUMENT, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            
            // Catch graceful extraction failures from Python (e.g. Gemini quota)
            if (response.data?.data?.error) {
                return rejectWithValue(response.data.data.error);
            }
            
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Extraction failed");
        }
    }
);

export const searchCoaches = createAsyncThunk(
    "smartSearch/searchCoaches",
    async (payload, { rejectWithValue }) => {
        try {
            const response = await axios.post(smartSearchEndPoints.SEARCH_COACHES, payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Smart search failed");
        }
    }
);

const smartSearchSlice = createSlice({
    name: "smartSearch",
    initialState: {
        extractedData: null,
        extracting: false,
        results: [],
        loading: false,
        error: null,
    },
    reducers: {
        clearResults(state) {
            state.results = [];
            state.extractedData = null;
            state.error = null;
        },
        updateExtractedData(state, action) {
            state.extractedData = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            // Extraction Cases
            .addCase(extractDocument.pending, (state) => {
                state.extracting = true;
                state.error = null;
                state.extractedData = null;
            })
            .addCase(extractDocument.fulfilled, (state, action) => {
                state.extracting = false;
                state.extractedData = action.payload?.data || null;
            })
            .addCase(extractDocument.rejected, (state, action) => {
                state.extracting = false;
                state.error = action.payload;
            })
            // Search Cases
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

export const { clearResults, updateExtractedData } = smartSearchSlice.actions;
export default smartSearchSlice.reducer;
