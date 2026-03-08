import axios from "axios";
import { BE_BASE_URL } from "../constants/env";
import { HTTP_RESPONSE_STATUS_CODE, METHOD } from "../constants/api";
import toast from "react-hot-toast";
import { setLoading } from "../store/authSlice";
import { store } from "../../main";

export const axiosInstance = axios.create({
    baseURL: BE_BASE_URL,
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

axiosInstance.interceptors.request.use(
    (config) => {
        const token = JSON.parse(localStorage.getItem("token"));
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return axiosInstance(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const response = await axios.post(
                    `${BE_BASE_URL}/account/refresh-token`,
                    {},
                    {
                        withCredentials: true,
                    },
                );

                if (response.data.success) {
                    const { accessToken } = response.data.data;

                    localStorage.setItem("token", JSON.stringify(accessToken));

                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                    processQueue(null, accessToken);

                    return axiosInstance(originalRequest);
                }
            } catch (refreshError) {
                processQueue(refreshError, null);
                handleLogout();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    },
);

const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    toast.error("Session expired. Please log in again.");
};

export const callApi = async ({
    method,
    endpoint,
    arg,
    headers,
    displaySuccessMessage = false,
    alertErrorMessage = false,
}) => {
    try {
        store.dispatch(setLoading(true));
        const isGetOrDelete = method === METHOD.GET || method === METHOD.DELETE;
        const response = await axiosInstance({
            method,
            url: endpoint,
            data: !isGetOrDelete ? arg : null,
            params: isGetOrDelete ? arg : null,
            headers: headers ?? {},
        });

        if (!response.data.success) {
            throw new Error(response.data.message);
        }
        if (displaySuccessMessage && response.data.message) {
            toast.success(response.data.message);
        }
        return {
            success: response.data?.success,
            data: response.data?.data,
            message: response.data?.message,
        };
    } catch (error) {
        if (error.status == HTTP_RESPONSE_STATUS_CODE.FORBIDDENT) {
            toast.error("You do not have permission to perform this action.");
            window.location.href = "/";
        } else if (alertErrorMessage) {
            toast.error(error.response?.data?.message || error.message || "An error occurred");
        } else {
            throw error;
        }
    } finally {
        store.dispatch(setLoading(false));
    }
};
