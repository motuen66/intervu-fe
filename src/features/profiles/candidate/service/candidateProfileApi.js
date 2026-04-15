import { BE_BASE_URL } from "../../../../common/constants/env";

export const candidateProfileEndPoints = {
    VIEW_OWN_CANDIDATE_PROFILE: BE_BASE_URL + "/candidate-profile/{id}",
    VIEW_PROFILE_BY_SLUG: BE_BASE_URL + "/candidate-profile/{slugProfileUrl}/profile",
    UPDATE_CANDIDATE_PROFILE: BE_BASE_URL + "/candidate-profile/{id}",

    UPDATE_CANDIDATE_WORK_EXPERIENCES: BE_BASE_URL + "/candidate-profile/{id}/work-experiences",
    CREATE_CANDIDATE_WORK_EXPERIENCE: BE_BASE_URL + "/candidate-profile/{profileId}/work-experiences",
    UPDATE_CANDIDATE_WORK_EXPERIENCE:
        BE_BASE_URL + "/candidate-profile/{profileId}/work-experiences/{workExperienceId}",
    DELETE_CANDIDATE_WORK_EXPERIENCE:
        BE_BASE_URL + "/candidate-profile/{profileId}/work-experiences/{workExperienceId}",

    CREATE_CANDIDATE_CERTIFICATE: BE_BASE_URL + "/candidate-profile/{profileId}/certificates",
    UPDATE_CANDIDATE_CERTIFICATE: BE_BASE_URL + "/candidate-profile/{profileId}/certificates/{certificateId}",
    DELETE_CANDIDATE_CERTIFICATE: BE_BASE_URL + "/candidate-profile/{profileId}/certificates/{certificateId}",

    UPDATE_CANDIDATE_STATUS: BE_BASE_URL + "/candidate-profile/{id}/status",
    DELETE_CANDIDATE_PROFILE: BE_BASE_URL + "/candidate-profile/{id}",
    GET_ALL_SKILLS: BE_BASE_URL + "/Skills?page={page}&pageSize={pageSize}",
    GET_ALL_INDUSTRIES: BE_BASE_URL + "/Industries?page={page}&pageSize={pageSize}",
    EVALUATE_CV: BE_BASE_URL + "/candidate-profile/evaluate-cv",
};
