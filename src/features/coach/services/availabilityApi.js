import { BE_BASE_URL } from "../../../common/constants/env";
import { callApi } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";
import { AVAILABILITY_SLOTS_STATUS } from "../../../common/constants/status";

export const availabilityEndPoints = {
    GET_AVAILABILITIES: BE_BASE_URL + "/availabilities",
    CREATE_AVAILABILITY: BE_BASE_URL + "/availabilities",
    UPDATE_AVAILABILITY: BE_BASE_URL + "/availabilities",
    DELETE_AVAILABILITY: BE_BASE_URL + "/availabilities",
};

export const getAvailabilitiesByMonth = async (interviewerId, month, year) => {
    const result = await callApi({
        method: METHOD.GET,
        endpoint: `${availabilityEndPoints.GET_AVAILABILITIES}/${interviewerId}?month=${month}&year=${year}`,
    });

    const normalizeTime = (t) => (t && !t.endsWith("Z") ? `${t}Z` : t);

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
        status: AVAILABILITY_SLOTS_STATUS.UNAVAILABLE,
        isBooked: true,
    }));

    const merged = [...normalizedFree, ...normalizedBooked];
    console.log("Normalized schedule (free + booked):", merged);
    return merged;
};

export const createAvailability = async (payload) => {
    const result = await callApi({
        method: METHOD.POST,
        endpoint: availabilityEndPoints.CREATE_AVAILABILITY,
        arg: payload,
    });
    return result.data;
};

export const updateAvailability = async (availabilityId, payload) => {
    const result = await callApi({
        method: METHOD.PUT,
        endpoint: `${availabilityEndPoints.UPDATE_AVAILABILITY}/${availabilityId}`,
        arg: payload,
    });
    return result;
};

export const deleteAvailability = async (availabilityId) => {
    const result = await callApi({
        method: METHOD.DELETE,
        endpoint: `${availabilityEndPoints.DELETE_AVAILABILITY}/${availabilityId}`,
    });
    return result;
};
