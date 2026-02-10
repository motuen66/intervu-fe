import { BE_BASE_URL } from "../../../common/constants/env";

const INTERVIEW_TYPE_BASE_URL = `${BE_BASE_URL}/interviewType`;

export const interviewTypeEndPoints = {
    GET_ALL_TYPES: `${INTERVIEW_TYPE_BASE_URL}`,
    GET_TYPE_BY_ID: (id) => `${INTERVIEW_TYPE_BASE_URL}/${id}`,
    CREATE_TYPE: `${INTERVIEW_TYPE_BASE_URL}`,
    UPDATE_TYPE: (id) => `${INTERVIEW_TYPE_BASE_URL}/${id}`,
    DELETE_TYPE: (id) => `${INTERVIEW_TYPE_BASE_URL}/${id}`,
};

export const getAllInterviewTypes = async () => {
    try {
        const response = await fetch(interviewTypeEndPoints.GET_ALL_TYPES, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        if (!response.ok) {
            const text = await response.text().catch(() => "");
            throw new Error(`Request failed: ${response.status} ${response.statusText} ${text}`);
        }

        const data = await response.json().catch((err) => {
            throw new Error("Invalid JSON response from interview types endpoint");
        });

        if (!data || data.success === false) {
            throw new Error(data?.message || "Interview types API returned an error");
        }

        return data.items;
    } catch (error) {
        console.error("Error fetching interview types:", error);
        throw error;
    }
};

export const getInterviewTypeById = async (id) => {
    try {
        const response = await fetch(interviewTypeEndPoints.GET_TYPE_BY_ID(id), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        if (!response.ok) {
            const text = await response.text().catch(() => "");
            throw new Error(`Request failed: ${response.status} ${response.statusText} ${text}`);
        }

        const data = await response.json().catch((err) => {
            throw new Error("Invalid JSON response from interview types endpoint");
        });

        if (!data || data.success === false) {
            throw new Error(data?.message || "Interview types API returned an error");
        }

        return data;
    } catch (error) {
        console.error("Error fetching interview types:", error);
        throw error;
    }
};

export const createInterviewType = async (payload) => {
    try {
        const response = await fetch(interviewTypeEndPoints.CREATE_TYPE, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const text = await response.text().catch(() => "");
            throw new Error(`Request failed: ${response.status} ${response.statusText} ${text}`);
        }

        const data = await response.json().catch((err) => {
            throw new Error("Invalid JSON response from interview types endpoint");
        });

        if (!data || data.success === false) {
            throw new Error(data?.message || "Interview types API returned an error");
        }

        return data;
    } catch (error) {
        console.error("Error creating interview types:", error);
        throw error;
    }
};

export const updateInterviewType = async (id, payload) => {
    try {
        const response = await fetch(interviewTypeEndPoints.UPDATE_TYPE(id), {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const text = await response.text().catch(() => "");
            throw new Error(`Request failed: ${response.status} ${response.statusText} ${text}`);
        }

        const data = await response.json().catch((err) => {
            throw new Error("Invalid JSON response from interview types endpoint");
        });

        if (!data || data.success === false) {
            throw new Error(data?.message || "Interview types API returned an error");
        }

        return data;
    } catch (error) {
        console.error("Error updating interview type:", error);
        throw error;
    }
};

export const deleteInterviewType = async (id) => {
    try {
        const response = await fetch(`${interviewTypeEndPoints.DELETE_TYPE.replace('${id}', id)}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        if (!response.ok) {
            const text = await response.text().catch(() => "");
            throw new Error(`Request failed: ${response.status} ${response.statusText} ${text}`);
        }
        const data = await response.json().catch((err) => {
            throw new Error("Invalid JSON response from interview types endpoint");
        });
        if (!data || data.success === false) {
            throw new Error(data?.message || "Interview types API returned an error");
        }
        return data;
    } catch (error) {
        console.error("Error deleting interview type:", error);
        throw error;
    }
};