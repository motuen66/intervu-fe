import { METHOD } from "../../common/constants/api";
import { callApi } from "../../common/utils/apiConnector";

/**
 * Upload general media file (JD, CV, etc.)
 * @param {File} file - The file object to upload
 * @param {string} [folder] - The folder path in storage
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
export const uploadMedia = async (file, folder = "general") => {
    const formData = new FormData();
    formData.append("file", file);

    const queryParams = new URLSearchParams({ folder }).toString();

    const response = await callApi({
        method: METHOD.POST,
        endpoint: `/UserProfile/upload?${queryParams}`,
        arg: formData,
    });

    if (response.success) {
        return response.data;
    } else {
        throw new Error(response.message || "Failed to upload file");
    }
};
