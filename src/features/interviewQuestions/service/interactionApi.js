import { BE_BASE_URL } from "../../../common/constants/env";

const QUESTIONS_BASE = `${BE_BASE_URL}/questions`;

export const interactionEndPoints = {
    LIKE_QUESTION: (questionId) => `${QUESTIONS_BASE}/${questionId}/like`,
    SAVE_QUESTION: (questionId) => `${QUESTIONS_BASE}/${questionId}/save`,
    REPORT_QUESTION: (questionId) => `${QUESTIONS_BASE}/${questionId}/report`,
    LIKE_COMMENT: (questionId, commentId) => `${QUESTIONS_BASE}/${questionId}/comments/${commentId}/like`,
    GET_SAVED_QUESTIONS: `${QUESTIONS_BASE}/saved`,
};
