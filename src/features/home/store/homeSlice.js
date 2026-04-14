import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { homeEndPoints } from "../services/homeApi";
import { startGlobalLoading, stopGlobalLoading } from '../../../common/store/authSlice';

export const fetchInterviewers = createAsyncThunk(
    'home/fetchInterviewers',
    async (params = {}, {rejectWithValue, getState, dispatch}) => {
        try{
            dispatch(startGlobalLoading());
            const { home } = getState();
            const { currentPage, pageSize } = home.pagination;
            const response = await axios.get(homeEndPoints.GET_ALL_INTERVIEWERS, {
                params: {
                    page: params.page || currentPage,
                    pageSize: params.pageSize || pageSize,
                    ...params
                }
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to fetch interviewers');
        } finally {
            dispatch(stopGlobalLoading());
        }
    }
);

export const fetchCompanies = createAsyncThunk(
    'home/fetchCompanies',
    async (_, {rejectWithValue, dispatch}) => {
        try{
            dispatch(startGlobalLoading());
            const response = await axios.get(homeEndPoints.GET_ALL_COMPANIES, {
                params: {
                    page: 1,
                    pageSize: 100
                }
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to fetch companies');
        } finally {
            dispatch(stopGlobalLoading());
        }
    }
);

export const fetchSkills = createAsyncThunk(
    'home/fetchSkills',
    async (_, {rejectWithValue, dispatch}) => {
        try{
            dispatch(startGlobalLoading());
            const response = await axios.get(homeEndPoints.GET_ALL_SKILLS, {
                params: {
                    page: 1,
                    pageSize: 100
                }
            });
            return response.data;
        }
        catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to fetch skills');
        } finally {
            dispatch(stopGlobalLoading());
        }
    }
);

export const fetchIndustries = createAsyncThunk(
    'home/fetchIndustries',
    async (_, {rejectWithValue, dispatch}) => {
        try{
            dispatch(startGlobalLoading());
            const response = await axios.get(homeEndPoints.GET_ALL_INDUSTRIES, {
                params: {
                    page: 1,
                    pageSize: 100
                }
            });
            return response.data;
        }
        catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to fetch industries');
        } finally {
            dispatch(stopGlobalLoading());
        }
    }
);

const homeSlice = createSlice({
    name: 'home',
    initialState: {
        interviewers: [],
        companies: [],
        skills: [],
        industries: [],
        // UI states
        loading: false,
        error: null,

        // Pagination
        pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            pageSize: 24
        },

        // Filters
        filters: {
            company: null,
            industry: null,
            skill: null,
            skillIds: [],
            levels: [],
            minExperienceYears: '',
            maxExperienceYears: '',
            minPrice: '',
            maxPrice: '',
            searchTerm: ''
        },
    },
    reducers: {
        setFilters(state, action) {
            state.filters = {...state.filters, ...action.payload};
            state.pagination.currentPage = 1; // Reset to page 1 when filters change
        },

        clearFilters(state) {
            state.filters = {
                company: null,
                industry: null,
                skill: null,
                skillIds: [],
                levels: [],
                minExperienceYears: '',
                maxExperienceYears: '',
                minPrice: '',
                maxPrice: '',
                searchTerm: ''
            };
            state.pagination.currentPage = 1;
        },

        setPage(state, action) {
            state.pagination.currentPage = action.payload;
        },

        clearError(state) {
            state.error = null;
        }
    },

    extraReducers: (builder) => {
        builder
            //slice for interviewers
            .addCase(fetchInterviewers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchInterviewers.fulfilled, (state, action) => {
                state.loading = false;
                // Response: { success, message, data: { items, totalItems, currentPage, totalPages } }
                const data = action.payload?.data || {};
                state.interviewers = data.items || [];
                state.pagination.totalItems = data.totalItems || 0;
                state.pagination.currentPage = data.currentPage || 1;
                state.pagination.totalPages = data.totalPages || 1;
            })
            .addCase(fetchInterviewers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            //slice for companies
            .addCase(fetchCompanies.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCompanies.fulfilled, (state, action) => {
                state.loading = false;
                // Response: { success, message, data: { items, ... } }
                state.companies = action.payload?.data?.items || [];
            })
            .addCase(fetchCompanies.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            //slice for skills
            .addCase(fetchSkills.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSkills.fulfilled, (state, action) => {
                state.loading = false;
                // Response: { success, message, data: { items, ... } }
                state.skills = action.payload?.data?.items || [];
            })
            .addCase(fetchSkills.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            //slice for industries
            .addCase(fetchIndustries.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchIndustries.fulfilled, (state, action) => {
                state.loading = false;
                state.industries = action.payload?.data?.items || [];
            })
            .addCase(fetchIndustries.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { setFilters, clearFilters, setPage, clearError } = homeSlice.actions;

export default homeSlice.reducer;