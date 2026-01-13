import { BE_BASE_URL } from "../../common/constants/env";

export const firebaseEndPoints = {
    UPLOAD_AVATAR: BE_BASE_URL + "/userprofile/upload-avatar/{id}",
    GET_AVATAR: BE_BASE_URL + "/userprofile/get-avatar/{id}",
    DELETE_AVATAR: BE_BASE_URL + "/userprofile/delete-avatar/{id}",
};
