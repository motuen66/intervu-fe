import { BE_BASE_URL } from "../../../common/constants/env";
import { callApi } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";

const BASE_URL = `${BE_BASE_URL}/dashboard`;

export const getCoachDashboardStats = async (period = "month") => {
    const result = await callApi({
        method: METHOD.GET,
        endpoint: `${BASE_URL}/stats`,
        arg: { period },
    });
    return result.data;
};

export const getCoachUpcomingSessions = async () => {
    const result = await callApi({
        method: METHOD.GET,
        endpoint: `${BASE_URL}/sessions`,
    });
    return result.data;
};

export const getCoachPendingRequests = async () => {
    const result = await callApi({
        method: METHOD.GET,
        endpoint: `${BASE_URL}/requests`,
    });
    return result.data;
};

export const getCoachServiceDistribution = async () => {
    const result = await callApi({
        method: METHOD.GET,
        endpoint: `${BASE_URL}/services`,
    });
    return result.data;
};

export const getCoachFeedbackWall = async () => {
    const result = await callApi({
        method: METHOD.GET,
        endpoint: `${BASE_URL}/feedbacks`,
    });
    return result.data;
};

export const getCoachAvailability = async () => {
    const result = await callApi({
        method: METHOD.GET,
        endpoint: `${BASE_URL}/availability`,
    });
    return result.data;
};

export const respondToBookingRequest = async (requestId, isApproved) => {
    const result = await callApi({
        method: METHOD.POST,
        endpoint: `${BE_BASE_URL}/booking-requests/${requestId}/respond`,
        arg: { isApproved },
        displaySuccessMessage: true,
        alertErrorMessage: true,
    });
    return result.data;
};
