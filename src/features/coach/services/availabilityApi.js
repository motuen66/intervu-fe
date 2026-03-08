import { BE_BASE_URL } from "../../../common/constants/env";
import { callApi } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";

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
    console.log("API Response:", result);
    if (result.data) {
        // Ensure ISO strings have Z suffix (UTC indicator)
        // This prevents JavaScript from interpreting them as local time
        const normalizedData = result.data.map((item) => ({
            ...item,
            startTime: item.startTime && !item.startTime.endsWith("Z") ? item.startTime + "Z" : item.startTime,
            endTime: item.endTime && !item.endTime.endsWith("Z") ? item.endTime + "Z" : item.endTime,
        }));
        console.log("Normalized availabilities (with Z suffix):", normalizedData);
        return normalizedData;
    }
    return [];
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
