import { BE_BASE_URL } from "../../../common/constants/env";

export const availabilityEndPoints = {
    GET_AVAILABILITIES: BE_BASE_URL + "/availabilities",
    CREATE_AVAILABILITY: BE_BASE_URL + "/availabilities",
    UPDATE_AVAILABILITY: BE_BASE_URL + "/availabilities",
    DELETE_AVAILABILITY: BE_BASE_URL + "/availabilities",
};

export const getAvailabilitiesByMonth = async (interviewerId, month, year) => {
    try {
        const response = await fetch(
            `${availabilityEndPoints.GET_AVAILABILITIES}/${interviewerId}?month=${month}&year=${year}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
        );
        const data = await response.json();
        console.log("API Response:", data);
        // Backend returns { success, message, data: [...] }
        if (data.success && data.data) {
            // Ensure ISO strings have Z suffix (UTC indicator)
            // This prevents JavaScript from interpreting them as local time
            const normalizedData = data.data.map(item => ({
                ...item,
                startTime: item.startTime && !item.startTime.endsWith('Z') 
                    ? item.startTime + 'Z' 
                    : item.startTime,
                endTime: item.endTime && !item.endTime.endsWith('Z') 
                    ? item.endTime + 'Z' 
                    : item.endTime,
            }));
            console.log("Normalized availabilities (with Z suffix):", normalizedData);
            return normalizedData;
        }
        return [];
    } catch (error) {
        console.error("Error fetching availabilities:", error);
        throw error;
    }
};

export const createAvailability = async (payload) => {
    try {
        const response = await fetch(availabilityEndPoints.CREATE_AVAILABILITY, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.message);
        return data.data;
    } catch (error) {
        console.error("Error creating availability:", error);
        throw error;
    }
};

export const updateAvailability = async (availabilityId, payload) => {
    try {
        const response = await fetch(
            `${availabilityEndPoints.UPDATE_AVAILABILITY}/${availabilityId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(payload),
            }
        );
        const data = await response.json();
        if (!data.success) throw new Error(data.message);
        return data;
    } catch (error) {
        console.error("Error updating availability:", error);
        throw error;
    }
};

export const deleteAvailability = async (availabilityId) => {
    try {
        const response = await fetch(
            `${availabilityEndPoints.DELETE_AVAILABILITY}/${availabilityId}`,
            {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
        );
        const data = await response.json();
        if (!data.success) throw new Error(data.message);
        return data;
    } catch (error) {
        console.error("Error deleting availability:", error);
        throw error;
    }
};
