import { BE_BASE_URL } from "../../../common/constants/env";

export const homeEndPoints = {
    GET_ALL_INTERVIEWERS: BE_BASE_URL + "/coach",
    GET_ALL_COMPANIES: BE_BASE_URL + "/companies",
    GET_ALL_SKILLS: BE_BASE_URL + "/skills",
    GET_ALL_INDUSTRIES: BE_BASE_URL + "/industries",
    FILTER_INTERVIEWERS: BE_BASE_URL + "/interviewers/filter",
    GET_INTERVIEWER_BY_ID: BE_BASE_URL + "/interviewers/",
};
