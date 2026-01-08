import { BE_BASE_URL } from "../../../../common/constants/env";

export const candidateProfileEndPoints = {
    VIEW_OWN_CANDIDATE_PROFILE: BE_BASE_URL + "/candidate-profile/{id}",
    VIEW_PROFILE_BY_SLUG: BE_BASE_URL + "/candidate-profile/{slugProfileUrl}/profile",
    UPDATE_CANDIDATE_PROFILE: BE_BASE_URL + "/candidate-profile/{id}",
    UPDATE_CANDIDATE_STATUS: BE_BASE_URL + "/candidate-profile/{id}/status",
    DELETE_CANDIDATE_PROFILE: BE_BASE_URL + "/candidate-profile/{id}",
    GET_ALL_SKILLS: BE_BASE_URL + "/Skills?page={page}&pageSize={pageSize}",
};
