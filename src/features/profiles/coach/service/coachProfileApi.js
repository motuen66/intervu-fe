import { BE_BASE_URL } from "../../../../common/constants/env";

export const interviewerProfileEndPoints = {
    VIEW_ALL_INTERVIEWER_PROFILES: BE_BASE_URL + "/interviewers?page={page}&pageSize={pageSize}",
    GET_ALL_SKILLS: BE_BASE_URL + "/Skills?page={page}&pageSize={pageSize}",
    GET_ALL_COMPANIES: BE_BASE_URL + "/Companies?page={page}&pageSize={pageSize}",
    VIEW_OWN_INTERVIEWER_PROFILE: BE_BASE_URL + `/coach-profile/{id}`,
    VIEW_PROFILE_BY_CANDIDATE: BE_BASE_URL + `/coach-profile/{slugProfileUrl}/profile`,
    // GET_DASHBOARD_STATS: BE_BASE_URL + `/coach-profile/stats`,
    GET_COACH_RATING: BE_BASE_URL + `/coach-profile/{id}/rating`,
    CREATE_INTERVIEWER_PROFILE: BE_BASE_URL + "/coach-profile",
    UPDATE_INTERVIEWER_PROFILE: BE_BASE_URL + `/coach-profile/{id}`,

    // Work experiences (create/update/delete)
    ADD_WORK_EXPERIENCE: BE_BASE_URL + `/coach-profile/{profileId}/work-experiences`,
    UPDATE_WORK_EXPERIENCE: BE_BASE_URL + `/coach-profile/{profileId}/work-experiences/{workExperienceId}`,
    DELETE_WORK_EXPERIENCE: BE_BASE_URL + `/coach-profile/{profileId}/work-experiences/{workExperienceId}`,

    // Certificates (create/update/delete)
    ADD_CERTIFICATE: BE_BASE_URL + `/coach-profile/{profileId}/certificates`,
    UPDATE_CERTIFICATE: BE_BASE_URL + `/coach-profile/{profileId}/certificates/{certificateId}`,
    DELETE_CERTIFICATE: BE_BASE_URL + `/coach-profile/{profileId}/certificates/{certificateId}`,

    BOOK_INTERVIEW: BE_BASE_URL + `/interview-booking`,
    GET_BOOKING_TRANSACTION: BE_BASE_URL + `/interview-booking/{orderCode}`,
    SAVE_QUESTION: BE_BASE_URL + `/interview-question`,
    GET_ALL_INDUSTRIES: BE_BASE_URL + "/Industries?page={page}&pageSize={pageSize}",
};
