import { BE_BASE_URL } from "../constants/env";

export const userEndPoints = {
    GET_USER_PROFILE: (userId) => `${BE_BASE_URL}/userProfile/${userId}`,
    GET_ME: `${BE_BASE_URL}/users/me`,
};
