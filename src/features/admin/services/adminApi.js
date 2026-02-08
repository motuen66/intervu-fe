import { BE_BASE_URL } from "../../../common/constants/env";

const ADMIN_BASE_URL = `${BE_BASE_URL}/admin`;

export const adminEndPoints = {
    GET_STATS: `${ADMIN_BASE_URL}/stats`,
    GET_USERS: `${ADMIN_BASE_URL}/users`,
    FILTER_USERS: `${ADMIN_BASE_URL}/users/filter`,
    GET_COMPANIES: `${ADMIN_BASE_URL}/companies`,
    GET_PAYMENTS: `${ADMIN_BASE_URL}/payments`,
    GET_FEEDBACKS: `${ADMIN_BASE_URL}/feedbacks`,
    GET_INTERVIEWERS: `${ADMIN_BASE_URL}/interviewers`,
    
    // User Management Endpoints
    CREATE_USER: `${ADMIN_BASE_URL}/users`,
    GET_USER_BY_ID: (id) => `${ADMIN_BASE_URL}/users/${id}`,
    UPDATE_USER: (id) => `${ADMIN_BASE_URL}/users/${id}`,
    DELETE_USER: (id) => `${ADMIN_BASE_URL}/users/${id}`,
};
