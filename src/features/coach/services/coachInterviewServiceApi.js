import { BE_BASE_URL } from "../../../common/constants/env";
import { callApi } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";

const BASE_URL = `${BE_BASE_URL}/coach-interview-services`;

export const coachInterviewServiceEndPoints = {
    GET_BY_COACH: (coachId) => `${BASE_URL}/coach/${coachId}`,
    GET_MINE: `${BASE_URL}/mine`,
    CREATE: BASE_URL,
    UPDATE: (serviceId) => `${BASE_URL}/${serviceId}`,
    DELETE: (serviceId) => `${BASE_URL}/${serviceId}`,
};

/**
 * Get all interview services offered by a specific coach (public)
 */
export const getCoachInterviewServices = async (coachId) => {
    const result = await callApi({
        method: METHOD.GET,
        endpoint: coachInterviewServiceEndPoints.GET_BY_COACH(coachId),
    });
    return result.data;
};

/**
 * Get all interview services for the authenticated coach
 */
export const getMyInterviewServices = async () => {
    const result = await callApi({
        method: METHOD.GET,
        endpoint: coachInterviewServiceEndPoints.GET_MINE,
        alertErrorMessage: true,
    });
    return result.data;
};

/**
 * Coach adds a new interview service
 * @param {{ interviewTypeId: string, price: number, durationMinutes: number }} payload
 */
export const createCoachInterviewService = async (payload) => {
    const result = await callApi({
        method: METHOD.POST,
        endpoint: coachInterviewServiceEndPoints.CREATE,
        arg: payload,
        alertErrorMessage: true,
        displaySuccessMessage: true,
    });
    return result.data;
};

/**
 * Coach updates an existing interview service
 * @param {string} serviceId
 * @param {{ price: number, durationMinutes: number }} payload
 */
export const updateCoachInterviewService = async (serviceId, payload) => {
    const result = await callApi({
        method: METHOD.PUT,
        endpoint: coachInterviewServiceEndPoints.UPDATE(serviceId),
        arg: payload,
        alertErrorMessage: true,
        displaySuccessMessage: true,
    });
    return result.data;
};

/**
 * Coach deletes an interview service
 * @param {string} serviceId
 */
export const deleteCoachInterviewService = async (serviceId) => {
    const result = await callApi({
        method: METHOD.DELETE,
        endpoint: coachInterviewServiceEndPoints.DELETE(serviceId),
        alertErrorMessage: true,
        displaySuccessMessage: true,
    });
    return result;
};
