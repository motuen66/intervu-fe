import { BE_BASE_URL } from "../../../common/constants/env";

const BASE = `${BE_BASE_URL}/questions`;

export const interviewQuestionEndPoints = {
    GET_LIST: BASE,
    SEARCH: `${BASE}/search`,
    GET_DETAIL: (questionId) => `${BASE}/${questionId}`,
    UPDATE_QUESTION: (questionId) => `${BASE}/${questionId}`,
    DELETE_QUESTION: (questionId) => `${BASE}/${questionId}`,
    // VOTE_QUESTION: (questionId, isUpvote) => `${BASE}/${questionId}/vote?isUpvote=${isUpvote}`,
};
