import { BE_BASE_URL } from "../../../common/constants/env";

const BASE = `${BE_BASE_URL}/interview-experiences`;

export const interviewExperienceEndPoints = {
    GET_LIST: BASE,
    GET_DETAIL: (id) => `${BASE}/${id}`,
    CREATE: BASE,
    UPDATE: (id) => `${BASE}/${id}`,
    DELETE: (id) => `${BASE}/${id}`,
    ADD_QUESTION: (experienceId) => `${BASE}/${experienceId}/questions`,
};
