import { BE_BASE_URL } from "../../../common/constants/env";
import { callApi, axiosInstance } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";
import { AVAILABILITY_SLOTS_STATUS } from "../../../common/constants/status";

export const availabilityEndPoints = {
    GET_AVAILABILITIES: BE_BASE_URL + "/availabilities",
    CREATE_AVAILABILITY: BE_BASE_URL + "/availabilities",
    UPDATE_AVAILABILITY: BE_BASE_URL + "/availabilities",
    DELETE_AVAILABILITY: BE_BASE_URL + "/availabilities",
    DELETE_AVAILABILITY_RANGE: BE_BASE_URL + "/availabilities/range",
};

export const getAvailabilitiesByMonth = async (interviewerId, month, year) => {
    const result = await callApi({
        method: METHOD.GET,
        endpoint: `${availabilityEndPoints.GET_AVAILABILITIES}/${interviewerId}?month=${month}&year=${year}`,
    });

    const normalizeTime = (t) => {
        if (!t) return t;
        const hasTimezone = /[zZ]$|[+-]\d{2}:\d{2}$/.test(t);
        return hasTimezone ? t : `${t}Z`;
    };

    const schedule = result?.data ?? {};
    const freeSlots = Array.isArray(schedule?.freeSlots) ? schedule.freeSlots : Array.isArray(schedule) ? schedule : [];
    const bookedSlots = Array.isArray(schedule?.bookedSlots) ? schedule.bookedSlots : [];

    const normalizedFree = freeSlots.map((item) => ({
        ...item,
        id: item.id,
        coachId: item.coachId ?? interviewerId,
        startTime: normalizeTime(item.startTime),
        endTime: normalizeTime(item.endTime),
        status: AVAILABILITY_SLOTS_STATUS.AVAILABLE,
    }));

    const normalizedBooked = bookedSlots.map((item, idx) => ({
        ...item,
        id: item.bookingId ?? item.id ?? `booked-${idx}-${item.startTime}`,
        coachId: interviewerId,
        startTime: normalizeTime(item.startTime),
        endTime: normalizeTime(item.endTime),
        status: AVAILABILITY_SLOTS_STATUS.BOOKED,
        isBooked: true,
    }));

    const merged = [...normalizedFree, ...normalizedBooked];
    console.log("Normalized schedule (free + booked):", merged);
    return merged;
};

/**
 * Create availability blocks by providing a range.
 * Backend splits the range into 30-min blocks.
 * @param {{ coachId: string, rangeStartTime: string, rangeEndTime: string }} payload
 */
export const createAvailability = async (payload) => {
    const result = await callApi({
        method: METHOD.POST,
        endpoint: availabilityEndPoints.CREATE_AVAILABILITY,
        arg: payload,
    });
    return result.data;
};

/**
 * Update availability by providing original and new range.
 * Backend computes the diff and adds/removes 30-min blocks.
 * @param {{ coachId: string, originalStartTime: string, originalEndTime: string, newStartTime: string, newEndTime: string }} payload
 */
export const updateAvailability = async (payload) => {
    const result = await callApi({
        method: METHOD.PUT,
        endpoint: availabilityEndPoints.UPDATE_AVAILABILITY,
        arg: payload,
    });
    return result;
};

/**
 * Delete a single 30-min block by ID.
 */
export const deleteAvailability = async (availabilityId) => {
    const result = await callApi({
        method: METHOD.DELETE,
        endpoint: `${availabilityEndPoints.DELETE_AVAILABILITY}/${availabilityId}`,
    });
    return result;
};

/**
 * Delete all blocks within a range.
 * @param {{ coachId: string, rangeStartTime: string, rangeEndTime: string }} payload
 */
export const deleteAvailabilityRange = async (payload) => {
    const response = await axiosInstance({
        method: METHOD.DELETE,
        url: availabilityEndPoints.DELETE_AVAILABILITY_RANGE,
        data: payload,
        headers: { "Content-Type": "application/json" },
    });
    return response.data;
};
