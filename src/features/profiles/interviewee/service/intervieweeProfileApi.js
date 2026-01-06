import { BE_BASE_URL } from "../../../../common/constants/env";

export const intervieweeProfileEndPoints = {
    VIEW_OWN_INTERVIEWEE_PROFILE: BE_BASE_URL + "/interviewee-profile/{id}",
    VIEW_PROFILE_BY_SLUG: BE_BASE_URL + "/interviewee-profile/{slugProfileUrl}/profile",
    UPDATE_INTERVIEWEE_PROFILE: BE_BASE_URL + "/interviewee-profile/{id}",
    UPDATE_INTERVIEWEE_STATUS: BE_BASE_URL + "/interviewee-profile/{id}/status",
    DELETE_INTERVIEWEE_PROFILE: BE_BASE_URL + "/interviewee-profile/{id}",
    GET_ALL_SKILLS: BE_BASE_URL + "/Skills?page={page}&pageSize={pageSize}",
};
