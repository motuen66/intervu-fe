import { BE_BASE_URL } from "../../../common/constants/env";

const INTERVIEW_TYPE_BASE_URL = `${BE_BASE_URL}/interviewType`;

export const interviewTypeEndPoints = {
    GET_ALL_TYPES: `${INTERVIEW_TYPE_BASE_URL}`,
    GET_TYPE_BY_ID: (id) => `${INTERVIEW_TYPE_BASE_URL}/${id}`,
    CREATE_TYPE: `${INTERVIEW_TYPE_BASE_URL}`,
    UPDATE_TYPE: (id) => `${INTERVIEW_TYPE_BASE_URL}/${id}`,
    DELETE_TYPE: (id) => `${INTERVIEW_TYPE_BASE_URL}/${id}`,
};
