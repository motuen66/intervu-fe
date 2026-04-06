import { BE_BASE_URL } from "../../../common/constants/env";

export const profileEndPoints = {
    GET_PROFILE: (userId) => `${BE_BASE_URL}/userprofile/${userId}`,
    UPDATE_PROFILE: (userId) => `${BE_BASE_URL}/userprofile/${userId}`,
    UPDATE_PASSWORD: (userId) => `${BE_BASE_URL}/userprofile/${userId}/password`,
    UPDATE_AVATAR: (userId) => `${BE_BASE_URL}/userprofile/${userId}/profile-picture`,
    UPLOAD_CV: (userId) => `${BE_BASE_URL}/userprofile/upload-cv/${userId}`,
    GET_MY_REPORTS: `${BE_BASE_URL}/InterviewRoom/my-reports`,
};
