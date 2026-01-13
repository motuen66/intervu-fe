import { BE_BASE_URL } from "../../../../common/constants/env";

export const interviewerProfileEndPoints = {
    VIEW_ALL_INTERVIEWER_PROFILES: BE_BASE_URL + "/interviewers?page={page}&pageSize={pageSize}",
    GET_ALL_SKILLS: BE_BASE_URL + "/Skills?page={page}&pageSize={pageSize}",
    GET_ALL_COMPANIES: BE_BASE_URL + "/Companies?page={page}&pageSize={pageSize}",
    VIEW_OWN_INTERVIEWER_PROFILE: BE_BASE_URL + `/coach-profile/{id}`,
    VIEW_PROFILE_BY_CANDIDATE: BE_BASE_URL + `/coach-profile/{slugProfileUrl}/profile`,
    CREATE_INTERVIEWER_PROFILE: BE_BASE_URL + "/coach-profile",
    UPDATE_INTERVIEWER_PROFILE: BE_BASE_URL + `/coach-profile/{id}`,

    BOOK_INTERVIEW: BE_BASE_URL + `/interview-booking`,
    GET_BOOKING_TRANSACTION: BE_BASE_URL + `/interview-booking/{orderCode}`,
};
