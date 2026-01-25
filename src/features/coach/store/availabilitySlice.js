import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    getAvailabilitiesByMonth,
    createAvailability,
    updateAvailability,
    deleteAvailability,
} from "../services/availabilityApi";

export const fetchAvailabilitiesByMonth = createAsyncThunk(
    "availability/fetchByMonth",
    async ({ interviewerId, month, year }, { rejectWithValue }) => {
        try {
            const data = await getAvailabilitiesByMonth(interviewerId, month, year);
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const addAvailability = createAsyncThunk(
    "availability/create",
    async (payload, { rejectWithValue }) => {
        try {
            const data = await createAvailability(payload);
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const editAvailability = createAsyncThunk(
    "availability/update",
    async ({ id, payload }, { rejectWithValue }) => {
        try {
            await updateAvailability(id, payload);
            return { id, ...payload };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const removeAvailability = createAsyncThunk(
    "availability/delete",
    async (id, { rejectWithValue }) => {
        try {
            await deleteAvailability(id);
            return id;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    availabilities: [],
    loading: false,
    error: null,
    selectedAvailability: null,
};

const availabilitySlice = createSlice({
    name: "availability",
    initialState,
    reducers: {
        setSelectedAvailability: (state, action) => {
            state.selectedAvailability = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch availabilities
        builder
            .addCase(fetchAvailabilitiesByMonth.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAvailabilitiesByMonth.fulfilled, (state, action) => {
                state.loading = false;
                state.availabilities = action.payload;
            })
            .addCase(fetchAvailabilitiesByMonth.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Create availability
        builder
            .addCase(addAvailability.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addAvailability.fulfilled, (state, action) => {
                state.loading = false;
                // Refresh list by re-fetching or add to local state
            })
            .addCase(addAvailability.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Update availability
        builder
            .addCase(editAvailability.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(editAvailability.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.availabilities.findIndex(
                    (a) => a.id === action.payload.id
                );
                if (index !== -1) {
                    state.availabilities[index] = {
                        ...state.availabilities[index],
                        ...action.payload,
                    };
                }
            })
            .addCase(editAvailability.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Delete availability
        builder
            .addCase(removeAvailability.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(removeAvailability.fulfilled, (state, action) => {
                state.loading = false;
                state.availabilities = state.availabilities.filter(
                    (a) => a.id !== action.payload
                );
            })
            .addCase(removeAvailability.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { setSelectedAvailability, clearError } = availabilitySlice.actions;
export default availabilitySlice.reducer;
