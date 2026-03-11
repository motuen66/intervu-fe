import { BE_BASE_URL } from "../../../common/constants/env";
import { callApi } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";

const BASE_URL = `${BE_BASE_URL}/booking-requests`;

export const bookingRequestEndPoints = {
    CREATE_JD_INTERVIEW: `${BASE_URL}/jd-interview`,
    RESPOND: (id) => `${BASE_URL}/${id}/respond`,
    PAY: (id) => `${BASE_URL}/${id}/pay`,
    CANCEL: (id) => `${BASE_URL}/${id}/cancel`,
    GET_LIST: BASE_URL,
    GET_DETAIL: (id) => `${BASE_URL}/${id}`,
};

/**
 * Flow C: Candidate submits JD + CV for a multi-round interview plan
 */
export const createJDBookingRequest = async (payload) => {
    const result = await callApi({
        method: METHOD.POST,
        endpoint: bookingRequestEndPoints.CREATE_JD_INTERVIEW,
        arg: payload,
    });
    return result.data;
};

/**
 * Coach accepts or rejects a pending booking request
 * @param {string} id - Booking request ID
 * @param {{ isApproved: boolean, rejectionReason?: string }} payload
 */
export const respondToBookingRequest = async (id, payload) => {
    const result = await callApi({
        method: METHOD.POST,
        endpoint: bookingRequestEndPoints.RESPOND(id),
        arg: payload,
    });
    return result.data;
};

/**
 * Get booking requests for the authenticated user (with filters + pagination)
 * @param {{
 *   page?: number,
 *   pageSize?: number,
 *   type?: number,
 *   statuses?: number[]
 * }} filters
 */
export const getBookingRequests = async (filters = {}) => {
    // Build params manually for array support (statuses)
    const params = new URLSearchParams();
    if (filters.page) params.append("page", filters.page);
    if (filters.pageSize) params.append("pageSize", filters.pageSize);
    if (filters.type !== undefined && filters.type !== null) params.append("type", filters.type);
    if (filters.statuses?.length) {
        filters.statuses.forEach((s) => params.append("statuses", s));
    }

    const url = `${bookingRequestEndPoints.GET_LIST}?${params.toString()}`;
    const result = await callApi({
        method: METHOD.GET,
        endpoint: url,
    });
    return result.data; // { items, totalCount, page, pageSize }
};

/**
 * Get a single booking request by ID
 * @param {string} id
 */
export const getBookingRequestDetail = async (id) => {
    const result = await callApi({
        method: METHOD.GET,
        endpoint: bookingRequestEndPoints.GET_DETAIL(id),
    });
    return result.data;
};

/**
 * Pay for an Accepted booking request (generates PayOS checkout URL)
 * @param {string} id - Booking request ID
 * @param {{ returnUrl: string }} payload
 * @returns {{ isPaid: boolean, checkOutUrl: string? }}
 */
export const payBookingRequest = async (id, payload) => {
    const result = await callApi({
        method: METHOD.POST,
        endpoint: bookingRequestEndPoints.PAY(id),
        arg: payload,
    });
    return result.data; // { isPaid, checkOutUrl }
};

/**
 * Cancel a Pending or Accepted booking request
 * @param {string} id - Booking request ID
 */
export const cancelBookingRequest = async (id) => {
    const result = await callApi({
        method: METHOD.POST,
        endpoint: bookingRequestEndPoints.CANCEL(id),
    });
    return result.data;
};
