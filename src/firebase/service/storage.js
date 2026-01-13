import { METHOD } from "../../common/constants/api";
import { callApi } from "../../common/utils/apiConnector";
import { firebaseEndPoints } from "../service/firebaseApi";

export const uploadImage = async (userId, file) => {
    if (!userId) throw new Error("userId is required");
    if (!file) throw new Error("file is required");

    const formData = new FormData();
    formData.append("profilePicture", file);

    const endpoint = firebaseEndPoints.UPLOAD_AVATAR.replace("{id}", userId);

    const response = await callApi({
        method: METHOD.POST,
        endpoint,
        arg: formData,
    });

    if (!response?.success) {
        throw new Error(response?.message || "Upload failed");
    }
    return response.data;
};

export const getImages = async (userId) => {
    const endpoint = firebaseEndPoints.GET_AVATAR.replace("{id}", userId);
    return await callApi({ method: METHOD.GET, endpoint });
};

export const deleteImage = async (userId) => {
    const endpoint = firebaseEndPoints.DELETE_AVATAR.replace("{id}", userId);
    return await callApi({ method: METHOD.DELETE, endpoint });
};
