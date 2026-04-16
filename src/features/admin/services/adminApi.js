import { BE_BASE_URL } from "../../../common/constants/env";

const ADMIN_BASE_URL = `${BE_BASE_URL}/admin`;

export const adminEndPoints = {
    GET_ANALYTICS: `${ADMIN_BASE_URL}/stats`,
    GET_STATS: `${ADMIN_BASE_URL}/stats`,
    GET_USERS: `${ADMIN_BASE_URL}/users`,
    FILTER_USERS: `${ADMIN_BASE_URL}/users/filter`,
    GET_COMPANIES: `${ADMIN_BASE_URL}/companies`,
    GET_PAYMENTS: `${ADMIN_BASE_URL}/payments`,
    GET_TRANSACTIONS: `${ADMIN_BASE_URL}/transactions`,
    GET_FEEDBACKS: `${ADMIN_BASE_URL}/feedbacks`,
    GET_INTERVIEWERS: `${ADMIN_BASE_URL}/interviewers`,
    // Dashboard Endpoints
    GET_DASHBOARD_STATS: `${ADMIN_BASE_URL}/stats`,
    GET_DASHBOARD_CHARTS: `${ADMIN_BASE_URL}/charts`,
    GET_TOP_COACHES: `${ADMIN_BASE_URL}/top-coaches`,
    GET_ATTENTION_QUEUE: `${ADMIN_BASE_URL}/attention-queue`,

    // User Management Endpoints
    CREATE_USER: `${ADMIN_BASE_URL}/users`,
    GET_USER_BY_ID: (id) => `${ADMIN_BASE_URL}/users/${id}`,
    UPDATE_USER: (id) => `${ADMIN_BASE_URL}/users/${id}`,
    DELETE_USER: (id) => `${ADMIN_BASE_URL}/users/${id}`,
    ACTIVATE_USER: (id) => `${ADMIN_BASE_URL}/users/${id}/activate`,

    // Room Reports Endpoints
    GET_ROOM_REPORTS: `${ADMIN_BASE_URL}/room-reports`,
    GET_ROOM_AUDIT_LOGS: (roomId) => `${ADMIN_BASE_URL}/room-reports/${roomId}/audit-logs`,
    GET_ROOM_REPORT_DETAIL: (roomId) => `${ADMIN_BASE_URL}/room-reports/${roomId}/detail`,
    RESOLVE_ROOM_REPORT: `${ADMIN_BASE_URL}/resolve-room-report`,
    DOWNLOAD_FULL_RECORDING: (recordingSessionId) => `${BE_BASE_URL}/ai/play-recording/${recordingSessionId}`,

    // Question Reports Endpoints
    GET_QUESTIONS: `${BE_BASE_URL}/questions`,
    GET_QUESTION_REPORTS: `${BE_BASE_URL}/questions/reports`,
    UPDATE_QUESTION_REPORT_STATUS: (reportId) => `${BE_BASE_URL}/questions/reports/${reportId}/status`,
    DELETE_QUESTION: (questionId) => `${BE_BASE_URL}/questions/${questionId}`,
};
