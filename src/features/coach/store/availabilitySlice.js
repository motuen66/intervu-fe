import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    getAvailabilitiesByMonth,
    createAvailability,
    updateAvailability,
    deleteAvailability,
    deleteAvailabilityRange,
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

/**
 * Create availability blocks from a range.
 * payload: { coachId, rangeStartTime, rangeEndTime }
 */
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

/**
 * Update availability range (diff-based).
 * payload: { coachId, originalStartTime, originalEndTime, newStartTime, newEndTime }
 */
export const editAvailability = createAsyncThunk(
    "availability/update",
    async (payload, { rejectWithValue }) => {
        try {
            await updateAvailability(payload);
            return payload;
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

/**
 * Delete all blocks in a range.
 * payload: { coachId, rangeStartTime, rangeEndTime }
 */
export const removeAvailabilityRange = createAsyncThunk(
    "availability/deleteRange",
    async (payload, { rejectWithValue }) => {
        try {
            await deleteAvailabilityRange(payload);
            return payload;
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
    latestFetchRequestId: null,
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
            .addCase(fetchAvailabilitiesByMonth.pending, (state, action) => {
                state.loading = true;
                state.error = null;
                state.latestFetchRequestId = action.meta.requestId;
            })
            .addCase(fetchAvailabilitiesByMonth.fulfilled, (state, action) => {
                if (state.latestFetchRequestId && state.latestFetchRequestId !== action.meta.requestId) {
                    return;
                }
                state.loading = false;
                state.availabilities = action.payload;
            })
            .addCase(fetchAvailabilitiesByMonth.rejected, (state, action) => {
                if (state.latestFetchRequestId && state.latestFetchRequestId !== action.meta.requestId) {
                    return;
                }
                state.loading = false;
                state.error = action.payload;
            });

        // Create availability
        builder
            .addCase(addAvailability.pending, (state) => {
                state.error = null;
            })
            .addCase(addAvailability.fulfilled, (state, action) => {
                // After bulk create, we re-fetch to get all new blocks
            })
            .addCase(addAvailability.rejected, (state, action) => {
                state.error = action.payload;
            });

        // Update availability (range diff)
        builder
            .addCase(editAvailability.pending, (state) => {
                state.error = null;
            })
            .addCase(editAvailability.fulfilled, (state, action) => {
                // After range update, we re-fetch to get current state
            })
            .addCase(editAvailability.rejected, (state, action) => {
                state.error = action.payload;
            });

        // Delete single availability
        builder
            .addCase(removeAvailability.pending, (state) => {
                state.error = null;
            })
            .addCase(removeAvailability.fulfilled, () => {
                // We rely on a follow-up month re-fetch to refresh the list.
                // Avoid optimistic removal by id because FE can receive duplicate ids
                // for different rendered ranges, which can hide unrelated events.
            })
            .addCase(removeAvailability.rejected, (state, action) => {
                state.error = action.payload;
            });

        // Delete availability range
        builder
            .addCase(removeAvailabilityRange.pending, (state) => {
                state.error = null;
            })
            .addCase(removeAvailabilityRange.fulfilled, (state, action) => {
                // After range delete, we re-fetch to get current state
            })
            .addCase(removeAvailabilityRange.rejected, (state, action) => {
                state.error = action.payload;
            });
    },
});

export const { setSelectedAvailability, clearError } = availabilitySlice.actions;
export default availabilitySlice.reducer;
